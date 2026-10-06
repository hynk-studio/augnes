import { browserFileJourney } from './browser-web-planning-files.mjs';
import { browserHistoryJourney } from './browser-web-planning-history.mjs';
import { advancedClock } from './web-planning-history-checks.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocal, availablePort, accessSimulation } from './web-planning-local-runtime.mjs';
import { buildCloudflarePlanning } from './build-web-planning.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from './test-harness-process-lifecycle.mjs';
import { browserCapacityJourney } from './browser-web-planning-capacity.mjs';
import { browserBranchJourney } from './browser-web-planning-branches.mjs';
import { assertReadOnlyRequestWindow, testReadOnlyRequestWindow } from './browser-web-planning-requests.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw new Error('owned_browser_root_required');
const chrome=[process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].find(p=>p&&existsSync(p));
assert(chrome,'real_browser_unavailable');
const owned=new Set(),clients=[];let processRecord,local;let external=0,exceptions=0,saveRequests=0,lostResponse=false,unexpectedFailures=0;const expectedFailures=new Set();
const requests=[],responses=[],interceptionErrors=[],acknowledgementChecks=[];
const requestSources=new WeakMap();
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
 c.targetId=target.id;c.origin=origin;
 c.direct=origin.startsWith('https://127.0.0.1:');
 if(c.direct)await c.send('Security.setIgnoreCertificateErrors',{ignore:true}); // Owned loopback workerd certificate only; external traffic is refused below.
 await c.send('Network.enable');await c.send('Runtime.enable');await c.send('Page.enable');
 c.handlers.push(m=>{if(m.method==='Runtime.exceptionThrown')exceptions++;
   if(m.method==='Network.requestWillBeSent'){const u=m.params.request.url;if(u.startsWith('http')&&!u.startsWith(origin+'/'))external++;if(u.endsWith('/save'))saveRequests++;
     if(u.startsWith(origin+'/api/')){const request={path:new URL(u).pathname+new URL(u).search,method:m.params.request.method,body:m.params.request.postData};
       requestSources.set(request,{target_id:c.targetId,request_id:m.params.requestId,document_url:m.params.documentURL,initiator:m.params.initiator});requests.push(request);}}
   if(m.method==='Network.responseReceived'&&m.params.response.url.startsWith(origin+'/api/'))responses.push({path:new URL(m.params.response.url).pathname,status:m.params.response.status});
   if(m.method==='Network.loadingFailed'&&!expectedFailures.delete(m.params.requestId))unexpectedFailures++;});
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
 c.handlers.push(m=>{if(m.method==='Fetch.requestPaused')intercept(c,m.params,origin).catch(e=>interceptionErrors.push(e.message));});
 return c;}
