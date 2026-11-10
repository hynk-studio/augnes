import path from "node:path";
import { createRequire } from "node:module";
import { fixtureBudgetEnvironment } from "./local-canonical-fixture-budget-witness.mjs";
import { BROWSER_IDENTITY_PREFIX, parseBrowserUseLine, validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { digest, comparePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { GENERATED_STOCK_REPAIR } from "./local-canonical-stock-lifecycle-witness.mjs";

export const PREPARED_ELIGIBILITY_REPAIR = "prepared-dependency-eligibility-repair-v1";
export const PREPARED_ELIGIBILITY_CLAIM = "Check accepted focused prerequisites against registered dependency preparation before consumers. Preserve historical Browser failures, false stock and UNKNOWN causes.";
export const PREPARED_ELIGIBILITY_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for the prepared dependency eligibility correction.";
export const PREPARED_ELIGIBILITY_PHASE = "e2e-operator-work-expectation";
export const PREPARED_BROWSER_COMMAND = "node --import tsx scripts/browser-validate-operator-work-expectation-v1.mjs";
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const fail = () => { throw Object.assign(new Error("revision_prepared_eligibility_evidence_invalid"), { code: "revision_prepared_eligibility_evidence_invalid" }); };
const natural = r => r?.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false &&
  r.exit_observed === true && r.streams_closed === true && r.cleanup_completed === true && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";
const settled = v => v?.completed === true && v.failure_count === 0 && equal(v.failures, []);

// Read the actual finite registration without evaluating historical source.
// The complete source catalogue is bound separately; this verifies that the
// focused child still has the same command, natural-exit rule and deadline.
function registeredBrowser(git, head) {
  const ts = createRequire(import.meta.url)("typescript");
  const source = git(["show", `${head}:scripts/run-canonical-test-suite.mjs`]).toString();
  const tree = ts.createSourceFile("suite.mjs", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (tree.parseDiagnostics.length) fail();
  const found = [];
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === "operatorWorkExpectationStep") found.push(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  if (found.length !== 1 || !ts.isObjectLiteralExpression(found[0])) fail();
  const properties = found[0].properties;
  const expected = [
    ['id', '"operator-work-expectation"'], ['group', '"operator-execution"'],
    ['requirements', 'operatorExecutionRequirements'], ['label', '"independent operator work-expectation Browser child"'],
    [null, 'rootNode("scripts/browser-validate-operator-work-expectation-v1.mjs")'],
    ['timeoutMs', '360_000'], ['requireNaturalExit', 'true'],
  ];
  if (properties.length !== expected.length || properties.some((node, i) => {
    const [name, value] = expected[i];
    return name === null ? !ts.isSpreadAssignment(node) || node.expression.getText(tree) !== value :
      !ts.isPropertyAssignment(node) || node.name.getText(tree) !== name || node.initializer.getText(tree) !== value;
  })) fail();
  const bindings = [];
  const binding = node => {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && node.name.text === PREPARED_ELIGIBILITY_PHASE) bindings.push(node.initializer.getText(tree));
    ts.forEachChild(node, binding);
  };
  binding(tree);
  if (!equal(bindings, ["[{ ...operatorWorkExpectationStep }]"])) fail();
}

// A narrow prospective interpretation, not a repair of historical stock. The
// exact two extra issues are accounted here and nowhere in ordinary stock.
export function verifyPreparedEligibilityPredecessor(p, prior, focused, { original, stock, parse, validateFailure }) {
  const reg = focused.regression, incident = reg.incident;
  const previousFocused = parse(incident.original_focused), previousBrowser = parse(incident.original_browser);
  if (prior.source_correction?.commission.evidence_kind !== GENERATED_STOCK_REPAIR ||
      prior.source_correction.commission.maximum_invocations !== 1 ||
      incident.original_focused.sha256 !== prior.source_correction.focused.sha256 ||
      incident.original_browser.sha256 !== previousFocused.regression.after.sha256 ||
      incident.receipt !== p.prior_receipt_fingerprint || incident.cause !== "UNKNOWN" ||
      original.phases.find(phase => phase.status === "failure")?.id !== PREPARED_ELIGIBILITY_PHASE ||
      stock.content_fingerprint !== p.prior_receipt_fingerprint || stock.valid_deciding_evidence !== false ||
      stock.dimensions.current_merge_applicability !== "blocked" ||
      !["receipt_attempt_records_unverified", "receipt_stale_integration_base"].every(issue => stock.issues.filter(v => v === issue).length === 1)) fail();
  for (const [phase, field] of [["dependencies-root", "dependencies"], ["dependencies-web-planning", "web_dependencies"]]) {
    const retained = original.inputs.prepared_dependencies.find(value => value.phase_id === phase), expected = previousBrowser.after[field];
    preparedDependencyIdentity(expected);
    if (retained?.unchanged !== true || retained.error !== null ||
        comparePreparedDependencyInputs(retained.before, retained.after) !== "unchanged" ||
        comparePreparedDependencyInputs(expected, retained.before) === "unchanged" ||
        expected.location_fingerprint !== retained.before.location_fingerprint || !equal(expected.sources, retained.before.sources)) fail();
  }
  // Only a comparison view enters the ordinary strict failure verifier. No
  // stored observation, issue, applicability or fingerprint is rewritten.
  validateFailure({ ...stock, issues: stock.issues.filter(issue => !["receipt_attempt_records_unverified", "receipt_stale_integration_base"].includes(issue)),
    dimensions: { ...stock.dimensions, current_merge_applicability: "matches_observed_context" } });
}

export function verifyPreparedEligibilityRepair(p, prior, focused, { git, parse, bytes, completedAt, original, completion }) {
  const reg = focused.regression, baseline = reg.accepted_baseline;
  if (!equal(Object.keys(reg).sort(), ["accepted_baseline", "after", "claim", "controls", "incident", "kind"])) fail();
  if (reg.kind !== PREPARED_ELIGIBILITY_REPAIR || p.commission.evidence_kind !== reg.kind || reg.claim !== PREPARED_ELIGIBILITY_CLAIM ||
      focused.failed_phase !== PREPARED_ELIGIBILITY_PHASE || !equal(focused.input_remedy_resources, []) ||
      !["scripts/local-canonical-inputs.mjs", "scripts/local-canonical-attempts.mjs", "scripts/run-local-canonical-verification.mjs"].every(file => focused.implicated_paths.includes(file)) ||
      baseline?.head !== prior.head || baseline.tree !== prior.tree || baseline.base !== original.repository.base_sha ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || completion.infrastructure_code !== null) fail();
  const capture = parse(reg.after), control = parse(reg.controls);
  registeredBrowser(git, p.head);
  const source = pureContractGitSource(git, p.head).summary;
  const tempRoot = capture.environment?.AUGNES_CANONICAL_TEMP_ROOT;
  if (!path.isAbsolute(tempRoot ?? "")) fail();
  const expectedEnvironment = fixtureBudgetEnvironment(tempRoot, capture.environment);
  delete expectedEnvironment.NODE_ENV;
  Object.assign(expectedEnvironment, { npm_config_cache: path.join(tempRoot, "npm-cache"), npm_config_devdir: path.join(tempRoot, "node-gyp") });
  if (!equal(capture.environment, expectedEnvironment) || capture.environment.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT !== digest(capture.after.runtime.headers.observation) ||
      ![capture.before, capture.after].every(value => gitRevisionInventory(value.target.inputInventory) === p.inputs.inventory_sha256 &&
        value.target.service.state.preservation_valid === true && value.target.service.diagnostics.coherent === true) ||
      !equal(capture.before.target.service.state, capture.after.target.service.state) ||
      !Number.isFinite(capture.result.duration_ms) || capture.result.duration_ms <= 0 || capture.result.duration_ms > 360000 ||
      !equal(capture.preparations.map(value => value.phase), ["dependencies-root", "dependencies-nested", "dependencies-web-planning"])) fail();
  const lifecycle = bytes(capture.lifecycle, 64 * 1024).toString().trim().split("\n");
  const prefix = "[canonical:focused-b1-control-diagnosis] ", label = JSON.stringify("independent operator work-expectation Browser child");
  if (!equal(lifecycle.filter(line => line.startsWith(prefix + "child_start ")), [`${prefix}child_start label=${label} timeout_ms=360000`]) ||
      !equal(lifecycle.filter(line => line.startsWith(prefix + "child_result ")), [`${prefix}child_result label=${label} duration_ms=${capture.result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`])) fail();
  for (const { phase, result } of capture.preparations) {
    if (result.id !== phase || result.command !== "npm ci --no-audit --no-fund" || result.status !== "pass" || result.exit_status !== 0 ||
        result.environment_fingerprint !== digest(capture.environment) || result.timed_out !== false || result.failure_code !== null ||
        result.cleanup.completed !== true || result.cleanup.exit_observed !== true || result.cleanup.streams_closed !== true ||
        result.cleanup.remaining_owned_processes !== 0 || result.cleanup.termination_reason !== "natural_exit" ||
        !(Date.parse(result.started_at) < Date.parse(result.finished_at) && Date.parse(result.finished_at) <= Date.parse(capture.started_at))) fail();
  }
  const { root_generated, ...observedSource } = capture.before.source;
  if (!equal(source, observedSource) || !equal(capture.before.source, capture.after.source) ||
      !equal(capture.before.loader, capture.after.loader) || !equal(capture.before.runtime, capture.after.runtime) ||
      digest(capture.after.runtime) !== p.inputs.identity_sha256 ||
      capture.before.target.inventory !== p.inputs.inventory_sha256 || capture.after.target.inventory !== p.inputs.inventory_sha256 ||
      gitRevisionInventory(capture.before.target.inputInventory) !== p.inputs.inventory_sha256 ||
      capture.tested_source_head !== p.head || capture.tree !== p.tree || capture.command !== PREPARED_BROWSER_COMMAND ||
      capture.contract !== "augnes.browser-control-development.v1" || capture.basis !== "actual-owned-development-invocation" || capture.truncated !== false || capture.capture_error !== undefined ||
      !Number.isSafeInteger(capture.process_umask) || capture.process_umask < 0 || capture.process_umask > 0o777 ||
      !natural(capture.result) || !settled(capture.cleanup) || capture.ownership.checkout.released !== true || capture.ownership.capacity.released !== true ||
      !(Date.parse(completedAt) < Date.parse(capture.started_at) && Date.parse(capture.started_at) < Date.parse(capture.finished_at) && Date.parse(capture.finished_at) <= Date.parse(focused.finished_at))) fail();
  for (const [phase, field] of [["dependencies-root", "dependencies"], ["dependencies-web-planning", "web_dependencies"]]) {
    const expected = capture.before[field];
    if (expected.phase_id !== phase || comparePreparedDependencyInputs(expected, capture.after[field]) !== "unchanged") fail();
    const prepared = capture.preparations.find(value => value.phase === phase);
    if (prepared?.result.status !== "pass" || prepared.result.exit_status !== 0 || prepared.result.timed_out !== false ||
        prepared.result.cleanup.completed !== true || prepared.result.cleanup.termination_reason !== "natural_exit" ||
        comparePreparedDependencyInputs(prepared.inputs, expected) !== "unchanged") fail();
  }
  const log = bytes(capture.stdout, 2 * 1024 * 1024).toString();
  const uses = log.split("\n").filter(line => line.startsWith(BROWSER_IDENTITY_PREFIX)).map(parseBrowserUseLine);
  if (!validPhaseBrowserUse({ id: PREPARED_ELIGIBILITY_PHASE, browser: true }, uses, capture.before.target.inputInventory.resources.find(value => value.id === "browser-executable"))) fail();
  const childStart = log.lastIndexOf('\n{\n  "ok":');
  let child; try { child = JSON.parse(log.slice(childStart + 1)); } catch { fail(); }
  if (childStart < 0 || child.ok !== true || child.child_id !== "operator-work-expectation" || child.cleanup_complete !== true) fail();
  const operations = log.split("\n").filter(line => line.startsWith("[operator-browser-control] {")).map(line => JSON.parse(line.slice(line.indexOf("{"))));
  for (const action of ["refresh", "review", "save"]) {
    if (!operations.some(value => value.scope === "expectation.changed-work" && value.stage === "finish" &&
        value.selector === `[data-expectation-action="${action}"]` && value.performed === true && value.facts.visible === true &&
        value.facts.disabled === false && value.facts.preparation_open === true && value.facts.closed_details === 0)) fail();
  }
  const command = `node scripts/test-prepared-dependency-eligibility.mjs --prior-head ${prior.head}`;
  let controls; try { controls = JSON.parse(bytes(control.stdout, 2 * 1024 * 1024).toString().trim()); } catch { fail(); }
  if (control.command !== command || control.tested_source_head !== p.head || control.node_version !== CANONICAL_NODE_VERSION ||
      control.runtime_inputs_sha256 !== p.inputs.identity_sha256 || !natural(control.result) ||
      !equal(control.source, capture.after.source) || controls.runtime !== p.inputs.identity_sha256 || controls.process_umask !== capture.process_umask ||
      controls.prior_head !== prior.head || !equal(controls.cases, ["matching_registered_preparation_before_consumer",
        "foreign_frozen_contract_cloned_capability_and_repeated_phase_refused",
        "root_and_web_content_layout_permission_location_stop_before_consumer", "post_boundary_mutation_refused", "first_prerequisite_fault_survives_later_fault", "unsafe_file_refused",
        "fresh_stock_generated_window_and_out_of_window_refusal", "source_lockfile_loader_mutation_refused"]) ||
      !controls.original_sources.some(row => row.path === "scripts/local-canonical-inputs.mjs" && row.origin === prior.head) ||
      !equal(controls.original_sources.map(row => row.path).sort(), ["scripts/canonical-test-environment.mjs", "scripts/local-canonical-browser-bundle.mjs", "scripts/local-canonical-inputs.mjs"]) ||
      controls.original_sources.some(row => (row.path === "scripts/local-canonical-inputs.mjs" ? row.origin !== prior.head : row.origin !== "candidate")) ||
      controls.original_sources.some(row => { const raw = git(["show", `${row.origin === "candidate" ? p.head : prior.head}:${row.path}`]); return row.sha256 !== digest(raw) || row.bytes !== raw.length; }) ||
      !focused.commands.some(c => c.command === command && equal(c.record, reg.controls)) ||
      !(Date.parse(completedAt) < Date.parse(control.finished_at) && Date.parse(control.finished_at) <= Date.parse(focused.finished_at))) fail();
  return p.head;
}
