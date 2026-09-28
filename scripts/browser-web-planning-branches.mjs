import assert from 'node:assert/strict';

// The existing Browser owner supplies real Chrome, loopback D1 and cleanup.
// Writes below use visible controls, not a fixture-only record constructor.
export async function browserBranchJourney({a,debug,origin,page,click,set,settled,saved,wait,visible,navigate,login,requestsOnly,requests,restart,checks}) {
 async function selectWork(c,goal){await c.eval(`(()=>{const b=[...document.querySelectorAll('#work-list button')].find(b=>b.textContent===${JSON.stringify(goal)});if(!b)throw Error('work not listed');b.click();})()`);await settled(c);}
 async function add(c,note){await click(c,'add-note');await c.eval(`(()=>{const row=$('notes').lastElementChild;for(const [k,v] of Object.entries(${JSON.stringify(note)})){const e=row.querySelector('[data-field='+k+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);}
 async function choose(text,disposition,rationale=''){await a.eval(`(()=>{const row=[...$('material-choices').children].find(r=>r.querySelector('.note-text').textContent===${JSON.stringify(text)});row.querySelector('select').value=${JSON.stringify(disposition)};row.querySelector('textarea').value=${JSON.stringify(rationale)};row.querySelector('select').dispatchEvent(new Event('input',{bubbles:true}));})()`);}
 await settled(a);await click(a,'new-work');await set(a,'goal','Branch acceptance target');await set(a,'criteria','Keep qualified observations');await set(a,'non-goals','No booking or execution');
 await add(a,{text:'Original planning question: keep one owner and exact saved material.',source:'Synthetic original owner',label:'Open question'});await click(a,'save');await saved(a,1);await settled(a);
 const w=await a.eval('saved.work_id'),originFingerprint=await a.eval('saved.fingerprint');
 assert.match(await a.eval("$('change-list').textContent"),/No definition or selection edits/);
 await click(a,'save');await settled(a);assert.equal(await a.eval('saved.revision'),1);assert.equal(await a.eval('saved.fingerprint'),originFingerprint);
 await click(a,'branch-open');await set(a,'branch-reason','Explore measured conditions before choosing a room');await click(a,'branch-preview');await settled(a);
 assert.match(await a.eval("$('relation-preview').innerText"),/Original planning question/);assert.match(await a.eval("$('relation-preview').innerText"),/No booking or execution/);
 await click(a,'relation-save');await settled(a);const b=await a.eval('saved.work_id');assert.notEqual(w,b);assert.equal(await a.eval('saved.relations.origin.source.fingerprint'),originFingerprint);
 const condition='Only Tuesday evenings with windows closed were measured. Weekend noise remains unknown.';
 const observation='The measured Tuesday level was 38 dBA under the linked condition.';
 const recommendation='Choose the room now for every event.';
 await set(a,'goal','Branch measured evening conditions');
 await add(a,{text:condition,source:'Synthetic observer qualification',label:'Open question'});
 await add(a,{text:observation,source:'Synthetic observer measurement',label:'New candidate'});
 await add(a,{text:recommendation,source:'Synthetic broader recommendation',label:'Next check',provenance:'derived_interpretation'});
 await a.eval(`(()=>{const rows=[...$('notes').children],o=rows.find(r=>r.querySelector('[data-field=text]').value===${JSON.stringify(observation)}),q=rows.find(r=>r.querySelector('[data-field=text]').value===${JSON.stringify(condition)});const s=o.querySelector('.dependencies');for(const option of s.options)option.selected=option.value===q.id;s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await click(a,'save');await saved(a,2);await settled(a);assert.equal(await a.eval('saved.relations.origin.source.fingerprint'),originFingerprint);
 const sourceTab=await page(debug,origin);await navigate(sourceTab,origin+'/');await wait(()=>sourceTab.eval("$('list-state')?.textContent!=='Reading saved work…'"),'branch tab list');await selectWork(sourceTab,'Branch measured evening conditions');
 await selectWork(a,'Branch acceptance target');await set(a,'goal','Target now prioritizes accessibility');await click(a,'save');await saved(a,2);await settled(a);
 await click(a,'choose-branch');await settled(a);await a.eval("document.querySelector('#branch-choices button').click()");await settled(a);
 assert.match(await a.eval("$('comparison-summary').innerText"),/Both works may have changed/);assert.match(await a.eval("$('comparison-summary').innerText"),/revision 2/);
 await choose(observation,'incorporated');await choose(recommendation,'declined','Decline choosing every event: weekend conditions are unknown.');await set(a,'comparison-rationale','Retain the qualified observation while declining the broad recommendation.');await set(a,'comparison-next','Measure weekend noise before choosing a room.');
 await click(a,'incorporation-preview');await settled(a);assert.match(await a.eval("$('status').textContent"),/required context note is missing/);assert.equal(await visible(a,'relation-save'),false);
 await choose(condition,'incorporated');await click(a,'incorporation-preview');await settled(a);assert.equal(await visible(a,'relation-save'),true);
 await set(sourceTab,'goal','Branch adds a later independent revision');await click(sourceTab,'save');await saved(sourceTab,3);await settled(sourceTab);
 await click(a,'relation-save');await settled(a);assert.match(await a.eval("$('relation-state').textContent"),/Change refused/);assert.equal(await a.eval('saved.revision'),2);assert.equal(await a.eval("[...$('material-choices').children].find(r=>r.querySelector('.note-text').textContent==='Choose the room now for every event.').querySelector('select').value"),'declined');
 await click(a,'recompare');await settled(a);assert.match(await a.eval("$('comparison-summary').innerText"),/revision 3/);await click(a,'incorporation-preview');await settled(a);
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/relation-save',requestStage:'Response'}]});
 const before=requests.filter(r=>r.path.endsWith('/relation-save')).length;await click(a,'relation-save');await settled(a);assert.equal(await visible(a,'relation-uncertain'),true);
 const original=await a.eval('JSON.stringify(relationPending)'),write=requests.filter(r=>r.path.endsWith('/relation-save')).at(-1);
 assert.equal(requests.filter(r=>r.path.endsWith('/relation-save')).length,before+1);
 await click(a,'relation-retry');await settled(a);assert.equal(await a.eval('JSON.stringify(relationPending)'),original);assert.deepEqual(requests.filter(r=>r.path.endsWith('/relation-save')).at(-1),write);
 await requestsOnly(a);await click(a,'relation-resolve');await settled(a);assert.equal(await a.eval('saved.revision'),3);assert.equal(await a.eval('relationPending'),null);
 await click(a,'saved-context');await settled(a);let text=await a.eval("$('context-view').innerText");for(const expected of [condition,observation,'declined','weekend conditions are unknown','Measure weekend noise','Unknown','incorporated'])assert(text.includes(expected),expected);
 assert.equal(await a.eval('saved.sources.some(s=>s.bounded_summary==="Choose the room now for every event.")'),false);
 await click(sourceTab,'saved-context');await settled(sourceTab);assert.match(await sourceTab.eval("$('context-view').innerText"),/Choose the room now for every event/);
 checks.push('normal private branch and three-way comparison; qualified partial incorporation; missing-dependency refusal; stale source preserves choices; exact lost-response retry and reconciliation');
 const targetFingerprint=await a.eval('saved.fingerprint');
 await a.send('Storage.clearDataForOrigin',{origin,storageTypes:'all'});await navigate(a,'about:blank');await navigate(sourceTab,'about:blank');await restart();
 const fresh=await page(debug,origin);await login(fresh,origin);await selectWork(fresh,'Target now prioritizes accessibility');await click(fresh,'saved-context');await settled(fresh);
 assert.equal(await fresh.eval('saved.fingerprint'),targetFingerprint);text=await fresh.eval("$('context-view').innerText");for(const expected of [condition,observation,'declined','Measure weekend noise','revision 3'])assert(text.includes(expected),expected);
 assert.match(await fresh.eval("$('context-view').innerHTML"),/data-revision="3"/);
 for(const width of [390,768,1200]){await fresh.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<500});assert(await fresh.eval('document.documentElement.scrollWidth<=window.innerWidth'),'branch flow overflow '+width);}
 await click(fresh,'choose-branch');await settled(fresh);await fresh.eval("document.querySelector('#branch-choices button').click()");await settled(fresh);assert.match(await fresh.eval("$('comparison-summary').innerText"),/Both works may have changed/);
 await set(fresh,'goal','Later correct continuation keeps the conditions');await click(fresh,'save');await settled(fresh);assert.equal(await fresh.eval('saved.revision'),4);await click(fresh,'saved-context');await settled(fresh);assert.match(await fresh.eval("$('context-view').innerText"),/Measure weekend noise/);
 checks.push('new Browser context and restarted disposable server reconstruct exact Saved context; later ordinary revision/comparison; responsive 390/768/1200; delivery only, no model interpretation');
 await navigate(fresh,'about:blank');await login(a,origin);
}
