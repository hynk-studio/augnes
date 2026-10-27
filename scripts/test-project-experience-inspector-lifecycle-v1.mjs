#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import { createInspectorLifecycleV1, INSPECTOR_LIFECYCLE_BINDING_V1, INSPECTOR_REPLAY_PHASES_V1 } from './project-experience-inspector-lifecycle-v1.mjs';
import { createProjectExperienceRequestVerdictV1 } from './project-experience-request-verdict-v1.mjs';
import { OPERATOR_REQUEST_LIFECYCLE_PHASES_V1, classifyOperatorLifecycleRequestFailureV1 } from './operator-execution-result-contract-v1.mjs';
const operatorScope = process.argv[2] === '--operator-scope';
const replayPhases = operatorScope ? OPERATOR_REQUEST_LIFECYCLE_PHASES_V1 : INSPECTOR_REPLAY_PHASES_V1;
const ts = createRequire(import.meta.url)('typescript');
const transpile = source => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const componentCode = transpile(readFileSync(process.argv[2] === '--component-source' ? process.argv[3] :
  new URL('../components/workbench/inspector/shared-project-inspector-loader.tsx', import.meta.url), 'utf8') + '\nexport { ScopedProjectInspectorLoader };');
const portalCode = transpile(readFileSync(new URL('../components/delegated-work/project-experience-test-observer.ts', import.meta.url), 'utf8'));
const targetCode = transpile(readFileSync(new URL('../lib/vnext/shared-project-inspector-href.ts', import.meta.url), 'utf8'));
const ownerSource = readFileSync(new URL('./browser-validate-project-experience-v1.mjs', import.meta.url), 'utf8');
const guardSource = ownerSource.slice(ownerSource.indexOf('function expectedFailedRequest('), ownerSource.indexOf('function failedRequestAssertionEntry('));
const tick = () => new Promise(resolve => setImmediate(resolve));
const origin = 'http://localhost:3000', project = 'project:inspector-control', route = '/api/vnext/operator/session';
const sessionBody = project_id => ({ status: 'authenticated', session: { project_id, authenticated: true } });
const inspectorBody = (project_id = project) => ({ status: 'inspector_read', project_activity: 'active', inspector: { marker: 'current', project_id } });

