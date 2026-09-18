#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import './test-project-experience-pinned-diagnostics-v1.mjs';
import { createProjectExperienceRequestDiagnosticsV1 } from './project-experience-request-diagnostics-v1.mjs';
import { createProjectExperienceRequestVerdictV1, UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1 } from './project-experience-request-verdict-v1.mjs';

const route = '/api/vnext/operator/host-round-trip';
const url = `http://localhost:3000${route}`;
const phase = 'companion_first_work_access';
const nextPhase = 'project_home_lifecycle_presentation';
const request = (id, method = 'GET', extra = {}) => ({ method: 'Network.requestWillBeSent', params: {
  requestId: id, frameId: 'frame-raw', loaderId: 'loader-raw', timestamp: 100,
  type: 'Fetch', request: { method, url }, ...extra,
} });
const failed = (id, extra = {}) => ({ method: 'Network.loadingFailed', params: {
  requestId: id, timestamp: 105, type: 'Fetch', errorText: 'net::ERR_ABORTED', ...extra,
} });
const response = (id, extra = {}) => ({ method: 'Network.responseReceived', params: {
  requestId: id, frameId: 'frame-raw', loaderId: 'loader-raw', timestamp: 102,
  type: 'Fetch', response: { url, status: 404 }, ...extra,
} });
function fixture(options) {
  let host = 10_000;
  const collector = createProjectExperienceRequestDiagnosticsV1({ now: () => host++, ...options });
  const connection = collector.connection();
  collector.phase(phase);
  return { collector, connection, observe: payload => collector.observe(connection, payload),
    snapshot: () => collector.snapshot('scenario_failure') };
}

// Protocol and host clocks remain independent; the failure keeps its actual start phase.
{
  const f = fixture();
  f.observe(request('get'));
  f.observe(response('get'));
  f.collector.navigation('http://localhost:3000/projects?private=DUMMY-NOT-A-CREDENTIAL');
  f.observe({ method: 'Page.frameNavigated', params: { frame: {
    id: 'frame-raw', loaderId: 'loader-next', url: 'http://localhost:3000/projects',
  }, type: 'Navigation' } });
  f.collector.phase(nextPhase);
  f.observe(failed('get', { canceled: true }));
  const snapshot = f.snapshot();
  const chain = snapshot.failures[0];
  assert.equal(chain.failure.request, chain.request_start.request);
  assert.equal(chain.failure.protocol_request, chain.request_start.protocol_request);
  assert.equal(chain.failure.method, 'GET');
  assert.equal(chain.failure.route, route);
  assert.equal(chain.failure.request_start_phase, phase);
  assert.equal(chain.failure.failure_received_phase, nextPhase);
  assert.equal(chain.failure.canceled, true);
  assert.equal(chain.failure.response_observed_before_failure, true);
  assert.equal(chain.response.status, 404);
  assert.equal(chain.failure.completion_observed_before_failure, false);
  assert.equal(chain.request_start.cdp_monotonic_seconds, 100);
  assert.equal(chain.failure.cdp_monotonic_seconds, 105);
  assert(chain.failure.host_elapsed_ms < 100, 'host elapsed is not computed from a CDP epoch');
  assert(chain.preceding_lifecycle.some(event => event.kind === 'navigation_intent'));
  assert(chain.preceding_lifecycle.some(event => event.kind === 'Page.frameNavigated'));
  assert.equal(chain.failure.application_cleanup_cause, 'unknown');
  assert(snapshot.events.every((event, index, events) => index === 0 || event.sequence > events[index - 1].sequence));
  f.collector.cleanup();
  f.observe({ method: 'Page.frameStoppedLoading', params: { frameId: 'frame-raw' } });
  assert.equal(snapshot.failures[0].following_lifecycle.length, 0, 'pre-cleanup snapshot is independent');
  const after = f.collector.snapshot('after_cleanup');
  assert(after.failures[0].following_lifecycle.every(event => event.segment === 'cleanup'));
  assert.equal(after.failures[0].failure.segment, 'scenario');
}

