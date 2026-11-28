import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';

async function recordVenueDecision(owner,work){
  const api=(path,body)=>owner.eval(`api(${JSON.stringify(path)},${JSON.stringify(body)})`);
  const route='/api/work/'+work.work_id;
  function exchange(kind,expected,basis,name,message){
    const bytes=Buffer.from(message);
    const file={name,media_type:'text/plain',bytes:bytes.length,data:bytes.toString('base64'),digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')};
    return api(route+'/exchanges/save',{kind,expected,basis,request_key:randomUUID(),message,next_action:'Check the venue reply.',files:[file]});
  }
  const request=await exchange('request',{revision:work.revision,fingerprint:work.fingerprint},null,'dates.txt','Can we use Tuesday?');
  const returned=await exchange('return',request.head,request.item.ref,'reply.txt','Tuesday is unavailable.');
  const inspected=await api(route+'/inspect-return',{returned:returned.item.ref,index:0,after:null});
  const chain=(await api(route+'/history')).revisions;
  const draft=await prepareReturnDraft(api,inspected.selection,{
    decision:'deferred',rationale:'The venue declined Tuesday.',next_action:'Check Thursday availability.'
  },{saved:chain.at(-1)});
  const decision=(await api(route+'/save',draft.body)).saved;
  return {history:[...chain,decision],decision,source:returned.item.ref};
}

// Ordinary forms in separately authenticated browser contexts. Response loss
// follows an actual committed write; neither success nor history is fabricated.
export async function browserWorkSuccession({owner,successor,local,click,set,settled,wait,navigate,barrier,checks}){
  const origin=local.origin;
  async function signIn(c,value){await c.send('Network.setCookie',{name:'web_planning_local',value,url:origin,httpOnly:true,sameSite:'Strict'});}
  async function continuation(c,url){await navigate(c,url);await wait(()=>c.eval("!!document.getElementById('work-context')&&typeof current!=='undefined'&&!!current&&!busy"),'successor work read');}
  async function openFromHome(c) {
    await navigate(c,origin+'/');
    assert.equal(await c.eval("document.querySelectorAll('#shared-work li a').length"),1);
    await continuation(c,await c.eval("document.querySelector('#shared-work li a').href"));
  }
  const b=await successor();
  await signIn(b,local.env.LOCAL_PARTICIPANT_SESSION);await navigate(b,origin+'/');
  assert.match(await b.eval("document.querySelector('#shared-work').textContent"),/No work has been shared/);
  assert.equal(await b.eval("!!document.getElementById('project-create')"),false);
  await signIn(owner,local.env.LOCAL_SESSION);await navigate(owner,origin+'/projects');
  await wait(()=>owner.eval("!!document.getElementById('project-create')"),'project entry');
  for(const [id,value] of Object.entries({'project-name':'Workshop succession','project-purpose':'Prepare an accurate workshop notice',
    'project-judgment':'The venue has confirmed the east ramp. Evening noise is unknown.','project-source':'Venue email',
    'project-unfinished':'Measure evening noise before selecting the room.','project-next':'Confirm the arrival time.'}))await set(owner,id,value);
  await click(owner,'project-submit');
  await wait(()=>owner.eval("!!document.getElementById('manage-continuation')&&typeof saved!=='undefined'&&!!saved&&!busy"),'new project work');
  const initial=await owner.eval('saved'),ownerUrl=await owner.eval('location.href'),management=origin+'/delegations/'+initial.project_id+'/'+initial.work_id;
  await set(owner,'non-goals','Do not send the notice before the noise check.');
  await click(owner,'manage-continuation');assert.equal(await owner.eval('location.href'),ownerUrl);
  assert.equal(await owner.eval('dirty'),true);assert.match(await owner.eval("$('status').textContent"),/Save or reconcile/);
  const ownerAck=await barrier(owner,'/api/work/'+initial.work_id+'/save');
  await click(owner,'save');await ownerAck.wait();assert.equal(await owner.eval('busy'),true);
  await click(owner,'manage-continuation');assert.equal(await owner.eval('location.href'),ownerUrl);
  await ownerAck.release('disconnect');assert.equal(await owner.eval('!!pending&&!busy'),true);
  await click(owner,'manage-continuation');assert.equal(await owner.eval('location.href'),ownerUrl);
  await click(owner,'resolve-save');await settled(owner);assert.equal(await owner.eval('pending'),null);
  const edited=await owner.eval('saved');assert.equal(edited.revision,initial.revision+1);
  checks.push('Owner navigation guards retain dirty, busy and uncertain work; read-only reconciliation of a committed owner save permits deliberate delegation');
  const {history,decision:original,source}=await recordVenueDecision(owner,edited);
  assert.deepEqual(history.slice(0,2),[initial,edited]);
  await click(owner,'manage-continuation');await wait(()=>owner.eval("!!document.getElementById('grant-form')&&typeof current!=='undefined'&&!!current&&!busy"),'owner delegation form');
  await set(owner,'recipient',local.env.LOCAL_PARTICIPANT_LOGIN);await set(owner,'obligation','Confirm arrival and retain the unknown noise condition.');await set(owner,'max-updates','2');
  const expires=await owner.eval("(()=>{const d=new Date(Date.now()+3600000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);})()");
  await set(owner,'expires',expires);await click(owner,'disclosure');
  const grantAck=await barrier(owner,'/api/work/'+original.work_id+'/continuation/create');
  await click(owner,'grant-submit');await grantAck.wait();await grantAck.release('disconnect');
  const pendingGrant=await owner.eval('pending');assert.deepEqual(Object.keys(pendingGrant),['grant_id']);
  await continuation(owner,management);assert.equal(await owner.eval("$('grant-submit').disabled"),true);
  await click(owner,'grant-reconcile');await settled(owner);assert.equal(await owner.eval('pending'),null);
  const link=await owner.eval("document.querySelector('#grants a').href"),grant=link.split('/').at(-1);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_continuation WHERE work_id=?').bind(original.work_id).first()).n,1);
  checks.push('Successor owner form: explicit full-history disclosure, finite grant, committed response loss, reload and read-only reconciliation retain exactly one delegation');

  await openFromHome(b);assert.equal(await b.eval('location.href'),link);
  assert.match(await b.eval("$('work-context').textContent"),/Evening noise is unknown/);
  assert.match(await b.eval("$('work-context').textContent"),/Do not send the notice before the noise check/);
  const records=await b.eval("[...document.querySelectorAll('#work-context details pre')].map(e=>JSON.parse(e.textContent))");
  assert.deepEqual(records,history,'ordinary browser exposes complete recorded history, including constraints and source status');
  assert.match(await b.eval("$('limits').textContent"),/unknown noise condition/);
  const proposedNextStep='Use Tuesday. Measure the room at 18:00 before the owner sends the notice.';
  await set(b,'report','Our draft still names Tuesday; evening noise remains unmeasured.');await set(b,'next-action',proposedNextStep);
  const saveAck=await barrier(b,'/api/continuation/'+grant+'/save');
  await click(b,'update-submit');await saveAck.wait();await saveAck.release('disconnect');
  const pendingSave=await b.eval('pending');assert.deepEqual(Object.keys(pendingSave),['request_key']);
  await continuation(b,link);assert.equal(await b.eval("$('update-submit').disabled"),true);
  await click(b,'resolve');await settled(b);assert.equal(await b.eval('pending'),null);
  assert.equal(await b.eval('current.saved.revision'),original.revision+1);assert.equal(await b.eval('current.remaining_updates'),1);
  const fresh=await successor();assert.notEqual(fresh.browserContextId,b.browserContextId);
  await fresh.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await signIn(fresh,local.env.LOCAL_PARTICIPANT_SESSION);await openFromHome(fresh);
  assert.equal(await fresh.eval('current.remaining_updates'),1);assert.match(await fresh.eval("$('work-context').textContent"),/Measure the room at 18:00/);
  const visible=await fresh.eval("$('work-context').innerText");
  assert.equal(await fresh.eval("$('saved-history').open"),false);
  assert.match(visible,/deferred[\s\S]+The venue declined Tuesday\.[\s\S]+Recorded next step: Check Thursday availability\.[\s\S]+Latest recipient report[\s\S]+Proposed next step: Use Tuesday\./);
  assert.equal(await fresh.eval("document.documentElement.scrollWidth<=innerWidth"),true);
  const passages=['reply.txt · deferred','Reason: '+original.return_use.rationale,
    'Recorded next step: '+original.return_use.next_action,'Proposed next step: '+proposedNextStep];
  const layouts=[];
  for(const [width,height] of [[1280,800],[390,844]]){
    await fresh.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width===390});
    const layout=await fresh.eval(`(() => {
      const candidates=[...document.querySelectorAll('#work-context h3, #work-context p')];
      const elements=${JSON.stringify(passages)}.map(text=>candidates.find(el=>el.textContent===text));
      if(elements.some(el=>!el))throw Error('Missing a decision or proposal passage');
      elements[0].scrollIntoView({block:'start',behavior:'instant'});
      const bounds=elements.map(el=>{
        const range=document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      });
      const viewport=window.visualViewport;
      const visible=bounds.every(r=>r.width>0 && r.height>0 &&
        r.top>=viewport.offsetTop && r.bottom<=viewport.offsetTop+viewport.height &&
        r.left>=viewport.offsetLeft && r.right<=viewport.offsetLeft+viewport.width);
      return {span:bounds.at(-1).bottom-bounds[0].top,visible,scale:viewport.scale};
    })()`);
    layouts.push({width,height,...layout});
  }
  assert.ok(layouts.every(layout=>layout.visible && layout.scale===1),
    'Decision, reason, recorded next step and full proposal must fit together after scrolling: '+JSON.stringify(layouts));
  const evidence=await fresh.eval(`(async()=>{
    const link=[...$('work-context').querySelectorAll('a')].find(a=>a.textContent.includes('Download evidence'));
    const response=await fetch(link.href);return [link.pathname,response.status,await response.text()];
  })()`);
  assert.deepEqual(evidence,['/api/continuation/'+grant+'/exchange-files/'+source.revision+'/'+source.fingerprint.slice(7)+'/0',200,'Tuesday is unavailable.']);
  await fresh.eval(`document.querySelector('a[href="#revision-${original.revision}"]').click()`);
  assert.equal(await fresh.eval(`$('saved-history').open && $('revision-${original.revision}').parentElement.open && JSON.parse($('revision-${original.revision}').nextElementSibling.textContent).fingerprint`),original.fingerprint);
  await set(fresh,'report','The 18:00 measurement is 38 dBA; the venue email gives a 40 dBA limit.');await set(fresh,'next-action','Owner reviews the measured result before sending the notice.');
  await click(fresh,'update-submit');await settled(fresh);
  assert.equal(await fresh.eval('current.saved.revision'),original.revision+2);assert.equal(await fresh.eval('current.remaining_updates'),0);assert.equal(await fresh.eval("$('update-submit').disabled"),true);
  assert.equal(await fresh.eval("$('update-fields').disabled && !$('go-to-update')"),true);
  checks.push('Successor browser: separate sign-in reads prior purpose/basis/obligation, reconciles a committed lost acknowledgement, and a fresh context records the next result without renewing its allowance');

  await click(owner,'refresh');await settled(owner);
  assert.deepEqual(await owner.eval('current.history.slice(0,-2)'),history);
  assert.equal(await owner.eval('current.history.filter(r=>r.continuation).length'),2);
  await owner.eval("document.querySelector('#grants button').click()");await settled(owner);
  await click(fresh,'refresh');await settled(fresh);
  assert.equal(await fresh.eval("$('work-context').textContent"),'');assert.equal(await fresh.eval("$('update-submit').disabled"),true);
  await navigate(fresh,origin+'/projects');
  assert.match(await fresh.eval("document.querySelector('#shared-work').textContent"),/No work has been shared/);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(original.work_id).first()).n,original.revision+2);
  checks.push('Successor revocation: future disclosure ends and private view clears; original authorship, two attributed results and remaining obligations stay in the owner history');

  await set(owner,'recipient',local.env.LOCAL_PARTICIPANT_LOGIN);
  await set(owner,'obligation','Read the recorded venue measurement.');await set(owner,'expires',expires);
  await set(owner,'grant-permission','read-only');
  await owner.eval("document.getElementById('grant-permission').dispatchEvent(new Event('change',{bubbles:true}))");
  assert.equal(await owner.eval("$('update-allowance').hidden && $('max-updates').disabled"),true);
  if(!await owner.eval("$('disclosure').checked"))await click(owner,'disclosure');
  await click(owner,'grant-submit');await settled(owner);
  assert.match(await owner.eval("$('grants').textContent"),/Read only/);
  await openFromHome(fresh);
  assert.equal(await fresh.eval('current.role'),'read-work-v1');assert.equal(await fresh.eval('current.remaining_updates'),0);
  assert.equal(await fresh.eval("!!document.getElementById('update-form')"),false);
  assert.match(await fresh.eval("$('work-context').innerText"),/The venue declined Tuesday\./);
  assert.match(await fresh.eval("$('work-context').textContent"),/38 dBA/);
  assert.match(await fresh.eval("$('limits').textContent"),/Read only/);
  checks.push('Read-only browser share: owner selects the permission, recipient discovers the existing history and reads the recorded measurement without an edit form');
  const spans=layouts.map(({width,height,span})=>width+'×'+height+' / '+span.toFixed(1)+' CSS px').join(', ');
  checks.push('From shared home at 390px: recorded file decision and conflicting recipient suggestion are distinct, exact evidence bytes and decision revision open, exhausted and read-only grants expose no update action. '+
    'Decision and full proposal fit together after scrolling: '+spans);
}
