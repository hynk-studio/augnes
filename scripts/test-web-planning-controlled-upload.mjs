import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createRequire, registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { bundleWebPlanning } from './build-web-planning.mjs';
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { installControlledUpload, selectControlledUpload, CONTROLLED_UPLOAD_CHUNK_BYTES, observeControlledWorkerInput } from './web-planning-controlled-upload.mjs';

// Small authoring controls. This uses the pinned transport against real local
// sockets; it does not execute either prospective product comparison role.
const require=createRequire(new URL('../apps/web_planning/package.json',import.meta.url));
const {fetch}=require('undici');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const limit=CONTROLLED_UPLOAD_CHUNK_BYTES,payload=Uint8Array.from({length:limit*2+17},(_,i)=>i%251);
const headers={'content-length':String(payload.byteLength),'content-type':'application/json','x-synthetic-check':'kept'};
const findings=[];
const inputOwner=createCanonicalTestResourceRoot('ag-resource-test-');beginCanonicalTestResourceUse(inputOwner);
try{
 writeFileSync(path.join(inputOwner.root,'payload.txt'),'synthetic literal',{mode:0o600});
 writeFileSync(path.join(inputOwner.root,'module.mjs'),'export const value=1;',{mode:0o600});
 writeFileSync(path.join(inputOwner.root,'entry.mjs'),"import text from './payload.txt?raw'; import moduleText from './module.mjs?raw' with {type:'text'}; export default text+moduleText;",{mode:0o600});
 const built=await build({absWorkingDir:inputOwner.root,entryPoints:['entry.mjs'],bundle:true,write:false,format:'esm',loader:{'.txt':'text'},metafile:true});
 const rows=Object.keys(built.metafile.inputs).map(input=>observeControlledWorkerInput(inputOwner.root,input));
 assert(rows.some(row=>row.input==='payload.txt?raw'&&row.path==='payload.txt'&&row.sha256===digest(readFileSync(path.join(inputOwner.root,'payload.txt')))));
 assert(rows.some(row=>row.input==='entry.mjs'&&row.path==='entry.mjs'));
 assert(rows.some(row=>row.input==='module.mjs?raw'&&row.path==='module.mjs'&&row.sha256===digest(readFileSync(path.join(inputOwner.root,'module.mjs')))));
 for(const input of ['../payload.txt','/payload.txt','payload.txt?other','payload.txt?other.txt?raw','payload.txt#raw'])assert.throws(()=>observeControlledWorkerInput(inputOwner.root,input),/ERR_CONTROLLED_WORKER_INPUT/);
 symlinkSync('payload.txt',path.join(inputOwner.root,'link.txt'));assert.throws(()=>observeControlledWorkerInput(inputOwner.root,'link.txt'),/ERR_CONTROLLED_WORKER_INPUT/);
 findings.push('actual pinned esbuild raw-text input keeps its identifier and exact physical bytes; unsupported suffix/outside/symlink inputs refuse');
}finally{
 settleCanonicalTestResourceUse(inputOwner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
 assert(cleanupCanonicalTestResources([inputOwner]).every(value=>value.completed));
}
const repositoryRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const actualBundle=await bundleWebPlanning(path.join(repositoryRoot,'scripts/web-planning-local-ingress.ts'));
const actualInputs=actualBundle.inputs.map(input=>{
 try{return observeControlledWorkerInput(repositoryRoot,input);}
 catch(error){console.error(JSON.stringify({worker_input_binding_failure:{input,code:error.code??null}}));throw error;}
});
assert(actualInputs.some(row=>row.input.endsWith('.txt?raw')));
assert(actualInputs.length>0&&new Set(actualInputs.map(row=>row.input)).size===actualInputs.length);
findings.push('complete actual Worker input inventory resolves and binds before any Worker/session/request comparison');
const imported=[];let actualRequestBytes;
const hook=registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);imported.push(url);return result;}});
try{actualRequestBytes=(await import('../apps/web_planning/src/contract.ts')).REQUEST_BYTES;assert(Number.isSafeInteger(actualRequestBytes)&&actualRequestBytes>=CONTROLLED_UPLOAD_CHUNK_BYTES);}
finally{hook.deregister();}
assert(imported.some(url=>url.includes('/apps/web_planning/src/contract.ts')));
findings.push('observational registerHooks delegates the actual TSX import unchanged and observes its project-source URL');
const selected=(url,init)=>selectControlledUpload(url,init,{origin:'http://127.0.0.1:1234',requestBytes:limit});
const target='http://127.0.0.1:1234/api/drafts',input={method:'POST',headers,body:payload,duplex:'half'};
assert.equal(selected(target,input).payload_sha256,digest(payload));
for(const [url,init]of [
 [target,{...input,method:'GET'}],[target+'?other=1',input],[target.replace('/drafts','/other'),input],
 [target.replace('1234','1235'),input],[target,{...input,body:undefined}],
 [target,{...input,headers:{}}],[target,{...input,headers:{'content-length':String(limit)}}],
])assert.equal(selected(url,init),null);
const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1]));controller.close();}});
assert.equal(selected(target,{...input,headers:{'content-type':'application/json'},body:stream}),null);
assert.equal(stream.locked,false);await stream.cancel();
assert.throws(()=>selected(target,{...input,body:new ReadableStream()}),/ERR_CONTROLLED_UPLOAD_BODY_TYPE/);
assert.throws(()=>selected(target,{...input,body:'short'}),/ERR_CONTROLLED_UPLOAD_LENGTH/);
const text='한🙂'.repeat(limit/4),textBytes=new TextEncoder().encode(text);
assert.equal(selected(target,{...input,headers:{'content-length':String(textBytes.byteLength)},body:text}).payload_sha256,digest(textBytes));
findings.push('stable URL/method/declared-length/body selection; unknown-length stream is untouched; unsupported or length-corrupt selected bodies refuse');

