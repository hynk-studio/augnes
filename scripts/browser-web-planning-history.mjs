import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

export async function browserRetainedNotes({a,click,set,settled,saved,wait,checks}) {
 const quote='Read the nine-line excerpt only with the translator credit. '+('Catalogue reference '+ 'A'.repeat(90)+'. ').repeat(4).trimEnd();
 const credit='Credit the translation to Mina Seo; print permission is still unknown.';
 const follow='Introduce the nine lines aloud with Mina Seo’s credit. Ask separately before printing.';
 const add=async(text,source)=>{await click(a,'add-note');await a.eval(`(()=>{const row=$('notes').lastElementChild;for(const [key,value] of Object.entries(${JSON.stringify({text,source})})){const field=row.querySelector('[data-field='+key+']');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}})()`);};
 const save=async n=>{await click(a,'save');await saved(a,n);await settled(a);};
 await a.send('Page.bringToFront');await settled(a);await click(a,'new-work');await set(a,'goal','Plan the library reading');await set(a,'criteria','Separate reading and print permissions');
 await add(credit,'Translation desk');await add(quote,'Reading agreement');
 await a.eval("(()=>{const d=$('notes').lastElementChild.querySelector('.dependencies');d.options[0].selected=true;d.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await save(1);const source=await a.eval('saved');
 await a.eval("while($('notes').firstElementChild)$('notes').firstElementChild.querySelector('button').click()");
 await set(a,'goal','Prepare the evening programme');await save(2);
 await add('The reading is scheduled before the break.','Current programme');await save(3);
 await set(a,'non-goals','Preserve the unsaved programme edit.');
 await a.eval("$('history-tools').open=true");await click(a,'history');await settled(a);
 await a.eval("const pick=$('history-revision');pick.value='1';pick.dispatchEvent(new Event('change'))");
 const card=`[...document.querySelectorAll('#history-view article')].find(v=>v.querySelector('.note-text').textContent===${JSON.stringify(quote)})`;
 assert.match(await a.eval("$('history-view').innerText"),/Translation desk/);
 for(const [width,height] of [[1200,800],[390,844]]){
   await a.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   assert(await a.eval('document.documentElement.scrollWidth<=innerWidth'));
   if(width===1200){
     await a.eval(`${card}.querySelector('button').focus()`);
     for(const type of ['keyDown','keyUp'])await a.send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
     await wait(()=>a.eval("$('notes').children.length===3"),'keyboard historical selection and dependency');
     assert(await a.eval(`${card}.querySelector('button').disabled`));
   }else{
     await touchRetainedNote(a,card,follow,wait,width,height);
   }
 }
 await wait(()=>a.eval("$('draft-capacity').dataset.state==='fits'"),'historical selection capacity');
 assert.match(await a.eval("$('change-list').textContent"),/your interpretation from revision 1/);
 await save(4);await click(a,'saved-context');await settled(a);
 const after=await a.eval('saved');assert.deepEqual(after.definition.non_goals,['Preserve the unsaved programme edit.']);
 assert.equal(after.definition.goal,'Prepare the evening programme');assert(after.sources.some(n=>n.bounded_summary===credit));
 for(const [text,kind] of [[quote,'inherited'],[follow,'adapted']]) {
   const n=after.sources.find(n=>n.bounded_summary===text),m=after.relations.materials.find(m=>m.source_ref===n.source_ref);
   assert.equal(m.kind,kind);assert.equal(m.from.fingerprint,source.fingerprint);assert.equal(m.dependencies.length,1);
   assert((await a.eval("$('context-view').innerText")).includes(text));
 }
 assert.equal(after.sources.find(n=>n.bounded_summary===follow).compatibility_source_ref.external_id,after.author_ref);
 await a.send('Emulation.clearDeviceMetricsOverride');
 checks.push('library reading: r1 terms excluded at r2, continued at r3, desktop keyboard exact reuse and required credit, 390px touch authored adaptation; preserved unrelated draft and reopened r4');
 return after.work_id;
}

async function touchRetainedNote(page, card, follow, wait, width, height) {
  await page.send('Inspector.enable');
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const frame = async () => (await page.send('Page.getFrameTree')).frameTree.frame;
  const documentState = `({width:innerWidth,height:innerHeight,visible:document.visibilityState==='visible',
    same_origin:location.origin===${JSON.stringify(page.origin)},touch_points:navigator.maxTouchPoints})`;
  const valid = state => state.width === width && state.height === height && state.visible && state.same_origin && state.touch_points === 1;
  const initial = await frame();
  assert.equal(new URL(initial.url).origin, page.origin);
  await page.eval(`(()=>{
    const section=${card}.querySelector('textarea').closest('details');
    section.open=true;
    section.querySelector('textarea').value=${JSON.stringify(follow)};
    section.querySelector('button').scrollIntoView({behavior:'instant',block:'center'});
  })()`);
  let context;
  await wait(async () => {
    context = await page.eval(`(()=>{
      const button=${card}?.querySelector('textarea')?.closest('details')?.querySelector('button');
      const bounds=button?.getBoundingClientRect();
      const point=bounds&&{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
      const hit=!!point&&!!button&&!button.disabled&&button.contains(document.elementFromPoint(point.x,point.y));
      return {...${documentState},point,hit};
    })()`);
    return valid(context) && context.hit;
  }, 'history touch target ready');
  const { point, ...ready } = context;
  console.log(JSON.stringify({ web_planning_history_touch: { stage: 'ready', target_id: page.targetId, ...ready } }));
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(() => page.eval("$('notes').children.length===4"), 'touch adaptation');
  const final = await frame(), after = await page.eval(documentState);
  const sameDocument = final.id === initial.id && final.loaderId === initial.loaderId;
  assert(sameDocument && valid(after), 'history touch stayed on the intended document and viewport');
  console.log(JSON.stringify({ web_planning_history_touch: { stage: 'settled', target_id: page.targetId,
    ...after, same_document: sameDocument, adaptation_observed: true } }));
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: false });
}

