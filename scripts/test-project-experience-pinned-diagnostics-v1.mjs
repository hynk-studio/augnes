#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { createProjectExperienceRequestDiagnosticsV1 } from './project-experience-request-diagnostics-v1.mjs';
import { CONSUMER_DIAGNOSTIC_BINDING_V1 } from './project-experience-consumer-diagnostics-v1.mjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const phase = 'companion_first_work_access';
const route = '/api/vnext/operator/host-round-trip';
const url = `http://localhost:3000${route}`;

function fixture(options = {}) {
  const collector = createProjectExperienceRequestDiagnosticsV1(options);
  const connection = collector.connection(); collector.phase(phase);
  const packets = [], calls = [], receivers = [];
  let id = 0, throwTransport = false, returnedPromise = Promise.resolve(null), knownCallSite = true;
  const observe = payload => collector.observe(connection, payload);
  const start = (requestId, headers, frames = []) => observe({ method: 'Network.requestWillBeSent', params: {
    requestId, type: 'Fetch', request: { url, method: 'GET', headers },
    initiator: { stack: { callFrames: frames.map(url => ({ url })) } },
  } });
  const window = {
    [CONSUMER_DIAGNOSTIC_BINDING_V1](payload) {
      if (throwTransport) throw new Error('synthetic-transport-error');
      packets.push(payload);
      observe({ method: 'Runtime.bindingCalled', params: { name: CONSUMER_DIAGNOSTIC_BINDING_V1, payload } });
    },
    fetch(...args) {
      receivers.push(this);
      const frames = [...new Error().stack.matchAll(/augnes-pe-diagnostic\/[a-f0-9]+\/[a-f0-9-]+\/\d+/g)].map(match => match[0]);
      if (knownCallSite) frames.push(args[1]?.headers?.['x-augnes-e2e-probe'] === 'unavailable-execution-v1'
        ? 'augnes-project-experience-marked-probe-v1'
        : 'webpack-internal:///(app-pages-browser)/./components/delegated-work/use-delegated-codex-work-v0-1.ts');
      calls.push(args); start(`raw-request-${++id}`, args[1]?.headers, frames);
      return returnedPromise;
    },
  };
  vm.runInNewContext(collector.browserSource(), { window, location: { hostname: 'localhost' },
    crypto: { randomUUID: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } });
  const portal = window.__augnesProjectExperienceDiagnosticsV1;
  const observer = portal.consumer({});
  const response = (requestId = `raw-request-${id}`) => observe({ method: 'Network.responseReceived', params: {
    requestId, type: 'Fetch', response: { url, status: 404 },
  } });
  const failure = (requestId = `raw-request-${id}`) => observe({ method: 'Network.loadingFailed', params: {
    requestId, type: 'Fetch', errorText: 'net::ERR_ABORTED', canceled: true,
  } });
  return { collector, connection, observe, start, response, failure, portal, observer, window, packets, calls, receivers,
    snapshot: () => collector.snapshot('scenario_failure').host_round_trip_pins,
    promise: value => { returnedPromise = value; }, transportFailure: () => { throwTransport = true; },
    unrelatedCallSite: () => { knownCallSite = false; } };
}

// Execute the actual hook, including its unchanged abort call and cleanup. The
// same controlled headers/body schedule produces the same request and UI state
// with the observer absent or present; no timers or additional fetches appear.
for (const outcome of ['complete', 'body-failed', 'cleanup-during-body']) {
  const runs = [];
  for (const instrumented of [false, true]) {
    const f = fixture();
    const effects = [], states = [], requests = [];
    let jsonCalls = 0, resolveBody, rejectBody;
    const body = new Promise((resolve, reject) => { resolveBody = resolve; rejectBody = reject; });
    const response = { status: 404, ok: false, json() { jsonCalls++; return body; } };
    const nativeFetch = f.window.fetch;
    f.promise(Promise.resolve(response));
    const fetch = (...args) => { requests.push(args); return nativeFetch(...args); };
    f.window.fetch = fetch;
    const react = { useRef: current => ({ current }), useCallback: callback => callback,
      useState: initial => [initial, value => states.push(value)], useEffect: effect => effects.push(effect) };
    const source = readFileSync(new URL('../components/delegated-work/use-delegated-codex-work-v0-1.ts', import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => { assert.equal(name, 'react'); return react; }, fetch,
      AbortController, window: { setTimeout() { assert.fail('unavailable projection cannot poll'); } } });
    const hook = exports.useDelegatedCodexWorkV01(true, instrumented ? f.observer : null);
    const cleanups = effects.map(effect => effect());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(jsonCalls, 1, JSON.stringify({ instrumented, states, requests: requests.length }));
    if (outcome === 'cleanup-during-body') cleanups.forEach(cleanup => cleanup?.());
    if (outcome === 'body-failed') rejectBody(new Error('synthetic body failure'));
    else resolveBody({ error_code: 'not_found' });
    await new Promise(resolve => setImmediate(resolve));
    if (outcome !== 'cleanup-during-body') cleanups.forEach(cleanup => cleanup?.());
    const observed = { states, jsonCalls, requests: requests.map(([path, options]) => ({ path,
      method: options.method, credentials: options.credentials, cache: options.cache, aborted: options.signal.aborted,
      keys: Object.keys(options) })), count: hook.requestCountRef.current };
    runs.push(JSON.stringify(observed));
    if (instrumented) {
      const pin = f.snapshot().requests[0];
      assert.equal(pin.body_settlement, outcome === 'body-failed' ? 'failed' : 'completed');
      assert.equal(pin.cleanup_signal_abort_proven, outcome === 'cleanup-during-body');
      if (outcome === 'cleanup-during-body') assert.equal(pin.body_completed_before_abort, false);
    }
  }
  assert.equal(runs[0], runs[1], outcome);
}