async function fixture(work) {
 const sockets=new Set();let handler=(req,res)=>{req.resume();res.writeHead(500).end();};
 const server=http.createServer((req,res)=>handler(req,res));
 server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`,adapter={origin,mf:{dispatchFetch:fetch}};
 let scheduler;
 try{await work({origin,adapter,setHandler(value){handler=value;},install(options={}){scheduler=installControlledUpload(adapter,{requestBytes:limit,...options});return scheduler;}});}
 finally{scheduler?.close();const closed=once(server,'close');server.close();for(const socket of sockets)socket.destroy();await closed;assert.equal(server.listening,false);}
}

await fixture(async({origin,adapter,setHandler,install})=>{
 const scheduler=install(),received=[],observedHeaders={};let unrelatedChecked=false,ended=false,receivedBytes=0,probeStarted=false,controlFailure=null;
 setHandler((request,response)=>{
  if(request.headers['content-length']==='3'){request.resume();response.writeHead(413,{'content-type':'application/json'}).end('{"unrelated":true}');return;}
  Object.assign(observedHeaders,request.headers);
  request.on('data',chunk=>{
   received.push(chunk);receivedBytes+=chunk.length;
   if(!probeStarted){
    if(receivedBytes>CONTROLLED_UPLOAD_CHUNK_BYTES){controlFailure=new Error('scheduled stream exceeded first boundary before correlated headers');response.destroy();return;}
    if(receivedBytes<CONTROLLED_UPLOAD_CHUNK_BYTES)return;
    probeStarted=true;void(async()=>{
    try{
     const unrelated=await fetch(origin+'/api/drafts',{method:'POST',headers:{'content-length':'3'},body:'abc'});assert.equal(unrelated.status,413);await unrelated.json();
     const [pending]=scheduler.snapshot();assert.equal(pending.released,false);assert.equal(pending.enqueued_bytes,CONTROLLED_UPLOAD_CHUNK_BYTES);unrelatedChecked=true;
     response.writeHead(413,{'content-type':'application/json'});response.flushHeaders();
    }catch(error){controlFailure=error;response.destroy();}
   })();
   }
  });
  request.on('end',()=>{ended=true;response.end('{"error":"request_too_large"}');});
 });
 let response;try{response=await adapter.mf.dispatchFetch(origin+'/api/drafts',input);}catch(error){throw controlFailure??error;}
 assert.equal(response.status,413);assert.deepEqual(await response.json(),{error:'request_too_large'});
 const [record]=scheduler.snapshot();assert.equal(unrelatedChecked,true);assert.equal(ended,true);
 assert.equal(digest(Buffer.concat(received)),digest(payload));
 for(const [name,value]of Object.entries(headers))assert.equal(observedHeaders[name],value);
 assert.equal(record.correlated_requests,1);assert.equal(record.matching_413_headers,1);assert.equal(record.released,true);
 assert.equal(record.enqueued_bytes,payload.byteLength);assert.equal(record.stream_closed,true);assert.equal(record.harness_error,null);
 findings.push('actual pinned Undici request identity gates on its own413; unrelated same-path413 does not release; real bytes and relevant headers preserved');
});

await fixture(async({origin,adapter,setHandler,install})=>{
 const scheduler=install(),controller=new AbortController();
 setHandler(request=>{request.once('data',()=>controller.abort(new Error('synthetic cancellation')));request.resume();});
 await assert.rejects(adapter.mf.dispatchFetch(origin+'/api/drafts',{...input,signal:controller.signal}),/synthetic cancellation|abort/i);
 const [record]=scheduler.snapshot();assert.equal(record.released,false);assert.equal(record.matching_413_headers,0);
 findings.push('actual selected dispatch cancellation refuses without fabricating413 or successful body consumption');
});

await fixture(async({origin,adapter,setHandler,install})=>{
 const scheduler=install({gateTimeoutMs:50});setHandler(request=>request.resume());
 await assert.rejects(adapter.mf.dispatchFetch(origin+'/api/drafts',input));
 const [record]=scheduler.snapshot();assert.equal(record.released,false);assert.equal(record.harness_error.code,'ERR_CONTROLLED_UPLOAD_RESPONSE_TIMEOUT');
 findings.push('missing correlated413 is a bounded harness timeout, explicitly distinct from transportRED');
});
console.log(JSON.stringify({controlled_upload_controls:findings,actual_request_bytes:actualRequestBytes,cleanup_complete:true,prospective_comparison:false}));
