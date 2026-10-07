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

async function readCommand(command,args) {
  let stdout='',stderr='';
  const result=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'helper read '+command,command,args,cwd:repo,env:process.env,timeoutMs:10000,
    stdout:{write(chunk){stdout+=chunk.toString();}},stderr:{write(chunk){stderr+=chunk.toString();}}});
  assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);assert.equal(stderr,'');return stdout;
}

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const baseline='b73e5012c699f85a9e3b643b6cba82f8f195d3ce';
const sourceTree='5443ce03a9d193c03274379938fa1b391512ad25';
const options=pilotArguments(process.argv.slice(2));
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT,output=path.resolve(options.output);
assert(root,'Owned fixture root required.');
assert.equal((await readCommand('git',['rev-parse',baseline+'^{tree}'])).trim(),sourceTree);
assert.equal(await readCommand('git',['diff',baseline,'--','apps/web_planning','scripts/web-planning-local-runtime.mjs',
  'scripts/web-planning-local-ingress.ts','scripts/build-web-planning.mjs',
  'scripts/executable-reuse/workflow_cost.py','scripts/executable-reuse/exact_linear.py']),'');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const owned=new Set(),clients=[],traffic=[],failures=[];
const progress={work_id:null,revisions:[],reconstructed:false,transition:false,calculation:false,readback:false,export_downloaded:false,export_validated:false,corruption_control:false};
const browserDiagnostics=new Set();
let local,browser,debug,stage='source-admission',check='pinned source',externalBrowserRequests=0,unknownResolutions=0,lastReadiness=null;
const started=Date.now();
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>p&&existsSync(p));
assert(chrome,'Real browser unavailable.');
class CDP {
  constructor(url){this.ws=new WebSocket(url);this.next=1;this.pending=new Map();this.handlers=[];}
  async open(){await new Promise((ok,no)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',no,{once:true});});
    this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.no(new Error(m.error.message)):p.ok(m.result);}}else for(const fn of this.handlers)fn(m);});return this;}
  send(method,params={}){return new Promise((ok,no)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);no(Object.assign(new Error('cdp_timeout'),{code:'CDP_TIMEOUT',pilot_method:method}));},15000);this.pending.set(id,{ok,no,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails){const d=r.exceptionDetails;const error=Object.assign(new Error('browser_evaluation_exception'),{code:'BROWSER_EVALUATION_EXCEPTION',pilot_diagnostic:{exception_class:safeClass(d.exception?.className),line:Number.isInteger(d.lineNumber)?d.lineNumber:null,column:Number.isInteger(d.columnNumber)?d.columnNumber:null,location:'pilot evaluation; no expression or payload retained'}});throw error;}
    return r.result.value;}
  async close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.no(new Error('cdp_closed'));}this.pending.clear();await new Promise(ok=>{this.ws.addEventListener('close',ok,{once:true});this.ws.close();});}
}
function safeClass(name){return ['Error','ReferenceError','TypeError','SyntaxError','RangeError','AssertionError'].includes(name)?name:'unclassified';}
function safeError(error){return {name:safeClass(error.name),code:typeof error.code==='string'&&/^(?:ERR_[A-Z_]+|E[A-Z]+|CDP_TIMEOUT|BROWSER_[A-Z_]+)$/.test(error.code)?error.code:null,
  assertion_operator:typeof error.operator==='string'&&/^[A-Za-z]+$/.test(error.operator)?error.operator:null,
  evaluation:error.pilot_diagnostic??null};}
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
async function note(c,text,source,dependencies=false){await click(c,'add-note');await c.eval(`(()=>{const row=$('notes').lastElementChild;row.querySelector('[data-field=text]').value=${JSON.stringify(text)};row.querySelector('[data-field=source]').value=${JSON.stringify(source)};row.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));${dependencies?"const deps=row.querySelector('.dependencies');for(const o of deps.options)o.selected=true;deps.dispatchEvent(new Event('change',{bubbles:true}));":''}})()`);}
async function select(c,files){const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#work-files'});await c.send('DOM.setFileInputFiles',{nodeId,files});await settled(c);}
async function portClosed(port){return new Promise(ok=>{const c=net.connect(port,'127.0.0.1');c.once('connect',()=>{c.destroy();ok(false);});c.once('error',()=>ok(true));});}
try {
  stage='intake';check='exact reviewed transport';
  const intakeDir=path.join(here,'continuation-01/attempt-3');
  const importPath=path.join(intakeDir,'planning-work.json'),bytes=await readFile(importPath);
  const manifest=JSON.parse(await readFile(path.join(intakeDir,'manifest.json'),'utf8'));
  assert.equal(bytes.length,25632);assert.equal(sha(bytes),'2634ccd6ec63ae50b4f05a8ff89e9fd8e723242f75f5cdeb512c81af4cc7d219');
  assert.deepEqual(manifest.scope,fixtureScope);assert.equal(manifest.work_id,'47b083cb-833d-49e3-9652-fa6c8d814730');
  const imported=JSON.parse(bytes),intake=validateFileExport(manifest.scope,imported);
  assert.equal(imported.format,'web_planning_export.v0.3');assert.equal(intake.chain.length,2);assert.equal(intake.bodies.length,3);
  assert.deepEqual(intake.chain.map(r=>r.revision),[1,2]);
  assert.equal(intake.chain[0].fingerprint,'sha256:616c6503c0ae6bb6b3f69ddeb4993c2e491ab492b5a3d2a8c5663706a51c4983');
  assert.equal(intake.chain[1].fingerprint,manifest.head_fingerprint);assert.deepEqual(intake.chain[1].files,manifest.selected_files);
  const originalHead=intake.chain[1];
  const qualification=originalHead.sources.find(s=>s.compatibility_source_ref.external_id==='Qualified callable README and explicit pilot conditions');
  assert(qualification);assert.match(qualification.bounded_summary,/History-dependent probabilities, infinite states/);
  await writeFile(path.join(output,'intake-validation.json'),JSON.stringify({original_retention:'d3f9f0d538078b33c7db892666d50755a71337bf',bytes:bytes.length,sha256:sha(bytes),format:imported.format,scope:manifest.scope,work_id:manifest.work_id,revisions:intake.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint,definition:r.definition,source_refs:r.sources.map(s=>s.source_ref),files:r.files})),complete_chain_and_membership:true,body_count:intake.bodies.length,qualification_ref:qualification.source_ref},null,2)+'\n');
  const selected=path.join(root,'selected'),downloads=path.join(root,'calculation');await mkdir(selected);await mkdir(downloads);
  const counts=async(server)=>{
    const row=await server.db.prepare('SELECT (SELECT count(DISTINCT work_id) FROM web_planning_revision) works,(SELECT count(*) FROM web_planning_revision) revisions,(SELECT count(*) FROM web_planning_file) files,(SELECT count(*) FROM web_planning_erased) erased').first();
    return {works:row.works,revisions:row.revisions,files:row.files,erased:row.erased};
  };
  stage='worker-initialization';check='fresh empty disposable replacement store';
  local=await startLocal({root:path.join(root,'consumer-runtime'),bindings:{RECONSTRUCTION_MODE:'quiesced-empty-store'}});
  const before=await counts(local);assert.deepEqual(before,{works:0,revisions:0,files:0,erased:0});
  debug=await availablePort();const sandboxDisabled=options.unsandboxed;
  stage='browser-launch';check='owned fresh Chromium profile';
  const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(sandboxDisabled?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,'consumer-profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
  browser=registerOwnedChild(owned,child,{label:'pilot-consumer-browser'});
  child.stderr.on('data',chunk=>{const text=chunk.toString().slice(0,8192);for(const [pattern,code] of [[/SUID sandbox|No usable sandbox/,'browser_sandbox_unavailable'],[/Operation not permitted|Permission denied/,'browser_permission_refused']])if(pattern.test(text))browserDiagnostics.add(code);});
  await wait(async()=>{if(browser.exited||browser.spawnErrorCode)throw Object.assign(new Error('browser_launch_failed'),{code:'BROWSER_LAUNCH_FAILED'});try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch(error){if(error.cause?.code==='ECONNREFUSED')return false;throw error;}},'browser debug listener');
  async function login(c){stage='fresh-local-authentication';await navigate(c,local.origin+'/_local/login');await wait(()=>c.eval("document.title==='Local synthetic workspace'&&!!document.querySelector('form[method=post] button')"),'local login');await c.eval("document.querySelector('form button').click()");await readyWorkspace(c);}
  async function fileInput(c,selector,files){const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector});await c.send('DOM.setFileInputFiles',{nodeId,files});}
  const a=await page();await login(a);
  stage='reconstruction';check='ordinary authenticated import route';
  await fileInput(a,'#import-file',[importPath]);await click(a,'import');
  await wait(()=>a.eval("saved?.revision===2&&!busy"),'accepted reconstruction');
  assert.deepEqual(await a.eval('saved'),originalHead);progress.work_id=manifest.work_id;progress.reconstructed=true;
  const reconstructionCounts=await counts(local);assert.deepEqual(reconstructionCounts,{works:1,revisions:2,files:3,erased:0});
  stage='imported-readback';check='ordinary exact history and Saved context';
  const history=await a.eval("api('/api/work/'+work+'/history')");assert.deepEqual(history.revisions,intake.chain);
  await click(a,'saved-context');await settled(a);
  const context=await a.eval("$('context-view').innerText");assert.match(context,/History-dependent probabilities, infinite states/);assert.match(context,/Phase B NOT RUN/);assert.match(context,/workflow_cost.py requires exact_linear.py/);
  assert.equal(await a.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'2');
  await writeFile(path.join(output,'saved-context-revision-2.txt'),context+'\n');
  await writeFile(path.join(output,'reconstruction.json'),JSON.stringify({before,after:reconstructionCounts,readback_equal:true,complete_history_equal:true,route:'/api/reconstruct-files',authentication:'fresh synthetic local login/session; not live Access',qualification_ref:qualification.source_ref,original_definition_preserved:true,original_result_note_preserved:true},null,2)+'\n');
  stage='downloaded-bytes';check='authenticated Saved-context downloads';
  await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  const downloaded=[];
  for(const name of ['workflow_cost.py','exact_linear.py']){
    const button=await a.eval(`(()=>{const b=[...document.querySelectorAll('#context-view [data-file-url]')].find(b=>b.dataset.fileName===${JSON.stringify(name)});return {url:b.dataset.fileUrl,name:b.dataset.fileName,digest:b.dataset.fileDigest,bytes:Number(b.dataset.fileBytes)};})()`);
    await a.eval(`[...document.querySelectorAll('#context-view [data-file-url]')].find(b=>b.dataset.fileName===${JSON.stringify(name)}).click()`);await settled(a);
    await wait(async()=>(await readdir(downloads)).includes(name),'actual download '+name);
    const actual=await readFile(path.join(downloads,name)),expected=manifest.source_files.find(f=>f.name===name);
    assert.equal(actual.length,expected.bytes);assert.equal(sha(actual),expected.sha256);assert.equal(button.digest,'sha256:'+sha(actual));
    // Applicability/source inspection reads downloaded bytes without executing them.
    assert.match(actual.toString(),name==='workflow_cost.py'?/from exact_linear import exact_system, exact_value, solve_exact/:/def solve_exact/);
    downloaded.push({...button,sha256:sha(actual),downloaded_via_authenticated_route:true});
  }
  await writeFile(path.join(output,'downloaded-files.json'),JSON.stringify(downloaded,null,2)+'\n');
  stage='current-scope-transition';check='ordinary definition successor; history unchanged';
  await set(a,'criteria','Execute downloaded qualified bytes for B1 and B2 with independent comparisons\nAssess B3 suitability without extending the model\nPreserve imported history and return a complete successor export');
  await set(a,'non-goals','Empirical probabilities, live hosting, comparative usefulness or integration approval\nProduct or solver expansion; execution from imported authority');
  await note(a,'Director review 5436773654 on PR #1413 commissions this separate Phase B task: B1/B2 downloaded-byte reuse, B3 applicability judgment, successor and one corruption control. The export grants no execution authority. Producer records remain historical.', 'Director commission #1413; review 5436773654',true);
  await click(a,'check-capacity');await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'transition capacity fits');
  const transition=await save(a,3);progress.transition=true;
  assert.deepEqual(transition.files,originalHead.files);assert.deepEqual(transition.sources.filter(s=>originalHead.sources.some(o=>o.source_ref===s.source_ref)),originalHead.sources);
  const transitionedHistory=await a.eval("api('/api/work/'+work+'/history')");assert.deepEqual(transitionedHistory.revisions.slice(0,2),intake.chain);
  await writeFile(path.join(output,'scope-transition.json'),JSON.stringify({revision:transition.revision,fingerprint:transition.fingerprint,definition:transition.definition,commission_ref:transition.sources.find(s=>s.compatibility_source_ref.external_id==='Director commission #1413; review 5436773654').source_ref,historical_revisions_equal:true,original_sources_and_files_retained:true},null,2)+'\n');
  async function calculate(label,args,cwd=downloads){let stdout='',stderr='';check=label+' bounded execution';const result=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label,command:'python3',args,cwd,env:process.env,timeoutMs:10000,stdout:{write(chunk){stdout+=chunk.toString();}},stderr:{write(chunk){stderr+=chunk.toString();}}});
    // Preserve failures before assertions. No stdout replacement or synthetic actuals.
    await writeFile(path.join(output,label+'-stdout.txt'),stdout);await writeFile(path.join(output,label+'-lifecycle.json'),JSON.stringify({...result,stderr},null,2)+'\n');
    assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);assert.equal(stderr,'');return {stdout,result};}
  stage='calculations';const wrapper=path.join(here,'observe-downloaded.py'),entry=path.join(downloads,'workflow_cost.py');
  const help=await calculate('cli-help',['-E','-s','-B',wrapper,entry,path.join(downloads,'help-provenance.json'),'--help']);
  for(const flag of ['--attempt','--verification','--repair','--direct-success','--inspection','--inspected-success'])assert(help.stdout.includes(flag));
  const calculations=[];
  for(const [label,inspection] of [['B1','2'],['B2','9']]){
    const argv=['--attempt','11','--verification','2','--repair','6','--direct-success','3/5','--inspection',inspection,'--inspected-success','4/5'];
    const processArgs=['-E','-s','-B',wrapper,entry,path.join(downloads,label+'-provenance.json'),...argv];
    const actual=await calculate(label,processArgs),observed=JSON.parse(actual.stdout);
    assert.deepEqual(observed.inputs,{attempt:'11',verification:'2',repair:'6',direct_success:'3/5',inspection,inspected_success:'4/5'});
    const provenance=JSON.parse(await readFile(path.join(downloads,label+'-provenance.json'),'utf8'));
    assert.deepEqual(provenance.argv,[entry,...argv]);assert.equal(provenance.cwd,downloads);
    for(const [key,name] of [['entry','workflow_cost.py'],['exact_linear','exact_linear.py']]){const expected=manifest.source_files.find(f=>f.name===name);assert.equal(provenance[key].path,path.join(downloads,name));assert.equal(provenance[key].bytes,expected.bytes);assert.equal(provenance[key].sha256,expected.sha256);}
    // Keep process-local evidence separate from calculator stdout. Paths describe
    // removed synthetic roots, not credentials or a platform isolation guarantee.
    await writeFile(path.join(output,label+'-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
    const oracle=await calculate(label+'-oracle',['-E','-s','-B',path.join(here,'consumer-oracle.py'),label,path.join(output,label+'-stdout.txt')]);
    const comparison=JSON.parse(oracle.stdout);
    calculations.push({case:label,actual_argv:['python3',...processArgs],inputs:observed.inputs,actual_stdout:label+'-stdout.txt',actual_stdout_sha256:sha(Buffer.from(actual.stdout)),provenance:label+'-provenance.json',execution:actual.result,expected_comparison:comparison,oracle_execution:oracle.result});
  }
  assert.equal(JSON.parse(await readFile(path.join(output,'B1-stdout.txt'))).comparison,'inspection_reduces_work');
  assert.equal(JSON.parse(await readFile(path.join(output,'B2-stdout.txt'))).comparison,'inspection_adds_work');
  const b3={case:'B3',inputs:{attempt:'11',verification:'2',repair:'6',inspection:'2',direct_success:'3/(5+k)',inspected_success:'4/(5+k)',failures:'k=0,1,2,...; no finite cutoff'},decision:'agent non-use judgment',reason:'Recovered qualification limits the callable to stationary finite-state problems. Unbounded failure history changes probabilities with k. No stationary substitution, arbitrary cutoff or expanded solver is commissioned.',qualification_ref:qualification.source_ref,qualification_revision:2,qualification_fingerprint:originalHead.fingerprint,cli_run:false,observed_cli_refusal:false,mathematical_impossibility_claim:false};
  await writeFile(path.join(output,'B3-judgment.json'),JSON.stringify(b3,null,2)+'\n');progress.calculation=true;
  stage='successor-results';check='ordinary result-file selection and concise dependent note';
  const resultText=JSON.stringify({B1:JSON.parse(await readFile(path.join(output,'B1-stdout.txt'))),B2:JSON.parse(await readFile(path.join(output,'B2-stdout.txt'))),independent:calculations.map(c=>c.expected_comparison),B3:b3,mandatory_verification:true},null,2)+'\n';
  await writeFile(path.join(selected,'consumer-results.json'),resultText);await writeFile(path.join(output,'consumer-results.json'),resultText);
  await select(a,[path.join(selected,'consumer-results.json')]);await wait(()=>a.eval('selectedFiles.length===4'),'explicit result selection');await a.eval("(()=>{const e=$('file-role-3');e.value='results';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await note(a,'B1 downloaded-byte execution: direct 77/3, inspected 81/4, difference -65/12; choose optional inspection under stipulated inputs. B2 newly executed with inspection 9: direct 77/3, inspected 29, difference 10/3; decline optional inspection. Independent Fraction renewal/input checks match. Verification 2 remains mandatory every attempt. B3 agent non-use: 3/(5+k), 4/(5+k) over unbounded failures violates recovered stationary finite-state qualification; no CLI refusal, constant substitution, cutoff or solver expansion. consumer-results.json retains actual outputs separately from expected comparisons. Historical producer notes are unchanged.', 'Observed B calculations; agent B3 applicability judgment',true);
  await click(a,'check-capacity');await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'result capacity fits');
  const successor=await save(a,4);assert.deepEqual(successor.files.slice(0,3),originalHead.files);progress.readback=true;
  const finalHistory=await a.eval("api('/api/work/'+work+'/history')");assert.deepEqual(finalHistory.revisions,[...intake.chain,transition,successor]);
  await click(a,'saved-context');await settled(a);assert.match(await a.eval("$('context-view').innerText"),/B3 agent non-use/);
  stage='successor-export';await a.eval("$('history-tools').open=true");await click(a,'export');await settled(a);await wait(async()=>(await readdir(downloads)).includes('planning-work.json'),'actual successor export');
  const exportBytes=await readFile(path.join(downloads,'planning-work.json'));await writeFile(path.join(output,'planning-work.json'),exportBytes);progress.export_downloaded=true;
  const exported=JSON.parse(exportBytes),validated=validateFileExport(manifest.scope,exported);assert.deepEqual(validated.chain,finalHistory.revisions);assert.equal(validated.bodies.length,4);
  for(const original of intake.bodies)assert.deepEqual(validated.bodies.find(f=>f.digest===original.digest),original);
  assert.equal(sha(await readFile(importPath)),manifest.export.sha256);progress.export_validated=true;
  await writeFile(path.join(output,'manifest.json'),JSON.stringify({pilot:'cloud-reuse-pilot-01',phase:'B',source_baseline:baseline,source_tree:sourceTree,pr_base:'d3f9f0d538078b33c7db892666d50755a71337bf',scope:manifest.scope,work_id:successor.work_id,head_revision:successor.revision,head_fingerprint:successor.fingerprint,export:{path:'planning-work.json',format:exported.format,bytes:exportBytes.length,sha256:sha(exportBytes),fingerprint:exported.fingerprint},revisions:validated.chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint})),selected_files:successor.files,original_revisions_and_bodies_unchanged:true,qualification_ref:qualification.source_ref},null,2)+'\n');
  await writeFile(path.join(output,'calculations.json'),JSON.stringify({calculations,B3:b3},null,2)+'\n');
  // Close the successful fixture rather than resetting it; all accepted writes
  // remain until parent-owned disposable cleanup after safe evidence retention.
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);
  for(const c of clients.splice(0))await c.close();await local.close();
  stage='corruption-fixture';check='different empty disposable store; fresh authentication';
  local=await startLocal({root:path.join(root,'corruption-runtime'),bindings:{RECONSTRUCTION_MODE:'quiesced-empty-store'}});
  const controlBefore=await counts(local);assert.deepEqual(controlBefore,{works:0,revisions:0,files:0,erased:0});
  const control=await page();await login(control);stage='corruption-control';
  // Change exactly one body character in a byte-copy; retain checksums and all
  // other bytes. Never decode or execute the corrupt body as program input.
  const originalText=bytes.toString(),marker='"data":"',position=originalText.indexOf(marker)+marker.length;
  assert(position>=marker.length);assert(/[A-Za-z0-9+/]/.test(originalText[position]));
  const changed=originalText[position]==='A'?'B':'A';
  const corruptBytes=Buffer.from(originalText.slice(0,position)+changed+originalText.slice(position+1));
  assert.equal(corruptBytes.length,bytes.length);assert.equal([...bytes].filter((v,i)=>v!==corruptBytes[i]).length,1);
  const controlPath=path.join(selected,'corrupt-export.json');await writeFile(controlPath,corruptBytes);
  const corrupt=JSON.parse(corruptBytes);assert.equal(corrupt.fingerprint,imported.fingerprint);assert.deepEqual(corrupt.revisions,imported.revisions);
  for(let i=0;i<corrupt.files.length;i++){assert.equal(corrupt.files[i].digest,imported.files[i].digest);assert.equal(corrupt.files[i].bytes,imported.files[i].bytes);}
  check='one normal authenticated reconstruction refusal';
  const rejection=await control.eval(`(async()=>{try{await api('/api/reconstruct-files',{export:${JSON.stringify(corrupt)},confirm:'reconstruct-empty-store'});return {accepted:true};}catch(e){return {accepted:false,status:e.status??null,code:e.message};}})()`);
  assert.deepEqual(rejection,{accepted:false,status:409,code:'export_integrity'});
  const controlAfter=await counts(local);assert.deepEqual(controlAfter,controlBefore);
  const list=await control.eval("api('/api/works')");assert.deepEqual(list.items,[]);assert.equal(list.next,null);progress.corruption_control=true;
  await writeFile(path.join(output,'corruption-control.json'),JSON.stringify({mutated_bytes:1,position,original_character:originalText[position],replacement_character:changed,original_sha256:sha(bytes),corrupt_sha256:sha(corruptBytes),embedded_checksums_unchanged:true,route:'/api/reconstruct-files',submitted_once:true,rejection,stage:'validateFileExport: package checksum before chain/body admission or reconstruct',before:controlBefore,after:controlAfter,ordinary_list_empty:true,corrupt_content_executed:false,scope:'corruption refusal and no partial admission; not malicious-author authenticity or arbitrary crash recovery'},null,2)+'\n');
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);assert.deepEqual(failures,[]);
  assert.equal(traffic.filter(t=>t.path.endsWith('/save')).length,2);assert.equal(traffic.filter(t=>t.method==='POST'&&t.path==='/api/reconstruct-files').length,2);
  await writeFile(path.join(output,'consumer-observation.json'),JSON.stringify({phase:'B',result:'consumer ready for review',host:process.platform,browser_version:(await readCommand(chrome,['--version'])).trim(),browser_sandbox_disabled:sandboxDisabled,repo_tooling_visible:true,blind_evaluation:false,authentication:'fresh synthetic local authentication on each disposable fixture; not live Access',ordinary_save_requests:2,reconstruction_submissions:2,unknown_outcome_resolutions:unknownResolutions,write_retries:0,runtime_external_requests:local.externalRequests(),intercepted_external_browser_requests:externalBrowserRequests,api_routes:traffic,provider_api_calls:0,other_usage:'unmeasured',elapsed_before_cleanup_ms:Date.now()-started},null,2)+'\n');
  stage='complete';console.log(JSON.stringify({consumer:'ready for review',work_id:successor.work_id,revision:successor.revision,export_bytes:exportBytes.length,export_sha256:sha(exportBytes),corruption_rejection:rejection}));
} catch(error){await writeFile(path.join(output,'failed-attempt.json'),JSON.stringify({phase:'B',stage,check,diagnostic:safeError(error),readiness:lastReadiness,progress,observed_save_requests:traffic.filter(t=>t.path.endsWith('/save')).length,unknown_outcome_resolutions:unknownResolutions,browser_diagnostics:[...browserDiagnostics],unexpected_failures:failures},null,2)+'\n');throw new Error('pilot_failed:'+stage+':'+check);}

