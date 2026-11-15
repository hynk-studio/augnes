// A test-input evidence case inside the existing material-v7 owner. This reader
// does not run historical code, fabricate missing observations or grant a retry.
import { createRequire } from "node:module";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { usesDeclaredIntegrationBase } from "./local-canonical-integration-base.mjs";

export const REGISTERED_FIXTURE_VALIDITY_WINDOW = "registered-fixture-validity-window-v1";
export const FIXTURE_VALIDITY_WINDOW_CLAIM = "Controlled fixture-validity-window evidence; product guards and bounds unchanged; historical cause remains UNKNOWN; neither natural product RED nor qualification PASS.";
export const FIXTURE_VALIDITY_LIMITATIONS = "Retained records observe four source files and host versions, not complete historical physical source, environment, loader, executable or dependency identities. Consumed-source equivalence is derived from Git, not a retrospective observation. Current inputs require separate preparation; controlled outcomes are not natural product RED or historical-cause evidence.";
export const FIXTURE_VALIDITY_OWNER = "scripts/test-companion-ownership-retirement.mjs";
const core = "plugins/augnes-operator/mcp/companion-service-core.mjs";
const suite = "scripts/run-canonical-test-suite.mjs";
const observedPaths = [FIXTURE_VALIDITY_OWNER, core, "scripts/companion-service-fixture-observation.mjs", "scripts/test-harness-process-lifecycle.mjs"];
// The owner imports the first four and copies the remaining service/identity
// files into its private fixture. Generated process programs live in the owner.
const consumedPaths = [...observedPaths, "scripts/augnes-companion-service.mjs",
  "plugins/augnes-operator/mcp/checkout-identity.mjs", "plugins/augnes-operator/mcp/checkout-identity-darwin.py",
  "plugins/augnes-operator/mcp/node-runtime-policy.mjs"].sort();
const pinnedPaths = ["", "apps/augnes_apps/", "apps/web_planning/"].flatMap(prefix => ["package.json", "package-lock.json"].map(file => prefix + file)).sort();
const supportPaths = new Set([
  "scripts/local-canonical-fixture-validity-witness.mjs", "scripts/test-local-canonical-fixture-validity.mjs",
  "scripts/local-canonical-git-observation.mjs", "scripts/local-canonical-attempts.mjs", suite,
  ".github/LOCAL_CANONICAL_VERIFICATION.md",
]);
const command = "node --import tsx " + FIXTURE_VALIDITY_OWNER;
const readerCommand = "node --import tsx scripts/test-local-canonical-fixture-validity.mjs";
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const keys = (value, names) => value && !Array.isArray(value) && equal(Object.keys(value).sort(), [...names].sort());
const gitId = value => /^[a-f0-9]{40}$/u.test(value ?? "");
const fail = () => { throw Object.assign(new Error("revision_fixture_validity_window_invalid"), { code: "revision_fixture_validity_window_invalid" }); };
const requireThat = value => { if (!value) fail(); };
let compiler;
const ts = () => compiler ??= createRequire(import.meta.url)("typescript");
const ast = source => {
  const tree = ts().createSourceFile("fixture.mjs", source, ts().ScriptTarget.Latest, true, ts().ScriptKind.JS);
  requireThat(tree.parseDiagnostics.length === 0);
  return tree;
};
// Parser structure, token kinds and literal values, not printer line wrapping.
// Template payloads (the generated process programs) retain their exact bytes.
function treeSyntax(node) {
  const children = [];
  ts().forEachChild(node, child => { children.push(treeSyntax(child)); });
  const declarationFlags = ts().isVariableDeclarationList(node) ? node.flags &
    (ts().NodeFlags.Let | ts().NodeFlags.Const | ts().NodeFlags.Using | ts().NodeFlags.AwaitUsing) : null;
  // forEachChild omits unary operators and a few other semantic scalars. In
  // particular !x must never compare equal to +x, nor effects++ to effects--.
  const scalars = [node.operator, node.keywordToken, node.isTypeOnly, node.isExportEquals, node.rawText].map(value =>
    ["number", "boolean", "string"].includes(typeof value) ? value : null);
  return [node.kind, !ts().isSourceFile(node) && typeof node.text === "string" ? node.text : null, declarationFlags, scalars, children];
}
const syntax = source => JSON.stringify(treeSyntax(ast(source)));
function nodes(tree, predicate) {
  const result = [], visit = node => { if (predicate(node)) result.push(node); ts().forEachChild(node, visit); };
  visit(tree); return result;
}
function one(values) { requireThat(values.length === 1); return values[0]; }
function replacements(source, edits) {
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + text + source.slice(end);
  return source;
}
const at = (git, head, file) => git(["show", head + ":" + file]);
const pathsBetween = (git, before, after) => git(["diff", "--name-only", "-z", "--no-renames", before, after, "--"]).toString().split("\0").filter(Boolean).sort();
const entry = (git, head, file) => {
  const content = at(git, head, file);
  requireThat(git(["ls-tree", head, "--", file]).toString().startsWith("100644 blob "));
  return { path: file, bytes: content.length, sha256: digest(content) };
};

