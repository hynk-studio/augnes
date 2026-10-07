// Development-only composition of existing Web Planning and ownership APIs.
import { spawn } from 'node:child_process';
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
const sink=()=>{let bytes=0;const digest=createHash('sha256');return {write(chunk){bytes+=Buffer.byteLength(chunk);digest.update(chunk);},record(){return {bytes,digest:'sha256:'+digest.digest('hex')};}};};
export async function runDevelopmentChild(childFile,args,output,request={},allowUnsandboxed=false){
  await mkdir(output,{recursive:false});const started=new Date().toISOString(),owner=createCanonicalTestResourceRoot('ag-suite-');
  for(const n of ['home','runtime-state'])await mkdir(path.join(owner.root,n));const requestPath=path.join(owner.root,'request.json');await writeJson(requestPath,request);
  const stdout=sink(),stderr=sink(),logs=sink();let result,error,cleanup;
  try{result=await runCanonicalChild({suite:'web-planning-development',label:path.basename(childFile),command:process.execPath,args:['--import','tsx',childFile,...args,requestPath,output,...(allowUnsandboxed?['--allow-unsandboxed-synthetic-pilot']:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,log:s=>logs.write(Buffer.from(s+'\n'))});error=canonicalChildAcceptanceFailure(result,{requireNaturalExit:true});}
  catch(e){error=e;}
  finally{let fixture,qualified=false;try{fixture=JSON.parse(await readFile(path.join(output,'cleanup.json'),'utf8'));requireCleanup(fixture);qualified=fixture.complete===true;}catch(e){error??=e;}
    cleanup=qualified?cleanupCanonicalTestResources([owner]):[];
    await writeJson(path.join(output,'lifecycle.json'),{started_at:started,finished_at:new Date().toISOString(),child:result??null,diagnostic:error instanceof Error?diagnostic(error):error??null,fixture_cleanup:qualified,disposable_root_removed:qualified&&cleanup.every(r=>r.completed),cleanup_failures:cleanup.flatMap(r=>r.failures),stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),deciding_verification:false});
  }
  requireValue(cleanup.length>0&&cleanup.every(r=>r.completed),'resource_cleanup_incomplete');if(error)throw Object.assign(new Error('development_child_failed'),{code:'development_child_failed'});
  return JSON.parse(await readFile(path.join(output,'result.json'),'utf8'));
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
export async function bounded(fn,label,ms=15000){let timer;try{return await Promise.race([fn(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('development_deadline'),{code:'development_deadline',check_id:label})),ms);})]);}finally{clearTimeout(timer);}}
export async function wait(fn,label){return bounded(async()=>{while(!(await fn()))await new Promise(r=>setTimeout(r,80));},label);}
export const click=(c,id)=>c.eval(`document.getElementById(${JSON.stringify(id)}).click()`);
export const set=(c,id,value)=>c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
export const settled=c=>wait(()=>c.eval('typeof busy===\'boolean\'&&!busy'),'client.settled');
export async function selectFiles(c,files,selector='#work-files'){const {root}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:root.nodeId,selector});await c.send('DOM.setFileInputFiles',{nodeId,files});}
export async function ordinarySave(c,revision,progress){await click(c,'save');await wait(()=>c.eval(`saved?.revision===${revision}||!$('uncertain').hidden||!$('conflict').hidden`),'save.outcome');
  if(await c.eval("!$('uncertain').hidden")){progress.unknown_resolutions++;await settled(c);await click(c,'resolve-save');}
  await wait(()=>c.eval(`saved?.revision===${revision}&&!busy`),'save.acknowledged');progress.accepted_save=true;return c.eval('saved');}
