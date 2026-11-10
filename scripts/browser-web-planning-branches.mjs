import assert from 'node:assert/strict';

// The existing Browser owner supplies real Chrome, loopback D1 and cleanup.
// Writes below use visible controls, not a fixture-only record constructor.
export async function browserBranchJourney({a,debug,origin,page,click,set,settled,saved,wait,visible,navigate,login,requestsOnly,requests,responses,revisionCount,readWindow,contextRequest,overlapCapacity,restart,checks}) {
 async function selectWork(c,goal){await c.eval(`(()=>{const b=[...document.querySelectorAll('#work-list button')].find(b=>b.textContent===${JSON.stringify(goal)});if(!b)throw Error('work not listed');b.click();})()`);await settled(c);}
 async function add(c,note){await click(c,'add-note');await c.eval(`(()=>{const row=$('notes').lastElementChild;for(const [k,v] of Object.entries(${JSON.stringify(note)})){const e=row.querySelector('[data-field='+k+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);}
 async function retain(text,keep){await a.eval(`(()=>{const row=[...$('target-choices').children].find(r=>r.querySelector('.note-text').textContent===${JSON.stringify(text)});const input=row.querySelector('input');if(input.checked!==${JSON.stringify(keep)})input.click();})()`);}
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
 const retainedReview=()=>a.eval("JSON.stringify({relationPending,comparison,comparisonCurrent,directionDirty,units:choices(),rationale:$('comparison-rationale').value,next:$('comparison-next').value,preview:$('relation-preview').innerHTML})");
 const reviewBeforeRead=await retainedReview(),read=await readWindow(),expectedContext=await contextRequest(a),storedBeforeRead=await revisionCount();
 // Hold the foreground read while the other tab's ordinary input timer fires.
 // The read must preserve the reviewed state even when !busy is not network idle.
 a.beforeRequest={method:'POST',path:expectedContext.path,run:()=>overlapCapacity(sourceTab,{input:true})};
 await click(a,'saved-context');await settled(a);
 assert.equal(await retainedReview(),reviewBeforeRead,'fresh read preserves the unsaved comparison and exact preview');
 assert.equal(await a.eval('document.activeElement.id'),'context-view');assert.equal(await revisionCount(),storedBeforeRead);
 assert(read.assert([expectedContext]).capacity>0,'Saved context overlaps the source tab capacity timer');
 checks.push('Saved context focuses its successful read without changing comparison judgments, preview bindings or stored revisions');
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
 // Regression: both refresh GETs succeed, then the comparison fails. Keep the
 // prior judgments, exact bindings and actual unsaved-work warning recoverable.
 await selectWork(a,'Later correct continuation keeps the conditions');
 await click(a,'choose-branch');await settled(a);await a.eval("document.querySelector('#branch-choices button').click()");await settled(a);
 await choose(condition,'incorporated','Keep the condition with the observation.');
 await choose(observation,'incorporated','Retain this qualified observation.');
 await choose(recommendation,'declined','Private judgment: broader recommendation lacks weekend evidence.');
 await choose('Original planning question: keep one owner and exact saved material.','deferred','Revisit after the weekend measurement.');
 await set(a,'comparison-rationale','Private review rationale retained across failed reads.');
 await set(a,'comparison-next','Private unresolved question: measure weekend noise.');
 await retain('Original planning question: keep one owner and exact saved material.',false);
 const driftTab=await page(debug,origin);await navigate(driftTab,origin+'/');await wait(()=>driftTab.eval("$('list-state')?.textContent!=='Reading saved work…'"),'drift tab list');await selectWork(driftTab,'Branch adds a later independent revision');
 const warning=()=>a.eval("(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;})()");
 const draftState=()=>a.eval("({units:choices(),targets:targetChoices(),rationale:$('comparison-rationale').value,question:$('comparison-next').value,target:binding(saved),source:comparison&&{work_id:comparison.branch.work_id,...binding(comparison.branch)},comparedTarget:comparison&&binding(comparison.target),summary:$('comparison-summary').innerText,directionDirty,dirty,visible:!$('comparison').hidden})");
 const writes=()=>requests.filter(r=>/\/(save|relation-save)$/.test(r.path)).length;
 for(const failure of [503,'transport','source-drift','target-drift']){
   await click(a,'incorporation-preview');await settled(a);assert(await a.eval('!!relationPending'),'prepare a ticket before refresh');
   const oldTicket=await a.eval('relationPending.ticket'),before=await draftState(),start=requests.length,responseStart=responses.length,stored=await revisionCount(),writeCount=writes();
   assert.equal(before.directionDirty,true);assert.equal(await warning(),true);assert.equal(await a.eval('comparisonCurrent'),true);
   a.compareFailure=typeof failure==='number'||failure==='transport'?failure:null;
   a.beforeCompare=async()=>{
     assert.deepEqual(responses.slice(responseStart).filter(r=>r.path==='/api/work/'+w||r.path==='/api/work/'+b),[{path:'/api/work/'+w,status:200},{path:'/api/work/'+b,status:200}],'both refresh GETs finish before the comparison fault');
     if(failure==='source-drift'){
       await driftTab.eval(`(()=>{const row=[...$('notes').children].find(r=>r.querySelector('[data-field=text]').value===${JSON.stringify(recommendation)});const e=row.querySelector('[data-field=text]');e.value='Changed recommendation: gather weekend evidence first.';e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
       await click(driftTab,'save');await settled(driftTab);assert.equal(await driftTab.eval('saved.revision'),4);
     }
     if(failure==='target-drift'){
       await selectWork(driftTab,'Later correct continuation keeps the conditions');
       await set(driftTab,'goal','Target drift during comparison read');await add(driftTab,{text:'New target context added during comparison refresh.',source:'Synthetic target owner',label:'Open question'});await click(driftTab,'save');await settled(driftTab);assert.equal(await driftTab.eval('saved.revision'),5);
     }
   };
   await click(a,'recompare');await settled(a);
   assert.equal(a.beforeCompare,null,'fault reached the final compare request');
   assert.deepEqual(await draftState(),before,'comparison draft survives '+failure);
   assert.equal(await warning(),true);assert.equal(await a.eval('relationPending'),null);assert.equal(await visible(a,'relation-save'),false);
   assert.equal(await a.eval('comparisonCurrent'),false);assert.equal(await a.eval("$('incorporation-preview').disabled"),true);
   assert.equal(await visible(a,'relation-cancel'),false,'the invalidated preview cannot dismiss the currentness warning');
   assert.match(await a.eval("$('relation-state').textContent"),/currentness.*unconfirmed/i);
   assert.equal(requests.slice(start).filter(r=>r.path.endsWith('/compare')).length,1,'no automatic comparison retry');
   if(failure!=='transport')assert.equal(responses.filter(r=>r.path.endsWith('/compare')).at(-1).status,typeof failure==='number'?failure:409);
   const deliberateWrites=typeof failure==='string'&&failure.endsWith('-drift')?1:0;
   assert.equal(writes()-writeCount,deliberateWrites);assert.equal(await revisionCount(),stored+deliberateWrites,'only the deliberate competing edit may write');
   const blocked=await readWindow(),capacity=overlapCapacity(driftTab);
   await click(a,'incorporation-preview');await click(a,'relation-save');await settled(a);await capacity;
   assert(blocked.assert([]).capacity>0,'blocked controls overlap capacity without previewing or using a stale ticket');
   assert.equal(await revisionCount(),stored+deliberateWrites,'blocked controls and capacity cannot write');
   assert.deepEqual(await draftState(),before,'capacity does not change the retained comparison');
   assert.equal(await a.eval('relationPending'),null);
   const dialogs=[];let dismissal;const onDialog=m=>{if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params.message);dismissal=a.send('Page.handleJavaScriptDialog',{accept:false});}};a.handlers.push(onDialog);
   await click(a,'new-work');await settled(a);await dismissal;a.handlers.splice(a.handlers.indexOf(onDialog),1);
   assert.deepEqual(dialogs,['Discard the unsaved edits in this tab?']);assert.deepEqual(await draftState(),before,'cancelled leave preserves the same draft');
   await click(a,'recompare');await settled(a);const recovered=await draftState();
   assert.equal(responses.filter(r=>r.path.endsWith('/compare')).at(-1).status,200);
   for(const unit of before.units){const retained=recovered.units.find(r=>r.source_ref===unit.source_ref);if(retained)assert.deepEqual(retained,unit);else {assert(recovered.summary.includes(unit.source_ref));assert(recovered.summary.includes(unit.rationale));}}
   assert.equal(recovered.rationale,before.rationale);assert.equal(recovered.question,before.question);assert.equal(recovered.directionDirty,true);
   assert.equal(await a.eval('comparisonCurrent'),true);assert.equal(await warning(),true);
   if(failure==='source-drift')assert.deepEqual(recovered.units.filter(unit=>!before.units.some(old=>old.source_ref===unit.source_ref)).map(({disposition,rationale})=>({disposition,rationale})),[{disposition:'not_selected',rationale:''}],'changed material does not inherit a judgment from a different exact source binding');
   assert.deepEqual(recovered.targets.filter(v=>before.targets.some(old=>old.source_ref===v.source_ref)),before.targets,'exact target choices survive refresh');
   if(failure==='target-drift')assert.equal(recovered.targets.filter(v=>!before.targets.some(old=>old.source_ref===v.source_ref)).every(v=>v.retained),true,'new target material is retained by default');
   assert.equal(recovered.source.revision,failure==='source-drift'||failure==='target-drift'?4:3);assert.equal(recovered.target.revision,failure==='target-drift'?5:4);
   assert.equal(await a.eval('relationPending'),null);assert.equal(await visible(a,'relation-save'),false);
   await click(a,'incorporation-preview');await settled(a);assert.equal(await visible(a,'relation-save'),true);assert.notEqual(await a.eval('relationPending.ticket'),oldTicket,'recovery requires a new preview ticket');
   await click(a,'relation-cancel');await settled(a);
 }
 const beforeSave=await revisionCount(),beforeWrite=writes();await click(a,'incorporation-preview');await settled(a);await click(a,'relation-save');await settled(a);
 assert.equal(await a.eval('saved.revision'),6);assert.equal(await revisionCount(),beforeSave+1);assert.equal(writes(),beforeWrite+1);
 await click(a,'saved-context');await settled(a);assert.match(await a.eval("$('context-view').innerText"),/Private unresolved question/);
 checks.push('failed recompare after successful GETs: 503, transport, real source/target 409; exact draft/bindings and leave warnings retained; no stale preview, unintended write or automatic retry; explicit recovery reconciles changed units and requires a fresh preview');
 for(const code of [401,403]){
   await click(a,'choose-branch');await settled(a);await a.eval("document.querySelector('#branch-choices button').click()");await settled(a);
   await set(a,'comparison-rationale','Private denied comparison');await set(a,'comparison-next','Private denied question');await click(a,'incorporation-preview');await settled(a);
   const responseStart=responses.length,writeCount=writes();a.beforeCompare=async()=>{assert.deepEqual(responses.slice(responseStart).filter(r=>r.path==='/api/work/'+w||r.path==='/api/work/'+b).map(r=>r.status),[200,200]);};a.compareFailure=code;
   await click(a,'recompare');await settled(a);assert.equal(responses.filter(r=>r.path.endsWith('/compare')).at(-1).status,code);
   assert.equal(await a.eval("work===null&&saved===null&&pending===null&&saveTicket===null&&comparison===null&&relationPending===null&&!comparisonCurrent&&!dirty&&!directionDirty&&!document.getElementById('material-choices')&&!document.getElementById('target-choices')&&!document.body.innerText.includes('Private denied')"),true);
   assert.equal(await warning(),false);assert.equal(writes(),writeCount);assert.match(await a.eval("$('status').textContent"),/Access denied/);
   await login(a,origin);await selectWork(a,'Target drift during comparison read');
 }
 checks.push('comparison refresh 401 and real ingress refusal 403 clear private drafts, bindings, tickets and leave warnings');

 // Ordinary room-A/room-B correction, including linked adaptation and one save.
 const eventA='Event at 14:00 in room A; provisional capacity 20. Admission is free.';
 const actionA='Check room A wheelchair access and hold publication until confirmed.';
 const eventB='Correction: 15:30 in room B, capacity 12. Admission remains free; accessibility is unknown.';
 const actionB='Check room B wheelchair access. Accessibility remains unresolved; hold publication until confirmed.';
 await click(a,'new-work');await set(a,'goal','Room correction target');await set(a,'criteria','Keep accessibility uncertainty and publication hold');await set(a,'non-goals','No publication');
 await add(a,{text:eventA,source:'Synthetic event organizer',label:'New candidate',observed_at:'2026-10-20T09:00:00.000Z'});
 await add(a,{text:actionA,source:'Synthetic owner judgment',label:'Next check',provenance:'derived_interpretation'});
 await click(a,'save');await saved(a,1);await settled(a);const roomOriginal=await a.eval('saved');
 await click(a,'branch-open');await set(a,'branch-reason','Explore corrected room information');await click(a,'branch-preview');await settled(a);await click(a,'relation-save');await settled(a);const roomStart=await a.eval('saved');
 await set(a,'goal','Room B corrected direction');await add(a,{text:eventB,source:'Synthetic organizer correction',label:'Changed assumption / user correction'});
 await a.eval(`(()=>{const rows=[...$('notes').children],row=rows.find(r=>r.querySelector('[data-field=text]').value===${JSON.stringify(actionA)}),text=row.querySelector('[data-field=text]');text.value=${JSON.stringify(actionB)};text.dispatchEvent(new Event('input',{bubbles:true}));const condition=rows.find(r=>r.querySelector('[data-field=text]').value===${JSON.stringify(eventB)});const deps=row.querySelector('.dependencies');for(const option of deps.options)option.selected=option.value===condition.id;deps.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await click(a,'save');await saved(a,2);await settled(a);const roomBranch=await a.eval('saved');
 const oldAction=roomOriginal.sources.find(s=>s.bounded_summary===actionA).source_ref,adapted=roomBranch.sources.find(s=>s.bounded_summary===actionB).source_ref;
 assert.deepEqual(roomBranch.relations.materials.find(m=>m.source_ref===adapted).from,{work_id:roomStart.work_id,revision:roomStart.revision,fingerprint:roomStart.fingerprint,source_ref:oldAction});
 await selectWork(a,'Room correction target');await click(a,'choose-branch');await settled(a);await a.eval("document.querySelector('#branch-choices button').click()");await settled(a);
 assert.equal(await a.eval('targetChoices().every(c=>c.retained)'),true);
 await choose(eventB,'incorporated');await choose(actionB,'incorporated');await set(a,'comparison-rationale','Retain historical information and use the room B correction.');await set(a,'comparison-next','Wheelchair accessibility remains unknown; hold publication.');
 await click(a,'incorporation-preview');await settled(a);assert((await a.eval("$('relation-preview').innerText")).includes(actionA),'retaining both current notes is valid');
 await retain(actionA,false);assert.equal(await a.eval('relationPending'),null);assert.equal(await visible(a,'relation-save'),false);
 // Mutating a choice without an input event must still invalidate an in-flight snapshot.
 a.beforeRequest={method:'POST',path:'/api/work/'+roomOriginal.work_id+'/incorporation-preview',run:()=>a.eval(`document.querySelector('#target-choices input[data-ref="${oldAction}"]').checked=true`)};
 await click(a,'incorporation-preview');await settled(a);assert.equal(await a.eval('relationPending'),null,'late response cannot revive a changed target selection');await retain(actionA,false);
 await retain(eventA,false);await choose(eventA,'incorporated');await click(a,'incorporation-preview');await settled(a);assert.match(await a.eval("$('status').textContent"),/same note is deselected/);assert.equal(await visible(a,'relation-save'),false);
 await choose(eventA,'not_selected');await retain(eventA,true);await choose(eventB,'not_selected');await click(a,'incorporation-preview');await settled(a);assert.match(await a.eval("$('status').textContent"),/required context note is missing/);
 await choose(eventB,'incorporated');await click(a,'incorporation-preview');await settled(a);
 const roomPreview=await a.eval("$('relation-preview').innerText");assert(roomPreview.includes(eventA));assert(roomPreview.includes(actionB));assert(!roomPreview.includes(actionA));
 const copy=await a.eval("[...document.querySelectorAll('#relation-preview .incorporation-review li')].map(li=>({disposition:li.querySelector('strong').textContent,text:li.innerText}))");
 for(const row of copy){if(row.disposition==='incorporated'){assert(row.text.includes('No rationale supplied.'));assert(!row.text.includes('unselected does not'));}else assert(row.text.includes('unselected does not mean refuted or rejected'));}
 for(const width of [390,768,1200]){await a.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<500});assert(await a.eval('document.documentElement.scrollWidth<=window.innerWidth'),'correction review overflow '+width);}
 const writeStart=requests.filter(r=>r.path.endsWith('/relation-save')).length;
 await a.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/relation-save',requestStage:'Response'}]});await click(a,'relation-save');await settled(a);
 assert.equal(await visible(a,'relation-uncertain'),true);assert.equal(await a.eval("[...document.querySelectorAll('#target-choices input')].every(i=>i.disabled)"),true);
 const pendingRoom=await a.eval('JSON.stringify(relationPending)');assert(!JSON.parse(pendingRoom).intent.target_selection.includes(oldAction));
 await requestsOnly(a);await click(a,'relation-resolve');await settled(a);assert.equal(await a.eval('saved.revision'),2);assert.equal(requests.filter(r=>r.path.endsWith('/relation-save')).length,writeStart+1,'one incorporation save; resolution is read-only');
 const roomResult=await a.eval('saved');await navigate(a,'about:blank');await login(a,origin);await selectWork(a,'Room correction target');await click(a,'saved-context');await settled(a);
 assert.equal(await a.eval('saved.fingerprint'),roomResult.fingerprint);const roomContext=await a.eval("$('context-view').innerText");assert(roomContext.includes(actionB));assert(roomContext.includes(eventA));assert(!roomContext.includes(actionA));assert(roomContext.includes('Wheelchair accessibility remains unknown; hold publication.'));
 const freshCopy=await a.eval("[...document.querySelectorAll('#context-view .incorporation-review li')].map(li=>({disposition:li.querySelector('strong').textContent,text:li.innerText}))");
 assert.deepEqual(freshCopy.map(row=>({disposition:row.disposition,unselected:row.text.includes('unselected does not')})),copy.map(row=>({disposition:row.disposition,unselected:row.text.includes('unselected does not')})));
 const history=await a.eval("api('/api/work/'+work+'/export')");assert.deepEqual(history.revisions[0],roomOriginal);assert.equal(history.revisions.length,2);
 const independent=await a.eval(`api('/api/work/${roomBranch.work_id}')`);assert.deepEqual(independent.saved,roomBranch);
 console.log(JSON.stringify({room_correction_browser:{transport:origin.startsWith('https:')?'direct-access-simulation':'local-synthetic-owner',original:roomOriginal,branch:roomBranch,result:roomResult,preview:roomPreview,fresh_context:roomContext,one_incorporation_save:true,earlier_revision_unchanged:true,branch_unchanged:true,model_use:false}}));
 checks.push('room A to room B through ordinary controls: default retention, deliberate deselection, complete preview, shared-reference/dependency refusal, snapshot invalidation, exact unknown-save resolution, fresh server context, unchanged originals/branch and accurate fallback copy');
}
