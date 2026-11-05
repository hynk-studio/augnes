import { digest, classifyInputChange, nonFaultInputChange, inputEventIdentity, validBrowserTarget } from "./local-canonical-inputs.mjs";
import { browserConsumersForPhase, validBrowserUse, validPhaseBrowserUse, parseBrowserUseLine, BROWSER_IDENTITY_PREFIX } from "./local-canonical-browser-identity.mjs";

export const BROWSER_REVISION_SCHEMA = "augnes.local-canonical-source-correction.v8";
export const BROWSER_SUCCESSOR_SCHEMA = "augnes.local-canonical-source-correction.v9";
export const isBrowserSuccessor = p => p?.schema === BROWSER_SUCCESSOR_SCHEMA && p.kind === "reviewed_revision";
export const isBrowserRevision = p => (p?.schema === BROWSER_REVISION_SCHEMA && p.kind === "reviewed_revision") || isBrowserSuccessor(p);
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
    source: p.source.sha256, focused: p.focused.sha256,
    ...(p.schema === BROWSER_SUCCESSOR_SCHEMA ? { commission: p.commission, pull_request: p.pull_request,
      prior_family_id: p.prior_family_id, prior_number: p.prior_number, prior_attempt_id: p.prior_attempt_id } : {}) });
}

const preservableStates = ["live", "installed_stopped"];
const probeNames = ["ui_health", "bridge_health", "ui_ownership", "bridge_ownership"];

function preservationChecks(state, observation) {
  return {
    supported_state: preservableStates.includes(state?.status),
    exact_checkout: state?.checkout_relation === "exact",
    preservation_valid: state?.preservation_valid === true,
    valid_service_identity: /^sha256:[0-9a-f]{64}$/u.test(state?.service_identity ?? ""),
    valid_state_binding: sha(state?.preservation_binding),
    observation_contract: observation?.contract === "augnes.companion-preservation-observation.v2",
    one_sample: observation?.samples === 1,
    coherent: observation?.coherent === true,
    live_identity_valid: observation?.live_identity_valid === true,
    sample_matches_state: observation?.before_binding === state?.preservation_binding,
    sample_binding_unchanged: observation?.after_binding === observation?.before_binding,
    repository_observed_before: observation?.repository_observation_before === "observed",
    repository_observed_after: observation?.repository_observation_after === "observed",
    valid_repository_binding: sha(observation?.repository_binding_before),
    repository_binding_unchanged: observation?.repository_binding_before === observation?.repository_binding_after,
  };
}

function coherentPreservation(state, observation) {
  return Object.values(preservationChecks(state, observation)).every(Boolean);
}

function boundedState(status) {
  return [...preservableStates, "recovery_required", "not_installed", "starting", "maintenance"].includes(status) ? status : null;
}

function probeFlags(flags) {
  return Object.fromEntries(probeNames.map(name => [name, typeof flags?.[name] === "boolean" ? flags[name] : null]));
}

export function verifyBrowserRevisionPreservation(previous, live) {
  const state = live?.state;
  const observation = live?.diagnostics;
  const evaluated = Date.now();
  const finished = Date.parse(observation?.finished_at);
  const age = evaluated - finished;
  const checks = {
    ...preservationChecks(state, observation),
    same_service: state?.service_identity === previous.service_identity,
    same_state: state?.status === previous.status,
  };
  const failed = Object.keys(checks).filter(name => !checks[name]);
  if (!Number.isFinite(age)) failed.push("observation_time_unavailable");
  else if (age < 0) failed.push("observation_in_future");
  else if (age > 60_000) failed.push("observation_stale");
  if (!failed.length) return;
  // Capture this decision once. Only fixed reason codes, clock values and probe
  // booleans cross the receipt boundary, never the reader's free-form output.
  throw Object.assign(fail("revision_current_preservation_unsafe"), { revisionPreservation: {
    failed_conditions: failed,
    observed_at: Number.isFinite(finished) ? new Date(finished).toISOString() : null,
    evaluated_at: new Date(evaluated).toISOString(),
    age_ms: Number.isFinite(age) ? age : null,
    previous_state: boundedState(previous.status),
    observed_state: boundedState(state?.status),
    state_available: state != null,
    observation_available: observation != null,
    same_service: checks.same_service,
    same_state: checks.same_state,
    coherent: typeof observation?.coherent === "boolean" ? observation.coherent : null,
    probe_available: probeFlags(observation?.runtime?.probe_available),
    probe_valid: probeFlags(observation?.runtime?.probe_valid),
  } });
}