// GET, POST, missing and unrecognized methods, and absent cancellation, are not conflated.
for (const [method, expectedMethod] of [['GET', 'GET'], ['POST', 'POST'], [null, null], ['PRIVATE-METHOD', 'unknown']]) {
  for (const canceled of [true, false, undefined]) {
    const f = fixture();
    const start = request('one', method);
    if (method === null) delete start.params.request.method;
    f.observe(start);
    f.collector.step('boundary_active', 'session_refused');
    f.observe(failed('one', canceled === undefined ? {} : { canceled }));
    const chain = f.snapshot().failures[0];
    assert.equal(chain.failure.method, expectedMethod);
    assert.equal(chain.failure.canceled, canceled ?? null);
    assert.equal(chain.failure.response_observed_before_failure, false);
    assert.equal(chain.failure.note_boundary_mode, 'session_refused');
    assert(chain.preceding_lifecycle.some(event => event.kind === 'test_step'));
    assert(!chain.preceding_lifecycle.some(event => event.kind.includes('navigation') || event.kind.startsWith('Page.')),
      'same-page harness boundary label does not manufacture navigation');
    assert.equal(chain.failure.application_cleanup_cause, 'unknown');
  }
}

// Repeated URLs never join distinct requests, connections or CDP sessions.
{
  const f = fixture();
  f.observe(request('get', 'GET'));
  f.observe(request('post', 'POST'));
  f.observe(failed('post'));
  f.observe({ method: 'Network.loadingFinished', params: { requestId: 'get', timestamp: 106 } });
  f.observe(failed('get'));
  const other = f.collector.connection();
  f.collector.observe(other, request('post', 'GET'));
  f.collector.observe(other, failed('post'));
  f.observe({ ...request('get', 'POST'), sessionId: 'other-raw-session' });
  f.observe({ ...failed('get'), sessionId: 'other-raw-session' });
  const snapshot = f.snapshot();
  assert.deepEqual(snapshot.failures.map(chain => chain.failure.method), ['POST', 'GET', 'GET', 'POST']);
  assert.equal(new Set(snapshot.failures.map(chain => chain.failure.request)).size, 4);
  assert.equal(snapshot.failures[1].failure.completion_observed_before_failure, true);
  assert.equal(snapshot.failures[1].completion.kind, 'loading_finished');
  assert.notEqual(snapshot.failures[0].failure.connection, snapshot.failures[2].failure.connection);
  assert.notEqual(snapshot.failures[1].failure.session, snapshot.failures[3].failure.session);
}

// A redirect has a distinct hop. Duplicate IDs without that protocol evidence are ambiguous.
{
  const f = fixture();
  f.observe(request('redirect', 'POST'));
  f.observe(request('redirect', 'GET', { timestamp: 101, redirectResponse: { status: 302 } }));
  f.observe(failed('redirect'));
  f.observe(request('duplicate', 'GET'));
  f.observe(request('duplicate', 'POST'));
  f.observe(failed('duplicate'));
  const snapshot = f.snapshot();
  const redirect = snapshot.failures[0];
  assert.equal(redirect.failure.method, 'GET');
  assert.notEqual(redirect.failure.request, redirect.failure.redirect_from);
  assert.equal(snapshot.events.find(event => event.kind === 'redirect_response').request, redirect.failure.redirect_from);
  assert.equal(redirect.failure.response_observed_before_failure, false, 'prior-hop response is not a response to this hop');
  assert.equal(snapshot.failures[1].failure.match, 'ambiguous_request_id');
  assert.equal(snapshot.failures[1].failure.method, null);
  assert.equal(snapshot.counts.ambiguous_events, 1);
}

// Missing, evicted, mismatched and unknown context must remain explicit.
{
  const f = fixture({ maxRequests: 1 });
  f.observe(request('evicted'));
  f.observe(request('retained'));
  f.observe(failed('evicted'));
  f.observe({ ...failed('retained'), sessionId: 'wrong-session' });
  f.observe(response('retained', { loaderId: 'different-loader' }));
  f.observe(failed('retained'));
  f.observe(failed(undefined));
  f.collector.observe('unknown-connection', failed('retained'));
  const snapshot = f.snapshot();
  for (const chain of [snapshot.failures[0], snapshot.failures[1], snapshot.failures[3], snapshot.failures[4]]) {
    assert.equal(chain.failure.match, 'unmatched');
    assert.equal(chain.request_start, null);
    assert.equal(chain.failure.method, null);
    assert.equal(chain.failure.response_observed_before_failure, null);
  }
  assert(snapshot.failures[0].failure.protocol_request, 'an unmatched protocol ID retains only a run-local alias');
  assert.equal(snapshot.failures[2].failure.response_observed_before_failure, false);
  assert.equal(snapshot.counts.request_contexts_evicted, 1);
  assert.equal(snapshot.counts.unmatched_events, 4);
  assert.equal(snapshot.counts.ambiguous_events, 1);
  assert.equal(snapshot.evidence_incomplete, true);
}

