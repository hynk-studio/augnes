import assert from 'node:assert/strict';
import { mkdir,readFile,readdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { digestBytes } from '../apps/web_planning/src/files.ts';
import { storyOriginal,storyRevised } from './story-worldbuilding-fixture.mjs';
import { sceneFixture,sceneChoices,sceneReason,deterministicSuccessor } from './scene-continuity-fixture.mjs';
export async function browserSceneJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,replaceRuntime,dropReply,requestsOnly,countRows,root,checks}){
 const ready=async c=>{await navigate(c,origin+'/');await wait(()=>c.eval("!!$('new-story')&&$('list-state').textContent!=='Reading saved work…'"),'scene entry');};
 const choose=async c=>{await c.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='봉인과 황제').click()");await settled(c);};
 await ready(a);await click(a,'new-story');await settled(a);await set(a,'goal','봉인과 황제');await set(a,'authored-text',storyOriginal);await click(a,'save');await saved(a,1);await settled(a);
 await set(a,'authored-text',storyRevised);await click(a,'save');await saved(a,2);await settled(a);
 await click(a,'scene-new');
 for(const [id,key] of [['scene-title','title'],['scene-viewpoint','viewpoint'],['scene-event','event_time'],['scene-reveal','reveal_order']])await set(a,id,sceneFixture[key]);
 await click(a,'scene-prepare');await settled(a);assert.equal(await a.eval('sceneContext.originals[0].text'),storyRevised);
 await set(a,'authored-text',sceneFixture.draft);
 for(const [i,p] of sceneFixture.proposals.entries()){await click(a,'scene-add-proposal');for(const [key,value] of Object.entries(p))await a.eval(`(()=>{const e=$('scene-proposals').children[${i}].querySelector('[data-scene-field=${key}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
 await click(a,'save');await saved(a,3);await settled(a);assert.equal(await a.eval('sceneBook.scenes[0].review'),null);assert.equal(await a.eval("$('authored-text').value"),sceneFixture.draft);
 const rival=await page(debug,origin);await ready(rival);await choose(rival);const retained=sceneFixture.draft+'\n\n다른 탭의 보존할 초안.';await set(rival,'authored-text',retained);
 for(const [i,value] of sceneChoices.entries())await set(a,'scene-disposition-'+i,value);await set(a,'scene-reason',sceneReason);await click(a,'scene-review-preview');await settled(a);
 assert.equal(await a.eval("$('scene-review-save').hidden"),false);const reviewedRequest=await a.eval('sceneReviewPending');
 await dropReply(a,'/scene-review-save');await click(a,'scene-review-save');await settled(a);assert.equal(await a.eval("$('scene-review-uncertain').hidden"),false);
 await requestsOnly(a);await click(a,'scene-review-resolve');await saved(a,4);await settled(a);
 assert.deepEqual(await a.eval('activeScene.review.dispositions'),sceneChoices);assert.equal(await a.eval("$('authored-text').disabled"),true);
 assert.equal((await a.eval(`api('/api/work/'+work+'/scene-review-save',${JSON.stringify(reviewedRequest)})`)).saved.revision,4);
 await click(rival,'save');await settled(rival);assert.equal(await rival.eval("$('authored-text').value"),retained);assert.equal(await rival.eval("$('conflict').hidden"),false);
 await click(rival,'review-latest');await settled(rival);assert.match(await rival.eval("$('conflict-latest').textContent"),/Reviewed scene/);
 await click(rival,'rebase-draft');await click(rival,'save');await settled(rival);assert.equal(await rival.eval("$('authored-text').value"),retained);assert.equal(await rival.eval('saved.revision'),4);
 await replaceRuntime(false);const fresh=await page(debug,origin);await ready(fresh);await choose(fresh);await saved(fresh,4);await settled(fresh);
 assert.deepEqual(await fresh.eval('activeScene.review.dispositions'),sceneChoices);await click(fresh,'scene-new');await set(fresh,'scene-title','등불이 꺼진 복도');await set(fresh,'scene-event',3);await set(fresh,'scene-reveal',2);await click(fresh,'scene-prepare');await settled(fresh);
 const context=await fresh.eval('sceneContext');assert(context.entries.some(e=>e.kind==='knowledge'&&e.disposition==='adopted'&&e.text.includes('아직 열지')));
 assert(context.entries.some(e=>e.kind==='intention'&&e.disposition==='undecided'));assert(context.entries.some(e=>e.disposition==='rejected'));
 const earlier=await fresh.eval("api('/api/work/'+work+'/scene-context',{expected:binding(saved),intent:{...sceneParameters(),event_time:1,reveal_order:1}})");assert.equal(earlier.entries.length,3);assert(!earlier.text.includes(sceneFixture.proposals[3].text));
 const downloads=path.join(root,'scene-downloads');await mkdir(downloads);await fresh.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await click(fresh,'scene-context-download');
 await wait(async()=>(await readdir(downloads)).includes('scene-context.txt'),'actual context download');const contextBytes=await readFile(path.join(downloads,'scene-context.txt'));assert.equal(contextBytes.toString(),context.text);assert.equal(digestBytes(contextBytes),context.fingerprint);
 // Preserve the actual producer bytes for a separately bounded ordinary-use
 // handoff. The model receives only this context file, not these assertions.
 console.log(JSON.stringify({scene_consumer_handoff:{context:contextBytes.toString(),context_sha256:digestBytes(contextBytes),complete_export:await fresh.eval("api('/api/work/'+work+'/export')"),provenance:'browser Download scene context; saved reviewed revision 4; no consumer has run'}}));
 const oversized='한'.repeat(90000);await set(fresh,'authored-text',oversized);await click(fresh,'save');await settled(fresh);assert.equal(await fresh.eval('saved.revision'),4);assert.equal(await fresh.eval("$('authored-text').value"),oversized);
 await set(fresh,'authored-text',deterministicSuccessor);await click(fresh,'save');await saved(fresh,5);await settled(fresh);
 assert.equal(await fresh.eval('activeScene.review'),null);assert.equal(await fresh.eval("$('authored-text').value"),deterministicSuccessor);
 // Detach/reattach the presentation using the common writer. Scene state stays
 // selected and cannot be implicitly erased or re-adopted by a presentation.
 for(const [value,revision] of [['ordinary',6],['story',7]]){await set(fresh,'presentation',value);await fresh.eval("$('presentation').dispatchEvent(new Event('change',{bubbles:true}))");await settled(fresh);await click(fresh,'save');await saved(fresh,revision);await settled(fresh);assert.deepEqual(await fresh.eval('sceneBook.scenes[0].review.dispositions'),sceneChoices);}
 const id=await fresh.eval('work');await fresh.eval("$('history-tools').open=true");await click(fresh,'export');await settled(fresh);await click(fresh,'reading-export');await settled(fresh);
 await wait(async()=>{const names=await readdir(downloads);return names.includes('planning-work.json')&&names.includes('authored-work.html');},'scene export downloads');
 const exported=JSON.parse(await readFile(path.join(downloads,'planning-work.json'),'utf8'));const html=await readFile(path.join(downloads,'authored-work.html'),'utf8');assert(html.includes('rejected'));assert.equal(exported.revisions.length,7);
 for(const [width,height] of [[390,844],[768,900],[1200,800]]){await fresh.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});assert(await fresh.eval('document.documentElement.scrollWidth<=innerWidth'));}
 await replaceRuntime(true);const dest=await page(debug,origin);await ready(dest);assert.equal(await dest.eval("$('list-state').textContent"),'No saved work yet.');
 const pick=async file=>{await dest.eval("$('reconstruction').open=true");const {root:dom}=await dest.send('DOM.getDocument');const {nodeId}=await dest.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#import-file'});await dest.send('DOM.setFileInputFiles',{nodeId,files:[file]});};
 const broken=path.join(downloads,'incomplete-scene.json');await writeFile(broken,JSON.stringify({...exported,files:exported.files.slice(1)}));await pick(broken);await click(dest,'import');await settled(dest);assert.deepEqual(await countRows(),{revisions:0,files:0});
 await pick(path.join(downloads,'planning-work.json'));await click(dest,'import');await saved(dest,7);await settled(dest);
 await replaceRuntime(false);const recovered=await page(debug,origin);await ready(recovered);await choose(recovered);await saved(recovered,7);await settled(recovered);
 assert.equal(await recovered.eval('work'),id);assert.equal(await recovered.eval("$('authored-text').value"),deterministicSuccessor);assert.deepEqual(await recovered.eval('sceneBook.scenes[0].review.dispositions'),sceneChoices);assert.deepEqual(await recovered.eval("api('/api/work/'+work+'/export')"),exported);
 console.log(JSON.stringify({scene_continuity_browser:{work_id:id,proposals:sceneFixture.proposals,dispositions:sceneChoices,context_sha256:context.fingerprint,successor_draft:deterministicSuccessor,successor_kind:'deterministic fixture; not model use',recovered_draft:await recovered.eval("$('authored-text').value"),revision_lineage:exported.revisions.map(r=>({revision:r.revision,fingerprint:r.fingerprint,predecessor:r.predecessor})),export_sha256:digestBytes(await readFile(path.join(downloads,'planning-work.json')))}}));
 checks.push('scene: original editor Save, persisted preparation and proposed changes, grouped adoption with actual dropped reply/reconciliation/replay; rival retained draft refusal; fresh workerd/browser successor; earlier-time exclusion; oversized draft retained; presentation detach/reattach; actual exported file consumed into separate empty D1 and fresh recovered reopening');
}
