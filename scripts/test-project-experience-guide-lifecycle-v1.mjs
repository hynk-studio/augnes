#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { createGuideLifecycleV1, guideLifecycleEvidenceOwnerV1, GUIDE_LIFECYCLE_BINDING_V1, GUIDE_REPLAY_PHASES_V1 } from './project-experience-guide-lifecycle-v1.mjs';
import { createProjectExperienceRequestVerdictV1 } from './project-experience-request-verdict-v1.mjs';
import { OPERATOR_REQUEST_LIFECYCLE_PHASES_V1, classifyOperatorLifecycleRequestFailureV1 } from './operator-execution-result-contract-v1.mjs';
export async function runGuideLifecycleRegressionV1(args = process.argv.slice(2)) {
const operatorScope = args[0] === '--operator-scope';
const replayPhases = operatorScope ? OPERATOR_REQUEST_LIFECYCLE_PHASES_V1 : GUIDE_REPLAY_PHASES_V1;
const ts = createRequire(import.meta.url)('typescript');
const phase = replayPhases[0], route = '/api/augnes/read/guide-brief';
const origin = 'http://localhost:3000', project = 'project:controlled-guide';
const source = readFileSync(new URL('./browser-validate-project-experience-v1.mjs', import.meta.url), 'utf8');
const guardSource = source.slice(source.indexOf('function expectedFailedRequest('), source.indexOf('function failedRequestAssertionEntry('));
const hookSource = readFileSync(new URL('../components/guide/use-project-guide-brief-v0-2.ts', import.meta.url), 'utf8');
const hookCode = ts.transpileModule(hookSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const tick = () => new Promise(resolve => setImmediate(resolve));
const guide = () => ({ guide_version: 'guide_brief.v0.2', identity: { project_id: project, project_display_name: 'Controlled' },
  coordinate: { focus: 'test', work_status: 'test', result_available: false }, primary_guidance: { label: 'test', href: null },
  projections: { ai_workplane: { status: 'available', project_name: 'test', current_coordinate: 'test', current_goal: null,
    work_or_result_status: 'test', material_blocker_or_judgment: null, recommended_review_focus: 'test', exact_detail_href: null } },
  authority: { can_write_db: false, can_transition: false, can_approve: false } });

async function fixture(options = {}, factory = createProjectExperienceRequestVerdictV1) {
  const lifecycle = createGuideLifecycleV1({ phases: replayPhases }), identity = {}, lc = lifecycle.connection(identity);
  const verdict = factory({ guideEvidence: options.forged ? {} : lifecycle.evidence, guideReplayPhases: replayPhases });
  const vc = verdict.connection(options.wrongConnection ? {} : identity);
  const requests = [], entries = [], writes = [], packets = [], failuresByRead = new Map();
  let ordinal = 0, failure, propsProject = project;
  function emit(method, params, entry = {}, session = 'controlled-session') {
    const payload = { method, params, sessionId: session };
    lifecycle.observe(lc, payload, options.phase ?? phase);
    const read = method === 'Network.loadingFailed' ? requests.findIndex(r => r.id === params.requestId) + 1 : 0;
    if (!read || options.omitVerdictFailure !== read) verdict.observe(vc, payload, entry);
    if (method === 'Network.loadingFailed' && options.omitFailureBinding !== read) lifecycle.bindFailure(lc, payload, entry);
    return entry;
  }
  emit('Page.frameNavigated', { frame: { id: 'controlled-frame', loaderId: 'controlled-loader' } });
  emit('Runtime.executionContextCreated', { context: { id: 1, auxData: { frameId: 'controlled-frame', isDefault: true } } });
  const window = {
    [GUIDE_LIFECYCLE_BINDING_V1](payload) {
      const original = JSON.parse(payload); packets.push(original);
      const altered = options.mutate ? options.mutate(structuredClone(original)) : [original];
      for (const item of altered) {
        // Renumbering permits semantic missing/duplicate controls independently
        // of the separate transport-loss/ordinal-gap control.
        item.ordinal = ++ordinal + (options.gap && ordinal > 3 ? 1 : 0);
        emit('Runtime.bindingCalled', { name: GUIDE_LIFECYCLE_BINDING_V1, payload: JSON.stringify(item),
          executionContextId: options.wrongExecutionContext ? 2 : 1 });
      }
    },
    fetch(url, args) {
      const number = requests.length + 1;
      const frames = [...new Error().stack.matchAll(/augnes-guide\/[a-f0-9]+\/[a-f0-9-]+\/\d+/g)].map(m => ({ url: m[0] }));
      if (options.wrongPinRead === number) for (const frame of frames) frame.url = frame.url.replace(/\/\d+$/, '/1');
      if (!options.wrongCallsite) frames.push({ url: 'webpack-internal:///./components/guide/use-project-guide-brief-v0-2.ts' });
      let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; });
      const request = { id: options.reuse ? 'same-request' : `request-${number}`, url, args, promise, resolve, reject };
      requests.push(request);
      emit('Network.requestWillBeSent', { requestId: request.id, frameId: options.wrongFrame || options.wrongFrameRead === number ? 'other-frame' : 'controlled-frame',
        loaderId: options.wrongLoader || options.wrongLoaderRead === number ? 'other-loader' : 'controlled-loader', type: 'Fetch',
        request: { url: new URL(url, origin).href, method: args.method, headers: args.headers },
        redirectResponse: options.redirect ? { status: 302 } : undefined,
        initiator: { stack: { callFrames: options.ambiguousFrame ? [...frames, frames[0]] : frames } } },
      { phase: options.phase ?? phase, path: route, method: args.method, external: false });
      args.signal.addEventListener('abort', () => {
        if (options.delayedResponse !== number && options.delayedBody !== number) request.reject(new DOMException('Controlled cancellation', 'AbortError'));
        if (number !== 1 && !(options.supersession && number === 2)) return;
        if (options.missingFailure === number) return;
        queueMicrotask(() => { const entry = emit('Network.loadingFailed', { requestId: options.wrongRequest || options.wrongFailureRead === number ? 'other-request' : request.id,
          type: 'Fetch', canceled: options.canceled ?? true, errorText: options.error ?? 'net::ERR_ABORTED' },
        { phase: options.phase ?? phase, path: null, error_text: options.error ?? 'net::ERR_ABORTED' },
        options.wrongSession ? 'other-session' : 'controlled-session');
          failuresByRead.set(number, entry); entries.push(entry); if (number === 1) failure = entry;
          if (options.modifiedFailureRead === number) entry.error_text = 'changed';
          if (options.duplicateFailure === number) emit('Network.loadingFailed', { requestId: request.id, type: 'Fetch', canceled: true, errorText: 'net::ERR_ABORTED' },
            { phase: options.phase ?? phase, path: null, error_text: 'net::ERR_ABORTED' });
        });
      }, { once: true });
      return promise;
    },
  };
  vm.runInNewContext(lifecycle.browserSource(), { window, URL, location: { hostname: 'localhost', href: origin + '/', origin }, crypto: { randomUUID } });
  const states = [], refs = [], callbacks = [], effects = [];
  let si = 0, ri = 0, ci = 0, ei = 0;
  const equal = (a, b) => a?.length === b?.length && a.every((v, i) => v === b[i]);
  const react = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; writes.push({ state: i, value }); }]; },
    useRef(current) { const i = ri++; return refs[i] ??= { current }; },
    useCallback(fn, deps) { const i = ci++; if (!callbacks[i] || !equal(callbacks[i].deps, deps)) callbacks[i] = { fn, deps }; return callbacks[i].fn; },
    useEffect(fn, deps) { const i = ei++, previous = effects[i]; effects[i] = { fn, deps, changed: !previous || !equal(previous.deps, deps), cleanup: previous?.cleanup }; },
  };
  const exports = {};
  vm.runInNewContext(hookCode, { exports, AbortController, URLSearchParams, Error, fetch: window.fetch,
    require(name) {
      if (name === 'react') return react;
      if (name.endsWith('project-experience-test-observer')) return { projectExperienceGuideObserverV1: instance => options.observerAbsent ? null : window.__augnesGuideLifecycleV1.consumer(instance) };
      assert.equal(name, '@/types/vnext/guide-brief');
      return { GUIDE_BRIEF_REQUEST_SCOPE_V02: 'project:augnes', GUIDE_BRIEF_ROUTE_MARKER_V02: 'guide-brief-v0.2', GUIDE_BRIEF_VERSION_V02: 'guide_brief.v0.2' };
    } });
  const render = () => { si = ri = ci = ei = 0; return exports.useProjectGuideBriefV02(undefined, propsProject); };
  const setup = () => effects.forEach(e => { if (e.changed) { e.cleanup?.(); e.cleanup = e.fn(); e.changed = false; } });
  const bodyFor = number => options.supersession ? { ...guide(), coordinate: { ...guide().coordinate, focus: `controlled-read-${number}` } } : guide();
  function delayedHeaders(number) {
    const request = requests[number - 1];
    emit('Network.responseReceived', { requestId: request.id, frameId: 'controlled-frame', loaderId: 'controlled-loader',
      response: { url: new URL(request.url, origin).href, status: 200 } }, { phase: options.phase ?? phase, path: route, status: 200 });
    request.resolve({ ok: true, status: 200, json: () => new Promise(resolve => { request.resolveBody = resolve; }) });
  }
  let hook = render(); setup();
  if (options.delayedBody === 1) { delayedHeaders(1); await tick(); }
  if (options.explicitRefresh) void hook.refresh();
  else {
    effects.forEach(e => e.cleanup?.());
    if (!options.unmountOnly) effects.forEach(e => { e.cleanup = e.fn(); });
  }
  await tick();
  if (options.supersession) {
    assert.equal(requests.length, 2, 'actual effect replay creates B before refresh');
    if (options.delayedBody === 2) { delayedHeaders(2); await tick(); }
    void hook.refresh();
    await tick();
    assert.equal(requests.length, 3, 'one actual refresh creates C');
  }
  const replacement = requests.at(-1);
  if (requests.length > 1) {
    if (options.replacementFailed) replacement.reject(new Error('Controlled independent failure'));
    else {
      emit('Network.responseReceived', { requestId: replacement.id, frameId: 'controlled-frame', loaderId: 'controlled-loader',
        response: { url: new URL(replacement.url, origin).href, status: options.httpError ? 503 : 200 } },
      { phase, path: route, status: options.httpError ? 503 : 200 });
      replacement.resolve({ ok: !options.httpError, status: options.httpError ? 503 : 200,
        json: async () => { if (options.bodyFailed) throw Error('Controlled body failure'); return options.invalidBody ? {} : options.wrongProject ? { ...guide(), identity: { project_id: 'other-project', project_display_name: 'Other' } } : bodyFor(requests.length); } });
      if (!options.notFinished) emit('Network.loadingFinished', { requestId: replacement.id });
    }
  }
  await tick();
  if (options.refreshBeforeCommit) { void hook.refresh(); await tick(); }
  if (options.navigationBeforeCommit) emit('Page.frameNavigated', { frame: { id: 'controlled-frame', loaderId: 'changed-loader' } });
  if (options.contextChange) propsProject = 'other-project';
  if (!options.unconsumed) { hook = render(); setup(); }
  const beforeDelayedWrites = writes.length;
  if (options.delayedResponse) { delayedHeaders(options.delayedResponse); await tick(); }
  const delayed = options.delayedBody ?? options.delayedResponse;
  if (delayed) { requests[delayed - 1].resolveBody(bodyFor(delayed)); await tick(); }
  if (options.laterRefresh) { void hook.refresh(); await tick(); }
  if (options.modifiedFailure) failure.error_text = 'changed';
  if (options.installationLoss) lifecycle.installationFailed();
  if (options.overflow) for (let i = 0; i < 4097; i++) emit('Runtime.executionContextDestroyed', { executionContextId: 99 });
  if (options.lateStale) {
    const old = packets.find(p => p.read === 1);
    lifecycle.observe(lc, { method: 'Runtime.bindingCalled', sessionId: 'controlled-session', params: {
      name: GUIDE_LIFECYCLE_BINDING_V1, executionContextId: 1, payload: JSON.stringify({ ...old, ordinal: ordinal + 1,
        event: 'application_requested', current: false, aborted: true, project_matches: true }) } }, 'responsive_first_work_presentation');
  }
  if (options.unrelatedLater) for (let i = 0; i < 1000; i++) lifecycle.observe(lc, {
    method: 'Network.requestWillBeSent', sessionId: 'controlled-session', params: { requestId: `later-${i}`,
      request: { url: origin + route, method: 'GET' } } }, 'retired_route_safety');
  const context = vm.createContext({ requestVerdicts: verdict });
  vm.runInContext(guardSource, context);
  if (operatorScope) context.expectedFailedRequest = entry => classifyOperatorLifecycleRequestFailureV1(entry, verdict).expected;
  return { expected: entry => context.expectedFailedRequest(entry), verdict, failure, lifecycle, entries, requests,
    writes, packets, states, failuresByRead, beforeDelayedWrites, snapshot: lifecycle.snapshot(),
    facts: entry => guideLifecycleEvidenceOwnerV1(lifecycle.evidence)?.facts(entry),
    reason: (entry = failure) => verdict.guideEffectReplayCancellation?.(entry) ?? { expected: false, reason: 'original_guard_refuses' } };
}