export function settledIsolatedResources(r) {
  const c = r.cleanup, svc = c?.companion_service;
  return c?.completed === true && c.remaining_owned_processes === 0 && same(c.failure_codes, []) &&
    [r.checkout_ownership, r.capacity_ownership].every(o => o?.required === true && o.acquired === true && o.released === true && o.failure_code === null) &&
    c.isolated_resources?.prepared === true && c.isolated_resources.completed === true && c.isolated_resources.failure_count === 0 &&
    same(c.isolated_resources.failures, []) && c.isolated_resources.invocation_id === r.run.invocation_id && Boolean(r.run.invocation_id) &&
    (!r.historical_inputs?.required || (r.historical_inputs.unchanged === true && r.historical_inputs.completed === true && same(r.historical_inputs.failures, []))) &&
    svc?.restored === true && svc.maintenance_acquired === false && svc.maintenance_released === true && svc.scope === "accepted_checkout_read_only" &&
    same(svc.before, svc.after) && ["before", "after"].every(side => coherentPreservation(svc[side], svc.observations?.[side]));
}

export function cancelledPhase(phases, observedAt) {
  const failed = phases.findIndex(p => p.status === "failure");
  if (failed < 0 || !phases.every((p, index) => {
    if (index > failed) return p.status === "not_run" && p.failure_code === "phase_not_run" && p.exit_status === null;
    const l = p.cleanup;
    if (l?.completed !== true || l.remaining_owned_processes !== 0 || l.exit_observed !== true || l.streams_closed !== true ||
        !(l.listener_residue_count === 0 || l.listener_residue_count === null) || p.timed_out !== false) return false;
    if (index < failed) return p.status === "pass" && p.failure_code === null && p.exit_status === 0 && l.termination_reason === "natural_exit";
    const t = Date.parse(observedAt);
    return p.failure_code === "phase_cancelled" && l.termination_reason === "operator_cancelled" &&
      t >= Date.parse(p.started_at) && t <= Date.parse(p.finished_at);
  })) return null;
  return phases[failed].id;
}

