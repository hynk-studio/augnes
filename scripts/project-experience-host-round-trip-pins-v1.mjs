import { randomBytes } from 'node:crypto';
import { CONSUMER_DIAGNOSTIC_BINDING_V1, projectExperienceConsumerScriptV1 } from './project-experience-consumer-diagnostics-v1.mjs';

const PHASE = 'companion_first_work_access';
const ROUTE = '/api/vnext/operator/host-round-trip';
const OWNERS = new Set(['marked_unavailable_execution_probe', 'delegated_work_initial_read',
  'delegated_work_refresh_or_poll', 'other_known', 'unknown']);
const AUTH = new Set(['authenticated', 'locked_or_refused', 'unavailable', 'unknown']);
const KINDS = new Set(['read_created', 'controller_created', 'fetch_started', 'response_headers_received',
  'body_read_started', 'body_read_completed', 'body_read_failed', 'consumer_returned', 'consumer_disposed',
  'cleanup_observed', 'abort_requested', 'abort_call_returned', 'signal_aborted', 'probe_completed', 'consumer_mounted',
  'effect_active', 'effect_cleanup', 'auth_transition_requested']);
const integer = (value, bound) => Number.isInteger(value) && value >= 0 && value <= bound;
const marker = headers => {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return 'absent';
  const keys = Object.keys(headers).filter(key => key.toLowerCase() === 'x-augnes-e2e-probe');
  return !keys.length ? 'absent' : keys.length === 1 && headers[keys[0]] === 'unavailable-execution-v1' ? 'exact' : 'invalid';
};

