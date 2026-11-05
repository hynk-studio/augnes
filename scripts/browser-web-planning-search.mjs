import assert from 'node:assert/strict';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

export async function browserWorkSearch({c,origin,clientEnvironment,click,set,settled,saved,wait,navigate,checks,requests}) {
  await navigate(c,origin+'/');await wait(()=>c.eval("!!$('work-search')"),'search entry');
  // Fixture preparation uses normal authenticated writers. The consuming UI
  // below starts with project access and this phrase, not a work locator.
  const fixture=await c.eval(`(async()=>{
    const all=[],definition={goal:'Community supper',success_criteria:['Plan the bowl order'],non_goals:[]};
    for(let i=0;i<14;i++){
      const t=await api('/api/drafts',{});all.push((await api('/api/work/'+t.work_id+'/save',{ticket:t.ticket,definition,notes:[]})).saved);
    }
    all.sort((a,b)=>a.work_id.localeCompare(b.work_id));const target=all[11];
    const notes=[{text:'copper lantern seating: 29 guests, 7 bring bowls; spare bowls come in packs of 6.',source:'Venue coordinator',label:'Next check',provenance:'user_declaration',observed_at:null}];
    const t=await api('/api/work/'+target.work_id+'/ticket',{expected:binding(target)});
    const observed=(await api('/api/work/'+target.work_id+'/save',{ticket:t.ticket,definition,notes})).saved;
    return {observed,destination:all[0]};
  })()`);
  await click(c,'refresh-list');await settled(c);
  await c.eval("$('work-search-tools').querySelector('summary').click()");
  assert.equal(await c.eval("$('work-list').children.length"),10);
  const count=()=>c.eval("api('/api/works/search?q=Community').then(r=>r.scanned)");
  const search=async(phrase)=>{await set(c,'work-search-query',phrase);await c.eval("$('work-search').requestSubmit()");await settled(c);};
  const next=async()=>{await click(c,'search-more');await settled(c);};
  const phrase='copper lantern seating';
  const start=requests.length;
  await search(phrase);
  assert.match(await c.eval("$('search-state').textContent"),/10 saved works.*0 matches.*More work remains/);
  await next();assert.equal(await c.eval("$('search-results').children.length"),1);
  const choose=async(index=0)=>{await c.eval("$('search-results').children["+index+"].querySelector('button').click()");await settled(c);};
  await choose();assert.match(await c.eval("$('search-view').textContent"),/29 guests, 7 bring bowls/);
  assert.equal(await c.eval("$('search-revision').value"),'2');
  assert.equal(await c.eval('saved'),null);
  const widths=[];
  for(const width of [390,768,1200]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
    const size=await c.eval('({view:innerWidth,content:document.documentElement.scrollWidth})');assert(size.content<=size.view+1);widths.push(size);
  }
  // Use an existing destination with unrelated draft edits; inspection and
  // explicit source selection must retain its current save base and edits.
  await c.eval("$('work-list').querySelector('button').click()");await settled(c);
  assert.equal(await c.eval('saved.work_id'),fixture.destination.work_id);
  await set(c,'goal','Prepare the community supper bowl order');
  await set(c,'non-goals','Keep the existing room booking');
  const base=await c.eval('binding(saved)');
  await choose();assert.deepEqual(await c.eval('binding(saved)'),base);
  assert.equal(await c.eval("$('goal').value"),'Prepare the community supper bowl order');
  await c.eval("[...$('search-view').querySelectorAll('button')].find(b=>b.textContent==='Use unchanged note').click()");await settled(c);
  assert.equal(await c.eval("$('notes').children.length"),1);
  assert.deepEqual(await c.eval('binding(saved)'),base);
  const reads=requests.slice(start).filter(r=>!r.path.endsWith('/capacity'));
  assert(reads.every(r=>r.method==='GET'),'search, inspection and selection do not persist changes');
  const text=await c.eval("$('search-view').querySelector('.note-text').textContent");
  const [,guests,bringing,pack]=text.match(/(\d+) guests, (\d+) bring bowls; spare bowls come in packs of (\d+)/);
  const needed=Number(guests)-Number(bringing),packs=Math.ceil(needed/Number(pack)),spare=packs*Number(pack)-needed;
  const followup=`Order ${packs} packs of ${pack} bowls: ${needed} guests need bowls, leaving ${spare} spare. Keep the existing room booking.`;
  await click(c,'add-note');
  await c.eval(`(()=>{const row=$('notes').lastElementChild;for(const [key,value] of Object.entries(${JSON.stringify({text:followup,source:'Calculation from the selected venue note',label:'Next check',provenance:'derived_interpretation'})})){
    const field=row.querySelector('[data-field='+key+']');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  await click(c,'save');await saved(c,2);await settled(c);
  const result=await c.eval('saved');assert.equal(result.work_id,fixture.destination.work_id);
  assert(result.sources.some(s=>s.bounded_summary===followup));
  assert(result.relations.materials.some(m=>m.from?.fingerprint===fixture.observed.fingerprint));
  await click(c,'refresh-work');await settled(c);assert.equal(await c.eval('saved.fingerprint'),result.fingerprint);
  assert.equal(await c.eval("[...$('notes').querySelectorAll('[data-field=text]')].some(e=>e.value==="+JSON.stringify(followup)+")"),true);
  const exported=await c.eval("api('/api/work/'+work+'/export')");
  assert.equal(exported.revisions.at(-1).fingerprint,result.fingerprint);
  console.log(JSON.stringify({work_search_saved_originals:{observed:fixture.observed,saved:result,export:exported}}));
  async function freshClient(label,args){
    let stdout='',stderr='';
    const child=await runCanonicalChild({suite:'web-planning-browser',label:'search-client-'+label,command:process.execPath,cwd:process.cwd(),
      env:clientEnvironment,args:['apps/augnes_apps/scripts/file-exchange.mjs',...args],timeoutMs:10000,
      stdout:{write:data=>{stdout+=data;}},stderr:{write:data=>{stderr+=data;}}});
    assert.equal(canonicalChildAcceptanceFailure(child,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);
  }
  const first=await freshClient('discover',['search',phrase]),later=await freshClient('continue',['search',phrase,first.next]);
  const source=later.items.find(r=>r.goal===fixture.observed.definition.goal);assert(source);
  const sourceRead=await freshClient('inspect-source',['inspect-match',source.selection]);
  assert.equal(sourceRead.observed.fingerprint,fixture.observed.fingerprint);
  const followupMatch=first.items.find(r=>r.goal===result.definition.goal);assert(followupMatch);
  const followupRead=await freshClient('reopen-followup',['inspect-match',followupMatch.selection]);
  assert.equal(followupRead.observed.fingerprint,result.fingerprint);
  assert(followupRead.observed.sources.some(s=>s.bounded_summary===followup));
  console.log(JSON.stringify({work_search_same_project_client:{source:sourceRead,followup:followupRead}}));
  // Reuse the saved, incorporated note above. From the project entry there is
  // no editor to reveal an origin accidentally rendered in its history pane.
  await navigate(c,origin+'/');await wait(()=>c.eval("!!$('work-search')&&$('list-state').textContent!=='Reading saved work…'"),'search entry again');
  await c.eval("$('work-search-tools').querySelector('summary').click()");
  await search(phrase);
  const editorState=()=>c.eval("({work,base:saved?binding(saved):null,draft:draft(false),editorHidden:$('editor').hidden,history:$('history-view').innerHTML})");
  async function followOrigin(label){
    const before=await editorState(),start=requests.length;
    await choose();
    assert.equal(await c.eval("$('search-view').querySelector(':scope > section > h3').innerText"),result.definition.goal);
    await c.eval("[...$('search-view').querySelectorAll('button')].find(b=>b.textContent==='Inspect recorded source note').click()");await settled(c);
    // Open the identity as a user can, then check rendered content and ancestor
    // visibility. textContent in a hidden editor would not prove navigation.
    await c.eval("$('search-view').querySelector(':scope > section > details > summary').click()");
    const shown=await c.eval(`(()=>{
      const pane=$('search-view'),section=pane.querySelector('section'),title=section.querySelector('h3'),identity=section.querySelector('details > p');
      const note=[...pane.querySelectorAll('[data-history-note]')].find(n=>n.querySelector('strong')?.textContent==='Recorded source note');
      const visible=n=>!!n&&n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0;
      const picker=$('search-revision'),rect=picker.getBoundingClientRect();
      return {pane_visible:visible(pane),title_visible:visible(title),identity_visible:visible(identity),note_visible:visible(note?.querySelector('.note-text')),
        goal:title.innerText,identity:identity.innerText,revision:picker.value,note:note?.querySelector('.note-text').innerText,
        source_ref:note?.querySelector('details > p').innerText,notes:[...pane.querySelectorAll('.note-text')].map(n=>n.innerText),
        focused:document.activeElement===picker,picker_in_view:rect.top>=0&&rect.bottom<=innerHeight};
    })()`);
    console.log(JSON.stringify({work_search_recorded_origin:{label,before,shown,expected:{work_id:fixture.observed.work_id,revision:fixture.observed.revision,fingerprint:fixture.observed.fingerprint,source_ref:fixture.observed.sources[0].source_ref}}}));
    assert(shown.pane_visible&&shown.title_visible&&shown.identity_visible&&shown.note_visible,'the original must be rendered in the visible inspection pane');
    assert.equal(shown.goal,fixture.observed.definition.goal,'the visible pane must leave the matched work for its recorded origin');
    assert.equal(shown.identity,fixture.observed.work_id+' · '+fixture.observed.fingerprint);
    assert.equal(shown.revision,String(fixture.observed.revision));
    assert.equal(shown.source_ref,fixture.observed.sources[0].source_ref);
    assert.deepEqual(shown.notes,[fixture.observed.sources[0].bounded_summary]);
    assert.equal(shown.note,fixture.observed.sources[0].bounded_summary);
    assert(shown.focused&&shown.picker_in_view,'the visible origin inspector receives focus');
    assert.deepEqual(await editorState(),before,'following an origin must preserve the active work, draft, save base and editor history');
    assert(requests.slice(start).filter(r=>!r.path.endsWith('/capacity')).every(r=>r.method==='GET'),'following an origin must not save');
  }
  assert.equal((await editorState()).base,null);assert.equal((await editorState()).editorHidden,true);
  await followOrigin('project entry, no editor');
  await c.eval("$('work-list').querySelector('button').click()");await settled(c);
  assert.equal(await c.eval('saved.fingerprint'),result.fingerprint);
  await set(c,'goal','Unsaved destination edit retained');
  await followOrigin('unrelated draft and save base retained');
  // Restore the source match for the existing stale/erased-result checks.
  await next();
  checks.push('search recorded origin: visible exact work/revision/note from the entry screen and with an unrelated draft, focused inspector, no save or work switch');
  // Hold the old observed match while its source advances and then is erased.
  await set(c,'goal','Unsaved destination edit retained');
  const advanced=await c.eval(`(async()=>{const r=${JSON.stringify(fixture.observed)},t=await api('/api/work/'+r.work_id+'/ticket',{expected:binding(r)});
    return (await api('/api/work/'+r.work_id+'/save',{ticket:t.ticket,definition:{...r.definition,goal:'Changed source'},notes:[]})).saved;})()`);
  await choose(1);assert.match(await c.eval("$('search-view').textContent"),/advanced to revision 3.*exact observed revision 2/);
  assert.match(await c.eval("$('search-view').textContent"),/29 guests/);
  assert.equal(await c.eval('saved.fingerprint'),result.fingerprint);
  await c.eval(`api('/api/work/'+${JSON.stringify(advanced.work_id)}+'/erase',{expected:${JSON.stringify({revision:advanced.revision,fingerprint:advanced.fingerprint})},confirm:'erase-whole-work'})`);
  await choose(1);assert.match(await c.eval("$('search-view').textContent"),/Source unavailable/);
  assert.equal(await c.eval("$('goal').value"),'Unsaved destination edit retained');
  c.searchFailure='http';await search('unmatched phrase');assert.match(await c.eval("$('search-state').textContent"),/could not complete/);
  c.searchFailure='partial';await search('unmatched phrase');assert.match(await c.eval("$('search-state').textContent"),/could not complete/);
  await search('unmatched phrase');assert.match(await c.eval("$('search-state').textContent"),/More work remains/);
  await next();assert.match(await c.eval("$('search-state').textContent"),/No match in the completed search scope/);
  assert.equal(await c.eval('saved.fingerprint'),result.fingerprint);
  assert.equal(await c.eval("$('goal').value"),'Unsaved destination edit retained');
  const before=await count();assert.equal(before,10);
  c.accessBoundary='html';await search(phrase);assert.equal(await c.eval('accessLost'),true);
  assert.equal(await c.eval("$('private-view').textContent.includes('bowls')"),false);
  console.log(JSON.stringify({work_search_browser:{entry:'project access and phrase',phrase,target_beyond_first_list_page:true,
    source:{work_id:fixture.observed.work_id,revision:fixture.observed.revision,fingerprint:fixture.observed.fingerprint},
    followup:{text:followup,work_id:result.work_id,revision:result.revision,fingerprint:result.fingerprint},widths,
    reads_before_save:reads.map(r=>({method:r.method,path:r.path})),stale_exact_basis:true,erased_unavailable:true,
    unrelated_draft_preserved:true,incomplete_and_exhausted_distinct:true,fresh_client_reopened_same_followup:true,
    assistance:'scripted fixture and UI actions; arithmetic uses inspected note; local owner authentication fixture'}}));
  checks.push('work search: phrase-only discovery beyond page one, exact note inspection/reuse, useful saved and reopened bowl order, draft retention, stale/erased source and incomplete/exhausted reads');
}
