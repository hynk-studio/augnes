import assert from 'node:assert/strict';
import path from 'node:path';
import { migrationPrefix } from './web-planning-local-runtime.mjs';
import { headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { planningDraft, selectHistoricalNote } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { bundleWebPlanning } from './build-web-planning.mjs';
import { predecessorCode } from './web-planning-branch-checks.mjs';

const predecessor='19301f0bc31df7444252f264303ece47438a0848';
const entry='scripts/web-planning-local-ingress.ts';
const ok=async response=>{const r=await response;assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
const rejected=async (response,code,status)=>{const r=await response;assert.equal(r.data.error,code);assert.equal(r.status,status);};
const material=(r,ref)=>r.relations.materials.find(m=>m.source_ref===ref);
const route=(r,suffix)=>'/api/work/'+r.work_id+suffix;
const pending=p=>({ticket:p.ticket,intent:p.intent});
async function edit(c,r,draft){
 const {ticket}=await ok(c.request(route(r,'/ticket'),{...draft,expected:headBinding(r)}));
 return (await ok(c.request(route(r,'/save'),{...draft,ticket}))).saved;
}
async function adaptCondition(c,branch,b,deps){
 const draft=planningDraft(branch),refs=branch.sources.map(s=>s.source_ref);
 draft.material_edits[refs.indexOf(b)]={adapts:b,dependencies:deps.map(d=>refs.indexOf(d))};
 const saved=await edit(c,branch,draft);
 assert.deepEqual(saved.sources,branch.sources); // Same derived B; immediate-base adaptation can revise its conditions.
 assert.deepEqual(material(saved,b),{source_ref:b,kind:'adapted',from:{...reference(branch),source_ref:b},dependencies:deps});
 return saved;
}
async function prepareCase(c){
 const notes=['Promise an accessible entrance only on the agreed route.','Use the side gate only if confirmed.','The venue must confirm the ramp first.'].map((text,i)=>({text,source:'Venue planning',observed_at:null,label:'Next check',provenance:i===1?'derived_interpretation':'user_declaration'}));
 const draft={definition:{goal:'Prepare the venue notice',success_criteria:['Keep the conditions with the invitation'],non_goals:[]},notes,
  material_edits:notes.map((_,i)=>({adapts:null,dependencies:i<2?[i+1]:[]})),files:[{name:'programme.txt',role:'source',data:Buffer.from('Unrelated programme').toString('base64')}]};
 const first=await ok(c.request('/api/drafts',draft)),target1=(await ok(c.request(route(first,'/save'),{...draft,ticket:first.ticket}))).saved;
 const [a,b,condition]=notes.map(n=>target1.sources.find(s=>s.bounded_summary===n.text).source_ref);
 const empty=await edit(c,target1,{...planningDraft(target1),notes:[],material_edits:[]});
 const target=await edit(c,empty,selectHistoricalNote(planningDraft(empty),empty,target1,a));
 const fork=await ok(c.request(route(target,'/branch-preview'),{expected:headBinding(target),intent:{reason:'Consider another entrance condition'}}));
 const branch1=(await ok(c.request(route(fork,'/relation-save'),pending(fork)))).saved;
 const branch=await adaptCondition(c,branch1,b,[]);
 const intent=(s,keep)=>({source:reference(s),dispositions:s.sources.map(n=>({source_ref:n.source_ref,disposition:n.source_ref===b?'incorporated':'not_selected',rationale:''})),
  rationale:'Review the side gate condition',next_question:'Check with the venue',target_selection:keep,file_selection:{target:target.files,source:[]}});
 const preview=(s,keep)=>({expected:headBinding(target),intent:intent(s,keep)});
 return {target,branch,a,b,condition,preview};
}

export async function checkHistoricalIncorporation({start,client,passed,root,open}){
 const old=await predecessorCode(predecessor,entry),current=(await bundleWebPlanning(path.resolve(entry))).code;
 const oldFolder=await migrationPrefix(root,3);
 for(const upgrade of [false,true]){
  const name='historical-incorporation-'+(upgrade?'upgrade':'predecessor');let server=await start(name,{code:old,migrationsFolder:oldFolder});
  let c=await client(server);
  const {target,branch,a,b,condition,preview}=await prepareCase(c);
  const raw=async()=> (await server.db.prepare('SELECT envelope FROM web_planning_revision WHERE work_id=? ORDER BY revision').bind(target.work_id).all()).results.map(row=>row.envelope);
  const before=await raw(),history=()=>ok(c.request(route(target,'/history')));assert.equal(before.length,3);
  const conflict=preview(branch,[a,b]),p=await ok(c.request(route(target,'/incorporation-preview'),conflict)); // Ticket from the real preceding Worker.
  if(!upgrade){
   await rejected(c.request(route(target,'/relation-save'),pending(p)),'required_material_missing',422);
   const written=await raw();assert.equal(written.length,4);assert.deepEqual(written.slice(0,3),before);
   await rejected(c.request(route(target,'/history')),'required_material_missing',422);
   console.log(JSON.stringify({historical_incorporation:'predecessor',preview:200,save:'required_material_missing',rows:written.length,prefix_unchanged:true,readable:false}));
   continue;
  }
  const options={port:Number(new URL(server.origin).port),bindings:server.env};await server.close();open.splice(open.indexOf(server),1);server=await start(name,{code:current,...options});c=await client(server);
  const comparison=await ok(c.request(route(target,'/compare'),{expected:headBinding(target),source:reference(branch)}));
  assert.deepEqual(Object.keys(comparison).sort(),['baseline','branch','html','target']); // History stays inside the validation boundary.
  const original=(await history()).revisions,backup=await ok(c.request(route(target,'/export')));
  assert.deepEqual(original,before.map(s=>JSON.parse(s)));
  await rejected(c.request(route(target,'/incorporation-preview'),conflict),'required_material_missing',422);
  // Merely retaining C as a loose note cannot restore the required B -> C edge.
  await rejected(c.request(route(target,'/incorporation-preview'),preview(branch,[a,b,condition])),'required_material_missing',422);
  await rejected(c.request(route(target,'/relation-save'),pending(p)),'required_material_missing',422);
  assert.equal((await ok(c.request(route(target,'/relation-resolve'),pending(p)))).outcome,'unknown');
  assert.deepEqual(await raw(),before);assert.deepEqual((await history()).revisions,original);
  assert.deepEqual(await ok(c.request(route(target,'/export'))),backup);
  const stale=await ok(c.request(route(target,'/incorporation-preview'),preview(branch,[b])));
  const repaired=await adaptCondition(c,branch,b,[condition]);
  await rejected(c.request(route(target,'/relation-save'),pending(stale)),'refresh_required',409);
  const valid=await ok(c.request(route(target,'/incorporation-preview'),preview(repaired,[a,b,condition])));
  const saved=(await ok(c.request(route(target,'/relation-save'),pending(valid)))).saved;assert.equal(saved.revision,4);
  assert.deepEqual(material(saved,a),material(target,a));
  assert.deepEqual(material(saved,b),{source_ref:b,kind:'incorporated',from:{...reference(repaired),source_ref:b},dependencies:[condition]});
  assert.deepEqual((await ok(c.request(route(target,'/relation-resolve'),pending(valid)))).saved,saved);
  assert((await ok(c.request(route(target,'/relation-save'),pending(valid)))).replayed);
  const continuation=planningDraft(saved);continuation.definition.goal='Confirm the side gate before issuing the invitation';
  const final=await edit(c,saved,continuation);assert.equal(final.revision,5);
  assert.deepEqual((await history()).revisions,[...original,saved,final]);assert.deepEqual((await ok(c.request(route(target,'')))).saved,final);
  const after=await ok(c.request(route(target,'/export')));assert.deepEqual(after.files,backup.files);assert.deepEqual(final.files,target.files);
  console.log(JSON.stringify({historical_incorporation:'corrected',preview_and_old_ticket:'required_material_missing',target_rows_after_refusal:before.length,prefix_and_file_export_unchanged:true,valid_saved:saved.revision,reopened:final.revision,stale_and_replay_checked:true}));
 }
 passed('historical incorporation: actual predecessor append, corrected preview and old ticket refusal without mutation, valid transitive context and file continuation');
}