const supersessionAccepted = f => [1, 2].map(read => {
  const entry = f.failuresByRead.get(read);
  return entry ? f.expected(entry) : false;
});
function assertSupersessionProducer(f) {
  assert.equal(f.requests.length, 3);
  assert.equal(f.entries.length, 2);
  assert.deepEqual(f.requests.map(r => r.args.signal.aborted), [true, true, false]);
  const created = f.packets.filter(p => p.event === 'read_created');
  assert.deepEqual(created.map(p => [p.read, p.effect, p.cause]), [[1, 1, 'initial_effect'], [2, 2, 'initial_effect'], [3, 2, 'explicit_refresh']]);
  const first = f.facts(f.failuresByRead.get(1)), second = f.facts(f.failuresByRead.get(2));
  assert(first && second && first.uniqueRequest && second.uniqueRequest, 'both actual failure entries have unique private pins');
  assert.equal(first.generation.doc, second.generation.doc);
  assert.equal(first.request.protocolIdentity.connection, second.request.protocolIdentity.connection);
  assert.equal(first.generation.created.consumer, second.generation.created.consumer);
  assert.equal(first.generation.created.context, second.generation.created.context);
  assert.deepEqual([first.request.frame[1], second.request.frame[1]], [1, 2]);
  for (const read of [1, 2]) {
    assert.equal(f.packets.filter(p => p.read === read && p.event === 'read_aborted').length, 1);
    assert.equal(f.packets.filter(p => p.read === read && p.event === 'returned').length, 1);
    assert.equal(f.packets.filter(p => p.read === read && ['headers', 'body_started', 'body_completed', 'parsed', 'application_requested', 'committed'].includes(p.event)).length, 0);
  }
  assert.equal(f.packets.filter(p => p.event === 'refresh_entered' && p.effect === 2 && p.target === 2).length, 1);
  assert.deepEqual(f.writes.filter(w => w.state === 0).map(w => w.value?.coordinate?.focus), ['controlled-read-3']);
  assert.equal(f.states[0]?.coordinate.focus, 'controlled-read-3'); assert.equal(f.states[1], 'available');
  for (const event of ['headers', 'body_started', 'body_completed', 'parsed', 'application_requested', 'returned', 'committed']) {
    assert.equal(f.packets.filter(p => p.read === 3 && p.event === event).length, 1, event);
  }
  assert.deepEqual(f.snapshot.counts, { overflow: 0, invalid: 0, installation: 0 });
}

