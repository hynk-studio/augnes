import { digest, classifyInputChange, nonFaultInputChange, inputEventIdentity, validBrowserTarget } from "./local-canonical-inputs.mjs";
import { browserConsumersForPhase, validBrowserUse, validPhaseBrowserUse, parseBrowserUseLine, BROWSER_IDENTITY_PREFIX } from "./local-canonical-browser-identity.mjs";

export const BROWSER_REVISION_SCHEMA = "augnes.local-canonical-source-correction.v8";
export const isBrowserRevision = p => p?.schema === BROWSER_REVISION_SCHEMA && p.kind === "reviewed_revision";
const same = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const fail = code => Object.assign(new Error(code), { code });

// The independent contract review and later grant name one opaque commitment
// to the actual evidence, without publishing installation paths or originals.
export function browserReviewTarget(p) {
  return digest({ schema: p.schema, branch: p.branch, base: p.base, head: p.head, tree: p.tree,
    accepted: p.accepted, predecessor: p.prior_receipt_fingerprint, originals: Object.fromEntries(
      ["receipt", "attempt", "completion", "stock"].map(k => [k, p.originals[k].sha256])),
    predecessor_inputs: p.inputs.predecessor_sha256, inputs: p.inputs.identity_sha256,
    source: p.source.sha256, focused: p.focused.sha256 });
}

function coherentPreservation(state, observation) {
  return ["live", "installed_stopped"].includes(state?.status) && state.checkout_relation === "exact" && state.preservation_valid === true &&
    /^sha256:[0-9a-f]{64}$/u.test(state.service_identity ?? "") && sha(state.preservation_binding) &&
    observation?.contract === "augnes.companion-preservation-observation.v2" && observation.samples === 1 &&
    observation.coherent === true && observation.live_identity_valid === true && observation.before_binding === state.preservation_binding &&
    observation.after_binding === observation.before_binding && observation.repository_observation_before === "observed" &&
    observation.repository_observation_after === "observed" && sha(observation.repository_binding_before) &&
    observation.repository_binding_before === observation.repository_binding_after;
}

export function verifyBrowserRevisionPreservation(previous, live) {
  const age = Date.now() - Date.parse(live?.diagnostics?.finished_at);
  if (!coherentPreservation(live?.state, live?.diagnostics) || live.state.service_identity !== previous.service_identity ||
      live.state.status !== previous.status || !(age >= 0 && age <= 60000)) throw fail("revision_current_preservation_unsafe");
}

export function settledBrowserInterruption(r) {
  const a = r?.attempt, i = r?.inputs, c = r?.cleanup, svc = c?.companion_service;
  if (r?.receipt_version !== 4 || a?.source_correction !== null || a.recovery !== null || a.number !== 1 ||
      r.verification_context?.kind !== "isolated-worktree" || r.evidence?.selected_plan !== "full-canonical" || r.evidence.deciding !== false ||
      r.run?.id !== a.attempt_id || a.contract_fingerprint !== i?.fingerprint ||
      r.repository?.branch !== a.branch || r.repository?.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      r.outcome?.disposition !== "safety_violation" || r.outcome.safety !== "blocked" || r.outcome.validity !== "invalid_or_unknown" ||
      r.outcome.execution !== "incomplete_or_failed" || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !same(r.final.reason_codes, ["phase_cancelled", "selected_phases_incomplete", "verification_cancelled"]) ||
      c?.completed !== true || c.remaining_owned_processes !== 0 || !same(c.failure_codes, []) ||
      ![r.checkout_ownership, r.capacity_ownership].every(o => o?.required === true && o.acquired === true && o.released === true && o.failure_code === null) ||
      c.isolated_resources?.prepared !== true || c.isolated_resources.completed !== true || c.isolated_resources.failure_count !== 0 ||
      !same(c.isolated_resources.failures, []) || c.isolated_resources.invocation_id !== r.run.invocation_id || !r.run.invocation_id ||
      r.historical_inputs?.required && (r.historical_inputs.unchanged !== true || r.historical_inputs.completed !== true || !same(r.historical_inputs.failures, [])) ||
      svc?.restored !== true || svc.maintenance_acquired !== false || svc.maintenance_released !== true || svc.scope !== "accepted_checkout_read_only" ||
      !same(svc.before, svc.after) || !["before", "after"].every(side => coherentPreservation(svc[side], svc.observations?.[side])) ||
      !same(i?.secondary_faults, []) || !same(i.first_fault, r.outcome.first_fault) ||
      !Array.isArray(i.resources) || new Set(i.resources.map(v => v.id)).size !== i.resources.length || !Array.isArray(i.events) || i.events.length >= 64) return null;

  const resource = i.resources.find(v => v.id === "browser-executable");
  if (!resource || resource.classification !== "execution" || resource.readOnlyExecutable !== true || !sha(resource.location_fingerprint)) return null;
  let replacement = null;
  for (const e of i.events) {
    const role = i.resources.find(v => v.id === e.resource);
    if (!role || e.diagnostic !== undefined || e.classification !== role.classification || e.identity !== inputEventIdentity(e) ||
        classifyInputChange(role.before, e.after, role, i) !== e.disposition) return null;
    if (nonFaultInputChange(e.disposition)) continue;
    if (replacement || role !== resource || e.disposition !== "safety_violation") return null;
    const b = role.before, n = e.after;
    if (b?.present !== true || n?.present !== true || !sha(b.sha256) || !sha(n.sha256) || b.sha256 === n.sha256 ||
        b.metadata.inode === n.metadata.inode || b.permission_identity !== n.permission_identity || b.executable_identity_policy !== n.executable_identity_policy ||
        ["device","mode","uid","gid"].some(k => b.metadata[k] !== n.metadata[k]) ||
        !/^\d+$/u.test(e.monotonic_ns) || !Number.isFinite(Date.parse(e.observed_at)) ||
        !same(i.first_fault, { resource: e.resource, disposition: e.disposition, observed_at: e.observed_at, monotonic_ns: e.monotonic_ns })) return null;
    replacement = e;
  }
  if (!replacement || !Array.isArray(r.phases)) return null;
  const failed = r.phases.findIndex(p => p.status === "failure"), versions = new Set();
  for (const [index, p] of r.phases.entries()) {
    const records = p.browser_use ?? [], expected = browserConsumersForPhase(p.id);
    if (!Array.isArray(records) || (index > failed && records.length) ||
        (index < failed && !validPhaseBrowserUse(p, records, resource)) ||
        records.some(v => !validBrowserUse(v, resource) || !Object.hasOwn(expected, v.consumer)) ||
        Object.entries(expected).some(([name, max]) => records.filter(v => v.consumer === name).length > max)) return null;
    records.forEach(v => versions.add(v.actual_version));
  }
  if (versions.size > 1) return null;
  if (failed < 0 || !r.phases.every((p, index) => {
    if (index > failed) return p.status === "not_run" && p.failure_code === "phase_not_run" && p.exit_status === null;
    const l = p.cleanup;
    if (l?.completed !== true || l.remaining_owned_processes !== 0 || l.exit_observed !== true || l.streams_closed !== true ||
        !(l.listener_residue_count === 0 || l.listener_residue_count === null) || p.timed_out !== false) return false;
    if (index < failed) return p.status === "pass" && p.failure_code === null && p.exit_status === 0 && l.termination_reason === "natural_exit";
    const t = Date.parse(replacement.observed_at);
    return p.failure_code === "phase_cancelled" && l.termination_reason === "operator_cancelled" &&
      t >= Date.parse(p.started_at) && t <= Date.parse(p.finished_at);
  })) return null;
  return { resource, replacement, phase: r.phases[failed].id };
}