// Small explicit bounds exercise eviction; pinned request context survives the general event ring.
{
  const f = fixture({ maxEvents: 3, maxAliases: 3, maxFailures: 1 });
  f.observe(request('first'));
  f.observe(failed('first'));
  for (let index = 0; index < 70; index += 1) f.collector.navigation('/projects');
  let snapshot = f.snapshot();
  assert.equal(snapshot.events.length, 3);
  assert(snapshot.counts.events_evicted > 0 && snapshot.counts.lifecycle_evicted > 0);
  assert.equal(snapshot.failures[0].request_start.method, 'GET');
  assert.equal(snapshot.failures[0].following_lifecycle.length, 8);
  assert.equal(snapshot.failures[0].following_lifecycle_omitted, 62);
  f.observe(request('second', 'POST'));
  f.observe(failed('second'));
  snapshot = f.snapshot();
  assert.equal(snapshot.failures.length, 1);
  assert.equal(snapshot.failures[0].failure.method, 'POST');
  assert.equal(snapshot.counts.failures_evicted, 1);
  assert(snapshot.counts.aliases_dropped > 0);
  assert(snapshot.failures[0].preceding_lifecycle_omitted > 0);
  assert.equal(snapshot.evidence_incomplete, true);
}

// Arbitrary payload fields, credentials, raw IDs, URLs, query strings and paths never survive.
{
  const f = fixture();
  const secret = 'DUMMY-NOT-A-CREDENTIAL';
  const privatePath = '/private/example-diagnostic-only';
  const payload = request(secret, 'POST', { request: {
    method: 'POST', url: `${url}?token=${secret}#${secret}`,
    headers: { Authorization: secret, Cookie: secret }, postData: secret,
  }, frameId: secret, loaderId: privatePath, initiator: { stack: secret } });
  const before = structuredClone(payload);
  f.observe(payload);
  f.observe(response(secret, { frameId: secret, loaderId: privatePath,
    response: { url: `${url}?token=${secret}`, status: 404, headers: { 'Set-Cookie': secret }, body: secret } }));
  f.observe(failed(secret, { errorText: `net::ERR_${secret}`, blockedReason: secret,
    corsErrorStatus: { failedParameter: secret }, exception: { stack: privatePath }, canceled: secret, type: secret }));
  f.collector.navigation(`http://${secret}@localhost/projects`);
  f.collector.navigation(`file://${privatePath}`);
  f.collector.navigation(`https://unrelated.invalid/${secret}`);
  f.collector.phase(secret);
  f.collector.step(secret, secret);
  const snapshot = f.snapshot();
  assert.deepEqual(payload, before, 'redaction must not mutate the verdict-bearing payload');
  const serialized = JSON.stringify(snapshot);
  for (const forbidden of [secret, privatePath, 'token=', 'Authorization', 'Cookie', 'http://', 'https://', 'file://', 'unrelated.invalid']) {
    assert(!serialized.includes(forbidden), `redaction: ${forbidden}`);
  }
  assert.equal(snapshot.failures[0].failure.error, 'unknown');
  assert.equal(snapshot.failures[0].failure.resource_type, 'unknown');
  assert.equal(snapshot.failures[0].failure.canceled, null);
  assert.equal(snapshot.failures[0].failure.route, route);
  assert.doesNotThrow(() => f.observe({ get method() { throw new Error(secret); } }));
  assert.equal(f.snapshot().counts.observation_errors, 1);
  assert(!JSON.stringify(f.snapshot()).includes(secret));
}