// Exact token baselines from 7597ed20: all nine phase calls/actions/order and
// acceptance/navigation/quiet/deadline owners are unchanged. Only the two
// explicitly observational call-site additions are removed for comparison.
{
  const source = readFileSync(new URL('./browser-validate-project-experience-v1.mjs', import.meta.url), 'utf8');
  const file = ts.createSourceFile('owner.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const tokens = text => {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
    const values = []; while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) values.push(scanner.getTokenText());
    return values;
  };
  const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const expected = {
    runPhase: '547dcdc354d69e5288144b6a888c436e546102d509cdec352673c929ec0191d2',
    navigate: '2dbcba067b8c962ccb04e72155be6129be5f4e4a2447935621ac85208cfefddf',
    waitForRequestQuiet: 'b6fe49600739070ebf72e8048a26b605a7ff2a255c7d1ad86a9ee0c35c7c3c74',
    expectedFailedRequest: '8d3be1d495c75a0ff27bf9c6feafed8821bc400ca2629aad0608f330ccf9ec3c',
  };
  const phases = [], found = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 'runPhase') {
      const text = node.getText(file).replace(/^[ \t]*diagnosticProbe: true,\n/gm, '')
        .replace(/^[ \t]*\/\/ Observational only; the verdict completion above remains the sole owner\.\n[ \t]*requestDiagnostics\.completeProbe\?\.\(\);\n/gm, '');
      phases.push(tokens(text));
    }
    if (ts.isFunctionDeclaration(node) && Object.hasOwn(expected, node.name?.text)) {
      assert.equal(hash(tokens(node.getText(file))), expected[node.name.text], node.name.text); found.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file); assert.equal(found.length, 4);
  assert.equal(hash(phases), '5fb748dca3482e7acd6a40fe2e522d15e79d685f906f249022fa87eac5ba4641');
  assert(source.includes('const DEFAULT_TIMEOUT_MS = 45_000;'));
  assert(source.includes('const REQUEST_QUIET_MS = 500;'));
  assert(source.includes('const ACCEPTANCE_BOUND_MS = 360_000;'));
}
function read(f, { initial = true, controller = new AbortController() } = {}) {
  f.observer.effectActive(true); f.observer.auth('authenticated');
  f.observer.initialReadInvocation(initial);
  const observation = f.observer.beginRead(controller);
  observation.fetch(route, { method: 'GET', signal: controller.signal });
  f.observer.initialReadInvocation(false);
  return { observation, controller };
}

// An initial invocation can be skipped by the hook's existing in-flight guard.
// Its diagnostic label must not survive into a later explicit/poll read.
{
  const f = fixture();
  f.observer.initialReadInvocation(true);
  // No beginRead: the product guard returned before starting any request.
  f.observer.initialReadInvocation(false);
  const read = f.observer.beginRead(new AbortController());
  read.fetch(route, { method: 'GET' });
  assert.equal(f.snapshot().requests[0].owner, 'delegated_work_refresh_or_poll');
  const source = readFileSync(new URL('../components/delegated-work/use-delegated-codex-work-v0-1.ts', import.meta.url), 'utf8');
  assert.match(source, /diagnostic\?\.initialReadInvocation\(true\);\s*void read\(\);\s*diagnostic\?\.initialReadInvocation\(false\);/);
}

