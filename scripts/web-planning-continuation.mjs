// Development-only composition of existing Web Planning and ownership APIs.
import { spawn } from 'node:child_process';
import net from 'node:net';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP } from './web-planning-cdp.mjs';
import { startLocal, availablePort, fixtureScope } from './web-planning-local-runtime.mjs';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from './test-harness-process-lifecycle.mjs';
import { validateFileExport, FILE_LIMIT } from '../apps/web_planning/src/files.ts';
import { canonical, hash, digestBytes, readRegular, requireValue, bundlePaths, loadSpec, validateCheckpoint, validateAssessment, checkpointMaterial, extractContextDom, contextFieldObservations, requireContextFields, requireCleanup } from './web-planning-continuation-contract.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const writeJson=(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const diagnostic=e=>({name:['Error','AssertionError','TypeError','SyntaxError'].includes(e?.name)?e.name:'unclassified',code:typeof e?.code==='string'&&/^[a-zA-Z0-9_.-]{1,80}$/.test(e.code)?e.code:null,check_id:e?.check_id??null});
const sink=()=>{let bytes=0;const digest=createHash('sha256');return {write(chunk){bytes+=Buffer.byteLength(chunk);digest.update(chunk);},record(){return {bytes,digest:'sha256:'+digest.copy().digest('hex')};}};};
// Test hooks inject faults/dependencies in local controls only; CLI/input data cannot set them.
export async function runDevelopmentChild(childFile,args,output,request={},allowUnsandboxed=false,hooks={}){
  await mkdir(output,{recursive:false});
  const started=new Date().toISOString(),stdout=sink(),stderr=sink(),logs=sink();
  let owner,result,value,primary,stage='root.allocate',primaryStage,childState='not-created',childPid=null,cleanup=[],fixture;
  const secondary=[];
  const fault=async at=>{stage=at;await hooks.fault?.(at,owner);};
  try{
    owner=createCanonicalTestResourceRoot('ag-suite-');
    await fault('root.allocated');
    for(const n of ['home','runtime-state']){await fault('prepare.'+n);await mkdir(path.join(owner.root,n));}
    await fault('request.prepare');const requestPath=path.join(owner.root,'request.json');await writeJson(requestPath,request);
    stage='child.run';childState='unresolved';
    result=await (hooks.runChild??runCanonicalChild)({suite:'web-planning-development',label:path.basename(childFile),command:process.execPath,args:['--import','tsx',childFile,...args,requestPath,output,...(allowUnsandboxed?['--allow-unsandboxed-synthetic-pilot']:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,onSpawn:pid=>{childPid=pid;},log:s=>logs.write(Buffer.from(s+'\n'))});
    if(result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0)childState='observed-settled';
    const failure=canonicalChildAcceptanceFailure(result,{requireNaturalExit:true});
    if(failure)throw Object.assign(new Error(failure),{code:'development_child_failed'});
    stage='result.read';value=JSON.parse(await readFile(path.join(output,'result.json'),'utf8'));
  }catch(e){primary=e;primaryStage=stage;}
  let qualified=false,withheld=null;
  if(owner){
    if(childState==='not-created')qualified=true;
    else{
      try{fixture=JSON.parse(await readFile(path.join(output,'cleanup.json'),'utf8'));requireCleanup(fixture);requireValue(fixture.complete===true,'fixture_report_incomplete');qualified=childState==='observed-settled';}
      catch(e){secondary.push({stage:'fixture.report',...diagnostic(e)});}
      if(!qualified)withheld=childState==='unresolved'?'child_settlement_unknown':'fixture_settlement_unproven';
    }
    if(qualified){
      try{cleanup=cleanupCanonicalTestResources([owner]);if(!cleanup.every(r=>r.completed))withheld='canonical_owner_cleanup_refused';}
      catch(e){secondary.push({stage:'root.cleanup',...diagnostic(e)});withheld='canonical_owner_cleanup_failed';}
    }
  }
  const removed=!!owner&&cleanup.length===1&&cleanup.every(r=>r.completed);
  const report={started_at:started,finished_at:new Date().toISOString(),primary_error:primary?{stage:primaryStage,...diagnostic(primary)}:null,secondary_errors:secondary,child:result??null,child_state:childState,child_pid:childPid,stream_capture_complete:childState!=='unresolved',root_state:owner?(removed?'removed':'retained'):'not-created',fixture_cleanup:!!fixture?.complete&&qualified,disposable_root_removed:removed,cleanup_failures:cleanup.flatMap(r=>r.failures),recovery:owner&&!removed?{...owner,child_state:childState,original_failure_stage:primaryStage??null,cleanup_withheld_reason:withheld??'cleanup_not_completed'}:null,stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),deciding_verification:false};
  if(!removed&&owner&&!primary){primary=Object.assign(new Error('resource_cleanup_incomplete'),{code:'resource_cleanup_incomplete'});primaryStage='root.cleanup';report.primary_error={stage:primaryStage,...diagnostic(primary)};}
  try{await (hooks.writeReport??writeJson)(path.join(output,'lifecycle.json'),report);}
  catch(e){secondary.push({stage:'lifecycle.report',...diagnostic(e)});if(!primary){primary=e;primaryStage='lifecycle.report';report.primary_error={stage:primaryStage,...diagnostic(e)};}}
  if(primary||secondary.length){
    const failure=Object.assign(new Error('development_child_failed',{cause:primary}),{code:'development_child_failed',report});
    // The thrown recovery report survives even when output reporting itself fails.
    throw failure;
  }
  return value;
}
export async function runOperation(operation,specFile,allowUnsandboxed=false){
  const {spec}=await loadSpec(operation,specFile),paths=await bundlePaths(spec.bundle,operation);
  if(operation==='read')requireValue(!existsSync(paths.checkpoint),'checkpoint_would_overwrite');
  else {const c=JSON.parse(await readRegular(paths.checkpoint,300000));validateCheckpoint(c,spec.expected,paths.bundle_binding);validateAssessment(JSON.parse(await readRegular(spec.assessment_file,FILE_LIMIT)),c);}
  const result=await runDevelopmentChild(fileURLToPath(import.meta.url),['--child',operation],paths.output,spec,allowUnsandboxed);
  if(operation==='read'){
    const draft=JSON.parse(await readFile(path.join(paths.output,'checkpoint-draft.json'),'utf8'));
    const c={...draft,complete:true,cleanup:{complete:true,fixture:'read/cleanup.json',parent:'read/lifecycle.json'}};
    await writeJson(paths.checkpoint,c);return c;
  }
  return result;
}
export async function bounded(fn,label,ms=15000,{cancel,settleMs=16000,clock=globalThis}={}){
  const controller=new AbortController();let timer,settleTimer;
  const deadline=Object.assign(new Error('development_deadline'),{code:'development_deadline',check_id:label});
  const operation=Promise.resolve().then(()=>fn(controller.signal)).then(value=>({value}),error=>({error}));
  try{
    const expired=new Promise(resolve=>{timer=clock.setTimeout(()=>{controller.abort(deadline);resolve({expired:true});},ms);});
    const outcome=await Promise.race([operation,expired]);
    if(!outcome.expired&&!controller.signal.aborted){if(outcome.error)throw outcome.error;return outcome.value;}
    // Aborting is a request, not evidence of settlement. Join the operation and
    // optional cancellation; a bounded failure records unresolved ownership.
    const cancellation=Promise.resolve().then(()=>cancel?.()).then(()=>null,error=>error);
    const settled=await Promise.race([Promise.all([operation,cancellation]),new Promise(resolve=>{settleTimer=clock.setTimeout(()=>resolve(null),settleMs);})]);
    deadline.settlement=settled?'observed-settled':'unresolved';
    if(settled?.[1])deadline.cancellation_error=diagnostic(settled[1]);
    throw deadline;
  }finally{clock.clearTimeout(timer);clock.clearTimeout(settleTimer);}
}
export async function wait(fn,label,{ms=15000,intervalMs=80,...options}={}){
  return bounded(async signal=>{
    while(true){
      signal.throwIfAborted();const ready=await fn(signal);signal.throwIfAborted();if(ready)return;
      await new Promise((resolve,reject)=>{
        const clock=options.clock??globalThis;
        const abort=()=>{clock.clearTimeout(timer);signal.removeEventListener('abort',abort);reject(signal.reason);};
        const timer=clock.setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},intervalMs);
        signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
      });
    }
  },label,ms,options);
}
export const click=(c,id)=>c.eval(`document.getElementById(${JSON.stringify(id)}).click()`);
export const set=(c,id,value)=>c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
export const settled=c=>wait(()=>c.eval('typeof busy===\'boolean\'&&!busy'),'client.settled');
export async function selectFiles(c,files,selector='#work-files'){const {root}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:root.nodeId,selector});await c.send('DOM.setFileInputFiles',{nodeId,files});}
export async function ordinarySave(c,revision,progress){await click(c,'save');await wait(()=>c.eval(`saved?.revision===${revision}||!$('uncertain').hidden||!$('conflict').hidden`),'save.outcome');
  if(await c.eval("!$('uncertain').hidden")){progress.unknown_resolutions++;await settled(c);await click(c,'resolve-save');}
  await wait(()=>c.eval(`saved?.revision===${revision}&&!busy`),'save.acknowledged');progress.accepted_save=true;return c.eval('saved');}
