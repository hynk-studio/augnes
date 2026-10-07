import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
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

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const baseline='b73e5012c699f85a9e3b643b6cba82f8f195d3ce';
const sourceTree='5443ce03a9d193c03274379938fa1b391512ad25';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT,output=path.resolve(process.argv[2]);
assert(root,'Owned fixture root required.');
assert.equal(execFileSync('git',['rev-parse',baseline+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim(),sourceTree);
assert.equal(execFileSync('git',['diff',baseline,'--','apps/web_planning','scripts/web-planning-local-runtime.mjs',
  'scripts/web-planning-local-ingress.ts','scripts/build-web-planning.mjs',
  'scripts/executable-reuse/workflow_cost.py','scripts/executable-reuse/exact_linear.py'],{cwd:repo,encoding:'utf8'}),'');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const owned=new Set(),clients=[],traffic=[],failures=[];
let local,browser,debug,stage='setup',externalBrowserRequests=0,unknownResolutions=0;
const started=Date.now();
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>p&&existsSync(p));
assert(chrome,'Real browser unavailable.');
class CDP {
  constructor(url){this.ws=new WebSocket(url);this.next=1;this.pending=new Map();this.handlers=[];}
  async open(){await new Promise((ok,no)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',no,{once:true});});
    this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.no(new Error(m.error.message)):p.ok(m.result);}}else for(const fn of this.handlers)fn(m);});return this;}
  send(method,params={}){return new Promise((ok,no)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);no(new Error('cdp_timeout:'+method));},15000);this.pending.set(id,{ok,no,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,'Browser evaluation failed.');return r.result.value;}
  async close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.no(new Error('cdp_closed'));}this.pending.clear();await new Promise(ok=>{this.ws.addEventListener('close',ok,{once:true});this.ws.close();});}
}
async function wait(fn,label){const deadline=Date.now()+15000;while(Date.now()<deadline){if(await fn())return;await delay(80);}throw new Error('browser_wait:'+label);}
const click=(c,id)=>c.eval(`document.getElementById(${JSON.stringify(id)}).click()`);
const set=(c,id,value)=>c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const settled=c=>wait(()=>c.eval('!busy'),'settled');
async function navigate(c,url){await c.send('Page.navigate',{url});await wait(()=>c.eval("document.readyState==='complete'"),'document');}
async function page(){const target=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json();
  const c=await new CDP(target.webSocketDebuggerUrl).open();clients.push(c);
  await c.send('Network.enable');await c.send('Runtime.enable');await c.send('Page.enable');
  c.handlers.push(m=>{
    if(m.method==='Runtime.exceptionThrown')failures.push('browser_exception');
    if(m.method==='Network.requestWillBeSent'&&m.params.request.url.startsWith(local.origin+'/api/'))traffic.push({method:m.params.request.method,path:new URL(m.params.request.url).pathname});
    if(m.method==='Network.loadingFailed')failures.push('browser_request_failed');
    if(m.method==='Fetch.requestPaused'){
      const p=m.params,allowed=p.request.url.startsWith(local.origin+'/');
      if(!allowed)externalBrowserRequests++;
      c.send(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:p.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})}).catch(()=>failures.push('interception_failed'));
    }
  });
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});return c;
}
async function save(c,n){await click(c,'save');
  await wait(()=>c.eval(`$('saved-label').textContent.startsWith('Saved revision ${n} ')||!$('uncertain').hidden||!$('conflict').hidden`),'save outcome');
  if(await c.eval("!$('uncertain').hidden")){unknownResolutions++;await settled(c);await click(c,'resolve-save');}
  await wait(()=>c.eval(`$('saved-label').textContent.startsWith('Saved revision ${n} ')`),'saved '+n);await settled(c);return c.eval('saved');
}
async function note(c,text,source,dependencies=false){await click(c,'add-note');await c.eval(`(()=>{const row=$('notes').lastElementChild;row.querySelector('[data-field=text]').value=${JSON.stringify(text)};row.querySelector('[data-field=source]').value=${JSON.stringify(source)};row.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));${dependencies?"const deps=row.querySelector('.dependencies');for(const o of deps.options)o.selected=true;deps.dispatchEvent(new Event('change',{bubbles:true}));":''}})()`);}
async function select(c,files){const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#work-files'});await c.send('DOM.setFileInputFiles',{nodeId,files});await settled(c);}
async function python(label,args){let stdout='',stderr='';const result=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label,command:'python3',args,cwd:repo,env:process.env,timeoutMs:10000,
  stdout:{write(chunk){stdout+=chunk.toString();}},stderr:{write(chunk){stderr+=chunk.toString();}}});
  assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);assert.equal(stderr,'');return {result,stdout};}