export function settledBrowserInterruption(r) {
  const a = r?.attempt, i = r?.inputs;
  if (r?.receipt_version !== 4 || a?.source_correction !== null || a.recovery !== null || a.number !== 1 ||
      r.verification_context?.kind !== "isolated-worktree" || r.evidence?.selected_plan !== "full-canonical" || r.evidence.deciding !== false ||
      r.run?.id !== a.attempt_id || a.contract_fingerprint !== i?.fingerprint ||
      r.repository?.branch !== a.branch || r.repository?.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      r.outcome?.disposition !== "safety_violation" || r.outcome.safety !== "blocked" || r.outcome.validity !== "invalid_or_unknown" ||
      r.outcome.execution !== "incomplete_or_failed" || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !same(r.final.reason_codes, ["phase_cancelled", "selected_phases_incomplete", "verification_cancelled"]) ||
      !settledIsolatedResources(r) ||
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
  if (!cancelledPhase(r.phases,replacement.observed_at)) return null;
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

// Ordinal two is a source correction after a settled, observed child failure.
// Its predecessor already consumed and monitored the protected installation.
export function verifyReviewedBrowserFailure(r, stock, inputs, phaseIds) {
  const previous = r.attempt?.source_correction;
  const failed = r.phases?.findIndex(p => p.status === "failure") ?? -1;
  if (previous?.schema !== BROWSER_REVISION_SCHEMA || previous.commission?.ordinal !== 1 ||
      r.run?.id !== r.attempt.attempt_id || r.attempt.contract_fingerprint !== r.inputs?.fingerprint ||
      r.evidence?.mode !== "full" || r.evidence.selected_plan !== "full-canonical" || r.evidence.deciding !== false ||
      r.verification_context?.kind !== "isolated-worktree" || r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      r.outcome?.disposition !== "product_failure" || r.outcome.validity !== "valid_within_observed_scope" ||
      r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.execution !== "incomplete_or_failed" ||
      r.outcome.first_fault !== null || r.inputs.first_fault !== null || !same(r.inputs.secondary_faults, []) ||
      !Array.isArray(r.inputs.events) || !r.inputs.events.every(e => {
        const role = r.inputs.resources.find(v => v.id === e.resource);
        return role && nonFaultInputChange(e.disposition) && e.identity === inputEventIdentity(e) &&
          e.classification === role.classification && classifyInputChange(role.before, e.after, role, r.inputs) === e.disposition;
      }) ||
      r.final?.result !== "failure" || r.final.exit_status !== 1 || !same(r.final.reason_codes, ["phase_failed", "selected_phases_incomplete"]) ||
      !settledIsolatedResources(r) || r.historical_inputs?.required !== true ||
      failed < 0 || !same(r.phases.map(p => p.id), phaseIds) ||
      !same(inputs, r.inputs.binding?.runtime_inputs) || !browserBindingMatches(r.inputs, inputs?.browser))
    throw fail("revision_browser_failure_invalid");

  const expected = { location_fingerprint: inputs.browser.executable.location_fingerprint,
    before: inputs.browser.executable.observation, actual_version: inputs.browser.actual_version };
  const environments = r.inputs.binding.phase_environment_fingerprints;
  if (!Array.isArray(environments) || !same(environments.map(e => e.id), phaseIds))
    throw fail("revision_browser_failure_invalid");
  const issues = new Set(["receipt_classified_outcome_not_passing", "receipt_final_result_not_pass", "receipt_non_deciding"]);
  for (const [index, phase] of r.phases.entries()) {
    const records = phase.browser_use ?? [];
    if (index >= failed) issues.add("phase_not_passing:" + phase.id);
    if (index > failed) {
      if (phase.status !== "not_run" || phase.failure_code !== "phase_not_run" || phase.exit_status !== null || records.length ||
          phase.started_at !== null || phase.finished_at !== null || phase.cleanup?.remaining_owned_processes != null)
        throw fail("revision_browser_failure_invalid");
      if (!phase.environment_fingerprint) issues.add("receipt_phase_environment_binding_invalid");
      continue;
    }
    const child = phase.cleanup;
    if (!sha(phase.environment_fingerprint) || phase.environment_fingerprint !== environments[index].fingerprint ||
        phase.timed_out !== false || phase.spawn_error_code != null || child?.completed !== true || child.termination_reason !== "natural_exit" ||
        child.exit_observed !== true || child.streams_closed !== true || child.remaining_owned_processes !== 0 ||
        !(child.listener_residue_count === 0 || child.listener_residue_count === null) ||
        (index < failed ? phase.status !== "pass" || phase.exit_status !== 0 || phase.failure_code !== null :
          phase.failure_code !== "phase_failed" || !Number.isSafeInteger(phase.exit_status) || phase.exit_status <= 0))
      throw fail("revision_browser_failure_invalid");
    if (!validPhaseBrowserUse(phase, records, expected)) {
      const required = browserConsumersForPhase(phase.id);
      if (index !== failed || !Array.isArray(records) ||
          !records.every(v => validBrowserUse(v, expected) && Object.hasOwn(required, v.consumer)) ||
          Object.entries(required).some(([name, count]) => records.filter(v => v.consumer === name).length > count))
        throw fail("revision_browser_failure_invalid");
      issues.add("receipt_browser_identity_invalid:" + phase.id);
    }
  }
  if (stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      !same(stock.dimensions, { historical_integrity: "intact", execution: "incomplete_or_failed", evidence_validity: "invalid_or_incomplete",
        safety: "preserved_within_observed_scope", current_merge_applicability: "matches_observed_context" }) ||
      !same(stock.issues, [...issues].sort())) throw fail("revision_browser_stock_unaccounted");
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