// Non-reserving evidence reader. The admission owner also compares these exact
// artifact bytes to the append-only ledger and authenticates both review/grant.
export function browserPredecessorEvidence(r, attempt, completion, stock) {
  const incident = settledBrowserInterruption(r);
  const { integrity, ...unsigned } = r;
  if (!incident || !same(r.attempt, attempt) || digest(unsigned) !== integrity?.content_fingerprint ||
      completion?.contract !== attempt.contract || completion.attempt_id !== attempt.attempt_id || completion.receipt_fingerprint !== integrity.content_fingerprint ||
      completion.cleanup_complete !== true || completion.infrastructure_code !== null || completion.disposition !== "safety_violation" ||
      !(Date.parse(completion.finished_at) >= Date.parse(r.run.finished_at)) ||
      stock?.content_fingerprint !== integrity.content_fingerprint || stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      !same(stock.dimensions, { historical_integrity:"intact", execution:"incomplete_or_failed", evidence_validity:"invalid_or_incomplete", safety:"blocked", current_merge_applicability:"blocked" }))
    throw fail("revision_browser_predecessor_invalid");
  const unfinished = r.phases.filter(p => p.status !== "pass");
  const consequences = new Set(["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding", ...(unfinished.some(p => p.status === "not_run") ? ["receipt_phase_environment_binding_invalid"] : []),
    ...unfinished.map(p => "phase_not_passing:" + p.id), "receipt_browser_identity_invalid:" + incident.phase]);
  if (!Array.isArray(stock.issues) || !stock.issues.includes("receipt_input_observation_blocked") ||
      !unfinished.every(p => stock.issues.includes("phase_not_passing:" + p.id)) || stock.issues.some(code => !consequences.has(code)))
    throw fail("revision_browser_stock_unaccounted");
  return incident;
}

export function verifyBrowserRemedy(incident, target, phase, logs, witness) {
  if (!validBrowserTarget(target) || target.executable.location_fingerprint === incident.resource.location_fingerprint ||
      !Array.isArray(logs) || !logs.length || logs.length > 8 ||
      !Object.keys(browserConsumersForPhase(phase)).length ||
      (Object.keys(browserConsumersForPhase(incident.phase)).length && phase !== incident.phase))
    throw fail("revision_browser_remedy_invalid");
  if (witness?.full_bundle_sha256 !== target.installation.manifest_sha256 || witness.entries !== target.installation.entries ||
      witness.bytes !== target.installation.bytes) throw fail("revision_browser_focused_installation_mismatch");
  const records = logs.flatMap(log => log.toString("utf8").split(/\r?\n/u).filter(line => line.startsWith(BROWSER_IDENTITY_PREFIX)).map(parseBrowserUseLine));
  if (!validPhaseBrowserUse({ id: phase }, records, { location_fingerprint: target.executable.location_fingerprint,
    before: target.executable.observation, actual_version: target.actual_version })) throw fail("revision_browser_consumers_invalid");
  return records.length;
}

export function browserBindingMatches(input, target) {
  if (!validBrowserTarget(target)) return false;
  const only = id => input.resources.filter(r => r.id === id);
  const apps = only("browser-installation"), exes = only("browser-executable"), [app] = apps, [exe] = exes;
  return apps.length === 1 && exes.length === 1 &&
    app.protectedInstallation === true && app.classification === "execution" && app.location_fingerprint === target.installation.location_fingerprint &&
    same(app.before, target.installation) && exe.classification === "execution" && exe.readOnlyExecutable === true &&
    exe.location_fingerprint === target.executable.location_fingerprint && same(exe.before, target.executable.observation) &&
    input.binding?.environment_keys?.includes("AUGNES_BROWSER_EXECUTABLE_PATH");
}
