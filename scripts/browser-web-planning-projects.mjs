// Focused ordinary-browser development journey; not a deciding-host receipt.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocal, availablePort } from './web-planning-local-runtime.mjs';
import { CDP } from './web-planning-cdp.mjs';
import { selectBrowserPath } from './local-canonical-browser-input.mjs';
import { beginBrowserUse } from './local-canonical-browser-identity.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from './test-harness-process-lifecycle.mjs';

const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;
if(!root)throw Error('owned_browser_root_required');
const chrome=selectBrowserPath([process.env.AUGNES_BROWSER_EXECUTABLE_PATH,'/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']);
assert(chrome,'real_browser_unavailable');
const owned=new Set(),clients=[],exceptions=[];let browser,local,processRecord,use;
const wait=async(fn,label)=>{const until=Date.now()+15000;while(Date.now()<until){if(await fn())return;await delay(50);}throw Error('browser_wait:'+label);};
const set=async(c,id,value)=>c.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const settled=async c=>wait(()=>c.eval("typeof busy!=='undefined'&&!busy"),'settled');
async function page(cookie){
  const {browserContextId}=await browser.send('Target.createBrowserContext');
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
  const targets=await (await fetch(debugOrigin+'/json/list')).json(),target=targets.find(t=>t.id===targetId);
  const c=await new CDP(target.webSocketDebuggerUrl).open();clients.push(c);
  await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');
  c.handlers.push(m=>{if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);});
  await c.send('Network.setCookie',{name:'web_planning_local',value:cookie,url:local.origin,httpOnly:true,sameSite:'Strict'});
  return c;
}
async function navigate(c,url){await c.send('Page.navigate',{url});}
async function create(c,label){
  await navigate(c,local.origin+'/projects');
  await wait(()=>c.eval("!!document.getElementById('project-create')&&typeof projects==='function'"),'entry form');
  for(const [field,value] of Object.entries({name:label+' project',purpose:label+' purpose: prepare a quiet accessible reading session',judgment:'The venue email confirms the east ramp; noise is unmeasured.',source:'Venue email dated 2026-11-10',unfinished:'Measure evening noise before booking.',next:'Measure the room at 18:00 and save the result.'}))await set(c,'project-'+field,value);
  await c.eval("document.getElementById('project-create').requestSubmit()");
  await wait(()=>c.eval("!!document.getElementById('saved-label')?.textContent.startsWith('Saved revision 1 ')"),'created continuation');
  await settled(c);
  return c.eval('({project:scope.project_id,work:work,author:saved.author_ref,purpose:saved.definition.goal,fingerprint:saved.fingerprint})');
}
let debugOrigin;
try{
  const debug=await availablePort();debugOrigin='http://127.0.0.1:'+debug;
  use=beginBrowserUse(chrome,{consumer:'web-planning-projects'});
  const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debug,'--user-data-dir='+path.join(root,'chrome'),'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
  let startupError='';child.stderr.on('data',chunk=>{startupError=(startupError+chunk.toString()).slice(-4000);});
  processRecord=registerOwnedChild(owned,child,{label:'web-project-browser'});
  let info;await wait(async()=>{if(child.exitCode!==null||child.signalCode!==null)throw Error('browser_start_failed: '+startupError);try{info=await(await fetch(debugOrigin+'/json/version')).json();return true;}catch{return false;}},'browser startup');
  use.version(info.Browser,'http');browser=await new CDP(info.webSocketDebuggerUrl).open();use.version((await browser.send('Browser.getVersion')).product,'cdp');
  local=await startLocal({root:path.join(root,'projects'),bindings:{PROJECT_ENTRY_MODE:'admitted-private-v1',PROJECT_ADMITTED_EMAILS:'["browser-b@example.test"]',LOCAL_PARTICIPANT_SESSION:randomUUID(),LOCAL_PARTICIPANT_LOGIN:'browser-b@example.test'}});
  const a=await page(local.env.LOCAL_SESSION),b=await page(local.env.LOCAL_PARTICIPANT_SESSION);
  const A=await create(a,'A private'),B=await create(b,'B private');assert.notEqual(A.project,B.project);assert.notEqual(A.author,B.author);
  await navigate(b,local.origin+'/projects');await wait(()=>b.eval("document.getElementById('projects')?.children.length===1"),'B project list');
  assert.equal(await b.eval("document.getElementById('projects').innerText"),'B private project');
  const fresh=await page(local.env.LOCAL_PARTICIPANT_SESSION);
  await navigate(fresh,local.origin+'/?project='+B.project);
  await wait(()=>fresh.eval("document.getElementById('saved-label')?.textContent.startsWith('Saved revision 1 ')"),'fresh B continuation');await settled(fresh);
  assert.equal(await fresh.eval('saved.author_ref'),B.author);assert.equal(await fresh.eval("document.getElementById('goal').value"),B.purpose);
  const recovered=await fresh.eval("[...document.querySelectorAll('#notes [data-field=text]')].map(e=>e.value).join('\\n')");
  for(const value of ['east ramp','unmeasured','Measure evening noise','Measure the room at 18:00'])assert(recovered.includes(value));
  const noteId=await fresh.eval("[...document.querySelectorAll('#notes [data-field=text]')].find(e=>e.value.startsWith('Measure evening noise')).id");
  await set(fresh,noteId,'The 18:00 reading measured 38 dBA. Ask about Friday availability before booking.');
  await set(fresh,'criteria','Confirm Friday availability using the recorded 38 dBA result.');
  await fresh.eval("document.getElementById('save').click()");
  await wait(()=>fresh.eval("document.getElementById('saved-label')?.textContent.startsWith('Saved revision 2 ')"),'meaningful save');await settled(fresh);
  assert.equal(await fresh.eval('saved.author_ref'),B.author);
  await navigate(fresh,local.origin+'/?project='+B.project);
  await wait(()=>fresh.eval("document.getElementById('saved-label')?.textContent.startsWith('Saved revision 2 ')"),'reopen later step');await settled(fresh);
  assert((await fresh.eval('JSON.stringify(saved.sources)')).includes('38 dBA'));
  assert.equal(await a.eval("api('/api/project/continuation').then(v=>v.saved.fingerprint)"),A.fingerprint,'B saves leave A unchanged');
  const denied=await page(local.env.LOCAL_PARTICIPANT_SESSION);
  await navigate(denied,local.origin+'/?project='+A.project);
  await wait(()=>denied.eval("document.body.innerText.includes('access_denied')"),'cross-project refusal');
  assert(!(await denied.eval('document.body.innerText')).includes(A.purpose));
  assert.deepEqual(exceptions,[]);
  console.log(JSON.stringify({browser_project_checks:['two ordinary form creations','private project selection','fresh-session purpose/judgment/open-work/next-action recovery','ordinary later save and reload','stable author and independent A','wrong-project refusal'],authentication:'controlled local fixture identities',hosted_adoption:false,deciding_evidence:false}));
}finally{
  for(const c of clients.reverse())await c.close();
  if(browser)await browser.close();
  if(local)await local.close();
  if(processRecord)await terminateOwnedProcessTree(processRecord,{termGraceMs:2000,killGraceMs:2000});
  use?.finish();
  console.log('project_browser_owned_runtime_cleanup_complete');
}