async function listenerClosed(port){return bounded(()=>new Promise((resolve,reject)=>{import('node:net').then(({default:net})=>{const s=net.connect(port,'127.0.0.1');s.once('connect',()=>{s.destroy();resolve(false);});s.once('error',e=>{s.destroy();e.code==='ECONNREFUSED'?resolve(true):reject(e);});});}),'cleanup.debug-listener',3000);}
export async function withDevelopmentFixture(output,allowUnsandboxed,fn){
  const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;requireValue(root,'owned_root_required');const owned=new Set();let local,browser,c,debug,error,value,external=0,exceptions=0;
  const traffic=[],cleanupFailures=[];
  try{
    local=await startLocal({root:path.join(root,'runtime')});debug=await availablePort();
    const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].find(x=>x&&existsSync(x));requireValue(chrome,'browser_unavailable');
    const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(allowUnsandboxed?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,'profile')}`,'about:blank'],{stdio:'ignore',detached:true});browser=registerOwnedChild(owned,child,{label:'web-planning-development-browser'});
    await wait(async()=>{if(browser.exited)throw Object.assign(new Error('browser_failed'),{code:'browser_failed'});try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch(e){if(e.cause?.code==='ECONNREFUSED')return false;throw e;}},'browser.ready');
    const target=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json();c=new CDP(target.webSocketDebuggerUrl);await bounded(()=>c.open(),'browser.cdp-open');
    await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');
    c.handlers.push(m=>{if(m.method==='Runtime.exceptionThrown')exceptions++;if(m.method==='Network.requestWillBeSent'&&m.params.request.url.startsWith(local.origin+'/api/'))traffic.push({method:m.params.request.method,path:new URL(m.params.request.url).pathname});if(m.method==='Fetch.requestPaused'){const p=m.params,allowed=p.request.url.startsWith(local.origin+'/');if(!allowed)external++;c.send(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:p.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})}).catch(()=>{exceptions++;});}});
    await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    const login=async()=>{await c.send('Page.navigate',{url:local.origin+'/_local/login'});await wait(()=>c.eval("location.pathname==='/_local/login'&&!!document.querySelector('form[method=post] button')"),'login.form');await c.eval("document.querySelector('form button').click()");await wait(()=>c.eval(`location.href===${JSON.stringify(local.origin+'/')}&&document.readyState==='complete'&&typeof busy==='boolean'&&!busy&&typeof run==='function'&&$('list-state').textContent==='No saved work yet.'&&document.querySelector('meta[name=workspace]').content===${JSON.stringify(fixtureScope.workspace_id)}&&document.querySelector('meta[name=project]').content===${JSON.stringify(fixtureScope.project_id)}&&!$('new-work').disabled`),'login.loaded-empty-list');};
    value=await fn({c,local,root,login,traffic});requireValue(external===0&&local.externalRequests()===0&&exceptions===0,'unexpected_browser_or_external_activity');
  }catch(e){error=e;}
  finally{
    const started_at=new Date().toISOString();const attempt=async(name,f)=>{try{return await f();}catch(e){cleanupFailures.push({check_id:name,...diagnostic(e)});return false;}};
    if(c)await attempt('cleanup.cdp',()=>bounded(()=>c.close(),'cleanup.cdp',3000));
    if(browser)await attempt('cleanup.browser',()=>terminateOwnedProcessTree(browser));
    const workerDisposed=local?await attempt('cleanup.worker',async()=>{await local.close();return true;}):false;
    const debugClosed=debug?await attempt('cleanup.debug-listener',()=>listenerClosed(debug)):false;
    const report={started_at,finished_at:new Date().toISOString(),worker_disposed:workerDisposed===true,browser_exit_observed:browser?.exited===true,browser_streams_closed:browser?.closed===true,debug_listener_closed:debugClosed===true,owned_browser_records:owned.size,failures:cleanupFailures,additional_process_observation:'not collected; registry/owned exit and listener evidence are not arbitrary descendant absence',traffic};
    try{requireCleanup(report);requireValue(cleanupFailures.length===0,'fixture_cleanup_failed');report.complete=true;}catch(e){report.complete=false;error??=e;}
    await writeJson(path.join(output,'cleanup.json'),report);
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
  }catch(e){await writeJson(path.join(output,'failure.json'),{operation,check,progress,diagnostic:diagnostic(e),checkpoint_complete:false});throw Object.assign(new Error('development_operation_failed'),{code:'development_operation_failed'});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),child=args[0]==='--child';if(child)args.shift();const operation=args.shift();requireValue(['read','save'].includes(operation),'operation');
  const allowUnsandboxed=args.at(-1)==='--allow-unsandboxed-synthetic-pilot';if(allowUnsandboxed)args.pop();
  requireValue(args.length===(child?2:1),'arguments');
  if(child)await childOperation(operation,args[0],args[1],allowUnsandboxed);else console.log(JSON.stringify(await runOperation(operation,args[0],allowUnsandboxed)));
}