// A finite semantic recipe for this registered owner, not a PR/head exception.
// Normalize only the once-shortened input and the added refusal controls. The
// entire remaining fixture must equal its predecessor, including all assertions,
// generated child code, scenario bodies, process effects and cleanup.
export function priorValidityFixtureSyntax(source) {
  const tree = ast(source), T = ts(), edits = [];
  const expectedHelpers = {
    positiveFixtureDecision: "function positiveFixtureDecision(decision) { return { ...decision, expires_at: new Date(Date.parse(decision.expires_at) - 1_000).toISOString() }; }",
    prepareFixtureRecovery: "async function prepareFixtureRecovery(options) { const preview = await core.prepareCompanionOwnershipRecovery(options); return { ...preview, decision: positiveFixtureDecision(preview.decision) }; }",
  };
  for (const [name, expected] of Object.entries(expectedHelpers)) {
    const node = one(tree.statements.filter(node => T.isFunctionDeclaration(node) && node.name?.text === name));
    requireThat(syntax(node.getText(tree)) === syntax(expected));
    edits.push([node.getStart(tree), node.end, ""]);
  }
  const scenario = one(nodes(tree, node => T.isCallExpression(node) && node.expression.getText(tree) === "run" &&
    T.isStringLiteral(node.arguments[0]) && node.arguments[0].text === "stale-decision-and-maintenance-refusal"));
  const body = scenario.arguments[1].body;
  requireThat(T.isBlock(body) && body.statements.length === 12);
  const additions = `const original = await core.prepareCompanionOwnershipRecovery(f.options);
const preview = { ...original, decision: positiveFixtureDecision(original.decision) };
assert.equal(Date.parse(original.decision.expires_at) - Date.parse(preview.decision.expires_at), 1_000);
assert.deepEqual({ ...preview.decision, expires_at: original.decision.expires_at }, original.decision);
const admitted = new Error("fixture_original_decision_admitted");
await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: original.decision,
  testOwnershipRecoveryStageHook: stage => { assert.equal(stage, "before_effect"); throw admitted; } }), error => error === admitted);`;
  requireThat(syntax(body.statements.slice(0, 6).map(node => node.getText(tree)).join("\n")) === syntax(additions));
  const refusals = `for (const change of [
    { expires_at: new Date(Date.parse(original.decision.expires_at) + 300_000).toISOString() },
    { expected_binding: "0".repeat(64) }, { recovery_source: "0".repeat(64) }, { service_identity: "0".repeat(64) },
  ]) {
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: { ...preview.decision, ...change } }), /decision_stale/);
    assert.equal(f.effects(), 0); assert(!fs.existsSync(f.layout.ownership_recovery_path)); assert(!fs.existsSync(f.layout.lifecycle_lock_path));
  }`;
  requireThat(syntax(body.statements[7].getText(tree)) === syntax(refusals));
  edits.push([body.statements[0].getStart(tree), body.statements[5].end, "const preview = await core.prepareCompanionOwnershipRecovery(f.options);"]);
  edits.push([body.statements[7].getStart(tree), body.statements[7].end, ""]);
  for (const node of nodes(tree, node => T.isCallExpression(node) && node.expression.getText(tree) === "prepareFixtureRecovery")) {
    requireThat(node.arguments.length === 1 && node.arguments[0].getText(tree) === "f.options");
    edits.push([node.expression.getStart(tree), node.expression.end, "core.prepareCompanionOwnershipRecovery"]);
  }
  return syntax(replacements(source, edits));
}

