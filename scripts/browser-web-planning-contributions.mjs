import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';

// All journey writes below use ordinary forms. Local identity cookies simulate
// separate admitted sign-ins; they do not demonstrate hosted adoption.
export async function browserCrossProjectContributions({owner,participant,local,root,click,set,settled,wait,navigate,barrier,checks}){
  const origin=local.origin;
  const login=async(c,value)=>c.send('Network.setCookie',{name:'web_planning_local',value,url:origin,httpOnly:true,sameSite:'Strict'});
  const enter=async(c,url)=>{await navigate(c,url);await wait(()=>c.eval("typeof state!=='undefined'&&!!state&&!busy"),'contribution request');};
  const choose=async(c,id,value)=>{await set(c,id,value);await c.eval(`document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}))`);await settled(c);};
  async function create(c,actor){
    await navigate(c,origin+'/projects');await wait(()=>c.eval("!!document.getElementById('project-create')&&typeof projects==='function'"),'project create entry');
    for(const [field,value] of Object.entries({name:actor+' independent project',purpose:actor+' private venue investigation',judgment:actor+'_PRIVATE_JUDGMENT',source:'Own venue observation',unfinished:'Measure noise independently.',next:'Check the accessible entrance.'}))await set(c,'project-'+field,value);
    await click(c,'project-submit');await wait(()=>c.eval("typeof saved!=='undefined'&&!!saved&&!busy"),'created private project');return c.eval('saved');
  }
  await login(owner,local.env.LOCAL_SESSION);const a=await create(owner,'A');
  const b=await participant();await login(b,local.env.LOCAL_PARTICIPANT_SESSION);const independent=await create(b,'B');
  assert.notEqual(a.project_id,independent.project_id);assert.notEqual(a.author_ref,independent.author_ref);
  const dir=path.join(root,'cross-project-inputs');await mkdir(dir);
  const notice=path.join(dir,'notice.md'),privateFile=path.join(dir,'private.txt');
  await writeFile(notice,'Arrival 18:30.\r\nUse the north entrance.\r\n');await writeFile(privateFile,'A_PRIVATE_FILE');
  await click(owner,'exchange-new');await set(owner,'exchange-message','A_PRIVATE_REQUEST');await set(owner,'exchange-next','A_PRIVATE_NEXT');
  const {root:dom}=await owner.send('DOM.getDocument');const {nodeId}=await owner.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#exchange-upload'});
  await owner.send('DOM.setFileInputFiles',{nodeId,files:[notice,privateFile]});await click(owner,'exchange-submit');await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list summary')].find(e=>e.textContent==='Participant access for this request').click()");await settled(owner);
  async function grantField(label,value){await owner.eval(`(()=>{const el=[...document.querySelectorAll('#exchange-list label')].find(e=>e.textContent.startsWith(${JSON.stringify(label)})).querySelector('input,textarea');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
  await grantField('Recipient email',local.env.LOCAL_PARTICIPANT_LOGIN);await grantField('Brief to disclose','Check arrival and the accessible entrance.');await grantField('Return conditions to disclose','Keep uncertainty about evening noise. Return checked facts or a useful question.');
  await owner.eval("[...document.querySelectorAll('#exchange-list label')].find(e=>e.textContent.includes('private.txt')).querySelector('input').checked=false");
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(e=>e.textContent==='Create participant link').click()");await settled(owner);
  const link=await owner.eval("[...document.querySelectorAll('#exchange-list a')].find(e=>e.href.includes('/participate/')).href"),grant=link.split('/').at(-1),api='/api/participation/'+grant;
  await enter(b,link);assert(!await b.eval("document.body.innerText.includes('A_PRIVATE')"));
  await b.eval("[...document.querySelectorAll('#files button')].find(e=>e.textContent==='Read notice.md').click()");await settled(b);assert.match(await b.eval("$('files').innerText"),/north entrance/);
  await click(b,'load-projects');await settled(b);await choose(b,'own-project',independent.project_id);
  await set(b,'own-title','B checks the notice');await set(b,'own-next','Read the venue confirmation and correct the notice.');
  const retaining=await barrier(b,api+'/retain');await click(b,'retain');await retaining.wait();await retaining.release('disconnect');assert.equal(await b.eval('pending.operation'),'retain');
  await enter(b,link);assert.equal(await b.eval('pending'),null);
  await click(b,'load-projects');await settled(b);await choose(b,'own-project',independent.project_id);
  const kept=await b.eval('ownWorks[0]'),ownLink=await b.eval("document.querySelector('#own-works a').href");
  assert(kept);assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE project_id=? AND work_id=?').bind(independent.project_id,kept.ref.work_id).first()).n,1);
  checks.push('Cross-project browser: A/B independently create projects, A deliberately shares one file, B reads and retains exact originals through the form; lost retention acknowledgement reconciles once');

  const writing=await participant();await login(writing,local.env.LOCAL_PARTICIPANT_SESSION);await navigate(writing,ownLink);
  await wait(()=>writing.eval(`typeof saved!=='undefined'&&saved?.work_id===${JSON.stringify(kept.ref.work_id)}&&!busy`),'B retained work');
  await click(writing,'saved-context');await settled(writing);assert.match(await writing.eval("$('context-view').innerText"),/Keep uncertainty about evening noise/);
  await set(writing,'authored-file','notice.md');await click(writing,'open-authored');await settled(writing);
  await set(writing,'authored-text','Arrival 18:00. Use the east ramp. Noise is not yet measured.\n');await click(writing,'save');await settled(writing);
  const made=await writing.eval('saved');assert.equal(made.revision,2);
  await click(b,'load-own-works');await settled(b);await choose(b,'own-work',made.work_id);
  await b.eval("document.querySelector('#result-files input').click()");await set(b,'project-message','Confirmed the arrival and east ramp; noise remains unknown.');await set(b,'project-next','Check the notice before use.');await click(b,'share-project-source');
  const returning=await barrier(b,api+'/project-return');await click(b,'project-send');await returning.wait();await returning.release('disconnect');
  assert.equal(await b.eval('pending.operation'),'project-return');await enter(b,link);assert.equal(await b.eval('pending'),null);
  const sent=await b.eval('state.items[1]');assert.equal(sent.contributor.project.work.fingerprint,made.fingerprint);
  assert(!JSON.stringify(sent).includes('B_PRIVATE'));assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(a.work_id).first()).n,3);
  checks.push('Cross-project browser: ordinary B editor saves its own result, exact selected files return with B attribution; committed response loss and reload produce no duplicate answer');

  await click(owner,'refresh-work');await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(b=>b.textContent==='Inspect return and decide').click()");await settled(owner);
  await set(owner,'return-mode','adapted');await set(owner,'return-name','private-final.md');await set(owner,'return-text','Arrival 18:00. Use the east ramp. Room B.\n');
  await set(owner,'return-reason','A_PRIVATE_REASON');await set(owner,'return-next','A_PRIVATE_NEXT');
  await set(owner,'return-destination','new');await set(owner,'return-goal','A_PRIVATE_DESTINATION');
  await click(owner,'return-share');await set(owner,'return-public-reason','Used arrival and ramp; added our room. Did not use the unmeasured noise statement.');await set(owner,'return-public-next','Continue your separate investigation if useful.');
  await click(owner,'return-prepare');await settled(owner);const destination=await owner.eval('returnPrepared.work_id');await click(owner,'return-commit');await settled(owner);
  assert.match(await owner.eval("$('return-status').innerText"),/Saved adapted/);
  const fresh=await participant();await login(fresh,local.env.LOCAL_PARTICIPANT_SESSION);await enter(fresh,link);
  const feedback=await fresh.eval("$('feedback').innerText");assert.match(feedback,/Did not use/);assert(!feedback.includes('PRIVATE'));assert(!feedback.includes(destination));
  await navigate(fresh,ownLink);await wait(()=>fresh.eval(`typeof saved!=='undefined'&&saved?.work_id===${JSON.stringify(made.work_id)}&&!busy`),'fresh B work');
  await set(fresh,'criteria','Measure evening noise for our independent venue investigation.');await click(fresh,'save');await settled(fresh);
  assert.equal(await fresh.eval('saved.revision'),3);assert.equal(await fresh.eval('saved.author_ref'),independent.author_ref);
  checks.push('Cross-project browser: A checks and saves partial adapted use with deliberately shared feedback; fresh B sign-in reads it and saves a meaningful independent next step');
}