finally {
  const cleanupFailures=[];
  for(const c of clients)try{await c.close();}catch{cleanupFailures.push('cdp_close_failed');}
  if(browser)try{await terminateOwnedProcessTree(browser);}catch{cleanupFailures.push('browser_process_cleanup_failed');}
  if(local)try{await local.close();}catch{cleanupFailures.push('worker_cleanup_failed');}
  const browserListenerClosed=debug?await portClosed(debug):true;
  if(!browserListenerClosed)cleanupFailures.push('browser_listener_residue');
  await writeFile(path.join(output,'fixture-cleanup.json'),JSON.stringify({stage,owned_browser_processes_remaining:owned.size,
    worker_disposed:!!local&&!cleanupFailures.includes('worker_cleanup_failed'),browser_listener_closed:browserListenerClosed,
    failures:cleanupFailures,phase:'B'},null,2)+'\n');
  await writeFile(path.join(output,'diagnostics.json'),JSON.stringify({stage,check,progress,readiness:lastReadiness,
    observed_save_requests:traffic.filter(t=>t.path.endsWith('/save')).length,unknown_outcome_resolutions:unknownResolutions,
    browser_diagnostics:[...browserDiagnostics],browser_spawn_error:browser?.spawnErrorCode??null,browser_exit:browser?.exitResult??null,
    intercepted_external_browser_requests:externalBrowserRequests,worker_external_requests:local?.externalRequests()??null,
    unexpected_failures:failures,elapsed_including_fixture_cleanup_ms:Date.now()-started,phase:'B'},null,2)+'\n');
  assert.deepEqual(cleanupFailures,[]);assert.equal(owned.size,0);
}