function registration(git, head) {
  const source = at(git, head, suite).toString(), tree = ast(source), T = ts();
  const object = one(nodes(tree, node => T.isObjectLiteralExpression(node) && node.properties.some(property => T.isSpreadAssignment(property) &&
    T.isCallExpression(property.expression) && property.expression.expression.getText(tree) === "rootNode" &&
    property.expression.arguments.length === 1 && T.isStringLiteral(property.expression.arguments[0]) && property.expression.arguments[0].text === FIXTURE_VALIDITY_OWNER)));
  const property = name => one(object.properties.filter(node => T.isPropertyAssignment(node) && node.name.getText(tree) === name)).initializer;
  requireThat(property("timeoutMs").getText(tree).replaceAll("_", "") === "60000" && property("requireNaturalExit").kind === T.SyntaxKind.TrueKeyword);
  const rootNode = one(nodes(tree, node => T.isVariableDeclaration(node) && node.name.getText(tree) === "rootNode"));
  requireThat(syntax(rootNode.getText(tree)) === syntax('rootNode = (...args) => ({ command: process.execPath, args: ["--import", "tsx", ...args], cwd: repoRoot })'));
  // Keep the whole scheduler unchanged, apart from the additive pure reader
  // control. This also preserves unit/darwin selection and every parent bound.
  const controls = nodes(tree, node => T.isObjectLiteralExpression(node) && node.properties.some(property => T.isPropertyAssignment(property) &&
    property.name.getText(tree) === "id" && T.isStringLiteral(property.initializer) && property.initializer.text === "fixture-validity-window-evidence"));
  requireThat(controls.length <= 1);
  if (controls.length) requireThat(syntax("(" + controls[0].getText(tree) + ")") === syntax(`({
    id: "fixture-validity-window-evidence", label: "controlled validity-window evidence and retained-source refusals",
    requirements: ["filesystem", "immutable-fixture-input"],
    ...rootNode("scripts/test-local-canonical-fixture-validity.mjs"), timeoutMs: 30_000, requireNaturalExit: true,
  })`));
  const transformed = T.transform(tree, [context => {
    const visit = node => T.isArrayLiteralExpression(node) ? T.factory.updateArrayLiteralExpression(node,
      node.elements.filter(value => !controls.includes(value)).map(value => T.visitNode(value, visit))) : T.visitEachChild(node, visit, context);
    return node => T.visitNode(node, visit);
  }]);
  try {
    const remaining = treeSyntax(transformed.transformed[0]);
    requireThat(T.isStringLiteral(property("label")));
    return { command, label: property("label").text, bound_ms: 60000, require_natural_exit: true, scheduler_remainder_sha256: digest(remaining) };
  } finally { transformed.dispose(); }
}

