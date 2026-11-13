import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, hash } from '../apps/web_planning/src/contract.ts';

// Extends the existing participant journey: this publication and the separately
// authenticated return/check/use/feedback all refer to the same real D1 request.
export async function browserPublicRequest({publisher,visitor,local,root,seed,grant,click,set,settled,wait,navigate,barrier,checks}){
  const origin=local.origin,management=origin+'/publications/'+local.env.PROJECT_ID+'/'+seed.work_id;
  await publisher.send('Network.setCookie',{name:'web_planning_local',value:local.env.LOCAL_SESSION,url:origin,httpOnly:true,sameSite:'Strict'});
  async function enter(){await navigate(publisher,management);await wait(()=>publisher.eval("typeof current!=='undefined'&&!!current&&!busy"),'publication source read');}
  async function publicJson(link){await navigate(visitor,link+'.json');return JSON.parse(await visitor.eval('document.body.innerText'));}
  const summary={project:'Community workshop',title:'x'.repeat(500),purpose:'Help attendees reach the workshop.',
    need:'A corrected arrival and step-free access notice.',reason:'Arrival and start times are ambiguous.',
    evidence:'Selected request revision; <script>globalThis.publicRequestInjected=true</script> is quoted text.',
    expected_return:'A corrected notice with arrival at 18:00 and start at 18:30.',checking_use:'The owner checks the room booking and decides whether to use the return.'};
  await enter();
  assert.deepEqual(await publisher.eval("keys.map(k=>$('summary-'+k).value)"),Object.keys(summary).map(()=>''));
  for(const width of [390,768,1200]){
    await publisher.send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:width===390});
    assert(await publisher.eval('document.documentElement.scrollWidth<=innerWidth+1'),'publisher viewport '+width);
  }
  async function prepare(){
    await set(publisher,'grant',grant.id);await publisher.eval("$('grant').dispatchEvent(new Event('change',{bubbles:true}))");
    for(const [key,value] of Object.entries(summary))await set(publisher,'summary-'+key,value);
    const expires=await publisher.eval("(()=>{const d=new Date(Date.now()+3600000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);})()");
    await set(publisher,'expires',expires);await click(publisher,'preview');
    assert.deepEqual(await publisher.eval("JSON.parse($('public-preview').textContent).summary"),summary);
    await click(publisher,'confirm-publication');
  }
  await prepare();
  const ack=await barrier(publisher,'/api/work/'+seed.work_id+'/public-requests/create');
  await click(publisher,'publication-submit');await ack.wait();await ack.release('disconnect');
  const pending=await publisher.eval('pending');assert.deepEqual(Object.keys(pending),['publication_id']);
  assert.equal(await publisher.eval("$('publication-submit').disabled"),true);
  await enter();
  assert.deepEqual(await publisher.eval('pending'),pending);
  assert.equal(await publisher.eval("$('publication-submit').disabled"),true);
  assert.deepEqual(await publisher.eval("keys.map(k=>$('summary-'+k).value)"),Object.keys(summary).map(()=>''));
  await click(publisher,'publication-resolve');await settled(publisher);
  assert.equal(await publisher.eval('pending'),null);
  const link=origin+'/public-requests/'+pending.publication_id;
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_public_request WHERE publication_id=?').bind(pending.publication_id).first()).n,1);
  checks.push('Public request owner form: eight blank selections, preview/confirmation, real committed response loss, locator-only reload and read-only recovery create exactly one publication; 390/768/1200 widths');

  const published=await publicJson(link);assert.deepEqual(published.summary,summary);assert.deepEqual(published.source.request,seed.request);
  assert.equal(published.status,'active');assert.equal(published.reply.url,grant.link);assert.equal(published.reply.can_submit,true);
  const cookies=(await visitor.send('Network.getCookies',{urls:[origin]})).cookies;
  assert(!cookies.some(c=>c.value===local.env.LOCAL_SESSION||c.value===local.env.LOCAL_PARTICIPANT_SESSION),'anonymous visitor cannot borrow private credentials');
  await navigate(visitor,link);
  assert.deepEqual(await visitor.eval("[...document.querySelectorAll('dd')].map(e=>e.textContent)"),Object.values(summary));
  assert.equal(await visitor.eval('globalThis.publicRequestInjected'),undefined);
  assert.equal(await visitor.eval('document.scripts.length'),0);
  assert.equal(await visitor.eval("document.body.innerText.includes('PRIVATE_')||document.body.innerText.includes('budget-private.txt')"),false);
  for(const width of [390,768,1200]){
    await visitor.send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:width===390});
    assert(await visitor.eval('document.documentElement.scrollWidth<=innerWidth+1'),'public request viewport '+width);
  }
  await writeFile(path.join(root,'public-request.png'),Buffer.from((await visitor.send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
  await visitor.eval("[...document.querySelectorAll('a')].find(a=>a.href.includes('/participate/')).click()");
  await wait(()=>visitor.eval("location.pathname.startsWith('/participate/')&&document.readyState==='complete'"),'anonymous response refusal');
  assert.equal(await visitor.eval("document.body.innerText.includes('PRIVATE_')||!!document.getElementById('send')"),false);
  checks.push('Anonymous Chrome context: matching selected HTML/JSON and exact source, inert markup, no owner/recipient cookie or private material, read-only response link refusal; 390/768/1200 widths');

  // An unavailable create has no acknowledgement and no committed row. Resolve
  // remains read-only; explicit retry must keep its original operation ID.
  await prepare();
  publisher.beforeRequest={method:'POST',path:'/api/work/'+seed.work_id+'/public-requests/create',unavailable:true};
  await click(publisher,'publication-submit');await settled(publisher);const unknown=await publisher.eval('pending');assert(unknown);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_public_request WHERE publication_id=?').bind(unknown.publication_id).first()).n,0);
  await click(publisher,'publication-resolve');await settled(publisher);
  assert.deepEqual(await publisher.eval('pending'),unknown);assert.equal(await publisher.eval('confirmedAbsent'),true);
  await click(publisher,'publication-submit');await settled(publisher);assert.equal(await publisher.eval('pending'),null);
  assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_public_request WHERE publication_id=?').bind(unknown.publication_id).first()).n,1);
  checks.push('Unknown publication outcome in Chrome: failed create and absent read retain the operation ID; explicit exact retry commits one row without allocating another ID');

  return async()=>{
    const answered=await publicJson(link);assert.equal(answered.status,'answered');assert.equal(answered.reply.can_submit,false);
    assert.deepEqual(answered.summary,published.summary);assert.deepEqual(answered.source,published.source);
    assert(!JSON.stringify(answered).includes('PRIVATE_'));
    await publisher.eval(`(()=>{const row=[...document.querySelectorAll('#publications section')].find(s=>s.querySelector('a')?.href===${JSON.stringify(link)});row.querySelector('button').click();})()`);await settled(publisher);
    const withdrawn=await publicJson(link);assert.deepEqual(withdrawn,{schema:'augnes.public-request.v1',id:pending.publication_id,status:'withdrawn',available:false});
    await navigate(visitor,link);assert.equal(await visitor.eval("document.querySelectorAll('dd').length"),0);
    // Match the coherent finite-expiry fixture used by the D1 checks. The clock
    // and production code are unchanged; no sleep or real publication is used.
    const row=await local.db.prepare('SELECT material FROM web_planning_public_request WHERE publication_id=?').bind(unknown.publication_id).first();
    const past=Date.now()-1000,material=canonical({...JSON.parse(row.material),expires:past});
    await local.db.prepare('UPDATE web_planning_public_request SET expires=?,material=?,material_fingerprint=? WHERE publication_id=?').bind(past,material,hash(material),unknown.publication_id).run();
    const expired=await publicJson(origin+'/public-requests/'+unknown.publication_id);assert.equal(expired.status,'expired');assert.equal(expired.available,false);assert(!Object.hasOwn(expired,'summary'));
    await navigate(visitor,origin+'/public-requests/'+unknown.publication_id);assert.equal(await visitor.eval("document.querySelectorAll('dd').length"),0);
    checks.push('Same disclosed request reaches separately authenticated return, actual checked/adapted output and fresh feedback; answered is distinct from use, withdrawal and expiry remove selected HTML/JSON material');
  };
}
