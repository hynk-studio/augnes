import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runCanonicalChild,canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { participantEmail } from './web-planning-participation-checks.mjs';

export async function browserParticipation({owner,participant,local,root,click,set,settled,wait,navigate,barrier,checks}){
  const origin=local.origin,folder=path.join(root,'participant-cli');await mkdir(folder,{mode:0o700});
  const seed=await owner.eval(`(async()=>{
    const first=await api('/api/drafts',{}),base='/api/work/'+first.work_id;
    const saved=(await api(base+'/save',{ticket:first.ticket,definition:{goal:'Community workshop notice',success_criteria:['Give accurate arrival and accessibility details'],non_goals:['Keep the budget private']},notes:[{source:'Private owner',text:'PRIVATE_OWNER_NOTE',provenance:'user_declaration',label:'Open question',observed_at:null}],files:[]})).saved;
    const file=async(name,text)=>{const bytes=new TextEncoder().encode(text);return {name,media_type:'text/plain',bytes:bytes.length,digest:await exchangeDigest(bytes),data:btoa(String.fromCharCode(...bytes))};};
    const r=await api(base+'/exchanges/save',{kind:'request',basis:null,expected:binding(saved),request_key:crypto.randomUUID(),message:'PRIVATE_REQUEST_REASON',next_action:'PRIVATE_INTERNAL_NEXT',files:[await file('notice.md','Workshop starts at 18:30. Use the north entrance.\\r\\n'),await file('budget-private.txt','PRIVATE_BUDGET')]});
    await list();return {work_id:first.work_id,request:r.item.ref};
  })()`);
  await owner.eval("[...document.querySelectorAll('#work-list button')].find(b=>b.textContent==='Community workshop notice').click()");await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list summary')].find(e=>e.textContent==='Participant access for this request').click()");await settled(owner);
  async function grantField(label,value){await owner.eval(`(()=>{const l=[...document.querySelectorAll('#exchange-list label')].find(e=>e.textContent.startsWith(${JSON.stringify(label)})),el=l.querySelector('input,textarea');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
  await grantField('Recipient email',participantEmail);await grantField('Brief to disclose','Improve the attendee notice. Arrival is 18:00; the step-free entrance is the east ramp.');
  await grantField('Return conditions to disclose','Return a corrected notice.');
  await owner.eval("[...document.querySelectorAll('#exchange-list label')].find(e=>e.textContent.includes('budget-private.txt')).querySelector('input').checked=false");
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(e=>e.textContent==='Create participant link').click()");await settled(owner);
  const link=await owner.eval("[...document.querySelectorAll('#exchange-list a')].find(e=>e.href.includes('/participate/'))?.href");assert(link);
  const id=link.split('/').at(-1),p=await participant();
  await p.send('Network.setCookie',{name:'web_planning_local',value:local.env.LOCAL_PARTICIPANT_SESSION,url:origin,httpOnly:true,sameSite:'Strict'});
  await navigate(p,link);await wait(()=>p.eval("typeof state!=='undefined'&&!!state&&!busy"),'participant entry');
  assert.equal(await p.eval("document.body.innerText.includes('PRIVATE_')"),false);
  assert.equal(await p.eval('state.items[0].files.length'),1);
  const cookies=(await p.send('Network.getCookies',{urls:[origin]})).cookies;
  assert(!cookies.some(c=>c.value===local.env.LOCAL_SESSION),'participant context cannot borrow owner cookie');
  for(const width of [390,768,1200]){await p.send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:width===390});
    assert(await p.eval('document.documentElement.scrollWidth<=innerWidth+1'),'participant viewport '+width);}
  await p.eval("[...document.querySelectorAll('#files button')].find(b=>b.textContent==='Read notice.md').click()");await settled(p);
  assert.match(await p.eval("$('files').innerText"),/north entrance/);
  await p.eval("[...document.querySelectorAll('#files button')].find(b=>b.textContent==='Edit notice.md').click()");await settled(p);
  await set(p,'find','Workshop starts at 18:30. Use the north entrance.');
  const returned='Arrive at 18:00 for the 18:30 workshop. Use the east ramp for step-free access.';
  await set(p,'replacement',returned);await set(p,'message','Corrected the arrival and accessible entrance.');await set(p,'next','Confirm the room and publish the notice.');
  const lost=await barrier(p,'/api/participation/'+id+'/save');await click(p,'send');await lost.wait();await lost.release('disconnect');
  assert.equal(await p.eval('!!pending'),true);assert.equal(await p.eval("$('recovery').checkVisibility()"),true);
  // Reload the same participant context: IndexedDB supplies the exact prior
  // return, and only resolution is sent. No replacement answer is generated.
  await navigate(p,link);await wait(()=>p.eval("typeof state!=='undefined'&&!!state&&!busy&&!pending"),'participant reconciles saved return');
  assert.match(await p.eval("$('returned').innerText"),/Corrected the arrival/);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(seed.work_id).first()).n,3);
  const setup=(await p.eval("json('/setup')")),setupPath=path.join(folder,'participant.json');await writeFile(setupPath,JSON.stringify(setup),{mode:0o600});
  const env={...process.env,AUGNES_WEB_ORIGIN:origin,AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+local.env.LOCAL_PARTICIPANT_SESSION};
  async function cli(label,args,expectedExit=0){let stdout='',stderr='';const result=await runCanonicalChild({suite:'web-planning-browser',label:'participant-'+label,command:process.execPath,cwd:process.cwd(),env,
    args:['apps/augnes_apps/scripts/file-exchange.mjs',setupPath,...args],timeoutMs:10000,stdout:{write:b=>{stdout+=b;}},stderr:{write:b=>{stderr+=b;}}});
    assert.equal(result.exit_code,expectedExit,stderr);if(!expectedExit)assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null,stderr);return expectedExit?stderr:JSON.parse(stdout);}
  const listed=await cli('fresh-list',['list']);assert.equal(listed.items.length,2);assert(!JSON.stringify(listed).includes('PRIVATE_'));
  const exact=await cli('fresh-read',['read',String(seed.request.revision),'notice.md']);assert.match(exact.text,/north entrance/);
  await owner.eval('readExchanges()');await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(b=>b.textContent==='Inspect return and decide').click()");await settled(owner);
  assert.match(await owner.eval("$('return-basis').innerText"),/Corrected the arrival/);
  await set(owner,'return-mode','adapted');await set(owner,'return-name','attendee-notice.md');
  const output='Doors open 18:00 in Room B. The workshop starts 18:30. Use the east ramp for step-free access.\r\n';
  await set(owner,'return-text',output);await set(owner,'return-reason','PRIVATE_CHECKED_REASON');await set(owner,'return-next','PRIVATE_OWNER_NEXT');
  await set(owner,'return-destination','new');await set(owner,'return-goal','PRIVATE_FOLLOW_ON');
  await click(owner,'return-share');await set(owner,'return-public-reason','Used your arrival time and east-ramp instructions; added the confirmed room.');await set(owner,'return-public-next','No further work is requested.');
  await click(owner,'return-prepare');await settled(owner);const destination=await owner.eval('returnPrepared.work_id');
  assert.match(await owner.eval("$('return-preview').innerText"),/Shared with participant/);
  await click(owner,'return-commit');await settled(owner);assert.match(await owner.eval("$('return-status').innerText"),/Saved adapted/);
  const stored=JSON.parse((await local.db.prepare('SELECT envelope FROM web_planning_revision WHERE work_id=? ORDER BY revision DESC LIMIT 1').bind(destination).first()).envelope);
  const body=await local.db.prepare('SELECT hex(body) data FROM web_planning_file WHERE work_id=? AND digest=?').bind(destination,stored.return_use.output.digest).first();
  // Textareas normalize CRLF to LF; these are the actual authored output bytes.
  const actualOutput=Buffer.from(body.data,'hex').toString();assert.equal(actualOutput,output.replaceAll('\r\n','\n'));
  const feedback=await cli('fresh-feedback',['feedback']);assert.equal(feedback.feedback[0].disposition,'adapted');
  assert(!JSON.stringify(feedback).includes('PRIVATE_'));assert(!JSON.stringify(feedback).includes(destination));
  const fresh=await participant();await fresh.send('Network.setCookie',{name:'web_planning_local',value:local.env.LOCAL_PARTICIPANT_SESSION,url:origin,httpOnly:true,sameSite:'Strict'});
  await navigate(fresh,link);await wait(()=>fresh.eval("typeof state!=='undefined'&&!!state&&!busy"),'fresh participant feedback');
  assert.match(await fresh.eval("$('feedback').innerText"),/Used your arrival time/);assert.equal(await fresh.eval("document.body.innerText.includes('PRIVATE_')"),false);
  const downloadPath=path.join(folder,'actual-return.md');const returnedItem=listed.items[1];await cli('exact-download',['get',String(returnedItem.ref.revision),'notice.md',downloadPath]);
  assert.equal(await readFile(downloadPath,'utf8'),returned+'\r\n');
  await owner.eval("[...document.querySelectorAll('#exchange-list summary')].find(e=>e.textContent==='Participant access for this request').click()");await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(b=>b.textContent==='Refresh access records').click()");await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(b=>b.textContent==='End access').click()");await settled(owner);
  await click(fresh,'refresh');await settled(fresh);assert.equal(await fresh.eval('accessLost'),true);assert.equal(await fresh.eval("$('files').children.length+$('feedback').children.length"),0);
  assert.match(await cli('revoked-read',['list'],1),/participation_unavailable/);
  // A real committed answer loses its acknowledgement, then access ends before
  // reconciliation. Reopening exposes only the already-local recovery copy.
  const recoveryGrant=await owner.eval(`(async()=>{
    const base='/api/work/'+${JSON.stringify(seed.work_id)},head=(await api(base)).saved;
    const value='Confirm the workshop room.',data=new TextEncoder().encode(value);
    const event=await api(base+'/exchanges/save',{kind:'request',basis:null,expected:binding(head),request_key:crypto.randomUUID(),message:'PRIVATE_RECOVERY_REQUEST',next_action:'PRIVATE_RECOVERY_NEXT',files:[{name:'room.md',media_type:'text/plain',bytes:data.length,digest:await exchangeDigest(data),data:btoa(value)}]});
    return api(base+'/participation/create',{grant_id:crypto.randomUUID(),request:event.item.ref,expected:event.head,recipient:${JSON.stringify(participantEmail)},brief:'Confirm the room.',next_action:'Return a review.',indices:[0],expires:Date.now()+86400000});
  })()`);
  const recovery=await participant();await recovery.send('Network.setCookie',{name:'web_planning_local',value:local.env.LOCAL_PARTICIPANT_SESSION,url:origin,httpOnly:true,sameSite:'Strict'});
  await navigate(recovery,recoveryGrant.link);await wait(()=>recovery.eval("typeof state!=='undefined'&&!!state&&!busy"),'recovery request');
  await set(recovery,'message','Room confirmed.');await set(recovery,'review','The confirmed room is Room B.');await set(recovery,'next','Owner: check the booking.');
  const interrupted=await barrier(recovery,'/api/participation/'+recoveryGrant.id+'/save');await click(recovery,'send');await interrupted.wait();await interrupted.release('disconnect');
  await settled(recovery);const pendingCopy=await recovery.eval('pending');assert(pendingCopy);
  await owner.eval(`api('/api/work/'+${JSON.stringify(seed.work_id)}+'/participation/revoke',{grant_id:${JSON.stringify(recoveryGrant.id)}})`);
  await navigate(recovery,recoveryGrant.link);await wait(()=>recovery.eval("document.getElementById('recover')?.hidden===false"),'ended access local recovery');
  assert.match(await recovery.eval('document.body.innerText'),/saved status is unknown/);
  assert(!await recovery.eval("document.body.innerText.includes('PRIVATE_')"));
  const recoveryFolder=path.join(folder,'recovery');await mkdir(recoveryFolder);
  await recovery.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:recoveryFolder});await click(recovery,'recover');
  await wait(async()=>{try{return JSON.parse(await readFile(path.join(recoveryFolder,'augnes-pending-return.json'),'utf8')).body.request_key===pendingCopy.request_key;}catch{return false;}},'exact recovery file');
  assert.deepEqual(JSON.parse(await readFile(path.join(recoveryFolder,'augnes-pending-return.json'),'utf8')).body,pendingCopy);
  console.log(JSON.stringify({participant_browser_output:{original:exact.text,returned:returned+'\r\n',saved_output:actualOutput,feedback:feedback.feedback,owner_cookie_shared:false,authentication:'separate local fixture cookies in isolated Chrome contexts',hosted_adoption:false}}));
  checks.push('Owner disclosure controls -> separate participant Chrome edit -> real lost acknowledgement and persisted-draft reload -> actual private follow-on adaptation -> fresh participant browser/CLI feedback -> revocation and ended-access local recovery; 390/768/1200 widths');
}
