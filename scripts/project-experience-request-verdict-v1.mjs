// Private Browser-owner verdict state. Public diagnostic snapshots are never an
// input. The prospective cancellation branch reads authentic private pin facts.
import { sessionRefusalEvidenceOwnerV1 } from './project-experience-host-round-trip-pins-v1.mjs';
import { guideLifecycleEvidenceOwnerV1, GUIDE_REPLAY_PHASES_V1 } from './project-experience-guide-lifecycle-v1.mjs';
import { inspectorLifecycleEvidenceOwnerV1, INSPECTOR_REPLAY_PHASES_V1 } from './project-experience-inspector-lifecycle-v1.mjs';
import { randomBytes } from 'node:crypto';
export const RSC_CONSUMPTION_BINDING_V1 = '__augnesConsumedFlightV1';
const PROBE_PHASE = "companion_first_work_access";
const PROBE_PATH = "/api/vnext/operator/host-round-trip";
const PROBE_HEADER = "x-augnes-e2e-probe";
const PROBE_VALUE = "unavailable-execution-v1";
export const UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1 = Object.freeze({
  [PROBE_HEADER]: PROBE_VALUE,
});

export function createProjectExperienceRequestVerdictV1({ cancellationEvidence, guideEvidence, inspectorEvidence,
  guideReplayPhases = GUIDE_REPLAY_PHASES_V1, inspectorReplayPhases = INSPECTOR_REPLAY_PHASES_V1,
  rscReplayPhases = ['companion_first_work_access', 'project_home_lifecycle_presentation'], operatorNavigationFlight = false } = {}) {
  const guidePhases = Object.freeze([...guideReplayPhases]), inspectorPhases = Object.freeze([...inspectorReplayPhases]);
  const connections = new WeakMap();
  const failures = new WeakMap();
  let probe = null;
  const cancellationOwner = sessionRefusalEvidenceOwnerV1(cancellationEvidence);
  const guideOwner = guideLifecycleEvidenceOwnerV1(guideEvidence);
  const inspectorOwner = inspectorLifecycleEvidenceOwnerV1(inspectorEvidence);
  const flight = createConsumedFlightObservationV1(rscReplayPhases, operatorNavigationFlight === true);

  const rejected = reason => ({ expected: false, reason });
  function classifyFailure(entry) {
    const evidence = failures.get(entry);
    if (!evidence) return rejected("no_failure_evidence");
    const { context, responseBeforeFailure: response, canceled } = evidence;
    const request = context.request;
    if (request.phase !== PROBE_PHASE) return rejected("request_phase_mismatch");
    if (request.path !== PROBE_PATH) return rejected("route_mismatch");
    if (request.method !== "GET") return rejected("request_method_mismatch");
    if (request.external !== false) return rejected("request_not_local");
    if (context.marker === "absent") return rejected("probe_marker_absent");
    if (context.marker !== "exact") return rejected("probe_marker_mismatch");
    if (!probe) return rejected("probe_not_armed");
    if (context.ambiguous) return rejected("request_ambiguous");
    if (probe.multipleMarkedRequests) return rejected("multiple_marked_requests");
    if (!probe.request) return rejected("marked_request_not_observed");
    if (context.generation !== probe.generation || probe.request !== context) {
      return rejected("failure_not_bound_to_probe");
    }
    if (!probe.completed) return rejected("probe_not_completed");
    if (!response) return rejected("response_missing");
    if (response.path !== PROBE_PATH) return rejected("route_mismatch");
    if (response.status !== 404) return rejected("response_status_mismatch");
    if (entry.error_text !== "net::ERR_ABORTED") return rejected("failure_error_mismatch");
    if (canceled !== true) return rejected("cancellation_not_true");
    return { expected: true, reason: "completed_marked_probe_abort" };
  }

  function classifySessionRefusal(entry) {
    const evidence = failures.get(entry);
    const facts = cancellationOwner?.facts(entry);
    if (!evidence || !facts) return rejected('cancellation_evidence_missing');
    const { context, responseBeforeFailure: response, canceled } = evidence;
    const request = context.request;
    const { pin, generation, consumer, scenario, counts, documentComplete } = facts;
    if (request.phase !== PROBE_PHASE || entry.phase !== PROBE_PHASE ||
      request.path !== PROBE_PATH || request.method !== 'GET' || request.external !== false ||
      context.marker !== 'absent') return rejected('cancellation_scope_mismatch');
    if (context.ambiguous || pin.ambiguous || generation.ambiguous || consumer.incomplete ||
      generation.incomplete || !documentComplete || Object.values(counts).some(value => value !== 0) ||
      !pin.frameAlias || !pin.loaderAlias || !pin.delegatedCallSite) return rejected('cancellation_correlation_incomplete');
    if (!context.correlationConnection || pin.protocolIdentity.connection !== context.correlationConnection ||
      pin.protocolIdentity.session !== context.protocolSession || pin.protocolIdentity.request !== context.protocolRequest) {
      return rejected('cancellation_request_identity_mismatch');
    }
    if (!scenario || scenario.invalid || !scenario.sealed || scenario.pin !== pin ||
      scenario.delivery?.consumer !== consumer || scenario.delivery.documentKey !== generation.documentKey ||
      consumer.documentKey !== generation.documentKey || generation.owner !== 'delegated_work_initial_read') {
      return rejected('cancellation_refusal_unbound');
    }
    // Cancellation can settle before headers. Both private protocol owners must
    // agree on the absence; neither a missing status alone nor a public pin can
    // establish this case. Any observed response still has to be the same 404.
    const observed404 = response?.path === PROBE_PATH && response.status === 404 &&
      context.response === response && pin.response === true && pin.responseBeforeFailure === true && pin.status === 404;
    const beforeHeaders = response === null && context.response === null && pin.response === false &&
      pin.responseBeforeFailure === false && pin.status === null && pin.responseSequence === undefined;
    if ((!observed404 && !beforeHeaders) || entry.error_text !== 'net::ERR_ABORTED' || pin.error !== 'net::ERR_ABORTED' ||
      canceled !== true || pin.canceled !== true || pin.failurePhase !== PROBE_PHASE) {
      return rejected('cancellation_response_or_failure_mismatch');
    }
    // Exact-once events from one consumer/effect/controller, not aggregate
    // booleans or serialized labels. The initial invocation itself is observed.
    const unique = (events, kind, predicate = () => true) => {
      const matches = events.filter(event => event.kind === kind && predicate(event));
      return matches.length === 1 ? matches[0] : null;
    };
    const events = generation.events;
    const cycle = consumer.events.filter(event => event.effect === generation.effect);
    const read = unique(events, 'read_created'), controller = unique(events, 'controller_created');
    const fetch = unique(events, 'fetch_started'), cleanup = unique(events, 'cleanup_observed');
    const abort = unique(events, 'abort_requested'), signal = unique(events, 'signal_aborted');
    const returned = unique(events, 'abort_call_returned'), settled = unique(events, 'read_aborted');
    const consumerReturned = unique(events, 'consumer_returned');
    const enabled = unique(cycle, 'effect_active'), initial = unique(cycle, 'initial_read_invoked');
    const refused = unique(cycle, 'refusal_delivered'), locked = unique(cycle, 'auth_transition_requested');
    const effectCleanup = unique(cycle, 'effect_cleanup');
    const disabled = unique(consumer.events, 'effect_active', event => event.effect === generation.effect + 1);
    const authenticated = unique(consumer.events, 'auth_transition_requested', event =>
      event.auth === 'authenticated' && event.sequence < (enabled?.sequence ?? 0));
    const mounted = unique(consumer.events, 'consumer_mounted');
    const chain = [mounted, authenticated, enabled, initial, read, controller, fetch];
    if (chain.some(event => !event) || [refused, locked, effectCleanup, cleanup, abort, signal, returned,
      disabled, settled, consumerReturned].some(event => !event)) return rejected('cancellation_required_event_missing_or_duplicate');
    if (enabled.enabled !== true || enabled.auth !== 'authenticated' || initial.auth !== 'authenticated' ||
      [read, controller, fetch, refused].some(event => event.auth !== 'authenticated') || refused.status !== 401 ||
      scenario.delivery.event !== refused || locked.auth !== 'locked_or_refused' || disabled.enabled !== false ||
      [effectCleanup, cleanup, abort, signal, returned, disabled, settled, consumerReturned].some(event => event.auth !== 'locked_or_refused') ||
      consumer.events.some(event => event.kind === 'consumer_disposed' && event.sequence <= scenario.sealSequence) ||
      consumer.events.some(event => event.kind === 'auth_transition_requested' &&
        event.sequence <= scenario.sealSequence && event !== authenticated && event !== locked &&
        !(event.auth === 'unknown' && event.sequence < authenticated.sequence))) {
      return rejected('cancellation_auth_or_effect_mismatch');
    }
    const ordered = values => values.every((value, index) => Number.isInteger(value) &&
      (index === 0 || values[index - 1] < value));
    if (!ordered([...chain.map(event => event.sequence), pin.sequence, refused.sequence, locked.sequence,
      effectCleanup.sequence, cleanup.sequence, abort.sequence, signal.sequence, returned.sequence]) ||
      !ordered([returned.sequence, pin.failureSequence, scenario.sealSequence]) ||
      (observed404 && !ordered([pin.sequence, pin.responseSequence, pin.failureSequence])) ||
      !ordered([returned.sequence, disabled.sequence, scenario.sealSequence]) ||
      !ordered([signal.sequence, settled.sequence, consumerReturned.sequence, scenario.sealSequence])) {
      return rejected('cancellation_order_mismatch');
    }
    // A later cleanup never repairs an independently failed read/body. Body
    // completeness remains separate; an aborted body may be unobserved.
    const bodyFailed = events.filter(event => event.kind === 'body_read_failed');
    const headers = events.filter(event => event.kind === 'response_headers_received');
    const bodyStarted = events.filter(event => event.kind === 'body_read_started');
    if (pin.finished || events.some(event => event.kind === 'read_failed' || event.kind === 'body_read_completed' || event.kind === 'probe_completed') ||
      bodyFailed.length > 1 || headers.length > 1 || bodyStarted.length > 1 ||
      (beforeHeaders && (headers.length !== 0 || bodyStarted.length !== 0 || bodyFailed.length !== 0)) ||
      headers.some(event => event.status !== 404) ||
      bodyFailed.some(event => event.sequence <= signal.sequence || event.sequence >= settled.sequence) ||
      (bodyStarted.length !== bodyFailed.length) || (headers.length !== bodyStarted.length) ||
      (headers.length && !ordered([headers[0].sequence, bodyStarted[0].sequence, bodyFailed[0].sequence]))) {
      return rejected('cancellation_independent_read_failure');
    }
    return { expected: true, reason: 'expected_session_refusal_cleanup_cancellation',
      response_observed: observed404, response_status: observed404 ? 404 : null,
      body_settlement: bodyFailed.length ? 'failed' : 'unknown', completed_read: false };
  }

  function classifyGuideReplay(entry) {
    const evidence = failures.get(entry), facts = guideOwner?.facts(entry);
    if (!evidence || !facts) return rejected('guide_evidence_missing');
    const { context, responseBeforeFailure, canceled } = evidence;
    const { request: pin, generation: first, counts, uniqueRequest } = facts;
    const phase = context.request.phase, path = '/api/augnes/read/guide-brief';
    if (!guidePhases.includes(phase) || entry.phase !== phase || pin.phase !== phase ||
      entry.path !== path || context.request.path !== path || pin.path !== path ||
      context.request.method !== 'GET' || pin.method !== 'GET' || context.request.external !== false ||
      !pin.local || !pin.explicitProject || !pin.hook) return rejected('guide_scope_mismatch');
    if (context.ambiguous || pin.invalid || first.doc.invalid || !uniqueRequest ||
      Object.values(counts).some(n => n !== 0) || !pin.frameId || !pin.loaderId ||
      first.doc.frame !== pin.frameId || first.doc.loader !== pin.loaderId) return rejected('guide_correlation_incomplete');
    if (pin.protocolIdentity.connection !== context.correlationConnection ||
      pin.protocolIdentity.session !== context.protocolSession || pin.protocolIdentity.request !== context.protocolRequest) {
      return rejected('guide_request_identity_mismatch');
    }
    if (entry.error_text !== 'net::ERR_ABORTED' || canceled !== true || pin.failure?.error !== 'net::ERR_ABORTED' ||
      pin.failure.canceled !== true || pin.failure.phase !== phase || responseBeforeFailure !== null ||
      context.response !== null || pin.response !== null || pin.finished !== null) return rejected('guide_failure_mismatch');
    const one = (events, kind, predicate = () => true) => {
      const matches = events.filter(e => e.event === kind && predicate(e));
      return matches.length === 1 ? matches[0] : null;
    };
    const ordered = list => list.every((n, i) => Number.isInteger(n) && (i === 0 || list[i - 1] < n));
    const a = first.created, events = first.events, consumer = first.consumer;
    if (a.cause !== 'initial_effect' || a.effect !== 1 || !/^project-/.test(a.context) ||
      events.some(e => e.consumer !== a.consumer || e.effect !== a.effect || e.context !== a.context || e.controller !== a.controller)) {
      return rejected('guide_generation_mismatch');
    }
    const setup = one(consumer, 'effect_setup', e => e.effect === 1);
    const cleanup = one(consumer, 'effect_cleanup', e => e.effect === 1 && e.target === a.read);
    const nextSetup = one(consumer, 'effect_setup', e => e.effect === 2 && e.context === a.context);
    const fetch = one(events, 'fetch_started', e => e.same_signal === true && e.request_valid === true);
    const abort = one(events, 'abort_requested', e => e.cause === 'cleanup' && e.already_aborted === false);
    const signal = one(events, 'signal_aborted');
    const returnedAbort = one(events, 'abort_returned', e => e.sequence > (signal?.sequence ?? Infinity) && e.sequence < (nextSetup?.sequence ?? 0) && e.aborted === true);
    const settled = one(events, 'read_aborted'), returned = one(events, 'returned');
    if ([setup, cleanup, nextSetup, fetch, abort, signal, returnedAbort, settled, returned].some(e => !e) ||
      !ordered([setup.sequence, a.sequence, fetch.sequence, pin.sequence, cleanup.sequence, abort.sequence, signal.sequence, returnedAbort.sequence, nextSetup.sequence]) ||
      !ordered([signal.sequence, settled.sequence, returned.sequence]) || pin.failure.sequence <= returnedAbort.sequence) {
      return rejected('guide_cleanup_chain_incomplete');
    }
    if (events.some(e => ['headers', 'body_started', 'body_completed', 'parsed', 'application_requested', 'committed', 'read_failed', 'stale_blocked'].includes(e.event))) {
      return rejected('guide_aborted_read_not_empty');
    }
    // Strict effect replay invokes the same read again. Its redundant abort of
    // the already-aborted controller must also be observed, not assumed harmless.
    const repeatedAbort = one(events, 'abort_requested', e => e.cause === 'supersede' && e.already_aborted === true);
    const repeatedReturn = one(events, 'abort_returned', e => e.sequence > (repeatedAbort?.sequence ?? Infinity) && e.aborted === true);
    if (!repeatedAbort || !repeatedReturn || events.filter(e => e.event === 'abort_requested').length !== 2 ||
      events.filter(e => e.event === 'abort_returned').length !== 2 ||
      !ordered([nextSetup.sequence, repeatedAbort.sequence, repeatedReturn.sequence])) return rejected('guide_replay_abort_mismatch');
    const replacements = facts.candidates.filter(x => x.generation.doc === first.doc &&
      x.generation.created.consumer === a.consumer && x.generation.created.effect === 2 &&
      x.generation.created.cause === 'initial_effect');
    if (replacements.length !== 1) return rejected('guide_replacement_ambiguous');
    const { request: replacement, generation: second } = replacements[0], b = second.created, reads = second.events;
    if (['read_created', 'fetch_started', 'headers', 'body_started', 'body_completed', 'parsed', 'application_requested', 'returned', 'committed']
      .some(kind => reads.filter(e => e.event === kind).length !== 1) ||
      ['read_created', 'fetch_started', 'signal_aborted', 'read_aborted', 'returned']
        .some(kind => events.filter(e => e.event === kind).length !== 1)) return rejected('guide_duplicate_event');
    if (b.cause !== 'initial_effect' || b.context !== a.context || b.read === a.read || b.controller === a.controller ||
      reads.some(e => e.consumer !== b.consumer || e.effect !== b.effect || e.context !== b.context || e.controller !== b.controller) ||
      replacement.invalid || !replacement.hook || !replacement.explicitProject || !replacement.local || replacement.method !== 'GET' ||
      replacement.phase !== phase || replacement.connection !== pin.connection || replacement.session !== pin.session ||
      replacement.frameId !== pin.frameId || replacement.loaderId !== pin.loaderId || replacement.failure ||
      replacement.response?.status !== 200 || !replacement.finished) return rejected('guide_replacement_mismatch');
    const secondFetch = one(reads, 'fetch_started', e => e.same_signal === true && e.request_valid === true);
    const headers = one(reads, 'headers', e => e.value === 200), bodyStarted = one(reads, 'body_started');
    const body = one(reads, 'body_completed'), parsed = one(reads, 'parsed', e => e.value === true);
    const apply = one(reads, 'application_requested', e => e.current === true && e.aborted === false && e.project_matches === true);
    const complete = one(reads, 'returned');
    const commit = one(reads, 'committed', e => e.current === true && e.same_controller === true && e.aborted === false && e.context_current === true);
    if ([secondFetch, headers, bodyStarted, body, parsed, apply, complete, commit].some(e => !e) ||
      !ordered([repeatedReturn.sequence, b.sequence, secondFetch.sequence, replacement.sequence]) ||
      !ordered([replacement.sequence, replacement.response.sequence, replacement.finished.sequence]) ||
      !ordered([secondFetch.sequence, headers.sequence, bodyStarted.sequence, body.sequence, parsed.sequence, apply.sequence, complete.sequence, commit.sequence]) ||
      replacement.finished.sequence >= commit.sequence || pin.failure.sequence >= commit.sequence || returned.sequence >= commit.sequence) {
      return rejected('guide_replacement_not_consumed');
    }
    // Later explicit refreshes are separate reads, not competing initial
    // replacements. They cannot start before this replacement was committed.
    if (facts.candidates.some(x => x.generation.doc === first.doc &&
      x.generation.created.consumer === a.consumer && x.generation.created.effect === 2 &&
      x.request !== replacement && (x.generation.created.cause !== 'explicit_refresh' ||
        x.generation.created.sequence <= commit.sequence))) return rejected('guide_intervening_refresh');
    if (reads.some(e => e.sequence <= commit.sequence && ['abort_requested', 'signal_aborted', 'read_aborted', 'read_failed', 'stale_blocked'].includes(e.event)) ||
      consumer.some(e => e.sequence > nextSetup.sequence && e.sequence <= commit.sequence && ['effect_setup', 'effect_cleanup'].includes(e.event)) ||
      facts.events.some(e => e.connectionNumber === pin.connectionNumber && e.session === pin.session &&
        e.sequence > pin.sequence && e.sequence <= commit.sequence &&
        (e.kind === 'navigation' || (e.kind === 'context_destroyed' && (e.context === null || e.context === first.doc.context))))) {
      return rejected('guide_current_consumer_changed');
    }
    return { expected: true, reason: 'expected_guide_effect_replay_cancellation', replacement_completed_and_adopted: true };
  }

  function classifyInspectorReplay(entry) {
    const evidence = failures.get(entry), facts = inspectorOwner?.facts(entry);
    if (!evidence || !facts?.generation) return rejected('inspector_evidence_missing');
    const { context, responseBeforeFailure, canceled } = evidence;
    const { request: pin, generation: first, counts, candidates } = facts;
    const consistentGeneration = generation => generation.events.every(event =>
      event.read === generation.setup.read && event.consumer === generation.setup.consumer &&
      event.effect === generation.setup.effect && event.target === generation.setup.target);
    const phase = context.request.phase;
    if (!inspectorPhases.includes(phase) || entry.phase !== phase || pin.phase !== phase ||
      context.request.path !== '/api/vnext/operator/session' || entry.path !== context.request.path ||
      context.request.method !== 'GET' || pin.method !== 'GET' || context.request.external !== false ||
      !pin.local || !pin.loaderCallsite) return rejected('inspector_scope_mismatch');
    if (context.ambiguous || pin.invalid || first.doc.invalid || !consistentGeneration(first) || Object.values(counts).some(n => n !== 0) ||
      !pin.frame || !pin.loader || pin.frame !== first.doc.frame || pin.loader !== first.doc.loader ||
      pin.identity !== context.correlationConnection || pin.session !== context.protocolSession || pin.requestId !== context.protocolRequest ||
      candidates.filter(x => x.request.connection === pin.connection && x.request.session === pin.session &&
        JSON.stringify(x.request.pin) === JSON.stringify(pin.pin)).length !== 1) return rejected('inspector_correlation_incomplete');
    // The demonstrated replay cancels its initial request before any response.
    // A later cleanup cannot reinterpret a header/body failure as this case.
    if (responseBeforeFailure !== null || pin.response || pin.finished || !pin.failed ||
      pin.failed.error !== 'net::ERR_ABORTED' || entry.error_text !== 'net::ERR_ABORTED' || canceled !== true ||
      !pin.failed.canceled || pin.failed.phase !== phase) return rejected('inspector_failure_mismatch');
    const one = (events, kind) => { const matches = events.filter(e => e.kind === kind); return matches.length === 1 ? matches[0] : null; };
    const ordered = values => values.every((v, i) => Number.isInteger(v) && (i === 0 || values[i - 1] < v));
    const required = ['setup','fetch_started','cleanup','abort_requested','signal_aborted','abort_returned','read_aborted','returned'];
    const a = Object.fromEntries(required.map(k => [k, one(first.events, k)]));
    if (Object.values(a).some(e => !e) || a.fetch_started.value !== true || a.cleanup.value !== false ||
      a.abort_requested.aborted !== false || a.abort_returned.value !== true || first.setup.effect !== 1 ||
      !ordered([a.setup.sequence, a.fetch_started.sequence, pin.start, a.cleanup.sequence, a.abort_requested.sequence,
        a.signal_aborted.sequence, a.abort_returned.sequence, a.read_aborted.sequence, a.returned.sequence]) ||
      pin.failed.sequence <= a.abort_returned.sequence || first.events.some(e =>
        ['headers','body_started','body_completed','read_failed','session_applied','inspector_applied','inspector_refusal_applied','committed'].includes(e.kind))) {
      return rejected('inspector_cleanup_not_demonstrated');
    }
    const replacements = candidates.filter(x => x.generation?.doc === first.doc &&
      x.generation.setup.consumer === first.setup.consumer && x.generation.setup.effect === first.setup.effect + 1 &&
      x.generation.setup.target === first.setup.target);
    if (replacements.length !== 1) return rejected('inspector_replacement_not_unique');
    const { request: rp, generation: second } = replacements[0];
    const b = Object.fromEntries(['setup','fetch_started','headers','body_started','body_completed','session_applied','returned'].map(k => [k, one(second.events, k)]));
    if (Object.values(b).some(e => !e) || !consistentGeneration(second) || rp.invalid || rp.failed || !rp.finished || !rp.response ||
      rp.phase !== phase || rp.connection !== pin.connection || rp.session !== pin.session || rp.frame !== pin.frame || rp.loader !== pin.loader ||
      !rp.local || !rp.loaderCallsite || rp.method !== 'GET' || b.fetch_started.value !== true ||
      b.headers.value !== rp.response.status || b.session_applied.current !== true || b.session_applied.aborted !== false ||
      b.session_applied.project_matches !== true || second.events.some(e => ['read_failed','read_aborted','inspector_failed','stale_blocked'].includes(e.kind)) ||
      !ordered([a.abort_returned.sequence, b.setup.sequence, b.fetch_started.sequence, rp.start, rp.response.sequence,
        b.headers.sequence, b.body_started.sequence, b.body_completed.sequence, b.session_applied.sequence, b.returned.sequence])) {
      return rejected('inspector_replacement_incomplete');
    }
    const state = b.session_applied.session_state;
    if (!((state === 'locked' && [401,403].includes(rp.response.status)) || (state === 'authenticated' && rp.response.status === 200))) {
      return rejected('inspector_replacement_state_invalid');
    }
    const commits = second.events.filter(e => e.kind === 'committed' && e.session_state === state &&
      e.current === true && e.aborted === false && e.inspector_current === true && e.sequence > b.returned.sequence);
    if (!commits.length || second.events.some(e => ['session_applied','inspector_applied','inspector_refusal_applied','committed'].includes(e.kind) &&
      (e.current !== true || e.aborted !== false))) return rejected('inspector_current_state_not_committed');
    if (state === 'authenticated') {
      const body = one(second.events, 'inspector_body'), applied = one(second.events, 'inspector_applied');
      const refused = one(second.events, 'inspector_refusal_applied');
      const available = body?.value === 200 && applied?.project_matches === true && !refused;
      // These are the existing missing/conflict UI outcomes. A body/network
      // failure or arbitrary HTTP error never establishes a completed outcome.
      const refusal = !applied && refused &&
        ((body?.value === 404 && refused.refusal === 'missing') ||
         (body?.value === 409 && refused.refusal === 'conflict')) &&
        commits.some(e => e.refusal === refused.refusal && e.sequence > refused.sequence);
      const adopted = available ? applied : refusal ? refused : null;
      if (!body || !adopted || !ordered([b.session_applied.sequence, body.sequence, adopted.sequence, b.returned.sequence])) {
        return rejected('inspector_current_result_missing');
      }
    }
    return { expected: true, reason: 'expected_inspector_initial_effect_replay', current_state: state,
      obsolete_body: 'not_read', replacement_body: 'completed', current_inspector: state === 'authenticated' && one(second.events, 'inspector_applied') !== null,
      current_inspector_refusal: one(second.events, 'inspector_refusal_applied')?.refusal ?? null };
  }

  return Object.freeze({
    rscBrowserSource: () => flight.browserSource(),
    rscInstallationFailed: () => flight.installationFailed(),
    observeRscLifecycle: (connection, payload, phase) => flight.lifecycle(connection, payload, phase),
    rscConsumptionSnapshot: () => flight.snapshot(),
    normallyConsumedFlight(entry) {
      const e = failures.get(entry);
      if (!e || e.context.ambiguous || e.context.request.external !== false || e.context.request.method !== 'GET' ||
        e.context.type !== 'Fetch' || !e.context.rsc || e.context.hmr || e.context.responseMime !== 'text/x-component' ||
        e.responseBeforeFailure?.status !== 200 || e.canceled !== true || entry.error_text !== 'net::ERR_ABORTED') {
        return rejected('flight_transport_mismatch');
      }
      return flight.verdict(entry);
    },
    failureDetails(entry) {
      const e = failures.get(entry); if (!e) return { evidence: 'missing' };
      return { method: e.context.request.method, type: e.context.type, status: e.responseBeforeFailure?.status ?? null,
        canceled: e.canceled === true, rsc: e.context.rsc, hmr: e.context.hmr, response_mime: e.context.responseMime, initiator: e.context.initiator };
    },
    guideEffectReplayCancellation(entry) { return classifyGuideReplay(entry); },
    inspectorEffectReplayCancellation(entry) { return classifyInspectorReplay(entry); },
    armSessionRefusalScenario() { return cancellationOwner?.arm() ?? null; },
    completeSessionRefusalScenario(handle) { cancellationOwner?.seal(handle); },
    closeSessionRefusalScenario(handle) { cancellationOwner?.close(handle); },
    sessionRefusalCancellation(entry) { return classifySessionRefusal(entry); },
    connection(correlationConnection = null) {
      const connection = Object.freeze({});
      connections.set(connection, { requests: new Map(), correlationConnection });
      flight.connection(connection);
      return connection;
    },
    armUnavailableExecutionProbe() {
      const generation = Object.freeze({});
      probe = { generation, completed: false, request: null, multipleMarkedRequests: false };
      return generation;
    },
    completeUnavailableExecutionProbe(generation) {
      if (probe && generation === probe.generation) probe.completed = true;
    },
    observe(connection, payload, entry) {
      const record = connections.get(connection);
      const requests = record?.requests;
      const params = payload.params ?? {};
      const key = requestKey(payload.sessionId, params.requestId);
      if (!requests || key === null) return;
      let context = requests.get(key);

      if (payload.method === "Network.requestWillBeSent") {
        const reused = requests.has(key);
        if (context) context.ambiguous = true;
        context = {
          request: entry,
          type: ['Document', 'Fetch', 'XHR'].includes(params.type) ? params.type : 'other',
          rsc: Object.entries(params.request?.headers ?? {}).some(([k,v]) => k.toLowerCase() === 'rsc' && v === '1'),
          hmr: Object.keys(params.request?.headers ?? {}).some(k => k.toLowerCase() === 'next-hmr-refresh'),
          initiator: ['shared-project-inspector-loader.tsx', 'use-project-guide-brief-v0-2.ts', 'fetch-server-response.js', 'cache.js']
            .find(name => JSON.stringify(params.initiator?.stack ?? {}).includes(name)) ?? 'other',
          response: null,
          failed: false,
          ambiguous: reused || params.redirectResponse != null,
          marker: probeMarker(params.request?.headers),
          generation: null,
          correlationConnection: record.correlationConnection,
          protocolSession: payload.sessionId ?? null,
          protocolRequest: params.requestId,
        };
        requests.set(key, context);
        if (
          probe && context.marker === "exact" && !context.ambiguous &&
          entry.phase === PROBE_PHASE && entry.path === PROBE_PATH &&
          entry.method === "GET" && entry.external === false
        ) {
          if (probe.request) probe.multipleMarkedRequests = true;
          else probe.request = context;
          context.generation = probe.generation;
        }
      } else if (payload.method === "Network.responseReceived") {
        if (!context) {
          requests.set(key, null); // A later start cannot repair an unmatched event.
          return;
        }
        if (context.response || context.failed || entry.path !== context.request.path) {
          context.ambiguous = true;
        }
        entry.method = context.request.method;
        context.response = entry;
        context.responseMime = ["text/x-component", "application/json", "text/html"].includes(params.response?.mimeType) ? params.response.mimeType : "other";
      } else if (payload.method === "Network.loadingFailed") {
        if (!context) {
          requests.set(key, null);
          return;
        }
        if (context.failed) context.ambiguous = true;
        entry.path = context.request.path;
        failures.set(entry, {
          context,
          responseBeforeFailure: context.response,
          canceled: params.canceled,
        });
        context.failed = true;
      }
      flight.protocol(connection, payload, entry);
    },
    expectedUnavailableExecutionAbort(entry) {
      return classifyFailure(entry).expected;
    },
    unavailableExecutionAbortReason(entry) {
      // Explanatory only: the acceptance owner consumes the boolean, not this enum.
      return classifyFailure(entry).reason;
    },
  });
}

