import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocal, availablePort, fixtureScope } from '../../web-planning-local-runtime.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from '../../test-harness-process-lifecycle.mjs';
import { validateFileExport } from '../../../apps/web_planning/src/files.ts';
import { pilotArguments, workspaceReadinessExpression } from './preparation.mjs';
import { safeError, portClosed, cleanupReport, processGroupsAbsent, capture, writeJson } from './pilot-evidence.mjs';

import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { unsandboxedPilotFlag } from './preparation.mjs';
async function readCommand(command,args) {
  let stdout='',stderr='';
  const result=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'helper read '+command,command,args,cwd:repo,env:process.env,timeoutMs:10000,
    stdout:{write(chunk){stdout+=chunk.toString();}},stderr:{write(chunk){stderr+=chunk.toString();}}});
  assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);assert.equal(stderr,'');return stdout;
}

// C1 only: two separate owned fixtures; no calculator or prescribed verdict.
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const base='4a1d2137d126247645f8598df842d9b5e2bbc61b';
const baseline='b73e5012c699f85a9e3b643b6cba82f8f195d3ce';
const sourceTree='5443ce03a9d193c03274379938fa1b391512ad25';
const inputHash='797fc35751add728b3b70914ddf8eac5fcfadb3bb4589ff0a956553504edde19';
const evidence=path.join(here,'c1-01');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
export const bindingHash=value=>'sha256:'+sha(Buffer.from(JSON.stringify(stable(value))));
export function validateJudgment(j,c){
  assert.equal(j.input_commit,base);assert.equal(j.input_export_sha256,inputHash);
  assert.equal(j.work_id,c.material.current.work_id);assert.equal(j.revision,4);
  assert.equal(j.fingerprint,c.material.current.fingerprint);assert.equal(j.checkpoint_hash,c.binding_hash);
  assert.equal(c.binding_hash,bindingHash(c.material));
  assert(['reuse','non-use','insufficient-context'].includes(j.conclusion));
  assert(Array.isArray(j.reasons)&&j.reasons.length&&j.reasons.every(x=>typeof x==='string'&&x.length));
  assert(Array.isArray(j.recovered_refs)&&j.recovered_refs.length);
  for(const ref of j.recovered_refs)assert(c.material.current.sources.some(s=>s.source_ref===ref));
  assert.equal(j.observed_at,c.observed_at);assert(Number.isFinite(Date.parse(j.authored_at))&&Date.parse(j.authored_at)>=Date.parse(c.observed_at));
  assert(j.attribution&&j.exposure_limits&&Array.isArray(j.uncertainties));
  return j;
}
async function parent(operation,output,options){
  assert(!existsSync(output),'Preserve the original operation.');await mkdir(output,{recursive:true});
  const started=new Date().toISOString();
  await writeJson(path.join(output,'execution-helper.json'),{operation,base,helper_commit:(await readCommand('git',['rev-parse','HEAD'])).trim(),helper_tree:(await readCommand('git',['rev-parse','HEAD^{tree}'])).trim(),helper_sha256:sha(await readFile(fileURLToPath(import.meta.url))),command:['node','--import','tsx',path.relative(repo,fileURLToPath(import.meta.url)),operation,path.relative(repo,output),...(options.unsandboxed?[unsandboxedPilotFlag]:[])],permissions:'per-command network permission requested; synthetic loopback only',unsandboxed_pilot_opt_in:options.unsandboxed});
  const owner=createCanonicalTestResourceRoot('ag-suite-');await mkdir(path.join(owner.root,'home'));await mkdir(path.join(owner.root,'runtime-state'));
  const stdout=capture(16384),stderr=capture(16384),logs=capture(16384);let result,error,pid,cleanup=[];
  try{result=await runCanonicalChild({suite:'cloud-reuse-pilot-01-C1',label:operation,command:process.execPath,args:['--import','tsx',fileURLToPath(import.meta.url),'--child',operation,output,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n')),onSpawn:value=>{pid=value;}});error=canonicalChildAcceptanceFailure(result,{requireNaturalExit:true});}catch(e){error=e;}
  finally{const independent=await processGroupsAbsent([pid]);let fixture;try{fixture=JSON.parse(await readFile(path.join(output,'fixture-cleanup.json'),'utf8'));}catch{}
    const safe=independent.available&&independent.known_groups_absent&&fixture?.independent_cleanup?.available&&fixture?.independent_cleanup?.known_groups_absent&&fixture?.failures?.length===0;
    if(safe)cleanup=cleanupCanonicalTestResources([owner]);
    await writeJson(path.join(output,'parent-output.json'),{stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),result,error:error instanceof Error?safeError(error):error??null});
    await writeJson(path.join(output,'lifecycle.json'),{operation,started_at:started,finished_at:new Date().toISOString(),result,independent_cleanup:independent,cleanup_withheld:!safe,retained_root:!safe?owner.root:null,disposable_resources_removed:safe&&cleanup.every(r=>r.completed),cleanup_failures:cleanup.flatMap(r=>r.failures),deciding_canonical_evidence:false});
  }
  assert(cleanup.length&&cleanup.every(r=>r.completed),'Cleanup incomplete.');if(error)throw new Error('C1 child rejected');
  // The actual model receives the read checkpoint only after all fixture cleanup.
  console.log(await readFile(path.join(evidence,operation==='read'?'checkpoint.json':'save/result.json'),'utf8'));
}
async function childOperation(operation,output,options){
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;assert(root);
const owned=new Set(),clients=[],traffic=[],failures=[],browserDiagnostics=new Set();
const progress={work_id:null,revisions:[],reconstructed:false,readback:false,export_downloaded:false};
let local,browser,debug,stage='source-admission',check='pinned source',externalBrowserRequests=0,unknownResolutions=0,lastReadiness=null;
const started=Date.now();
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium'].find(p=>p&&existsSync(p));
class CDP {
  constructor(url){this.ws=new WebSocket(url);this.next=1;this.pending=new Map();this.handlers=[];}
  async open(){await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Object.assign(new Error('cdp_open_timeout'),{code:'CDP_TIMEOUT'})),15000);this.ws.addEventListener('open',()=>{clearTimeout(timer);ok();},{once:true});this.ws.addEventListener('error',()=>{clearTimeout(timer);no(Object.assign(new Error('cdp_open_failed'),{code:'CDP_OPEN_FAILED'}));},{once:true});});
    this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.no(new Error(m.error.message)):p.ok(m.result);}}else for(const fn of this.handlers)fn(m);});return this;}
  send(method,params={}){return new Promise((ok,no)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);no(Object.assign(new Error('cdp_timeout'),{code:'CDP_TIMEOUT',pilot_method:method}));},15000);this.pending.set(id,{ok,no,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails){const d=r.exceptionDetails;const error=Object.assign(new Error('browser_evaluation_exception'),{code:'BROWSER_EVALUATION_EXCEPTION',pilot_diagnostic:{exception_class:safeClass(d.exception?.className),line:Number.isInteger(d.lineNumber)?d.lineNumber:null,column:Number.isInteger(d.columnNumber)?d.columnNumber:null,location:'pilot evaluation; no expression or payload retained'}});throw error;}
    return r.result.value;}
  async close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.no(new Error('cdp_closed'));}this.pending.clear();if(this.ws.readyState===WebSocket.CLOSED)return;await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Object.assign(new Error('cdp_close_timeout'),{code:'CDP_TIMEOUT'})),3000);this.ws.addEventListener('close',()=>{clearTimeout(timer);ok();},{once:true});this.ws.close();});}
}
function safeClass(name){return ['Error','ReferenceError','TypeError','SyntaxError','RangeError','AssertionError'].includes(name)?name:'unclassified';}
async function wait(fn,label){check=label;const deadline=Date.now()+15000;while(Date.now()<deadline){if(await fn())return;await delay(80);}throw Object.assign(new Error('bounded_check_timeout'),{code:'BROWSER_CHECK_TIMEOUT'});}
const click=(c,id)=>c.eval(`document.getElementById(${JSON.stringify(id)}).click()`);
const set=(c,id,value)=>c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const settled=c=>wait(()=>c.eval('!busy'),'settled');
async function navigate(c,url){await c.send('Page.navigate',{url});await wait(()=>c.eval(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'`),'expected document navigation');}
async function readyWorkspace(c){await wait(async()=>{
  lastReadiness=await c.eval(workspaceReadinessExpression(local.origin,fixtureScope));
  lastReadiness.client_http_200=c.clientHttp200===true;lastReadiness.list_http_200=c.listHttp200===true;
  return lastReadiness.ready&&lastReadiness.client_http_200&&lastReadiness.list_http_200;
},'authenticated workspace and loaded client and completed list');}
async function page(){const target=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json();
  const c=await new CDP(target.webSocketDebuggerUrl).open();clients.push(c);
  await c.send('Network.enable');await c.send('Runtime.enable');await c.send('Page.enable');
  c.handlers.push(m=>{
    if(m.method==='Runtime.exceptionThrown'&&failures.length<32)failures.push({stage,check,code:'browser_exception',exception_class:safeClass(m.params.exceptionDetails?.exception?.className)});
    if(m.method==='Network.requestWillBeSent'&&m.params.request.url.startsWith(local.origin+'/api/'))traffic.push({method:m.params.request.method,path:new URL(m.params.request.url).pathname});
    if(m.method==='Network.responseReceived'){
      if(m.params.response.url===local.origin+'/client.js'&&m.params.response.status===200)c.clientHttp200=true;
      if(m.params.response.url===local.origin+'/api/works'&&m.params.response.status===200)c.listHttp200=true;
      if(m.params.response.url.startsWith(local.origin+'/api/')){const path=new URL(m.params.response.url).pathname;if(failures.length<32&&m.params.response.status>=400&&!(stage==='corruption-control'&&path==='/api/reconstruct-files'&&m.params.response.status===409))failures.push({stage,check,code:'http_refusal',path,status:m.params.response.status});}
    }
    if(m.method==='Network.loadingFailed'&&failures.length<32)failures.push({stage,check,code:'browser_request_failed'});
    if(m.method==='Fetch.requestPaused'){
      const p=m.params,allowed=p.request.url.startsWith(local.origin+'/');
      if(!allowed)externalBrowserRequests++;
      c.send(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:p.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})}).catch(()=>{if(failures.length<32)failures.push({stage,check,code:'interception_failed'});});
    }
  });
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});return c;
}
async function save(c,n){await click(c,'save');
  await wait(()=>c.eval(`$('saved-label').textContent.startsWith('Saved revision ${n} ')||!$('uncertain').hidden||!$('conflict').hidden`),'save outcome');
  if(await c.eval("!$('uncertain').hidden")){unknownResolutions++;await settled(c);await click(c,'resolve-save');}
  await wait(()=>c.eval(`$('saved-label').textContent.startsWith('Saved revision ${n} ')`),'saved '+n);await settled(c);const result=await c.eval('saved');
  progress.work_id=result.work_id;progress.revisions.push({revision:result.revision,fingerprint:result.fingerprint,files:result.files});return result;
}
async function select(c,files){const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#work-files'});await c.send('DOM.setFileInputFiles',{nodeId,files});await settled(c);}
try {
  assert.equal((await readCommand('git',['rev-parse',baseline+'^{tree}'])).trim(),sourceTree);
  assert.equal(await readCommand('git',['diff',baseline,'--','apps/web_planning','scripts/web-planning-local-runtime.mjs','scripts/web-planning-local-ingress.ts','scripts/build-web-planning.mjs','scripts/executable-reuse/workflow_cost.py','scripts/executable-reuse/exact_linear.py']),'');assert(chrome);
  const importPath=path.join(here,'consumer-01/continuation-03/consumer/planning-work.json'),bytes=await readFile(importPath);
  const manifest=JSON.parse(await readFile(path.join(path.dirname(importPath),'manifest.json'),'utf8'));
  assert.equal(bytes.length,55006);assert.equal(sha(bytes),inputHash);assert.deepEqual(manifest.scope,fixtureScope);
  const imported=JSON.parse(bytes),intake=validateFileExport(manifest.scope,imported),originalHead=intake.chain.at(-1);
  assert.deepEqual(intake.chain.map(r=>r.revision),[1,2,3,4]);assert.equal(intake.bodies.length,4);
  assert.equal(originalHead.work_id,'47b083cb-833d-49e3-9652-fa6c8d814730');assert.equal(originalHead.fingerprint,manifest.head_fingerprint);assert.deepEqual(originalHead.files,manifest.selected_files);
  await writeJson(path.join(output,'intake-validation.json'),{base,input_bytes:bytes.length,input_sha256:sha(bytes),complete_chain_and_files_validated:true,revisions:intake.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),body_count:intake.bodies.length,source_baseline:baseline,source_tree:sourceTree});
  const downloads=path.join(root,'downloads');await mkdir(downloads);
  const counts=async(server)=>{
    const row=await server.db.prepare('SELECT (SELECT count(DISTINCT work_id) FROM web_planning_revision) works,(SELECT count(*) FROM web_planning_revision) revisions,(SELECT count(*) FROM web_planning_file) files,(SELECT count(*) FROM web_planning_erased) erased').first();
    return {works:row.works,revisions:row.revisions,files:row.files,erased:row.erased};
  };
  stage='worker-initialization';check='fresh empty disposable replacement store';
  local=await startLocal({root:path.join(root,operation+'-runtime'),bindings:{RECONSTRUCTION_MODE:'quiesced-empty-store'}});
  const before=await counts(local);assert.deepEqual(before,{works:0,revisions:0,files:0,erased:0});
  debug=await availablePort();const sandboxDisabled=options.unsandboxed;
  stage='browser-launch';check='owned fresh Chromium profile';
  const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(sandboxDisabled?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,operation+'-profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
  browser=registerOwnedChild(owned,child,{label:'pilot-consumer-browser'});
  child.stderr.on('data',chunk=>{const text=chunk.toString().slice(0,8192);for(const [pattern,code] of [[/SUID sandbox|No usable sandbox/,'browser_sandbox_unavailable'],[/Operation not permitted|Permission denied/,'browser_permission_refused']])if(pattern.test(text))browserDiagnostics.add(code);});
  await wait(async()=>{if(browser.exited||browser.spawnErrorCode)throw Object.assign(new Error('browser_launch_failed'),{code:'BROWSER_LAUNCH_FAILED'});try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch(error){if(error.cause?.code==='ECONNREFUSED')return false;throw error;}},'browser debug listener');
  async function login(c){stage='fresh-local-authentication';await navigate(c,local.origin+'/_local/login');await wait(()=>c.eval("document.title==='Local synthetic workspace'&&!!document.querySelector('form[method=post] button')"),'local login');await c.eval("document.querySelector('form button').click()");await readyWorkspace(c);}
  async function fileInput(c,selector,files){const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector});await c.send('DOM.setFileInputFiles',{nodeId,files});}
  const a=await page();await login(a);
  stage='reconstruction';await fileInput(a,'#import-file',[importPath]);await click(a,'import');
  await wait(()=>a.eval('saved?.revision===4&&!busy'),'accepted reconstruction');progress.reconstructed=true;
  assert.deepEqual(await a.eval('saved'),originalHead);progress.work_id=originalHead.work_id;
  const after=await counts(local);assert.deepEqual(after,{works:1,revisions:4,files:4,erased:0});
  stage='authenticated-context-read';const history=await a.eval("api('/api/work/'+work+'/history')");assert.deepEqual(history.revisions,intake.chain);
  await click(a,'saved-context');await settled(a);
  const context=await a.eval("$('context-view').innerText"),current=history.revisions.at(-1);
  const rendered=await a.eval("(()=>{const e=document.querySelector('#context-view [data-revision]');return {revision:Number(e.dataset.revision),fingerprint:e.dataset.fingerprint};})()");
  assert.deepEqual(rendered,{revision:4,fingerprint:current.fingerprint});
  for(const s of current.sources){assert(context.includes(s.bounded_summary));assert(context.includes(s.source_ref));}
  for(const f of current.files)assert(context.includes(f.name)&&context.includes(f.digest));
  const material={input_commit:base,input_export_sha256:inputHash,current,history:history.revisions.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),file_exposure:'manifest and authenticated Saved-context links only; attachment bodies not read by C1 agent'};
  const checkpoint={operation:'read',observed_at:new Date().toISOString(),binding_hash:bindingHash(material),material,authenticated_routes:['/api/work/'+current.work_id+'/history','/api/work/'+current.work_id+'/context'],saved_context:{...rendered,bytes:Buffer.byteLength(context),sha256:sha(Buffer.from(context)),complete_selected_notes_and_file_manifest_checked:true},attachment_content_reads:[]};
  progress.readback=true;
  if(operation==='read')await writeJson(path.join(evidence,'checkpoint.json'),checkpoint);
  else{
    stage='judgment-admission';const originalCheckpoint=JSON.parse(await readFile(path.join(evidence,'checkpoint.json'),'utf8'));
    assert.equal(checkpoint.binding_hash,originalCheckpoint.binding_hash,'Stable authenticated input differs.');
    const judgmentPath=path.join(evidence,'b3-judgment.json'),judgmentBytes=await readFile(judgmentPath),j=JSON.parse(judgmentBytes);
    validateJudgment(j,originalCheckpoint);
    await select(a,[judgmentPath]);await wait(()=>a.eval('selectedFiles.length===5'),'judgment selection');
    await a.eval("(()=>{const e=$('file-role-4');e.value='results';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await click(a,'check-capacity');await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'judgment capacity fits');
    stage='ordinary-judgment-save';const successor=await save(a,5);
    assert.deepEqual(successor.definition,current.definition);assert.deepEqual(successor.sources,current.sources);assert.deepEqual(successor.relations,current.relations);assert.deepEqual(successor.files.slice(0,4),current.files);
    assert.equal(successor.files[4].digest,'sha256:'+sha(judgmentBytes));
    const finalHistory=await a.eval("api('/api/work/'+work+'/history')");assert.deepEqual(finalHistory.revisions,[...intake.chain,successor]);
    await click(a,'saved-context');await settled(a);await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    await a.eval("[...document.querySelectorAll('#context-view [data-file-url]')].find(b=>b.dataset.fileName==='b3-judgment.json').click()");await settled(a);
    await wait(async()=>(await readdir(downloads)).includes('b3-judgment.json'),'authenticated judgment download');
    const downloaded=await readFile(path.join(downloads,'b3-judgment.json'));assert.deepEqual(downloaded,judgmentBytes);
    stage='successor-export';await a.eval("$('history-tools').open=true");await click(a,'export');await settled(a);await wait(async()=>(await readdir(downloads)).includes('planning-work.json'),'actual complete successor export');
    const exportBytes=await readFile(path.join(downloads,'planning-work.json')),exported=JSON.parse(exportBytes),validated=validateFileExport(manifest.scope,exported);
    assert.deepEqual(validated.chain,finalHistory.revisions);assert.equal(validated.bodies.length,5);for(const b of intake.bodies)assert.deepEqual(validated.bodies.find(f=>f.digest===b.digest),b);
    await writeFile(path.join(output,'planning-work.json'),exportBytes);progress.export_downloaded=true;
    await writeJson(path.join(output,'manifest.json'),{pilot:'cloud-reuse-pilot-01-C1',base,source_baseline:baseline,source_tree:sourceTree,scope:manifest.scope,work_id:successor.work_id,head_revision:5,head_fingerprint:successor.fingerprint,export:{path:'planning-work.json',format:exported.format,bytes:exportBytes.length,sha256:sha(exportBytes),fingerprint:exported.fingerprint},revisions:validated.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),selected_files:successor.files,original_revisions_notes_dependencies_and_bodies_unchanged:true,checkpoint_hash:checkpoint.binding_hash,judgment:{path:'../b3-judgment.json',bytes:judgmentBytes.length,sha256:sha(judgmentBytes),authenticated_download_byte_match:true}});
    await writeJson(path.join(output,'result.json'),{result:'C1 saved for review',work_id:successor.work_id,revision:5,fingerprint:successor.fingerprint,conclusion:j.conclusion,checkpoint_hash:checkpoint.binding_hash,export_bytes:exportBytes.length,export_sha256:sha(exportBytes),authenticated_judgment_download_byte_match:true,original_history_unchanged:true});
  }
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);assert.deepEqual(failures,[]);
  assert.equal(traffic.filter(t=>t.method==='POST'&&t.path==='/api/reconstruct-files').length,1);assert.equal(traffic.filter(t=>t.path.endsWith('/save')).length,operation==='save'?1:0);
  await writeJson(path.join(output,'observation.json'),{operation,authentication:'fresh synthetic local login; normal reconstruction and authenticated history/context',before,after,observed_at:checkpoint.observed_at,checkpoint_hash:checkpoint.binding_hash,save_requests:traffic.filter(t=>t.path.endsWith('/save')).length,reconstruction_submissions:1,unknown_outcome_resolutions:unknownResolutions,write_retries:0,readiness:lastReadiness,api_routes:traffic,provider_api_calls:0,external_browser_requests:externalBrowserRequests,worker_external_requests:local.externalRequests(),elapsed_before_cleanup_ms:Date.now()-started,blind_or_independent:false,prior_B3:'scripted rule; fresh judgment NOT OBSERVED remains historical'});
  stage='retained';console.log(JSON.stringify({operation,result:'complete'}));
} catch(error){await writeJson(path.join(output,'failed-attempt.json'),{operation,stage,check,diagnostic:safeError(error),progress,readiness:lastReadiness,unknown_outcome_resolutions:unknownResolutions,unexpected_failures:failures});throw new Error('C1 failed: '+stage+': '+check);}
finally{
  const cleanup=await cleanupReport({clients,browser,local,debug,owned},{terminate:terminateOwnedProcessTree,portClosed});const independent=await processGroupsAbsent(browser?[browser.pid]:[]);
  if(!independent.available||!independent.known_groups_absent)cleanup.failures.push('independent_cleanup_unqualified');
  await writeJson(path.join(output,'fixture-cleanup.json'),{operation,stage,...cleanup,independent_cleanup:independent,elapsed_including_fixture_cleanup_ms:Date.now()-started});assert.deepEqual(cleanup.failures,[]);assert.equal(owned.size,0);
}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),isChild=args[0]==='--child';if(isChild)args.shift();const operation=args.shift();assert(['read','save'].includes(operation));
  const options=pilotArguments(args),output=path.resolve(options.output);
  if(isChild)await childOperation(operation,output,options);else await parent(operation,output,options);
}