export function fixtureValidityWindowSourceEquivalence(git, before, tested, target) {
  requireThat([before, tested, target].every(gitId) && before !== tested);
  git(["merge-base", "--is-ancestor", before, tested]); git(["merge-base", "--is-ancestor", tested, target]);
  requireThat(equal(pathsBetween(git, before, tested), [FIXTURE_VALIDITY_OWNER]));
  requireThat(priorValidityFixtureSyntax(at(git, tested, FIXTURE_VALIDITY_OWNER).toString()) === syntax(at(git, before, FIXTURE_VALIDITY_OWNER).toString()));
  const changed = pathsBetween(git, tested, target);
  requireThat(changed.every(file => supportPaths.has(file)));
  const consumed = consumedPaths.map(file => entry(git, tested, file));
  requireThat(equal(consumed, consumedPaths.map(file => entry(git, target, file))));
  for (const file of [...consumedPaths.filter(file => file !== FIXTURE_VALIDITY_OWNER), ...pinnedPaths])
    requireThat(equal(entry(git, before, file), entry(git, tested, file)) && equal(entry(git, tested, file), entry(git, target, file)));
  const selected = registration(git, tested);
  requireThat(equal(selected, registration(git, before)) && equal(selected, registration(git, target)));
  const patch = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", tested, target, "--"]);
  return { contract: "augnes.fixture-validity-source-equivalence.v1", classification: "git-derived-consumed-source-equivalence",
    predecessor_head: before, observed_head: tested, target_head: target, consumed_sources: consumed,
    pinned_sources: pinnedPaths.map(file => entry(git, tested, file)), registration: selected,
    delta: { paths: changed, bytes: patch.length, sha256: digest(patch) }, limitations: FIXTURE_VALIDITY_LIMITATIONS };
}

