import assert from 'node:assert/strict';
import { mkdir,readFile,readdir } from 'node:fs/promises';
import path from 'node:path';
import { storyOriginal } from './story-worldbuilding-fixture.mjs';
import { sceneFixture } from './scene-continuity-fixture.mjs';

export async function browserSceneResponseJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,root,checks,requests,barrier}){
 const ready=async c=>{await navigate(c,origin+'/');await wait(()=>c.eval("!!$('new-story')&&$('list-state').textContent!=='Reading saved work…'"),'scene response entry');};
 const goal='Delayed scene response regression';
 const fresh=async()=>{const c=await page(debug,origin);await ready(c);await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);await settled(c);return c;};
 const held=async(c,suffix,button)=>{const h=await barrier(c,suffix);await click(c,button);await h.wait();return h;};
 const noContext=async c=>{assert.equal(await c.eval('sceneContext'),null);assert.equal(await c.eval("$('scene-context-download').hidden"),true);};
 const noReview=async c=>{assert.equal(await c.eval('sceneReviewPending'),null);assert.equal(await c.eval("$('scene-review-save').hidden"),true);assert.equal(await c.eval("$('edit-fields').disabled"),false);};
 await ready(a);await click(a,'new-story');await settled(a);await set(a,'goal',goal);await set(a,'authored-text',storyOriginal);await click(a,'save');await saved(a,1);await settled(a);
 await click(a,'scene-new');await set(a,'scene-title','봉인을 지키는 장면');await set(a,'scene-viewpoint','하린');await set(a,'scene-event',3);await set(a,'scene-reveal',2);await set(a,'authored-text',sceneFixture.draft);
 await click(a,'scene-add-proposal');for(const [key,value] of Object.entries(sceneFixture.proposals[3]))await a.eval(`(()=>{const e=$('scene-proposals').children[0].querySelector('[data-scene-field=${key}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await click(a,'save');await saved(a,2);await settled(a);
 // Record both failures before asserting, so the unchanged reviewed client
 // demonstrates both races in one real Browser/D1 run.
 const contextHold=await held(a,'/scene-context','scene-prepare');await set(a,'scene-event',1);await contextHold.release();
 const contextRace=await a.eval("({visible_event:$('scene-event').value,admitted_event:sceneContext?.parameters.event_time??null,download:!$('scene-context-download').hidden,draft:$('authored-text').value})");
 const b=await fresh();await set(b,'scene-disposition-0','adopted');await set(b,'scene-reason','처음 선택');
 const previewHold=await held(b,'/scene-review-preview','scene-review-preview');await set(b,'scene-disposition-0','undecided');await set(b,'scene-reason','현재 선택은 미정');await previewHold.release();
 const previewRace=await b.eval("({visible_choice:$('scene-disposition-0').value,visible_reason:$('scene-reason').value,pending_choice:sceneReviewPending?.intent.dispositions[0]??null,pending_reason:sceneReviewPending?.intent.reason??null,adoption_action:!$('scene-review-save').hidden})");
 if(previewRace.adoption_action){await click(b,'scene-review-save');await settled(b);previewRace.persisted_choice=await b.eval('activeScene.review?.dispositions[0]');}
 console.log(JSON.stringify({scene_response_reported_races:{context:contextRace,preview:previewRace}}));
 assert.deepEqual({context_admitted:contextRace.admitted_event,context_download:contextRace.download,preview_choice:previewRace.pending_choice,adoption_action:previewRace.adoption_action},{context_admitted:null,context_download:false,preview_choice:null,adoption_action:false});
 assert.equal(contextRace.visible_event,'1');assert.equal(contextRace.draft,sceneFixture.draft);await noReview(b);
 // Unchanged delayed responses remain usable, including the real download and
 // the explicit re-review's eventual request/persisted choices.
 const currentContext=await held(a,'/scene-context','scene-prepare');await currentContext.release();assert.equal(await a.eval('sceneContext.parameters.event_time'),1);
 const downloads=path.join(root,'scene-response-downloads');await mkdir(downloads);await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await click(a,'scene-context-download');await wait(async()=>(await readdir(downloads)).includes('scene-context.txt'),'current scene download');assert.equal(await readFile(path.join(downloads,'scene-context.txt'),'utf8'),await a.eval('sceneContext.text'));
 await set(a,'scene-event',2);await noContext(a);
 // Every preparation parameter, change-only selection events, and ABA edits.
 for(const [id,value,event] of [['scene-title','別の場面','input'],['scene-viewpoint','문지기','input'],['scene-event',1,'input'],['scene-reveal',0,'input'],['scene-sources',false,'change'],['scene-event',3,'aba']]){
   const c=await fresh(),h=await held(c,'/scene-context','scene-prepare');
   if(id==='scene-sources')await c.eval("$('scene-sources').options[0].selected=false;$('scene-sources').dispatchEvent(new Event('change',{bubbles:true}))");
   else {await set(c,id,event==='aba'?1:value);if(event==='aba')await set(c,id,value);}
   await h.release();await noContext(c);assert.equal(await c.eval("$('authored-text').value"),sceneFixture.draft);
 }
 // Open scene is a real synchronous control available during these requests.
 for(const [suffix,button] of [['/scene-context','scene-prepare'],['/scene-review-preview','scene-review-preview']]){
   const c=await fresh();if(button==='scene-review-preview')await set(c,'scene-reason','開き直す前の理由');const h=await held(c,suffix,button);await click(c,'scene-open');const current=await c.eval("$('authored-text').value");await h.release();await noContext(c);await noReview(c);assert.equal(await c.eval("$('authored-text').value"),current);
 }
 const next=await fresh();await set(next,'scene-reason','次の場面へ');const abandoned=await held(next,'/scene-review-preview','scene-review-preview');await click(next,'scene-new');await set(next,'authored-text','새 장면에 남길 글.');await abandoned.release();await noReview(next);assert.equal(await next.eval("$('authored-text').value"),'새 장면에 남길 글.');
 // Work navigation already shares run's busy guard. Preserve that serialization,
 // then prove deliberate navigation clears the completed preparation.
 const leaving=await fresh(),workId=await leaving.eval('work'),leavingHold=await held(leaving,'/scene-context','scene-prepare');await click(leaving,'new-work');assert.equal(await leaving.eval('work'),workId);await leavingHold.release();await click(leaving,'new-work');await settled(leaving);assert.equal(await leaving.eval('work'),null);await noContext(leaving);await noReview(leaving);
 // Current draft/proposals and change-only review events invalidate an in-flight
 // preview, even when the author later restores the original displayed values.
 for(const kind of ['draft','proposal-add','proposal-remove','proposal-edit','reason-aba','choice-change']){
   const c=await fresh();await set(c,'scene-reason','検討中');const h=await held(c,'/scene-review-preview','scene-review-preview');
   if(kind==='draft')await set(c,'authored-text',sceneFixture.draft+'\n\n남겨 둘 초안.');
   if(kind==='proposal-add')await click(c,'scene-add-proposal');
   if(kind==='proposal-remove')await c.eval("$('scene-proposals').querySelector('button').click()");
   if(kind==='proposal-edit')await c.eval("const e=$('scene-proposals').querySelector('[data-scene-field=text]');e.value='다시 검토할 제안';e.dispatchEvent(new Event('input',{bubbles:true}))");
   if(kind==='reason-aba'){await set(c,'scene-reason','変更');await set(c,'scene-reason','検討中');}
   if(kind==='choice-change')await c.eval("$('scene-disposition-0').value='rejected';$('scene-disposition-0').dispatchEvent(new Event('change',{bubbles:true}))");
   const writing=await c.eval("$('authored-text').value");await h.release();await noReview(c);assert.equal(await c.eval("$('authored-text').value"),writing);
 }
 for(const [suffix,button] of [['/scene-context','scene-prepare'],['/scene-review-preview','scene-review-preview']]){
   const c=await fresh();await set(c,'scene-reason','保留');const h=await held(c,suffix,button);await h.release('unavailable');await noContext(c);await noReview(c);assert.equal(await c.eval('busy'),false);assert.equal(await c.eval("$('authored-text').value"),sceneFixture.draft);
   const late=await held(c,suffix,button);await set(c,button==='scene-prepare'?'scene-event':'scene-reason',button==='scene-prepare'?1:'新しい理由');const state=await c.eval("[$('scene-context').textContent,$('scene-review-summary').textContent,$('status').textContent]");await late.release('unavailable');assert.deepEqual(await c.eval("[$('scene-context').textContent,$('scene-review-summary').textContent,$('status').textContent]"),state);assert.equal(await c.eval('busy'),false);
 }
 // Negative control for the action boundary: a programmatic value replacement
 // without an input event must still refuse the older ticket before any POST.
 const silent=await fresh();await set(silent,'scene-reason','明示レビュー');await click(silent,'scene-review-preview');await settled(silent);const beforeSilent=requests.length;await silent.eval("$('scene-disposition-0').value='adopted'");await click(silent,'scene-review-save');await settled(silent);await noReview(silent);assert.equal(requests.slice(beforeSilent).filter(r=>r.path.endsWith('/scene-review-save')).length,0);
 const review=await held(b,'/scene-review-preview','scene-review-preview');await review.release();assert.equal(await b.eval('sceneReviewPending.intent.dispositions[0]'),'undecided');assert.equal(await b.eval('sceneReviewPending.intent.reason'),'현재 선택은 미정');
 await click(b,'scene-review-cancel');await noReview(b);await set(b,'scene-reason','완료 후 바뀐 이유');await click(b,'scene-review-preview');await settled(b);await set(b,'scene-reason','최종 미정');await noReview(b);
 const finalReview=await held(b,'/scene-review-preview','scene-review-preview');await finalReview.release();const intended=await b.eval('sceneReviewPending');const start=requests.length;await click(b,'scene-review-save');await saved(b,3);await settled(b);
 const writes=requests.slice(start).filter(r=>r.path.endsWith('/scene-review-save'));assert.equal(writes.length,1);const submitted=JSON.parse(writes[0].body);assert.equal(submitted.ticket,intended.ticket);assert.deepEqual(submitted.intent,intended.intent);
 const reopened=await fresh();assert.equal(await reopened.eval('activeScene.review.dispositions[0]'),'undecided');assert.equal(await reopened.eval('activeScene.review.reason'),'최종 미정');
 // A real stale Save exposes Review latest / Keep my draft. Rebase while the
 // old-basis context refusal is held; its late error must not restore conflict
 // UI or overwrite the retained writing. The next explicit read uses revision 4.
 const stale=await fresh(),rival=await fresh();await set(stale,'criteria','Keep this unsaved criterion.');await set(rival,'criteria','A separate saved criterion.');await click(rival,'save');await saved(rival,4);await settled(rival);
 await click(stale,'save');await settled(stale);assert.equal(await stale.eval("$('conflict').hidden"),false);await click(stale,'review-latest');await settled(stale);assert.equal(await stale.eval('reviewed.revision'),4);
 const oldBasis=await barrier(stale,'/scene-context',409);await click(stale,'scene-prepare');await oldBasis.wait();await click(stale,'rebase-draft');assert.equal(await stale.eval('saved.revision'),4);const rebasedStatus=await stale.eval("$('status').textContent");await oldBasis.release();await noContext(stale);assert.equal(await stale.eval("$('conflict').hidden"),true);assert.equal(await stale.eval("$('status').textContent"),rebasedStatus);assert.equal(await stale.eval("$('criteria').value"),'Keep this unsaved criterion.');assert.equal(await stale.eval("$('authored-text').value"),sceneFixture.draft);
 const newBasis=await held(stale,'/scene-context','scene-prepare');await newBasis.release();assert.equal(await stale.eval('sceneContext.basis.revision'),4);
 console.log(JSON.stringify({scene_response_admission:{status:'pass',explicit_review_request:submitted.intent,persisted_review:await reopened.eval('activeScene.review'),normal_context_download:true,deterministic_response_barriers:true}}));
 checks.push('scene response admission: both reported races, all preparation parameters/source selection, ABA edits, scene replacement, serialized work navigation, actual stale-save rebase, draft/proposal changes, completed-preview edit/cancel, current/stale rejected responses, action snapshot refusal, unchanged delayed display/download/review and exact explicit adoption/persisted choice');
}
