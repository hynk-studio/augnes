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
// Runs in the authenticated selected-context DOM. No expected values enter it.
export function extractContextDom(root){
  if(!root)return {present:false};
  const text=e=>e?.textContent??null;
  const dl=e=>e?Object.fromEntries([...e.querySelectorAll(':scope > dt')].map(k=>[text(k),text(k.nextElementSibling)])):{};
  const disclosures=[...root.querySelectorAll('details')].map(e=>{const summary=e.querySelector(':scope > summary'),was_open=e.open;
    const before_ref_visible=e.querySelector(':scope > code')?e.innerText.includes(e.querySelector(':scope > code').textContent):null;
    if(!e.open)summary?.click();return {summary:text(summary),was_open,open:e.open,before_ref_visible,after_ref_visible:e.querySelector(':scope > code')?e.innerText.includes(e.querySelector(':scope > code').textContent):null};});
  const article=root.querySelector(':scope > article.saved-context');if(!article)return {present:false,disclosures};
  const list=label=>{const h=[...article.querySelectorAll(':scope > h3')].find(e=>text(e)===label),n=h?.nextElementSibling;
    return n?.tagName==='UL'?[...n.children].map(text):n?.tagName==='P'&&text(n)==='None recorded.'?[]:null;};
  const details=[...article.querySelectorAll(':scope > details')],material=details.find(e=>text(e.querySelector(':scope > summary'))==='Material provenance and required context');
  return {present:true,revision:article.dataset.revision??null,fingerprint:article.dataset.fingerprint??null,
    definition:{goal:text(article.querySelector(':scope > h2')),success_criteria:list('Success criteria'),non_goals:list('Non-goals')},
    notes:[...article.querySelectorAll(':scope > .context-note')].map(e=>({heading:text(e.querySelector(':scope > h4')),summary:text(e.querySelector(':scope > .note-text')),source_ref:text(e.querySelector(':scope > details > code')),binding_node_count:e.querySelectorAll(':scope > details > code').length,attribution:dl(e.querySelector(':scope > dl'))})),
    dependencies:material?[...material.querySelectorAll(':scope > p')].slice(0,-1).map(text):[],
    files:[...article.querySelectorAll('section[aria-label="Saved files"] [data-file-url]')].map(e=>({name:e.dataset.fileName??null,digest:e.dataset.fileDigest??null,bytes:e.dataset.fileBytes??null,url:e.dataset.fileUrl??null,description:text(e.parentElement.querySelector(':scope > p'))})),
    identities:dl(details.find(e=>text(e.querySelector(':scope > summary'))==='Exact saved details')?.querySelector(':scope > dl')),disclosures};
}
export function contextFieldObservations(observed,current){
  const rows=[];
  const metric=v=>{if(v===undefined||v===null)return {present:false,bytes:null,sha256:null};const b=Buffer.from(typeof v==='string'?v:JSON.stringify(stable(v)));return {present:true,bytes:b.length,sha256:sha(b)};};
  const add=(id,expected,actual,source_ref=null)=>{const a=metric(expected),b=metric(actual);rows.push({check_id:id,source_ref,expected:a,observed:b,match:a.present&&b.present&&a.bytes===b.bytes&&a.sha256===b.sha256});};
  add('context.present',true,observed.present);add('context.revision',String(current.revision),observed.revision);add('context.fingerprint',current.fingerprint,observed.fingerprint);
  for(const k of ['goal','success_criteria','non_goals'])add('definition.'+k,current.definition[k],observed.definition?.[k]);
  add('notes.count',current.sources.length,observed.notes?.length);
  current.sources.forEach((s,i)=>{const n=observed.notes?.[i];for(const [k,v] of Object.entries({heading:`${i+1}. ${s.why_included}`,summary:s.bounded_summary,source_ref:s.source_ref,binding_node_count:1}))add(`notes.${i}.${k}`,v,n?.[k],s.source_ref);
    for(const [k,v] of Object.entries({'Source / attribution':s.compatibility_source_ref?.external_id??'','Provenance':s.trust_class,'Observed':s.external_ref?.observed_at??'Unknown','Currentness':'Unknown — original source completeness, availability and currentness have not been verified.'}))add(`notes.${i}.attribution.${k}`,v,n?.attribution?.[k],s.source_ref);});
  const materials=current.relations?.materials??[];add('dependencies.count',materials.length,observed.dependencies?.length);
  materials.forEach((m,i)=>{const ref=m.from?` from Work ${m.from.work_id} · revision ${m.from.revision} · ${m.from.fingerprint}; material ${m.from.source_ref}`:' in this work';
    const text=`Note ${current.sources.findIndex(s=>s.source_ref===m.source_ref)+1}: ${m.kind}${ref}. Required notes: ${m.dependencies.map(d=>current.sources.findIndex(s=>s.source_ref===d)+1).join(', ')||'none explicitly linked'}.`;
    add(`dependencies.${i}`,text,observed.dependencies?.[i],m.source_ref);
    for(const d of m.dependencies)add(`dependencies.${i}.selected.${d}`,true,current.sources.some(s=>s.source_ref===d),m.source_ref);});
  add('files.count',current.files?.length??0,observed.files?.length);
  (current.files??[]).forEach((f,i)=>{const v={name:f.name,digest:f.digest,bytes:String(f.bytes),url:`/api/work/${current.work_id}/files/${current.revision}/${current.fingerprint.slice(7)}/${i}`,description:`${f.role} · ${f.bytes.toLocaleString('en-US')} bytes · ${f.digest}`};for(const [k,e] of Object.entries(v))add(`files.${i}.${k}`,e,observed.files?.[i]?.[k]);});
  for(const k of ['work_id','workspace_id','project_id','author_ref','fingerprint','predecessor','format','compatibility'])add('identity.'+k,String(current[k]??''),observed.identities?.[k]);
  return rows;
}
export function requireContextFields(rows){const bad=rows.find(r=>!r.match);if(bad)throw Object.assign(new Error('selected_context_field_mismatch'),{code:'CONTEXT_FIELD_MISMATCH',check_id:bad.check_id,source_ref:bad.source_ref});}
export function continuationPaths(bundle,operation){assert(['read','save'].includes(operation));const evidence=path.resolve(bundle);assert(path.dirname(evidence)===path.join(here,'c1-01')&&/^continuation-\d+$/.test(path.basename(evidence)),'Explicit new C1 continuation bundle required.');return {evidence,output:path.join(evidence,operation),checkpoint:path.join(evidence,'checkpoint.json'),judgment:path.join(evidence,'b3-judgment.json'),result:path.join(evidence,'save/result.json')};}

