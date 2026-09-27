import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocal, availablePort } from './web-planning-local-runtime.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from './test-harness-process-lifecycle.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw new Error('owned_browser_root_required');
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].find(p=>p&&existsSync(p));
assert(chrome,'real_browser_unavailable');
const owned=new Set(),clients=[];let processRecord,local;let external=0,exceptions=0,saveRequests=0,lostResponse=false,unexpectedFailures=0;const expectedFailures=new Set();
class CDP {
 constructor(url){this.ws=new WebSocket(url);this.next=1;this.pending=new Map();this.handlers=[];}
 async open(){await new Promise((ok,no)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',no,{once:true});});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.no(new Error(m.error.message)):p.ok(m.result);}}else for(const fn of this.handlers)fn(m);});return this;}
 send(method,params={}){return new Promise((ok,no)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);no(new Error('cdp_timeout:'+method));},15000);this.pending.set(id,{ok,no,timer});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
 async close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.no(new Error('cdp_closed'));}this.pending.clear();await new Promise(resolve=>{this.ws.addEventListener('close',resolve,{once:true});this.ws.close();});}
}
async function wait(fn,label){const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await delay(80);}throw new Error('browser_wait:'+label);}
async function click(c,id){await c.eval(`document.getElementById(${JSON.stringify(id)}).click()`);}
async function set(c,id,value){await c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
async function state(c,expression){return c.eval(expression);}
async function visible(c,id){return c.eval(`!!document.getElementById(${JSON.stringify(id)})&&!document.getElementById(${JSON.stringify(id)}).hidden`);}
async function saved(c,n){await wait(()=>c.eval(`document.getElementById('saved-label')?.textContent.startsWith('Saved revision ${n} ')`),'saved '+n);}
async function page(debug,origin){const target=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json();const c=await new CDP(target.webSocketDebuggerUrl).open();clients.push(c);
 await c.send('Network.enable');await c.send('Runtime.enable');await c.send('Page.enable');
 c.handlers.push(m=>{if(m.method==='Runtime.exceptionThrown')exceptions++;
   if(m.method==='Network.requestWillBeSent'){const u=m.params.request.url;if(u.startsWith('http')&&!u.startsWith(origin+'/'))external++;if(u.endsWith('/save'))saveRequests++;}
   if(m.method==='Network.loadingFailed'&&!expectedFailures.delete(m.params.requestId))unexpectedFailures++;});
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
 c.handlers.push(m=>{if(m.method==='Fetch.requestPaused') {const u=m.params.request.url;
   if(m.params.responseStatusCode!==undefined) {lostResponse=true;expectedFailures.add(m.params.networkId);c.send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'ConnectionClosed'}).catch(()=>{});}
   else if(u.startsWith(origin+'/'))c.send('Fetch.continueRequest',{requestId:m.params.requestId}).catch(()=>{});
   else {external++;c.send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'}).catch(()=>{});}}});
 return c;}
async function navigate(c,url){await c.send('Page.navigate',{url});await wait(()=>c.eval("document.readyState==='complete'"),'page complete');}
async function login(c,origin){await navigate(c,origin+'/_local/login');await wait(()=>c.eval("!!document.querySelector('form button')"),'login');await c.eval("document.querySelector('form button').click()");await wait(()=>c.eval("document.getElementById('list-state')?.textContent!=='Reading saved work…'&&!!document.getElementById('new-work')"),'workspace');}
async function reopen(c){await wait(()=>c.eval("document.querySelectorAll('#work-list button').length>0"),'saved list');await c.eval("document.querySelector('#work-list button').click()");await wait(()=>visible(c,'editor'),'editor');}
let checks=[];
try {
 local=await startLocal({root:path.join(root,'runtime')});const origin=local.origin;
 const debug=await availablePort();const profile=path.join(root,'chrome-profile'),downloads=path.join(root,'downloads');await mkdir(downloads);
 const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',detached:true});processRecord=registerOwnedChild(owned,child,{label:'web-planning-browser'});
 await wait(async()=>{try{return (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok;}catch{return false;}},'chrome');
 const a=await page(debug,origin);await login(a,origin);
 await a.send('Page.bringToFront');await a.eval("document.getElementById('new-work').focus()");await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await a.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await wait(()=>a.eval("document.activeElement.id==='goal'"),'keyboard new work');
 await set(a,'goal','Choose a quiet reading room');await set(a,'criteria','Preserve one owner\nReopen the plan');await set(a,'non-goals','No file uploads');
 await click(a,'add-note');await a.eval(`(()=>{const n=document.querySelector('.note');for(const [k,v] of Object.entries({text:'Do not treat an open issue as proof of unfinished implementation.',source:'Synthetic owner correction',label:'Changed assumption / user correction',provenance:'user_declaration',observed_at:'2026-09-20T12:00:00Z'})){n.querySelector('[data-field='+k+']').value=v;}})()`);
 await click(a,'add-note');await a.eval(`(()=>{const n=document.querySelectorAll('.note')[1];for(const [k,v] of Object.entries({text:'Evening noise remains unknown; measure it before choosing the room.',source:'Synthetic planning question',label:'Open question',provenance:'derived_interpretation'})){n.querySelector('[data-field='+k+']').value=v;}})()`);
 await click(a,'save');await saved(a,1);checks.push('keyboard create/edit/attributed save');
 const b=await page(debug,origin);await navigate(b,origin+'/');await reopen(b);await set(b,'goal','Retained competing draft');
 await set(a,'goal','First tab successor');await click(a,'save');await saved(a,2);
 await click(b,'save');await wait(()=>visible(b,'conflict'),'competing conflict');assert.equal(await b.eval("document.getElementById('goal').value"),'Retained competing draft');
 await click(b,'review-latest');await wait(()=>visible(b,'rebase-draft'),'review latest');assert.match(await b.eval("document.getElementById('conflict-latest').innerText"),/First tab successor/);
 await click(b,'rebase-draft');await click(b,'save');await saved(b,3);checks.push('conflict retains draft; explicit reviewed base and save');
 await click(a,'saved-context');await wait(()=>a.eval("document.getElementById('status').textContent.includes('head changed')"),'stale context');assert.equal(await a.eval("document.getElementById('context-view').innerText"),'');
 await click(a,'refresh-work');await saved(a,3);await click(a,'saved-context');await wait(()=>a.eval("document.querySelector('#context-view [data-revision]')?.dataset.revision==='3'"),'exact context');
 const context=await a.eval("document.getElementById('context-view').innerText");assert.match(context,/open issue/);assert.match(context,/Evening noise remains unknown/);assert.match(context,/No file uploads/);checks.push('stale binding refuses, explicit fresh Saved context preserves uncertainty');
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/save',requestStage:'Response'}]});
 await set(a,'goal','Survives a lost response and restart');const beforeRequests=saveRequests;await click(a,'save');await wait(()=>visible(a,'uncertain'),'lost response');assert.equal(saveRequests,beforeRequests+1);
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});await click(a,'resolve-save');await saved(a,4);assert.equal(saveRequests,beforeRequests+1);checks.push('real committed response loss, explicit outcome read, no automatic resend');
 const restart={root:path.join(root,'runtime'),port:Number(new URL(origin).port),bindings:local.env,code:local.code};
 await a.send('Storage.clearDataForOrigin',{origin,storageTypes:'all'});
 await click(b,'saved-context');await wait(()=>b.eval("document.getElementById('status')?.textContent.includes('Access denied')"),'access loss clears private view');
 assert(!await b.eval("document.body.innerText.includes('Evening noise')"));
 await navigate(a,'about:blank');await navigate(b,'about:blank');
 await local.close();local=null;local=await startLocal(restart);await login(a,origin);await reopen(a);await saved(a,4);
 assert.equal(await a.eval("document.getElementById('goal').value"),'Survives a lost response and restart');await click(a,'saved-context');await wait(()=>a.eval("document.querySelector('#context-view [data-revision]')?.dataset.revision==='4'"),'reopened context');checks.push('browser storage cleared, workerd restart, server reopen');
 for(const [width,height] of [[390,844],[1200,800]]){await a.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});assert(await a.eval('document.documentElement.scrollWidth<=window.innerWidth'),'responsive overflow');}
 assert(await a.eval("[...document.querySelectorAll('input:not([type=hidden]),textarea,select')].every(e=>!!document.querySelector('label[for=\"'+e.id+'\"]'))"));checks.push('responsive widths and labelled keyboard controls');
 await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await a.eval("document.getElementById('history-tools').open=true");await click(a,'export');await wait(async()=> (await readdir(downloads)).some(p=>p.endsWith('.json')),'export download');
 const exported=JSON.parse(await readFile(path.join(downloads,(await readdir(downloads)).find(p=>p.endsWith('.json'))),'utf8'));assert.equal(exported.revisions.length,4);
 await click(a,'erase');await wait(()=>visible(a,'erase-confirm'),'erase confirmation');await click(a,'cancel-erase');assert(await visible(a,'editor'));await click(a,'erase');await click(a,'confirm-erase');await wait(()=>a.eval("document.getElementById('status').textContent.startsWith('Whole work erased')"),'whole erase');
 assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_erased').first()).n,1);checks.push('actual export download and exact whole-work erasure');
 await click(a,'signout');await wait(()=>a.eval("document.title==='Local synthetic workspace'"),'signout');assert(!await a.eval("document.body.innerText.includes('Evening noise')"));
 assert.equal(exceptions,0);assert.equal(external,0);assert.equal(unexpectedFailures,0);assert.equal(expectedFailures.size,0);
 console.log(JSON.stringify({web_planning_browser_checks:checks,actual_agent_read:false,sites_ingress_verified:false,external_requests:external,script_exceptions:exceptions}));
} finally {for(const c of clients)await c.close();if(processRecord)await terminateOwnedProcessTree(processRecord);if(local)await local.close();assert.equal(owned.size,0);console.log('web_planning_browser_cleanup_complete');}