async function fixture(options = {}, factory = createProjectExperienceRequestVerdictV1) {
  const phase = options.phase ?? replayPhases[0];
  const lifecycle = createInspectorLifecycleV1({ phases: replayPhases }), identity = {}, lc = lifecycle.connection(identity);
  const verdict = factory({ inspectorEvidence: options.forged ? {} : lifecycle.evidence, inspectorReplayPhases: replayPhases });
  const vc = verdict.connection(options.wrongConnection ? {} : identity);
  const requests = [], writes = [], packets = [];
  let ordinal = 0, failure, params = new URLSearchParams('target=project_coordination');
  function emit(method, parameters, entry = {}, session = 'session') {
    const payload = { method, params: parameters, sessionId: session };
    lifecycle.observe(lc, payload, phase); verdict.observe(vc, payload, entry);
    if (method === 'Network.loadingFailed') lifecycle.bindFailure(lc, payload, entry);
    return entry;
  }
  emit('Page.frameNavigated', { frame: { id: 'frame', loaderId: 'loader' } });
  emit('Runtime.executionContextCreated', { context: { id: 1, auxData: { frameId: 'frame', isDefault: true } } });
  const window = {
    [INSPECTOR_LIFECYCLE_BINDING_V1](payload) {
      const original = JSON.parse(payload); packets.push(original);
      for (const item of options.mutate ? options.mutate(structuredClone(original)) : [original]) {
        item.ordinal = ++ordinal;
        emit('Runtime.bindingCalled', { name: INSPECTOR_LIFECYCLE_BINDING_V1, payload: JSON.stringify(item), executionContextId: options.wrongContext ? 2 : 1 });
      }
    },
    fetch(url, args) {
      const number = requests.length + 1;
      let resolve, reject;
      const promise = new Promise((a,b) => { resolve = a; reject = b; });
      const r = { number, id: `request-${number}`, url, args, resolve, reject }; requests.push(r);
      const frames = [...new Error().stack.matchAll(/augnes-inspector\/[a-f0-9]+\/[a-f0-9-]+\/\d+/g)].map(m => ({ url: m[0] }));
      if (!options.wrongCallsite) frames.push({ url: 'webpack-internal:///./components/workbench/inspector/shared-project-inspector-loader.tsx' });
      emit('Network.requestWillBeSent', { requestId: r.id, frameId: options.wrongFrame ? 'other' : 'frame', loaderId: 'loader', type: 'Fetch',
        request: { url: new URL(url, origin).href, method: args.method }, initiator: { stack: { callFrames: frames } } },
      { phase, path: new URL(url, origin).pathname, method: args.method, external: false });
      args.signal?.addEventListener('abort', () => {
        if (!(number === 1 && options.lateObsoleteBody)) reject(new DOMException('Controlled obsolete request', 'AbortError'));
        if (number === 1) queueMicrotask(() => { failure = emit('Network.loadingFailed', {
          requestId: r.id, canceled: options.canceled ?? true, errorText: options.networkError ?? 'net::ERR_ABORTED' },
        { phase, path: null, error_text: options.networkError ?? 'net::ERR_ABORTED' }); });
      }, { once: true });
      return promise;
    },
  };
  vm.runInNewContext(lifecycle.browserSource(), { window, URL, location: { hostname: 'localhost', origin, href: origin + '/workbench/inspector' }, crypto: { randomUUID } });
  const portal = {};
  vm.runInNewContext(portalCode, { exports: portal, window, process: { env: { NODE_ENV: options.observerAbsent ? 'production' : 'development' } } });
  const target = {};
  vm.runInNewContext(targetCode, { exports: target, URLSearchParams, URL, Error });
  const states = [], refs = [], memos = [], effects = [];
  let si = 0, ri = 0, mi = 0, ei = 0;
  const equal = (a,b) => a?.length === b?.length && a.every((v,i) => v === b[i]);
  const react = {
    useState(initial) { const i=si++; if (!(i in states)) states[i]=initial; return [states[i], value => { states[i]=value; writes.push({ state:i,value }); }]; },
    useRef(current) { const i=ri++; return refs[i] ??= { current }; },
    useMemo(fn,deps) { const i=mi++; if (!memos[i] || !equal(memos[i].deps,deps)) memos[i]={ deps,value:fn() }; return memos[i].value; },
    useCallback(fn,deps) { return this.useMemo(() => fn,deps); },
    useEffect(fn,deps) { const i=ei++, old=effects[i]; effects[i]={ fn,deps,changed:!old || !equal(old.deps,deps),cleanup:old?.cleanup }; },
  };
  react.useCallback = (fn,deps) => react.useMemo(() => fn,deps);
  const exports = {};
  vm.runInNewContext(componentCode, { exports, AbortController, DOMException, URLSearchParams, Error,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}) };
      if (name === 'next/navigation') return { useSearchParams:() => params };
      if (name.endsWith('project-experience-test-observer')) return portal;
      if (name.endsWith('project-client-scope')) return { useProjectClientFetch:() => window.fetch, useProjectClientScope:() => project, useProjectClientHref:() => x=>x, ProjectClientScopeProvider:'scope' };
      if (name.endsWith('project-client-href')) return { projectClientTargetQuery:p=>p };
      if (name.endsWith('shared-project-inspector-href')) return target;
      if (name.endsWith('contextual-inspector-view')) return { publicContextualInspectorErrorCodeV01:v=>v ?? 'unknown',
        deriveSafeContextualInspectorRelatedContextV01:()=>({}), buildContextualInspectorViewV01:()=>({}), contextualInspectorRouteErrorPresentationV01:()=>({state:'unavailable'}) };
      if (name.endsWith('operator-session-panel')) return { OperatorSessionPanel:'session' };
      if (name.endsWith('shared-project-inspector-surface')) return { SharedProjectInspectorSurface:'inspector' };
      if (name.endsWith('product-shell')) return { ProductShell:'shell' };
      if (name.endsWith('.css')) return {};
      throw Error('unhandled component import: '+name);
    } });
  const render = () => { si=ri=mi=ei=0; return exports.ScopedProjectInspectorLoader(); };
  const setup = () => effects.forEach(e => { if (e.changed) { e.cleanup?.(); e.cleanup=e.fn(); e.changed=false; } });
  const respond = (request,status,body,bodyFailure=false) => {
    emit('Network.responseReceived', { requestId:request.id,frameId:'frame',loaderId:'loader',response:{url:new URL(request.url,origin).href,status} }, { phase,path:new URL(request.url,origin).pathname,status });
    request.resolve({status,ok:status>=200&&status<300,json:async()=>{if(bodyFailure)throw bodyFailure === 'abort' ? new DOMException('current body failed without owner abort','AbortError') : Error('controlled body failure');return body;}});
    emit('Network.loadingFinished',{requestId:request.id});
  };
  render(); setup();
  let resolveObsolete;
  if (options.lateObsoleteBody) {
    requests[0].resolve({status:200,ok:true,json:()=>new Promise(resolve=>{resolveObsolete=resolve;})}); await tick();
  }
  if (options.firstRealFailure) { requests[0].reject(Error('independent request failure')); await tick(); }
  effects.forEach(e=>e.cleanup?.());
  if (!options.unmountOnly) effects.forEach(e=>{e.cleanup=e.fn();});
  await tick();
  const replacement=requests[1];
  let resolveOldInspector, rejectOldInspector;
  if (replacement) {
    if (options.replacementNetworkFailure) replacement.reject(Error('independent replacement failure'));
    else respond(replacement,options.httpFailure?503:options.authenticated?200:401,
      options.authenticated ? sessionBody(options.wrongProject?'project:other':project) : {error_code:'operator_session_cookie_missing'},options.bodyFailure);
    await tick();
    if (requests[2]) {
      if (options.lateInspectorBody || options.lateInspectorError) {
        requests[2].resolve({status:200,ok:true,json:()=>new Promise((resolve,reject)=>{resolveOldInspector=resolve;rejectOldInspector=reject;})});
      } else if (options.inspectorRefusal) respond(requests[2],options.inspectorRefusal,{error_code:options.wrongRefusalCode?'arbitrary_error':options.inspectorRefusal===404?'shared_inspector_target_missing':'shared_inspector_target_fingerprint_conflict'});
      else if (options.inspectorFailure) respond(requests[2],200,{},options.inspectorFailure);
      else respond(requests[2],200,inspectorBody(options.wrongInspectorProject?'project:other':project));
      await tick();
    }
    if (!options.noCommit) {render();setup();}
  }
  if (resolveOldInspector) {
    params=new URLSearchParams({target:'semantic_state',record_id:'state:replacement',fingerprint:'sha256:'+'a'.repeat(64)});
    render();setup();
    assert.equal(requests.length,4,'target replacement invokes actual new session effect');
    respond(requests[3],200,sessionBody(project));await tick();
    assert.equal(requests.length,5,'current authenticated session invokes new Inspector');
    respond(requests[4],200,inspectorBody());await tick();render();setup();
    assert.equal(states[1].inspector.marker,'current','replacement adopted before obsolete body settlement');
    if(options.lateInspectorError) rejectOldInspector(Error('obsolete Inspector body failure'));
    else resolveOldInspector({...inspectorBody(),inspector:{project_id:project,marker:'obsolete'}});
    await tick();render();setup();
  }
  const beforeLate=writes.length;
  if (resolveObsolete) {resolveObsolete(sessionBody('project:obsolete'));await tick();render();setup();}
  if (options.installationLoss) lifecycle.installationFailed();
  const guard = vm.createContext({ requestVerdicts:verdict }); vm.runInContext(guardSource,guard);
  if (operatorScope) guard.expectedFailedRequest = entry => classifyOperatorLifecycleRequestFailureV1(entry, verdict).expected;
  return { expected:()=>guard.expectedFailedRequest(failure), verdict, failure, states,writes,requests,packets,
    snapshot:lifecycle.snapshot(), lateWrites:writes.slice(beforeLate), reason:()=>verdict.inspectorEffectReplayCancellation?.(failure) ?? {expected:false,reason:'retained_classifier_refuses'} };
}