// Execute the owner's real observer and classifiers with identical events, with/without collection.
// This loads only isolated function declarations, never the Browser script's top-level runner.
const source = readFileSync(new URL('./browser-validate-project-experience-v1.mjs', import.meta.url), 'utf8');
function between(start, end) {
  const offset = source.indexOf(start);
  const limit = source.indexOf(end, offset + start.length);
  assert(offset >= 0 && limit > offset, 'owned function boundary exists');
  return source.slice(offset, limit);
}
function ownerObserver(diagnostic) {
  let listener;
  const state = {
    requestDiagnostics: diagnostic,
    requestVerdicts: createProjectExperienceRequestVerdictV1(),
    cdp: { on: callback => { listener = callback; }, send: (...args) => { state.sent.push(args); return Promise.resolve({}); } },
    sent: [], requests: [], responses: [], failedRequests: [], externalRequests: [],
    pausedGuideBriefInterpretationRequests: [], consoleErrors: [], pageErrors: [],
    currentPhase: phase, lastObserverActivityAt: 0, Date: { now: () => 12345 },
    URL, LOCAL_HOSTNAMES: new Set(['localhost', '127.0.0.1', '[::1]']),
  };
  const context = vm.createContext(state);
  vm.runInContext(between('function attachCdpObservers()', 'async function restartRuntime(') +
    between('function expectedStatusResponseIdentity(', 'async function assertLoopbackListener(') +
    '\nattachCdpObservers();', context);
  return { state, observe: listener };
}
{
  const noop = ownerObserver({ connection: () => null, observe() {} });
  const collecting = ownerObserver(createProjectExperienceRequestDiagnosticsV1({ now: () => 1 }));
  const events = [request('get'), response('get'), failed('get', { canceled: true }),
    { method: 'Runtime.bindingCalled', params: { name: '__augnesProjectExperienceDiagnosticEventV1',
      payload: '{"channel":"foreign","kind":"signal_aborted"}' } },
    request('post', 'POST'), failed('post', { canceled: false }), failed('missing'),
    { method: 'Page.frameStoppedLoading', params: { frameId: 'frame-raw' } },
    { method: 'Fetch.requestPaused', params: { requestId: 'pause', request: { url: 'http://localhost:3000/projects' } } },
    { method: 'Runtime.consoleAPICalled', params: { type: 'error', args: [{ value: 'controlled error' }] } },
    { method: 'Runtime.exceptionThrown', params: { exceptionDetails: { text: 'controlled exception' } } }];
  for (const event of events) {
    const before = structuredClone(event);
    noop.observe(event);
    collecting.observe(event);
    assert.deepEqual(event, before);
    for (const key of ['requests', 'responses', 'failedRequests', 'externalRequests', 'pausedGuideBriefInterpretationRequests',
      'consoleErrors', 'pageErrors', 'sent', 'lastObserverActivityAt', 'currentPhase']) {
      assert.equal(JSON.stringify(collecting.state[key]), JSON.stringify(noop.state[key]), `unchanged owner state: ${key}`);
    }
  }
  for (const state of [noop.state, collecting.state]) {
    assert(state.failedRequests.every(entry => state.expectedFailedRequest(entry) === false));
    assert.equal(state.expectedStatusResponseIdentity(state.responses[0]), true, 'expected HTTP response is separate from a loading failure');
    for (const method of ['GET', 'POST', null]) {
      for (const canceled of [true, false, undefined]) {
        assert.equal(state.expectedFailedRequest({ phase, path: route, error_text: 'net::ERR_ABORTED', method, canceled }), false);
      }
    }
    assert.equal(state.expectedFailedRequest({ phase, path: '/api/augnes/read/guide-brief', error_text: 'net::ERR_ABORTED' }), true);
  }
}

// The new verdict-owned exception also has identical behavior with diagnostics off/on.
for (const diagnostic of [{ connection: () => null, observe() {} }, createProjectExperienceRequestDiagnosticsV1()]) {
  const owner = ownerObserver(diagnostic);
  const generation = owner.state.requestVerdicts.armUnavailableExecutionProbe();
  owner.observe(request('background-read'));
  const marked = request('completed-probe');
  marked.params.request.headers = UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1;
  owner.observe(marked);
  owner.observe(response('completed-probe'));
  owner.state.requestVerdicts.completeUnavailableExecutionProbe(generation);
  owner.observe(failed('completed-probe', { canceled: true }));
  assert.equal(owner.state.expectedFailedRequest(owner.state.failedRequests[0]), true);
  assert.equal(owner.state.requestVerdicts.unavailableExecutionAbortReason(owner.state.failedRequests[0]), 'completed_marked_probe_abort');
  owner.observe(response('background-read'));
  owner.observe(failed('background-read', { canceled: true }));
  assert.equal(owner.state.expectedFailedRequest(owner.state.failedRequests[1]), false);
  assert.equal(owner.state.requestVerdicts.unavailableExecutionAbortReason(owner.state.failedRequests[1]), 'probe_marker_absent');
}

// Reporting failure cannot replace a failing result or alter its exit semantics.
{
  const state = { requestDiagnostics: { snapshot() { throw new Error('DUMMY-NOT-A-CREDENTIAL'); } },
    process: { exitCode: 1, stdout: { write() { throw new Error('closed'); } }, stderr: { write() { throw new Error('closed'); } } },
    result: { ok: false, failure: 'original_failure' } };
  vm.runInNewContext(between('function emitRequestDiagnostics(', 'async function main()') + '\nemitRequestDiagnostics("scenario_failure");', state);
  assert.deepEqual(state.result, { ok: false, failure: 'original_failure' });
  assert.equal(state.process.exitCode, 1);
}

process.stdout.write(`${JSON.stringify({ test: 'project-experience-request-diagnostics-v1', status: 'pass',
  synthetic_events_only: true, bounded_redacted_correlation: true, observer_ledgers_and_classifiers_unchanged: true })}\n`);