export async function browserHistoryJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,restart,checks}){
 const started=performance.now();await settled(a);await click(a,'new-work');
 await set(a,'criteria','Preserve the original uncertainty and exact context');
 await click(a,'add-note');
 await a.eval(`(()=>{const n=$('notes').children[0];for(const [k,v] of Object.entries({text:'Unknown source validity remains unknown. Further evidence is required before adoption.',source:'Synthetic cumulative observation',label:'Open question',provenance:'user_declaration'}))n.querySelector('[data-field='+k+']').value=v;n.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const heads=[];
 // Every revision here is an ordinary editor change and Save click. No raw D1
 // seeding or API writer substitutes for the human/browser-agent-facing flow.
 for(let n=1;n<=33;n++){
   await set(a,'goal','Cumulative browser plan '+n);await click(a,'save');await saved(a,n);await settled(a);
   if(n>=31)heads.push(await a.eval('({revision:saved.revision,fingerprint:saved.fingerprint})'));
 }
 await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'current history capacity');
 assert(!await a.eval("$('capacity-details').textContent.includes('/ 32')"));
 const initial=await a.eval("api('/api/work/'+work+'/export')");
 assert.equal(initial.revisions.length,33);
 await click(a,'saved-context');await settled(a);
 assert.equal(await a.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'33');
 assert.match(await a.eval("$('context-view').innerText"),/Unknown source validity remains unknown/);
 await navigate(a,'about:blank');await restart();
 const fresh=await page(debug,origin);await navigate(fresh,origin+'/');
 await wait(()=>fresh.eval("$('list-state')?.textContent!=='Reading saved work…'&&!!$('new-work')"),'fresh process list');
 async function choose(c,title){
   for(let n=0;n<10;n++){
     if(await c.eval(`[...$('work-list').querySelectorAll('button')].some(b=>b.textContent===${JSON.stringify(title)})`)){
       await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(title)}).click()`);return;
     }
     assert(!await c.eval("$('more-work').hidden"),'saved work must appear on a complete list page');
     await click(c,'more-work');await settled(c);
   }
   assert.fail('bounded fixture work-list traversal exhausted');
 }
 await choose(fresh,'Cumulative browser plan 33');
 await saved(fresh,33);await click(fresh,'saved-context');await settled(fresh);
 assert.equal(await fresh.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'33');
 await set(fresh,'goal','Same plan continued after four days');await click(fresh,'save');await saved(fresh,34);await settled(fresh);
 const after=await fresh.eval("api('/api/work/'+work+'/export')");
 assert.deepEqual(after.revisions.slice(0,33),initial.revisions);
 assert(Date.parse(after.revisions[33].recorded_at)-Date.parse(after.revisions[32].recorded_at)>=4*86400000);
 await click(fresh,'saved-context');await settled(fresh);
 assert.equal(await fresh.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'34');
 assert.match(await fresh.eval("$('context-view').innerText"),/Unknown source validity remains unknown/);
 for(const [width,height] of [[390,844],[768,900],[1200,800]]){
   await fresh.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   assert(await fresh.eval('document.documentElement.scrollWidth<=innerWidth'));
 }
 console.log(JSON.stringify({cumulative_browser_history:{producer:'ordinary editor and Save control',observed_heads:heads,after_fresh_workerd_and_four_days:34,original_revisions_unchanged:33,agent_surface:'same private server-rendered Saved context',actual_live_agent:false,elapsed_ms:Math.round(performance.now()-started)}}));
 checks.push('history: ordinary editor saves 31/32/33; fresh workerd and fresh tab reopen exact Saved context, four-day clock/fresh seals save 34, original export prefix and unknowns unchanged');
 await navigate(fresh,'about:blank');await navigate(a,origin+'/');
 await wait(()=>a.eval("!!$('new-work')&&$('list-state').textContent!=='Reading saved work…'"),'return to workspace');
 await choose(a,'Same plan continued after four days');await saved(a,34);await settled(a);
}

