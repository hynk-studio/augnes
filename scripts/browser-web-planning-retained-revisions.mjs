import assert from 'node:assert/strict';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { retainedReason, additionalSetting, additionalDraft } from './web-planning-retained-revision-checks.mjs';

// Continue the existing recovered C pair; do not duplicate its producer harness
// or replace the original bell-only / consumer-observation evidence.
export async function browserRetainedRevisionJourney({debug,origin,page,click,set,settled,wait,navigate,replaceRuntime,root,checks,readbacks}){
 const open=async goal=>{const c=await page(debug,origin);await navigate(c,origin+'/');await wait(()=>c.eval("$('list-state').textContent!=='Reading saved work…'"),'retained revision entry');await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);await settled(c);return c;};
 let primary=await open(readbacks[0].head.definition.goal),alternate=await open(readbacks[1].head.definition.goal);
 const compare=async(c,choices)=>{await click(c,'choose-branch');await settled(c);await c.eval("$('branch-choices').querySelector('button').click()");await settled(c);for(const [i,d] of choices.entries())await set(c,'direction-disposition-'+i,d);await set(c,'comparison-rationale',retainedReason);};
 const preview=async c=>{await click(c,'incorporation-preview');await settled(c);return {pending:await c.eval('relationPending'),state:await c.eval("$('relation-state').textContent"),status:await c.eval("$('status').textContent"),action:await c.eval("!$('relation-save').hidden")};};
 const confirm=async c=>{await click(c,'relation-save');await settled(c);return c.eval('saved');};
 const pair=async c=>c.eval("api('/api/work/'+work+'/direction-export',{expected:binding(saved),source:{work_id:comparison.branch.work_id,...binding(comparison.branch)}})");
 const choices=['adopted','adopted','undecided'];await compare(primary,choices);const first=await preview(primary);assert(first.pending);const adopted=await confirm(primary),firstBook=await primary.eval('sceneBook');
 await compare(primary,choices);const before=await pair(primary),unchanged=await preview(primary);
 console.log(JSON.stringify({retained_revision_browser_unchanged:unchanged.pending?{action:unchanged.action,state:unchanged.state}:{action:unchanged.action,status:unchanged.status}}));
 if(unchanged.pending){assert.notEqual(unchanged.pending.ticket,first.pending.ticket);assert.match(unchanged.state,/unchanged/);assert.deepEqual(await confirm(primary),adopted);assert.match(await primary.eval("$('status').textContent"),/No change/);await compare(primary,choices);assert.deepEqual(await pair(primary),before);}
 await click(primary,'relation-cancel');await set(primary,'goal',adopted.definition.goal+' — 보존할 새 수정');await click(primary,'save');await settled(primary);const independent=await primary.eval('saved');
 await click(alternate,'scene-new');await set(alternate,'scene-title','푸른 등불');await set(alternate,'scene-event',3);await set(alternate,'scene-reveal',2);await set(alternate,'authored-text',additionalDraft);await click(alternate,'scene-add-proposal');
 for(const [key,value] of Object.entries(additionalSetting))await alternate.eval(`(()=>{const e=$('scene-proposals').children[0].querySelector('[data-scene-field=${key}]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await click(alternate,'save');await settled(alternate);assert.equal(await alternate.eval('activeScene.review'),null);
 await set(alternate,'scene-disposition-0','adopted');await set(alternate,'scene-reason',retainedReason);await click(alternate,'scene-review-preview');await settled(alternate);await click(alternate,'scene-review-save');await settled(alternate);
 const expanded=[...choices,'adopted'];await compare(primary,expanded);const addition=await preview(primary);
 console.log(JSON.stringify({retained_revision_browser_addition:addition.pending?{action:addition.action,state:addition.state}:{action:addition.action,status:addition.status}}));
 assert.deepEqual([!!unchanged.pending,!!addition.pending],[true,true],'real controls must admit both new previews');
 assert(!addition.state.includes('unchanged'));assert.deepEqual(addition.pending.intent.selection.dispositions,expanded);
 const result=await confirm(primary);assert.equal(result.revision,independent.revision+1);assert.deepEqual(result.definition,independent.definition);
 const afterBook=await primary.eval('sceneBook');assert.deepEqual(afterBook.adoptions.slice(0,firstBook.adoptions.length),firstBook.adoptions);assert.deepEqual(afterBook.adoptions.at(-1).units[0],firstBook.adoptions.at(-1).units[0]);assert.deepEqual(afterBook.scenes,firstBook.scenes);
 const expected=[{head:result,draft:await primary.eval("$('authored-text').value"),book:afterBook},{head:await alternate.eval('saved'),draft:additionalDraft,book:await alternate.eval('sceneBook')}];
 await compare(primary,expanded);const post=await pair(primary),again=await preview(primary);assert.match(again.state,/unchanged/);assert.deepEqual(await confirm(primary),result);await compare(primary,expanded);assert.deepEqual(await pair(primary),post);
 // Actual download, fresh empty store, import picker, new process and new tabs.
 const downloads=path.join(root,'retained-revision-downloads');await mkdir(downloads);await primary.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await click(primary,'direction-export');await settled(primary);await wait(async()=>(await readdir(downloads)).includes('story-directions.json'),'retained pair download');
 const bundle=JSON.parse(await readFile(path.join(downloads,'story-directions.json'),'utf8'));assert.deepEqual(bundle,post.recovery);
 await replaceRuntime(true);const dest=await page(debug,origin);await navigate(dest,origin+'/');await wait(()=>dest.eval("$('list-state').textContent==='No saved work yet.'"),'empty retained recovery');
 await dest.eval("$('reconstruction').open=true");const {root:dom}=await dest.send('DOM.getDocument'),{nodeId}=await dest.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#import-file'});await dest.send('DOM.setFileInputFiles',{nodeId,files:[path.join(downloads,'story-directions.json')]});await click(dest,'import');await settled(dest);assert.equal(await dest.eval('work'),result.work_id);
 await replaceRuntime(false);const recovered=[];
 for(const e of expected){const c=await open(e.head.definition.goal);assert.deepEqual(await c.eval('saved'),e.head);assert.deepEqual(await c.eval('sceneBook'),e.book);assert.equal(await c.eval("$('authored-text').value"),e.draft);
  await click(c,'scene-new');await set(c,'scene-title','복구 후 읽기');await set(c,'scene-event',3);await set(c,'scene-reveal',2);await set(c,'scene-viewpoint','하린');await click(c,'scene-prepare');await settled(c);const context=await c.eval('sceneContext');
  assert(context.entries.some(u=>u.text===additionalSetting.text&&u.disposition==='adopted'&&u.effective==='current'));
  assert(context.entries.some(u=>u.text===firstBook.adoptions.at(-1).units[0].proposal.text&&u.effective==='current'));
  assert(context.entries.some(u=>u.effective==='superseded'&&u.disposition==='rejected'));recovered.push({head:e.head,context,draft:e.draft});
 }
 primary=await open(result.definition.goal);await compare(primary,expanded);const recoveredPreview=await preview(primary);assert.match(recoveredPreview.state,/unchanged/);assert.deepEqual(await confirm(primary),result);
 console.log(JSON.stringify({retained_revision_browser:{adopted,additional_selection:result,initial_attribution:firstBook.adoptions.at(-1),final_book:afterBook,recovered,recovery:bundle,provenance:'Real browser controls and D1; fresh tickets, explicit confirmations and empty-store recovery; no model use'}}));
 checks.push('C retained retcon: fresh-ticket no-op without changed bytes; retain exact retcon plus new independent reviewed setting; one intended update, preserved attribution/prose/target edits; actual export/import and fresh-process reopening; recovered no-op');
}
