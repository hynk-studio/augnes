// Private Browser-owner verdict state. Public diagnostic snapshots are never an
// input. The prospective cancellation branch reads authentic private pin facts.
import { sessionRefusalEvidenceOwnerV1 } from './project-experience-host-round-trip-pins-v1.mjs';
import { guideLifecycleEvidenceOwnerV1, GUIDE_REPLAY_PHASES_V1 } from './project-experience-guide-lifecycle-v1.mjs';
const PROBE_PHASE = "companion_first_work_access";
const PROBE_PATH = "/api/vnext/operator/host-round-trip";
const PROBE_HEADER = "x-augnes-e2e-probe";
const PROBE_VALUE = "unavailable-execution-v1";
export const UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1 = Object.freeze({
  [PROBE_HEADER]: PROBE_VALUE,
});

export function createProjectExperienceRequestVerdictV1({ cancellationEvidence, guideEvidence } = {}) {
  const connections = new WeakMap();
  const failures = new WeakMap();
  let probe = null;
  const cancellationOwner = sessionRefusalEvidenceOwnerV1(cancellationEvidence);
  const guideOwner = guideLifecycleEvidenceOwnerV1(guideEvidence);

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
    if (!GUIDE_REPLAY_PHASES_V1.includes(phase) || entry.phase !== phase || pin.phase !== phase ||
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
      x.generation.created.consumer === a.consumer && x.generation.created.effect === 2);
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
    if (reads.some(e => e.sequence <= commit.sequence && ['abort_requested', 'signal_aborted', 'read_aborted', 'read_failed', 'stale_blocked'].includes(e.event)) ||
      consumer.some(e => e.sequence > nextSetup.sequence && e.sequence <= commit.sequence && ['effect_setup', 'effect_cleanup'].includes(e.event)) ||
      facts.events.some(e => e.connectionNumber === pin.connectionNumber && e.session === pin.session &&
        e.sequence > pin.sequence && e.sequence <= commit.sequence &&
        (e.kind === 'navigation' || (e.kind === 'context_destroyed' && (e.context === null || e.context === first.doc.context))))) {
      return rejected('guide_current_consumer_changed');
    }
    return { expected: true, reason: 'expected_guide_effect_replay_cancellation', replacement_completed_and_adopted: true };
  }

  return Object.freeze({
    failureDetails(entry) {
      const e = failures.get(entry); if (!e) return { evidence: 'missing' };
      return { method: e.context.request.method, type: e.context.type, status: e.responseBeforeFailure?.status ?? null,
        canceled: e.canceled === true, rsc: e.context.rsc, hmr: e.context.hmr, response_mime: e.context.responseMime, initiator: e.context.initiator };
    },
    guideEffectReplayCancellation(entry) { return classifyGuideReplay(entry); },
    armSessionRefusalScenario() { return cancellationOwner?.arm() ?? null; },
    completeSessionRefusalScenario(handle) { cancellationOwner?.seal(handle); },
    closeSessionRefusalScenario(handle) { cancellationOwner?.close(handle); },
    sessionRefusalCancellation(entry) { return classifySessionRefusal(entry); },
    connection(correlationConnection = null) {
      const connection = Object.freeze({});
      connections.set(connection, { requests: new Map(), correlationConnection });
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