function probeMarker(headers) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) return "absent";
  const names = Object.keys(headers).filter(name => name.toLowerCase() === PROBE_HEADER);
  if (names.length === 0) return "absent";
  return names.length === 1 && headers[names[0]] === PROBE_VALUE ? "exact" : "invalid";
}

function requestKey(sessionId, requestId) {
  if (typeof requestId !== "string" || requestId.length === 0) return null;
  if (sessionId != null && (typeof sessionId !== "string" || sessionId.length === 0)) return null;
  // Raw protocol identity stays in ephemeral map keys, never in verdict output.
  return JSON.stringify([sessionId ?? null, requestId]);
}

// This is deliberately a response-consumption exception, not a cancellation
// exception. The pinned React Flight decoder can reach native stream EOF while
// CDP reports ERR_ABORTED. Existing UI, page-error and console assertions still
// decide whether the decoded current result is usable. No public snapshot can
// supply these facts, and an obsolete stream without EOF does not qualify here.
function isConsumedFlightRouteV1(pathname, observeOperatorNavigation) {
  // Match the existing project page and, only for the operator workload, the
  // semantic-review index and its validated [proposal_id] route family.
  return /^\/projects\/[^/]+$/.test(pathname) || (observeOperatorNavigation &&
    (pathname === '/' || /^\/workbench\/semantic-review(?:\/episode-delta-proposal~[a-f0-9]{24})?$/.test(pathname)));
}