// Separate fixed pins; neither the general event ring nor its request map owns
// their lifetime. Raw correlation keys and injected frame tokens stay ephemeral.
export function createHostRoundTripPinsV1({ stamp, maxPins = 32 } = {}) {
  if (!integer(maxPins, 32) || maxPins < 1) throw new Error('route_pin_bound_invalid');
  const channel = randomBytes(16).toString('hex');
  const framePattern = new RegExp(`^augnes-pe-diagnostic/${channel}/[a-f0-9-]{36}/[1-9][0-9]?$`);
  const pins = new Map(), generations = new Map(), consumers = new Map(), documents = new Map();
  const counts = { pin_overflow: 0, consumer_overflow: 0, lifecycle_overflow: 0, ambiguous: 0, observation_errors: 0 };
  const guard = action => { try { return action(); } catch { counts.observation_errors += 1; return null; } };
  const keyFor = (connection, session, document, id) => JSON.stringify([connection, session, document, id]);
  const invalidate = entry => { entry.ambiguous = true; counts.ambiguous += 1; };
  const bind = () => {
    for (const pin of pins.values()) {
      if (!pin.frame) continue;
      const generation = generations.get(pin.frame);
      if (!generation || pin.connection !== generation.connection || pin.session !== generation.session) continue;
      if (generation.owner === 'marked_unavailable_execution_probe' ? !pin.probeCallSite : !pin.delegatedCallSite) continue;
      pin.generation = generation;
      const matches = [...pins.values()].filter(other => other.frame === pin.frame);
      if (matches.length !== 1 || (generation.owner === 'marked_unavailable_execution_probe' && pin.marker !== 'exact')) {
        for (const match of matches) if (!match.ambiguous) invalidate(match);
      }
    }
  };
  const publicPin = pin => {
    const generation = pin.generation;
    const consumer = generation?.consumer;
    const events = generation?.events ?? [];
    const observed = kind => events.find(event => event.kind === kind)?.sequence ?? null;
    const abort = observed('signal_aborted'), cleanup = observed('cleanup_observed'), requested = observed('abort_requested');
    const returned = observed('abort_call_returned');
    const bodyComplete = observed('body_read_completed'), bodyFailed = observed('body_read_failed');
    const cycle = consumer?.events.filter(event => event.effect === generation.effect) ?? [];
    const next = consumer?.events.find(event => event.kind === 'effect_active' && event.effect === generation.effect + 1);
    const active = cycle.find(event => event.kind === 'effect_active');
    const disposed = cycle.find(event => event.kind === 'consumer_disposed');
    const remounted = disposed && consumer.events.some(event => event.kind === 'consumer_mounted' && event.sequence > disposed.sequence);
    const reason = !cleanup ? 'unknown' : next && active && next.enabled !== active.enabled ? 'enabled_changed' :
      disposed && !remounted ? 'unmount' : 'unknown';
    const known = !pin.ambiguous && !!generation && !generation.ambiguous && !consumer?.incomplete;
    return { request: pin.request, connection: pin.connection, session: pin.session,
      request_start_phase: pin.phase, request_start_sequence: pin.sequence, method: pin.method, marker: pin.marker,
      response_observed: pin.response, response_status: pin.status, loadingFinished: pin.finished,
      response_observed_before_failure: pin.responseBeforeFailure, loadingFinished_before_failure: pin.finishedBeforeFailure,
      loadingFailed: pin.failed, error: pin.error, canceled: pin.canceled,
      failure_phase: pin.failurePhase, failure_sequence: pin.failureSequence,
      ambiguous: pin.ambiguous || generation?.ambiguous === true, owner: known ? generation.owner : 'unknown',
      generation: generation?.alias ?? null, controller: observed('controller_created') ? generation.alias : null,
      body_settlement: bodyComplete ? 'completed' : bodyFailed ? 'failed' : 'unknown',
      body_completed_before_abort: abort === null ? null : bodyComplete === null ? null : bodyComplete < abort,
      abort_reason: known ? reason : 'unknown',
      cleanup_signal_abort_proven: known && !generation.incomplete && Object.values(counts).every(value => value === 0) &&
        cleanup !== null && requested !== null && abort !== null &&
        returned !== null && cleanup < requested && requested < abort && abort < returned,
      consumer_events: events, effect_and_auth_events: consumer?.events ?? [],
      evidence_incomplete: !known || (bodyComplete === null && bodyFailed === null) ||
        generation?.incomplete === true || Object.values(counts).some(value => value > 0) };
  };
  return Object.freeze({
    browserSource: () => projectExperienceConsumerScriptV1(channel),
    completeProbe(phase) { guard(() => {
      if (phase !== PHASE) return;
      const candidates = [...pins.values()].filter(pin => pin.generation?.owner === 'marked_unavailable_execution_probe');
      if (candidates.length !== 1 || candidates[0].ambiguous) { counts.ambiguous += 1; return; }
      const generation = candidates[0].generation;
      if (generation.events.length >= 64) { counts.lifecycle_overflow += 1; generation.incomplete = true; return; }
      generation.events.push({ sequence: stamp(), kind: 'probe_completed', effect: 0,
        auth: 'unknown', enabled: null, status: null });
    }); },
    consumer(connection, session, payload, phase) { guard(() => {
      if (phase !== PHASE || payload?.method !== 'Runtime.bindingCalled' ||
        payload.params?.name !== CONSUMER_DIAGNOSTIC_BINDING_V1) return;
      const raw = payload.params.payload;
      if (typeof raw !== 'string' || raw.length > 2048) { counts.observation_errors += 1; return; }
      const value = JSON.parse(raw);
      if (value.channel !== channel) return;
      if (!/^[a-f0-9-]{36}$/.test(value.document) || !integer(value.ordinal, 1025) || value.ordinal === 0) {
        counts.observation_errors += 1; return;
      }
      const documentKey = keyFor(connection, session, value.document, 0);
      if (!documents.has(documentKey) && documents.size >= 32) { counts.consumer_overflow += 1; return; }
      const previous = documents.get(documentKey);
      if (previous !== undefined && value.ordinal !== previous + 1) counts.observation_errors += 1;
      documents.set(documentKey, value.ordinal);
      if (value.kind === 'overflow') { counts.consumer_overflow += 1; return; }
      if (!/^[a-f0-9-]{36}$/.test(value.document) || !KINDS.has(value.kind) ||
        !integer(value.consumer, 4) || !integer(value.effect, 32)) { counts.observation_errors += 1; return; }
      const consumerKey = keyFor(connection, session, value.document, value.consumer);
      let consumer = consumers.get(consumerKey);
      if (!consumer) {
        if (consumers.size >= 32) { counts.consumer_overflow += 1; return; }
        consumer = { events: [], incomplete: false }; consumers.set(consumerKey, consumer);
      }
      const event = { sequence: stamp(), kind: value.kind, effect: value.effect,
        auth: AUTH.has(value.auth) ? value.auth : 'unknown',
        enabled: typeof value.enabled === 'boolean' ? value.enabled : null,
        status: integer(value.status, 599) && value.status >= 100 ? value.status : null };
      let target = consumer;
      if (value.generation !== undefined) {
        if (!integer(value.generation, 32) || value.generation === 0) { counts.observation_errors += 1; return; }
        const frame = `augnes-pe-diagnostic/${channel}/${value.document}/${value.generation}`;
        target = generations.get(frame);
        if (!target) {
          if (generations.size >= 32 || value.kind !== 'read_created') { counts.consumer_overflow += 1; return; }
          target = { alias: `generation-${generations.size + 1}`, owner: OWNERS.has(value.owner) ? value.owner : 'unknown',
            consumer, effect: value.effect, connection, session, events: [], incomplete: false, ambiguous: false };
          generations.set(frame, target);
        } else if (target.consumer !== consumer || target.connection !== connection || target.session !== session ||
          target.owner !== value.owner || target.effect !== value.effect || value.kind === 'read_created') invalidate(target);
      }
      if (target.events.length >= 64) { counts.lifecycle_overflow += 1; target.incomplete = true; }
      else target.events.push(event);
      bind();
    }); },
    start(key, start, params) { guard(() => {
      if (key && pins.has(key)) { invalidate(pins.get(key)); return; }
      if (start.phase !== PHASE || start.route !== ROUTE) return;
      if (!key) { counts.ambiguous += 1; return; }
      if (pins.size >= maxPins) { counts.pin_overflow += 1; return; }
      // Only the synchronous initiator stack can bind the injected invocation.
      // URL, headers, arbitrary owner fields and asynchronous ancestors cannot.
      const frames = (params.initiator?.stack?.callFrames ?? []).slice(0, 32)
        .filter(frame => typeof frame.url === 'string' && framePattern.test(frame.url));
      const unique = [...new Set(frames.map(frame => frame.url))];
      const callSites = (params.initiator?.stack?.callFrames ?? []).slice(0, 32);
      const delegatedCallSite = callSites.some(frame => typeof frame.url === 'string' &&
        frame.url.startsWith('webpack-internal:///(app-pages-browser)/') &&
        frame.url.endsWith('/components/delegated-work/use-delegated-codex-work-v0-1.ts'));
      const probeCallSite = callSites.some(frame => frame.url === 'augnes-project-experience-marked-probe-v1');
      pins.set(key, { request: start.request, connection: start.connection, session: start.session,
        phase: start.phase, sequence: start.sequence, method: start.method, marker: marker(params.request?.headers),
        frame: unique.length === 1 && start.method === 'GET' ? unique[0] : null, generation: null,
        delegatedCallSite, probeCallSite,
        frameAlias: start.frame, loaderAlias: start.loader,
        ambiguous: start.ambiguous_request_id || params.redirectResponse != null || unique.length > 1,
        response: false, status: null, finished: false, failed: false, error: null, canceled: null,
        responseBeforeFailure: null, finishedBeforeFailure: null,
        failurePhase: null, failureSequence: null });
      bind();
    }); },
    protocol(key, event) { guard(() => {
      const pin = pins.get(key); if (!pin) return;
      if ((event.frame && event.frame !== pin.frameAlias) || (event.loader && event.loader !== pin.loaderAlias)) {
        invalidate(pin); return;
      }
      if (event.kind === 'response_received') {
        if (event.response_route !== ROUTE) { invalidate(pin); return; }
        if (pin.response || pin.failed) invalidate(pin);
        pin.response = true; pin.status = event.status;
      } else if (event.kind === 'loading_finished') pin.finished = true;
      else if (event.kind === 'loading_failed') {
        if (pin.failed) invalidate(pin);
        pin.failed = true; pin.error = event.error; pin.canceled = event.canceled;
        pin.responseBeforeFailure = pin.response; pin.finishedBeforeFailure = pin.finished;
        pin.failurePhase = event.phase; pin.failureSequence = event.sequence;
      }
    }); },
    snapshot() { const requests = [...pins.values()].map(publicPin); return { schema: 'host_round_trip_pinned_diagnostics.v1', authority: 'diagnostic_only_no_verdict',
      limits: { requests: maxPins, consumers: 32, generations: 32, events_per_consumer_or_generation: 64 },
      counts: { ...counts }, overflow: counts.pin_overflow > 0 || counts.consumer_overflow > 0 || counts.lifecycle_overflow > 0,
      evidence_incomplete: Object.values(counts).some(value => value > 0) || requests.some(pin => pin.evidence_incomplete), requests }; },
  });
}