export class CDP {
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

async function parent(operation,paths,options){
  const {evidence,output}=paths;
  assert(!existsSync(output),'Preserve the original operation.');await mkdir(output,{recursive:true});
  const started=new Date().toISOString();
  await writeJson(path.join(output,'execution-helper.json'),{operation,base,helper_commit:(await readCommand('git',['rev-parse','HEAD'])).trim(),helper_tree:(await readCommand('git',['rev-parse','HEAD^{tree}'])).trim(),helper_sha256:sha(await readFile(fileURLToPath(import.meta.url))),continuation_bundle:path.relative(repo,evidence),command:['node','--import','tsx',path.relative(repo,fileURLToPath(import.meta.url)),operation,path.relative(repo,evidence),...(options.unsandboxed?[unsandboxedPilotFlag]:[])],permissions:'per-command network permission requested; synthetic loopback only',unsandboxed_pilot_opt_in:options.unsandboxed});
  const owner=createCanonicalTestResourceRoot('ag-suite-');await mkdir(path.join(owner.root,'home'));await mkdir(path.join(owner.root,'runtime-state'));
  const stdout=capture(16384),stderr=capture(16384),logs=capture(16384);let result,error,pid,cleanup=[];
  try{result=await runCanonicalChild({suite:'cloud-reuse-pilot-01-C1',label:operation,command:process.execPath,args:['--import','tsx',fileURLToPath(import.meta.url),'--child',operation,evidence,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n')),onSpawn:value=>{pid=value;}});error=canonicalChildAcceptanceFailure(result,{requireNaturalExit:true});}catch(e){error=e;}
  finally{const independent=await processGroupsAbsent([pid]);let fixture;try{fixture=JSON.parse(await readFile(path.join(output,'fixture-cleanup.json'),'utf8'));}catch{}
    const safe=independent.available&&independent.known_groups_absent&&fixture?.independent_cleanup?.available&&fixture?.independent_cleanup?.known_groups_absent&&fixture?.failures?.length===0;
    if(safe)cleanup=cleanupCanonicalTestResources([owner]);
    await writeJson(path.join(output,'parent-output.json'),{stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),result,error:error instanceof Error?safeError(error):error??null});
    await writeJson(path.join(output,'lifecycle.json'),{operation,started_at:started,finished_at:new Date().toISOString(),result,independent_cleanup:independent,cleanup_withheld:!safe,retained_root:!safe?owner.root:null,disposable_resources_removed:safe&&cleanup.every(r=>r.completed),cleanup_failures:cleanup.flatMap(r=>r.failures),deciding_canonical_evidence:false});
  }
  assert(cleanup.length&&cleanup.every(r=>r.completed),'Cleanup incomplete.');if(error){console.log(await readFile(operation==='read'?paths.checkpoint:path.join(output,'failed-attempt.json'),'utf8'));throw new Error('C1 child rejected');}
  // The actual model receives the read checkpoint only after all fixture cleanup.
  console.log(await readFile(operation==='read'?paths.checkpoint:paths.result,'utf8'));
}
async function childOperation(operation,paths,options){
const {evidence,output}=paths;
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;assert(root);
const owned=new Set(),clients=[],traffic=[],failures=[],browserDiagnostics=new Set();
const progress={work_id:null,revisions:[],reconstructed:false,readback:false,export_downloaded:false};
const comparisons=[];
async function compare(id,expected,observed){check=id;const encoded=v=>Buffer.from(JSON.stringify(stable(v))??'undefined');const e=encoded(expected),o=encoded(observed);const row={check_id:id,expected:{bytes:e.length,sha256:sha(e)},observed:{bytes:o.length,sha256:sha(o)},match:e.equals(o)};comparisons.push(row);await writeJson(path.join(output,'content-comparisons.json'),comparisons);assert(row.match,'C1 comparison failed: '+id);}
let local,browser,debug,stage='source-admission',check='pinned source',externalBrowserRequests=0,unknownResolutions=0,lastReadiness=null;
const started=Date.now();
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium'].find(p=>p&&existsSync(p));
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
  await compare('reconstruction.saved-head',originalHead,await a.eval('saved'));progress.work_id=originalHead.work_id;
  const after=await counts(local);assert.deepEqual(after,{works:1,revisions:4,files:4,erased:0});
  stage='authenticated-context-read';const history=await a.eval("api('/api/work/'+work+'/history')");await compare('history.revisions-1-4',intake.chain,history.revisions);
  await click(a,'saved-context');await settled(a);
  const current=history.revisions.at(-1),dom=await a.eval(`(${extractContextDom.toString()})(document.getElementById('context-view'))`);
  const fields=contextFieldObservations(dom,current);
  // Safe bounded observations are retained before any field assertion can throw.
  await writeJson(path.join(output,'selected-content-observation.json'),{complete:false,provenance:'authenticated Saved-context DOM; structured history is a separate authenticated response',fields,disclosures:dom.disclosures});
  check=fields.find(f=>!f.match)?.check_id??'selected-context-fields';requireContextFields(fields);
  await writeJson(path.join(output,'selected-content-observation.json'),{complete:true,provenance:'authenticated Saved-context DOM',fields,disclosures:dom.disclosures});
  const {disclosures,...authenticated_dom}=dom;
  const material={input_commit:base,input_export_sha256:inputHash,current,authenticated_dom,history:history.revisions.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),file_exposure:'manifest and authenticated Saved-context links only; attachment bodies not read by C1 agent'};
  const checkpoint={operation:'read',complete:true,continuation_bundle:path.relative(repo,evidence),observed_at:new Date().toISOString(),binding_hash:bindingHash(material),material,provenance:{current:'authenticated structured-history response',authenticated_dom:'authenticated Saved-context response DOM, per-note extraction with opened disclosures',dependencies:'structured history source-ref links checked against note-associated DOM dependency labels'},authenticated_routes:['/api/work/'+current.work_id+'/history','/api/work/'+current.work_id+'/context'],verified_field_count:fields.length,attachment_content_reads:[]};
  progress.readback=true;
  if(operation==='read')await writeJson(paths.checkpoint,checkpoint);
  else{
    stage='judgment-admission';const originalCheckpoint=JSON.parse(await readFile(paths.checkpoint,'utf8'));
    assert.equal(originalCheckpoint.complete,true);assert.equal(originalCheckpoint.continuation_bundle,path.relative(repo,evidence));await compare('save.stable-checkpoint-binding',originalCheckpoint.binding_hash,checkpoint.binding_hash);
    const judgmentPath=paths.judgment,judgmentBytes=await readFile(judgmentPath),j=JSON.parse(judgmentBytes);
    validateJudgment(j,originalCheckpoint);assert.equal(j.continuation_bundle,path.relative(repo,evidence));
    await select(a,[judgmentPath]);await wait(()=>a.eval('selectedFiles.length===5'),'judgment selection');
    await a.eval("(()=>{const e=$('file-role-4');e.value='results';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await click(a,'check-capacity');await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'judgment capacity fits');
    stage='ordinary-judgment-save';const successor=await save(a,5);
    await compare('successor.definition',current.definition,successor.definition);await compare('successor.notes',current.sources,successor.sources);await compare('successor.dependencies',current.relations,successor.relations);await compare('successor.original-files',current.files,successor.files.slice(0,4));
    await compare('successor.judgment-digest','sha256:'+sha(judgmentBytes),successor.files[4].digest);
    const finalHistory=await a.eval("api('/api/work/'+work+'/history')");await compare('successor.history',[...intake.chain,successor],finalHistory.revisions);
    await click(a,'saved-context');await settled(a);await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
    await a.eval("[...document.querySelectorAll('#context-view [data-file-url]')].find(b=>b.dataset.fileName==='b3-judgment.json').click()");await settled(a);
    await wait(async()=>(await readdir(downloads)).includes('b3-judgment.json'),'authenticated judgment download');
    const downloaded=await readFile(path.join(downloads,'b3-judgment.json'));await compare('successor.authenticated-judgment-bytes',{bytes:judgmentBytes.length,sha256:sha(judgmentBytes)},{bytes:downloaded.length,sha256:sha(downloaded)});assert(downloaded.equals(judgmentBytes));
    stage='successor-export';await a.eval("$('history-tools').open=true");await click(a,'export');await settled(a);await wait(async()=>(await readdir(downloads)).includes('planning-work.json'),'actual complete successor export');
    const exportBytes=await readFile(path.join(downloads,'planning-work.json')),exported=JSON.parse(exportBytes),validated=validateFileExport(manifest.scope,exported);
    await compare('export.history',finalHistory.revisions,validated.chain);await compare('export.body-count',5,validated.bodies.length);for(const b of intake.bodies)await compare('export.preserved-body.'+b.digest,b,validated.bodies.find(f=>f.digest===b.digest));
    await writeFile(path.join(output,'planning-work.json'),exportBytes);progress.export_downloaded=true;
    await writeJson(path.join(output,'manifest.json'),{pilot:'cloud-reuse-pilot-01-C1',base,source_baseline:baseline,source_tree:sourceTree,scope:manifest.scope,work_id:successor.work_id,head_revision:5,head_fingerprint:successor.fingerprint,export:{path:'planning-work.json',format:exported.format,bytes:exportBytes.length,sha256:sha(exportBytes),fingerprint:exported.fingerprint},revisions:validated.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),selected_files:successor.files,original_revisions_notes_dependencies_and_bodies_unchanged:true,checkpoint_hash:checkpoint.binding_hash,judgment:{path:'../b3-judgment.json',bytes:judgmentBytes.length,sha256:sha(judgmentBytes),authenticated_download_byte_match:true}});
    await writeJson(path.join(output,'result.json'),{result:'C1 saved for review',work_id:successor.work_id,revision:5,fingerprint:successor.fingerprint,conclusion:j.conclusion,checkpoint_hash:checkpoint.binding_hash,export_bytes:exportBytes.length,export_sha256:sha(exportBytes),authenticated_judgment_download_byte_match:true,original_history_unchanged:true});
  }
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);assert.deepEqual(failures,[]);
  assert.equal(traffic.filter(t=>t.method==='POST'&&t.path==='/api/reconstruct-files').length,1);assert.equal(traffic.filter(t=>t.path.endsWith('/save')).length,operation==='save'?1:0);
  await writeJson(path.join(output,'observation.json'),{operation,authentication:'fresh synthetic local login; normal reconstruction and authenticated history/context',before,after,observed_at:checkpoint.observed_at,checkpoint_hash:checkpoint.binding_hash,save_requests:traffic.filter(t=>t.path.endsWith('/save')).length,reconstruction_submissions:1,unknown_outcome_resolutions:unknownResolutions,write_retries:0,readiness:lastReadiness,api_routes:traffic,provider_api_calls:0,external_browser_requests:externalBrowserRequests,worker_external_requests:local.externalRequests(),elapsed_before_cleanup_ms:Date.now()-started,blind_or_independent:false,prior_B3:'scripted rule; fresh judgment NOT OBSERVED remains historical'});
  stage='retained';console.log(JSON.stringify({operation,result:'complete'}));
} catch(error){if(operation==='read')await writeJson(paths.checkpoint,{operation,complete:false,continuation_bundle:path.relative(repo,evidence),stage,check,diagnostic:safeError(error),field_observation:'read/selected-content-observation.json',verdict_authorship_allowed:false});await writeJson(path.join(output,'failed-attempt.json'),{operation,stage,check,diagnostic:safeError(error),progress,readiness:lastReadiness,unknown_outcome_resolutions:unknownResolutions,unexpected_failures:failures});throw new Error('C1 failed: '+stage+': '+check);}
finally{
  const cleanupStarted=new Date().toISOString();const cleanup=await cleanupReport({clients,browser,local,debug,owned},{terminate:terminateOwnedProcessTree,portClosed});const independent=await processGroupsAbsent(browser?[browser.pid]:[]);
  if(!independent.available||!independent.known_groups_absent)cleanup.failures.push('independent_cleanup_unqualified');
  await writeJson(path.join(output,'fixture-cleanup.json'),{operation,stage,cleanup_started_at:cleanupStarted,cleanup_finished_at:new Date().toISOString(),...cleanup,independent_cleanup:independent,elapsed_including_fixture_cleanup_ms:Date.now()-started});assert.deepEqual(cleanup.failures,[]);assert.equal(owned.size,0);
}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),isChild=args[0]==='--child';if(isChild)args.shift();const operation=args.shift();assert(['read','save'].includes(operation));
  const options=pilotArguments(args),paths=continuationPaths(options.output,operation);
  if(isChild)await childOperation(operation,paths,options);else await parent(operation,paths,options);
}
