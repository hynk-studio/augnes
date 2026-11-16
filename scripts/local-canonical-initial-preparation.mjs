import path from "node:path";
import { digest, INPUT_CONTRACT, inputEventIdentity, classifyInputChange, validCanonicalRuntimeInputs } from "./local-canonical-inputs.mjs";
import { validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";

// A preparation discriminator, not a product repair, recovery invocation or
// retrospective exception to the ordinary receipt/stock readers.
export const ORDINARY_INITIAL_PREPARATION = "ordinary-initial-runtime-settlement-v1";
export const ORDINARY_INITIAL_HISTORY = "The original INITIAL consumption remains one, recovery consumption remains zero, and the failed receipt, false stock, incomplete cleanup and UNKNOWN historical cause remain unchanged.";
export const ORDINARY_INITIAL_TEST_REGISTRATION = `    {
      id: "local-canonical-initial-preparation",
      label: "ordinary initial preparation controls with immutable failure history",
      ...rootNode("scripts/test-local-canonical-initial-preparation.mjs"),
      timeoutMs: 30_000,
      requireNaturalExit: true,
    },
`;

export const isOrdinaryInitialPreparationRevision = p =>
  p?.schema === "augnes.local-canonical-source-correction.v7" && p.kind === "reviewed_revision" &&
  p.commission?.preparation_revision === ORDINARY_INITIAL_PREPARATION;

const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
const commit = value => typeof value === "string" && /^[a-f0-9]{40}$/u.test(value);
const keys = (value, names) => !!value && typeof value === "object" && !Array.isArray(value) &&
  equal(Object.keys(value).sort(), names.split(" ").sort());
const time = value => typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && Number.isFinite(Date.parse(value));
const finite = value => Number.isSafeInteger(value) && value >= 0;
const relative = value => typeof value === "string" && value.length > 0 && value.length <= 4096 &&
  !path.isAbsolute(value) && !value.split("/").some(p => !p || p === "." || p === "..") && !/[\x00-\x1f\x7f\\]/u.test(value);
const absolute = value => typeof value === "string" && value.length <= 4096 && path.isAbsolute(value) &&
  path.resolve(value) === value && !/[\x00-\x1f\x7f]/u.test(value);
const ref = value => keys(value, "artifact sha256") && /^[a-z0-9_-]+\.(?:json|log)$/u.test(value.artifact ?? "") && sha(value.sha256);
const fail = suffix => { const code = "revision_ordinary_initial_" + suffix; throw Object.assign(new Error(code), { code }); };
const requireThat = (value, code) => { if (!value) fail(code); };
const after = (value, before) => time(value) && time(before) && Date.parse(value) > Date.parse(before);
const natural = (result, code) => result?.exit_code === code && result.signal === null && result.timed_out === false &&
  result.cancelled === false && result.spawn_error_code === null && result.exit_observed === true &&
  result.streams_closed === true && result.cleanup_completed === true && result.remaining_owned_processes === 0 &&
  result.termination_reason === "natural_exit" && finite(result.duration_ms) && result.duration_ms > 0;
const checked = new WeakMap();

// The enclosing v7 owner still checks its complete ordinary keys, accepted
// source, refs, authenticated authority and exclusive physical succession.
export function ordinaryInitialProofShape(p) {
  const c = p?.commission;
  return isOrdinaryInitialPreparationRevision(p) && c.ordinal === 1 && c.maximum_invocations === 1 &&
    ["route", "input_revision", "input_acquisition", "source_revision", "evidence_kind", "allowance_case", "inherited_serial", "forward_decision", "initial_authorization", "initial_accepted"]
      .every(k => !Object.hasOwn(c, k)) &&
    p.prior_number === 1 && c.root_number === 1 && c.root_family_id === p.prior_family_id &&
    c.root_attempt_id === p.prior_attempt_id && c.root_receipt_fingerprint === p.prior_receipt_fingerprint &&
    sha(p.inputs?.inventory_sha256) && sha(p.settlement?.sha256) &&
    p.accepted?.head === p.head && p.accepted.tree === p.tree && p.accepted.base === p.base &&
    !p.authorization?.settlement_review && !p.authorization?.contract_review;
}

const supportPaths = new Set([
  "scripts/local-canonical-initial-preparation.mjs", "scripts/test-local-canonical-initial-preparation.mjs",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-git-observation.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/prepare-local-canonical-material-source.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-canonical-test-suite.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md",
  "scripts/test-local-canonical-executor.mjs",
]);
const nativePaths = Object.freeze([
  "plugins/augnes-operator/mcp/companion-service-core.mjs", "scripts/augnes-companion-service.mjs",
  "scripts/test-companion-service-native.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/canonical-child-runner.mjs",
  "scripts/canonical-test-environment.mjs", "scripts/test-harness-process-lifecycle.mjs", "scripts/companion-service-fixture-observation.mjs",
]);

function readRef(reference, bytes, maximum = 2 * 1024 * 1024) {
  requireThat(ref(reference), "artifact_invalid");
  const value = bytes(reference, maximum);
  requireThat(Buffer.isBuffer(value) && value.length <= maximum && digest(value) === reference.sha256, "artifact_invalid");
  return value;
}
function jsonRef(reference, parse, bytes, maximum) {
  // parse(ref) in the generic owner has a smaller default bound. Read this
  // selected original explicitly through its existing bounded byte reader.
  return JSON.parse(readRef(reference, bytes, maximum));
}
function plain(reference, bytes, maximum) {
  const raw = readRef(reference, bytes, maximum), text = raw.toString("utf8");
  requireThat(Buffer.from(text).equals(raw), "artifact_invalid");
  return text;
}

function sourceDelta(git, from, to) {
  const raw = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", from, to, "--"]);
  const paths = git(["diff", "--name-only", from, to, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  return { bytes: raw.length, sha256: digest(raw), paths };
}
function blob(git, head, name) {
  const entry = git(["ls-tree", "-z", head, "--", name]).toString();
  if (!entry) return null;
  requireThat(entry.split("\0").filter(Boolean).length === 1 && entry.startsWith("100644 blob ") && entry.endsWith("\t" + name + "\0"), "source_manifest_invalid");
  const bytes = git(["show", `${head}:${name}`]);
  return { byte_size: bytes.length, sha256: digest(bytes) };
}
function registrationOnly(before, current) {
  if (before.equals(current)) return true;
  const text = current.toString("utf8");
  return Buffer.from(text).equals(current) && text.split(ORDINARY_INITIAL_TEST_REGISTRATION).length === 2 &&
    Buffer.from(text.replace(ORDINARY_INITIAL_TEST_REGISTRATION, "")).equals(before);
}

function verifySource(p, prior, completion, source, manifest, git) {
  requireThat(keys(manifest, "schema predecessor target delta entries") &&
    manifest.schema === "augnes.local-canonical-ordinary-initial-support-manifest.v1" &&
    equal(manifest.predecessor, { head: prior.head, tree: prior.tree }) && equal(manifest.target, { head: p.head, tree: p.tree }) &&
    commit(p.head) && commit(p.tree) && commit(p.base) && prior.head !== p.head && prior.tree !== p.tree, "source_manifest_invalid");
  const delta = sourceDelta(git, prior.head, p.head);
  requireThat(delta.paths.length > 0 && delta.paths.length <= supportPaths.size && delta.paths.every(name => supportPaths.has(name)) &&
    ["scripts/local-canonical-initial-preparation.mjs", "scripts/test-local-canonical-initial-preparation.mjs", "scripts/local-canonical-attempts.mjs"].every(name => delta.paths.includes(name)) &&
    equal(manifest.delta, delta) && Array.isArray(manifest.entries) && equal(manifest.entries.map(row => row.path), delta.paths) &&
    manifest.entries.every(row => keys(row, "path before after") && equal(row.before, blob(git, prior.head, row.path)) &&
      equal(row.after, blob(git, p.head, row.path)) && row.after !== null && !equal(row.before, row.after)), "source_manifest_invalid");
  requireThat(source?.schema === "augnes.local-canonical-reviewed-revision-source.v1" && source.basis === "implementation_owner_not_independent_review" &&
    equal(source.predecessor_to_final, delta) && equal(source.accepted_to_final, sourceDelta(git, p.head, p.head)) &&
    equal(source.main_to_final, sourceDelta(git, p.base, p.head)) && after(source.reviewed_at, completion.finished_at), "source_manifest_invalid");
  for (const [from, to] of [[prior.head, p.head], [p.base, p.head]]) git(["merge-base", "--is-ancestor", from, to]);
  for (const t of [p, prior]) requireThat(git(["rev-parse", `${t.head}^{tree}`]).toString().trim() === t.tree, "source_manifest_invalid");
  for (const name of nativePaths) {
    const before = git(["show", `${prior.head}:${name}`]), current = git(["show", `${p.head}:${name}`]);
    requireThat(name === "scripts/run-canonical-test-suite.mjs" ? registrationOnly(before, current) : before.equals(current), "native_source_coverage_gap");
  }
}

function phaseCleanup(phase) {
  return phase.cleanup?.completed === true && phase.cleanup.remaining_owned_processes === 0 && phase.cleanup.exit_observed === true &&
    phase.cleanup.streams_closed === true && phase.cleanup.termination_reason === "natural_exit";
}
function expectedStock(phases) {
  return [...phases.slice(8).map(id => "phase_not_passing:" + id), "receipt_classified_outcome_not_passing", "receipt_cleanup_incomplete",
    "receipt_companion_scope_invalid", "receipt_companion_service_not_restored", "receipt_final_result_not_pass", "receipt_input_event_invalid",
    "receipt_input_observation_blocked", "receipt_non_deciding", "receipt_phase_environment_binding_invalid"].sort();
}

function verifyOriginal(p, r, prior, completion, stock, phases) {
  const content = { ...r }; delete content.integrity;
  const i = r.inputs, service = r.cleanup?.companion_service;
  requireThat(r.receipt_version === 4 && digest(content) === r.integrity?.content_fingerprint &&
    r.integrity.content_fingerprint === p.prior_receipt_fingerprint && equal(r.attempt, prior) && prior.number === 1 &&
    prior.contract === "augnes.local-canonical-attempt-family.v1" && prior.source_correction === null && prior.recovery === null &&
    prior.prior_attempt_id === null && prior.prior_receipt_fingerprint === null && equal(prior.budget, { initial: 1, recovery: 1 }) &&
    prior.family_id === p.prior_family_id && prior.attempt_id === p.prior_attempt_id && prior.head === r.repository?.head_sha &&
    prior.tree === r.repository.tree_sha && prior.branch === r.repository.branch && r.run?.id === prior.attempt_id &&
    r.repository.repository_id === "hynk-studio/augnes" && r.repository.origin === "https://github.com/hynk-studio/augnes.git" &&
    r.repository.worktree_before === "clean" && r.repository.worktree_after === "clean" &&
    r.verification_context?.kind === "isolated-worktree" && r.evidence?.selected_plan === "full-canonical" && r.evidence.deciding === false &&
    r.final?.result === "failure" && r.final.exit_status === 1 &&
    equal(r.final.reason_codes, ["companion_service_not_restored", "phase_failed", "selected_phases_incomplete"]) &&
    r.outcome?.disposition === "safety_violation" && r.outcome.safety === "blocked" &&
    r.outcome.execution === "incomplete_or_failed" && r.outcome.validity === "invalid_or_unknown" &&
    r.environment?.node?.actual_version === CANONICAL_NODE_VERSION && r.environment.npm_version === "11.16.0" &&
    completion?.contract === prior.contract && completion.attempt_id === prior.attempt_id && completion.receipt_fingerprint === p.prior_receipt_fingerprint &&
    completion.cleanup_complete === false && completion.infrastructure_code === null && completion.disposition === "safety_violation" &&
    time(r.run.started_at) && time(r.run.finished_at) && Date.parse(r.run.finished_at) > Date.parse(r.run.started_at) &&
    time(completion.finished_at) && Date.parse(completion.finished_at) >= Date.parse(r.run.finished_at), "predecessor_invalid");
  requireThat(r.cleanup?.completed === false && r.cleanup.remaining_owned_processes === 0 && r.cleanup.isolated_resources?.completed === true &&
    r.checkout_ownership?.acquired === true && r.checkout_ownership.released === true && r.capacity_ownership?.acquired === true && r.capacity_ownership.released === true &&
    equal(r.cleanup.failure_codes, ["companion_service_not_restored"]) && service?.restored === false && service.scope === "accepted_checkout_read_only" &&
    service.maintenance_acquired === false && service.maintenance_released === true &&
    service.before?.status === "installed_stopped" && service.after?.status === "live" &&
    [service.before, service.after].every(s => s.checkout_relation === "exact" && s.preservation_valid === true && sha(s.preservation_binding)) &&
    service.before.service_identity === service.after.service_identity && service.before.preservation_binding !== service.after.preservation_binding &&
    service.observations?.before?.coherent === true && service.observations.before.live_identity_valid === true &&
    safeLive({ state: service.after, diagnostics: service.observations?.after }), "predecessor_unsettled");
  requireThat(Array.isArray(phases) && phases.length === 16 && phases[8] === "operability" &&
    equal(r.phases?.map(v => v.id), phases), "phases_invalid");
  const environments = i?.binding?.phase_environment_fingerprints;
  requireThat(Array.isArray(environments) && equal(environments.map(v => v?.id), phases) &&
    environments.every(v => keys(v, "id fingerprint") && sha(v.fingerprint)), "phases_invalid");
  let previous = Date.parse(r.run.started_at);
  const browser = i?.resources?.find(v => v.id === "browser-executable");
  for (const [index, phase] of r.phases.entries()) {
    const expected = index < 8 ? "pass" : index === 8 ? "failure" : "not_run";
    // Retain this ordinary writer's exact source-binding shape. The nine
    // executed records contain null source fields; the unexecuted records keep
    // their declared source and omit their unobserved environment. This does
    // not repair those records or suppress the original strict stock issue.
    requireThat(phase.status === expected && phase.head_sha === (index <= 8 ? null : prior.head) &&
      phase.base_sha === (index <= 8 ? null : r.repository.base_sha) && phase.invocation_id === r.run.invocation_id &&
      phase.timed_out === false, "phases_invalid");
    if (index <= 8) {
      requireThat(phase.exit_status === (index < 8 ? 0 : 1) && phase.failure_code === (index < 8 ? null : "phase_failed") &&
        phase.environment_fingerprint === environments[index].fingerprint &&
        phaseCleanup(phase) && finite(phase.duration_ms) && phase.duration_ms > 0 && time(phase.started_at) && time(phase.finished_at) &&
        Date.parse(phase.started_at) >= previous && Date.parse(phase.finished_at) >= Date.parse(phase.started_at) &&
        Date.parse(phase.finished_at) <= Date.parse(r.run.finished_at) && validPhaseBrowserUse(phase, phase.browser_use, browser), "phases_invalid");
      previous = Date.parse(phase.finished_at);
    } else requireThat(phase.exit_status === null && phase.failure_code === "phase_not_run" && phase.started_at === null && phase.finished_at === null &&
      phase.duration_ms === null && phase.cleanup?.completed === false && phase.cleanup.remaining_owned_processes === null &&
      !Object.hasOwn(phase, "environment_fingerprint") && (phase.browser_use === undefined || equal(phase.browser_use, [])), "phases_invalid");
  }
  requireThat(r.phases[8].command === "npm run test:operability" && r.phases[8].cwd_scope === "root", "phases_invalid");
  requireThat(i?.contract === INPUT_CONTRACT && i.path_kind === "isolated-model-free-v1" && Array.isArray(i.resources) &&
    new Set(i.resources.map(v => v.id)).size === i.resources.length &&
    digest({ contract: i.contract, path_kind: i.path_kind, binding: i.binding, resources: i.resources }) === i.fingerprint &&
    i.fingerprint === prior.contract_fingerprint && i.binding?.head === prior.head && i.binding.tree === prior.tree &&
    equal(i.secondary_faults, []) && equal(i.first_fault, r.outcome.first_fault) && Array.isArray(i.events) && i.events.length > 0 && i.events.length < 64,
  "observations_invalid");
  let last = -1n, fault = null;
  for (const event of i.events) {
    requireThat(/^\d+$/u.test(event.monotonic_ns ?? "") && BigInt(event.monotonic_ns) > last && time(event.observed_at) &&
      Date.parse(event.observed_at) >= Date.parse(r.run.started_at) && Date.parse(event.observed_at) <= Date.parse(r.run.finished_at), "observations_invalid");
    last = BigInt(event.monotonic_ns);
    if (event.resource === "installed_service_change") {
      const identity = { ...event }; delete identity.identity;
      requireThat(!fault && keys(event, "resource classification disposition observed_at monotonic_ns after identity") &&
        event.classification === "safety" && event.disposition === "safety_violation" && event.after === null && digest(identity) === event.identity,
      "observations_invalid");
      fault = event;
    } else {
      const resource = i.resources.find(v => v.id === event.resource);
      requireThat(resource?.id === "browser-executable" && resource.classification === "execution" && event.classification === resource.classification &&
        event.disposition === "incidental_executable_metadata" && event.diagnostic === undefined && event.identity === inputEventIdentity(event) &&
        classifyInputChange(resource.before, event.after, resource, i) === event.disposition, "observations_invalid");
    }
  }
  requireThat(fault && equal(i.first_fault, { resource: fault.resource, disposition: fault.disposition, observed_at: fault.observed_at, monotonic_ns: fault.monotonic_ns }), "observations_invalid");
  const issues = expectedStock(phases);
  requireThat(stock?.valid_deciding_evidence === false && stock.status === "non_deciding_or_stale" && stock.content_fingerprint === p.prior_receipt_fingerprint &&
    equal(stock.issues, issues) && issues.length === 17 && equal(stock.dimensions, { execution: "incomplete_or_failed", historical_integrity: "intact",
      evidence_validity: "invalid_or_incomplete", safety: "blocked", current_merge_applicability: "matches_observed_context" }), "stock_invalid");
  return { service, issues };
}

function safeLive(observation) {
  const { state: s, diagnostics: d } = observation ?? {};
  const stableManager = m => m && Object.fromEntries(Object.entries(m).filter(([k]) => k !== "updated_at"));
  const probes = o => equal(o, { ui_health: true, bridge_health: true, ui_ownership: true, bridge_ownership: true });
  return s?.status === "live" && s.checkout_relation === "exact" && s.preservation_valid === true &&
    /^sha256:[a-f0-9]{64}$/u.test(s.service_identity ?? "") && sha(s.preservation_binding) &&
    d?.contract === "augnes.companion-preservation-observation.v2" && d.coherent === true && d.live_identity_valid === true &&
    time(d.started_at) && time(d.finished_at) && Date.parse(d.finished_at) >= Date.parse(d.started_at) &&
    d.before_binding === s.preservation_binding && d.after_binding === s.preservation_binding &&
    d.repository_observation_before === "observed" && d.repository_observation_after === "observed" && sha(d.repository_binding_before) &&
    d.repository_binding_before === d.repository_binding_after && d.material_states?.maintenance_lease_path === "missing" &&
    ["configuration_path", "desired_state_path", "manager_state_path", "manager_lock_path", "runtime_manifest_path", "runtime_token_path", "runtime_access_path", "runtime_lock_path"]
      .every(k => d.material_states?.[k] === "valid") && d.runtime?.verified === true && probes(d.runtime.probe_valid) && probes(d.runtime.probe_available) &&
    equal(stableManager(d.manager_before), stableManager(d.manager_after)) && d.manager_after?.status === "live" &&
    Number.isSafeInteger(d.manager_after.manager_pid) && d.manager_after.manager_pid > 0 && Number.isSafeInteger(d.manager_after.supervisor_pid) && d.manager_after.supervisor_pid > 0 &&
    sha(d.manager_after.manager_process_identity) && sha(d.manager_after.supervisor_process_identity) &&
    typeof d.manager_after.generation_id === "string" && !!d.manager_after.generation_id && typeof d.manager_after.instance_id === "string" && !!d.manager_after.instance_id &&
    d.runtime.generation_id === d.manager_after.generation_id && d.runtime.instance_id === d.manager_after.instance_id &&
    d.runtime.supervisor_pid === d.manager_after.supervisor_pid && d.loaded_job?.pid === d.manager_after.manager_pid && sha(d.loaded_job.fingerprint);
}
function liveIdentity(observation) {
  const d = observation.diagnostics, m = d.manager_after;
  return { state: observation.state, repository: d.repository_binding_after, generation: m.generation_id, instance: m.instance_id,
    manager: [m.manager_pid, m.manager_process_identity], supervisor: [m.supervisor_pid, m.supervisor_process_identity],
    restarts: m.restart_count, job: d.loaded_job, material: d.material_states };
}

function verifyNativeFailure(focused, original, parse, bytes) {
  const n = focused.native_failure, phase = original.phases[8];
  requireThat(keys(n, "phase log manager_pid node_executable") && n.phase === "operability" && Number.isSafeInteger(n.manager_pid) && n.manager_pid > 0 && absolute(n.node_executable), "native_failure_invalid");
  const logBytes = readRef(n.log, bytes), log = logBytes.toString("utf8"), lines = log.split("\n");
  requireThat(logBytes.length === phase.log?.bytes && phase.log.truncated === false &&
    phase.log.relative_path === `.augnes-local-verification/logs/${original.run.id}/operability.log` &&
    digest(n.node_executable) === original.inputs.resources.find(v => v.id === "node-executable")?.location_fingerprint, "native_failure_invalid");
  const results = lines.filter(line => line.startsWith("[canonical:operability] child_result "));
  const failures = results.filter(line => !line.includes(" exit_code=0 "));
  requireThat(failures.length === 1 && /^\[canonical:operability\] child_result label="machine-owned macOS Companion service lifecycle and cleanup" duration_ms=[1-9]\d* exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(failures[0]) &&
    results.every(line => !line.includes("timed_out=true") && line.includes("cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit")), "native_failure_invalid");
  const assertions = lines.filter(line => line.startsWith("AssertionError [ERR_ASSERTION]: "));
  requireThat(assertions.length === 1, "native_failure_invalid");
  let assertion; try { assertion = JSON.parse(assertions[0].slice("AssertionError [ERR_ASSERTION]: ".length)); } catch { fail("native_failure_invalid"); }
  requireThat(equal(assertion, { exit_status: 1, signal: null, streams_closed: true, spawn_error_code: null,
    refusal: { state: "available", result: "refused", reason: "companion_service_manager_state_unavailable", cleanup_failed: false }, manager: { state: "absent" } }) &&
    lines.some(line => line.includes("/scripts/test-companion-service-native.mjs:") && /:\d+:\d+$/u.test(line.trim())), "native_failure_invalid");
  const observations = lines.filter(line => line.startsWith('{"case":"native-install-observation"')).map(line => JSON.parse(line));
  requireThat(observations.some(row => row.observation?.manager?.state === "absent" && row.observation.job?.pid === n.manager_pid &&
    row.observation.job.state === "available" && row.observation.job.job_state === "running" && row.observation.process?.state === "present" &&
    row.observation.node_matches === true && row.observation.entry_matches === true && row.observation.cwd_matches === true), "native_failure_invalid");
  const permission = jsonRef(focused.permission_diagnostic, parse, bytes);
  // The retained record's started_at was written after its query. It is only
  // collection metadata here; source event times/window and non-exclusive
  // historical attribution remain subject to the receiving evidence audit.
  requireThat(permission.exit_code === 0 && typeof permission.stdout === "string" && permission.stderr === "" &&
    permission.stdout.includes(n.node_executable) && permission.stdout.includes("pid=" + n.manager_pid) &&
    permission.stdout.includes("kTCCServiceSystemPolicyAllFiles") && permission.stdout.includes("Auth Right: Denied (Service Policy)") &&
    permission.stdout.includes("kTCCServiceSystemPolicyDocumentsFolder") && permission.stdout.includes("AUTHREQ_PROMPTING") &&
    Array.isArray(permission.command) && equal(permission.command.slice(0, 2), ["/usr/bin/log", "show"]) &&
    after(permission.started_at, original.run.finished_at), "permission_provenance_invalid");
}

function componentOrder(a, b) {
  const x = a.path.split("/"), y = b.path.split("/");
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return x.length - y.length;
}
function verifyRuntime(p, focused, original, inputs, inventory, parse, bytes) {
  requireThat(validCanonicalRuntimeInputs(inputs) && digest(inputs) === p.inputs.identity_sha256, "runtime_invalid");
  const copy = jsonRef(focused.runtime_relocation, parse, bytes), launch = jsonRef(focused.launcher_resolution, parse, bytes);
  requireThat(absolute(copy.source) && absolute(copy.target) && copy.source !== copy.target &&
    copy.source.split(path.sep).includes("Documents") && !copy.target.split(path.sep).includes("Documents") &&
    copy.all_entries_identical === true && copy.source_preserved === true && after(copy.recorded_at, original.run.finished_at) &&
    Array.isArray(copy.catalog) && copy.catalog.length > 0 && copy.catalog.length <= 16384 && copy.entries === copy.catalog.length &&
    new Set(copy.catalog.map(v => v.path)).size === copy.catalog.length && copy.catalog.every(row => relative(row.path) &&
      (row.type === "file" ? finite(row.bytes) && sha(row.sha256) && finite(row.mode) && !(row.mode & 0o022) :
        row.type === "symlink" && typeof row.target === "string" && !path.isAbsolute(row.target) &&
        path.resolve(copy.target, path.dirname(row.path), row.target).startsWith(copy.target + path.sep))) &&
    copy.file_bytes === copy.catalog.filter(row => row.type === "file").reduce((n, row) => n + row.bytes, 0), "runtime_relocation_invalid");
  const row = name => copy.catalog.find(v => v.path === name), node = row("bin/node"), npm = row("lib/node_modules/npm/bin/npm-cli.js");
  const before = original.inputs.resources.find(v => v.id === "node-executable"), beforeNpm = original.inputs.resources.find(v => v.id === "npm-executable");
  const targetNode = path.join(copy.target, "bin/node"), targetHeaders = path.join(copy.target, "include/node"),
    targetNpm = path.join(copy.target, "lib/node_modules/npm/bin/npm-cli.js");
  const headerRows = copy.catalog.filter(v => v.type === "file" && v.path.startsWith("include/node/"))
    .map(v => ({ path: v.path.slice("include/node/".length), sha256: v.sha256 })).sort(componentOrder);
  requireThat(node?.type === "file" && npm?.type === "file" && node.sha256 === before?.before?.sha256 && node.bytes === Number(before.before.metadata.bytes) &&
    npm.sha256 === beforeNpm?.before?.sha256 && npm.bytes === Number(beforeNpm.before.metadata.bytes) &&
    before.location_fingerprint === digest(path.join(copy.source, "bin/node")) && beforeNpm.location_fingerprint === digest(path.join(copy.source, "lib/node_modules/npm/bin/npm-cli.js")) &&
    inputs.node.location_fingerprint === digest(targetNode) && inputs.node.observation.sha256 === node.sha256 && Number(inputs.node.observation.metadata.bytes) === node.bytes &&
    inputs.headers.location_fingerprint === digest(targetHeaders) && headerRows.length > 0 && digest(headerRows) === inputs.headers.observation.content_sha256 &&
    copy.catalog.filter(v => v.type === "file" && v.path.startsWith("include/node/")).reduce((n, v) => n + v.bytes, 0) === inputs.headers.observation.bytes &&
    row("bin/npm")?.type === "symlink" && row("bin/npm").target === "../lib/node_modules/npm/bin/npm-cli.js", "runtime_relocation_invalid");
  const currentNpm = inventory.resources.filter(v => v.id === "npm-executable");
  requireThat(currentNpm.length === 1 && currentNpm[0].classification === "execution" && currentNpm[0].location_fingerprint === digest(targetNpm) &&
    currentNpm[0].before?.present === true && currentNpm[0].before.sha256 === npm.sha256 &&
    currentNpm[0].before.metadata?.bytes === String(npm.bytes), "current_npm_invalid");
  const l = launch.observed;
  requireThat(launch.exit_code === 0 && launch.npm_version === original.environment.npm_version && launch.offline === true && launch.network_or_registry_request === false &&
    launch.deciding === false && launch.stderr === "" && after(launch.at, copy.recorded_at) &&
    l?.executable === targetNode && l.version === "v" + CANONICAL_NODE_VERSION && l.npm_node_execpath === targetNode &&
    l.npm_execpath === targetNpm && l.child?.executable === targetNode &&
    l.child.version === l.version && l.headers_exist === true && typeof launch.stdout === "string" &&
    launch.stdout.split("\n").some(line => { try { return equal(JSON.parse(line), l); } catch { return false; } }), "launcher_invalid");
  return { copy, launch };
}

function verifyNativeSetup(focused, original, prior, parse, bytes, git) {
  const n = focused.native_setup;
  requireThat(keys(n, "plan diagnostic result sources_before sources_after collector stdout stderr"), "native_setup_invalid");
  const plan = jsonRef(n.plan, parse, bytes), diagnostic = jsonRef(n.diagnostic, parse, bytes), result = jsonRef(n.result, parse, bytes);
  const before = jsonRef(n.sources_before, parse, bytes), afterSources = jsonRef(n.sources_after, parse, bytes);
  const collector = readRef(n.collector, bytes), output = plain(n.stdout, bytes), errors = readRef(n.stderr, bytes);
  const node = original.inputs.resources.find(v => v.id === "node-executable").before;
  requireThat(plan.deciding === false && plan.source_changed === false && plan.production_lifecycle_mutation === false && plan.native_owner_timeout_ms === 240000 &&
    Array.isArray(plan.nodes) && plan.nodes.length === 2 && plan.nodes.every(v => absolute(v.path) && v.realpath === v.path &&
      v.sha256 === node.sha256 && v.bytes === Number(node.metadata.bytes) && v.version === "v" + CANONICAL_NODE_VERSION) &&
    plan.nodes[0].path === focused.native_failure.node_executable && !plan.nodes[1].path.split(path.sep).includes("Documents") &&
    after(plan.observed_at, original.run.finished_at) && before.node === plan.nodes[1].path && before.node_version === plan.nodes[1].version &&
    before.head === prior.head && before.branch === prior.branch && before.origin === original.repository.origin && before.status === "" &&
    equal(before.command, [before.node, "scripts/test-companion-service-native.mjs"]) && before.timeout_ms === 240000 &&
    after(before.at, plan.observed_at) && after(afterSources.at, before.at) && Array.isArray(before.files) && equal(before.files, afterSources.files) &&
    before.files.length === nativePaths.length + 1 && new Set(before.files.map(v => v.path)).size === before.files.length, "native_setup_invalid");
  for (const name of nativePaths) {
    const row = before.files.find(v => v.path === path.join(before.repository, name)), source = git(["show", `${prior.head}:${name}`]);
    requireThat(row?.bytes === source.length && row.sha256 === digest(source), "native_setup_invalid");
  }
  const external = before.files.filter(v => !nativePaths.some(name => v.path === path.join(before.repository, name)));
  requireThat(external.length === 1 && external[0].bytes === collector.length && external[0].sha256 === digest(collector) && errors.length === 0 && output.length > 0 &&
    result.accepted === true && result.failure === null && natural(result.result, 0) && result.result.duration_ms <= 240000 &&
    result.result.label === "test-companion-service-native.mjs" && Array.isArray(result.cleanup) && result.cleanup.length > 0 &&
    result.cleanup.every(row => row.completed === true && row.failure_count === 0 && equal(row.failures, [])) &&
    diagnostic.deciding === false && diagnostic.source_head === prior.head && diagnostic.source_unchanged === true &&
    diagnostic.production_source_unchanged === true && diagnostic.production_binding_unchanged === true && diagnostic.production_observations_coherent === true &&
    equal(diagnostic.probe, result) && equal(diagnostic.production_before, original.cleanup.companion_service.after) &&
    equal(diagnostic.production_after, diagnostic.production_before) && diagnostic.original_Full_npm === original.environment.npm_version &&
    diagnostic.npm_available_in_probe_PATH === "11.19.1" && after(diagnostic.observed_at, afterSources.at), "native_setup_invalid");
  // This is setup support at the original source and its actual npm/PATH. It
  // supplies no current-head or identical-Full execution result.
  return { original_source_head: prior.head, available_npm: diagnostic.npm_available_in_probe_PATH, result };
}

function verifySupportChecks(p, focused, completion, inputs, parse, bytes) {
  requireThat(Array.isArray(focused.support_checks) && focused.support_checks.length > 0 && focused.support_checks.length <= 16, "support_checks_invalid");
  let required = false;
  for (const row of focused.support_checks) {
    requireThat(keys(row, "record stdout"), "support_checks_invalid");
    const record = jsonRef(row.record, parse, bytes), out = readRef(row.stdout, bytes);
    requireThat(record.schema === "augnes.local-canonical-ordinary-initial-support-check.v1" && record.tested_source_head === p.head &&
      record.node_version === CANONICAL_NODE_VERSION && record.node_sha256 === inputs.node.observation.sha256 &&
      typeof record.command === "string" && record.command.length > 0 && record.command.length <= 2000 && natural(record.result, 0) && out.length > 0 &&
      after(record.started_at, completion.finished_at) && after(record.finished_at, record.started_at) &&
      Date.parse(record.finished_at) <= Date.parse(focused.finished_at), "support_checks_invalid");
    required ||= record.command === "node scripts/test-local-canonical-initial-preparation.mjs";
  }
  requireThat(required, "support_checks_invalid");
}

function verifyCoordination(rows, parse, bytes, completion, recordedAt) {
  requireThat(Array.isArray(rows) && rows.length > 0 && rows.length <= 16 && new Set(rows.map(v => v.owner)).size === rows.length, "coordination_invalid");
  const records = rows.map(row => {
    requireThat(keys(row, "owner scope record") && row.scope === "preparation_and_prospective_full_cleanup_stock_window", "coordination_invalid");
    const record = jsonRef(row.record, parse, bytes, 128 * 1024), call = record.tool_call;
    const id = value => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9-]{5,199}$/u.test(value);
    requireThat(record.schema === "task-owned.scoped-task-coordination-source.v1" && row.owner === record.source_thread_id &&
      [record.source_thread_id, record.source_turn_id, record.source_tool_call_id, record.received_in_thread,
        record.authority?.human_thread_id, record.authority?.human_turn_id, record.authority?.human_message_id].every(id) &&
      record.received_in_thread === record.authority.human_thread_id && record.source_thread_id !== record.received_in_thread &&
      record.scope === row.scope && after(record.recorded_at, completion.finished_at) && Date.parse(record.recorded_at) <= Date.parse(recordedAt) &&
      call?.type === "mcpToolCall" && call.id === record.source_tool_call_id && call.server === "codex_app" && call.tool === "send_message_to_thread" &&
      call.status === "completed" && call.arguments?.threadId === record.received_in_thread && call.arguments.hostId === "local" &&
      typeof call.arguments.prompt === "string" && call.arguments.prompt.length > 0 && call.arguments.prompt.length <= 32768 &&
      call.arguments.prompt.includes(record.authority.human_turn_id) && Array.isArray(record.limits) && record.limits.length > 0,
    "coordination_invalid");
    return record;
  });
  requireThat(records.every(record => equal(record.authority, records[0].authority)), "coordination_invalid");
  return records;
}

// All inputs are supplied by the existing bounded artifact/Git owners. This
// reader performs no process, service, Git mutation or authority operation.
export function readOrdinaryInitialPreparationEvidence(p, { original, prior, completion, stock, inputs, source, parse, bytes, git, phases }) {
  requireThat(ordinaryInitialProofShape(p), "proof_invalid");
  const stockLines = plain(p.originals?.stock, bytes).split("\n").filter(line => line.startsWith("{"));
  requireThat(equal(original, jsonRef(p.originals?.receipt, parse, bytes)) && equal(prior, jsonRef(p.originals?.attempt, parse, bytes)) &&
    equal(completion, jsonRef(p.originals?.completion, parse, bytes)) && stockLines.length === 1 && equal(stock, JSON.parse(stockLines[0])) &&
    equal(inputs, jsonRef(p.inputs.current, parse, bytes)) &&
    p.inputs.predecessor_sha256 === digest(original.inputs?.resources?.filter(v => ["node-executable", "node-headers"].includes(v.id))), "originals_invalid");
  const { service, issues } = verifyOriginal(p, original, prior, completion, stock, phases);
  const focused = jsonRef(p.focused, parse, bytes), record = jsonRef(p.settlement, parse, bytes);
  requireThat(keys(focused, "schema basis predecessor_receipt_fingerprint runtime_inputs_sha256 finished_at source_manifest input_inventory native_failure permission_diagnostic runtime_relocation launcher_resolution native_setup support_checks") &&
    focused.schema === "augnes.local-canonical-ordinary-initial-preparation.v1" && focused.basis === "implementation_owner_not_independent_review" &&
    focused.predecessor_receipt_fingerprint === p.prior_receipt_fingerprint && focused.runtime_inputs_sha256 === p.inputs.identity_sha256 &&
    after(focused.finished_at, completion.finished_at), "focused_invalid");
  const sourceRecord = jsonRef(p.source, parse, bytes);
  requireThat(source === undefined || equal(source, sourceRecord), "source_manifest_invalid");
  verifySource(p, prior, completion, sourceRecord, jsonRef(focused.source_manifest, parse, bytes), git);
  const input = jsonRef(focused.input_inventory, parse, bytes);
  requireThat(gitRevisionInventory(input) === p.inputs.inventory_sha256 && input.first_fault === null && equal(input.secondary_faults, []) && equal(input.events, []) &&
    digest({ contract: input.contract, path_kind: input.path_kind, binding: input.binding, resources: input.resources }) === input.fingerprint &&
    (equal(input.binding, {}) || input.binding?.head === p.head && input.binding.tree === p.tree && equal(input.binding.runtime_inputs, inputs)) &&
    ["node", "headers"].every(role => {
      const resource = input.resources.find(v => v.id === (role === "node" ? "node-executable" : "node-headers"));
      return resource?.location_fingerprint === inputs[role].location_fingerprint && equal(resource.before, inputs[role].observation);
    }), "current_inventory_invalid");
  verifyNativeFailure(focused, original, parse, bytes);
  const runtime = verifyRuntime(p, focused, original, inputs, input, parse, bytes);
  const setup = verifyNativeSetup(focused, original, prior, parse, bytes, git);
  verifySupportChecks(p, focused, completion, inputs, parse, bytes);
  requireThat(keys(record, "schema prior_receipt_fingerprint target recorded_at after_state live_observation coordination history") &&
    record.schema === "augnes.local-canonical-ordinary-initial-settlement.v1" && record.prior_receipt_fingerprint === p.prior_receipt_fingerprint &&
    equal(record.target, { base: p.base, head: p.head, tree: p.tree, runtime_inputs_sha256: p.inputs.identity_sha256 }) &&
    after(record.recorded_at, focused.finished_at) && equal(record.after_state, service.after) &&
    equal(record.history, { original_consumed: 1, recovery_consumed: 0, original_cleanup_complete: false, original_stock_issues: issues, qualification: "NOT_RUN" }), "settlement_invalid");
  const saved = jsonRef(record.live_observation, parse, bytes), observation = saved.observation ?? saved;
  requireThat(safeLive(observation) && equal(liveIdentity(observation), liveIdentity({ state: service.after, diagnostics: service.observations.after })) &&
    Date.parse(observation.diagnostics.finished_at) >= Date.parse(completion.finished_at) && Date.parse(observation.diagnostics.finished_at) <= Date.parse(record.recorded_at), "settlement_invalid");
  const coordination = verifyCoordination(record.coordination, parse, bytes, completion, record.recorded_at);
  const ordinaryInitial = { identity: service.after.service_identity, record, liveObservation: observation, coordination,
    inventory: p.inputs.inventory_sha256, runtime, setup, history: ORDINARY_INITIAL_HISTORY, authorized: false, reserved: false };
  checked.set(ordinaryInitial, { record: digest(record), live: digest(liveIdentity(observation)), inventory: p.inputs.inventory_sha256 });
  return { original, prior, completion, stock, inputs, source: sourceRecord, focused, ordinaryInitial };
}

// This is a current observation check, never a lease or execution grant. The
// enclosing owner separately authenticates a new exact execution decision and
// exclusive physical reservation. No caller-supplied settled=true flag works.
export function verifyOrdinaryInitialCurrent(evidence, live, { now = Date.now() } = {}) {
  const value = evidence?.ordinaryInitial ?? evidence, bound = checked.get(value);
  const current = live?.service ?? live?.observation ?? (live?.state ? live : null);
  const observed = live?.observed_at ?? live?.at;
  requireThat(bound && bound.record === digest(value.record) && Number.isFinite(now) &&
    live?.inventory === bound.inventory && equal(live?.foreign_checkout_owners, []) &&
    time(observed) && Date.parse(observed) <= now && now - Date.parse(observed) <= 60_000 && safeLive(current) &&
    Date.parse(current.diagnostics.finished_at) <= now && now - Date.parse(current.diagnostics.finished_at) <= 60_000 &&
    Date.parse(current.diagnostics.finished_at) >= Date.parse(value.record.recorded_at) &&
    digest(liveIdentity(current)) === bound.live, "current_unsafe");
  return { preserved: true, coordination_sha256: digest(value.record.coordination), authorized: false, reserved: false };
}
