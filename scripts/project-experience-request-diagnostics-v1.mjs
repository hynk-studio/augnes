// Passive, private-test-owner diagnostics. None of these records decide acceptance.
import { createHostRoundTripPinsV1 } from './project-experience-host-round-trip-pins-v1.mjs';
const PHASES = new Set(['setup', 'project_onboarding_and_naming', 'guidebrief_model_interpretation',
  'project_shell_and_locked_entry', 'responsive_first_work_presentation', 'companion_first_work_access',
  'project_home_lifecycle_presentation', 'rendered_state_responsive_matrix', 'retired_route_safety',
  'project_experience_global_boundaries']);
const STEPS = new Set(['read_current_notes', 'reread_current_notes', 'boundary_install', 'boundary_active',
  'boundary_remove', 'boundary_removed']);
const MODES = new Set(['revision_unavailable', 'source_unavailable', 'projection_missing', 'project_changed', 'session_refused']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE']);
const TYPES = new Set(['Document', 'Stylesheet', 'Image', 'Media', 'Font', 'Script', 'TextTrack', 'XHR',
  'Fetch', 'Prefetch', 'EventSource', 'WebSocket', 'Manifest', 'SignedExchange', 'Ping', 'CSPViolationReport', 'Preflight', 'Other']);
const ERRORS = new Set(['net::ERR_ABORTED', 'net::ERR_FAILED', 'net::ERR_INCOMPLETE_CHUNKED_ENCODING',
  'net::ERR_CONNECTION_REFUSED', 'net::ERR_CONNECTION_RESET', 'net::ERR_TIMED_OUT', 'net::ERR_NAME_NOT_RESOLVED',
  'net::ERR_BLOCKED_BY_CLIENT', 'net::ERR_NETWORK_CHANGED']);
const ROUTES = new Set(['/', '/projects', '/workbench', '/workbench/semantic-review', '/workbench/inspector',
  '/api/vnext/projects', '/api/vnext/operator/host-round-trip', '/api/vnext/operator/semantic-review',
  '/api/vnext/operator/project-continuity', '/api/vnext/operator/session', '/api/vnext/operator/inspector', '/api/augnes/read/guide-brief',
  '/api/vnext/operator/guide-brief/interpretation', '/api/augnes/guide-brief/interpretation', '/_next/webpack-hmr']);
const EVENTS = new Set(['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished',
  'Network.loadingFailed', 'Page.frameNavigated', 'Page.navigatedWithinDocument', 'Page.frameStartedLoading',
  'Page.frameStoppedLoading']);
const allowed = (set, value) => set.has(value) ? value : value == null ? null : 'unknown';
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : null;
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 256 ? value : null;
const status = value => Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;

function route(value) {
  if (value === 'about:blank') return 'about:blank';
  if (typeof value !== 'string' || value.length > 8192) return 'unknown_route';
  try {
    const url = new URL(value, 'http://localhost');
    if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return 'external_or_unsupported';
    if (url.username || url.password) return 'unknown_route';
    if (ROUTES.has(url.pathname)) return url.pathname;
    if (url.pathname.startsWith('/_next/static/')) return '/_next/static/:asset';
    if (url.pathname.startsWith('/projects/')) return '/projects/:project';
  } catch { /* Raw URLs and parsing exceptions never enter the sidecar. */ }
  return 'unknown_route';
}

export function createProjectExperienceRequestDiagnosticsV1({ now = () => performance.now(),
  maxEvents = 512, maxRequests = 256, maxAliases = 1024, maxFailures = 16, maxPins = 32 } = {}) {
  for (const [value, bound] of [[maxEvents, 512], [maxRequests, 256], [maxAliases, 1024], [maxFailures, 16]]) {
    if (!Number.isInteger(value) || value < 1 || value > bound) throw new Error('request_diagnostic_bound_invalid');
  }
  const origin = now();
  const events = [], lifecycle = [], failures = [];
  const requests = new Map(), aliases = new Map(), connections = new Set();
  const counts = { events_evicted: 0, lifecycle_evicted: 0, request_contexts_evicted: 0, aliases_dropped: 0,
    failures_evicted: 0, unmatched_events: 0, ambiguous_events: 0, observation_errors: 0 };
  let sequence = 0, connectionCount = 0, requestCount = 0, navigationCount = 0;
  let phase = 'setup', step = null, mode = null, segment = 'scenario';
  const guard = action => { try { return action(); } catch { counts.observation_errors += 1; return null; } };
  const retain = (list, value, limit, counter) => {
    list.push(value);
    if (list.length > limit) { list.shift(); counts[counter] += 1; }
  };
  const alias = (kind, scope, raw) => {
    if (!identifier(raw)) return null;
    const key = JSON.stringify([kind, scope, raw]);
    if (aliases.has(key)) return aliases.get(key);
    if (aliases.size >= maxAliases) { counts.aliases_dropped += 1; return null; }
    const value = `${kind}-${aliases.size + 1}`; aliases.set(key, value); return value;
  };
  const append = (kind, fields = {}, protocolTime = null, isLifecycle = false) => {
    const event = { sequence: ++sequence, host_elapsed_ms: finite(now() - origin),
      cdp_monotonic_seconds: finite(protocolTime), segment, phase, test_step: step, note_boundary_mode: mode, kind, ...fields };
    retain(events, event, maxEvents, 'events_evicted');
    if (isLifecycle) {
      retain(lifecycle, event, 64, 'lifecycle_evicted');
      for (const failure of failures) {
        if (failure.following_lifecycle.length < 8) failure.following_lifecycle.push(event);
        else failure.following_lifecycle_omitted += 1;
      }
    }
    return event;
  };
  const context = (connection, session, params) => ({ connection, session,
    frame: alias('frame', `${connection}:${session}`, params.frameId),
    loader: alias('loader', `${connection}:${session}`, params.loaderId) });
  const requestFields = entry => entry ? { request: entry.request, route: entry.route, method: entry.method,
    request_start_phase: entry.start.phase, request_start_sequence: entry.start.sequence,
    frame: entry.start.frame, loader: entry.start.loader, redirect_from: entry.redirectFrom } :
    { request: null, route: 'unknown_route', method: null, request_start_phase: null, request_start_sequence: null };
  const pins = createHostRoundTripPinsV1({ maxPins, stamp: () => append('consumer_observation').sequence });

  return Object.freeze({
    browserSource: () => pins.browserSource(),
    installationFailed() { counts.observation_errors += 1; },
    completeProbe() { pins.completeProbe(phase); },
    connection() { return guard(() => {
      if (connections.size >= 16) { counts.aliases_dropped += 1; return null; }
      const connection = `connection-${++connectionCount}`; connections.add(connection);
      append('cdp_connection', { connection }, null, true); return connection;
    }); },
    phase(value) { guard(() => { phase = allowed(PHASES, value); step = null; mode = null; append('phase_start', {}, null, true); }); },
    step(value, boundaryMode = undefined) { guard(() => {
      step = allowed(STEPS, value); if (boundaryMode !== undefined) mode = allowed(MODES, boundaryMode);
      append('test_step', {}, null, true);
    }); },
    navigation(value) { guard(() => append('navigation_intent', { navigation: `navigation-${++navigationCount}`, route: route(value) }, null, true)); },
    cleanup() { guard(() => { segment = 'cleanup'; append('cleanup_start', {}, null, true); }); },
    observe(connection, payload) { guard(() => {
      if (!connections.has(connection)) connection = null;
      const p = payload.params ?? {};
      const session = payload.sessionId == null ? 'root-session' : alias('session', connection, payload.sessionId);
      if (payload?.method === 'Runtime.bindingCalled') {
        pins.consumer(connection, session, payload, phase); return;
      }
      if (!EVENTS.has(payload?.method)) return;
      const ctx = { ...context(connection, session, p),
        protocol_request: alias('protocol-request', `${connection}:${session}`, p.requestId) };
      if (payload.method.startsWith('Page.')) {
        const frame = p.frame ?? p;
        append(payload.method, { ...context(connection, session, { frameId: frame.id ?? p.frameId, loaderId: frame.loaderId }),
          route: frame.url === undefined ? null : route(frame.url),
          navigation_type: allowed(new Set(['Navigation', 'BackForwardCacheRestore', 'fragment', 'historyApi', 'other']), p.type ?? p.navigationType) }, p.timestamp, true);
        return;
      }
      const key = connection && session && identifier(p.requestId) ? JSON.stringify([connection, session, p.requestId]) : null;
      let entry = key ? requests.get(key) : null;
      if (payload.method === 'Network.requestWillBeSent') {
        const redirected = p.redirectResponse != null;
        const ambiguous = !!entry && (!redirected || entry.terminal || entry.ambiguous);
        if (redirected && entry && !ambiguous) {
          entry.response = append('redirect_response', { ...ctx, ...requestFields(entry), status: status(p.redirectResponse.status),
            timestamp_source: 'requestWillBeSent_carrying_redirectResponse' }, p.timestamp);
        }
        const redirectFrom = redirected && entry && !ambiguous ? entry.request : null;
        const start = append('request_start', { ...ctx, request: `request-${++requestCount}`, route: route(p.request?.url),
          method: allowed(METHODS, p.request?.method), resource_type: allowed(TYPES, p.type),
          redirect_from: redirectFrom, redirect_context_missing: redirected && !redirectFrom, ambiguous_request_id: ambiguous }, p.timestamp);
        pins.start(key, start, p);
        if (key) {
          if (!requests.has(key) && requests.size >= maxRequests) { requests.delete(requests.keys().next().value); counts.request_contexts_evicted += 1; }
          requests.set(key, { request: start.request, route: start.route, method: start.method, start,
            response: null, completion: null, terminal: false, ambiguous, redirectFrom });
        }
        return;
      }
      let match = !entry ? 'unmatched' : entry.ambiguous ? 'ambiguous_request_id' :
        (p.frameId && (!ctx.frame || ctx.frame !== entry.start.frame)) ||
        (p.loaderId && (!ctx.loader || ctx.loader !== entry.start.loader)) ? 'context_mismatch' : 'matched';
      if (match !== 'matched') {
        counts[match === 'unmatched' ? 'unmatched_events' : 'ambiguous_events'] += 1; entry = null;
      }
      const fields = { ...ctx, ...requestFields(entry), match };
      if (payload.method === 'Network.responseReceived') {
        const event = append('response_received', { ...fields, status: status(p.response?.status), response_route: route(p.response?.url), resource_type: allowed(TYPES, p.type) }, p.timestamp);
        pins.protocol(key, event);
        if (entry) entry.response = event;
      } else if (payload.method === 'Network.loadingFinished') {
        const event = append('loading_finished', fields, p.timestamp);
        pins.protocol(key, event);
        if (entry) { entry.completion = event; entry.terminal = true; }
      } else {
        const event = append('loading_failed', { ...fields, failure_received_phase: phase,
          canceled: typeof p.canceled === 'boolean' ? p.canceled : null, resource_type: allowed(TYPES, p.type),
          error: allowed(ERRORS, p.errorText), response_observed_before_failure: entry ? entry.response !== null : null,
          completion_observed_before_failure: entry ? entry.completion !== null : null, application_cleanup_cause: 'unknown' }, p.timestamp);
        pins.protocol(key, event);
        retain(failures, { failure: event, request_start: entry?.start ?? null, response: entry?.response ?? null,
          completion: entry?.completion ?? null, preceding_lifecycle: lifecycle.slice(-8),
          preceding_lifecycle_omitted: Math.max(0, lifecycle.length - 8) + counts.lifecycle_evicted,
          following_lifecycle: [], following_lifecycle_omitted: 0 }, maxFailures, 'failures_evicted');
        if (entry) entry.terminal = true;
      }
    }); },
    snapshot(checkpoint) { return guard(() => { const pinned = pins.snapshot(); return structuredClone({ diagnostic_version: 'project_experience_request_correlation.v1',
      checkpoint: allowed(new Set(['scenario_failure', 'scenario_complete', 'after_cleanup']), checkpoint),
      clocks: { host_elapsed_ms: 'performance.now milliseconds since collector creation; receipt order only',
        cdp_monotonic_seconds: 'CDP timestamp as supplied; no host/protocol epoch subtraction' },
      authority: 'diagnostic_only_no_verdict', limits: { maxEvents, maxRequests, maxAliases, maxFailures,
        lifecycle: 64, failure_lifecycle_each_side: 8 },
      counts, totals: { events: sequence, requests: requestCount, loading_failures: failures.length + counts.failures_evicted },
      evidence_incomplete: pinned.evidence_incomplete || Object.values(counts).some(value => value > 0) ||
        failures.some(failure => failure.preceding_lifecycle_omitted > 0 || failure.following_lifecycle_omitted > 0),
      limitations: ['Retention loss or missing context cannot prove event absence.', 'Temporal association does not establish cancellation cause.',
        'Step and boundary-mode labels describe harness intent, not observed application cleanup.'],
      events, failures, host_round_trip_pins: pinned, application_cleanup_cause: 'unknown' }); }); },
  });
}