async function intercept(c,p,origin){
 const u=p.request.url;
 if(c.beforeRequest&&u===origin+c.beforeRequest.path&&p.request.method===c.beforeRequest.method){const before=c.beforeRequest;c.beforeRequest=null;await before.run();}
 if(c.direct&&u===origin+'/cdn-cgi/access/logout'){
   c.logoutObserved=true;
   await local.setOptions({access:undefined});
   return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from('<title>Simulated Access logout boundary</title>').toString('base64')});
 }
 if(c.accessBoundary&&u.startsWith(origin+'/api/')){
   const boundary=c.accessBoundary;c.accessBoundary=null;
   // Chrome reports the intentionally un-followed manual redirect as aborted.
   // Account for only this injected request; all other failures remain fatal.
   if(boundary==='redirect')expectedFailures.add(p.networkId);
   return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:boundary==='redirect'?302:200,responseHeaders:[{name:'Content-Type',value:'text/html'},{name:'Cache-Control',value:'no-store'},...(boundary==='redirect'?[{name:'Location',value:origin+'/_access_login'}]:[])],body:Buffer.from('<h1>Access login challenge</h1>').toString('base64')});
 }
 if(u.startsWith(origin+'/api/')&&u.endsWith('/capacity')&&p.responseStatusCode===undefined){
   if(c.holdCapacity){c.holdCapacity=false;c.heldCapacity=p;return;}
   if(c.capacityFailure){const failure=c.capacityFailure;c.capacityFailure=null;return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:failure==='invalid'?200:503,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'X-Web-Planning-Response',value:'1'}],body:Buffer.from(JSON.stringify(failure==='invalid'?{fits:true}:{error:'storage_unavailable'})).toString('base64')});}
 }
 if(u.startsWith(origin+'/api/work/')&&u.endsWith('/compare')&&p.responseStatusCode===undefined){
   if(c.beforeCompare){const before=c.beforeCompare;c.beforeCompare=null;await before();}
   const failure=c.compareFailure;c.compareFailure=null;
   if(failure==='transport'){expectedFailures.add(p.networkId);return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'ConnectionClosed'});}
   if(failure===503||failure===401)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:failure,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify({error:failure===503?'storage_unavailable':'access_denied'})).toString('base64')});
   if(failure===403){if(c.direct)await local.setOptions({access:undefined});await c.send('Network.clearBrowserCookies');return c.send('Fetch.continueRequest',{requestId:p.requestId,headers:Object.entries(p.request.headers).filter(([name])=>name.toLowerCase()!=='cookie').map(([name,value])=>({name,value}))});}
 }
 if(p.responseStatusCode!==undefined){
   if(c.failListAfterReply){
     assert.equal(p.responseStatusCode,200,'the save/resolve response must really succeed');
     c.acknowledgedReply={path:new URL(u).pathname,status:p.responseStatusCode};
     c.listFailure=c.failListAfterReply;c.failListAfterReply=null;
     // The acknowledged write/read finishes before the next request loses access.
     if(c.listFailure==='denied')await c.send('Network.clearBrowserCookies');
     return c.send('Fetch.continueRequest',{requestId:p.requestId});
   }
   lostResponse=true;expectedFailures.add(p.networkId);
   return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'ConnectionClosed'});
 }
 if(u===origin+'/api/works'&&c.listFailure){
   const failure=c.listFailure;c.listFailure=null;c.injectedListFailure=failure;
   if(failure==='http')return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from('{"error":"storage_unavailable"}').toString('base64')});
   if(failure==='transport'){expectedFailures.add(p.networkId);return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'ConnectionClosed'});}
   assert.equal(failure,'denied'); // Let the real local ingress reject the missing cookie.
 }
 if(u.startsWith(origin+'/'))return c.send('Fetch.continueRequest',{requestId:p.requestId});
 external++;return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});
}
async function failListAfterReply(c,route,failure){
 c.failListAfterReply=failure;c.injectedListFailure=null;c.acknowledgedReply=null;
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/'+route,requestStage:'Response'}]});
}
async function requestsOnly(c){await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});}
async function settled(c){await wait(()=>c.eval('!busy'),'client operation settled');}
async function readWindow(){
 const background=[];
 for(const c of clients){
   const state=await c.eval("typeof scope==='undefined'||accessLost||!$('editor')||$('editor').hidden?null:({document_url:location.href,client_url:location.origin+'/client.js',capacity:{path:saved?'/api/work/'+work+'/capacity':'/api/capacity',body:{...scope,...draft(false),...(saved?{expected:binding(saved)}:{})}}})");
   if(state)background.push({target_id:c.targetId,...state});
 }
 const start=requests.length;
 return {start,assert(expected,allowFocusReads=false){
   const recorded=requests.slice(start).map(r=>({...r,source:requestSources.get(r)}));
   const result=assertReadOnlyRequestWindow(recorded,{expected,background,allowFocusReads});
   console.log(JSON.stringify({read_only_request_window:{...result,requests:recorded.map(({method,path,source})=>({method,path,target_id:source.target_id,request_id:source.request_id,callers:source.initiator?.stack?.callFrames.map(f=>f.functionName)}))}}));
   return result;
 }};
}
async function contextRequest(c){return {target_id:c.targetId,method:'POST',...await c.eval("({path:'/api/work/'+work+'/context',body:{...scope,expected:binding(saved)}})")};}
async function overlapCapacity(c,{input=false}={}){
 const start=requests.length,route=await c.eval("saved?'/api/work/'+work+'/capacity':'/api/capacity'");
 // Exercise the normal input debounce or explicit capacity control. Await a
 // recorded request and its client completion, never a guessed timer duration.
 if(input)await set(c,'goal',await c.eval("$('goal').value"));else await click(c,'check-capacity');
 await wait(()=>requests.slice(start).some(r=>requestSources.get(r).target_id===c.targetId&&r.method==='POST'&&r.path===route),'scheduled capacity request');
 await wait(()=>c.eval("!capacityInFlight&&['fits','blocked','unavailable'].includes($('draft-capacity').dataset.state)"),'scheduled capacity completes');
}
async function revisionCount(){return (await local.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n;}
async function retainedAcknowledgement(c,n,failure){
 await settled(c);
 const observed=await c.eval(`({revision:saved?.revision,fingerprint:saved?.fingerprint,pendingCleared:pending===null,ticketCleared:saveTicket===null,status:$('status').textContent,label:$('saved-label').textContent,uncertain:!$('uncertain').hidden,changes:$('change-list').textContent,refreshList:!!$('refresh-list')&&!$('refresh-list').hidden})`);
 const row=await local.db.prepare('SELECT envelope FROM web_planning_revision WHERE revision=?').bind(n).first();
 const persisted=JSON.parse(row.envelope);
 assert.equal(await revisionCount(),n,'the acknowledgement must not add another revision');
 console.log(JSON.stringify({acknowledgement_observation:{failure,reply:c.acknowledgedReply,stored_revisions:await revisionCount(),...observed}}));
 assert.equal(c.injectedListFailure,failure);
 assert.equal(observed.revision,n);assert.equal(observed.fingerprint,persisted.fingerprint);
 assert(observed.pendingCleared&&observed.ticketCleared,'confirmed acknowledgement settles the original request');
 assert.equal(observed.uncertain,false,'a list failure must not offer a write retry');
 assert(observed.refreshList,'list-only recovery is available');
 assert.match(observed.status,new RegExp('Saved revision '+n));assert.match(observed.status,/list.*could not be refreshed/i);
 assert(!/unknown|No.*successful.save/i.test(observed.status));
 assert(observed.label.startsWith('Saved revision '+n+' '));
 assert(!observed.changes.includes('Non-goals edited.'),'empty non-goals remain unchanged after acknowledgement');
 await requestsOnly(c);const recovery=await readWindow(),stored=await revisionCount();
 c.beforeRequest={method:'GET',path:'/api/works',run:()=>overlapCapacity(c)};
 await click(c,'refresh-list');await settled(c);
 const traffic=recovery.assert([{target_id:c.targetId,method:'GET',path:'/api/works',body:undefined}]);
 assert(traffic.capacity>0,'list recovery overlaps the independent capacity scheduler');
 assert.equal(await revisionCount(),stored);assert.equal(await c.eval('saved.revision'),n);
 assert.equal(await visible(c,'refresh-list'),false);assert.match(await c.eval("$('status').textContent"),/Work list refreshed/);
 acknowledgementChecks.push({reply:c.acknowledgedReply.path.endsWith('/resolve')?'resolve':'save',failure,revision:n,list_recovery_requests:1,additional_writes:0,stored_revisions:stored});
}
async function navigate(c,url){await c.send('Page.navigate',{url});await wait(()=>c.eval("document.readyState==='complete'"),'page complete');}
async function login(c,origin){await navigate(c,origin+'/_local/login');await wait(()=>c.eval("!!document.querySelector('form button')"),'login');await c.eval("document.querySelector('form button').click()");await wait(()=>c.eval("document.getElementById('list-state')?.textContent!=='Reading saved work…'&&!!document.getElementById('new-work')"),'workspace');}
async function reopen(c){await wait(()=>c.eval("document.querySelectorAll('#work-list button').length>0"),'saved list');await c.eval("document.querySelector('#work-list button').click()");await wait(()=>visible(c,'editor'),'editor');}
let checks=[];
try {
 testReadOnlyRequestWindow();
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
 const read=await readWindow(),expectedContext=await contextRequest(b),storedBeforeRead=await revisionCount();
 for(const [width,height] of [[390,844],[1200,800]]){
   await b.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   await b.eval('window.scrollTo(0,0)');
   assert(await b.eval("(()=>{const r=$('saved-context').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;})()"),'fresh-read control in initial viewport '+width);
   await b.eval("$('saved-context').focus()");await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await settled(b);
   assert(await b.eval("document.activeElement.id==='context-view'&&Math.abs($('context-view').getBoundingClientRect().top)<2"),'successful read receives focus at the start of the context');
   assert.equal(await b.eval("$('goal').value"),'Retained competing draft');assert.equal(await b.eval('dirty'),true);
   assert.match(await b.eval("$('context-view').innerText"),/Choose a quiet reading room/);assert(!await b.eval("$('context-view').innerText.includes('Retained competing draft')"));
 }
 assert.equal(await revisionCount(),storedBeforeRead);
 // Keyboard focus may also trigger the existing window-focus access read.
 read.assert([expectedContext,expectedContext],true);
 checks.push('Saved context reachable at 390/1200; keyboard read focuses visible result, preserves unsaved draft and writes no revision');
 await set(a,'goal','First tab successor');await click(a,'save');await saved(a,2);
 await click(b,'check-capacity');await wait(()=>b.eval("$('draft-capacity').dataset.state==='unavailable'"),'stale capacity withheld');
 await click(b,'save');await settled(b);await wait(()=>visible(b,'conflict'),'competing conflict');assert.equal(await b.eval("document.getElementById('goal').value"),'Retained competing draft');
 await click(b,'review-latest');await wait(()=>visible(b,'rebase-draft'),'review latest');assert.match(await b.eval("document.getElementById('conflict-latest').innerText"),/First tab successor/);
 await click(b,'rebase-draft');await click(b,'save');await saved(b,3);checks.push('conflict retains draft; explicit reviewed base and save');
 await a.eval("$('saved-context').focus()");await click(a,'saved-context');await wait(()=>a.eval("document.getElementById('status').textContent.includes('head changed')"),'stale context');assert.equal(await a.eval("document.getElementById('context-view').innerText"),'');assert.equal(await a.eval('document.activeElement.id'),'saved-context','refused read does not focus an empty result');
 await click(a,'refresh-work');await saved(a,3);await click(a,'saved-context');await wait(()=>a.eval("document.querySelector('#context-view [data-revision]')?.dataset.revision==='3'"),'exact context');
 const context=await a.eval("document.getElementById('context-view').innerText");assert.match(context,/open issue/);assert.match(context,/Evening noise remains unknown/);assert.match(context,/No file uploads/);checks.push('stale binding refuses, explicit fresh Saved context preserves uncertainty');
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/save',requestStage:'Response'}]});
 await set(a,'goal','Survives a lost response and restart');const beforeRequests=saveRequests;await click(a,'save');await wait(()=>visible(a,'uncertain'),'lost response');assert.equal(saveRequests,beforeRequests+1);
 const originalPending=await a.eval('JSON.stringify(pending)'),originalSave=requests.filter(r=>r.path.endsWith('/save')).at(-1);
 await settled(a);await click(a,'retry-save');await settled(a);assert.equal(await visible(a,'uncertain'),true);assert.equal(saveRequests,beforeRequests+2);
 assert.equal(await a.eval('JSON.stringify(pending)'),originalPending);assert.deepEqual(requests.filter(r=>r.path.endsWith('/save')).at(-1),originalSave);assert.equal(await revisionCount(),4);
 await requestsOnly(a);await click(a,'resolve-save');await saved(a,4);await settled(a);assert.equal(saveRequests,beforeRequests+2);
 assert.equal(requests.filter(r=>r.path.endsWith('/resolve')).at(-1).body,originalSave.body);assert.equal(await revisionCount(),4);checks.push('real committed response loss, exact explicit retry and outcome read, no automatic resend');
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
 await settled(a);await click(a,'new-work');await set(a,'goal','Private acknowledged plan');await set(a,'criteria','Keep one saved revision');
 for(const [index,failure] of ['http','transport'].entries()){
   if(index)await set(a,'goal','Private acknowledged plan after transport failure');
   await failListAfterReply(a,'save',failure);const before=requests.length;
   await click(a,'save');await retainedAcknowledgement(a,index+1,failure);
   assert.equal(requests.slice(before).filter(r=>r.path.endsWith('/save')).length,1);
   assert.equal(requests.slice(before).filter(r=>r.path.endsWith('/resolve')).length,0);
   assert.equal(requests.slice(before).filter(r=>r.path==='/api/works').length,2,'one failed list read and one explicit list recovery');
 }
 await navigate(a,origin+'/');await reopen(a);await saved(a,2);await settled(a);
 assert.match(await a.eval("$('change-list').textContent"),/No definition or selection edits/);
 await set(a,'non-goals','No bookings');assert.match(await a.eval("$('change-list').textContent"),/Non-goals edited/);
 await set(a,'non-goals','');assert.match(await a.eval("$('change-list').textContent"),/No definition or selection edits/);
 await set(a,'criteria',' Keep one saved revision\n\nKeep one saved revision ');assert.match(await a.eval("$('change-list').textContent"),/No definition or selection edits/);
 await set(a,'non-goals','x'.repeat(501));assert.match(await a.eval("$('change-list').textContent"),/Non-goals edited/);
 await click(a,'save');await settled(a);assert.match(await a.eval("$('status').textContent"),/^Save refused:/);assert.equal(await revisionCount(),2);
 await set(a,'non-goals','');await set(a,'goal','Private resolved plan');
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/save',requestStage:'Response'}]});
 const beforeLost=requests.length;await click(a,'save');await settled(a);assert.equal(await visible(a,'uncertain'),true);
 const pendingBeforeResolution=await a.eval('JSON.stringify(pending)'),lostSave=requests.filter(r=>r.path.endsWith('/save')).at(-1);
 assert(pendingBeforeResolution!=='null');assert.equal(await revisionCount(),3);
 await failListAfterReply(a,'resolve','http');await click(a,'resolve-save');await retainedAcknowledgement(a,3,'http');
 assert.equal(requests.slice(beforeLost).filter(r=>r.path.endsWith('/save')).length,1);
 assert.equal(requests.slice(beforeLost).filter(r=>r.path.endsWith('/resolve')).length,1);
 assert.equal(requests.slice(beforeLost).filter(r=>r.path==='/api/works').length,2);
 assert.equal(requests.filter(r=>r.path.endsWith('/resolve')).at(-1).body,lostSave.body);
 for(const [index,route] of ['save','resolve'].entries()){
   await set(a,'goal','Private material before '+route+' acknowledgement loses access');
   const before=requests.length;
   if(route==='resolve'){
     await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/save',requestStage:'Response'}]});
     await click(a,'save');await settled(a);assert.equal(await visible(a,'uncertain'),true);
   }
   await failListAfterReply(a,route,'denied');await click(a,route==='save'?'save':'resolve-save');await settled(a);
   assert.equal(privateViewCleared(await a.eval(`({work,saved,pending,saveTicket,body:document.body.innerText})`)),true);
   assert.equal(a.injectedListFailure,'denied');assert.equal(responses.filter(r=>r.path==='/api/works').at(-1).status,403);
   assert.match(await a.eval("$('status').textContent"),/Access denied/);
   assert.equal(await revisionCount(),4+index);assert.equal(requests.slice(before).filter(r=>r.path.endsWith('/save')).length,1);
   await requestsOnly(a);await login(a,origin);await reopen(a);await settled(a);
 }
 await browserBranchJourney({a,debug,origin,page,click,set,settled,saved,wait,visible,navigate,login,requestsOnly,requests,responses,revisionCount,readWindow,contextRequest,overlapCapacity,checks,
   restart:async()=>{const options={root:path.join(root,'runtime'),port:Number(new URL(origin).port),bindings:local.env,code:local.code};await local.close();local=null;local=await startLocal(options);}});
 assert.deepEqual(interceptionErrors,[]);
 await click(a,'signout');await wait(()=>a.eval("document.title==='Local synthetic workspace'"),'signout');assert(!await a.eval("document.body.innerText.includes('Evening noise')"));
 // The same complete product journey now enters the compiled direct Worker
 // through workerd's platform Access simulation, without local login cookies.
 for(const c of clients)await navigate(c,'about:blank');await local.close();local=null;
 const artifact=path.join(root,'direct-artifact');await buildCloudflarePlanning(artifact);
 const directOptions={root:path.join(root,'direct-runtime'),direct:true,code:await readFile(path.join(artifact,'worker.js'),'utf8'),
   runtimeConfig:JSON.parse(await readFile(path.join(artifact,'wrangler.json'),'utf8')),migrationsFolder:path.join(artifact,'migrations')};
 local=await startLocal(directOptions);const directOrigin=local.origin;
 async function accessLogin(c){await local.setOptions({access:accessSimulation});await navigate(c,directOrigin+'/');await wait(()=>c.eval("!!document.getElementById('new-work')&&document.getElementById('list-state')?.textContent!=='Reading saved work…'"),'Access workspace');}
 const d=await page(debug,directOrigin);await accessLogin(d);const directStart=checks.length;
 await browserBranchJourney({a:d,debug,origin:directOrigin,page,click,set,settled,saved,wait,visible,navigate,login:accessLogin,requestsOnly,requests,responses,revisionCount,readWindow,contextRequest,overlapCapacity,checks,
   restart:async()=>{const bindings=local.env;await local.close();local=null;local=await startLocal({...directOptions,port:Number(new URL(directOrigin).port),bindings});}});
 for(let i=directStart;i<checks.length;i++)checks[i]='direct Access simulation: '+checks[i];
 console.log('web-planning-browser: direct complete branch and comparison-recovery journey');
 await browserCapacityJourney({a:d,click,set,settled,saved,wait,navigate,origin:directOrigin,downloads:path.join(root,'capacity-downloads'),requests,responses,checks});
 await browserFileJourney({a:d,debug,origin:directOrigin,page,click,set,settled,saved,wait,navigate,requestsOnly,root,checks});
 await browserHistoryJourney({a:d,debug,origin:directOrigin,page,click,set,settled,saved,wait,navigate,checks,
   restart:async()=>{for(const c of clients)await navigate(c,'about:blank');const bindings=local.env;await local.close();local=null;
     local=await startLocal({...directOptions,port:Number(new URL(directOrigin).port),bindings,code:advancedClock(directOptions.code)});}});
 for(const boundary of ['redirect','challenge']){
   d.accessBoundary=boundary;await click(d,'saved-context');await settled(d);
   assert.equal(await d.eval("accessLost&&work===null&&saved===null&&comparison===null&&!document.getElementById('context-view')&&!document.body.innerText.includes('Access login challenge')"),true);
   assert.equal(await d.eval("request('/api/works').then(()=>false,e=>e.message==='access_denied')"),true);
   await accessLogin(d);await reopen(d);await settled(d);
 }
 // Observe clearing after the product click handler, before navigation destroys
 // that document. Only this boolean crosses into the simulated logout page.
 await d.eval("document.getElementById('signout').addEventListener('click',()=>{window.name=String(accessLost&&work===null&&saved===null&&pending===null&&saveTicket===null&&comparison===null&&!document.getElementById('editor'));},{once:true})");
 await click(d,'signout');await wait(()=>d.eval("document.title==='Simulated Access logout boundary'"),'Access logout navigation');
 assert.equal(await d.eval('window.name'),'true');
 assert.equal(d.logoutObserved,true);assert.equal((await local.mf.dispatchFetch(directOrigin+'/api/works')).status,403);
 checks.push('direct sign-out clears tab before navigating to Access logout; actual missing ctx.access refuses subsequent reads; login redirect/HTML challenge clears and latches private state; provider cookie revocation requires hosted acceptance');
 assert.deepEqual(interceptionErrors,[]);
 assert.equal(exceptions,0);assert.equal(external,0);assert.equal(unexpectedFailures,0);assert.equal(expectedFailures.size,0);
 console.log(JSON.stringify({web_planning_browser_checks:checks,acknowledgement_checks:acknowledgementChecks,actual_agent_read:false,sites_ingress_verified:false,cloudflare_access_hosted_verified:false,external_requests:external,script_exceptions:exceptions}));
} finally {for(const c of clients)await c.close();if(processRecord)await terminateOwnedProcessTree(processRecord);if(local)await local.close();assert.equal(owned.size,0);console.log('web_planning_browser_cleanup_complete');}
function privateViewCleared(s){return s.work===null&&s.saved===null&&s.pending===null&&s.saveTicket===null&&!s.body.includes('Private material')&&!s.body.includes('Saved revision');}
