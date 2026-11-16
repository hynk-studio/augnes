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
  await click(b,'load-own-works');await settled(b);
  // Programmatic value assignment can select a disabled descendant. Check the
  // native state first so fieldset inheritance cannot hide a blocked user path.
  assert.deepEqual(await b.eval("({selector:$('own-work').matches(':disabled'),fields:$('project-return-fields').matches(':disabled')})"),{selector:false,fields:true});
  await choose(b,'own-work',made.work_id);
  assert.equal(await b.eval("!$('project-return-fields').matches(':disabled')&&!document.querySelector('#result-files input:checked')&&!$('share-project-source').checked&&$('share-project-source').required"),true);
  await b.eval("document.querySelector('#result-files input').checked=true;$('share-project-source').checked=true");
  await choose(b,'own-work',made.work_id);
  assert.equal(await b.eval("!document.querySelector('#result-files input:checked')&&!$('share-project-source').checked"),true,'a selection change clears file and attribution consent');
  await b.eval("document.querySelector('#result-files input').click()");await set(b,'project-message','Confirmed the arrival and east ramp; noise remains unknown.');await set(b,'project-next','Check the notice before use.');await click(b,'share-project-source');
  const returning=await barrier(b,api+'/project-return');await click(b,'project-send');await returning.wait();
  assert.equal(await b.eval("busy&&$('own-work').matches(':disabled')&&$('project-return-fields').matches(':disabled')"),true,'an in-flight return locks selection and result fields');
  await returning.release('disconnect');await settled(b);
  assert.equal(await b.eval("!busy&&pendingChoices.length>0&&$('own-work').matches(':disabled')&&$('project-return-fields').matches(':disabled')"),true,'a pending return keeps selection and result fields locked');
  assert.equal(await b.eval('pending.operation'),'project-return');await enter(b,link);assert.equal(await b.eval('pending'),null);
  assert.equal(await b.eval("!state.can_submit&&$('project-return-fields').matches(':disabled')"),true,'an answered request cannot submit another selected return');
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

  await browserSelectedMethod({owner,participant,local,root,click,set,settled,wait,navigate,checks,login,enter,choose,grantField,project:independent});
}

