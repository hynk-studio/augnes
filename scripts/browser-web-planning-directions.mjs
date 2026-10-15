import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {sceneFixture,sceneChoices} from './scene-continuity-fixture.mjs';
import {alternateScene,alternateReason,bell,primarySuccessor,alternateSuccessor} from './alternate-continuation-fixture.mjs';
// Extends the recovered B fixture. No second B producer or model harness.
export async function browserDirectionJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,replaceRuntime,barrier,countRows,root,checks}){
 const ready=async c=>{await navigate(c,origin+'/');await wait(()=>c.eval("$('list-state').textContent!=='Reading saved work…'"),'direction entry');};
 const choose=async(c,goal)=>{await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);await settled(c);};
 const primaryId=await a.eval('work'),inherited=await a.eval('sceneBook.scenes[0].id');
 const originRevision=await a.eval('saved');const before=await a.eval("api('/api/work/'+work+'/export')");
 await click(a,'branch-open');await set(a,'branch-reason',alternateReason);
 const delayed=await barrier(a,'/branch-preview');await click(a,'branch-preview');await delayed.wait();await set(a,'branch-reason','다른 이유');await set(a,'branch-reason',alternateReason);await delayed.release();assert.equal(await a.eval('relationPending'),null);assert.equal(await a.eval("$('relation-save').hidden"),true);
 const unchanged=await barrier(a,'/branch-preview');await click(a,'branch-preview');await unchanged.wait();await unchanged.release();assert.equal(await a.eval("$('relation-save').hidden"),false);
 await click(a,'relation-save');await saved(a,1);await settled(a);const alternateId=await a.eval('work');assert.notEqual(alternateId,primaryId);assert.equal(await a.eval('sceneInherited'),true); // newest inherited B successor is a draft but read-only
 assert.deepEqual(await a.eval('sceneBook.inheritance.scenes[0].review.dispositions'),sceneChoices);assert.equal(await a.eval('sceneBook.scenes.length'),0);
 await click(a,'scene-new');await set(a,'goal','봉인과 황제 — 대안');const fixture=alternateScene(primaryId,inherited);
 for(const [id,key] of [['scene-title','title'],['scene-viewpoint','viewpoint'],['scene-event','event_time'],['scene-reveal','reveal_order']])await set(a,id,fixture[key]);await set(a,'authored-text',fixture.draft);
 for(const [i,p] of fixture.proposals.entries()){await click(a,'scene-add-proposal');for(const [key,value] of Object.entries(p)){if(['revises','requires'].includes(key)){await a.eval(`(()=>{const e=$('scene-proposals').children[${i}].querySelector('[data-links=${key}]');for(const o of e.options)o.selected=${JSON.stringify(value)}.some(r=>r.work_id===JSON.parse(o.value).work_id&&r.scene_id===JSON.parse(o.value).scene_id&&r.proposal===JSON.parse(o.value).proposal);e.dispatchEvent(new Event('change',{bubbles:true}));})()`);}else await a.eval(`(()=>{const e=$('scene-proposals').children[${i}].querySelector('[data-scene-field=${key}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}}
 await click(a,'save');await saved(a,2);await settled(a);assert.equal(await a.eval('activeScene.review'),null);assert.equal(await a.eval("$('scene-proposals').children[0].querySelector('[data-links=revises]').selectedOptions.length"),2);
 for(const [i,value] of ['adopted','adopted','undecided'].entries())await set(a,'scene-disposition-'+i,value);await set(a,'scene-reason',alternateReason);await click(a,'scene-review-preview');await settled(a);await click(a,'scene-review-save');await saved(a,3);await settled(a);
 const altRevision=await a.eval('saved');const primary=await page(debug,origin);await ready(primary);await choose(primary,'봉인과 황제');
 const selectBranch=async()=>{await click(primary,'choose-branch');await settled(primary);await primary.eval("$('branch-choices').querySelector('button').click()");await settled(primary);};
 await selectBranch();await set(primary,'direction-disposition-1','adopted');await set(primary,'comparison-rationale','종만 채택한다. 폭로와 대안 원고는 남긴다.');
 const preview=await barrier(primary,'/incorporation-preview');await click(primary,'incorporation-preview');await preview.wait();await set(primary,'direction-disposition-1','undecided');await set(primary,'comparison-rationale','아직 미정');await preview.release();assert.equal(await primary.eval('relationPending'),null);assert.equal(await primary.eval("$('relation-save').hidden"),true);
 await set(primary,'direction-disposition-1','adopted');await set(primary,'comparison-rationale','종만 채택한다. 폭로와 대안 원고는 남긴다.');
 const cancelled=await barrier(primary,'/incorporation-preview');await click(primary,'incorporation-preview');await cancelled.wait();await click(primary,'relation-cancel');await cancelled.release();assert.equal(await primary.eval('relationPending'),null);
 // A remote edit after the server produced a comparison must also invalidate admission.
 const drift=await page(debug,origin);await ready(drift);await choose(drift,'봉인과 황제');
 const stale=await barrier(primary,'/incorporation-preview');await click(primary,'incorporation-preview');await stale.wait();await set(drift,'goal','봉인과 황제 — 원래 갈래 독립 수정');await click(drift,'save');await saved(drift,8);await settled(drift);await stale.release();assert.equal(await primary.eval('relationPending'),null);assert.equal(await primary.eval('comparisonCurrent'),false);
 assert.deepEqual(await primary.eval('choices()'),['undecided','adopted','undecided']);
 await click(primary,'recompare');await settled(primary);assert.equal(await primary.eval('saved.revision'),8);assert.deepEqual(await primary.eval('choices()'),['undecided','adopted','undecided']);
 const reject=await barrier(primary,'/incorporation-preview');await click(primary,'incorporation-preview');await reject.wait();await reject.release('unavailable');assert.equal(await primary.eval('relationPending'),null);assert.equal(await primary.eval('busy'),false);
 const good=await barrier(primary,'/incorporation-preview');await click(primary,'incorporation-preview');await good.wait();await good.release();assert.equal(await primary.eval("$('relation-save').hidden"),false);
 const exact=await primary.eval('relationPending');const sent=await barrier(primary,'/relation-save');await click(primary,'relation-save');await sent.wait();await click(primary,'relation-cancel');assert.deepEqual(await primary.eval('relationPending'),exact);await sent.release('disconnect');assert.equal(await primary.eval('relationUnknown'),true);await click(primary,'relation-resolve');await saved(primary,9);await settled(primary);
 assert.deepEqual(await primary.eval('sceneBook.adoptions[0].dispositions'),['undecided','adopted','undecided']);assert.equal(await primary.eval('sceneBook.scenes[0].review.dispositions[5]'),'rejected');
 assert.equal(await a.eval('saved.fingerprint'),altRevision.fingerprint);
 // Fresh processes and tabs consume the corresponding actual context, then save
 // deterministic drafts. Ordinary model use is a separately bounded observation.
 await replaceRuntime(false);const successors=[];
 for(const [goal,text,known] of [['봉인과 황제 — 원래 갈래 독립 수정',primarySuccessor,false],['봉인과 황제 — 대안',alternateSuccessor,true]]){
  const c=await page(debug,origin);await ready(c);await choose(c,goal);await click(c,'scene-new');await set(c,'scene-title','새벽의 다음 장면');await set(c,'scene-event',3);await set(c,'scene-reveal',2);await click(c,'scene-prepare');await settled(c);
  const context=await c.eval('sceneContext');assert(context.entries.some(e=>e.text===bell&&e.disposition==='adopted'));assert.equal(context.entries.some(e=>e.text===fixture.proposals[0].text&&e.disposition==='adopted'&&e.effective==='current'),known);
  assert.equal(context.originals[0].text,before.files.find(f=>f.digest===before.revisions.at(-1).files.find(f=>f.name==='manuscript.txt').digest)?Buffer.from(before.files.find(f=>f.digest===before.revisions.at(-1).files.find(f=>f.name==='manuscript.txt').digest).data,'base64').toString():null);
  await set(c,'authored-text',text);await click(c,'save');await settled(c);assert.equal(await c.eval('activeScene.review'),null);assert.equal(await c.eval("$('authored-text').value"),text);successors.push({client:c,context,draft:text,head:await c.eval('saved')});
 }
 const p=successors[0].client;await click(p,'choose-branch');await settled(p);await p.eval("$('branch-choices').querySelector('button').click()");await settled(p);
 const downloads=path.join(root,'direction-downloads');await mkdir(downloads);await p.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await click(p,'direction-export');await settled(p);await wait(async()=>(await readdir(downloads)).includes('story-directions.json'),'actual direction export download');
 const bundle=JSON.parse(await readFile(path.join(downloads,'story-directions.json'),'utf8'));assert.deepEqual(bundle.works[0].revisions.slice(0,7),before.revisions);
 await replaceRuntime(true);const dest=await page(debug,origin);await ready(dest);
 const pick=async file=>{await dest.eval("$('reconstruction').open=true");const {root:dom}=await dest.send('DOM.getDocument'),{nodeId}=await dest.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#import-file'});await dest.send('DOM.setFileInputFiles',{nodeId,files:[file]});};
 const bad=path.join(downloads,'bad-directions.json');await writeFile(bad,JSON.stringify({...bundle,works:bundle.works.slice(0,1)}));await pick(bad);await click(dest,'import');await settled(dest);assert.deepEqual(await countRows(),{revisions:0,files:0});
 await pick(path.join(downloads,'story-directions.json'));await click(dest,'import');await settled(dest);assert.equal(await dest.eval('work'),primaryId);
 await replaceRuntime(false);const readbacks=[];
 for(const expected of successors){const c=await page(debug,origin);await ready(c);await choose(c,expected.head.definition.goal);assert.equal(await c.eval("$('authored-text').value"),expected.draft);assert.equal(await c.eval('saved.fingerprint'),expected.head.fingerprint);readbacks.push({head:await c.eval('saved'),draft:await c.eval("$('authored-text').value")});}
 console.log(JSON.stringify({alternate_continuation_browser:{origin:originRevision,alternate_initial:altRevision,successors:successors.map(({context,draft,head})=>({context,draft,head})),readbacks,recovery:bundle,provenance:'Real browser controls and D1; deterministic successor drafts, not model use'}}));
 checks.push('C: real branch and inherited attribution; explicit reinterpretation; delayed/ABA/cancel/error/remote-drift preview admission; selected-only adoption with lost reply and exact reconciliation; independent fresh successor contexts/drafts; actual two-scope export, atomic refusal, replacement-store import and fresh reopening');
}
