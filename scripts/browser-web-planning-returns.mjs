import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runCanonicalChild,canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

// The producer is a scripted fixture. The consumers use visible Chrome controls
// and independent owner CLI processes against the very same private local D1.
export async function browserReturnedFiles({c,fresh,origin,env,root,click,set,settled,wait,navigate,barrier,checks,requests}){
  const goal='Cedar Hall seating',later='Pack Cedar Hall seating kits',folder=path.join(root,'return-owner');
  await mkdir(folder);const srcSetup=path.join(folder,'source.json'),dstSetup=path.join(folder,'follow-on.json');
  const seed=await c.eval(`(async()=>{
    const def={goal:'Cedar Hall seating',success_criteria:['Set 32 guest places'],non_goals:['Keep the existing booking']};
    const first=await api('/api/drafts',{});const base='/api/work/'+first.work_id;
    let head=(await api(base+'/save',{ticket:first.ticket,definition:def,notes:[],files:[{name:'booking.txt',role:'source',data:btoa('Keep room B') }]})).saved;
    const file=async(name,text)=>{const b=new TextEncoder().encode(text);return {name,media_type:'text/plain',bytes:b.length,digest:await exchangeDigest(b),data:btoa(String.fromCharCode(...b))};};
    async function event(kind,basis,message,files){
      const v=await api(base+'/exchanges/save',{kind,basis,expected:binding(head),request_key:crypto.randomUUID(),message,next_action:kind==='return'?'Check the current room plan':'',files});
      head=v.head;return v.item;
    }
    const conditions=await event('request',null,'Confirm room capacity',[await file('capacity.txt','Can the hall take 32?')]);
    const seating=await event('request',null,'Plan the seating and aisles for the original count',[await file('brief.txt','Plan 32 guest places including mezzanine overflow.')]);
    await event('return',conditions.ref,'Venue update',[await file('capacity.txt','Room limit is 24 including two staff. The mezzanine is closed.')]);
    const current=(await api(base)).saved, t=await api(base+'/ticket',{expected:binding(current)});
    head=(await api(base+'/save',{ticket:t.ticket,definition:{...def,success_criteria:['Room limit 24, including 2 staff; mezzanine closed']},notes:[{text:'Keep the loading door clear.',source:'Venue owner',label:'Next check',provenance:'user_declaration',observed_at:null}],files:current.files})).saved;
    return event('return',seating.ref,'Late plan assumes the original room capacity',[await file('aisle.txt','Keep aisle C clear at 1.2 m. Mark it with blue tape.\\r\\n'),await file('seat-plan.md','Set 32 guest places; pack one kit per four guest places.'),await file('overflow.txt','Open the mezzanine for eight overflow places.')]);
  })()`);
  async function byTitle(page,title){const buttons="[...document.querySelectorAll('#work-list button')]";
    await wait(()=>page.eval(buttons+'.some(b=>b.textContent==='+JSON.stringify(title)+')'),'listed '+title);
    await page.eval(buttons+'.find(b=>b.textContent==='+JSON.stringify(title)+').click()');await settled(page);}
  async function inPanel(page,panel,label){const selector=JSON.stringify('#'+panel+' button');
    const expr='[...document.querySelectorAll('+selector+')].find(b=>b.textContent==='+JSON.stringify(label)+'&&b.checkVisibility())';
    await wait(()=>page.eval('!!'+expr),label);await page.eval(expr+'.click()');await settled(page);}
  async function inspectFile(page,name){
    await page.eval(`(()=>{const link=[...document.querySelectorAll('#exchange-list a')].find(e=>e.download===${JSON.stringify(name)});[...link.closest('li').querySelectorAll('button')].find(b=>b.textContent==='Inspect return and decide').click()})()`);await settled(page);
    assert.equal(await page.eval("$('return-heading').checkVisibility() && document.activeElement===$('return-heading')"),true);}
  await navigate(c,origin+'/');await byTitle(c,goal);
  // Establish the ordinary no-op on a saved planning revision. An unrelated
  // form submission must never turn the return decision into an implicit save.
  await click(c,'save');await settled(c);const baseline=await c.eval('binding(saved)');
  await click(c,'save');await settled(c);assert.deepEqual(await c.eval('binding(saved)'),baseline);
  await byTitle(c,goal);
  await inspectFile(c,'seat-plan.md');
  await set(c,'return-mode','adapted');await set(c,'return-text','Label the six kits for the ground floor.');
  await set(c,'return-reason','The mezzanine is closed.');await set(c,'return-next','Print the six labels.');
  await set(c,'return-destination','new');await set(c,'return-goal','Cedar Hall kit labels');
  const draftState=()=>c.eval(`({visible:$('return-inspector').checkVisibility(),mode:$('return-mode').value,
    text:$('return-text').value,reason:$('return-reason').value,next:$('return-next').value,
    destination:$('return-destination').value,goal:$('return-goal').value,selection:returnView?.selection??null,
    preview:$('return-preview').textContent,prepared:!!returnPrepared,marker:!!returnMarker,
    recovery:$('return-recovery').checkVisibility(),base:binding(saved)})`);
  async function ordinaryWhileEditing(stage,action){
    const before=await draftState(),start=requests.length;await action();await settled(c);
    const after=await draftState();
    const writes=requests.slice(start).filter(r=>/\/(?:save|ticket|drafts|erase)$/.test(new URL(r.path,origin).pathname));
    console.log(JSON.stringify({return_draft_interaction:{stage,prior_text:before.text,visible:after.visible,text:after.text,
      rationale:after.reason,prepared:after.prepared,marker_visible:after.recovery,same_base:after.base.fingerprint===before.base.fingerprint,
      requests:writes.map(r=>({action:r.path.split('/').at(-1),return_choice:!!JSON.parse(r.body??'{}').return_choice})),status:await c.eval("$('status').innerText")}}));
    assert.deepEqual(after,before,'Ordinary action must preserve the selected return, its visible authored draft and reconciliation state: '+stage);
    assert.equal(writes.length,0,stage+' must refuse before sending another form');
    assert.match(await c.eval("$('status').innerText"),/return decision|return save/i);
  }
  await ordinaryWhileEditing('no-op work Save',()=>click(c,'save'));
  await set(c,'goal','Local edit to check the loading door');
  await ordinaryWhileEditing('dirty work form submit',()=>c.eval("$('work-form').requestSubmit()"));
  assert.equal(await c.eval("$('goal').value"),'Local edit to check the loading door');
  // Type while a real response is paused. A ticket for earlier text must not
  // become actionable and a previously confirmed inspection must not erase new edits.
  const preview=await barrier(c,'/api/drafts');await click(c,'return-prepare');await preview.wait();
  const latestText='Label six kits for 22 seated guests on the ground floor.';
  await set(c,'return-text',latestText);await preview.release();
  assert.equal(await c.eval("$('return-text').value"),latestText);
  assert.equal(await c.eval("returnPrepared===null && !$('return-commit').checkVisibility()"),true);
  const priorSelection=(await draftState()).selection,inspect=await barrier(c,'/inspect-return');
  const confirmDiscard=m=>{if(m.method==='Page.javascriptDialogOpening')c.send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});};
  c.handlers.push(confirmDiscard);
  try {
    await c.eval("[...[...document.querySelectorAll('#exchange-list a')].find(e=>e.download==='aisle.txt').closest('li').querySelectorAll('button')].find(b=>b.textContent==='Inspect return and decide').click()");
    await inspect.wait();await set(c,'return-reason','The closed mezzanine makes ground-floor labels necessary.');await inspect.release();
  } finally {c.handlers.splice(c.handlers.indexOf(confirmDiscard),1);}
  const edited=await draftState();
  assert.deepEqual(edited.selection,priorSelection);assert.equal(edited.text,latestText);assert.match(edited.reason,/ground-floor labels/);
  console.log(JSON.stringify({return_delayed_responses:{stale_preview_unavailable:true,inspection_retained_selection:true,text:edited.text,rationale:edited.reason}}));
  await click(c,'return-prepare');await settled(c);
  assert.equal((await draftState()).prepared,true);
  await ordinaryWhileEditing('prepared decision and ordinary Save',()=>click(c,'save'));
  await click(c,'erase');
  await ordinaryWhileEditing('confirm erasure while a decision is prepared',()=>click(c,'confirm-erase'));
  await click(c,'cancel-erase');
  c.beforeRequest={path:'/api/work/'+await c.eval('returnPrepared.work_id')+'/save',method:'POST',unavailable:true};
  await click(c,'return-commit');await settled(c);
  const pendingTicket=await c.eval('sessionStorage.getItem(returnKey(work))');
  await ordinaryWhileEditing('unresolved adaptation and ordinary Save',()=>click(c,'save'));
  assert.equal(await c.eval('sessionStorage.getItem(returnKey(work))'),pendingTicket);
  await click(c,'return-resolve');await settled(c);assert.equal(await c.eval("$('return-retry').checkVisibility()"),true);
  await click(c,'return-retry');await settled(c);assert.match(await c.eval("$('return-status').innerText"),/Saved adapted/);
  assert.equal(await c.eval("$('goal').value"),'Local edit to check the loading door');
  const committed=requests.filter(r=>r.path.endsWith('/save')).map(r=>JSON.parse(r.body??'{}').return_choice).filter(Boolean);
  assert.equal(committed.at(-1).text,latestText);assert.equal(committed.at(-1).rationale,edited.reason);
  await set(c,'goal',goal);await click(c,'save');await settled(c);
  assert.equal(await c.eval('returnMarker'),null);await byTitle(c,goal);
  checks.push('Ordinary no-op and edited work Save, prepared and unresolved return decisions preserve visible text, choice, rationale and the original retry');
  const start=requests.length;await inspectFile(c,'aisle.txt');
  assert.match(await c.eval("$('return-basis').innerText"),/Plan the seating and aisles.*[\s\S]*Room limit 24/);
  await c.eval("[...$('return-basis').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Read aisle.txt as text').click()");await settled(c);
  const aisle=await c.eval("Array.from($('return-basis').querySelectorAll('pre')).at(-1).textContent");assert.equal(aisle,'Keep aisle C clear at 1.2 m. Mark it with blue tape.\r\n');
  assert.equal(requests.slice(start).filter(r=>/\/(save|drafts|ticket)$/.test(new URL(r.url??origin+r.path,origin).pathname)).length,0);
  await set(c,'return-reason','The 1.2 m aisle still applies to the smaller room.');await set(c,'return-limits','Ground floor only');
  await set(c,'return-checks','Compared the venue update with the marked aisle.');await set(c,'return-next','Mark aisle C with blue tape before seating.');
  await click(c,'return-prepare');await settled(c);assert.match(await c.eval("$('return-preview').innerText"),/Prepared, not saved.*Cedar Hall seating/);
  const before=await c.eval("({work,base:binding(saved),notes:saved.sources,files:saved.files})");
  c.beforeRequest={path:'/api/work/'+before.work+'/save',method:'POST',unavailable:true};
  await click(c,'return-commit');await settled(c);
  assert.equal(await c.eval("$('return-recovery').checkVisibility() && !sessionStorage.getItem(returnKey(work)).includes('Keep aisle C clear at')"),true);
  const onDialog=m=>{if(m.method==='Page.javascriptDialogOpening')c.send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});};c.handlers.push(onDialog);
  try{await c.send('Page.reload');await wait(()=>c.eval("typeof work!=='undefined'&&work===null&&!!document.querySelector('#work-list button')"),'reloaded private entry');}
  finally{c.handlers.splice(c.handlers.indexOf(onDialog),1);}
  await byTitle(c,goal);await click(c,'return-resolve');await settled(c);assert.equal(await c.eval("$('return-retry').checkVisibility()&&!$('return-abandon').checkVisibility()"),true);
  const lost=await barrier(c,'/api/work/'+before.work+'/save');await click(c,'return-retry');await lost.wait();await lost.release('disconnect');await settled(c);
  assert.equal(await c.eval("$('return-recovery').checkVisibility()"),true);assert.equal(await c.eval('saved.fingerprint'),before.base.fingerprint);
  const refresh=await barrier(c,'/api/work/'+before.work);await click(c,'return-resolve');await refresh.wait();
  await set(c,'goal','Keep the van checklist open while checking the saved aisle.');await refresh.release();
  assert.deepEqual(await c.eval("({text:$('goal').value,dirty,base:saved.fingerprint})"),
    {text:'Keep the van checklist open while checking the saved aisle.',dirty:true,base:before.base.fingerprint});
  assert.match(await c.eval("$('return-status').innerText"),/Saved unchanged/);
  console.log(JSON.stringify({return_acknowledgement_refresh:{saved_notice_visible:true,draft_retained:true,original_base:before.base.fingerprint}}));
  c.handlers.push(onDialog);try{await byTitle(c,goal);}finally{c.handlers.splice(c.handlers.indexOf(onDialog),1);}
  const retained=await c.eval('saved');assert.equal(retained.revision,before.base.revision+1);assert.equal(retained.return_use.decision,'unchanged');
  assert.deepEqual(retained.sources,before.notes);assert.deepEqual(retained.files[0],before.files[0]);assert.equal(retained.files[1].digest,seed.files[0].digest);
  checks.push('Return inspection is read-only; genuine lost acknowledgement resolves one current revision with exact returned bytes and untouched notes/files');
  async function cli(label,args){let stdout='',stderr='';const ch=await runCanonicalChild({suite:'web-planning-browser',label:'return-owner-'+label,command:process.execPath,cwd:process.cwd(),env,
    args:['apps/augnes_apps/scripts/file-exchange.mjs',...args],timeoutMs:10000,stdout:{write:b=>{stdout+=b;}},stderr:{write:b=>{stderr+=b;}}});
    assert.equal(canonicalChildAcceptanceFailure(ch,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
  const tasks=await cli('discover',['tasks']);assert(tasks.items.some(w=>w.goal===goal));
  await cli('select',['select',goal,srcSetup]);const catalogue=await cli('catalogue',[srcSetup,'list']);
  const late=catalogue.items.find(r=>r.kind==='return'&&r.message.includes('Late plan'));assert(late);
  const kept=await cli('read-current-output',[srcSetup,'read-saved',String(retained.revision),'aisle.txt']);assert.equal(kept.text,aisle);
  const see=async(name,tag)=>{const obs=path.join(folder,tag+'.json');return {obs,v:await cli('inspect-'+tag,[srcSetup,'inspect-return',String(late.ref.revision),name,obs])};};
  const {obs,v}=await see('seat-plan.md','seat-observation'),original=(await cli('read-original',[srcSetup,'read',String(late.ref.revision),'seat-plan.md'])).text;
  const [cap,staff]=v.current.definition.success_criteria[0].match(/\d+/g).map(Number);assert.match(original,/one kit per four/);
  const guests=cap-staff,kits=Math.ceil(guests/4),adapted='Pack '+kits+' kits of four for '+guests+' guest places; reserve '+staff+' staff places. Mark aisle C at 1.2 m.';
  async function prepare(label,observed,judgment,dest,newGoal){
    const file=path.join(folder,label+'-choice.json'),journal=path.join(folder,label+'-pending.json');await writeFile(file,JSON.stringify(judgment),{mode:0o600});
    const preview=await cli(label+'-preview',[srcSetup,'prepare-use',observed,file,dest,journal,...newGoal?[newGoal]:[]]);
    assert.equal(preview.status,'prepared, not saved');return journal;}
  const journal=await prepare('adapt',obs,{decision:'adapted',name:'pack-kits.md',text:adapted,rationale:'The old 32-seat plan conflicts with the 24-person limit; retain its kit ratio.',
    limits:'Ground-floor guest count only',reported_check:'Compared the stated capacities.',next_action:'Label six kits and keep two places for staff.'},'new',later);
  assert.equal((await cli('pending-not-saved',[srcSetup,'check-use',journal])).outcome,'unknown');
  const commit=await cli('follow-on-save',[srcSetup,'commit-use',journal]);assert.equal(commit.outcome,'saved');
  const prepared=commit.saved;assert.equal(prepared.revision,1);assert.notEqual(prepared.work_id,retained.work_id);
  assert.equal((await cli('confirm',[srcSetup,'check-use',journal])).saved.fingerprint,prepared.fingerprint);
  assert.equal((await cli('same-ticket',[srcSetup,'commit-use',journal])).saved.fingerprint,prepared.fingerprint);
  const obsolete=await see('overflow.txt','unused-observation');assert.match((await cli('read-overflow',[srcSetup,'read',String(late.ref.revision),'overflow.txt'])).text,/mezzanine/);
  const unused=await prepare('decline',obsolete.obs,{decision:'declined',rationale:'The venue closed the mezzanine after this request.',limits:'Recheck only if reopened',next_action:'Keep all guests on the ground floor.'},'current');
  const declined=(await cli('record-decline',[srcSetup,'commit-use',unused])).saved;assert.equal(declined.return_use.output,null);assert.deepEqual(declined.files,retained.files);
  await cli('find-follow-on',['select',later,dstSetup]);const reopened=await cli('read-follow-on',[dstSetup,'read-saved',String(prepared.revision),'pack-kits.md']);
  assert.equal(reopened.text,adapted);assert.equal(reopened.decision.output.digest,'sha256:'+createHash('sha256').update(adapted).digest('hex'));
  const recovered=await cli('read-recorded-origin',[dstSetup,'read-origin',String(prepared.revision)]);assert.equal(recovered.text,original);
  const sourceReview=(await see('seat-plan.md','after-use')).v;assert(sourceReview.decisions.some(d=>d.destination.work_id===prepared.work_id && d.destination.fingerprint===prepared.fingerprint));
  // A fresh browser finds the new work by title. Read both sets of bytes
  // in visible controls, while a later inspection preserves an unrelated draft.
  await navigate(fresh,origin+'/');await byTitle(fresh,later);
  await fresh.eval("[...$('exchange-list').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Read pack-kits.md as text').click()");await settled(fresh);
  assert.equal(await fresh.eval("$('exchange-list').querySelector('pre').checkVisibility() && $('exchange-list').querySelector('pre').textContent=== "+JSON.stringify(adapted)),true);
  await set(fresh,'goal','Local draft: confirm the transport van');const draftBefore=await fresh.eval("({work,base:binding(saved),goal:$('goal').value,dirty})");
  await inPanel(fresh,'exchange-list','Inspect recorded return');assert.match(await fresh.eval("$('return-basis').innerText"),/seat-plan.md/);
  await fresh.eval("[...$('return-basis').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Read seat-plan.md as text').click()");await settled(fresh);
  assert.equal(await fresh.eval("$('return-basis').querySelector('pre').checkVisibility() && $('return-basis').querySelector('pre').textContent"),original);
  assert.deepEqual(await fresh.eval("({work,base:binding(saved),goal:$('goal').value,dirty})"),draftBefore);
  checks.push('Fresh authenticated owner processes discover, compare, adapt, create, decline and recover exact origins; a fresh Chrome tab reopens both byte sets without disturbing a draft');
  const count=(await cli('final-catalogue',['tasks'])).items.filter(w=>w.goal===later).length;assert.equal(count,1);
  // A later owner erases the source. The visible pane must not show stale
  // source bytes, and neither the saved follow-on nor its local draft changes.
  await c.eval("api('/api/work/'+work+'/erase',{expected:"+JSON.stringify({revision:declined.revision,fingerprint:declined.fingerprint})+",confirm:'erase-whole-work'})");
  await inPanel(fresh,'exchange-list','Inspect recorded return');
  assert.equal(await fresh.eval("!$('return-inspector').checkVisibility() && !$('return-basis').children.length && document.activeElement===$('return-status')"),true);
  assert.match(await fresh.eval("$('return-status').innerText"),new RegExp(late.ref.fingerprint));
  assert.equal(await fresh.eval("$('exchange-list').querySelector('pre').textContent"),adapted);
  assert.deepEqual(await fresh.eval("({work,base:binding(saved),goal:$('goal').value,dirty})"),draftBefore);
  console.log(JSON.stringify({returned_file_journey:{producer:'scripted fixture through normal Web writes; loopback owner authentication',consumer:'real signed Chrome and fresh authenticated CLI processes, no live model',original_request:v.request,request_basis:v.request_basis,returned:late,current_conditions:v.current,
    origin_text:original,unchanged:{bytes:kept.data,decision:kept.decision},follow_on:{bytes:reopened.data,text:adapted,decision:reopened.decision},declined:{saved:declined.fingerprint,decision:declined.return_use},original_reopened:recovered.text,exactly_one_follow_on:count,source_erased_after_reopening:true,destination_bytes_still_visible:true,unrelated_draft_preserved:draftBefore}}));
}
