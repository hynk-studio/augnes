import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// One common candidate driver. The collector separately attributes the two
// implicated modules to predecessor/final bytes; this driver has no role branch.
const repositoryRoot=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const loaded=new Map();
function observeSource(url) {
 if(!url.startsWith('file:'))return;
 const file=fileURLToPath(url),relative=path.relative(repositoryRoot,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).includes('node_modules'))return;
 if(loaded.size>=512&&!loaded.has(relative))throw new Error('common_driver_import_bound');
 const bytes=readFileSync(file);loaded.set(relative,{path:relative,byte_size:bytes.length,sha256:digest(bytes)});
}
observeSource(import.meta.url);
const hook=registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);observeSource(url);return result;}});
const started=performance.now(),checkpoints=[],cleanupErrors=[];let events=0,server,scheduler,owner,resources;
let importsComplete=false,assertionsComplete=false,primary=null,primaryStage=null,firstFailure=null,firstTransportError=null,stage='imports',bundle=null,workerInputs=[];
const emit=(event,data={})=>{
 if(++events>256)throw new Error('common_driver_event_bound');
 console.log('AUGNES_COMMON_DRIVER_EVENT '+JSON.stringify({event,sequence:events,elapsed_ms:Math.round((performance.now()-started)*1000)/1000,...data}));
};
let errorValue=error=>({name:String(error?.name??'Error'),code:error?.code??null,message:String(error?.message??error).slice(0,512)});
try{
 const control=await import('./web-planning-controlled-upload.mjs');errorValue=control.controlledUploadError;
 resources=await import('./canonical-test-environment.mjs');
 const {REQUEST_BYTES}=await import('../apps/web_planning/src/contract.ts');
 const {startLocal}=await import('./web-planning-local-runtime.mjs');
 const {bundleWebPlanning}=await import('./build-web-planning.mjs');
 const {checkRequestBodies}=await import('./web-planning-request-checks.mjs');
 importsComplete=true;stage='setup';
 const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw new Error('common_driver_owned_root_required');
 const canonicalRoot=realpathSync(root);owner=resources.createCanonicalTestResourceRoot('ag-resource-test-');
 if(!owner.root.startsWith(canonicalRoot+path.sep))throw new Error('common_driver_resource_containment');
 resources.beginCanonicalTestResourceUse(owner);
 const built=await bundleWebPlanning(path.join(repositoryRoot,'scripts/web-planning-local-ingress.ts'));
 workerInputs=built.inputs.map(input=>{
  const file=path.resolve(input),relative=path.relative(repositoryRoot,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)||realpathSync(file)!==file)throw new Error('common_driver_worker_input_outside');
  const bytes=readFileSync(file);return {path:relative,byte_size:bytes.length,sha256:digest(bytes)};
 }).sort((a,b)=>a.path.localeCompare(b.path));
 server=await startLocal({root:owner.root,code:built.code,handleStructuredLogs:log=>{
  if(!log||typeof log!=='object'||Array.isArray(log)||typeof log.level!=='string'||typeof log.message!=='string'||typeof log.timestamp!=='number')
   throw new Error('common_driver_structured_log_contract');
  // Only type/size metadata; never raw Worker messages or request payloads.
  emit('runtime_log',{level:log.level,message_bytes:Buffer.byteLength(log.message)});
 }});
 bundle={bytes:Buffer.byteLength(server.code),sha256:digest(server.code)};
 stage='session';
 const cookie=`web_planning_local=${server.env.LOCAL_SESSION}`;
 const entry=await server.mf.dispatchFetch(server.origin+'/',{headers:{cookie}});assert.equal(entry.status,200);
 const html=await entry.text(),csrf=html.match(/name="csrf-token" content="([^"]+)"/)?.[1];assert.equal(typeof csrf,'string');
 const client={csrf,cookies:cookie+'; '+entry.headers.get('set-cookie').split(';')[0]};
 scheduler=control.installControlledUpload(server,{requestBytes:REQUEST_BYTES,onEvent(event,data){
  if(event==='selected_transport_error')firstTransportError??=data.error;
  if(event==='dispatch_error')firstFailure??={stage:'dispatch',selected:data.selected,error:data.error};
  if(event==='response_body_error')firstFailure??={stage:'response_body',selected:data.selected,status:data.status,error:data.error};
  emit(event,data);
 }});
 stage='request_checks';
 await checkRequestBodies({server,client,passed:name=>{checkpoints.push(name);emit('checkpoint',{name});}});
 assertionsComplete=true;emit('assertions_complete');
}catch(error){primary=error;primaryStage=firstFailure?.stage??stage;emit('first_error_before_disposal',{stage:primaryStage,selected:firstFailure?.selected??false,error:errorValue(error)});}
finally{
 stage='cleanup';
 try{scheduler?.close();}catch(error){cleanupErrors.push(errorValue(error));}
 try{await server?.close();}catch(error){cleanupErrors.push(errorValue(error));}
 if(owner){
  try{
   if(cleanupErrors.length===0)resources.settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
   const [cleanup]=resources.cleanupCanonicalTestResources([owner]);
   if(!cleanup.completed)cleanupErrors.push({name:'Error',code:'common_driver_resource_cleanup',message:JSON.stringify(cleanup)});
  }catch(error){cleanupErrors.push(errorValue(error));}
 }
 hook.deregister();
}
const result={contract:'augnes.common-request-transport-observation.v1',imports_complete:importsComplete,assertions_complete:assertionsComplete,
 cleanup_complete:cleanupErrors.length===0,primary_error_stage:primaryStage,
 primary_error:primary?errorValue(primary):null,primary_selected:firstFailure?.selected??false,primary_response_status:firstFailure?.status??null,
 first_transport_error:firstTransportError,cleanup_errors:cleanupErrors,checkpoints,selected_uploads:scheduler?.snapshot()??[],
 imports_scope:'Node-loaded project source only; compiled Worker sources remain bound by the effective source catalogue',
 actual_imports:[...loaded.values()].sort((a,b)=>a.path.localeCompare(b.path)),worker_bundle:bundle,worker_inputs:workerInputs,
 resource:owner??null,controlled_condition:'A body-bearing declared oversized local POST is converted to a stream: first65536 bytes, remainder after that exact Undici request emits413headers. This is not historical request reconstruction.'};
console.log('AUGNES_COMMON_DRIVER_RESULT '+JSON.stringify(result));
if(primary)throw primary;
if(cleanupErrors.length)throw new AggregateError(cleanupErrors.map(value=>Object.assign(new Error(value.message),value)),'common driver cleanup failed');
