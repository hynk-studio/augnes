// A separate prospective decision, not a material repair or recovery claim.
// This module only reads evidence. Authentication, physical lineage, freshness,
// one-use reservation and current stock remain owned by the existing v7 reader.
import { createRequire } from "node:module";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";

export const PROSPECTIVE_REQUALIFICATION = "prospective-requalification-v1";
export const PROSPECTIVE_CURRENT_BASELINE_CONTRACT = "augnes.prospective-current-baseline.v1";
export const PROSPECTIVE_REQUALIFICATION_OWNER = "scripts/test-operational-continuation-admission.ts";
export const PROSPECTIVE_REQUALIFICATION_BENCHMARK = "model-host-succession-benchmark";
export const PROSPECTIVE_REQUALIFICATION_CLAIM = "Explicit prospective requalification under unchanged product workload and bounds. The settled watchdog failure remains failed and its cause UNKNOWN; no material repair, recovered cause, reliability margin or prior qualification coverage is claimed.";
export const PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY = "Historical windows remain UNKNOWN; all prior commissions, issued limits, consumed invocations, receipts, false stock and incomplete coverage remain unchanged. This decision does not replenish recovery or reinterpret a prior failure as PASS.";
export const PROSPECTIVE_REQUALIFICATION_DIAGNOSTIC_SCOPE = "Retained diagnostic originals only. A later observed completion is neither historical-cause proof, material repair RED/GREEN, qualification coverage nor a reliable timing margin. Separate review must inspect these exact originals and their limitations; they grant no execution authority.";
export const PROSPECTIVE_REQUALIFICATION_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for explicit prospective requalification.";
export const PROSPECTIVE_REQUALIFICATION_LIMIT = "Old commission remains spent. Exactly one admitted deciding invocation total for this assignment. Reservation/interruption consumes it. No ordinal two, recovery or automatic replacement commission. No unchanged-target retry under this commission. Separate fresh-process stock and independent result audit are required.";
const suite = "scripts/run-canonical-test-suite.mjs";
const driver = "scripts/run-local-canonical-verification.mjs";
const attempts = "scripts/local-canonical-attempts.mjs";
const label = "authenticated source-linked continuation admission and fresh managed Start contract";
// Selection never supplies a command, label, phase or deadline. These two
// evidenced registrations are closed, and are re-read from each Git tree.
const continuation = Object.freeze({ id: "continuation-admission", owner: PROSPECTIVE_REQUALIFICATION_OWNER,
  phase: "unit", suite: "unit", phase_command: "npm test", command: "node --import tsx " + PROSPECTIVE_REQUALIFICATION_OWNER,
  label, bound_ms: 60000 });
const benchmark = Object.freeze({ id: PROSPECTIVE_REQUALIFICATION_BENCHMARK, owner: "scripts/test-model-host-succession-benchmark.ts",
  phase: "unit", suite: "unit", phase_command: "npm test", command: "node --import tsx scripts/test-model-host-succession-benchmark.ts",
  label: "deterministic model and host succession portability and fallback benchmark contract", bound_ms: 90000 });
export const PROSPECTIVE_REQUALIFICATION_REGISTERED_OWNERS = Object.freeze([continuation, benchmark]);
const reader = "scripts/test-local-canonical-prospective-requalification.mjs";
const controlId = "prospective-requalification-evidence";
const supportPaths = new Set([
  "scripts/local-canonical-prospective-requalification.mjs", reader,
  "scripts/prepare-local-canonical-prospective-requalification.mjs", "scripts/local-canonical-serial-aggregate.mjs",
  "scripts/fixtures/local-canonical-prospective-requalification.mjs",
  "scripts/fixtures/local-canonical-reviewed-revision.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-executor.mjs",
  "scripts/local-canonical-git-observation.mjs", attempts, driver,
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs", suite,
  "AGENTS.md", ".github/LOCAL_CANONICAL_VERIFICATION.md",
]);
const phases = ["dependencies-root", "dependencies-nested", "dependencies-web-planning", "typecheck", "build", "unit", "authority", "integration", "operability", "e2e-project-experience", "e2e-operator-review-control", "e2e-operator-native-host-execution", "e2e-operator-work-expectation", "e2e-operator-multi-candidate", "e2e-continuity", "e2e-golden"];
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const keys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) && equal(Object.keys(value).sort(), [...expected].sort());
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const gitId = value => /^[a-f0-9]{40}$/u.test(value ?? "");
const fail = () => { throw Object.assign(new Error("revision_prospective_requalification_invalid"), { code: "revision_prospective_requalification_invalid" }); };
const requireThat = value => { if (!value) fail(); };
const one = values => { requireThat(values.length === 1); return values[0]; };

