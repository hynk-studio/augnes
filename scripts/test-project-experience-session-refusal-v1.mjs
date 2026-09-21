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
    diagnostics.observe(connection, payload);
    verdict.observe(vc, payload, entry);
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
      return options.fetchPromise ?? Promise.resolve(null);
    },
  };
  vm.runInNewContext(diagnostics.browserSource(), { window, location: { hostname: 'localhost' }, crypto: { randomUUID }, Response });
  const portal = window.__augnesProjectExperienceDiagnosticsV1;
  const observer = portal.consumer({});
  const dispose = observer.mount(); observer.effectActive(false); observer.auth('checking');
  observer.auth('authenticated'); observer.effectActive(true);
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
    if (!options.abortSettlementMissing) read.event('read_aborted');
    read.event('consumer_returned');
  };
  return { diagnostics, verdict, owner, scenario, observer, portal, start, response, failure, deliver, cleanup, dispose,
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
  const entry = options.priorFailure ? f.lastFailure : f.failure();
  f.finish();
  return { f, entry, outcome: f.classify(entry) };
}
const accepted = exercise();
assert.deepEqual(accepted.outcome, { expected: true, reason: 'expected_session_refusal_cleanup_cancellation', body_settlement: 'unknown', completed_read: false });
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
const rejects = [];
const negative = (name, options, extra) => {
  const { outcome } = exercise(options, extra);
  assert.equal(outcome.expected, false, `${name}: ${JSON.stringify(outcome)}`); rejects.push(name);
};
for (const name of ['unbranded','deliveryMissing','copiedResponse','wrongToken','otherConsumer','lockMissing','disabledMissing',
  'wrongController','abortSettlementMissing','unsealed','forgedHandle','foreignConnection','foreignCallSite','missingFrame','missingLoader',
  'foreignRequest','foreignSession','responseMissing','priorFailure','poll','redirect','ordinalGap','prefixMissing']) negative(name, { [name]: true });
for (const status of [200,401,403,500,'404']) negative(`status:${status}`, { status });
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
negative('duplicate response', {}, f => f.response());
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
for (const kind of ['refusal_delivered','effect_active','signal_aborted']) negative(`wrong state:${kind}`, {
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

// Execute the real current-read callback and guard. A mode label, stale response,
// refused JSON parse, 403 or copied Response cannot manufacture delivered-401
// proof. No note content or session credentials enter this observer.
{
  const ts = createRequire(import.meta.url)('typescript');
  const source = readFileSync(new URL('../components/workbench/semantic-review/semantic-review-surface.tsx', import.meta.url), 'utf8');
  const file = ts.createSourceFile('surface.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'loadPrivateView') callback = node.initializer.arguments[0].getText(file);
    ts.forEachChild(node, visit);
  }
  visit(file); assert(callback);
  const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const guardExports = {};
  vm.runInNewContext(compile(readFileSync(new URL('../components/workbench/semantic-review/semantic-review-read-guard.ts', import.meta.url), 'utf8')), { exports: guardExports });
  for (const mode of ['delivered', 'stale', 'bad-json', '403', 'copy', 'unbranded']) {
    const f = fixture(); f.start();
    const guard = new guardExports.SemanticReviewReadGuardV01();
    guard.setSession({ session_id: 'disposable', workspace_id: 'fixture', project_id: 'fixture', operator_id: 'fixture' });
    const response = mode === 'bad-json' ? new Response('invalid json', { status: 401 })
      : Response.json({ error_code: 'operator_session_cookie_invalid' }, { status: mode === '403' ? 403 : 401 });
    if (mode !== 'unbranded') f.portal.sessionRefusal(response, f.scenario.token);
    const states = [];
    const context = { privateReadGuard: { current: guard }, proposalId: null,
      SEMANTIC_REVIEW_ROUTE: '/api/vnext/operator/semantic-review', requestDiagnostic: f.observer,
      setLoadingPrivateView() {}, setPrivateError() {}, setPrivateView() {}, publicErrorCode: value => value,
      updateSessionState(next) { states.push(next.status); guard.setSession(null); f.observer.auth(next.status); },
      fetch: async () => { if (mode === 'stale') guard.beginRead(); return mode === 'copy' ? response.clone() : response; }, Error };
    vm.runInNewContext(compile(`globalThis.run = ${callback};`), context);
    await context.run();
    const delivery = f.pin().effect_and_auth_events.filter(event => event.kind === 'refusal_delivered');
    assert.equal(delivery.length, mode === 'delivered' ? 1 : 0, mode);
    assert.deepEqual(states, ['stale', 'bad-json'].includes(mode) ? [] : ['locked'], mode);
    f.cleanup(); f.finish();
  }
}

// Controlled actual-hook evidence: the real AbortController cancels a pending
// fetch; no Browser/CDP behavior is claimed by this isolated hook schedule.
{
  const ts = createRequire(import.meta.url)('typescript');
  const diagnostics = createProjectExperienceRequestDiagnosticsV1();
  const raw = [];
  const window = { [CONSUMER_DIAGNOSTIC_BINDING_V1]: p => raw.push(JSON.parse(p)),
    fetch: (_path,options) => new Promise((_resolve,reject) => options.signal.addEventListener('abort',() => reject(new DOMException('controlled cancellation','AbortError')),{once:true})) };
  vm.runInNewContext(diagnostics.browserSource(),{window,location:{hostname:'localhost'},crypto:{randomUUID},Response});
  const observer=window.__augnesProjectExperienceDiagnosticsV1.consumer({});
  const effects=[],states=[];
  const react={useRef:current=>({current}),useCallback:f=>f,useState:v=>[v,x=>states.push(x)],useEffect:f=>effects.push(f)};
  const source=readFileSync(new URL('../components/delegated-work/use-delegated-codex-work-v0-1.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,require:name=>{assert.equal(name,'react');return react;},AbortController,Error,fetch:window.fetch,window:{setTimeout(){assert.fail('no polling');}}});
  observer.auth('authenticated'); exports.useDelegatedCodexWorkV01(true,observer);
  const cleanups=effects.map(f=>f());
  observer.auth('locked'); cleanups.forEach(f=>f?.());
  await new Promise(resolve=>setImmediate(resolve));
  assert(raw.some(e=>e.kind==='signal_aborted'));
  assert(raw.some(e=>e.kind==='read_aborted'));
  assert(!raw.some(e=>e.kind==='read_failed'||e.kind==='body_read_completed'));
  assert.deepEqual(states,['loading']);
}
console.log(JSON.stringify({test:'project-experience-session-refusal-v1',status:'pass',prospective_acceptance_expansion:true,
  negative_cases:rejects.length,body_unknown_preserved:true,synthetic_contract_schedule:true,controlled_actual_hook:true,browser_execution:false}));