if (process.argv[2] === '--current-abort-regression') {
  const session = await fixture({ bodyFailure: 'abort' });
  assert.equal(session.states[0].error_code, 'operator_session_request_failed', 'required current session AbortError is a real body failure');
  const inspector = await fixture({ authenticated:true, inspectorFailure:'abort' });
  assert.equal(inspector.states[2], 'shared_inspector_request_failed', 'required current Inspector AbortError is a real body failure');
  console.log(JSON.stringify({status:'pass',actual_component:true,current_body_abort_without_owner_abort:2}));
} else if (process.argv[2] === '--component-source' || process.argv[2] === '--stale-inspector-regression') {
  if(process.argv[2]==='--component-source')assert.equal(process.argv.length,4);
  for(const options of [{lateInspectorBody:true},{lateInspectorError:true}]) {
    const f=await fixture({authenticated:true,...options});
    assert.equal(f.states[1].inspector.marker,'current','obsolete Inspector body must not replace current result');
    assert.equal(f.states[2],null,'obsolete Inspector body error must not replace current error state');
    assert.equal(f.requests[2].args.signal.aborted,true,'actual cleanup aborted obsolete Inspector signal');
  }
  console.log(JSON.stringify({status:'pass',actual_component:true,late_inspector_body_and_error_discarded:true}));
} else if (process.argv[2] === '--verdict-source') {
  assert.equal(process.argv.length,4);
  const factory=(await import(pathToFileURL(process.argv[3]).href)).createProjectExperienceRequestVerdictV1;
  const f=await fixture({},factory);
  assert.equal(f.expected(),true,JSON.stringify(f.reason()));
  console.log(JSON.stringify({status:'pass',actual_component_and_guard:true,obsolete_body_not_read:true,current_state:f.states[0].status}));
} else {
  for(const phase of replayPhases) {
    const f=await fixture({phase,authenticated:phase==='rendered_state_responsive_matrix'});
    assert.equal(f.expected(),true,JSON.stringify(f.reason()));
  }
  for (const status of [404,409]) {
    const f=await fixture({authenticated:true,inspectorRefusal:status});
    assert.equal(f.expected(),true,JSON.stringify(f.reason()));
    assert.equal(f.reason().current_inspector,false);
    assert.equal(f.reason().current_inspector_refusal,status===404?'missing':'conflict');
    const absent=await fixture({authenticated:true,inspectorRefusal:status,observerAbsent:true});
    assert.equal(JSON.stringify(f.writes),JSON.stringify(absent.writes),'refusal observer preserves actual component state');
    assert.equal(f.states[2],status===404?'shared_inspector_target_missing':'shared_inspector_target_fingerprint_conflict');
  }
  const good=await fixture(), authenticated=await fixture({authenticated:true});
  assert.equal(authenticated.states[1].inspector.marker,'current');
  assert.equal(good.states[0].status,'locked');
  assert.equal(good.verdict.inspectorEffectReplayCancellation({...good.failure}).expected,false,'copied diagnostic failure');
  const absent=await fixture({observerAbsent:true});
  assert.equal(JSON.stringify(good.writes),JSON.stringify(absent.writes),'observer does not change actual component state writes');
  assert.deepEqual(good.requests.map(r=>[r.url,r.args.signal.aborted]),absent.requests.map(r=>[r.url,r.args.signal.aborted]));
  const late=await fixture({lateObsoleteBody:true});
  assert.equal(late.lateWrites.length,0,'inactive initial session body cannot adopt obsolete state');
  assert.equal(late.requests.length,2,'obsolete authenticated session cannot start Inspector');
  assert(late.packets.some(p=>p.kind==='stale_blocked'));
  for(const options of [{lateInspectorBody:true},{lateInspectorError:true}]) {
    const f=await fixture({authenticated:true,...options});
    assert.equal(f.states[1].inspector.marker,'current');assert.equal(f.states[2],null);
  }
  const drop=kind=>v=>v.kind===kind?[]:[v];
  const negative=[
    ['forged owner',{forged:true}],['wrong connection',{wrongConnection:true}],['wrong context',{wrongContext:true}],
    ['wrong frame',{wrongFrame:true}],['wrong callsite',{wrongCallsite:true}],['unrelated phase',{phase:'retired_route_safety'}],
    ['not canceled',{canceled:false}],['real network error',{networkError:'net::ERR_CONNECTION_RESET'}],
    ['unmount only',{unmountOnly:true}],['first independent error',{firstRealFailure:true}],
    ['replacement network error',{replacementNetworkFailure:true}],['replacement body error',{bodyFailure:true}],['current body AbortError',{bodyFailure:'abort'}],
    ['replacement HTTP error',{httpFailure:true}],['wrong project',{authenticated:true,wrongProject:true}],
    ['wrong Inspector project',{authenticated:true,wrongInspectorProject:true}],
    ['Inspector body error',{authenticated:true,inspectorFailure:true}],['current Inspector AbortError',{authenticated:true,inspectorFailure:'abort'}],['missing commit',{noCommit:true}],['unreviewed refusal',{authenticated:true,inspectorRefusal:500}],
    ['wrong refusal code',{authenticated:true,inspectorRefusal:404,wrongRefusalCode:true}],
    ['refusal not committed',{authenticated:true,inspectorRefusal:409,noCommit:true}],
    ['observer installation failure',{installationLoss:true}],
    ...['cleanup','abort_requested','signal_aborted','abort_returned','read_aborted','body_completed','session_applied','committed'].map(k=>['missing '+k,{mutate:drop(k)}]),
    ['stale application',{mutate:v=>[{...v,...(v.kind==='session_applied'?{current:false}:{})}]}],
    ...['consumer','effect','target'].flatMap(field=>[
      ['wrong cleanup '+field,{mutate:v=>[{...v,...(v.kind==='cleanup'?{[field]:99}:{})}]}],
      ['wrong replacement '+field,{mutate:v=>[{...v,...(v.kind==='body_completed'&&v.read===2?{[field]:99}:{})}]}],
    ]),
  ];
  for(const [name,options] of negative) {
    const f=await fixture(options);assert.equal(f.expected(),false,name+': '+JSON.stringify(f.reason()));
    if(options.bodyFailure||options.replacementNetworkFailure) assert.equal(f.states[0].error_code,'operator_session_request_failed');
    if(options.inspectorFailure) assert.equal(f.states[2],'shared_inspector_request_failed');
  }
  console.log(JSON.stringify({status:'pass',actual_component_and_guard:true,positive_replay_phases:replayPhases.length,operator_scope:operatorScope,adverse:negative.length,
    observer_parity:true,late_obsolete_body_blocked:true,late_inspector_body_and_error_discarded:true,
    wrong_project_controls:'classifier_refusal_only_server_scope_and_component_key_unchanged',real_body_failure_retained:true}));
}
