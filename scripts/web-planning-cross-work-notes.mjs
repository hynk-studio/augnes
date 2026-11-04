import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { headBinding, makeRevision, reference } from '../apps/web_planning/src/contract.ts';
import { append } from '../apps/web_planning/src/store.ts';
import { planningDraft, selectHistoricalNote } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { digest } from '../apps/augnes_apps/scripts/web-file-client.mjs';

export async function checkCrossWorkNotes({start,client,passed}){
  const server=await start('cross-work-notes'),c=await client(server);
  const ok=async req=>{const r=await req;assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  const url=(r,op)=>'/api/work/'+r.work_id+(op?'/'+op:'');
  const post=(r,op,input)=>c.request(url(r,op),input);
  const prepare=async(r,d)=>({...d,...await ok(post(r,'ticket',{expected:headBinding(r),...d}))});
  const save=async(r,d)=>(await ok(post(r,'save',await prepare(r,d)))).saved;
  const create=async(d)=>{const t=await ok(c.request('/api/drafts',d));return (await ok(post(t,'save',{...d,ticket:t.ticket}))).saved;};
  const note=(text,source)=>({text,source,label:'Next check',provenance:'user_declaration',observed_at:'2026-10-22T11:00:00.000Z'});
  const draft=(goal,notes,edges)=>({definition:{goal,success_criteria:['Keep the relevant conditions'],non_goals:[]},notes,
    material_edits:edges.map(dependencies=>({adapts:null,dependencies})),files:[]});
  const root=note('Accept the panel only after the overnight check.','Workshop log'),middle=note('Do not move the panel until the seal dries.','Conservator'),
    leaf=note('Drying time was measured in the ventilated room.','Room record'),extra=note('The artist also supplied a photo.','Registrar');
  middle.provenance='derived_interpretation';
  const A1=await create(draft('Assess the panel treatment',[root,middle,leaf,extra],[[1],[2],[],[]]));
  const A2=await save(A1,{...draft('Clarify the treatment record',[{...root,text:'Handle only after the seal has cured.',provenance:'derived_interpretation'},middle,leaf,extra],[[1],[2],[],[]]),
    material_edits:[{adapts:A1.sources.find(s=>s.bounded_summary===root.text).source_ref,dependencies:[1]},{adapts:null,dependencies:[2]},{adapts:null,dependencies:[]},{adapts:null,dependencies:[]}]});
  const A3=await save(A2,{...planningDraft(A2),definition:{...A2.definition,goal:'Archive the reviewed treatment record'}});
  const ref=A3.sources.find(s=>s.trust_class==='derived_interpretation').source_ref;
  const B1=await create(draft('Write handling instructions for the courier',[middle,leaf],[[1],[]]));
  const bytes=Buffer.from('Keep crate 14 upright.'),file={name:'crate.txt',media_type:'text/plain',bytes:bytes.length,digest:digest(bytes),data:bytes.toString('base64')};
  const exchange=await ok(post(B1,'exchanges/save',{expected:headBinding(B1),request_key:randomUUID(),kind:'request',basis:null,message:'Check the crate label',next_action:'',files:[file]}));
  const B=(await ok(post(B1))).saved,prior=await ok(post(B,'export'));
  assert.equal(B.revision,2);assert.equal(A3.revision,3);assert.notEqual(A3.work_id,B.work_id);
  const before=planningDraft(B);before.definition.non_goals=['Do not change the freight booking.'];
  before.files.push({name:'packing.txt',role:'source',data:Buffer.from('Keep the existing packing order.').toString('base64')});
  const proposal=selectHistoricalNote(before,B,A3,ref),both=selectHistoricalNote(proposal,B,A3,ref,'Ask the conservator to release the sealed panel before collection.');
  const row=both.material_edits.findIndex(m=>m.historical?.source_ref===ref);
  const bad=structuredClone(both);bad.material_edits[bad.notes.findIndex(n=>n.text===middle.text)].dependencies=[];
  const refused=async(d,code)=>assert.equal((await post(B,'ticket',{...d,expected:headBinding(B)})).data.error,code);
  const cap=async(d)=>ok(post(B,'capacity',{definition:d.definition,notes:d.notes,material_edits:d.material_edits,expected:headBinding(B),check_id:randomUUID()}));
  await refused(bad,'required_material_missing');assert((await cap(bad)).issues.some(i=>i.code==='required_material_missing'));
  const unbound=(await ok(post(B,'ticket',{expected:headBinding(B)}))).ticket;
  assert.equal((await post(B,'save',{...bad,ticket:unbound})).data.error,'bound_selection_ticket_required');
  const fake=structuredClone(both);fake.notes[row].source='Another author';await refused(fake,'historical_note_mismatch');
  for(const alter of [{work_id:randomUUID()},{revision:A2.revision},{fingerprint:B.fingerprint},{source_ref:'sha256:'+'0'.repeat(64)}]){
    const d=structuredClone(both);Object.assign(d.material_edits[row].historical,alter);await refused(d,'historical_note_unavailable');
  }
  const duplicate=structuredClone(both);duplicate.notes.push(duplicate.notes[row]);duplicate.material_edits.push({...duplicate.material_edits[row],historical:{...duplicate.material_edits[row].historical,...reference(A2)}});
  await refused(duplicate,'duplicate_material_conflict');
  const over=structuredClone(both);
  while(over.notes.length<8){over.notes.push(note('x'.repeat(1900),'Large '+over.notes.length));over.material_edits.push({adapts:null,dependencies:[]});}
  assert.equal((await cap(over)).fits,false);await refused(over,'selected_source_context_budget_exceeded');
  assert.equal((await post(B,'ticket',{...both,expected:headBinding(B),project_id:randomUUID()})).status,403);
  assert.equal((await c.request(url(A3,'history?view=notes'),undefined,{cookie:''})).status,403);
  assert.deepEqual(await ok(post(B,'export')),prior);
  const win=await prepare(B,both),lose=await prepare(B,{...both,definition:{...both.definition,goal:'Competing pickup'}});
  const A4=await save(A3,{...draft('Close the treatment study',[extra],[[]])});
  const frozen=await ok(post(A4,'export'));
  assert.equal((await ok(post(B,'resolve',win))).outcome,'unknown');
  const race=await Promise.all([post(B,'save',win),post(B,'save',lose)]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const pending=race[0].status===200?win:lose,missing=pending===win?lose:win;
  const saved=(await ok(post(B))).saved;assert.equal(saved.revision,3);assert.equal(saved.relations.origin,null);
  assert.deepEqual(saved.definition,pending.definition);assert.equal(saved.sources.length,4);assert.equal(saved.files[0].name,'packing.txt');
  for(const m of saved.relations.materials.filter(m=>m.from)){assert.deepEqual(m.from,{...reference(A3),source_ref:ref});assert.equal(m.dependencies.length,1);}
  assert.deepEqual(saved.sources.find(s=>s.source_ref===ref),A3.sources.find(s=>s.source_ref===ref));
  assert.equal(A3.relations.materials.find(m=>m.source_ref===ref).from.fingerprint,A1.fingerprint);
  assert.deepEqual(await ok(post(A4,'export')),frozen);
  assert.deepEqual((await ok(post(B,'exchanges'))).items[0].ref,exchange.item.ref);
  const live=await ok(post(saved,'context',{expected:headBinding(saved)}));assert.match(live,/Recorded source note is listed/);
  // Replacing a condition through an otherwise valid direct-branch review
  // must not orphan the already retained independent notes' transitive context.
  const fork=await ok(post(saved,'branch-preview',{expected:headBinding(saved),intent:{reason:'Review the packing conditions'}}));
  const branch=(await ok(post(fork,'relation-save',{ticket:fork.ticket,intent:fork.intent}))).saved;
  const change=planningDraft(branch),mid=change.notes.findIndex(n=>n.text===middle.text),midRef=branch.sources[mid].source_ref;
  change.material_edits[mid]={adapts:midRef,dependencies:[]};
  const modified=await save(branch,change);
  const intent={source:reference(modified),dispositions:modified.sources.map(s=>({source_ref:s.source_ref,disposition:s.source_ref===midRef?'incorporated':'not_selected',rationale:''})),
    rationale:'Compare handling conditions',next_question:'',target_selection:saved.sources.map(s=>s.source_ref),file_selection:{target:saved.files,source:[]}};
  const intact=await ok(post(saved,'export'));
  assert.equal((await post(saved,'incorporation-preview',{expected:headBinding(saved),intent})).data.error,'required_material_missing');
  assert.deepEqual(await ok(post(saved,'export')),intact);
  // Prepare a genuinely new selection, then remove its source before commit.
  const same=planningDraft(saved),sameIndex=saved.sources.findIndex(n=>n.source_ref===ref);
  same.material_edits[sameIndex]={mode:'reuse',historical:{...reference(A3),source_ref:ref},dependencies:same.material_edits[sameIndex].dependencies};
  const noop=await prepare(saved,same);assert.equal((await ok(post(saved,'save',noop))).noop,true);
  const newChoice=selectHistoricalNote(planningDraft(saved),saved,A3,ref,'Inspect the release record before loading.');
  const absent=await prepare(saved,newChoice);
  await ok(post(A4,'erase',{expected:headBinding(A4),confirm:'erase-whole-work'}));
  assert.equal((await ok(post(saved,'resolve',noop))).noop,true);
  assert.equal((await post(saved,'save',absent)).data.error,'historical_note_unavailable');
  assert.equal((await ok(post(saved,'resolve',absent))).outcome,'unknown');
  assert.equal((await ok(post(B,'resolve',missing))).outcome,'unknown');
  assert.deepEqual((await ok(post(B,'resolve',pending))).saved,saved);assert((await ok(post(B,'save',pending))).replayed);
  assert.equal((await post(B,'resolve',{...pending,definition:{...pending.definition,goal:'Altered'}})).data.error,'altered_replay');
  // Exercise the final SQL gate itself with a source read that predates erasure.
  const store={...B,DB:server.db},raw=await ok(post(B,'history'));
  const broken=structuredClone(saved.relations);broken.materials.find(m=>m.source_ref===midRef).dependencies=[];
  const unchecked=makeRevision(B,B.work_id,headBinding(saved),randomUUID(),{definition:saved.definition,sources:saved.sources,relations:broken,files:saved.files},new Date().toISOString());
  await assert.rejects(append(store,raw.revisions,unchecked),e=>e.code==='required_material_missing');
  const staleNext=makeRevision(B,B.work_id,headBinding(saved),randomUUID(),{definition:saved.definition,sources:saved.sources,relations:saved.relations,files:saved.files},new Date().toISOString());
  const orphan=Buffer.from('not persisted');await append(store,raw.revisions,staleNext,undefined,[{digest:digest(orphan),bytes:orphan.length,data:orphan.toString('base64')}],[reference(A3)]);
  assert.deepEqual(await ok(post(B,'history')),raw);assert.equal(await server.db.prepare('SELECT digest FROM web_planning_file WHERE digest=?').bind(digest(orphan)).first(),null);
  const context=await ok(post(saved,'context',{expected:headBinding(saved)}));assert.match(context,/Origin unavailable/);
  const after=await save(saved,{...planningDraft(saved),definition:{...saved.definition,success_criteria:['Record the loading decision']}});
  const recovery=await ok(post(after,'export'));assert.deepEqual(recovery.revisions.slice(0,2),prior.revisions);
  assert.match(await ok(post(after,'reading-export')),/Ask the conservator/);
  const dest=await start('cross-work-recovery'),reader=await client(dest);
  await ok(reader.request('/api/reconstruct-files',{export:recovery,confirm:'reconstruct-empty-store'}));
  assert.equal((await reader.request(url(A3))).status,404);assert.deepEqual(await ok(reader.request(url(after,'export'))),recovery);
  assert.deepEqual((await ok(reader.request(url(after)))).saved,after);
  const later=planningDraft(after),i=later.notes.findIndex(n=>n.text.startsWith('Ask the conservator'));later.notes[i]={...later.notes[i],text:'Document a new packing decision.'};later.material_edits[i]={adapts:after.sources[i].source_ref,dependencies:[]};
  const edited=await save(after,later);assert.equal(edited.relations.materials.find(m=>m.from?.fingerprint===after.fingerprint).dependencies.length,0);
  passed('independent work notes: pinned non-head source, earlier adaptation, overlapping transitive conditions, scope, capacity, race, file rollback, erasure, replay and standalone reconstruction');
}