// A source measurement and an independent dispatch brief. Exercise the same
// controls a person uses, including a non-head revision and an unsaved B edit.
export async function browserIndependentNotes({a,click,set,settled,saved,wait,checks}){
 const log='Measure morning throughput on the label press',goal='Write the dispatch card for the bookmobile print crew';
 const timing='On the blue press, 84 route cards took 14 minutes, plus one 6-minute cleanup after the last batch.';
 const condition='Timing applies only to uncoated stock after a passing nozzle check. Otherwise use preprinted blanks; no press time was measured for that case.';
 const interpretation='Plan in whole 84-card batches and clean only once, after the final batch.';
 async function add(text,source){
   await click(a,'add-note');
   await a.eval(`(()=>{const r=$('notes').lastElementChild;for(const [k,v] of Object.entries(${JSON.stringify({text,source,observed_at:'2026-10-27T08:15:00.000Z'})})){const e=r.querySelector('[data-field='+k+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
 }
 async function persist(rev){await click(a,'save');await saved(a,rev);await settled(a);return a.eval('saved');}
 async function begin(title,criteria){await click(a,'new-work');await settled(a);await set(a,'goal',title);await set(a,'criteria',criteria);}
 await begin(log,'Record measured time and the conditions under which it can be used.');
 await add(condition,'Press operator');await add(timing,'Timed bench run');await a.eval("(()=>{const d=$('notes').lastElementChild.querySelector('.dependencies');d.options[0].selected=true;d.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await add('Keep the supplier invoice for a price comparison.','Purchasing');const original=await persist(1);
 await set(a,'non-goals','Do not infer a speed for coated stock.');const selected=await persist(2);
 await set(a,'goal','Archive the label press measurements');const latest=await persist(3);
 await begin(goal,'Prepare a crew-facing card for 168 route cards due packed at 08:20. Give the latest start, sequence and fallback.');const base=await persist(1);
 await set(a,'non-goals','Keep the existing loading bay reservation.');
 await a.eval("$('history-tools').open=true");await click(a,'other-history');await settled(a);
 const list="[...$('history-view').querySelectorAll('button')]";
 for(let i=0;!await a.eval(list+".some(b=>b.textContent.startsWith('Archive the label press measurements ·'))");i++){
   assert(i<10 && await a.eval(list+".some(b=>b.textContent==='More source works')"));await a.eval(list+".find(b=>b.textContent==='More source works').click()");await settled(a);
 }
 await a.eval(list+".find(b=>b.textContent.startsWith('Archive the label press measurements ·')).click()");await settled(a);
 await a.eval("const sourcePicker=$('history-revision');sourcePicker.value='2';sourcePicker.dispatchEvent(new Event('change'))");
 const card=`[...$('history-view').querySelectorAll('article')].find(x=>x.querySelector('.note-text').textContent===${JSON.stringify(timing)})`;
 const shown=await a.eval("$('history-view').innerText");
 assert(shown.includes(timing)&&shown.includes(condition)&&shown.includes('Timed bench run')&&shown.includes('2026-10-27'));
 await a.eval(card+".querySelector('button').click()");await settled(a);
 await a.eval(`(()=>{const d=${card}.querySelector('textarea').closest('details');d.open=true;d.querySelector('textarea').value=${JSON.stringify(interpretation)};d.querySelector('button').click();})()`);await settled(a);
 assert.equal(await a.eval("$('notes').children.length"),3);await wait(()=>a.eval("$('draft-capacity').dataset.state==='fits'"),'independent selection capacity');
 const retained=await persist(2);
 assert.equal(retained.definition.goal,goal);assert.deepEqual(retained.definition.non_goals,['Keep the existing loading bay reservation.']);
 assert.equal(retained.relations.origin,null);assert(!retained.sources.some(n=>n.bounded_summary.includes('invoice')));
 assert(retained.relations.materials.every(m=>m.from.work_id===selected.work_id && m.from.fingerprint===selected.fingerprint));
 await click(a,'saved-context');await settled(a);assert.match(await a.eval("$('context-view').textContent"),/Recorded source note is listed/);
 await a.eval("$('context-view').querySelector('[data-note-origin]').click()");await settled(a);
 assert.equal(await a.eval("$('history-revision').value"),'2');
 assert.match(await a.eval("$('history-view').innerText"),/Recorded source note/);
 assert.equal(await a.eval('work'),base.work_id);
 checks.push('two independent works: inspect press log r2 under newer r3, select timing and required stock condition, add attributed interpretation and preserve the unsaved dispatch brief');
 return {original,selected,latest,base,retained};
}

// Inspect the origin from the competing saved version while the first editor
// still holds a stale, unsaved draft. A previous history view must not count.
export async function browserConflictSource({a,b,click,set,settled,saved,wait,checks,trace}) {
 const {retained,selected}=trace,ref=selected.sources.find(n=>n.bounded_summary.includes('84 route cards')).source_ref;
 await b.eval(`openWork(${JSON.stringify(retained.work_id)})`);await saved(b,retained.revision);
 const changed='Retain the first editor’s loading instructions.';
 await set(a,'non-goals',changed);await click(a,'history');await settled(a);
 assert.match(await a.eval("$('history-view').innerText"),/This work’s history/);
 const draftBefore=await a.eval('draft()');
 await set(b,'goal','Latest dispatch decision from the second editor');await click(b,'save');await saved(b,retained.revision+1);await settled(b);
 await a.send('Page.bringToFront');await click(a,'save');await settled(a);await click(a,'review-latest');await settled(a);
 assert.equal(await a.eval('reviewed.work_id'),retained.work_id);assert.equal(await a.eval('reviewed.revision'),retained.revision+1);
 const locator=await a.eval(`(()=>{const button=[...$('conflict-latest').querySelectorAll('button[data-note-origin]')].find(b=>JSON.parse(b.dataset.noteOrigin).source_ref===${JSON.stringify(ref)});for(let e=button;e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true;button.focus();return JSON.parse(button.dataset.noteOrigin);})()`);
 assert.deepEqual(locator,{work_id:selected.work_id,revision:selected.revision,fingerprint:selected.fingerprint,source_ref:ref});
 for(const type of ['keyDown','keyUp'])await a.send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
 await settled(a);
 const view=await a.eval(`({revision:$('history-revision').value,text:$('history-view').textContent,marked:$('history-view').querySelector('article > strong')?.parentElement.querySelector('.note-text').textContent,base:saved.fingerprint,work,dirty,draft:draft(),reviewed:reviewed.fingerprint})`);
 assert.equal(view.revision,String(selected.revision),'Conflict inspection did not open the chosen source revision');
 assert(view.text.includes(selected.work_id)&&view.text.includes(selected.fingerprint));
 assert.equal(view.marked,selected.sources.find(n=>n.source_ref===ref).bounded_summary);
 assert.equal(view.base,retained.fingerprint);assert.equal(view.work,retained.work_id);assert(view.dirty);assert.deepEqual(view.draft,draftBefore);
 const latest=await b.eval('saved.fingerprint');assert.equal(view.reviewed,latest);
 await click(a,'rebase-draft');assert.deepEqual(await a.eval('draft()'),draftBefore);
 await click(a,'save');await saved(a,retained.revision+2);await settled(a);
 assert.deepEqual(await a.eval('saved.definition.non_goals'),[changed]);
 console.log(JSON.stringify({conflict_source_browser:{locator,source_head:trace.latest.revision,inspected_revision:view.revision,stale_base:view.base,reviewed_latest:latest,draft_unchanged:true,saved_follow_up:await a.eval('binding(saved)')}}));
 checks.push('latest-version conflict: activate the recorded source with the keyboard, open its exact non-head revision and note, retain the stale draft and save on the explicitly reviewed base');
}
