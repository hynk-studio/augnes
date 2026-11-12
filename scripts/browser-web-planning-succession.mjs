import assert from 'node:assert/strict';

// Ordinary forms in separately authenticated browser contexts. Response loss
// follows an actual committed write; neither success nor history is fabricated.
export async function browserWorkSuccession({owner,successor,local,click,set,settled,wait,navigate,barrier,checks}){
  const origin=local.origin;
  async function signIn(c,value){await c.send('Network.setCookie',{name:'web_planning_local',value,url:origin,httpOnly:true,sameSite:'Strict'});}
  async function continuation(c,url){await navigate(c,url);await wait(()=>c.eval("!!document.getElementById('work-context')&&typeof current!=='undefined'&&!!current&&!busy"),'successor work read');}
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
  const original=await owner.eval('saved');assert.equal(original.revision,initial.revision+1);
  checks.push('Owner navigation guards retain dirty, busy and uncertain work; read-only reconciliation of a committed owner save permits deliberate delegation');
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

  const b=await successor();await signIn(b,local.env.LOCAL_PARTICIPANT_SESSION);await continuation(b,link);
  assert.match(await b.eval("$('work-context').textContent"),/Evening noise is unknown/);
  assert.match(await b.eval("$('work-context').textContent"),/Do not send the notice before the noise check/);
  const records=await b.eval("[...document.querySelectorAll('#work-context details pre')].map(e=>JSON.parse(e.textContent))");
  assert.deepEqual(records,[initial,original],'ordinary browser exposes complete recorded history, including constraints and source status');
  assert.match(await b.eval("$('limits').textContent"),/unknown noise condition/);
  await set(b,'report','The venue email confirms arrival at 18:00; evening noise remains unmeasured.');await set(b,'next-action','Measure the room at 18:00 before the owner sends the notice.');
  const saveAck=await barrier(b,'/api/continuation/'+grant+'/save');
  await click(b,'update-submit');await saveAck.wait();await saveAck.release('disconnect');
  const pendingSave=await b.eval('pending');assert.deepEqual(Object.keys(pendingSave),['request_key']);
  await continuation(b,link);assert.equal(await b.eval("$('update-submit').disabled"),true);
  await click(b,'resolve');await settled(b);assert.equal(await b.eval('pending'),null);
  assert.equal(await b.eval('current.saved.revision'),original.revision+1);assert.equal(await b.eval('current.remaining_updates'),1);
  const fresh=await successor();assert.notEqual(fresh.browserContextId,b.browserContextId);
  await signIn(fresh,local.env.LOCAL_PARTICIPANT_SESSION);await continuation(fresh,link);
  assert.equal(await fresh.eval('current.remaining_updates'),1);assert.match(await fresh.eval("$('work-context').textContent"),/Measure the room at 18:00/);
  await set(fresh,'report','The 18:00 measurement is 38 dBA; the venue email gives a 40 dBA limit.');await set(fresh,'next-action','Owner reviews the measured result before sending the notice.');
  await click(fresh,'update-submit');await settled(fresh);
  assert.equal(await fresh.eval('current.saved.revision'),original.revision+2);assert.equal(await fresh.eval('current.remaining_updates'),0);assert.equal(await fresh.eval("$('update-submit').disabled"),true);
  checks.push('Successor browser: separate sign-in reads prior purpose/basis/obligation, reconciles a committed lost acknowledgement, and a fresh context records the next result without renewing its allowance');

  await click(owner,'refresh');await settled(owner);
  assert.deepEqual(await owner.eval('current.history[0]'),initial);assert.deepEqual(await owner.eval('current.history[1]'),original);
  assert.equal(await owner.eval('current.history.filter(r=>r.continuation).length'),2);
  await owner.eval("document.querySelector('#grants button').click()");await settled(owner);
  await click(fresh,'refresh');await settled(fresh);
  assert.equal(await fresh.eval("$('work-context').textContent"),'');assert.equal(await fresh.eval("$('update-submit').disabled"),true);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(original.work_id).first()).n,original.revision+2);
  checks.push('Successor revocation: future disclosure ends and private view clears; original authorship, two attributed results and remaining obligations stay in the owner history');
}