export async function listenerClosed(port,{ms=3000,settleMs=3000,socketFactory=()=>new net.Socket(),clock=globalThis}={}){
  return bounded(signal=>new Promise((resolve,reject)=>{
    const socket=socketFactory();let answer,error;
    const abort=()=>{error=signal.reason;socket.destroy();};
    socket.once('connect',()=>{answer=false;socket.destroy();});
    socket.once('error',e=>{if(e.code==='ECONNREFUSED')answer=true;else error=e;socket.destroy();});
    socket.once('close',()=>{signal.removeEventListener('abort',abort);error?reject(error):resolve(answer===true);});
    signal.addEventListener('abort',abort,{once:true});
    try{if(signal.aborted)abort();else socket.connect(port,'127.0.0.1');}catch(e){error=e;socket.destroy();}
  }),'cleanup.debug-listener',ms,{settleMs,clock});
}
export async function withDevelopmentFixture(output,allowUnsandboxed,fn,hooks={}){
  const root=hooks.root??process.env.AUGNES_CANONICAL_TEMP_ROOT;requireValue(root,'owned_root_required');const owned=new Set();let local,browser,c,debug,error,value,external=0,exceptions=0,stage='worker.initialize',primaryStage;
  const resources={worker:'not-created',browser:'not-created',listener:'not-created',cdp:'not-created',operations:'not-created'};
  const traffic=[],cleanupFailures=[];
  try{
    resources.worker='unresolved';local=await (hooks.startLocal??startLocal)({root:path.join(root,'runtime')});
    stage='browser.port';debug=await (hooks.availablePort??availablePort)();
    const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].find(x=>x&&existsSync(x));requireValue(chrome,'browser_unavailable');
    stage='browser.spawn';resources.browser='unresolved';resources.listener='unresolved';
    const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(allowUnsandboxed?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,'profile')}`,'about:blank'],{stdio:'ignore',detached:true});browser=registerOwnedChild(owned,child,{label:'web-planning-development-browser'});
    stage='browser.ready';resources.operations='unresolved';
    await wait(async signal=>{if(browser.exited)throw Object.assign(new Error('browser_failed'),{code:'browser_failed'});try{const response=await fetch(`http://127.0.0.1:${debug}/json/version`,{signal});await response.arrayBuffer();return response.ok;}catch(e){if(e.cause?.code==='ECONNREFUSED')return false;throw e;}},'browser.ready');
    const target=await bounded(async signal=>(await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT',signal})).json(),'browser.new-target');
    stage='browser.cdp-open';resources.cdp='unresolved';c=new CDP(target.webSocketDebuggerUrl);await bounded(()=>c.open(),'browser.cdp-open',15000,{cancel:()=>c.ws.close()});
    await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');
    c.handlers.push(m=>{if(m.method==='Runtime.exceptionThrown')exceptions++;if(m.method==='Network.requestWillBeSent'&&m.params.request.url.startsWith(local.origin+'/api/'))traffic.push({method:m.params.request.method,path:new URL(m.params.request.url).pathname});if(m.method==='Fetch.requestPaused'){const p=m.params,allowed=p.request.url.startsWith(local.origin+'/');if(!allowed)external++;c.send(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:p.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})}).catch(()=>{exceptions++;});}});
    await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    const login=async()=>{await c.send('Page.navigate',{url:local.origin+'/_local/login'});await wait(()=>c.eval("location.pathname==='/_local/login'&&!!document.querySelector('form[method=post] button')"),'login.form');await c.eval("document.querySelector('form button').click()");await wait(()=>c.eval(`location.href===${JSON.stringify(local.origin+'/')}&&document.readyState==='complete'&&typeof busy==='boolean'&&!busy&&typeof run==='function'&&$('list-state').textContent==='No saved work yet.'&&document.querySelector('meta[name=workspace]').content===${JSON.stringify(fixtureScope.workspace_id)}&&document.querySelector('meta[name=project]').content===${JSON.stringify(fixtureScope.project_id)}&&!$('new-work').disabled`),'login.loaded-empty-list');};
    stage='operation';value=await fn({c,local,root,login,traffic});resources.operations='observed-settled';requireValue(external===0&&local.externalRequests()===0&&exceptions===0,'unexpected_browser_or_external_activity');
  }catch(e){error=e;primaryStage=stage;if(resources.operations==='unresolved'&&e.settlement!=='unresolved')resources.operations='observed-settled';}
  finally{
    const started_at=new Date().toISOString();const attempt=async(name,f)=>{try{return await f();}catch(e){cleanupFailures.push({check_id:name,...diagnostic(e)});return false;}};
    if(c){
      c.handlers.length=0;
      const closed=await attempt('cleanup.cdp',async()=>{if(c.ws.readyState!==WebSocket.CLOSED)await bounded(()=>c.close(),'cleanup.cdp',3000,{cancel:()=>c.ws.close(),settleMs:3000});return c.ws.readyState===WebSocket.CLOSED;});
      if(closed)resources.cdp='observed-settled';
    }
    if(browser){await attempt('cleanup.browser',()=>terminateOwnedProcessTree(browser));if(browser.exited&&browser.closed)resources.browser='observed-settled';}
    const workerDisposed=local?await attempt('cleanup.worker',async()=>{await local.close();return true;}):null;
    if(workerDisposed)resources.worker='observed-settled';
    const debugClosed=resources.listener!=='not-created'?await attempt('cleanup.debug-listener',()=>listenerClosed(debug)):null;
    if(debugClosed)resources.listener='observed-settled';
    const report={started_at,finished_at:new Date().toISOString(),resources,worker_disposed:workerDisposed,browser_exit_observed:browser?.exited??null,browser_streams_closed:browser?.closed??null,debug_listener_closed:debugClosed,cdp_closed:c?c.ws.readyState===WebSocket.CLOSED:null,owned_browser_records:owned.size,failures:cleanupFailures,primary_error:error?{stage:primaryStage,...diagnostic(error),settlement:error.settlement??null}:null,operation_succeeded:!error,recovery:{root,worker_root:path.join(root,'runtime'),browser_pid:browser?.pid??null,debug_port:debug??null},additional_process_observation:'not collected; registry/owned exit and listener evidence are not arbitrary descendant absence',traffic};
    try{requireCleanup(report);report.complete=true;}catch(e){report.complete=false;if(!error){error=e;primaryStage='fixture.cleanup';}}
    try{await (hooks.writeReport??writeJson)(path.join(output,'cleanup.json'),report);}
    catch(e){cleanupFailures.push({stage:'fixture.report',...diagnostic(e)});report.complete=false;if(!error){error=e;primaryStage='fixture.report';}}
    if(error){error.fixture_report=report;error.failure_stage=primaryStage;}
  }
  if(error)throw error;return value;
}
export async function readAuthenticatedContext(c,current,chain,input,output,bundle_binding,bundle_id){
  await click(c,'saved-context');await settled(c);const dom=await c.eval(`(${extractContextDom.toString()})(document.getElementById('context-view'))`),fields=contextFieldObservations(dom,current);
  await writeJson(path.join(output,'fields.json'),{fields,disclosures:dom.disclosures});requireContextFields(fields);
  const material=checkpointMaterial(input,current,dom,chain);return {format:'web_planning_development_checkpoint.v1',complete:false,observed_at:new Date().toISOString(),bundle_binding,bundle_id,material,binding_hash:hash(canonical(material)),provenance:{current:'authenticated structured history',authenticated_dom:'authenticated Saved-context DOM after opening disclosures'},attachment_body_reads:[],verified_fields:fields.length};
}
async function childOperation(operation,requestFile,output,allowUnsandboxed){
  const {spec,admitted}=await loadSpec(operation,requestFile);requireValue(output===path.join(spec.bundle,operation),'child_output_bundle_mismatch');const bundle_binding=hash(path.resolve(spec.bundle));
  const progress={reconstruction_accepted:false,accepted_save:false,unknown_resolutions:0};let check='input.admission';
  try{
    const result=await withDevelopmentFixture(output,allowUnsandboxed,async({c,local,root,login,traffic})=>{
      await login();await selectFiles(c,[spec.input_export],'#import-file');await click(c,'import');await wait(()=>c.eval(`saved?.revision===${spec.expected.revision}&&!busy`),'reconstruction.accepted');progress.reconstruction_accepted=true;
      const history=await c.eval("api('/api/work/'+work+'/history')");check='history.input-equality';requireValue(canonical(history.revisions)===canonical(admitted.chain),check);const current=history.revisions.at(-1);
      let prior;if(operation==='save'){prior=validateCheckpoint(JSON.parse(await readRegular(path.join(spec.bundle,'checkpoint.json'),300000)),spec.expected,bundle_binding);}
      const checkpoint=await readAuthenticatedContext(c,current,history.revisions,spec.expected,output,bundle_binding,prior?.bundle_id??randomUUID());
      if(operation==='read'){await writeJson(path.join(output,'checkpoint-draft.json'),checkpoint);return {operation,checkpoint_hash:checkpoint.binding_hash,observed_at:checkpoint.observed_at};}
      check='save.stable-binding';requireValue(checkpoint.binding_hash===prior.binding_hash,check);
      const assessmentBytes=await readRegular(spec.assessment_file,FILE_LIMIT),assessment=validateAssessment(JSON.parse(assessmentBytes),prior);const name=path.basename(spec.assessment_file);
      requireValue(!current.files.some(f=>f.name===name),'assessment_name_conflict');const selected=path.join(root,'selected');await mkdir(selected);const retained=path.join(selected,name);await writeFile(retained,assessmentBytes,{flag:'wx'});
      await selectFiles(c,[retained]);await settled(c);await wait(()=>c.eval(`selectedFiles.length===${current.files.length+1}`),'save.selected-assessment');await c.eval(`(()=>{const e=$('file-role-${current.files.length}');e.value='results';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await click(c,'check-capacity');await wait(()=>c.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'save.capacity');check='save.original-outcome';const successor=await ordinarySave(c,current.revision+1,progress);
      check='save.preserved-selection';requireValue(canonical(successor.definition)===canonical(current.definition)&&canonical(successor.sources)===canonical(current.sources)&&canonical(successor.relations)===canonical(current.relations)&&canonical(successor.files.slice(0,-1))===canonical(current.files),check);
      const finalHistory=await c.eval("api('/api/work/'+work+'/history')");requireValue(canonical(finalHistory.revisions)===canonical([...admitted.chain,successor]),'save.history');
      await click(c,'saved-context');await settled(c);const metadata=await c.eval(`(()=>{const b=[...document.querySelectorAll('#context-view [data-file-url]')].find(b=>b.dataset.fileName===${JSON.stringify(name)});return b?{url:b.dataset.fileUrl,digest:b.dataset.fileDigest,bytes:Number(b.dataset.fileBytes)}:null;})()`);
      requireValue(metadata?.digest===digestBytes(assessmentBytes)&&metadata.bytes===assessmentBytes.length,'download.assessment-identity');
      // Same authenticated request owner as the product Download control, without
      // browser attachment navigation or interpreting the downloaded JSON as code.
      const downloaded=await c.eval(`(async()=>{const r=await request(${JSON.stringify(metadata.url)});const b=new Uint8Array(await r.arrayBuffer());return [...b];})()`);requireValue(Buffer.from(downloaded).equals(assessmentBytes),'download.assessment-bytes');
      const exported=await c.eval("api('/api/work/'+work+'/export')"),validated=validateFileExport(fixtureScope,exported);requireValue(canonical(validated.chain)===canonical(finalHistory.revisions),'export.history');for(const b of admitted.bodies)requireValue(canonical(validated.bodies.find(x=>x.digest===b.digest))===canonical(b),'export.original-body');
      const exportBytes=Buffer.from(JSON.stringify(exported)+'\n');await writeFile(path.join(output,'planning-work.json'),exportBytes,{flag:'wx'});
      const result={operation,work_id:successor.work_id,revision:successor.revision,fingerprint:successor.fingerprint,checkpoint_hash:prior.binding_hash,assessment:{name,bytes:assessmentBytes.length,digest:digestBytes(assessmentBytes),authenticated_download_equal:true,synthetic:assessment.exposure_limits.synthetic},export:{bytes:exportBytes.length,digest:digestBytes(exportBytes),fingerprint:exported.fingerprint},original_history_and_selections_preserved:true,progress,authored_save_requests:traffic.filter(x=>x.path.endsWith('/save')).length};
      await writeJson(path.join(output,'manifest.json'),{scope:fixtureScope,revisions:validated.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),selected_files:successor.files,...result});return result;
    });await writeJson(path.join(output,'result.json'),result);
  }catch(e){const failure={operation,check,progress,diagnostic:diagnostic(e),fixture_report:e.fixture_report??null,checkpoint_complete:false,reporting_errors:[]};try{await writeJson(path.join(output,'failure.json'),failure);}catch(reportError){failure.reporting_errors.push(diagnostic(reportError));}throw Object.assign(new Error('development_operation_failed',{cause:e}),{code:'development_operation_failed',report:failure});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),child=args[0]==='--child';if(child)args.shift();const operation=args.shift();requireValue(['read','save'].includes(operation),'operation');
  const allowUnsandboxed=args.at(-1)==='--allow-unsandboxed-synthetic-pilot';if(allowUnsandboxed)args.pop();
  requireValue(args.length===(child?2:1),'arguments');
  if(child)await childOperation(operation,args[0],args[1],allowUnsandboxed);else console.log(JSON.stringify(await runOperation(operation,args[0],allowUnsandboxed)));
}