// Absence is the historical 60s wire, not an alias inferred from a log. An
// explicit selector is available only for the newly supported benchmark.
export const validProspectiveRequalificationOwner = p => !Object.hasOwn(p?.commission ?? {}, "registered_owner") ||
  p.commission.registered_owner === PROSPECTIVE_REQUALIFICATION_BENCHMARK;
export function prospectiveRequalificationRegisteredOwner(p) {
  requireThat(validProspectiveRequalificationOwner(p));
  return Object.hasOwn(p?.commission ?? {}, "registered_owner") ? benchmark : continuation;
}

export const isProspectiveRequalification = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && Object.hasOwn(p.inputs ?? {}, "inventory_sha256") &&
  p.commission?.source_revision === PROSPECTIVE_REQUALIFICATION && !Object.hasOwn(p.commission, "route");

// Historical receipt validation consumes its own saved runtime observation.
// Current preparation/admission still consumes p.inputs.current and binds it
// exactly; this selector never substitutes historical inputs into that target.
export function prospectiveHistoricalRuntime(p, original, currentInputs) {
  if (!isProspectiveRequalification(p)) return currentInputs;
  const historical = original?.inputs?.binding?.runtime_inputs;
  requireThat(currentInputs && typeof currentInputs === "object" && !Array.isArray(currentInputs) &&
    sha(p.inputs.identity_sha256) && digest(currentInputs) === p.inputs.identity_sha256 &&
    historical && typeof historical === "object" && !Array.isArray(historical) &&
    sha(p.inputs.predecessor_sha256) && digest(historical) === p.inputs.predecessor_sha256);
  const comparable = runtime => {
    const value = structuredClone(runtime);
    if (value.node?.observation?.metadata) delete value.node.observation.metadata.device;
    if (value.headers?.observation) delete value.headers.observation.inventory_sha256;
    return value;
  };
  // These two metadata identities may differ between assignments. All paths,
  // bytes, permissions and other metadata remain exact. The current target
  // still retains both complete fields; their historical cause is not inferred.
  requireThat(equal(comparable(currentInputs), comparable(historical)));
  return historical;
}

// A recognized basis must not be laundered through a legacy schema, recovery
// proof or lossy receipt projection. Detection is deliberately separate from
// eligibility: the full v7 reader still validates the only supported shape.
export const hasProspectiveRequalificationMarker = value => [value, value?.source_correction,
  value?.recovery, value?.attempt, value?.attempt?.source_correction, value?.attempt?.recovery,
  value?.attempt?.repair].some(record => record?.commission?.source_revision === PROSPECTIVE_REQUALIFICATION ||
    Object.hasOwn(record?.commission ?? {}, "registered_owner"));

