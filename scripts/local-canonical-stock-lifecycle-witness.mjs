import path from "node:path";
import { digest, comparePreparedDependencyInputs, observePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { inspectClassifiedEvidence } from "./local-canonical-receipt.mjs";
import { BROWSER_IDENTITY_PREFIX, parseBrowserUseLine, validBrowserUse } from "./local-canonical-browser-identity.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT, projectExperienceElapsed } from "./project-experience-serial-budget.mjs";
import { validProjectExperienceConnection } from "./project-experience-connection.mjs";
import { pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { REGISTERED_INTEGRATION_BUDGET, fixtureBudgetEnvironment } from "./local-canonical-fixture-budget-witness.mjs";

export const GENERATED_STOCK_REPAIR = "generated-stock-lifecycle-repair-v1";
export const GENERATED_STOCK_CLAIM = "Correct stock inspection of owned generated Next declarations. Retain the historical Browser failure and false stock.";
export const GENERATED_STOCK_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for the generated stock lifecycle correction.";
export const GENERATED_STOCK_PHASE = "e2e-project-experience";
export const STOCK_LIFECYCLE_BROWSER_COMMAND = "node --import tsx scripts/browser-validate-web-planning.mjs";
const attemptOwner = "scripts/local-canonical-attempts.mjs";
const generatedOwner = "scripts/local-canonical-fixture-budget-witness.mjs";
const suiteOwner = "scripts/run-canonical-test-suite.mjs";
const executorOwner = "scripts/run-local-canonical-verification.mjs";
const equal = (left, right) => left !== undefined && right !== undefined && digest(left) === digest(right);
const fail = () => { throw Object.assign(new Error("revision_generated_stock_evidence_invalid"), { code: "revision_generated_stock_evidence_invalid" }); };
const finite = n => Number.isFinite(n) && n >= 0;
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const sha1 = value => /^[a-f0-9]{40}$/u.test(value ?? "");
const time = value => Date.parse(value);
const gitFile = (git, head, file) => git(["show", head + ":" + file]);
const logLines = buffer => buffer.toString("utf8").split(/\r?\n/u);
const records = (lines, key) => lines.filter(line => line.startsWith('{"' + key + '":')).map(line => JSON.parse(line)[key]);
const natural = result => result?.exit_code === 0 && result.signal === null && result.timed_out === false &&
  result.cancelled === false && result.exit_observed === true && result.streams_closed === true &&
  result.cleanup_completed === true && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit";
const settled = cleanup => cleanup?.completed === true && cleanup.failure_count === 0 && equal(cleanup.failures, []);

export function verifyGeneratedStockSerialPrefix(original, stock, incident, { bytes, git }) {
  const phase = original.phases.find(phase => phase.id === GENERATED_STOCK_PHASE);
  const prior = original.attempt.source_correction;
  const log = bytes(incident.log, 2 * 1024 * 1024);
  if (prior?.commission?.evidence_kind !== REGISTERED_INTEGRATION_BUDGET || prior.commission.maximum_invocations !== 1 ||
      incident.receipt !== original.integrity.content_fingerprint || incident.cause !== "UNKNOWN" ||
      incident.log_identity?.relative_path !== `.augnes-local-verification/logs/${original.run.id}/${GENERATED_STOCK_PHASE}.log` ||
      phase?.log?.relative_path !== incident.log_identity.relative_path || phase.log.bytes !== log.length ||
      phase.log.truncated !== false || incident.log_identity.bytes !== log.length || incident.log_identity.sha256 !== digest(log) ||
      phase.exit_status !== 1 || !validProjectExperienceConnection(
        gitFile(git, original.repository.head_sha, suiteOwner).toString(),
        gitFile(git, original.repository.head_sha, executorOwner).toString())) fail();

  const budget = phase.serial_budget, children = PROJECT_EXPERIENCE_SERIAL.children;
  if (budget?.contract !== PROJECT_EXPERIENCE_SERIAL.contract || budget.commitment !== PROJECT_EXPERIENCE_COMMITMENT ||
      budget.completed_children !== 3 || budget.complete !== false || budget.failure_code !== "serial_execution_incomplete" ||
      budget.parent_forced_terminal_cleanup_ms !== null || !finite(budget.parent_post_exit_settlement_ms) ||
      !finite(budget.coordinator_ms) || budget.coordinator_ms > PROJECT_EXPERIENCE_SERIAL.coordinatorMs ||
      !Array.isArray(budget.execution_ms) || budget.execution_ms.length !== children.length ||
      budget.execution_ms.some((n, i) => !finite(n) || (i < 3 ? n <= 0 || n > children[i].timeoutMs : n !== 0)) ||
      !Array.isArray(budget.natural_settlement_ms) || budget.natural_settlement_ms.length !== children.length ||
      budget.natural_settlement_ms.some((n, i) => !finite(n) || n > PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs || i >= 3 && n !== 0) ||
      budget.envelope_elapsed_ms !== projectExperienceElapsed(budget) ||
      Math.ceil(budget.envelope_elapsed_ms + budget.parent_post_exit_settlement_ms) > phase.duration_ms) fail();

  const lines = logLines(log), prefix = "[canonical:" + GENERATED_STOCK_PHASE + "] ";
  const starts = lines.filter(line => line.startsWith(prefix + "child_start "));
  const results = lines.filter(line => line.startsWith(prefix + "child_result "));
  if (starts.length !== 3 || results.length !== 3 ||
      lines.filter(line => line === "Error: cdp_timeout:Input.dispatchTouchEvent").length !== 1) fail();
  let last = -1;
  for (let index = 0; index < 3; index++) {
    const child = children[index], label = JSON.stringify(child.label), exit = index === 2 ? 1 : 0;
    const start = starts[index], result = results[index];
    const duration = Number(result.match(/ duration_ms=([1-9]\d*) /u)?.[1]);
    const first = lines.indexOf(start), end = lines.indexOf(result);
    if (start !== `${prefix}child_start label=${label} timeout_ms=${child.timeoutMs}` ||
        result !== `${prefix}child_result label=${label} duration_ms=${duration} exit_code=${exit} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit` ||
        !(duration > 0 && duration <= child.timeoutMs && last < first && first < end) ||
        (index === 2 && !lines.slice(first, end).includes("Error: cdp_timeout:Input.dispatchTouchEvent"))) fail();
    last = end;
  }

  const uses = lines.filter(line => line.startsWith(BROWSER_IDENTITY_PREFIX)).map(parseBrowserUseLine);
  const browser = original.inputs.resources.find(entry => entry.id === "browser-executable");
  if (!browser || !equal(uses, phase.browser_use) ||
      !equal(uses.map(v => v?.consumer), ["project-experience", "project-client", "project-client", "web-planning"]) ||
      uses.some(value => !validBrowserUse(value, browser))) fail();
  const strict = [];
  inspectClassifiedEvidence(original, strict);
  if (!equal(strict.sort(), ["receipt_browser_identity_invalid:e2e-project-experience",
    "receipt_classified_outcome_not_passing", "receipt_phase_environment_binding_invalid"].sort()) ||
      !stock.issues.includes("receipt_attempt_records_unverified")) fail();
}

function functionBytes(file, name) {
  const start = file.search(new RegExp("\\n(?:export )?function " + name + "\\(", "u"));
  if (start < 0) fail();
  const end = file.indexOf("\n}", start);
  if (end < 0) fail();
  return file.slice(start, end + 2);
}

// The final reader keeps the causal overlay's behavior and adds two refusals:
// receipt tampering before using a writer window, and changed Web dependencies.
function verifyFinalReader(owner, candidate, corrected) {
  if (owner === generatedOwner) {
    const expected = corrected.replace(
      '    const ownedWriter = current.kind === "build" ? phase.id === "build" : phase.browser === true;',
      '    // The project-experience phase owns the root Next dev startup. Other\n' +
      "    // Browser phases do not extend this declaration's accepted writer window.\n" +
      '    const ownedWriter = current.kind === "build" ? phase.id === "build" : phase.id === "e2e-project-experience" && phase.browser === true;',
    );
    if (candidate !== expected) fail();
    return;
  }
  const expectedEntry = functionBytes(corrected, "inspectAttemptRecords").replace("  try {",
    "  if (usesGeneratedStockWitness(options.receipt?.attempt?.source_correction) && !verifyReceiptIntegrity(options.receipt)) return false;\n  try {");
  const checked = "    if (evidence.integrationBudget) inspectCurrentIntegrationBudgetInputs(repositoryRoot, evidence.integrationBudget, stockReceipt);";
  const expectedCorrection = functionBytes(corrected, "prepareSourceCorrection").replace(checked,
    checked + "\n    if (evidence.generatedStockBrowser) inspectGeneratedStockBrowserInputs(repositoryRoot, evidence.generatedStockBrowser);");
  if (functionBytes(candidate, "inspectAttemptRecords") !== expectedEntry ||
      functionBytes(candidate, "prepareSourceCorrection") !== expectedCorrection ||
      functionBytes(candidate, "prepareAttemptInspection") !== functionBytes(corrected, "prepareAttemptInspection")) fail();
}

function verifyCausalReader(p, prior, focused, original, stock, { bytes, parse, git, completedAt }) {
  const proof = focused.regression.causal, corrected = proof.reader_head;
  if (!sha1(corrected) || corrected === prior.head || corrected === p.head) fail();
  for (const [a, b] of [[prior.head, corrected], [corrected, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  if (!equal(git(["diff", "--name-only", "-z", prior.head, corrected, "--"]).toString().split("\0").filter(Boolean).sort(),
      [attemptOwner, generatedOwner].sort())) fail();
  for (const [key, owner] of [["attempts", attemptOwner], ["witness", generatedOwner]]) {
    const correctedBytes = gitFile(git, corrected, owner);
    if (!correctedBytes.equals(bytes(proof[key])) || correctedBytes.equals(gitFile(git, prior.head, owner))) fail();
    verifyFinalReader(owner, gitFile(git, p.head, owner).toString(), correctedBytes.toString());
  }

  const before = parse(proof.before), after = parse(proof.after), replay = parse(proof.stock_replay);
  const priorProof = prior.source_correction;
  for (const [observation, recordsVerified] of [[before, false], [after, true]]) {
    if (observation.head !== prior.head || observation.receipt !== p.prior_receipt_fingerprint ||
        observation.runtime !== p.inputs.identity_sha256 || observation.inventory !== priorProof.inputs.inventory_sha256 ||
        observation.authObserved !== true || observation.stock_attempt_records_verified !== recordsVerified ||
        !equal(observation.guard, { accepted: false, code: "revision_fixture_budget_invalid" }) ||
        observation.tip?.family_id !== prior.family_id || observation.tip?.attempt_id !== prior.attempt_id ||
        observation.tip.reviewed_revision_consumed !== priorProof.commission.maximum_invocations ||
        !equal(observation.settle?.service?.state, original.cleanup.companion_service.after) ||
        !(time(completedAt) < time(observation.checked_at))) fail();
  }
  if (!equal(before.tip, after.tip) || !equal(before.generated, after.generated) ||
      !Array.isArray(after.generated) || after.generated.length !== 1 ||
      after.generated[0].path !== "next-env.d.ts" || !sha(after.generated[0].sha256) ||
      !equal(replay, { ...stock, issues: stock.issues.filter(issue => issue !== "receipt_attempt_records_unverified") }) ||
      !(time(before.checked_at) < time(after.checked_at))) fail();
  return after;
}

function verifyHistoryTouch(log, capture) {
  const lines = logLines(log), commands = records(lines, "web_planning_touch_command");
  const context = records(lines, "web_planning_history_touch");
  const [ready, result] = context;
  if (context.length !== 2 || ready.stage !== "ready" || ready.hit !== true || result.stage !== "settled" ||
      result.same_document !== true || result.adaptation_observed !== true ||
      !/^[0-9A-Fa-f]{32}$/u.test(ready.target_id) ||
      context.some(value => value.target_id !== ready.target_id || value.width !== 390 || value.height !== 844 ||
        value.visible !== true || value.same_origin !== true || value.touch_points !== 1) ||
      !equal(commands.map(v => [v.subtype, v.stage]), [
        ["touchStart", "sent"], ["touchStart", "acknowledged"], ["touchEnd", "sent"], ["touchEnd", "acknowledged"],
      ]) || commands[0].id !== commands[1].id || commands[2].id !== commands[3].id || commands[0].id >= commands[2].id ||
      commands.some(v => v.target_id !== ready.target_id || v.method !== "Input.dispatchTouchEvent" ||
        !Number.isSafeInteger(v.id) || v.id <= 0 || !finite(v.elapsed_ms) || v.elapsed_ms > 15000 ||
        (v.stage === "sent" && (!Array.isArray(v.caller) || v.caller.length > 6 ||
          !v.caller.some(line => line.includes("/browser-web-planning-history.mjs:")))))) fail();
  const uses = lines.filter(line => line.startsWith(BROWSER_IDENTITY_PREFIX)).map(parseBrowserUseLine);
  const browser = capture.after.target.inputInventory.resources.find(entry => entry.id === "browser-executable");
  if (uses.length !== 1 || !browser || uses[0]?.consumer !== "web-planning" || !validBrowserUse(uses[0], browser) ||
      lines.filter(line => line === "web_planning_browser_cleanup_complete").length !== 1) fail();
}

function verifyFocusedBrowser(p, focused, afterCausal, { parse, bytes, git }) {
  const capture = parse(focused.regression.after), { before, after, environment } = capture;
  const resourceRoot = environment?.AUGNES_CANONICAL_TEMP_ROOT;
  if (capture.contract !== "augnes.generated-stock-browser-control.v1" || capture.basis !== "actual-owned-development-invocation" ||
      capture.command !== STOCK_LIFECYCLE_BROWSER_COMMAND || capture.tested_source_head !== p.head || capture.tree !== p.tree ||
      capture.truncated !== false || capture.capture_error !== undefined || !natural(capture.result) ||
      !finite(capture.result.duration_ms) || capture.result.duration_ms > PROJECT_EXPERIENCE_SERIAL.children[2].timeoutMs ||
      !settled(capture.cleanup) || capture.ownership?.checkout?.released !== true || capture.ownership?.capacity?.released !== true ||
      !path.isAbsolute(resourceRoot ?? "") || !equal(before?.source, after?.source) || !equal(before?.loader, after?.loader) ||
      !equal(before?.runtime, after?.runtime) || digest(after.runtime) !== p.inputs.identity_sha256 ||
      comparePreparedDependencyInputs(before.dependencies, after.dependencies) !== "unchanged" ||
      preparedDependencyIdentity(after.dependencies).phase_id !== "dependencies-root" ||
      comparePreparedDependencyInputs(before.web_dependencies, after.web_dependencies) !== "unchanged" ||
      preparedDependencyIdentity(after.web_dependencies).phase_id !== "dependencies-web-planning" ||
      ![before, after].every(value => gitRevisionInventory(value.target.inputInventory) === value.target.inventory &&
        value.target.inventory === p.inputs.inventory_sha256 && value.target.service.state.preservation_valid === true &&
        value.target.service.diagnostics.coherent === true) ||
      !equal(before.target.service.state, after.target.service.state) ||
      !(time(afterCausal.checked_at) < time(capture.started_at) && time(capture.started_at) < time(capture.finished_at) &&
        time(capture.finished_at) <= time(focused.finished_at))) fail();
  const { root_generated, ...source } = after.source;
  if (!equal(source, pureContractGitSource(git, p.head).summary) || !Array.isArray(root_generated) || root_generated.length > 1 ||
      root_generated.some(file => file.path !== "next-env.d.ts" || !sha(file.sha256))) fail();
  const expected = fixtureBudgetEnvironment(resourceRoot, environment);
  delete expected.NODE_ENV;
  Object.assign(expected, { npm_config_cache: path.join(resourceRoot, "npm-cache"), npm_config_devdir: path.join(resourceRoot, "node-gyp") });
  if (!equal(environment, expected) || environment.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT !== digest(after.runtime.headers.observation) ||
      !focused.commands.some(command => command.command === capture.command && command.tested_source_head === p.head &&
        equal(command.record, focused.regression.after) && equal(command.stdout, capture.stdout))) fail();
  const child = PROJECT_EXPERIENCE_SERIAL.children[2], label = JSON.stringify(child.label);
  const prefix = "[canonical:focused-d1-history-touch] ";
  const lines = logLines(bytes(capture.lifecycle, 64 * 1024));
  if (!equal(lines.filter(line => line.startsWith(prefix + "child_start ")),
      [`${prefix}child_start label=${label} timeout_ms=${child.timeoutMs}`]) ||
      !equal(lines.filter(line => line.startsWith(prefix + "child_result ")),
      [`${prefix}child_result label=${label} duration_ms=${capture.result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`])) fail();
  verifyHistoryTouch(bytes(capture.stdout, 2 * 1024 * 1024), capture);
}

export function inspectGeneratedStockBrowserInputs(root, expected) {
  if (comparePreparedDependencyInputs(expected, observePreparedDependencyInputs({
    repositoryRoot: root, phaseId: "dependencies-web-planning",
  })) !== "unchanged") fail();
}

export function verifyGeneratedStockRepair(p, prior, focused, options) {
  const { original, stock, completion } = options;
  const { kind, claim, accepted_baseline: baseline, incident } = focused.regression;
  if (kind !== GENERATED_STOCK_REPAIR || p.commission.evidence_kind !== kind || claim !== GENERATED_STOCK_CLAIM ||
      focused.failed_phase !== GENERATED_STOCK_PHASE || !equal(focused.input_remedy_resources, []) ||
      ![attemptOwner, generatedOwner, "scripts/web-planning-cdp.mjs"].every(file => focused.implicated_paths.includes(file)) ||
      baseline?.head !== prior.head || baseline.tree !== prior.tree || baseline.base !== original.repository.base_sha ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || completion.infrastructure_code !== null) fail();
  verifyGeneratedStockSerialPrefix(original, stock, incident, options);
  const afterCausal = verifyCausalReader(p, prior, focused, original, stock, options);
  verifyFocusedBrowser(p, focused, afterCausal, options);
  return p.head;
}
