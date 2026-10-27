#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import { createProjectExperienceRequestVerdictV1, RSC_CONSUMPTION_BINDING_V1 } from './project-experience-request-verdict-v1.mjs';

const require = createRequire(import.meta.url), previousWebpack = globalThis.__webpack_require__;
globalThis.__webpack_require__ = Object.assign(() => { throw Error('This plain Flight fixture has no client module references'); }, { u: id => id });
const decoder = require('next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-client.browser.development.js');
const owner = readFileSync(new URL('./browser-validate-project-experience-v1.mjs', import.meta.url), 'utf8');
const guard = owner.slice(owner.indexOf('function expectedFailedRequest('), owner.indexOf('function failedRequestAssertionEntry('));
const tick = () => new Promise(resolve => setImmediate(resolve));
const phase = 'companion_first_work_access', origin = 'http://localhost:3000', route = '/projects/project%3Acontrolled';

async function fixture(options = {}, factory = createProjectExperienceRequestVerdictV1) {
  const verdict = factory(), connection = verdict.connection({}), packets = [], protocol = [], requests = [];
  let failure, controller, actualResponse, originalFetchPromise, rootReader, originalReadPromise, identityChecked = false;
  let decoded, decodeError, ordinal = 0;
  const saved = [];
  for (const [p, names] of [[ReadableStream.prototype,['getReader','cancel','tee']], [ReadableStreamDefaultReader.prototype,['read','cancel','releaseLock']], [Response.prototype,['clone']]]) {
    for (const name of names) saved.push([p,name,Object.getOwnPropertyDescriptor(p,name)]);
  }
  const emit = (method, params, entry) => {
    const payload = { method, params, sessionId: 'session' }; protocol.push(payload);
    verdict.observeRscLifecycle?.(connection, payload, phase);
    if (entry) verdict.observe(connection, payload, entry);
    return entry;
  };
  emit('Page.frameNavigated',{frame:{id:'frame',loaderId:'loader'}});
  emit('Runtime.executionContextCreated',{context:{id:1,auxData:{frameId:'frame',isDefault:true}}});
  const window = {
    [RSC_CONSUMPTION_BINDING_V1](text) {
      const p = JSON.parse(text); packets.push(p);
      if (p.kind === options.omit) return;
      const copies = options.duplicate === p.kind ? [p,p] : [p];
      for (const event of copies) emit('Runtime.bindingCalled', { name:RSC_CONSUMPTION_BINDING_V1, executionContextId:options.wrongContext?2:1,
        payload:JSON.stringify({...event, ordinal:++ordinal, ...(options.wrongChannel?{channel:'0'.repeat(32)}:{})}) });
    },
    fetch(url, init) {
      const pins = [...String(new Error().stack).matchAll(/augnes-consumed-flight\/[a-f0-9]+\/[a-f0-9-]+\/\d+/g)].map(m=>({url:m[0]}));
      const frames = options.noPin ? [] : options.duplicatePin ? [...pins,...pins] : pins;
      frames.push({url:'webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/router-reducer/fetch-server-response.js'});
      emit('Network.requestWillBeSent',{requestId:'rsc',frameId:'frame',loaderId:options.wrongLoader?'other':'loader',type:'Fetch',
        request:{url,method:init.method??'GET',headers:init.headers},initiator:{stack:{callFrames:frames}},redirectResponse:options.redirect?{}:undefined},
        {phase,path:route,method:init.method??'GET',external:false});
      const stream = new ReadableStream({ start(c) {controller=c;} });
      actualResponse = new Response(stream,{status:options.httpError?503:200,headers:{'content-type':'text/x-component'}});
      emit('Network.responseReceived',{requestId:'rsc',frameId:'frame',loaderId:'loader',response:{status:actualResponse.status,mimeType:'text/x-component',url}},
        {phase,path:route,status:actualResponse.status});
      originalFetchPromise = Promise.resolve(actualResponse); requests.push({url,init}); return originalFetchPromise;
    },
  };
  // The observer must preserve the actual reader and promise returned by native
  // methods, including when the installed React decoder is the caller.
  const nativeGet = ReadableStream.prototype.getReader, nativeRead = ReadableStreamDefaultReader.prototype.read;
  ReadableStream.prototype.getReader = function(...args) {return rootReader = Reflect.apply(nativeGet,this,args);};
  ReadableStreamDefaultReader.prototype.read = function(...args) {return originalReadPromise = Reflect.apply(nativeRead,this,args);};
  try {
    if (verdict.rscBrowserSource) vm.runInNewContext(verdict.rscBrowserSource(), {window,location:{hostname:'localhost',href:origin+route,origin},
      URL,Headers,Response,ReadableStream,ReadableStreamDefaultReader,crypto:{randomUUID}});
    const headers = {rsc:'1',...(options.hmr?{'next-hmr-refresh':'1'}:{}),...(options.prefetch?{'next-router-prefetch':'1'}:{})};
    const promise = window.fetch(origin+route+'?_rsc=fixture',{headers,method:options.method??'GET',...(options.signal?{signal:new AbortController().signal}:{})});
    assert.equal(promise,originalFetchPromise,'fetch promise identity unchanged');
    assert.equal(await promise,actualResponse,'Response identity unchanged');
    if (options.parity) {
      const reader = actualResponse.body.getReader(); assert.equal(reader,rootReader,'reader identity unchanged');
      const readPromise = reader.read(); assert.equal(readPromise,originalReadPromise,'read promise identity unchanged');
      const bytes = new Uint8Array([1,2,3]); controller.enqueue(bytes);
      const value = await readPromise; assert.equal(value.value,bytes,'chunk identity unchanged');
      await reader.cancel(); identityChecked=true;
    } else {
      const result = decoder.createFromFetch(promise); result.then(v=>{decoded=v;},e=>{decodeError=e;});
      await tick();
      if (options.contextLost) emit('Runtime.executionContextDestroyed',{executionContextId:1});
      if (options.cancel) await rootReader.cancel();
      else if (options.reject) controller.error(new Error('Controlled still-required body failure'));
      else {
        controller.enqueue(new TextEncoder().encode(options.truncated ? '0:{"result":' : '0:{"result":"current","project":"controlled"}\n'));
        if (!options.incomplete) controller.close();
      }
      await tick(); await tick();
    }
    if(options.finished)emit('Network.loadingFinished',{requestId:'rsc'},{phase});
    failure = emit('Network.loadingFailed',{requestId:'rsc',type:'Fetch',errorText:options.error??'net::ERR_ABORTED',canceled:true},
      {phase,path:null,error_text:options.error??'net::ERR_ABORTED'});
    if (options.copied) failure={...failure};
    if (options.tampered) failure.phase='unbound_phase';
    if (options.installation) verdict.rscInstallationFailed?.();
    const context=vm.createContext({requestVerdicts:verdict});vm.runInContext(guard,context);
    const expected=context.expectedFailedRequest(failure), classification=verdict.normallyConsumedFlight?.(failure);
    // Native EOF is transport consumption, not a Flight semantic parser. The
    // existing independent UI/page/console boundaries must also remain green.
    const combinedBoundary = expected && !decodeError && decoded?.result==='current' && decoded?.project==='controlled';
    return {expected,classification,combinedBoundary,decoded,decodeError:decodeError?.message,identityChecked,packets,protocol,
      snapshot:verdict.rscConsumptionSnapshot?.()};
  } finally {
    try {controller?.close();} catch {}
    await tick();
    for(const [proto,name,descriptor] of saved)Object.defineProperty(proto,name,descriptor);
  }
}