// The actual session callback records only a state that reached the setter.
// The diagnostic identity is an empty stable object, never the private guard.
{
  const source = readFileSync(new URL('../components/workbench/semantic-review/semantic-review-surface.tsx', import.meta.url), 'utf8');
  const file = ts.createSourceFile('surface.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.equal(declarations.get('requestDiagnosticIdentity').initializer.getText(file), 'useRef<object>({})');
  assert.equal(declarations.get('requestDiagnostic').initializer.arguments[0].getText(file), 'requestDiagnosticIdentity.current');
  const callback = declarations.get('updateSessionState').initializer.arguments[0].getText(file);
  const code = ts.transpileModule(`globalThis.callback = ${callback};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const guardThrows of [false, true]) {
    const calls = [], error = new Error('synthetic guard failure');
    const context = { privateReadGuard: { current: { setSession() { calls.push('guard'); if (guardThrows) throw error; } } },
      setLoadingPrivateView: () => calls.push('loading'), setSessionState: () => calls.push('state'),
      requestDiagnostic: { auth: value => calls.push(`auth:${value}`) } };
    vm.runInNewContext(code, context);
    if (guardThrows) assert.throws(() => context.callback({ status: 'locked' }), caught => caught === error);
    else context.callback({ status: 'locked' });
    assert.deepEqual(calls, guardThrows ? ['guard'] : ['guard', 'loading', 'state', 'auth:locked']);
  }
}

// The actual injected invocation frame binds ownership. A URL, marker, copied
// owner field or caller-created payload is insufficient, even on the same route.
{
  const f = fixture();
  const { observation } = read(f);
  observation.event('response_headers_received', 404); observation.event('body_read_started');
  f.start('unrelated', { 'x-augnes-e2e-probe': 'unavailable-execution-v1', owner: 'delegated_work_initial_read' });
  const fake = JSON.stringify({ ...JSON.parse(f.packets[0]), channel: 'forged', kind: 'read_created', owner: 'other_known' });
  f.observe({ method: 'Runtime.bindingCalled', params: { name: CONSUMER_DIAGNOSTIC_BINDING_V1, payload: fake } });
  const snapshot = f.snapshot();
  assert.equal(snapshot.requests[0].owner, 'delegated_work_initial_read');
  assert.equal(snapshot.requests[0].body_settlement, 'unknown');
  assert.equal(snapshot.requests[0].body_completed_before_abort, null);
  assert.equal(snapshot.requests[0].evidence_incomplete, true, 'unobserved body settlement is not complete evidence');
  assert.equal(snapshot.evidence_incomplete, true);
  assert.equal(snapshot.requests[1].owner, 'unknown');
  assert.equal(snapshot.requests[1].marker, 'exact');
}
{
  const f = fixture(); f.unrelatedCallSite(); read(f);
  assert.equal(f.snapshot().requests[0].owner, 'unknown', 'a portal invocation outside the real call site cannot label unrelated traffic');
}

// Protocol identity reused outside the pinned phase/route cannot inherit an old
// owner's body or controller evidence. Preserve the old pin, mark it ambiguous.
for (const reuse of ['phase', 'route']) {
  const f = fixture(); read(f);
  if (reuse === 'phase') f.collector.phase('project_home_lifecycle_presentation');
  f.observe({ method: 'Network.requestWillBeSent', params: { requestId: 'raw-request-1',
    request: { method: 'GET', url: reuse === 'route' ? 'http://localhost:3000/api/vnext/operator/session' : url } } });
  f.failure('raw-request-1');
  const snapshot = f.snapshot();
  assert.equal(snapshot.requests.length, 1);
  assert.equal(snapshot.requests[0].owner, 'unknown');
  assert.equal(snapshot.requests[0].ambiguous, true);
  assert.equal(snapshot.requests[0].cleanup_signal_abort_proven, false);
  assert.equal(snapshot.evidence_incomplete, true);
}

// Pin lifetime is independent of both general-ring and request-context eviction.
{
  const f = fixture({ maxEvents: 2, maxRequests: 1 }); read(f);
  for (let index = 0; index < 2000; index++) {
    f.observe({ method: 'Network.requestWillBeSent', params: { requestId: `noise-${index}`,
      request: { method: 'GET', url: 'http://localhost:3000/' } } });
  }
  f.response('raw-request-1'); f.failure('raw-request-1');
  const pin = f.snapshot().requests[0];
  assert.equal(pin.owner, 'delegated_work_initial_read');
  assert.equal(pin.response_observed, true); assert.equal(pin.response_status, 404);
  assert.equal(pin.loadingFinished, false); assert.equal(pin.loadingFailed, true);
  assert.equal(pin.canceled, true); assert.equal(pin.error, 'net::ERR_ABORTED');
  assert.equal(f.collector.snapshot('scenario_failure').events.length, 2);
}
{
  const f = fixture({ maxPins: 1 }); read(f); f.start('over-budget');
  const snapshot = f.snapshot();
  assert.equal(snapshot.requests.length, 1); assert.equal(snapshot.counts.pin_overflow, 1);
  assert.equal(snapshot.overflow, true); assert.equal(snapshot.evidence_incomplete, true);
}
{
  const f = fixture(); const { controller } = read(f);
  for (let index = 0; index < 100; index++) f.observer.auth('authenticated');
  f.observer.cleanup(controller); controller.abort(); f.observer.cleanupFinished();
  const snapshot = f.snapshot();
  assert.equal(snapshot.requests[0].effect_and_auth_events.length, 64);
  assert(snapshot.counts.lifecycle_overflow > 0);
  assert.equal(snapshot.evidence_incomplete, true);
  assert.equal(snapshot.requests[0].cleanup_signal_abort_proven, false, 'retention loss cannot prove causality');
}
{
  const f = fixture(); read(f);
  // Missing/duplicated transport ordinal is explicit loss, never silently repaired.
  const packet = JSON.parse(f.packets.at(-1)); packet.ordinal += 2;
  f.observe({ method: 'Runtime.bindingCalled', params: { name: CONSUMER_DIAGNOSTIC_BINDING_V1,
    payload: JSON.stringify(packet) } });
  assert(f.snapshot().counts.observation_errors > 0);
  assert.equal(f.snapshot().evidence_incomplete, true);
}

// Distinct private capabilities for the explicit probe and background consumer.
{
  const f = fixture(); read(f);
  const probe = f.portal.probe();
  probe.fetch(route, { headers: { 'x-augnes-e2e-probe': 'unavailable-execution-v1' } });
  f.response(); probe.event('response_headers_received', 404); probe.event('body_read_started');
  probe.event('body_read_completed'); probe.event('consumer_returned'); f.collector.completeProbe();
  f.observe({ method: 'Network.loadingFinished', params: { requestId: 'raw-request-2' } });
  const [background, marked] = f.snapshot().requests;
  assert.equal(background.owner, 'delegated_work_initial_read');
  assert.equal(marked.owner, 'marked_unavailable_execution_probe'); assert.equal(marked.marker, 'exact');
  assert.notEqual(background.generation, marked.generation);
  assert.equal(marked.response_status, 404); assert.equal(marked.loadingFinished, true);
  const seq = kind => marked.consumer_events.find(event => event.kind === kind).sequence;
  assert(seq('response_headers_received') < seq('body_read_completed'));
  assert(seq('body_read_completed') < seq('probe_completed'));
  assert.equal(background.consumer_events.some(event => event.kind === 'probe_completed'), false);
}

// Causality requires this controller's synchronous abort inside this cleanup.
for (const mode of ['disable', 'unmount', 'wrong-controller', 'external-abort', 'body-complete']) {
  const f = fixture(); const dispose = f.observer.mount(); const { observation, controller } = read(f);
  f.response(); observation.event('response_headers_received', 404); observation.event('body_read_started');
  if (mode === 'body-complete') observation.event('body_read_completed');
  f.observer.auth('locked');
  if (mode === 'unmount') dispose();
  const cleanupController = mode === 'wrong-controller' ? new AbortController() : controller;
  f.observer.cleanup(cleanupController);
  if (mode !== 'external-abort') cleanupController.abort();
  f.observer.cleanupFinished();
  if (mode === 'external-abort' || mode === 'wrong-controller') controller.abort();
  if (mode === 'disable') f.observer.effectActive(false);
  f.failure();
  const pin = f.snapshot().requests[0];
  assert.equal(pin.cleanup_signal_abort_proven, !['wrong-controller', 'external-abort'].includes(mode), mode);
  assert.equal(pin.abort_reason, mode === 'disable' ? 'enabled_changed' : mode === 'unmount' ? 'unmount' : 'unknown');
  assert.equal(pin.body_completed_before_abort, mode === 'body-complete' ? true : null);
  assert.equal(pin.consumer_events.find(event => event.kind === 'signal_aborted').auth, 'locked_or_refused');
}
{
  const f = fixture();
  const first = read(f); first.observation.event('consumer_returned');
  const second = read(f, { initial: false });
  f.observer.cleanup(second.controller); second.controller.abort(); f.observer.cleanupFinished();
  const [a, b] = f.snapshot().requests;
  assert.equal(a.cleanup_signal_abort_proven, false);
  assert.equal(b.cleanup_signal_abort_proven, true); assert.notEqual(a.controller, b.controller);
  assert.equal(b.owner, 'delegated_work_refresh_or_poll');
}

// Multiple requests through a single invocation frame fail closed; they cannot
// both inherit the generation, even if their URL and marker match perfectly.
{
  const f = fixture(); const { observation } = read(f);
  observation.fetch(route, { method: 'GET' });
  assert(f.snapshot().requests.every(pin => pin.owner === 'unknown' && pin.ambiguous));
}

// Closed projection: no arbitrary content, path, credentials or protocol IDs.
{
  const f = fixture(); const { observation } = read(f);
  const forbidden = 'DUMMY-private-token-cookie-body-project-path';
  f.observer.auth(forbidden); observation.event('response_headers_received', forbidden);
  observation.event(forbidden, 404);
  const packet = { ...JSON.parse(f.packets[0]), kind: 'auth_transition_requested',
    auth: forbidden, body: forbidden, Cookie: forbidden, path: `/private/${forbidden}` };
  f.observe({ method: 'Runtime.bindingCalled', params: { name: CONSUMER_DIAGNOSTIC_BINDING_V1, payload: JSON.stringify(packet) } });
  const output = JSON.stringify(f.collector.snapshot('scenario_failure'));
  for (const raw of [forbidden, 'raw-request-', 'aaaaaaaa-bbbb', JSON.parse(f.packets[0]).channel, '/private/']) {
    assert(!output.includes(raw), raw);
  }
  for (const event of f.snapshot().requests[0].effect_and_auth_events) {
    assert(['authenticated', 'locked_or_refused', 'unavailable', 'unknown'].includes(event.auth));
  }
}

// The wrapper preserves request arguments and exact Promise identity; diagnostic
// transport failure neither retries a request nor changes resolution/rejection.
for (const broken of [false, true]) {
  const f = fixture(); const promise = Promise.resolve({ status: 404 }); f.promise(promise);
  const controller = new AbortController(); const observation = f.observer.beginRead(controller);
  if (broken) f.transportFailure();
  const options = { method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: controller.signal };
  assert.equal(observation.fetch(route, options), promise);
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], route); assert.equal(f.calls[0][1], options);
  assert.equal(f.receivers[0], undefined, 'the original unbound fetch receiver is preserved');
  assert.doesNotThrow(() => observation.event('body_read_completed'));
}
for (const settlement of ['throw', 'reject']) {
  const f = fixture(), error = new Error('synthetic original fetch failure');
  const observation = f.observer.beginRead(new AbortController());
  let calls = 0;
  f.window.fetch = function () { calls++; assert.equal(this, undefined);
    if (settlement === 'throw') throw error;
    return Promise.reject(error);
  };
  if (settlement === 'throw') assert.throws(() => observation.fetch(route), caught => caught === error);
  else await assert.rejects(observation.fetch(route), caught => caught === error);
  assert.equal(calls, 1);
}

// Production builds never read the portal. Ordinary development is inert too:
// both the disposable CDP binding and installed portal are required.
{
  const source = readFileSync(new URL('../components/delegated-work/project-experience-test-observer.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const window = { get __augnesProjectExperienceDiagnosticsV1() { throw new Error('portal_must_not_be_read'); } };
  vm.runInNewContext(code, { exports, window, process: { env: { NODE_ENV: 'production' } } });
  assert.equal(exports.projectExperienceTestObserverV1({}), null);
  const enabled = {};
  vm.runInNewContext(code, { exports: enabled, window, process: { env: { NODE_ENV: 'development' } } });
  assert.equal(enabled.projectExperienceTestObserverV1({}), null);
  const f = fixture(), active = {};
  vm.runInNewContext(code, { exports: active, window: f.window, process: { env: { NODE_ENV: 'development' } } });
  const instance = {};
  assert.equal(active.projectExperienceTestObserverV1(instance), active.projectExperienceTestObserverV1(instance));
  assert(active.projectExperienceTestObserverV1(instance));
}

process.stdout.write(`${JSON.stringify({ test: 'project-experience-pinned-diagnostics-v1', status: 'pass',
  synthetic_only: true, acceptance_unchanged: true, exact_invocation_and_controller_binding: true })}\n`);