const parseRaw = (bytes, ref) => { try { return JSON.parse(bytes(ref, 256 * 1024)); } catch { fail(); } };
const jsonLines = text => text.split(/\r?\n/u).filter(line => line.startsWith("{")).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
function naturalRecord(record, exit, completedAt, finishedAt) {
  const result = record.child, cleanup = record.cleanup;
  requireThat(typeof record.schema === "string" && record.schema.length < 160 && record.deciding === false && record.timeout_ms === 60000 &&
    Date.parse(completedAt) < Date.parse(record.started_at) && Date.parse(record.started_at) <= Date.parse(record.finished_at) && Date.parse(record.finished_at) <= Date.parse(finishedAt) &&
    record.host?.node_version === CANONICAL_NODE_VERSION && record.host.path_node_version === CANONICAL_NODE_VERSION && record.host.operating_system === "macOS" && record.host.architecture === "arm64" &&
    result?.exit_code === exit && result.signal === null && result.timed_out === false && result.cancelled === false && result.spawn_error_code === null &&
    Number.isSafeInteger(result.duration_ms) && result.duration_ms > 0 && result.duration_ms < 60000 && result.exit_observed === true && result.streams_closed === true &&
    result.cleanup_started === true && result.cleanup_completed === true && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit" &&
    cleanup?.settled === true && Array.isArray(cleanup.resources) && cleanup.resources.length > 0 && cleanup.resources.every(value => value.completed === true && value.failure_count === 0 && equal(value.failures, [])) &&
    cleanup.checkout_release?.released === true && cleanup.capacity_release?.released === true && !Object.hasOwn(record, "launcher_error"));
}
function observedSources(record, git, head, observer) {
  requireThat(record.tested_source_head === head && Array.isArray(record.source) && record.source.length === observedPaths.length + (observer ? 1 : 0));
  requireThat(equal(record.source.slice(0, observedPaths.length), observedPaths.map(file => entry(git, head, file))));
  if (observer) {
    const last = record.source.at(-1);
    requireThat(typeof last.path === "string" && last.path.startsWith(".augnes-local-verification/") && !last.path.split("/").includes("..") &&
      last.bytes === observer.length && last.sha256 === digest(observer));
  }
}
function childLog(text, record) {
  const rows = text.split(/\r?\n/u).filter(line => line.includes(" child_result label="));
  const result = record.child;
  requireThat(rows.length === 1 && rows[0].endsWith(` child_result label=${JSON.stringify(result.label)} duration_ms=${result.duration_ms} exit_code=${result.exit_code} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`));
  const summary = one(jsonLines(text).filter(value => Object.hasOwn(value, "result") && Object.hasOwn(value, "settled") && Array.isArray(value.cleanup)));
  requireThat(summary.result === result.exit_code && summary.duration_ms === result.duration_ms && summary.settled === true && equal(summary.cleanup, record.cleanup.resources));
}
function fullCompletion(text, source) {
  const tree = ast(source), T = ts(), names = nodes(tree, node => T.isCallExpression(node) && node.expression.getText(tree) === "run" && T.isStringLiteral(node.arguments[0])).map(node => node.arguments[0].text);
  const rows = jsonLines(text), passed = rows.filter(row => row.scenario && Object.hasOwn(row, "pass"));
  requireThat(names.length === 9 && equal(passed.map(row => row.scenario), names) && passed.every(row => row.pass === true && row.cleanup_complete === true));
  for (const name of names) requireThat(rows.filter(row => row.scenario === name && row.stage === "action_pass").length === 1);
  requireThat(equal(rows.filter(row => row.adverse).map(({ adverse, pass, cleanup_complete }) => ({ adverse, pass, cleanup_complete })),
    ["ui", "bridge", "manager-conflict"].map(adverse => ({ adverse, pass: true, cleanup_complete: true }))));
  requireThat(text.split(/\r?\n/u).filter(line => line === "PASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue").length === 1 &&
    !rows.some(row => row.control || row.stage === "action_fail" || row.pass === false));
}
function controlledCompletion(text, role, mode) {
  const rows = jsonLines(text), selected = one(rows.filter(row => row.control?.selected === true));
  const offset = { backward_one_ms: -1, forward_expired: 300001, backward_beyond_margin: -1001 }[mode];
  const refused = !(role === "candidate" && mode === "backward_one_ms");
  requireThat(selected.location === "guard_after_remainder" && selected.group_role === "supervisor" && selected.ttl_ms === 300000 && selected.refused === refused &&
    selected.control.mode === mode && selected.expiry - selected.control.issued_wall === (role === "prior" ? 300000 : 299000));
  requireThat(equal(selected.samples.map(sample => sample.comparison), mode === "forward_expired" ? ["expiry"] : ["expiry", "future"]));
  requireThat(selected.samples.every(sample => sample.wall === selected.control.issued_wall + offset && sample.refused === (sample.comparison === "expiry" ? selected.expiry <= sample.wall : selected.expiry > sample.wall + selected.ttl_ms)));
  requireThat(rows.filter(row => Array.isArray(row.samples)).every(row => row.samples.every(sample => sample.refused === (sample.comparison === "expiry" ? row.expiry <= sample.wall : row.expiry > sample.wall + row.ttl_ms)) && row.refused === row.samples.some(sample => sample.refused)));
  const name = "lost-state-later-attempt-exit-diagnostic", scenarios = rows.filter(row => row.scenario);
  requireThat(scenarios.every(row => row.scenario === name) && scenarios.filter(row => row.stage === "scenario_start").length === 1 &&
    scenarios.filter(row => row.stage === "fixture_ready").length === 1);
  if (refused) {
    // The retained finally-cleanup owner emits no completion row after a thrown
    // assertion. Do not invent one: the child/resource settlement is checked.
    requireThat(!scenarios.some(row => row.stage === "action_pass" || Object.hasOwn(row, "pass")));
  } else {
    const scenario = one(scenarios.filter(row => Object.hasOwn(row, "pass")));
    requireThat(scenario.pass === true && scenario.cleanup_complete === true && scenarios.filter(row => row.stage === "action_pass").length === 1);
  }
  requireThat(!text.includes("PASS ownership retirement:") && (refused ? text.includes("companion_service_recovery_decision_stale") : text.includes("DIAGNOSTIC selected original later-attempt scenario complete; not whole-suite qualification")));
}