async function portClosed(port){return new Promise(ok=>{const c=net.connect(port,'127.0.0.1');c.once('connect',()=>{c.destroy();ok(false);});c.once('error',()=>ok(true));});}
try {
  const sourceFiles=[];
  const selected=path.join(root,'selected'),downloads=path.join(root,'downloads');await mkdir(selected);await mkdir(downloads);
  for(const name of ['workflow_cost.py','exact_linear.py']){const relative='scripts/executable-reuse/'+name,bytes=await readFile(path.join(repo,relative));
    assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+relative],{cwd:repo}));await writeFile(path.join(selected,name),bytes);
    sourceFiles.push({name,repository_path:relative,bytes:bytes.length,sha256:sha(bytes)});}
  local=await startLocal({root:path.join(root,'runtime'),bindings:{RECONSTRUCTION_MODE:''}});
  debug=await availablePort();
  // Prepared Cloud Chromium's SUID helper is unavailable. This synthetic,
  // loopback-only development fixture does not claim browser sandbox isolation.
  const sandboxDisabled=process.platform==='linux';
  const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(sandboxDisabled?['--no-sandbox']:[]),
    '--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,'chrome-profile')}`,'about:blank'],{stdio:'ignore',detached:true});
  browser=registerOwnedChild(owned,child,{label:'pilot-producer-browser'});
  await wait(async()=>{try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch{return false;}},'browser');
  const a=await page();await navigate(a,local.origin+'/_local/login');await wait(()=>a.eval("!!document.querySelector('form button')"),'login');
  await a.eval("document.querySelector('form button').click()");await wait(()=>a.eval("!!document.getElementById('new-work')&&!!document.getElementById('list-state')&&document.getElementById('list-state').textContent!=='Reading saved work…'"),'workspace');
  stage='revision-1';await click(a,'new-work');await set(a,'goal','cloud-reuse-pilot-01');
  await set(a,'criteria','Retain exact qualified callable and dependency bytes\nRecord one stipulated producer calculation and preserve history');
  await set(a,'non-goals','Phase B or reconstruction\nEmpirical probabilities, live hosting, comparative usefulness or integration approval');
  await note(a,`Application/source baseline ${baseline}; tree ${sourceTree}. Exact checked-in sources: ${sourceFiles.map(f=>`${f.name}: ${f.bytes} bytes, SHA-256 ${f.sha256}`).join('; ')}. workflow_cost.py requires exact_linear.py in the same directory and Python >=3.9 standard library (argparse, json, re, fractions). exact_linear.py retains the qualified source-derived elimination method documented in scripts/executable-reuse/README.md (#1375); the private historical package was not fetched. Both files are required together.`, 'Pinned checked-in source; synthetic producer attribution');
  await note(a,'Inputs are stipulated, not empirical or causal estimates. Mandatory verification is incurred on every attempt and remains mandatory. Optional inspection occurs before every attempt. Qualified stationary finite-state scope: 1–8 square equations, integer/Fraction inputs within 64-bit numerator/denominator bounds, nonnegative costs and transition probabilities with row sums <=1; all states must reach completion. Closed/non-completing chains return no finite answer. History-dependent probabilities, infinite states and larger problems are outside this slice. Retention/delivery does not establish downstream usefulness or execution authority.', 'Qualified callable README and explicit pilot conditions',true);
  await select(a,sourceFiles.map(f=>path.join(selected,f.name)));await wait(()=>a.eval('selectedFiles.length===2'),'source files');
  for(let i=0;i<2;i++)await a.eval(`(()=>{const e=$('file-role-${i}');e.value='source';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const first=await save(a,1);assert.equal(first.files.length,2);
  stage='calculation';const help=await python('cli-help',['-E','-s','-B','scripts/executable-reuse/workflow_cost.py','--help']);
  await writeFile(path.join(output,'cli-help.txt'),help.stdout);
  const args=['-E','-s','-B','scripts/executable-reuse/workflow_cost.py','--attempt','9','--verification','3','--repair','4','--direct-success','2/5','--inspection','1','--inspected-success','2/3'];
  const calculation=await python('producer-calculation',args);await writeFile(path.join(output,'producer-stdout.json'),calculation.stdout);
  await writeFile(path.join(selected,'producer-stdout.json'),calculation.stdout);
  const oracle=await python('independent-oracle',['-E','-s','-B',path.relative(repo,path.join(here,'oracle.py')),path.join(output,'producer-stdout.json')]);
  const observed=JSON.parse(calculation.stdout),comparison=JSON.parse(oracle.stdout);
  await writeFile(path.join(output,'execution.json'),JSON.stringify({phase:'A',command:['python3',...args],inputs:observed.inputs,source_baseline:baseline,source_files:sourceFiles,
    stdout_file:'producer-stdout.json',stdout_sha256:sha(Buffer.from(calculation.stdout)),stderr:'',execution:calculation.result,
    help_execution:help.result,oracle:comparison,oracle_execution:oracle.result,phase_b:'NOT RUN'},null,2)+'\n');
  stage='revision-2';await select(a,[path.join(selected,'producer-stdout.json')]);await wait(()=>a.eval('selectedFiles.length===3'),'result selection');
  await a.eval("(()=>{const e=$('file-role-2');e.value='results';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await note(a,`Actual producer invocation: python3 ${args.join(' ')}; exit ${calculation.result.exit_code}. Actual stdout retained as producer-stdout.json. Direct expected work ${observed.workflows.direct.expected_work}; inspected ${observed.workflows.inspected.expected_work}; inspection-minus-direct ${observed.inspection_minus_direct}; ${observed.comparison}. Independent Fraction-only renewal oracle (attempt + verification + inspection + (1-p)*repair)/p, with direct inspection zero, matched: ${JSON.stringify(comparison)}. Required verification remains mandatory. This is one exposed constructed Cloud development example; no causal success-rate improvement, production Access qualification, separate-task reuse or general usefulness/time savings is established. History-dependent probabilities remain out of scope. Phase B NOT RUN.`, 'Observed CLI execution and independent renewal counting',true);
  assert.deepEqual((await a.eval('selectedFiles')).slice(0,2),first.files);
  const second=await save(a,2);assert.deepEqual(second.files.slice(0,2),first.files);
  stage='readback-export';const readback=await page();await navigate(readback,local.origin+'/');
  await wait(()=>readback.eval("!![...(document.getElementById('work-list')?.querySelectorAll('button')??[])].find(b=>b.textContent==='cloud-reuse-pilot-01')"),'reopen');
  await readback.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='cloud-reuse-pilot-01').click()");
  await wait(()=>readback.eval("$('saved-label').textContent.startsWith('Saved revision 2 ')"),'readback');await settled(readback);
  assert.deepEqual(await readback.eval('saved'),second);await click(readback,'saved-context');await settled(readback);
  assert.match(await readback.eval("$('context-view').innerText"),/History-dependent probabilities/);
  assert.equal(await readback.eval("document.querySelectorAll('#context-view [data-file-url]').length"),3);
  await readback.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  await readback.eval("$('history-tools').open=true");await click(readback,'export');await settled(readback);
  await wait(async()=>(await readdir(downloads)).includes('planning-work.json'),'export download');
  const bytes=await readFile(path.join(downloads,'planning-work.json')),exported=JSON.parse(bytes);
  assert.equal(exported.format,'web_planning_export.v0.3');const validated=validateFileExport(fixtureScope,exported);
  assert.deepEqual(validated.chain,[first,second]);assert.equal(validated.bodies.length,3);
  for(const body of validated.bodies){const descriptor=second.files.find(f=>f.digest===body.digest);assert(descriptor);assert.deepEqual(Buffer.from(body.data,'base64'),await readFile(path.join(selected,descriptor.name)));}
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);assert.deepEqual(failures,[]);
  assert.equal(traffic.filter(t=>t.path.endsWith('/save')).length,2);assert(!traffic.some(t=>t.path.includes('reconstruct')));
  // Copy the actual browser download; never reserialize or sanitize its checksum.
  await writeFile(path.join(output,'planning-work.json'),bytes);
  await writeFile(path.join(output,'manifest.json'),JSON.stringify({pilot:'cloud-reuse-pilot-01',phase:'A',source_baseline:baseline,source_tree:sourceTree,
    export:{path:'planning-work.json',format:exported.format,bytes:bytes.length,sha256:sha(bytes),fingerprint:exported.fingerprint},
    scope:fixtureScope,work_id:second.work_id,head_revision:second.revision,head_fingerprint:second.fingerprint,
    revision_1:{revision:first.revision,fingerprint:first.fingerprint,unchanged_in_complete_export:true},
    revision_2_readback_equal:true,selected_files:second.files,source_files:sourceFiles,
    result_file:{name:'producer-stdout.json',bytes:Buffer.byteLength(calculation.stdout),sha256:sha(Buffer.from(calculation.stdout))},phase_b:'NOT RUN'},null,2)+'\n');
  await writeFile(path.join(output,'producer-observation.json'),JSON.stringify({phase:'A',host:process.platform,authentication:'existing synthetic local login/session adapter; not live Cloudflare Access',
    browser_version:execFileSync(chrome,['--version'],{encoding:'utf8'}).trim(),browser_sandbox_disabled:sandboxDisabled,
    local_worker_origin:local.origin,browser_debug_port:debug,ordinary_save_requests:2,unknown_outcome_resolutions:unknownResolutions,write_retries:0,
    runtime_external_requests:local.externalRequests(),intercepted_external_browser_requests:externalBrowserRequests,
    browser_failures:failures,api_routes:traffic,revision_1_preserved:true,revision_2_readback:true,
    elapsed_before_cleanup_ms:Date.now()-started,provider_api_calls:0,usage_other_than_observed:'unmeasured',phase_b:'NOT RUN'},null,2)+'\n');
  stage='complete';console.log(JSON.stringify({producer:'ready for review',work_id:second.work_id,export_bytes:bytes.length,export_sha256:sha(bytes),oracle:comparison,phase_b:'NOT RUN'}));
} catch(error){await writeFile(path.join(output,'failed-attempt.json'),JSON.stringify({phase:'A',stage,error_name:error.name,
  error_code:typeof error.code==='string'?error.code:null,phase_b:'NOT RUN'},null,2)+'\n');throw error;}
finally {
  const cleanupFailures=[];
  for(const c of clients)try{await c.close();}catch{cleanupFailures.push('cdp_close_failed');}
  if(browser)try{await terminateOwnedProcessTree(browser);}catch{cleanupFailures.push('browser_process_cleanup_failed');}
  if(local)try{await local.close();}catch{cleanupFailures.push('worker_cleanup_failed');}
  const browserListenerClosed=debug?await portClosed(debug):true;
  if(!browserListenerClosed)cleanupFailures.push('browser_listener_residue');
  await writeFile(path.join(output,'fixture-cleanup.json'),JSON.stringify({stage,owned_browser_processes_remaining:owned.size,
    worker_disposed:!!local&&!cleanupFailures.includes('worker_cleanup_failed'),browser_listener_closed:browserListenerClosed,
    failures:cleanupFailures,phase_b:'NOT RUN'},null,2)+'\n');
  assert.deepEqual(cleanupFailures,[]);assert.equal(owned.size,0);
}
