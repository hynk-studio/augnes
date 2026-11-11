import path from "node:path";
import { digest, comparePreparedDependencyInputs } from "./local-canonical-inputs.mjs";
import { pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { fixtureBudgetEnvironment, settledNextDeclarationOutput, nextDeclarationKind } from "./local-canonical-fixture-budget-witness.mjs";
import { PREPARED_ELIGIBILITY_REPAIR } from "./local-canonical-prepared-eligibility-witness.mjs";
import { verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";

export const VERIFIER_LIFECYCLE_REPAIR = "verifier-lifecycle-repair-v1";
export const VERIFIER_LIFECYCLE_CLAIM = "Correct registered verifier lifecycle and generated declarations. Preserve naturally passing development results, historical failures, false stock and UNKNOWN causes.";
export const VERIFIER_LIFECYCLE_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for the verifier lifecycle correction.";
export const VERIFIER_LIFECYCLE_COLLECTOR = "scripts/capture-local-canonical-verifier-lifecycle.mjs";
const generatedOwner = "scripts/local-canonical-fixture-budget-witness.mjs";
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const fail = () => { throw Object.assign(new Error("revision_verifier_lifecycle_evidence_invalid"), { code: "revision_verifier_lifecycle_evidence_invalid" }); };
const natural = r => r?.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false &&
  r.exit_observed === true && r.streams_closed === true && r.cleanup_completed === true && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";
const settled = r => r?.completed === true && r.failure_count === 0 && equal(r.failures, []);
const sourceWithoutGenerated = ({ root_generated, ...source }) => source;
const interval = (start, end, first, last) => [start, end, first, last].every(v => Number.isFinite(Date.parse(v))) &&
  Date.parse(first) <= Date.parse(start) && Date.parse(start) <= Date.parse(end) && Date.parse(end) <= Date.parse(last);

// This only explains one extra issue in a comparison view. It never edits the
// historical stock, resolves the unknown writer/exception, or grants execution.
export function verifyVerifierLifecyclePredecessor(p, prior, focused, { original, stock, parse, bytes, git, validateFailure }) {
  const incident = focused.regression.incident, previousFocused = parse(incident.original_focused), previousCapture = parse(incident.original_capture);
  const observation = parse(incident.observation), generated = observation.stock?.generated_current;
  const phase = original.phases.find(value => value.status === "failure"), log = bytes(incident.log, 2 * 1024 * 1024);
  if (prior.source_correction?.commission.evidence_kind !== PREPARED_ELIGIBILITY_REPAIR || prior.source_correction.commission.maximum_invocations !== 1 ||
      incident.original_focused.sha256 !== prior.source_correction.focused.sha256 || incident.original_capture.sha256 !== previousFocused.regression.after.sha256 ||
      incident.receipt !== p.prior_receipt_fingerprint || incident.cause !== "UNKNOWN" || phase?.id !== "authority" ||
      stock.content_fingerprint !== p.prior_receipt_fingerprint || stock.valid_deciding_evidence !== false ||
      !equal(observation.stock.unmodified_stock, stock) || observation.stock.original_exception !== "UNKNOWN" ||
      !Number.isFinite(Date.parse(observation.observed_at)) || Date.parse(observation.observed_at) < Date.parse(original.run.finished_at) ||
      stock.issues.filter(issue => issue === "receipt_attempt_records_unverified").length !== 1 ||
      phase.log.relative_path !== `.augnes-local-verification/logs/${original.run.id}/authority.log` ||
      phase.log.bytes !== log.length || phase.log.truncated !== false ||
      !git(["show", prior.head + ":" + generatedOwner]).toString().includes('current.kind === "build" ? phase.id === "build" : phase.id === "e2e-project-experience"')) fail();
  const failures = log.toString().split("\n").filter(line => line.startsWith("AUGNES_REVIEW_CHILD_RESULT "))
    .map(line => JSON.parse(line.slice("AUGNES_REVIEW_CHILD_RESULT ".length)))
    .filter(record => record?.control_id === "reviewed-revision-browser");
  if (failures.length !== 1 || failures[0].timed_out !== true || failures[0].cancelled !== false || failures[0].termination_reason !== "bounded_timeout" ||
      failures[0].exit_observed !== true || failures[0].streams_closed !== true || failures[0].cleanup_completed !== true || failures[0].remaining_owned_processes !== 0) fail();
  const declaration = ['/// <reference types="next" />', '/// <reference types="next/image-types/global" />',
    'import "./.next/types/routes.d.ts";', 'import "./.next/types/root-params.d.ts";', "", "// NOTE: This file should not be edited",
    "// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.", ""].join("\n");
  if (generated?.sha256 !== digest(Buffer.from(declaration)) || generated.bytes !== Buffer.byteLength(declaration) ||
      !/^\d+$/u.test(generated.mtime_ns) || !/^\d+$/u.test(generated.ctime_ns) ||
      !settledNextDeclarationOutput(original, { kind: "build", mtime: BigInt(generated.mtime_ns), ctime: BigInt(generated.ctime_ns) }, previousCapture.after.source.root_generated)) fail();
  const build = original.phases.find(value => value.id === "build");
  if ([generated.mtime_ns, generated.ctime_ns].some(v => BigInt(v) >= BigInt(Date.parse(build.started_at)) * 1000000n)) fail();
  for (const [id, field] of [["dependencies-root", "dependencies"], ["dependencies-web-planning", "web_dependencies"]]) {
    const actual = original.inputs.prepared_dependencies.find(value => value.phase_id === id);
    if (actual?.unchanged !== true || actual.error !== null || comparePreparedDependencyInputs(actual.before, actual.after) !== "unchanged" ||
        comparePreparedDependencyInputs(actual.before, previousCapture.after[field]) !== "unchanged") fail();
  }
  validateFailure({ ...stock, issues: stock.issues.filter(issue => issue !== "receipt_attempt_records_unverified") });
}

function validPhase(result, expected, capture) {
  return result?.id === expected.id && result.command === expected.command && result.cwd_scope === "root" && result.browser === false &&
    result.exclusive === expected.exclusive && result.invocation_id === capture.invocation_id &&
    result.status === (expected.exit === 0 ? "pass" : "failure") && result.exit_status === expected.exit && result.timed_out === false &&
    result.spawn_error_code === null && result.failure_code === (expected.exit === 0 ? null : "phase_failed") &&
    result.cleanup?.completed === true && result.cleanup.exit_observed === true && result.cleanup.streams_closed === true &&
    result.cleanup.remaining_owned_processes === 0 && [null, 0].includes(result.cleanup.listener_residue_count) && result.cleanup.termination_reason === "natural_exit" &&
    interval(result.started_at, result.finished_at, capture.started_at, capture.finished_at);
}

export function verifyVerifierLifecycleRepair(p, prior, focused, { git, parse, bytes, completedAt, original, completion, repositoryRoot }) {
  const reg = focused.regression, baseline = reg.accepted_baseline, c = parse(reg.after);
  if (!equal(Object.keys(reg).sort(), ["accepted_baseline", "after", "claim", "controls", "incident", "kind"]) ||
      reg.kind !== VERIFIER_LIFECYCLE_REPAIR || p.commission.evidence_kind !== reg.kind || reg.claim !== VERIFIER_LIFECYCLE_CLAIM ||
      focused.failed_phase !== "authority" || !equal(focused.input_remedy_resources, []) ||
      ![generatedOwner, "scripts/fixtures/local-canonical-reviewed-revision.mjs", "scripts/fixtures/local-canonical-browser-successor.mjs"].every(file => focused.implicated_paths.includes(file)) ||
      baseline?.head !== prior.head || baseline.tree !== prior.tree || baseline.base !== original.repository.base_sha ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || completion.infrastructure_code !== null ||
      c.contract !== "augnes.verifier-lifecycle-development.v1" || c.basis !== "actual-owned-development-invocation" ||
      c.command !== "node " + VERIFIER_LIFECYCLE_COLLECTOR || c.tested_source_head !== p.head || c.tree !== p.tree || c.baseline !== prior.head || c.base !== p.base ||
      c.capture_error !== undefined || c.truncated !== false || !Number.isSafeInteger(c.process_umask) || c.process_umask < 0 || c.process_umask > 0o777 ||
      !settled(c.cleanup) || c.ownership?.checkout?.released !== true || c.ownership?.capacity?.released !== true ||
      !(Date.parse(completedAt) < Date.parse(c.started_at) && interval(c.started_at, c.finished_at, completedAt, focused.finished_at))) fail();
  const catalogue = pureContractGitSource(git, p.head).summary;
  // This correction retains the registration and all deadlines. A later
  // allowance decision needs measured support; this kind does not infer one.
  for (const file of ["scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-review-corrections.mjs", "scripts/local-canonical-closeout-budgets.mjs"])
    if (digest(git(["show", prior.head + ":" + file])) !== digest(git(["show", p.head + ":" + file]))) fail();
  const canonicalEnvironment = environment => {
    if (!path.isAbsolute(environment?.AUGNES_CANONICAL_TEMP_ROOT ?? "")) return false;
    const expected = fixtureBudgetEnvironment(environment.AUGNES_CANONICAL_TEMP_ROOT, environment); delete expected.NODE_ENV;
    Object.assign(expected, { npm_config_cache: path.join(environment.AUGNES_CANONICAL_TEMP_ROOT, "npm-cache"), npm_config_devdir: path.join(environment.AUGNES_CANONICAL_TEMP_ROOT, "node-gyp") });
    return equal(environment, expected) && environment.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT === digest(c.after.runtime.headers.observation);
  };
  if (!canonicalEnvironment(c.environment) ||
      ![c.before, c.after].every(value => equal(sourceWithoutGenerated(value.source), catalogue) && digest(value.runtime) === p.inputs.identity_sha256 &&
        value.target.inventory === p.inputs.inventory_sha256 && gitRevisionInventory(value.target.inputInventory) === p.inputs.inventory_sha256 &&
        value.target.service.state.preservation_valid === true && value.target.service.diagnostics.coherent === true) ||
      !equal(c.before.loader, c.after.loader) || !equal(c.before.target.service.state, c.after.target.service.state) ||
      c.inputs.first_fault !== null || c.inputs.events.length !== 0 ||
      !equal(c.preparations.map(value => value.phase), ["dependencies-root", "dependencies-nested", "dependencies-web-planning"]) ||
      !equal(c.cases.map(value => value.name), ["stopped-before-build", "through-build", "registered-authority"])) fail();
  for (const prepared of c.preparations) {
    const result = prepared.result;
    if (result.id !== prepared.phase || result.command !== "npm ci --no-audit --no-fund" || result.status !== "pass" || result.exit_status !== 0 ||
        result.timed_out !== false || result.cleanup?.completed !== true || result.cleanup.termination_reason !== "natural_exit" ||
        result.cleanup.exit_observed !== true || result.cleanup.streams_closed !== true || result.cleanup.remaining_owned_processes !== 0 ||
        result.environment_fingerprint !== digest(c.environment) || result.invocation_id !== c.invocation_id ||
        comparePreparedDependencyInputs(prepared.expected, prepared.inputs) !== "unchanged") fail();
    const field = prepared.phase === "dependencies-root" ? "dependencies" : prepared.phase === "dependencies-web-planning" ? "web_dependencies" : null;
    if (field && [c.before, c.after].some(value => comparePreparedDependencyInputs(prepared.inputs, value[field]) !== "unchanged")) fail();
  }
  if (digest(bytes(c.collector, 128 * 1024)) !== digest(git(["show", p.head + ":" + VERIFIER_LIFECYCLE_COLLECTOR]))) fail();
  const overlay = c.source_overlay;
  const closure = new Set();
  const visit = file => {
    if (closure.has(file)) return; if (closure.size >= 128 || !/^scripts\/[\w./-]+\.mjs$/u.test(file) || file.split("/").includes("..")) fail();
    closure.add(file); const source = git(["show", prior.head + ":" + file]).toString();
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+\.mjs)["']/gu)) visit(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
  };
  visit(generatedOwner);
  if (!Array.isArray(overlay) || !overlay.length || new Set(overlay.map(v => v.path)).size !== overlay.length ||
      !equal(overlay.map(v => v.path).sort(), [...closure].sort()) ||
      overlay.filter(v => v.path === generatedOwner).length !== 1 ||
      overlay.some(v => !/^scripts\/[\w./-]+\.mjs$/u.test(v.path) || v.path.split("/").includes("..") ||
        v.basis !== prior.head || v.sha256 !== digest(git(["show", v.basis + ":" + v.path])))) fail();
  for (const test of c.cases.slice(0, 2)) {
    const packet = parse(test.inspection), receipt = parse(test.receipt), old = parse(test.prior_inspection), through = test.name === "through-build";
    if (!verifyReceiptIntegrity(receipt) || !equal(packet.receipt, receipt) || receipt.attempt !== null || receipt.evidence?.deciding !== false ||
        !equal(receipt.phases, test.phases) || !canonicalEnvironment(test.environment) ||
        !equal(packet.witness.environment, test.environment) || !equal(packet.witness.after.loader, c.after.loader) ||
        !equal(sourceWithoutGenerated(packet.witness.after.source), catalogue) ||
        !equal(packet.witness.after.source.root_generated, [{ path: "next-env.d.ts", sha256: test.initial.sha256 }]) ||
        comparePreparedDependencyInputs(packet.witness.after.dependencies, c.after.dependencies) !== "unchanged" ||
        comparePreparedDependencyInputs(packet.web, c.after.web_dependencies) !== "unchanged" ||
        packet.expected !== "accepted" || old.expected !== "revision_fixture_budget_invalid" ||
        !equal({ ...old, expected: "accepted" }, packet) || !natural(test.current_result) || !natural(test.prior_result) ||
        !settled(test.cleanup) || !test.setup.cancelled || test.setup.timed_out || test.setup.cleanup_completed !== true ||
        test.setup.exit_observed !== true || test.setup.streams_closed !== true || test.setup.remaining_owned_processes !== 0 ||
        test.build_executed !== through || test.phases.length !== 2 ||
        !validPhase(test.phases[0], { id: "typecheck", command: "npm run typecheck", exclusive: false, exit: 0 }, c) ||
        !validPhase(test.phases[1], through ? { id: "build", command: "npm run build", exclusive: true, exit: 0 } :
          { id: "development-stop", command: "node -e process.exit(17)", exclusive: false, exit: 17 }, c) ||
        test.phases.some(phase => phase.environment_fingerprint !== digest(test.environment)) ||
        !settledNextDeclarationOutput(receipt, { kind: "build", mtime: BigInt(test.generated.mtime_ns), ctime: BigInt(test.generated.ctime_ns) }, packet.witness.after.source.root_generated)) fail();
    for (const [observation, kind] of [[test.initial, "dev"], [test.generated, "build"]]) {
      const raw = bytes(observation.content, 1024);
      if (nextDeclarationKind(observation.sha256) !== kind || digest(raw) !== observation.sha256 || raw.length !== observation.bytes ||
          observation.links !== 1 || observation.uid !== process.getuid() || !Number.isSafeInteger(observation.mode) || (observation.mode & 0o022) !== 0) fail();
    }
    for (const [id, result, ref, expected, oldReader] of [[test.current_child, test.current_result, test.inspection, "accepted", false],
      [test.prior_child, test.prior_result, test.prior_inspection, "revision_fixture_budget_invalid", true]]) {
      const child = c.children.find(value => value.id === id), args = child?.args;
      if (!child || !equal(child.result, result) || child.cwd_scope !== "root" || child.environment_fingerprint !== digest(c.environment) ||
          child.timeout_ms !== 60000 || args?.length !== (oldReader ? 4 : 3) ||
          args[0] !== path.join(repositoryRoot, VERIFIER_LIFECYCLE_COLLECTOR) || args[1] !== "--inspect" ||
          path.basename(args[2]) !== ref.artifact || oldReader && args[3] !== path.join(c.environment.AUGNES_CANONICAL_TEMP_ROOT, "prior-reader", generatedOwner) ||
          child.command !== ["node", ...args].join(" ") || !interval(child.started_at, child.finished_at, c.started_at, c.finished_at)) fail();
      const lines = bytes(child.stdout, 2 * 1024 * 1024).toString().trim().split("\n");
      if (lines.length !== 1) fail(); const observed = JSON.parse(lines[0]);
      if (observed.basis !== "non-deciding actual development phase records" || observed.result !== expected || !Number.isSafeInteger(observed.pid) || observed.pid <= 0) fail();
      bytes(child.stderr, 2 * 1024 * 1024); bytes(child.lifecycle, 64 * 1024);
    }
    const setup = c.children.find(value => value.id === test.setup_child);
    if (!setup || !equal(setup.result, test.setup) || setup.environment_fingerprint !== digest(test.environment) || setup.timeout_ms !== 60000 ||
        !equal(setup.args.slice(0, 6), ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port"]) ||
        setup.args.length !== 7 || !/^\d+$/u.test(setup.args[6])) fail();
    for (const phase of test.phases) {
      const ref = c.phase_logs.find(value => value.relative_path === phase.log.relative_path);
      if (!ref || phase.log.truncated !== false || bytes(ref.ref, 2 * 1024 * 1024).length !== phase.log.bytes) fail();
    }
  }
  const authority = c.cases[2].result, log = bytes(c.stdout, 2 * 1024 * 1024).toString();
  const authorityChild = c.children.find(value => value.id === c.cases[2].child);
  if (!natural(authority) || authority.duration_ms <= 0 || authority.duration_ms > 300000 ||
      !authorityChild || !equal(authorityChild.result, authority) || authorityChild.timeout_ms !== 300000 ||
      !equal(authorityChild.args, ["scripts/run-canonical-test-suite.mjs", "authority", "--reviewed-revision-only"]) ||
      authorityChild.environment_fingerprint !== digest(c.environment) ||
      !log.includes('"synthetic_browser_successor"') || !log.includes('"browser_revision_controls"') ||
      !log.includes('"stage":"cleanup_complete"') || !log.includes('"control_id":"reviewed-revision-browser","exit_code":0') ||
      !log.includes('"result":"accepted"') || !log.includes('"result":"revision_fixture_budget_invalid"')) fail();
  const authorityLog = bytes(authorityChild.stdout, 2 * 1024 * 1024).toString() + "\n" + bytes(authorityChild.stderr, 2 * 1024 * 1024).toString();
  const stages = authorityLog.split("\n").filter(line => line.startsWith("AUGNES_REVIEW_FIXTURE_STAGE ")).map(line => JSON.parse(line.slice("AUGNES_REVIEW_FIXTURE_STAGE ".length)));
  const inner = authorityLog.split("\n").filter(line => line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(line => JSON.parse(line.slice("AUGNES_REVIEW_CHILD_RESULT ".length)))
    .filter(value => value.control_id === "reviewed-revision-browser");
  if (inner.length !== 1 || !natural(inner[0]) || !Number.isSafeInteger(inner[0].duration_ms) || inner[0].duration_ms <= 0 || !equal(stages.map(value => value.stage), [
    "imports_complete", "setup_start", "setup_complete", "controls_start", "physical_installation_complete",
    "incident_controls_complete", "remedy_controls_complete", "preparation_start", "preparation_complete", "authority_controls_complete",
    "successor_start", "first_execution_start", "first_execution_complete", "second_material_start", "second_material_complete",
    "preparation_controls_complete", "authority_refusals_complete", "second_execution_start", "second_execution_complete",
    "tail_refusals_complete", "export_complete", "controls_complete", "cleanup_start", "cleanup_complete",
  ]) || stages.some((value, index) => !Number.isFinite(value.at) || value.at < 0 || value.at > inner[0].duration_ms || index > 0 && value.at <= stages[index - 1].at)) fail();
  const controls = parse(reg.controls.record), outer = parse(reg.controls.capture_command);
  if (controls.tested_source_head !== p.head || !natural(controls.result) ||
      !bytes(controls.stdout, 2 * 1024 * 1024).toString().includes('"fresh_stock_generated_window_and_out_of_window_refusal"') ||
      outer.tested_source_head !== p.head || !natural(outer.result) || !equal(outer.capture, reg.after) ||
      !interval(c.started_at, c.finished_at, outer.started_at, outer.finished_at) ||
      !Array.isArray(outer.args) || outer.args.length !== 4 || outer.args[0] !== VERIFIER_LIFECYCLE_COLLECTOR ||
      outer.args[2] !== prior.head || outer.args[3] !== p.base || outer.command !== ["node", ...outer.args].join(" ") ||
      !focused.commands.some(command => command.tested_source_head === p.head && equal(command.record, reg.controls.capture_command))) fail();
  return p.head;
}
