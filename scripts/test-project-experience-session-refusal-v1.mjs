#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createProjectExperienceRequestDiagnosticsV1 } from './project-experience-request-diagnostics-v1.mjs';
import { createProjectExperienceRequestVerdictV1 } from './project-experience-request-verdict-v1.mjs';
import { sessionRefusalEvidenceOwnerV1 } from './project-experience-host-round-trip-pins-v1.mjs';
import { CONSUMER_DIAGNOSTIC_BINDING_V1 } from './project-experience-consumer-diagnostics-v1.mjs';

import { loadProjectClientScopeTestRuntime } from './project-client-scope-test-runtime.mjs';

const phase = 'companion_first_work_access', route = '/api/vnext/operator/host-round-trip';
const url = `http://localhost:3000${route}`;
// Synthetic protocol schedules exercise the actual private acceptance owner and
// injected observer. These are contract tests, not a Browser execution claim.
function fixture(options = {}, factory = createProjectExperienceRequestVerdictV1) {
  const diagnostics = createProjectExperienceRequestDiagnosticsV1();
  const connection = diagnostics.connection(); diagnostics.phase(phase);
  const verdict = factory({ cancellationEvidence: options.forgedHandle ? {} : diagnostics.cancellationEvidence });
  const vc = verdict.connection(options.foreignConnection ? {} : diagnostics.verdictConnection(connection));
  const owner = sessionRefusalEvidenceOwnerV1(diagnostics.cancellationEvidence);
  const scenario = owner.arm();
  let ordinal = 0, id = 0, read, controller, lastFailure;
  const entries = [], requestIds = [];
  const emit = (method, params, entry = {}, sessionId = 'private-session') => {
    const payload = { method, params, sessionId };
    if (method !== 'Network.responseReceived' || !['pins', 'both'].includes(options.responseLost)) diagnostics.observe(connection, payload);
    if (method !== 'Network.responseReceived' || !['verdict', 'both'].includes(options.responseLost)) verdict.observe(vc, payload, entry);
    if (method === 'Network.loadingFailed') diagnostics.bindVerdictFailure(connection, payload, entry);
    return entry;
  };
  const eventPayload = value => {
    const altered = options.mutate ? options.mutate(value) : [value];
    for (const item of altered) {
      item.ordinal = ++ordinal + (options.ordinalGap && ordinal > 3 ? 1 : 0) + (options.prefixMissing ? 1 : 0);
      diagnostics.observe(connection, { method: 'Runtime.bindingCalled', sessionId: 'private-session',
        params: { name: CONSUMER_DIAGNOSTIC_BINDING_V1, payload: JSON.stringify(item) } });
    }
  };
  const window = {
    [CONSUMER_DIAGNOSTIC_BINDING_V1](payload) { eventPayload(JSON.parse(payload)); },
    fetch(path, args) {
      const frames = [...new Error().stack.matchAll(/augnes-pe-diagnostic\/[a-f0-9]+\/[a-f0-9-]+\/\d+/g)].map(x => ({ url: x[0] }));
      if (!options.foreignCallSite) frames.push({ url: 'webpack-internal:///(app-pages-browser)/./components/delegated-work/use-delegated-codex-work-v0-1.ts' });
      const requestId = options.reuse ? 'same-private-request' : `private-request-${++id}`;
      requestIds.push(requestId);
      const entry = { phase: options.phase ?? phase, path: options.route ?? route,
        method: options.method ?? 'GET', external: options.external ?? false };
      emit('Network.requestWillBeSent', { requestId, frameId: options.missingFrame ? undefined : 'private-frame',
        loaderId: options.missingLoader ? undefined : 'private-loader', type: 'Fetch',
        request: { url: `http://localhost:3000${entry.path}`, method: entry.method, headers: options.headers ?? {} },
        redirectResponse: options.redirect ? { status: 302 } : undefined,
        initiator: { stack: { callFrames: frames } } }, entry);
      entries.push(entry);
      return options.fetchImpl ? options.fetchImpl(path, args) : options.fetchPromise ?? Promise.resolve(null);
    },
  };
  vm.runInNewContext(diagnostics.browserSource(), { window, location: { hostname: 'localhost' }, crypto: { randomUUID }, Response });
  const portal = window.__augnesProjectExperienceDiagnosticsV1;
  const observer = portal.consumer({});
  let dispose;
  if (!options.actualLifecycle) {
    dispose = observer.mount(); observer.effectActive(false); observer.auth('checking');
    observer.auth('authenticated'); observer.effectActive(true);
  }
  const start = () => {
    controller = new AbortController();
    observer.initialReadInvocation(!options.poll);
    read = observer.beginRead(controller);
    read.fetch(route, { method: 'GET', signal: controller.signal });
    observer.initialReadInvocation(false);
  };
  const response = () => emit('Network.responseReceived', { requestId: requestIds.at(-1), frameId: 'private-frame', loaderId: 'private-loader',
    response: { url, status: options.status ?? 404 } }, { phase, path: route, status: options.status ?? 404 });
  const failure = () => {
    lastFailure = emit('Network.loadingFailed', { requestId: options.foreignRequest ? 'foreign-private-request' : requestIds.at(-1),
      canceled: options.canceled ?? true, errorText: options.error ?? 'net::ERR_ABORTED' },
    { phase: options.failurePhase ?? phase, error_text: options.error ?? 'net::ERR_ABORTED', path: null },
    options.foreignSession ? 'foreign-private-session' : 'private-session');
    return lastFailure;
  };
  const deliver = () => {
    const refused = Response.json({ error_code: 'operator_session_cookie_invalid' }, { status: 401 });
    if (!options.unbranded) portal.sessionRefusal(refused, options.wrongToken ? '0'.repeat(32) : scenario.token);
    if (!options.deliveryMissing) (options.otherConsumer ? portal.consumer({}) : observer).refusalConsumed(options.copiedResponse ? refused.clone() : refused);
  };
  const cleanup = () => {
    if (options.bodyAfterAbort) { read.event('response_headers_received', 404); read.event('body_read_started'); }
    if (!options.lockMissing) observer.auth('locked');
    const target = options.wrongController ? new AbortController() : controller;
    observer.cleanup(target); target.abort(); observer.cleanupFinished();
    if (!options.disabledMissing) observer.effectActive(false);
    if (options.bodyAfterAbort) read.event('body_read_failed');
    if (!options.settleAfterSeal) {
      if (!options.abortSettlementMissing) read.event('read_aborted');
      read.event('consumer_returned');
    }
  };
  return { diagnostics, verdict, owner, scenario, observer, portal, window, start, response, failure, deliver, cleanup, dispose,
    get read() { return read; }, get controller() { return controller; },
    finish() { if (!options.unsealed) owner.seal(scenario); owner.close(scenario); },
    classify: entry => verdict.sessionRefusalCancellation?.(entry) ?? { expected: false, reason: verdict.unavailableExecutionAbortReason(entry) },
    pin: () => diagnostics.snapshot('scenario_failure').host_round_trip_pins.requests[0],
    get lastFailure() { return lastFailure; },
    finished() { emit('Network.loadingFinished', { requestId: requestIds.at(-1) }); },
    navigation() { diagnostics.observe(connection, { method: 'Page.frameNavigated', sessionId: 'private-session', params: {
      frame: { id: 'private-frame', loaderId: 'other-private-loader', url: 'http://localhost:3000/workbench' } } }); },
  };
}
function exercise(options = {}, extra = () => {}, factory) {
  const f = fixture(options, factory); f.start();
  if (!options.responseMissing) f.response();
  if (options.priorFailure) f.failure();
  extra(f); f.deliver(); f.cleanup();
  if (options.sealBeforeFailure) f.owner.seal(f.scenario);
  const entry = options.priorFailure ? f.lastFailure : f.failure();
  if (options.lateResponse) f.response();
  if (options.sealBeforeFailure) f.owner.close(f.scenario); else f.finish();
  if (options.settleAfterSeal) { f.read.event('read_aborted'); f.read.event('consumer_returned'); }
  return { f, entry, outcome: f.classify(entry) };
}
const accepted = exercise();
assert.deepEqual(accepted.outcome, { expected: true, reason: 'expected_session_refusal_cleanup_cancellation',
  response_observed: true, response_status: 404, body_settlement: 'unknown', completed_read: false });