// A scripted consumer uses ordinary files and forms, not a method-specific
// writer. The assertions distinguish inherited observations from B's new work.
async function browserSelectedMethod({owner,participant,local,root,click,set,settled,wait,navigate,checks,login,enter,choose,grantField,project}){
  await click(owner,'new-work');await settled(owner);
  await set(owner,'goal','A packages workshop badges');await set(owner,'criteria','Record the packing rule and its permitted reuse.');
  await click(owner,'save');await settled(owner);const source=await owner.eval('saved');
  const methodText='Whole-item packing rule\npackages = ceil(items / capacity)\nspare = packages * capacity - items\nInputs: nonnegative whole items and positive whole capacity. Output: package count and spare slots.\n';
  const method=path.join(root,'cross-project-inputs','packing-method.md');await writeFile(method,methodText);
  await click(owner,'exchange-new');await set(owner,'exchange-message','A_PRIVATE_METHOD_REQUEST');await set(owner,'exchange-next','A_PRIVATE_METHOD_NEXT');
  const {root:dom}=await owner.send('DOM.getDocument');const {nodeId}=await owner.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#exchange-upload'});
  await owner.send('DOM.setFileInputFiles',{nodeId,files:[method]});await click(owner,'exchange-submit');await settled(owner);
  await owner.eval("[...document.querySelectorAll('#exchange-list summary')].find(e=>e.textContent==='Participant access for this request').click()");await settled(owner);
  const brief='B may save and adapt this method for its own packing tasks. A observed 12 badges at capacity 5 require 3 packages; that is inherited evidence, not B performance.';
  const conditions='Use whole nonnegative counts and positive whole capacities. Weight and delivery are untested. Saved copies may be used after access ends. No credentials, budget, delivery authority or obligations transfer. Corrections: this exact request.';
  await grantField('Recipient email',local.env.LOCAL_PARTICIPANT_LOGIN);await grantField('Brief to disclose',brief);await grantField('Return conditions to disclose',conditions);
  await owner.eval("[...document.querySelectorAll('#exchange-list button')].find(e=>e.textContent==='Create participant link').click()");await settled(owner);
  const link=await owner.eval("[...document.querySelectorAll('#exchange-list a')].find(e=>e.href.includes('/participate/')).href");
  const b=await participant();await login(b,local.env.LOCAL_PARTICIPANT_SESSION);await enter(b,link);
  assert(!await b.eval("document.body.innerText.includes('A_PRIVATE_METHOD')"));
  await b.eval("[...document.querySelectorAll('#files button')].find(e=>e.textContent==='Read packing-method.md').click()");await settled(b);
  assert.match(await b.eval("$('files').innerText"),/packages = ceil\(items \/ capacity\)/);
  await click(b,'load-projects');await settled(b);await choose(b,'own-project',project.project_id);
  await set(b,'own-title','B prepares seed envelopes for the garden club');await set(b,'own-next','Pack 23 seed envelopes in boxes of capacity 6; verify the count.');
  await click(b,'retain');await settled(b);
  const retained=await b.eval('ownWorks[0]'),ownLink=await b.eval("document.querySelector('#own-works a').href");assert(retained);
  await navigate(b,ownLink);await wait(()=>b.eval(`typeof saved!=='undefined'&&saved?.work_id===${JSON.stringify(retained.ref.work_id)}&&!busy`),'retained method work');
  await click(b,'saved-context');await settled(b);
  const context=await b.eval("$('context-view').innerText");for(const text of [brief,conditions])assert(context.includes(text));
  await b.eval("[...document.querySelectorAll('#context-view summary')].find(e=>e.textContent==='Immutable disclosure and original file identities').click()");
  assert((await b.eval("$('context-view').innerText")).includes(source.project_id),'expanded disclosure identifies A');
  await set(b,'authored-file','packing-method.md');await click(b,'open-authored');await settled(b);
  const readMethod=await b.eval("$('authored-text').value");assert.equal(readMethod,methodText);
  const apply=(text,items,capacity)=>{
    assert.match(text,/packages = ceil\(items \/ capacity\)/);assert.match(text,/spare = packages \* capacity - items/);
    assert(Number.isSafeInteger(items)&&items>=0&&Number.isSafeInteger(capacity)&&capacity>0);
    const packages=Math.ceil(items/capacity),spare=packages*capacity-items;
    assert(packages*capacity>=items);assert(packages===0||(packages-1)*capacity<items);return {items,capacity,packages,spare};
  };
  const first=apply(readMethod,23,6);assert.deepEqual(first,{items:23,capacity:6,packages:4,spare:1});
  async function addNote(c,text,label){
    await click(c,'add-note');const id=await c.eval("$('notes').lastElementChild.id");
    await set(c,id+'text',text);await set(c,id+'source','B garden club packing calculation');await set(c,id+'provenance','derived_interpretation');await set(c,id+'label',label);return id;
  }
  await addNote(b,'B checked 23 whole seed envelopes and capacity 6 against the permitted rule: 4 boxes, 1 spare slot. A’s badge result remains inherited. No delivery or spending obligation is assumed.','New candidate');
  await addNote(b,'Next garden club batch: items=29; capacity=4. Recompute for the smaller boxes before packing.','Next check');
  await set(b,'authored-name','garden-packing.md');await click(b,'new-authored');await settled(b);
  const result='Garden club result\n'+JSON.stringify(first)+'\nChecked the minimal sufficient whole-box count; no delivery or weight claim.\n';
  await set(b,'authored-text',result);await set(b,'criteria','Save the checked garden-club count and recheck the next smaller-box batch.');await click(b,'save');await settled(b);
  const made=await b.eval('saved');assert.equal(made.project_id,project.project_id);assert.notEqual(made.project_id,source.project_id);
  assert.equal(made.author_ref,project.author_ref);assert.equal(made.revision,2);
  assert(made.sources.some(s=>s.bounded_summary.includes('B checked 23')&&s.trust_class==='derived_interpretation'));
  assert(made.sources.some(s=>s.bounded_summary===brief&&s.trust_class==='imported_unverified'));

  const fresh=await participant();await login(fresh,local.env.LOCAL_PARTICIPANT_SESSION);await navigate(fresh,ownLink);
  await wait(()=>fresh.eval(`typeof saved!=='undefined'&&saved?.work_id===${JSON.stringify(made.work_id)}&&!busy`),'fresh method consumer');
  await click(fresh,'saved-context');await settled(fresh);const recovered=await fresh.eval("$('context-view').innerText");
  for(const text of [brief,conditions,'B checked 23','items=29; capacity=4'])assert(recovered.includes(text));
  await set(fresh,'authored-file','packing-method.md');await click(fresh,'open-authored');await settled(fresh);const freshMethod=await fresh.eval("$('authored-text').value");assert.equal(freshMethod,methodText);
  const next=await fresh.eval("[...document.querySelectorAll('#notes [data-field=text]')].find(e=>e.value.startsWith('Next garden club batch:')).value");
  const [,items,capacity]=next.match(/items=(\d+); capacity=(\d+)/);const second=apply(freshMethod,Number(items),Number(capacity));
  assert.deepEqual(second,{items:29,capacity:4,packages:8,spare:3});
  await set(fresh,'authored-file','garden-packing.md');await click(fresh,'open-authored');await settled(fresh);assert.equal(await fresh.eval("$('authored-text').value"),result);
  await set(fresh,'authored-text',result+'Fresh continuation for smaller boxes\n'+JSON.stringify(second)+'\nRechecked minimal capacity; the inherited method is unchanged.\n');
  const nextId=await fresh.eval("[...document.querySelectorAll('#notes [data-field=text]')].find(e=>e.value.startsWith('Next garden club batch:')).id");
  await set(fresh,nextId,'Checked the smaller-box batch: 29 envelopes at capacity 4 need 8 boxes with 3 spare slots. Next: compare the physical box count; delivery remains outside this work.');
  await click(fresh,'save');await settled(fresh);assert.equal(await fresh.eval('saved.revision'),3);
  await click(fresh,'refresh-work');await settled(fresh);await set(fresh,'authored-file','garden-packing.md');await click(fresh,'open-authored');await settled(fresh);
  assert((await fresh.eval("$('authored-text').value")).includes(JSON.stringify(second)));
  checks.push('Selected-method browser: A permits a whole packing method with inherited evidence and conditions; separately owned B saves checked output for a different consumer, and a fresh browser rechecks changed inputs and saves actual follow-up output through ordinary forms');
}