function paragraphs(body) {
  if (typeof body !== "string" || /[<>\u202a-\u202e\u2066-\u2069]/u.test(body) || /^(?: {4}|\t| {0,3}(?:`{3,}|~{3,}|\$\$))/mu.test(body)) return [];
  return body.replaceAll("\r\n", "\n").trim().split(/\n[ \t]*\n/u);
}
export const prospectiveRequalificationDelegation = p => {
  const selected = prospectiveRequalificationRegisteredOwner(p);
  return [
  "Authorize one explicit prospective-requalification preparation and conditional qualification assignment on " + p.branch + " in Draft PR #" + p.pull_request + ". Select " + PROSPECTIVE_REQUALIFICATION + " as a distinct inventory-bound v7 reviewed_revision basis, not material-source-correction-v1, recovery or the retired condition-requalification route.",
  "Predecessor: " + p.prior_family_id + " / " + p.prior_attempt_id + " / " + p.prior_receipt_fingerprint + ".",
  PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY,
  "Preserve the registered " + selected.id + " owner, complete workload, assertions, original " + selected.bound_ms + " ms child bound, full planner-selected phases and Browser requirements. Permit only reviewed admission-support changes and their focused controls. After separate independent acceptance of the complete final published source, immutable incident and diagnostic evidence, disclosed cumulative cost and residual timing uncertainty, real non-reserving preparation commitment and complete current inputs, authorize faithful recording of that decision and a distinct subsequent authenticated exact-target commission. Identify the actual reviewer separately from the recording operator. This delegation is not an execution grant. Exactly one new complete deciding invocation is permitted for this assignment; reservation or interruption consumes it. No ordinal two, recovery or automatic replacement merely because execution fails is authorized. A later new decision needs separate authority; this delegation does not supply it. Complete separate fresh-process stock, independent result audit and owned cleanup; actual model/UI and hosted acceptance remain separate.",
].join("\n\n"); };
export const delegatesProspectiveRequalification = (body, p) => isProspectiveRequalification(p) &&
  validProspectiveRequalificationOwner(p) &&
  equal(paragraphs(body), prospectiveRequalificationDelegation(p).split("\n\n"));

export const prospectiveRequalificationAuthorityBindings = (p, target) => [
  "Repository: hynk-studio/augnes", "Proof schema: " + p.schema, "Branch: " + p.branch,
  "Base: " + p.base, "Head: " + p.head, "Tree: " + p.tree,
  "Preparation commitment: " + target, "Current inventory: " + p.inputs.inventory_sha256,
  "Runtime inputs: " + p.inputs.identity_sha256,
  "Predecessor family: " + p.prior_family_id, "Predecessor attempt: " + p.prior_attempt_id,
  "Predecessor receipt: " + p.prior_receipt_fingerprint, "Original root receipt: " + p.commission.root_receipt_fingerprint,
  "Task delegation: https://github.com/hynk-studio/augnes/pull/" + p.pull_request + "#issuecomment-" + p.commission.delegation.id,
  "Source revision basis: " + PROSPECTIVE_REQUALIFICATION, PROSPECTIVE_REQUALIFICATION_CLAIM,
  ...(Object.hasOwn(p.commission, "registered_owner") ? (() => {
    const selected = prospectiveRequalificationRegisteredOwner(p);
    return ["Registered owner: " + selected.id, "Registered owner path: " + selected.owner,
      "Registered phase: " + selected.phase, "Registered command: " + selected.command,
      "Registered child label: " + selected.label, "Registered child bound: " + selected.bound_ms + " ms"];
  })() : []),
  "Risk decision: accept disclosed cumulative cost and residual timing uncertainty once under unchanged bounds; no known unresolved material product, integrity or safety defect is waived.",
  // Preserve the existing serial authority wire text without importing its
  // receipt/attempt cycle. The central owner validates the inherited object and
  // independently checks this body with inheritedSerialAuthorityScope.
  ...(p.commission.inherited_serial ? [
    "Inherited serial envelope: " + p.commission.inherited_serial.envelope_sha256,
    "Inherited serial route: " + p.commission.inherited_serial.route,
    "Inherited serial origin: " + p.commission.inherited_serial.origin_family_id + " / " + p.commission.inherited_serial.origin_attempt_id + " / " + p.commission.inherited_serial.origin_receipt_fingerprint,
    "Original timeout, false stock, interrupted child UNKNOWN and all earlier lineage remain unchanged.",
  ] : []),
].join("\n");
export function prospectiveRequalificationAuthorityScope(p, review, grant, target) {
  if (!isProspectiveRequalification(p) || !validProspectiveRequalificationOwner(p) || !sha(target)) return false;
  const accepted = paragraphs(review?.body), commission = paragraphs(grant?.body);
  const bindings = prospectiveRequalificationAuthorityBindings(p, target);
  return accepted.length === 4 && accepted[0] === "Source review decision: ACCEPT / RETAIN for prospective qualification." &&
    accepted[1] === bindings && accepted[2] === PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY &&
    /^Independent reviewer: [^\n]{1,200}\. Recording operator: [^\n]{1,200}\. Source, evidence and preparation review only; not external or reference-host validation\.$/u.test(accepted[3]) &&
    equal(commission, [PROSPECTIVE_REQUALIFICATION_GRANT, bindings,
      "Accepted review: https://github.com/hynk-studio/augnes/pull/" + p.pull_request + "#pullrequestreview-" + p.accepted.review.id,
      PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY, PROSPECTIVE_REQUALIFICATION_LIMIT]);
}

let compiler;
const ts = () => compiler ??= createRequire(import.meta.url)("typescript");
const ast = source => {
  const tree = ts().createSourceFile("source.mjs", source, ts().ScriptTarget.Latest, true, ts().ScriptKind.JS);
  requireThat(tree.parseDiagnostics.length === 0); return tree;
};
// Tokens retain operators, literals, template text and declaration semantics.
// Only whitespace/comments are irrelevant; no arbitrary AST expression is run.
function syntax(source) {
  const scanner = ts().createScanner(ts().ScriptTarget.Latest, true, ts().LanguageVariant.Standard, source);
  const result = []; let token;
  while ((token = scanner.scan()) !== ts().SyntaxKind.EndOfFileToken) result.push([token, scanner.getTokenText()]);
  return result;
}
function nodes(tree, predicate) {
  const found = [], visit = node => { if (predicate(node)) found.push(node); ts().forEachChild(node, visit); };
  visit(tree); return found;
}
const at = (git, head, file) => git(["show", head + ":" + file]);
function entry(git, head, file) {
  const content = at(git, head, file);
  requireThat(git(["ls-tree", head, "--", file]).toString().startsWith("100644 blob "));
  return { path: file, bytes: content.length, sha256: digest(content) };
}
function suiteContract(git, head, selected) {
  const source = at(git, head, suite).toString(), tree = ast(source), T = ts();
  if (selected === benchmark) {
    const helper = one(nodes(tree, node => T.isVariableDeclaration(node) && node.name.getText(tree) === "rootNode"));
    requireThat(equal(syntax(helper.initializer.getText(tree)), syntax('(...args) => ({ command: process.execPath, args: ["--import", "tsx", ...args], cwd: repoRoot, })')));
  }
  const suites = one(nodes(tree, node => T.isVariableDeclaration(node) && node.name.getText(tree) === "suites"));
  requireThat(T.isObjectLiteralExpression(suites.initializer));
  const unit = one(suites.initializer.properties.filter(node => T.isPropertyAssignment(node) && node.name.getText(tree) === selected.suite)).initializer;
  requireThat(T.isArrayLiteralExpression(unit));
  const registration = one(nodes(tree, node => T.isObjectLiteralExpression(node) && node.properties.some(property =>
    T.isSpreadAssignment(property) && T.isCallExpression(property.expression) && property.expression.expression.getText(tree) === "rootNode" &&
    property.expression.arguments.length === 1 && T.isStringLiteral(property.expression.arguments[0]) && property.expression.arguments[0].text === selected.owner)));
  requireThat(registration.parent === unit && unit.elements.includes(registration));
  const property = name => one(registration.properties.filter(node => T.isPropertyAssignment(node) && node.name.getText(tree) === name)).initializer;
  requireThat(property("timeoutMs").getText(tree).replaceAll("_", "") === String(selected.bound_ms) && T.isStringLiteral(property("label")) && property("label").text === selected.label);
  const controls = nodes(tree, node => T.isObjectLiteralExpression(node) && node.properties.some(property =>
    T.isPropertyAssignment(property) && property.name.getText(tree) === "id" && T.isStringLiteral(property.initializer) && property.initializer.text === controlId));
  requireThat(controls.length <= 1);
  let remainder = source;
  if (controls.length) {
    const control = controls[0];
    // A matching object inside an argument or another suite is not this
    // additive reader. Removing it must never hide a rerouted existing child.
    requireThat(control.parent === unit && unit.elements.includes(control));
    requireThat(equal(syntax(control.getText(tree)), syntax(`{
      id: "prospective-requalification-evidence", label: "explicit prospective requalification evidence and authority refusals",
      requirements: ["filesystem", "immutable-fixture-input"],
      ...rootNode("scripts/test-local-canonical-prospective-requalification.mjs"), timeoutMs: 30_000, requireNaturalExit: true,
    }`)));
    const followingComma = source.slice(control.end).match(/^\s*,/u);
    requireThat(followingComma);
    remainder = source.slice(0, control.getStart(tree)) + source.slice(control.end + followingComma[0].length);
  }
  return { command: selected.command, label: selected.label, bound_ms: selected.bound_ms,
    suite_remainder_sha256: digest(syntax(remainder)) };
}
function plannerContract(git, head, selected) {
  const tree = ast(at(git, head, driver).toString()), T = ts();
  if (selected === benchmark) {
    const full = one(tree.statements.filter(node => T.isFunctionDeclaration(node) && node.name?.text === "fullPhases"));
    const unit = one(nodes(full, node => T.isCallExpression(node) && node.expression.getText(tree) === "npmPhase" &&
      T.isStringLiteral(node.arguments[0]) && node.arguments[0].text === selected.phase));
    requireThat(equal(syntax(unit.getText(tree)), syntax('npmPhase("unit", "Canonical unit suite", ["test"], 3_600_000)')));
  }
  const owners = ["buildPhasePlan", "runPhasesSequentially", "executeLocalCanonicalVerification", "quickPhases", "operatingPolicyPhases", "ownerTargetedPhases",
    "targetedCanonicalPhaseDefinition", "fullPhases", "browserPhaseDefinition", "npmPhase", "phaseDefinition", "executePhase",
    "notRunPhaseReceipt", "buildLocalPhaseEnvironment", "prepareInvocationInputs"];
  const functions = owners.map(name => {
    const node = one(tree.statements.filter(node => T.isFunctionDeclaration(node) && node.name?.text === name));
    return { name, sha256: digest(syntax(node.getText(tree))) };
  });
  const attemptTree = ast(at(git, head, attempts).toString());
  const declaration = one(nodes(attemptTree, node => T.isVariableDeclaration(node) && node.name.getText(attemptTree) === "REVIEWED_REVISION_PHASES"));
  requireThat(equal(syntax(declaration.initializer.getText(attemptTree)), syntax("Object.freeze(" + JSON.stringify(phases) + ")")));
  return { functions, phases };
}
export function prospectiveRequalificationSourceEquivalence(git, before, target, registeredOwner) {
  const selected = prospectiveRequalificationRegisteredOwner({ commission: registeredOwner === undefined ? {} : { registered_owner: registeredOwner } });
  requireThat(gitId(before) && gitId(target));
  git(["merge-base", "--is-ancestor", before, target]);
  const changed = git(["diff", "--name-only", "-z", "--no-renames", before, target, "--"]).toString().split("\0").filter(Boolean).sort();
  requireThat(changed.every(file => supportPaths.has(file)));
  for (const file of changed) entry(git, target, file);
  const owner = entry(git, before, selected.owner);
  requireThat(equal(owner, entry(git, target, selected.owner)));
  const registration = suiteContract(git, before, selected), planner = plannerContract(git, before, selected);
  requireThat(equal(registration, suiteContract(git, target, selected)) && equal(planner, plannerContract(git, target, selected)));
  const patch = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", before, target, "--"]);
  return { contract: "augnes.prospective-requalification-source-equivalence.v1", classification: "git-derived-unchanged-product-workload",
    predecessor_head: before, target_head: target, owner, registration, planner,
    delta: { paths: changed, bytes: patch.length, sha256: digest(patch) },
    limitations: "Git-derived source equivalence is not a historical runtime observation or a proof of historical cause. Admission support changes are not product repairs. Exact current inputs and independent complete-delta review remain required." };
}

function failedRegisteredOwner(p, prior, incident, selected, { bytes, original, repositoryRoot }) {
  requireThat(keys(incident, ["receipt", "log", "log_identity", "cause"]) && incident.receipt === p.prior_receipt_fingerprint &&
    incident.cause === "UNKNOWN" && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,239}$/u.test(prior.attempt_id ?? ""));
  const phase = one((original.phases ?? []).filter(value => value.id === selected.phase));
  requireThat(phase.status === "failure" && phase.command === selected.phase_command && phase.exit_status === 1 && phase.timed_out === false &&
    phase.cleanup?.completed === true && phase.cleanup.exit_observed === true && phase.cleanup.streams_closed === true &&
    phase.cleanup.remaining_owned_processes === 0 && phase.cleanup.termination_reason === "natural_exit" && phase.log?.truncated === false);
  const raw = bytes(incident.log, 2 * 1024 * 1024), relative = `.augnes-local-verification/logs/${prior.attempt_id}/${selected.phase}.log`;
  requireThat(phase.log.relative_path === relative && phase.log.bytes === raw.length &&
    equal(incident.log_identity, { relative_path: relative, bytes: raw.length, sha256: digest(raw) }));
  try {
    const file = path.join(repositoryRoot, relative), stat = lstatSync(file);
    requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && !(stat.mode & 0o022) && realpathSync(file) === file &&
      stat.size === raw.length && readFileSync(file).equals(raw));
  } catch { fail(); }
  const lines = raw.toString().split(/\r?\n/u), quoted = JSON.stringify(selected.label), prefix = "[canonical:" + selected.suite + "] ";
  const start = one(lines.filter(line => line === prefix + "child_start label=" + quoted + " timeout_ms=" + selected.bound_ms));
  const end = one(lines.filter(line => line.startsWith(prefix + "child_result label=" + quoted + " ")));
  const result = end.match(/ duration_ms=([0-9]+) exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout$/u);
  const startAt = lines.indexOf(start), endAt = lines.indexOf(end);
  // The evidenced benchmark child emitted no product payload before timeout.
  // Preserve that complete interval: only its matching runner lifecycle lines
  // are eligible, rather than dropping assertion/input/safety output.
  const quietBenchmark = selected === continuation || lines.slice(startAt + 1, endAt).every(line =>
    ["child_spawn", "child_active", "child_cleanup_start", "child_cleanup_result"].some(event =>
      line.startsWith(prefix + event + " label=" + quoted + " ")));
  requireThat(result && Number.isSafeInteger(Number(result[1])) && Number(result[1]) >= selected.bound_ms && startAt < endAt &&
    quietBenchmark &&
    !lines.slice(startAt + 1).some(line => line.startsWith(prefix + "child_start ")) &&
    !lines.slice(startAt + 1).some(line => /\b(?:AssertionError|ERR_ASSERTION|PublicCompanionServiceError|TypeError|ReferenceError|RangeError|SyntaxError)\b/u.test(line)) &&
    equal(lines.filter(line => line.startsWith(prefix + "child_result ") && !line.includes(" exit_code=0 ")), [end]) &&
    lines.slice(endAt + 1).some(line => line.includes("canonical_child_timeout")) &&
    (selected === continuation || !lines.slice(startAt + 1).some(line => /\b(?:input_invalidation|safety_violation|revision_current_preservation_unsafe|input_contract_changed)\b/u.test(line))));
}

export function verifyProspectiveRequalification(p, prior, focused, { git, parse, bytes, original, completion, repositoryRoot }) {
  const r = focused.prospective;
  const selected = prospectiveRequalificationRegisteredOwner(p);
  requireThat(isProspectiveRequalification(p) && !Object.hasOwn(focused, "regression") &&
    !Object.hasOwn(p.commission, "evidence_kind") && !Object.hasOwn(p.commission, "allowance_case") &&
    keys(r, ["kind", "claim", "owner", "incident", "retained", "equivalence", "current"]) &&
    r.kind === PROSPECTIVE_REQUALIFICATION && r.claim === PROSPECTIVE_REQUALIFICATION_CLAIM && r.owner === selected.owner &&
    focused.failed_phase === selected.phase && equal(focused.input_remedy_resources, []) &&
    completion.disposition === "product_failure" && completion.cleanup_complete === true && completion.infrastructure_code === null &&
    !original.final?.reason_codes?.includes("interrupted") &&
    focused.commands?.some(record => record.command === "node --import tsx " + reader && record.tested_source_head === p.head));
  failedRegisteredOwner(p, prior, r.incident, selected, { bytes, original, repositoryRoot });
  requireThat(keys(r.retained, ["scope", "artifacts"]) && r.retained.scope === PROSPECTIVE_REQUALIFICATION_DIAGNOSTIC_SCOPE &&
    Array.isArray(r.retained.artifacts) && equal(r.retained.artifacts.map(value => value.role), ["runner", "observer", "result", "stdout"]));
  // Retain raw originals, including absent observations. No successful result,
  // instrumentation marker or later timing sample is promoted into RED/GREEN or
  // qualification. Acceptance separately reviews these exact hash-bound files.
  for (const artifact of r.retained.artifacts) {
    requireThat(keys(artifact, ["role", "original"]) && bytes(artifact.original, 2 * 1024 * 1024).length > 0);
  }
  const equivalence = prospectiveRequalificationSourceEquivalence(git, prior.head, p.head, p.commission.registered_owner);
  requireThat(equal(parse(r.equivalence), equivalence));
  const current = parse(r.current), state = current?.companion;
  const observed = Date.parse(current?.observed_at), completed = Date.parse(completion.finished_at), finished = Date.parse(focused.finished_at);
  requireThat(keys(current, ["contract", "observed_at", "runtime_inputs_sha256", "inventory_sha256", "companion"]) &&
    current.contract === PROSPECTIVE_CURRENT_BASELINE_CONTRACT && typeof current.observed_at === "string" &&
    Number.isFinite(observed) && Number.isFinite(completed) && Number.isFinite(finished) && observed > completed && observed <= finished &&
    sha(current.runtime_inputs_sha256) && current.runtime_inputs_sha256 === p.inputs.identity_sha256 &&
    sha(current.inventory_sha256) && current.inventory_sha256 === p.inputs.inventory_sha256 &&
    keys(state, ["status", "checkout_relation", "service_identity", "preservation_valid", "preservation_binding"]) &&
    ["live", "installed_stopped"].includes(state.status) && state.checkout_relation === "exact" && state.preservation_valid === true &&
    /^sha256:[a-f0-9]{64}$/u.test(state.service_identity ?? "") && sha(state.preservation_binding) &&
    state.service_identity === original.cleanup?.companion_service?.after?.service_identity);
  // A saved bounded state is a baseline, not a reusable live observation. The
  // caller retains the existing fresh/coherent service read and exact binding.
  return { equivalence, current };
}