// The same finite regression can run against the retained original verdict
// module. A failed assertion is the original guard's rejection of this completed
// owned replay, not a fabricated failure, syntax error or production attempt.
const supersessionSource = ['--supersession-verdict-source', '--supersession-verdict-observe'].includes(args[0]);
const witnessMode = args[0] === '--verdict-source';
if (supersessionSource) {
  assert.equal(args.length, 2); assert(path.isAbsolute(args[1]), 'exact verdict source must be an absolute module file');
  const factory = (await import(pathToFileURL(args[1]).href)).createProjectExperienceRequestVerdictV1;
  const f = await fixture({ supersession: true }, factory); assertSupersessionProducer(f);
  const observed = [1, 2].map(read => ({ read, ...f.reason(f.failuresByRead.get(read)) }));
  console.log(JSON.stringify({ mode: args[0], fixture: 'actual_hook_cleanup_replay_explicit_refresh', observed,
    requests: 3, bound_cancellations: 2, adopted_read: 3, actual_producer_collector_private_pins: true,
    created_reads: f.packets.filter(p => p.event === 'read_created').map(p => ({ read: p.read, effect: p.effect, cause: p.cause })),
    aborted_reads: f.requests.flatMap((r, index) => r.args.signal.aborted ? [index + 1] : []), final_body_parse_commit: true,
    synthetic_controlled_schedule: true, historical_browser_recreation: false, production_attempt: false }));
  if (args[0] === '--supersession-verdict-source') assert.deepEqual(supersessionAccepted(f), [true, true], JSON.stringify(observed));
} else if (witnessMode) {
  assert([2, 3].includes(args.length));
  const witnessPhase = args[2] ?? phase;
  assert(GUIDE_REPLAY_PHASES_V1.includes(witnessPhase));
  const factory = (await import(pathToFileURL(args[1]).href)).createProjectExperienceRequestVerdictV1;
  const f = await fixture({ phase: witnessPhase }, factory);
  assert.equal(f.expected(f.failure), true, JSON.stringify(f.reason()));
  console.log(JSON.stringify({ status: 'pass', phase: witnessPhase, actual_hook_and_guard: true, same_fixture_replay: true }));
} else {
  for (const phase of replayPhases) {
    const replay = await fixture({ phase }); assert.equal(replay.expected(replay.failure), true, phase);
    const adverse = await fixture({ phase, bodyFailed: true }); assert.equal(adverse.expected(adverse.failure), false, phase);
  }
  assert.equal((await fixture({laterRefresh:true})).reason().expected,true,
    "a later explicit refresh cannot erase the completed initial replacement");
  const good = await fixture();
  assert.equal(good.expected(good.failure), true, JSON.stringify(good.reason()));
  assert.equal(good.expected({ ...good.failure }), false, 'copied public failure');
  assert.equal((await fixture()).expected(good.failure), false, 'other owner');
  const snapshot = good.lifecycle.snapshot(); snapshot.complete = true; snapshot.events.length = 0;
  assert.equal(good.expected(good.failure), true, 'public snapshot cannot change private facts');
  const without = await fixture({ observerAbsent: true });
  const visible = f => JSON.stringify({ writes: f.writes, requests: f.requests.map(r => ({ url: r.url, args: { ...r.args, signal: r.args.signal.aborted } })) });
  assert.equal(visible(good), visible(without), 'actual hook requests/abort/state writes with observer absent/present');
  const drop = kind => value => value.event === kind ? [] : [value];
  const alter = (kind, change) => value => [value.event === kind ? { ...value, ...change } : value];
  const negative = [
    ['forged capability', { forged: true }], ['wrong connection', { wrongConnection: true }], ['wrong session', { wrongSession: true }],
    ['wrong request', { wrongRequest: true }], ['wrong frame', { wrongFrame: true }], ['wrong loader', { wrongLoader: true }],
    ['wrong execution context', { wrongExecutionContext: true }], ['wrong callsite', { wrongCallsite: true }],
    ['ambiguous frame', { ambiguousFrame: true }], ['reused request', { reuse: true }], ['redirect', { redirect: true }],
    ['wrong phase', { phase: 'retired_route_safety' }], ['real network error', { error: 'net::ERR_CONNECTION_RESET' }],
    ['not canceled', { canceled: false }], ['transport gap', { gap: true }], ['installation loss', { installationLoss: true }],
    ['bounded retention overflow', { overflow: true }], ['late stale application', { lateStale: true }],
    ['modified failure', { modifiedFailure: true }], ['unmount without replay', { unmountOnly: true }],
    ['explicit refresh', { explicitRefresh: true }], ['replacement network failure', { replacementFailed: true }],
    ['replacement HTTP failure', { httpError: true }], ['replacement body failure', { bodyFailed: true }],
    ['replacement invalid body', { invalidBody: true }], ['replacement wrong project', { wrongProject: true }],
    ['replacement not finished', { notFinished: true }], ['replacement not adopted', { unconsumed: true }],
    ['navigation before adoption', { navigationBeforeCommit: true }], ['project changed', { contextChange: true }],
    ...['effect_cleanup', 'abort_requested', 'signal_aborted', 'abort_returned', 'read_aborted', 'body_completed', 'parsed', 'application_requested', 'committed'].map(k => ['missing ' + k, { mutate: drop(k) }]),
    ['wrong controller', { mutate: alter('signal_aborted', { controller: 99 }) }],
    ['wrong generation', { mutate: alter('signal_aborted', { effect: 2 }) }],
    ['wrong context', { mutate: alter('signal_aborted', { context: 'project-99' }) }],
    ['wrong consumer', { mutate: alter('signal_aborted', { consumer: 99 }) }],
    ['unexplained abort', { mutate: alter('abort_requested', { cause: 'unknown' }) }],
    ['wrong request signal', { mutate: alter('fetch_started', { same_signal: false }) }],
    ['wrong request context', { mutate: alter('fetch_started', { request_valid: false }) }],
    ['stale application', { mutate: alter('application_requested', { current: false }) }],
    ['aborted application', { mutate: alter('application_requested', { aborted: true }) }],
    ['wrong adopted controller', { mutate: alter('committed', { same_controller: false }) }],
    ['stale consumer', { mutate: alter('committed', { context_current: false }) }],
    ['duplicate commit', { mutate: v => v.event === 'committed' ? [v, { ...v }] : [v] }],
    ['old result applied', { mutate: v => v.event === 'returned' && v.read === 1 ? [v, { ...v, event: 'application_requested', current: false, aborted: true, project_matches: true }] : [v] }],
  ];
  for (const [label, options] of negative) {
    const f = await fixture(options);
    assert.equal(f.expected(f.failure), false, label + ':' + JSON.stringify(f.reason()));
  }
  const historical = await fixture({ phase: 'companion_first_work_access' });
  assert.equal(historical.reason().expected, false, 'new branch grants no other phase');
  assert.equal(historical.expected(historical.failure), !operatorScope, 'separate pre-existing phase policy remains unchanged');
  const later = await fixture({ unrelatedLater: true });
  assert.equal(later.expected(later.failure), true, 'unrelated later traffic cannot evict the causal window');
  let representativeChain;
  for (const phase of replayPhases) {
    const chain = await fixture({ supersession: true, phase }); assertSupersessionProducer(chain);
    representativeChain ??= chain;
    assert.deepEqual(supersessionAccepted(chain), [true, true], phase + ':' + JSON.stringify([chain.reason(), chain.reason(chain.failuresByRead.get(2))]));
    assert.equal(chain.expected({ ...chain.failuresByRead.get(2) }), false, 'copied B failure has no private evidence');
    assert.equal(good.expected(chain.failuresByRead.get(2)), false, 'B failure belongs to its actual owner');
  }
  assert.equal(visible(representativeChain), visible(await fixture({ supersession: true, observerAbsent: true })),
    'actual three-read hook requests/abort/state writes with observer absent/present');
  const afterChainRefresh = await fixture({ supersession: true, laterRefresh: true });
  assert.deepEqual(supersessionAccepted(afterChainRefresh), [true, true], 'a later refresh cannot erase the completed three-read chain');
  const readMutation = (read, kind, change) => v => v.read === read && v.event === kind ? change(v) : [v];
  const omitRead = (read, kind) => readMutation(read, kind, () => []);
  const changeRead = (read, kind, fields) => readMutation(read, kind, v => [{ ...v, ...fields }]);
  const reorderRead = (read, first, second) => {
    let held;
    return v => { if (v.read === read && v.event === first) { held = v; return []; }
      if (v.read === read && v.event === second && held) return [v, held]; return [v]; };
  };
  const chainNegative = [
    ['A failure missing', { missingFailure: 1 }], ['A failure not bound', { omitFailureBinding: 1 }],
    ['A failure absent from verdict owner', { omitVerdictFailure: 1 }], ['A failure changed after binding', { modifiedFailureRead: 1 }],
    ['B failure missing', { missingFailure: 2 }], ['B failure not bound', { omitFailureBinding: 2 }],
    ['B failure absent from verdict owner', { omitVerdictFailure: 2 }], ['B failure changed after binding', { modifiedFailureRead: 2 }],
    ['A duplicate failure delivery', { duplicateFailure: 1 }], ['B duplicate failure delivery', { duplicateFailure: 2 }],
    ['B wrong private generation pin', { wrongPinRead: 2 }], ['B wrong failure request', { wrongFailureRead: 2 }],
    ['B wrong frame', { wrongFrameRead: 2 }], ['B wrong loader', { wrongLoaderRead: 2 }],
    ['C wrong private generation pin', { wrongPinRead: 3 }], ['C wrong frame', { wrongFrameRead: 3 }],
    ['missing explicit refresh target', { mutate: v => v.event === 'refresh_entered' && v.target === 2 ? [] : [v] }],
    ['duplicate explicit refresh target', { mutate: v => v.event === 'refresh_entered' && v.target === 2 ? [v, { ...v }] : [v] }],
    ['wrong superseded target', { mutate: v => [v.event === 'refresh_entered' && v.target === 2 ? { ...v, target: 1 } : v] }],
    ['B wrong cause', { mutate: changeRead(2, 'abort_requested', { cause: 'cleanup' }) }],
    ['B already aborted', { mutate: changeRead(2, 'abort_requested', { already_aborted: true }) }],
    ['B wrong controller', { mutate: changeRead(2, 'signal_aborted', { controller: 3 }) }],
    ['B wrong context', { mutate: changeRead(2, 'signal_aborted', { context: 'project-2' }) }],
    ['B wrong consumer', { mutate: changeRead(2, 'signal_aborted', { consumer: 2 }) }],
    ['B reordered abort', { mutate: reorderRead(2, 'abort_requested', 'signal_aborted') }],
    ['B reordered settlement', { mutate: reorderRead(2, 'read_aborted', 'returned') }],
    ['C is another initial read', { mutate: changeRead(3, 'read_created', { cause: 'initial_effect' }) }],
    ['C is another effect', { mutate: changeRead(3, 'read_created', { effect: 3 }) }],
    ['C wrong signal', { mutate: changeRead(3, 'fetch_started', { same_signal: false }) }],
    ['C wrong context', { mutate: changeRead(3, 'read_created', { context: 'project-2' }) }],
    ['C stale application', { mutate: changeRead(3, 'application_requested', { current: false }) }],
    ['C aborted application', { mutate: changeRead(3, 'application_requested', { aborted: true }) }],
    ['C wrong adopted controller', { mutate: changeRead(3, 'committed', { same_controller: false }) }],
    ['C stale consumer', { mutate: changeRead(3, 'committed', { context_current: false }) }],
    ['C duplicate commit', { mutate: readMutation(3, 'committed', v => [v, { ...v }]) }],
    ['C reordered body/parse', { mutate: reorderRead(3, 'body_completed', 'parsed') }],
    ...['abort_requested', 'signal_aborted', 'abort_returned', 'read_aborted', 'returned'].map(kind => ['B missing ' + kind, { mutate: omitRead(2, kind) }]),
    ...['body_started', 'body_completed', 'parsed', 'application_requested', 'returned', 'committed'].map(kind => ['C missing ' + kind, { mutate: omitRead(3, kind) }]),
    ...[1, 2].map(read => ['stale canceled adoption after C: ' + read, { mutate: readMutation(3, 'committed', v => [v,
      { ...v, event: 'application_requested', read, controller: read, effect: read === 1 ? 1 : 2, current: false, aborted: true, project_matches: true }]) }]),
    ['C network failure', { replacementFailed: true }], ['C HTTP failure', { httpError: true }], ['C body failure', { bodyFailed: true }],
    ['C invalid body', { invalidBody: true }], ['C wrong project', { wrongProject: true }], ['C not finished', { notFinished: true }],
    ['C not adopted', { unconsumed: true }], ['navigation before C adoption', { navigationBeforeCommit: true }],
    ['project changed before C adoption', { contextChange: true }], ['fourth read before C commit', { refreshBeforeCommit: true }],
  ];
  for (const [label, options] of chainNegative) {
    const f = await fixture({ supersession: true, ...options });
    assert.deepEqual(supersessionAccepted(f), [false, false], label + ':' + JSON.stringify([f.reason(), f.reason(f.failuresByRead.get(2))]));
  }
  for (const read of [1, 2]) for (const schedule of ['delayedResponse', 'delayedBody']) {
    const f = await fixture({ supersession: true, [schedule]: read });
    assert.equal(f.writes.length, f.beforeDelayedWrites, `aborted ${read} ${schedule} cannot write after C commits`);
    assert.equal(f.states[0]?.coordinate.focus, 'controlled-read-3');
    assert.equal(f.packets.filter(p => p.read === read && p.event === 'stale_blocked').length, 1);
    assert.equal(f.packets.filter(p => p.read === read && ['application_requested', 'committed'].includes(p.event)).length, 0);
    assert.deepEqual(supersessionAccepted(f), [false, false], 'nonempty canceled response is outside this strict empty-abort branch');
  }
  // Native wrapper contract: no extra Promise, header, body read, abort call or
  // scheduling is introduced. The hook parity above exercises actual consumers.
  const f = createGuideLifecycleV1(), connection = f.connection({}), packets = [];
  let calls = 0, receiver, requestArgs; const promise = Promise.resolve(null);
  const window = { [GUIDE_LIFECYCLE_BINDING_V1]: p => packets.push(p), fetch(...args) { calls++; receiver = this; requestArgs = args; return promise; } };
  vm.runInNewContext(f.browserSource(), { window, URL, location: { hostname: 'localhost', href: origin + '/', origin }, crypto: { randomUUID } });
  const observer = window.__augnesGuideLifecycleV1.consumer({}), controller = new AbortController();
  observer.setup(project); observer.initial(true); const read = observer.read(controller, project);
  const options = { method: 'GET', signal: controller.signal, cache: 'no-store', credentials: 'same-origin', headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' } };
  const url = route + '?scope=project%3Aaugnes&project_id=' + encodeURIComponent(project);
  assert.equal(read.fetch(url, options), promise); assert.equal(calls, 1); assert.equal(requestArgs[1], options); assert.equal(receiver, undefined);
  assert.equal(controller.signal.aborted, false); assert(connection);
  console.log(JSON.stringify({ test: 'project-experience-guide-lifecycle-v1', status: 'pass', adversarial_controls: negative.length + 3 + replayPhases.length,
    supersession_adversarial_controls: chainNegative.length, delayed_canceled_result_controls: 4, supersession_phases: replayPhases.length,
    replay_phases: replayPhases, operator_scope: operatorScope,
    actual_hook_guard: true, observer_parity: true, exact_fetch_promise: true, production_attempt: false }));
}

}

await runGuideLifecycleRegressionV1();