function createConsumedFlightObservationV1(observedPhases, observeOperatorNavigation) {
  const channel = randomBytes(16).toString('hex'), connections = new WeakMap(), failures = new WeakMap();
  const documents = new Map(), counts = { invalid: 0, overflow: 0, installation: 0 };
  const phases = new Set(observedPhases);
  const kinds = new Set(['fetch', 'headers', 'reader', 'read', 'chunk', 'eof', 'cancel', 'rejected', 'unsupported']);
  const key = (...x) => JSON.stringify(x);
  let sequence = 0, connectionCount = 0;
  const protect = fn => { try { fn(); } catch { counts.invalid++; } };
  function retire(c, session, predicate) {
    for (const doc of documents.values()) if (doc.connection === c.number && doc.session === session && predicate(doc)) {
      doc.retired = true;
      for (const r of doc.reads.values()) if (!r.eof) r.invalid = true;
    }
  }
  return {
    browserSource: () => `(${installConsumedFlightObservationV1.toString()})(${JSON.stringify(channel)},${JSON.stringify(RSC_CONSUMPTION_BINDING_V1)},${JSON.stringify(observeOperatorNavigation)},${isConsumedFlightRouteV1.toString()});`,
    installationFailed() { counts.installation++; },
    connection(token) { connections.set(token, { number: ++connectionCount, contexts: new Map(), frames: new Map(), requests: new Map() }); },
    lifecycle(token, payload, phase) { protect(() => {
      const c = connections.get(token); if (!c) return;
      const p = payload.params ?? {}, session = payload.sessionId ?? null;
      if (payload.method === 'Page.frameNavigated') {
        retire(c, session, d => d.frame === p.frame.id && d.loader !== p.frame.loaderId);
        c.frames.set(key(session, p.frame.id), p.frame.loaderId);
      } else if (payload.method === 'Runtime.executionContextCreated') {
        if (c.contexts.size >= 256) { counts.overflow++; return; }
        c.contexts.set(key(session, p.context.id), p.context.auxData);
      } else if (payload.method === 'Runtime.executionContextDestroyed') {
        retire(c, session, d => d.context === p.executionContextId);
        c.contexts.delete(key(session, p.executionContextId));
      } else if (payload.method === 'Runtime.executionContextsCleared') {
        retire(c, session, () => true); c.contexts.clear();
      } else if (payload.method === 'Runtime.bindingCalled' && p.name === RSC_CONSUMPTION_BINDING_V1) {
        const v = JSON.parse(p.payload), ctx = c.contexts.get(key(session, p.executionContextId));
        const id = key(c.number, session, v.document);
        if (!phases.has(phase) && !documents.has(id)) return;
        if (v.channel !== channel || !ctx?.isDefault || !ctx.frameId || !/^[a-f0-9-]{36}$/.test(v.document) ||
          !kinds.has(v.kind) || !Number.isInteger(v.ordinal) || v.ordinal < 1 || v.ordinal > 4096 ||
          !Number.isInteger(v.read) || v.read < 1 || v.read > 64 ||
          Object.keys(v).some(k => !['channel','document','ordinal','read','kind','valid','bytes'].includes(k)) ||
          (v.valid !== undefined && typeof v.valid !== 'boolean') ||
          (v.bytes !== undefined && (!Number.isInteger(v.bytes) || v.bytes < 1 || v.bytes > 16 * 1024 * 1024))) { counts.invalid++; return; }
        let doc = documents.get(id);
        if (!doc) {
          if (documents.size >= 32) { counts.overflow++; return; }
          doc = { connection: c.number, session, context: p.executionContextId, frame: ctx.frameId,
            loader: c.frames.get(key(session, ctx.frameId)), ordinal: 0, reads: new Map(), retired: false };
          documents.set(id, doc);
        }
        if (doc.retired || !doc.loader || doc.context !== p.executionContextId || doc.frame !== ctx.frameId || v.ordinal !== doc.ordinal + 1) { counts.invalid++; return; }
        doc.ordinal = v.ordinal;
        let r = doc.reads.get(v.read);
        if (v.kind === 'fetch') {
          if (r) { r.invalid = true; return; }
          r = { doc, phase, started: ++sequence, invalid: v.valid !== true, request: null, headers: null,
            reader: null, pending: false, chunks: 0, bytes: 0, eof: null };
          doc.reads.set(v.read, r); return;
        }
        if (!r || r.eof) { counts.invalid++; return; }
        const seq = ++sequence;
        if (v.kind === 'headers') { if (r.headers || v.valid !== true || !r.request) r.invalid = true; r.headers = seq; }
        else if (v.kind === 'reader') { if (r.reader || !r.headers || v.valid !== true) r.invalid = true; r.reader = seq; }
        else if (v.kind === 'read') { if (!r.reader || r.pending) r.invalid = true; r.pending = true; }
        else if (v.kind === 'chunk') {
          if (!r.pending || !v.bytes) r.invalid = true;
          r.pending = false; r.chunks++; r.bytes += v.bytes ?? 0;
          if (r.bytes > 16 * 1024 * 1024) r.invalid = true;
        } else if (v.kind === 'eof') { if (!r.pending || !r.chunks) r.invalid = true; r.pending = false; r.eof = seq; }
        else r.invalid = true;
      }
    }); },
    protocol(token, payload, entry) { protect(() => {
      const c = connections.get(token); if (!c) return;
      const p = payload.params ?? {}, session = payload.sessionId ?? null, request = key(session, p.requestId);
      if (payload.method === 'Network.requestWillBeSent') {
        if (!phases.has(entry.phase)) return;
        const frames = []; let stack = p.initiator?.stack;
        for (let depth = 0; stack && depth < 16; depth++, stack = stack.parent) frames.push(...(stack.callFrames ?? []));
        const prefix = `augnes-consumed-flight/${channel}/`;
        const pins = frames.filter(f => f.url?.startsWith(prefix)).map(f => f.url.slice(prefix.length).split('/'));
        if (!pins.length) return;
        const doc = documents.get(key(c.number, session, pins[0][0])), r = doc?.reads.get(Number(pins[0][1]));
        if (!r) { counts.invalid++; return; }
        const url = new URL(p.request.url), headers = new Headers(p.request.headers);
        if (pins.length !== 1 || pins[0].length !== 2 || r.request || c.requests.has(request) || p.redirectResponse ||
          !['localhost','127.0.0.1','[::1]'].includes(url.hostname) ||
          !isConsumedFlightRouteV1(url.pathname, observeOperatorNavigation) ||
          url.username || url.password || !url.searchParams.has('_rsc') || p.type !== 'Fetch' || p.request.method !== 'GET' ||
          headers.get('rsc') !== '1' || ['next-hmr-refresh','next-router-prefetch','next-router-segment-prefetch'].some(k => headers.has(k)) ||
          !frames.some(f => /\/next\/dist\/client\/components\/router-reducer\/fetch-server-response\.js(?:\?|$)/.test(f.url)) ||
          p.frameId !== doc.frame || p.loaderId !== doc.loader || doc.retired || r.phase !== entry.phase) r.invalid = true;
        r.request = request; r.path = entry.path; c.requests.set(request, r);
      } else {
        const r = c.requests.get(request); if (!r) return;
        if ((p.frameId && p.frameId !== r.doc.frame) || (p.loaderId && p.loaderId !== r.doc.loader)) r.invalid = true;
        if (payload.method === 'Network.responseReceived') {
          if (r.response || r.failure || r.finished || p.response.status !== 200 || p.response.mimeType !== 'text/x-component' || entry.path !== r.path) r.invalid = true;
          r.response = ++sequence;
        } else if (payload.method === 'Network.loadingFinished') { if (r.failure || r.finished) r.invalid = true; r.finished = ++sequence; }
        else if (payload.method === 'Network.loadingFailed') {
          if (r.failure || r.finished || !r.response || entry.phase !== r.phase) r.invalid = true;
          r.failure = ++sequence; failures.set(entry, { r, signature: JSON.stringify(entry) });
        }
      }
    }); },
    verdict(entry) {
      const x = failures.get(entry), r = x?.r;
      if (!r || x.signature !== JSON.stringify(entry) || Object.values(counts).some(n => n !== 0) ||
        r.invalid || !r.headers || !r.reader || !r.chunks || !r.eof || r.pending || r.finished || !r.response || !r.failure) {
        return { expected: false, reason: 'flight_consumption_not_demonstrated' };
      }
      return { expected: true, reason: 'expected_normally_consumed_flight_transport_abort', native_stream_eof: true, bytes: r.bytes };
    },
    snapshot() { return { schema: 'augnes.consumed-flight-observation.v1', authority: 'diagnostic_only_no_verdict', counts: { ...counts },
      reads: [...documents.values()].flatMap(d => [...d.reads.values()].map(r => ({ phase: r.phase, chunks: r.chunks, bytes: r.bytes,
        native_stream_eof: !!r.eof, transport_failed: !!r.failure, invalid: r.invalid }))) }; },
  };
}