function runnerCall(source, controlled) {
  const tree = ast(source), T = ts();
  const call = one(nodes(tree, node => T.isCallExpression(node) && node.expression.getText(tree) === "runCanonicalChild"));
  requireThat(call.arguments.length === 1 && T.isObjectLiteralExpression(call.arguments[0]));
  const properties = call.arguments[0].properties;
  const prop = name => one(properties.filter(node => T.isPropertyAssignment(node) && node.name.getText(tree) === name)).initializer;
  requireThat(prop("command").getText(tree) === "process.execPath" && prop("timeoutMs").getText(tree) === "60000");
  const args = prop("args"); requireThat(T.isArrayLiteralExpression(args));
  const expected = controlled ? ["--import", "tsx", "--import", null, FIXTURE_VALIDITY_OWNER] : ["--import", "tsx", FIXTURE_VALIDITY_OWNER];
  requireThat(args.elements.length === expected.length && args.elements.every((node, index) => expected[index] === null ?
    T.isCallExpression(node) && node.expression.getText(tree) === "path.join" && T.isStringLiteral(node.arguments.at(-1)) && node.arguments.at(-1).text === "clock-control.mjs" :
    T.isStringLiteral(node) && node.text === expected[index]));
  requireThat(source.includes("buildCanonicalChildEnvironment") && source.includes("acquireCheckoutVerificationOwnership") && source.includes("releaseCheckoutVerificationOwnership") &&
    source.includes("acquireVerificationCapacity") && source.includes("releaseVerificationCapacity"));
}

function failedRegisteredOwner(p, prior, incident, { git, bytes, original, repositoryRoot }) {
  requireThat(keys(incident, ["receipt", "log", "log_identity", "cause"]) && incident.receipt === p.prior_receipt_fingerprint &&
    incident.cause === "UNKNOWN" && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,239}$/u.test(prior.attempt_id ?? ""));
  const phase = one((original.phases ?? []).filter(value => value.id === "unit"));
  requireThat(phase.status === "failure" && phase.command === "npm test" && phase.exit_status === 1 && phase.timed_out === false &&
    phase.cleanup?.completed === true && phase.cleanup.exit_observed === true && phase.cleanup.streams_closed === true &&
    phase.cleanup.remaining_owned_processes === 0 && phase.cleanup.termination_reason === "natural_exit" && phase.log?.truncated === false);
  const raw = bytes(incident.log, 2 * 1024 * 1024), relative = `.augnes-local-verification/logs/${prior.attempt_id}/unit.log`;
  requireThat(phase.log.relative_path === relative && phase.log.bytes === raw.length &&
    equal(incident.log_identity, { relative_path: relative, bytes: raw.length, sha256: digest(raw) }));
  try {
    const file = path.join(repositoryRoot, relative), stat = lstatSync(file);
    requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && !(stat.mode & 0o022) &&
      realpathSync(file) === file && stat.size === raw.length && readFileSync(file).equals(raw));
  } catch { fail(); }
  const lines = raw.toString().split(/\r?\n/u), label = JSON.stringify(registration(git, prior.head).label), prefix = "[canonical:unit] ";
  const start = one(lines.filter(line => line === prefix + "child_start label=" + label + " timeout_ms=60000"));
  const end = one(lines.filter(line => line.startsWith(prefix + "child_result label=" + label + " ")));
  const result = end.match(/ duration_ms=([0-9]+) exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u);
  const span = lines.slice(lines.indexOf(start) + 1, lines.indexOf(end));
  requireThat(result && Number(result[1]) > 0 && Number(result[1]) < 60000 && lines.indexOf(start) < lines.indexOf(end) &&
    span.some(line => line.includes("PublicCompanionServiceError: companion_service_recovery_decision_stale")) &&
    !span.some(line => line.startsWith(prefix + "child_start ")) &&
    equal(lines.filter(line => line.startsWith(prefix + "child_result ") && !line.includes(" exit_code=0 ")), [end]));
}