assert.equal(accepted.f.pin().body_settlement, 'unknown');
assert.equal(accepted.f.pin().loadingFinished, false);
assert.equal(accepted.f.pin().evidence_incomplete, true, 'old diagnostic body completeness is preserved');
assert.equal(accepted.f.verdict.expectedUnavailableExecutionAbort(accepted.entry), false);
assert.equal(accepted.f.verdict.unavailableExecutionAbortReason(accepted.entry), 'probe_marker_absent');
assert.equal(accepted.f.classify({ ...accepted.entry }).expected, false, 'copied public failure row has no private proof');
const abortedBody = exercise({ bodyAfterAbort: true });
assert.deepEqual(abortedBody.outcome, { ...accepted.outcome, body_settlement: 'failed' });
assert.equal(abortedBody.f.pin().body_settlement, 'failed', 'aborted body settlement is explicit');
assert.equal(abortedBody.f.pin().loadingFinished, false);
const beforeHeaders = exercise({ responseMissing: true });
assert.deepEqual(beforeHeaders.outcome, { ...accepted.outcome, response_observed: false, response_status: null });
assert.equal(beforeHeaders.f.pin().response_observed, false);
assert.equal(beforeHeaders.f.pin().response_status, null);
assert.equal(beforeHeaders.f.pin().body_settlement, 'unknown');
assert.equal(beforeHeaders.f.pin().evidence_incomplete, true, 'missing body observations stay explicit');
assert.equal(beforeHeaders.f.verdict.expectedUnavailableExecutionAbort(beforeHeaders.entry), false);
assert.equal(beforeHeaders.f.classify({ ...beforeHeaders.entry }).expected, false, 'no private proof in a copied failure');
const rejects = [];
const negative = (name, options, extra, responseOnly = false) => {
  for (const responseMissing of responseOnly ? [false] : [false, true]) {
    const { outcome } = exercise({ ...options, responseMissing }, extra);
    const label = `${responseMissing ? 'before headers' : 'observed response'}:${name}`;
    assert.equal(outcome.expected, false, `${label}: ${JSON.stringify(outcome)}`); rejects.push(label);
  }
};
for (const name of ['unbranded','deliveryMissing','copiedResponse','wrongToken','otherConsumer','lockMissing','disabledMissing',
  'wrongController','abortSettlementMissing','unsealed','forgedHandle','foreignConnection','foreignCallSite','missingFrame','missingLoader',
  'foreignRequest','foreignSession','priorFailure','poll','redirect','ordinalGap','prefixMissing',
  'sealBeforeFailure','settleAfterSeal','lateResponse']) negative(name, { [name]: true });
