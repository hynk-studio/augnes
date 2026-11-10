import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { canonical, headBinding, makeRevision, normalizePayload } from '../apps/web_planning/src/contract.ts';
import { searchWork } from '../apps/web_planning/src/work-search.ts';
import { seal } from '../apps/web_planning/src/access.ts';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

export async function checkWorkSearch({start,client,newWork,save,root,passed}) {
  const server=await start('work-search'),c=await client(server);
  const ok=async promise=>{const r=await promise;assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  const title='Community supper',phrase='copper lantern seating';
  const note={text:phrase+': 29 guests, 7 bring bowls; spare bowls come in packs of 6.',source:'Venue coordinator',label:'Next check',provenance:'user_declaration',observed_at:null};
  const definition={goal:title,success_criteria:['Plan the bowl order'],non_goals:[]};
  const works=[];
  for(let i=0;i<14;i++)works.push((await ok(save(c,await newWork(c,definition,[])))).saved);
  works.sort((a,b)=>a.work_id.localeCompare(b.work_id));
  async function change(row,draft) {
    const ticket=await ok(c.request('/api/work/'+row.work_id+'/ticket',{...draft,expected:headBinding(row)}));
    return (await ok(c.request('/api/work/'+row.work_id+'/save',{...draft,ticket:ticket.ticket}))).saved;
  }
  const target=await change(works[11],{...planningDraft(works[11]),notes:[note],material_edits:[{adapts:null,dependencies:[]}]});
  const obsolete=await change(works[12],{...planningDraft(works[12]),notes:[{...note,text:'old-only silver orchard'}],material_edits:[{adapts:null,dependencies:[]}]});
  await change(obsolete,{...planningDraft(obsolete),notes:[],material_edits:[]});
  const initial=await ok(c.request('/api/works'));assert(!initial.items.some(r=>r.work_id===target.work_id));
  const route=q=>'/api/works/search?q='+encodeURIComponent(q);
  const first=await ok(c.request(route(phrase)));assert.equal(first.status,'more');assert.equal(first.scanned,10);assert.deepEqual(first.items,[]);
  const second=await ok(c.request(route(phrase)+'&cursor='+encodeURIComponent(first.next)));
  assert.equal(second.status,'exhausted');assert.equal(second.scanned,14);assert.equal(second.items.length,1);
  const hit=second.items[0];assert.equal(hit.work_id,target.work_id);assert.equal(hit.fingerprint,target.fingerprint);
  assert.deepEqual(hit.matches,[{field:'note',note:1,source_ref:target.sources[0].source_ref,excerpt:note.text}]);
  for(const query of ['old-only silver orchard','Copper lantern','no such phrase']) {
    const a=await ok(c.request(route(query))),b=await ok(c.request(route(query)+'&cursor='+encodeURIComponent(a.next)));
    assert.deepEqual(a.items,[]);assert.deepEqual(b.items,[]);assert.equal(b.status,'exhausted');
  }
  assert.equal((await ok(c.request(route(title)))).items.length,10);
  for(const query of ['', 'a'.repeat(257), 'bad\u0000query'])assert.equal((await c.request(route(query))).status,422);
  assert.equal((await c.request(route('another')+'&cursor='+encodeURIComponent(first.next))).status,422);
  for(const suffix of ['&project_id='+randomUUID(),'&q=other','&cursor=x&cursor=y'])assert.equal((await c.request(route(phrase)+suffix)).status,403);
  assert.equal((await c.request(route(phrase),undefined,{cookie:''})).status,403);
  const foreign={...fixtureScope,project_id:randomUUID()};
  const row=makeRevision(foreign,randomUUID(),{revision:0,fingerprint:null},randomUUID(),normalizePayload(foreign,definition,[note]),new Date().toISOString());
  await assert.rejects(server.db.prepare('INSERT INTO web_planning_revision VALUES (?,?,?,?,?,?,?,?)').bind(row.workspace_id,row.project_id,row.work_id,row.revision,row.fingerprint,row.request_key,row.request_fingerprint,canonical(row)).run(),/FOREIGN KEY/);
  assert.equal((await ok(c.request(route(phrase)+'&cursor='+encodeURIComponent(first.next)))).scanned,14);
  const access={...fixtureScope,env:server.env,DB:server.db};
  assert.deepEqual((await searchWork({...access,...foreign},phrase,null)).items,[]);
  const foreignCursor=seal(access,{kind:'work_search_cursor',...foreign,query:phrase,after:works[9].work_id,scanned:10});
  assert.equal((await c.request(route(phrase)+'&cursor='+encodeURIComponent(foreignCursor))).status,403);
  const before=(await server.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n;
  const matchRoute='/api/works/match?selection='+encodeURIComponent(hit.selection);
  assert.equal((await ok(c.request(matchRoute))).status,'current');
  const advanced=await change(target,{...planningDraft(target),definition:{...target.definition,success_criteria:['Plan the bowl order and recheck guest count']}});
  const historical=await ok(c.request(matchRoute));assert.equal(historical.status,'advanced');
  assert.equal(historical.observed.fingerprint,target.fingerprint);assert.equal(historical.current.fingerprint,advanced.fingerprint);
  assert.equal((await c.request('/api/work/'+target.work_id+'/ticket',{expected:headBinding(target)})).status,409);

  // Each invocation is a fresh authenticated project-owner client. Its only
  // initial inputs are project access and the phrase; it consumes returned tokens.
  const dir=path.join(root,'search-client');await mkdir(dir);
  const env={...process.env,AUGNES_WEB_ORIGIN:server.origin,AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+server.env.LOCAL_SESSION};
  async function cli(label,args,success=true) {
    let stdout='',stderr='';
    const result=await runCanonicalChild({suite:'web-planning',label:'search-client-'+label,command:process.execPath,cwd:path.resolve('.'),env,
      args:['apps/augnes_apps/scripts/file-exchange.mjs',...args],timeoutMs:10000,
      stdout:{write:data=>{stdout+=data;}},stderr:{write:data=>{stderr+=data;}}});
    if(success){assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
    assert.equal(result.exit_code,1);return stderr;
  }
  const found1=await cli('first',['search',phrase]),found2=await cli('continued',['search',phrase,found1.next]);
  assert.equal(found1.items.length,0);const selected=found2.items[0];assert.equal(selected.work_id,target.work_id);
  const inspected=await cli('inspect',['inspect-match',selected.selection]);assert.equal(inspected.observed.sources[0].bounded_summary,note.text);
  const ambiguous=await cli('same-title',['search',inspected.observed.definition.goal]);
  assert.equal(ambiguous.items.length,10);assert.equal(new Set(ambiguous.items.map(r=>r.work_id)).size,10);
  const setup=path.join(dir,'chosen.json');await cli('choose',['select-match',selected.selection,setup]);
  assert.equal(JSON.parse(await readFile(setup)).work_id,target.work_id);
  assert.equal((await cli('reopen',[setup,'context'])).fingerprint,advanced.fingerprint);
  assert.equal((await cli('old-basis',['inspect-match',hit.selection])).observed.fingerprint,target.fingerprint);
  assert.match(await cli('ambiguous-title',['select',title,path.join(dir,'ambiguous.json')],false),/search, inspect-match and select-match/);
  assert.equal((await server.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,before+1);

  const observations=[];
  function instrument(mutate) {
    return {prepare(sql){const raw=server.db.prepare(sql);const wrap=s=>({bind(...args){return wrap(s.bind(...args));},async all(){const result=await s.all();observations.push({sql,rows:result.results.length});return mutate?.(sql,result)??result;}});return wrap(raw);}};
  }
  await searchWork({...access,DB:instrument()},phrase,null);
  assert.equal(observations.length,11);assert.equal(observations.slice(1).every(r=>r.rows===1),true);
  assert.equal(observations.some(r=>/web_planning_file|json_remove|INSERT|UPDATE|DELETE/.test(r.sql)),false);
  for(const mutate of [
    (sql,r)=>sql.includes('WITH RECURSIVE')?{results:r.results.slice(0,-1)}:r,
    (sql,r)=>sql.includes('WITH head')?{results:[]}:r,
    (sql,r)=>sql.includes('WITH head')?{results:[{...r.results[0],envelope:null}]}:r,
    (sql,r)=>sql.includes('WITH head')?{results:[{...r.results[0],erased:1}]}:r,
    (sql,r)=>sql.includes('WITH head')?{results:[{...r.results[0],envelope:r.results[0].envelope.replace(title,'Wrong community')}]}:r,
  ])await assert.rejects(searchWork({...access,DB:instrument(mutate)},phrase,null));
  await ok(c.request('/api/work/'+advanced.work_id+'/erase',{expected:headBinding(advanced),confirm:'erase-whole-work'}));
  assert.equal((await c.request(matchRoute)).status,410);
  assert.match(await cli('erased',['inspect-match',hit.selection],false),/work_erased/);
  console.log(JSON.stringify({work_search_client_originals:{query:phrase,inspected,stale_inspection:historical,
    selected_setup:JSON.parse(await readFile(setup)),same_title_choices:ambiguous.items.map(({selection,...item})=>item)}}));
  console.log(JSON.stringify({work_search:{works:14,target_ordinary_page:2,first:{scanned:first.scanned,status:first.status,matches:0},
    completed:{scanned:second.scanned,status:second.status,matches:1},observed_revision:target.revision,current_revision:advanced.revision,
    fresh_client_selection:true,read_writes:0,search_queries_per_page:11,current_rows_per_query:1,attachment_reads:0}}));
  passed('work search: beyond first page, same titles, exact note basis, fresh owner selection, stale/erased, scope, old-only, incomplete and exhausted, no history/file reads or writes');
}