export function verifyRegisteredFixtureValidityWindow(p, prior, focused, { git, parse, bytes, completedAt, original, repositoryRoot }) {
  const r = focused.regression;
  requireThat(p.commission?.evidence_kind === REGISTERED_FIXTURE_VALIDITY_WINDOW && keys(r, ["kind", "claim", "owner", "incident", "retained", "equivalence"]) &&
    r.kind === REGISTERED_FIXTURE_VALIDITY_WINDOW && r.claim === FIXTURE_VALIDITY_WINDOW_CLAIM && r.owner === FIXTURE_VALIDITY_OWNER &&
    focused.failed_phase === "unit" && equal(focused.input_remedy_resources, []) && focused.implicated_paths?.includes(FIXTURE_VALIDITY_OWNER) &&
    usesDeclaredIntegrationBase(original) &&
    focused.commands?.some(record => record.command === readerCommand && record.tested_source_head === p.head));
  failedRegisteredOwner(p, prior, r.incident, { git, bytes, original, repositoryRoot });
  requireThat(keys(r.retained, ["complete", "controlled"]) && keys(r.retained.complete, ["runner", "result", "stdout"]) &&
    keys(r.retained.controlled, ["runner", "observer", "observations"]));
  const complete = parseRaw(bytes, r.retained.complete.result), corrected = complete.tested_source_head;
  // Raw originals retain their original schema and absent observations. In
  // particular they are never coerced into generic runtime-bound RED/GREEN.
  requireThat(keys(complete, ["schema", "started_at", "timeout_ms", "deciding", "tested_source_head", "command", "source", "host", "child", "cleanup", "finished_at"]) && complete.command === command);
  const derived = fixtureValidityWindowSourceEquivalence(git, prior.head, corrected, p.head);
  requireThat(equal(parse(r.equivalence), derived));
  naturalRecord(complete, 0, completedAt, focused.finished_at); observedSources(complete, git, corrected);
  const text = bytes(r.retained.complete.stdout, 2 * 1024 * 1024).toString();
  runnerCall(bytes(r.retained.complete.runner, 64 * 1024).toString(), false); childLog(text, complete); fullCompletion(text, at(git, corrected, FIXTURE_VALIDITY_OWNER).toString());
  const observer = bytes(r.retained.controlled.observer, 64 * 1024);
  // Shape/identity checks are not a semantic verifier for arbitrary historical
  // capture programs. Independent acceptance must review these exact hash-bound
  // collector/observer sources, including limited intervention and clean launch.
  // Their refs are committed through focused evidence and exact preparation.
  requireThat(observer.length > 0 && observer.toString().includes("registerHooks") && observer.toString().includes("guard_after_remainder") && observer.toString().includes("sampleNow"));
  runnerCall(bytes(r.retained.controlled.runner, 64 * 1024).toString(), true);
  const matrix = [["prior", "backward_one_ms", 1], ["prior", "forward_expired", 1], ["candidate", "backward_one_ms", 0], ["candidate", "backward_beyond_margin", 1]];
  requireThat(Array.isArray(r.retained.controlled.observations) && r.retained.controlled.observations.length === matrix.length);
  let previous = completedAt;
  for (let index = 0; index < matrix.length; index++) {
    const ref = r.retained.controlled.observations[index], [role, mode, exit] = matrix[index];
    requireThat(keys(ref, ["result", "stdout"]));
    const record = parseRaw(bytes, ref.result);
    requireThat(keys(record, ["schema", "started_at", "timeout_ms", "deciding", "synthetic_clock_control", "admissible_regression_witness", "mode", "role", "tested_source_head", "source", "host", "child", "cleanup", "finished_at"]) &&
      record.synthetic_clock_control === true && record.admissible_regression_witness === false && record.mode === mode && record.role === role);
    naturalRecord(record, exit, previous, complete.started_at); observedSources(record, git, role === "prior" ? prior.head : corrected, observer);
    const output = bytes(ref.stdout, 2 * 1024 * 1024).toString(); childLog(output, record); controlledCompletion(output, role, mode);
    previous = record.finished_at;
  }
  // The generic owner separately requires actual final-head focused commands,
  // exact preparation, current input observations, new authority and one-use
  // reservation. This retained development PASS supplies none of those.
  return p.head;
}