for (const status of [200,401,403,500,'404']) negative(`status:${status}`, { status }, undefined, true);
for (const responseLost of ['pins', 'verdict']) negative(`response observation lost:${responseLost}`, { responseLost }, undefined, true);
negative('headers/body seen only by consumer', { responseLost: 'both', bodyAfterAbort: true });
for (const method of ['POST','get']) negative(`method:${method}`, { method });
for (const headers of [{ 'x-augnes-e2e-probe': 'unavailable-execution-v1' }, { 'x-augnes-e2e-probe': 'invalid' }]) negative('marked request cannot use B', { headers });
for (const error of ['net::ERR_FAILED','net::ERR_TIMED_OUT','net::ERR_CONNECTION_RESET']) negative(error, { error });
for (const canceled of [false,'true']) negative('canceled flag', { canceled });
negative('route', { route: '/api/other' }); negative('external', { external: true });
negative('request phase', { phase: 'project_home_lifecycle_presentation' });
negative('failure phase', { failurePhase: 'project_home_lifecycle_presentation' });
negative('two requests', {}, f => f.start()); negative('reused request id', { reuse: true }, f => f.start());
negative('navigation before seal', {}, f => f.navigation());
negative('unmount', {}, f => f.dispose());
negative('scenario rearmed', {}, f => f.owner.arm());
negative('scenario closed before delivery', {}, f => f.owner.close(f.scenario));
negative('duplicate response', {}, f => f.response(), true);
negative('completed network body', {}, f => f.finished());
negative('collection failure', {}, f => f.diagnostics.installationFailed());
negative('unrelated auth change during read', {}, f => f.observer.auth('checking'));
negative('independent fetch failure', {}, f => f.read.event('read_failed'));
negative('independent body failure', {}, f => f.read.event('body_read_failed'));
negative('another probe completion', {}, f => f.read.event('body_read_completed'));
negative('loss/overflow', {}, f => { for(let i=0;i<80;i++) f.observer.auth('authenticated'); });
for (const kind of ['consumer_mounted','effect_active','initial_read_invoked','read_created','controller_created','fetch_started',
  'refusal_delivered','auth_transition_requested','effect_cleanup','cleanup_observed','abort_requested','signal_aborted',
  'abort_call_returned','read_aborted','consumer_returned']) {
  negative(`missing:${kind}`, { mutate: e => e.kind === kind ? [] : [e] });
  negative(`duplicated:${kind}`, { mutate: e => e.kind === kind ? [e,{...e}] : [e] });
}
for (const field of ['consumer','effect','generation','document']) negative(`foreign:${field}`, {
  mutate: e => [{...e,...(e.kind==='cleanup_observed' ? {[field]:field==='document'?randomUUID():31} : {})}],
});
negative('cleanup renamed/reordered', { mutate: e => [{...e,kind:e.kind==='abort_requested'?'abort_call_returned':e.kind==='abort_call_returned'?'abort_requested':e.kind}] });
negative('duplicate authenticated event alone', { mutate: e => e.kind==='auth_transition_requested' && e.auth==='authenticated' ? [e,{...e}] : [e] });
for (const kind of ['refusal_delivered','effect_active','signal_aborted','read_aborted','consumer_returned']) negative(`wrong state:${kind}`, {
  mutate: e => [{...e,...(e.kind===kind ? {auth:'unavailable'} : {})}],
});