try {
  const args=process.argv.slice(2);
  if(args[0]==='--verdict-source') {
    assert.equal(args.length,2); const imported=await import(pathToFileURL(args[1]).href);
    const observed=await fixture({},imported.createProjectExperienceRequestVerdictV1);
    console.log(JSON.stringify({regression:'actual_native_flight_reader_and_browser_guard',...observed}));
    assert.equal(observed.combinedBoundary,true,'normally consumed actual Flight response must survive the Browser request guard');
  } else {
    assert.equal(args.length,0);
    const positive=await fixture();assert.equal(positive.expected,true);assert.equal(positive.combinedBoundary,true);
    const negatives=[{omit:'eof'},{omit:'chunk'},{omit:'reader'},{omit:'headers'}, {duplicate:'eof'},{duplicate:'reader'},
      {reject:true},{cancel:true},{incomplete:true},{contextLost:true},{wrongContext:true},{wrongLoader:true},
      {wrongChannel:true},{noPin:true},{duplicatePin:true},{redirect:true},{copied:true},{tampered:true},{installation:true},{finished:true},
      {httpError:true},{hmr:true},{prefetch:true},{signal:true},{method:'POST'},{error:'net::ERR_CONNECTION_RESET'}];
    for(const input of negatives) {
      const result=await fixture(input);assert.equal(result.classification?.expected,false,JSON.stringify({input,classification:result.classification}));
      assert.equal(result.expected,false,JSON.stringify({input,classification:result.classification}));
    }
    const truncated=await fixture({truncated:true});
    assert.equal(truncated.expected,true,'EOF alone is only the transport-consumption fact');
    assert.match(truncated.decodeError,/Connection closed/);
    assert.equal(truncated.combinedBoundary,false,'the actual decoder still rejects a truncated required result');
    const parity=await fixture({parity:true});assert.equal(parity.identityChecked,true);assert.equal(parity.expected,false);
    // Exercise the actual owner callback: contradiction refusal must receive
    // loadingFinished in production, not only in this native-stream fixture.
    const forwarded=[];let listener;
    const state={requestDiagnostics:{connection:()=>null,observe(){},bindVerdictFailure(){}},
      guideLifecycle:{connection:()=>null,observe(){},bindFailure(){}},inspectorLifecycle:{connection:()=>null,observe(){},bindFailure(){}},
      requestVerdicts:{connection:()=>({}),observe(_c,p){forwarded.push(p.method);}},cdp:{on(fn){listener=fn;}},
      currentPhase:phase,failedRequests:[],lastObserverActivityAt:0,Date};
    vm.runInNewContext(owner.slice(owner.indexOf('function attachCdpObservers()'),owner.indexOf('async function restartRuntime('))+'\nattachCdpObservers();',state);
    listener({method:'Network.loadingFinished',params:{requestId:'same'}});
    listener({method:'Network.loadingFailed',params:{requestId:'same',errorText:'net::ERR_ABORTED'}});
    assert.deepEqual(forwarded,['Network.loadingFinished','Network.loadingFailed']);
    console.log(JSON.stringify({status:'pass',actual_installed_react_decoder:true,native_stream_positive:1,
      refusal_controls:negatives.length,semantic_truncation_rejected_by_decoder:true,native_identity_parity:true,
      actual_owner_finished_failure_forwarding:true,
      obsolete_incomplete_stream_not_exempt:true,whole_owner_verification:'required_separately'}));
  }
} finally {
  if(previousWebpack===undefined)delete globalThis.__webpack_require__;else globalThis.__webpack_require__=previousWebpack;
}