function installConsumedFlightObservationV1(channel, binding, observeOperatorNavigation, isObservedRoute) {
  if (typeof window[binding] !== 'function' || !['localhost','127.0.0.1','[::1]'].includes(location.hostname)) return;
  const document = crypto.randomUUID(), streams = new WeakMap(), readers = new WeakMap(), responses = new WeakMap();
  let ordinal = 0, readCount = 0;
  const safe = fn => { try { return fn(); } catch { return undefined; } };
  const emit = (read, kind, extra = {}) => safe(() => window[binding](JSON.stringify({ channel, document, ordinal: ++ordinal, read, kind, ...extra })));
  // Observe side branches and return every original promise/value unchanged.
  // This neither drains a second reader nor closes an obsolete stream.
  const observe = (promise, success, failure) => { void promise.then(v => safe(() => success(v)), e => safe(() => failure(e))); return promise; };
  const nativeFetch = window.fetch;
  window.fetch = function(...args) {
    let r;
    safe(() => {
      const [input, init] = args, url = new URL(typeof input === 'string' ? input : input.url ?? input, location.href);
      if (url.origin !== location.origin || !url.searchParams.has('_rsc') ||
        !isObservedRoute(url.pathname, observeOperatorNavigation)) return;
      const headers = new Headers(init?.headers ?? input?.headers), read = ++readCount;
      const valid = read <= 64 && (init?.method ?? 'GET') === 'GET' && init?.signal == null && input?.signal == null &&
        headers.get('rsc') === '1' && !['next-hmr-refresh','next-router-prefetch','next-router-segment-prefetch'].some(k => headers.has(k));
      r = { read }; emit(read, 'fetch', { valid });
    });
    if (!r) return Reflect.apply(nativeFetch, this, args);
    const invoke = Function('run', `return function(...args) { return run(this, args); };\n//# sourceURL=augnes-consumed-flight/${channel}/${document}/${r.read}`)(
      (receiver, values) => Reflect.apply(nativeFetch, receiver, values));
    const promise = Reflect.apply(invoke, this, args);
    return observe(promise, response => {
      responses.set(response, r); if (response.body) streams.set(response.body, r);
      emit(r.read, 'headers', { valid: response.status === 200 && response.headers.get('content-type')?.startsWith('text/x-component') === true && !!response.body });
    }, () => emit(r.read, 'rejected'));
  };
  const getReader = ReadableStream.prototype.getReader;
  ReadableStream.prototype.getReader = function(...args) {
    const r = streams.get(this), reader = Reflect.apply(getReader, this, args);
    if (r) { readers.set(reader, r); emit(r.read, 'reader', { valid: args[0]?.mode === undefined &&
      /startReadingFromStream[^\n]*react-server-dom-webpack-client\.browser\.development\.js/.test(String(new Error().stack)) }); }
    return reader;
  };
  const read = ReadableStreamDefaultReader.prototype.read;
  ReadableStreamDefaultReader.prototype.read = function(...args) {
    const r = readers.get(this); if (r) emit(r.read, 'read');
    const promise = Reflect.apply(read, this, args); if (!r) return promise;
    return observe(promise, value => emit(r.read, value.done ? 'eof' : 'chunk', value.done ? {} : { bytes: value.value.byteLength }), () => emit(r.read, 'rejected'));
  };
  for (const [proto, name, map] of [[ReadableStream.prototype, 'cancel', streams], [ReadableStreamDefaultReader.prototype, 'cancel', readers],
    [ReadableStreamDefaultReader.prototype, 'releaseLock', readers], [ReadableStream.prototype, 'tee', streams], [Response.prototype, 'clone', responses]]) {
    const original = proto[name]; proto[name] = function(...args) {
      const r = map.get(this); if (r) emit(r.read, name === 'cancel' ? 'cancel' : 'unsupported');
      return Reflect.apply(original, this, args);
    };
  }
}