// The held owner has no cancellation branch. The exact same new proof schedule
// remains an unmarked-probe refusal under that previous acceptance contract.
if (process.argv.includes('--held-owner')) {
  const { execFileSync } = await import('node:child_process');
  const held = execFileSync('git',['show','554c57227abc43c642aab4130cf3c2dd3aed7724:scripts/project-experience-request-verdict-v1.mjs'],{encoding:'utf8'});
  const old = await import(`data:text/javascript;base64,${Buffer.from(held).toString('base64')}`);
  const result = exercise({},undefined,old.createProjectExperienceRequestVerdictV1);
  assert.equal(result.outcome.expected,true,'prospective expected-cancellation regression fails under held contract');
}

// Execute the actual hook, current-read guard and both surface callbacks together.
// React commits and protocol transport are controlled here; the native controller,
// branded Response, source callbacks and private acceptance owner are real. No
// Browser/CDP execution is claimed by this deterministic causal reproduction.
const actualCases = [];
{
  const ts = createRequire(import.meta.url)('typescript');
  const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const source = readFileSync(new URL('../components/workbench/semantic-review/semantic-review-surface.tsx', import.meta.url), 'utf8');
  const file = ts.createSourceFile('surface.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const callbacks = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['loadPrivateView', 'updateSessionState'].includes(node.name.getText(file))) {
      callbacks[node.name.getText(file)] = node.initializer.arguments[0].getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file); assert(callbacks.loadPrivateView && callbacks.updateSessionState);
  const guardExports = {};
  vm.runInNewContext(compile(readFileSync(new URL('../components/workbench/semantic-review/semantic-review-read-guard.ts', import.meta.url), 'utf8')), { exports: guardExports });
  const hookCode = compile(readFileSync(new URL('../components/delegated-work/use-delegated-codex-work-v0-1.ts', import.meta.url), 'utf8'));
  for (const headersObserved of [false, true]) {
    for (const mode of ['delivered', 'stale', 'bad-json', '403', 'copy', 'unbranded', 'independent-failure']) {
      const settlement = Promise.withResolvers(), bodyStarted = Promise.withResolvers();
      const pending = Promise.withResolvers();
      let failure, sessionState = { status: 'checking', session: null };
      const f = fixture({ actualLifecycle: true,
        mutate: event => {
          if (event.kind === 'consumer_returned') settlement.resolve();
          if (event.kind === 'body_read_started') bodyStarted.resolve();
          return [event];
        },
        fetchImpl(_path, options) {
          assert.equal(new Headers(options.headers).get('Augnes-Project-Id'), 'project:refusal-scope');
          options.signal.addEventListener('abort', () => {
            pending.reject(new DOMException('controlled cancellation', 'AbortError'));
            queueMicrotask(() => { failure = f.failure(); });
          }, { once: true });
          if (!headersObserved) return pending.promise;
          f.response();
          return Promise.resolve({ status: 404, ok: false, json: () => pending.promise });
        },
      });
      // Stable hook slots and dependency cleanup, including the next disabled
      // effect. No manual observer cleanup/auth/settlement supplies the proof.
      const slots = [], effects = [], states = [];
      let index = 0;
      const changed = (slot, deps) => !slot || deps.some((value, i) => value !== slot.deps[i]);
      const react = {
        useRef(current) { const i = index++; return slots[i] ??= { current }; },
        useState(value) { const i = index++; const slot = slots[i] ??= { value };
          return [slot.value, next => { slot.value = typeof next === 'function' ? next(slot.value) : next; states.push(slot.value); }]; },
        useCallback(callback, deps) { const i = index++; if (changed(slots[i], deps)) slots[i] = { value: callback, deps }; return slots[i].value; },
        useEffect(callback, deps) { const i = index++; if (changed(slots[i], deps)) effects.push({ i, callback, deps }); },
      };
      const exports = {};
      const scoped = loadProjectClientScopeTestRuntime({ react, fetch: f.window.fetch.bind(f.window), projectId: 'project:refusal-scope' });
      vm.runInNewContext(hookCode, { exports, require: name => {
        if (name === '@/components/workbench/semantic-review/project-client-scope') return scoped;
        assert.equal(name, 'react'); return react;
      },
        AbortController, Error, window: { setTimeout() { assert.fail('initial read must not poll'); } } });
      const render = () => {
        index = 0; exports.useDelegatedCodexWorkV01(sessionState.status === 'authenticated', f.observer);
        for (const { i } of effects) slots[i]?.cleanup?.();
        for (const { i, callback, deps } of effects.splice(0)) slots[i] = { deps, cleanup: callback() };
      };
      const unmount = () => { for (const slot of slots) slot.cleanup?.(); };
      const guard = new guardExports.SemanticReviewReadGuardV01();
      const response = mode === 'bad-json' ? new Response('invalid json', { status: 401 })
        : Response.json({ error_code: 'operator_session_cookie_invalid' }, { status: mode === '403' ? 403 : 401 });
      if (mode !== 'unbranded') f.portal.sessionRefusal(response, f.scenario.token);
      const context = { privateReadGuard: { current: guard }, proposalId: null,
        SEMANTIC_REVIEW_ROUTE: '/api/vnext/operator/semantic-review', requestDiagnostic: f.observer,
        setLoadingPrivateView() {}, setPrivateError() {}, setPrivateView() {}, publicErrorCode: value => value,
        setSessionState(next) { sessionState = next; },
        fetch: async () => { if (mode === 'stale') guard.beginRead(); return mode === 'copy' ? response.clone() : response; }, Error };
      vm.runInNewContext(compile(`globalThis.updateSessionState = ${callbacks.updateSessionState};
        globalThis.loadPrivateView = ${callbacks.loadPrivateView};`), context);
      render(); context.updateSessionState(sessionState);
      context.updateSessionState({ status: 'authenticated', session: {
        session_id: 'disposable', workspace_id: 'fixture', project_id: 'fixture', operator_id: 'fixture' } });
      render();
      if (headersObserved) await bodyStarted.promise;
      if (mode === 'independent-failure') {
        pending.reject(new TypeError('independent fetch or body failure'));
        await settlement.promise;
        failure = f.failure();
      }
      await context.loadPrivateView();
      assert.equal(sessionState.status, ['stale', 'bad-json'].includes(mode) ? 'authenticated' : 'locked', mode);
      const delivered = f.pin().effect_and_auth_events.filter(event => event.kind === 'refusal_delivered');
      assert.equal(delivered.length, ['delivered', 'independent-failure'].includes(mode) ? 1 : 0, mode);
      if (sessionState.status === 'locked') render();
      else unmount(); // A stale/unreadable response cannot cause session cleanup.
      await settlement.promise;
      assert(failure, 'the same native-controller cancellation settles the transport');
      f.finish();
      const outcome = f.classify(failure);
      if (mode === 'delivered') {
        assert.deepEqual(outcome, { ...accepted.outcome, response_observed: headersObserved,
          response_status: headersObserved ? 404 : null, body_settlement: headersObserved ? 'failed' : 'unknown' });
        assert.deepEqual(states, ['loading']);
      } else assert.equal(outcome.expected, false, `${mode}: ${JSON.stringify(outcome)}`);
      actualCases.push({ headersObserved, mode });
      if (sessionState.status === 'locked') unmount();
    }
  }
}
console.log(JSON.stringify({test:'project-experience-session-refusal-v1',status:'pass',prospective_acceptance_expansion:true,
  negative_cases:rejects.length,body_unknown_preserved:true,synthetic_contract_schedule:true,controlled_actual_hook:true,actual_hook_guard_cases:actualCases.length,browser_execution:false}));
