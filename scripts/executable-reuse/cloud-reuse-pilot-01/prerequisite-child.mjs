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
import { pilotArguments, workspaceReadinessExpression } from './preparation.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const options=pilotArguments(process.argv.slice(2)),output=path.resolve(options.output),root=process.env.AUGNES_CANONICAL_TEMP_ROOT;
assert(root,'Owned prerequisite root required.');
const owned=new Set(),clients=[],traffic=[],failures=[],browserDiagnostics=new Set();
let local,browser,debug,stage='child-process',check='bounded nested child',externalBrowserRequests=0,lastReadiness=null;
const started=Date.now(),observations={child_process:false,loopback:false,worker:false,login_initial_list:false};
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>p&&existsSync(p));
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
function safeError(error,depth=0){return {name:safeClass(error?.name),code:typeof error?.code==='string'&&/^(?:ERR_[A-Z_]+|E[A-Z]+|CDP_TIMEOUT|BROWSER_[A-Z_]+)$/.test(error.code)?error.code:null,
  syscall:['listen','bind','connect','spawn','spawnSync'].includes(error?.syscall)?error.syscall:null,
  errno:Number.isInteger(error?.errno)?error.errno:null,evaluation:error?.pilot_diagnostic??null,
  cause:depth<2&&error?.cause?safeError(error.cause,depth+1):null};}
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
async function loopback(){
  const sockets=new Set(),server=net.createServer(c=>{sockets.add(c);c.on('error',()=>{});c.on('close',()=>sockets.delete(c));c.end('ok');});
  let client,timer;
  try{check='loopback listen';await new Promise((ok,no)=>{timer=setTimeout(()=>no(Object.assign(new Error('socket_timeout'),{code:'BROWSER_CHECK_TIMEOUT'})),5000);server.once('error',no);server.listen(0,'127.0.0.1',ok);});clearTimeout(timer);
    check='loopback connect and exchange';const port=server.address().port;let text='';
    await new Promise((ok,no)=>{client=net.connect(port,'127.0.0.1');client.setTimeout(5000,()=>client.destroy(Object.assign(new Error('socket_timeout'),{code:'BROWSER_CHECK_TIMEOUT'})));client.once('error',no);client.on('data',c=>text+=c);client.once('end',ok);});assert.equal(text,'ok');
    check='loopback close';
  }finally{clearTimeout(timer);client?.destroy();for(const c of sockets)c.destroy();if(server.listening)await new Promise(ok=>server.close(ok));}
  assert.equal(server.listening,false);
}
try{
  let stdout='';const probe=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'prerequisite nested child',command:process.execPath,args:['-e',"process.stdout.write('child-ok')"],cwd:repo,env:process.env,timeoutMs:10000,stdout:{write(c){stdout+=c;}},stderr:{write(){} }});
  await writeFile(path.join(output,'child-process.json'),JSON.stringify(probe,null,2)+'\n');assert.equal(canonicalChildAcceptanceFailure(probe,{requireNaturalExit:true}),null);assert.equal(stdout,'child-ok');observations.child_process=true;
  stage='loopback';await loopback();observations.loopback=true;
  stage='worker-initialization';check='one existing startLocal, reconstruction disabled';
  local=await startLocal({root:path.join(root,'prerequisite-runtime'),bindings:{RECONSTRUCTION_MODE:''}});observations.worker=true;
  const count=await local.db.prepare('SELECT (SELECT count(*) FROM web_planning_revision) revisions,(SELECT count(*) FROM web_planning_file) files,(SELECT count(*) FROM web_planning_erased) erased').first();assert.deepEqual(count,{revisions:0,files:0,erased:0});
  debug=await availablePort();assert(chrome,'Real browser unavailable.');stage='browser-launch';check='owned fresh profile';
  const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(options.unsandboxed?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(root,'prerequisite-profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
  browser=registerOwnedChild(owned,child,{label:'pilot-prerequisite-browser'});
  child.stderr.on('data',chunk=>{const text=chunk.toString().slice(0,8192);for(const [pattern,code] of [[/SUID sandbox|No usable sandbox/,'browser_sandbox_unavailable'],[/Operation not permitted|Permission denied/,'browser_permission_refused']])if(pattern.test(text))browserDiagnostics.add(code);});
  await wait(async()=>{if(browser.exited||browser.spawnErrorCode)throw Object.assign(new Error('browser_launch_failed'),{code:'BROWSER_LAUNCH_FAILED'});try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch(error){if(error.cause?.code==='ECONNREFUSED')return false;throw error;}},'browser debug listener');
  async function login(c){stage='fresh-local-authentication';await navigate(c,local.origin+'/_local/login');await wait(()=>c.eval("document.title==='Local synthetic workspace'&&!!document.querySelector('form[method=post] button')"),'local login');await c.eval("document.querySelector('form button').click()");await readyWorkspace(c);}
  const a=await page();await login(a);assert.equal(lastReadiness.list_state,'empty');observations.login_initial_list=true;
  assert.deepEqual(await local.db.prepare('SELECT (SELECT count(*) FROM web_planning_revision) revisions,(SELECT count(*) FROM web_planning_file) files,(SELECT count(*) FROM web_planning_erased) erased').first(),count);
  assert.equal(local.externalRequests(),0);assert.equal(externalBrowserRequests,0);assert.deepEqual(failures,[]);
  assert(traffic.every(t=>t.method==='GET'&&t.path==='/api/works'),'Only initial list read is allowed.');stage='complete';
}catch(error){await writeFile(path.join(output,'failure.json'),JSON.stringify({stage,check,location:stage==='loopback'?'node:net; prerequisite-child.mjs loopback':stage==='worker-initialization'?'scripts/web-planning-local-runtime.mjs startLocal':'prerequisite-child.mjs',diagnostic:safeError(error)},null,2)+'\n');process.exitCode=1;}
finally{
  const cleanupFailures=[];
  for(const c of clients)try{await c.close();}catch{cleanupFailures.push('cdp_close_failed');}
  if(browser)try{await terminateOwnedProcessTree(browser);}catch{cleanupFailures.push('browser_process_cleanup_failed');}
  if(local)try{await local.close();}catch{cleanupFailures.push('worker_cleanup_failed');}
  const browserListenerClosed=debug?await portClosed(debug):true;
  if(!browserListenerClosed)cleanupFailures.push('browser_listener_residue');
  await writeFile(path.join(output,'result.json'),JSON.stringify({stage,check,observations,all_prerequisites_pass:Object.values(observations).every(Boolean)&&cleanupFailures.length===0,readiness:lastReadiness,api_routes:traffic,browser_diagnostics:[...browserDiagnostics],unexpected_failures:failures,cleanup:{owned_browser_processes_remaining:owned.size,worker_returned:!!local,worker_disposed:!!local&&!cleanupFailures.includes('worker_cleanup_failed'),browser_listener_closed:browserListenerClosed,failures:cleanupFailures},elapsed_including_fixture_cleanup_ms:Date.now()-started,reconstruction_submissions:0,work_saves:0,case_calculations:0,corrupt_imports:0},null,2)+'\n');
  assert.deepEqual(cleanupFailures,[]);assert.equal(owned.size,0);
}
