import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonicalBytes, inspectDraftCapacity } from '../apps/web_planning/src/capacity.ts';
import { canonical, headBinding, makeRevision, normalizePayload, validateExport, validateRelations, RELATION_BYTES, reference } from '../apps/web_planning/src/contract.ts';
import { editedPayload } from '../apps/web_planning/src/relations.ts';
import { capacityDefinition as definition, capacityEnvelopeEstimates, capacityNotes, revisedCapacityNote, subsequentObservation } from './web-planning-capacity-fixture.mjs';

export async function checkCapacity({c,scope,passed}){
 const notes=capacityNotes(scope), edits=notes.map((_,i)=>({dependencies:i===3?[0,1,2]:[],adapts:null}));
 const initial={definition,notes,material_edits:edits};
 async function inspect(input,head){const r=await c.request(head?'/api/work/'+head.work_id+'/capacity':'/api/capacity',{check_id:randomUUID(),...input,...(head?{expected:headBinding(head)}:{})});assert.equal(r.status,200);return r.data;}
 let metric=await inspect(initial);const baseline=metric.selection;assert.equal(metric.fits,true,JSON.stringify(metric));assert.equal(metric.selection.used,11_947);assert.equal(metric.selection.remaining,53);
 const draft=await c.request('/api/drafts',initial);const id=draft.data.work_id;
 assert.equal((await c.request('/api/work/'+id)).status,404,'inspection and tickets do not persist');
 const first=(await c.request('/api/work/'+id+'/save',{...initial,ticket:draft.data.ticket})).data.saved;
 assert(first);assert.equal(canonicalBytes(first.sources),metric.selection.used);assert.equal(canonicalBytes(first.relations),metric.relations.used);
 const before=(await c.request('/api/work/'+id+'/export')).data;
 const extra={...notes[0],text:subsequentObservation};
 const over={...initial,notes:[...notes,extra],material_edits:[...edits,{dependencies:[0,1,2],adapts:null}]};
 const overMetric=await inspect(over,first);assert.equal(overMetric.fits,false);assert.equal(overMetric.issues[0].code,'selected_source_context_budget_exceeded');assert(overMetric.selection.remaining<0);assert(overMetric.relations.remaining>0);
 const refused=await c.request('/api/work/'+id+'/ticket',{...over,expected:headBinding(first)});assert.equal(refused.status,422);assert.equal(refused.data.error,overMetric.issues[0].code);
 assert.deepEqual((await c.request('/api/work/'+id+'/export')).data,before);
 const selected=first.sources.map(s=>({source:s.compatibility_source_ref.external_id,text:s.bounded_summary,label:s.why_included,provenance:s.trust_class,observed_at:s.external_ref.observed_at}));
 const index=selected.findIndex(n=>n.source===notes[3].source),ref=first.sources[index].source_ref;
 selected[index]={...selected[index],text:revisedCapacityNote(),provenance:'derived_interpretation'};
 const material_edits=first.sources.map((s,i)=>({dependencies:first.relations.materials.find(m=>m.source_ref===s.source_ref).dependencies.map(d=>first.sources.findIndex(n=>n.source_ref===d)),adapts:i===index?ref:null}));
 const revision={definition,notes:selected,material_edits};metric=await inspect(revision,first);assert.equal(metric.fits,true,JSON.stringify(metric));
 const ticket=await c.request('/api/work/'+id+'/ticket',{...revision,expected:headBinding(first)});
 const saved=await c.request('/api/work/'+id+'/save',{...revision,ticket:ticket.data.ticket});assert.equal(saved.status,200);const second=saved.data.saved;
 assert.equal(second.revision,2);assert.equal(canonicalBytes(second.sources),metric.selection.used);assert.equal(canonicalBytes(second.relations),metric.relations.used);
 assert.deepEqual((await c.request('/api/work/'+id)).data.saved,second);
 const exported=(await c.request('/api/work/'+id+'/export')).data;
 assert.deepEqual(validateExport(scope,exported),exported.revisions);assert.deepEqual(exported.revisions[0],before.revisions[0]);
 const adapted=second.relations.materials.find(m=>m.kind==='adapted');assert.deepEqual(adapted.from,{...reference(first),source_ref:ref});assert.equal(adapted.dependencies.length,3);
 assert.equal((await c.request('/api/work/'+id+'/capacity',{check_id:randomUUID(),...revision,expected:headBinding(first)})).data.error,'refresh_required');
 const repeated=await c.request('/api/work/'+id+'/save',{...revision,ticket:ticket.data.ticket});assert.deepEqual(repeated.data.saved,second);
 passed('capacity: near-full update agrees with admission; refusal preserves export; edit/reopen/export retains original and required lineage');

 for(const delta of [0,1]){
   const boundary=structuredClone(initial);boundary.notes[3].text+='x'.repeat(53+delta);
   const m=await inspect(boundary);assert.equal(m.selection.used,12_000+delta);assert.equal(m.fits,delta===0);
   const r=await c.request('/api/drafts',boundary);assert.equal(r.status,delta===0?200:422);
 }
 for(const text of ['😀'.repeat(2000),'😀'.repeat(2001),' 한 🌿 " \\ \n ',' '.repeat(2000)+'x']){
   const input={definition,notes:[{...notes[0],text}],material_edits:[{dependencies:[],adapts:null}]};
   const m=await inspect(input);const admission=await c.request('/api/drafts',input);assert.equal(m.fits,admission.status===200);
   assert.equal(m.rows[0].characters,[...text].length);
   if(m.fits)assert.equal(m.selection.used,canonicalBytes(normalizePayload(scope,definition,input.notes).sources));else assert.equal(m.selection.used,null);
 }
 const one={definition,notes:[{...notes[0],text:'Observation',source:'한'.repeat(256)}],material_edits:[{dependencies:[],adapts:null}]};
 const metadata=await inspect(one);assert(metadata.selection.metadata_bytes>metadata.selection.text_bytes*100);assert.equal(metadata.fits,true);
 const duplicate=await inspect({...one,notes:[one.notes[0],one.notes[0]],material_edits:[one.material_edits[0],one.material_edits[0]]});assert.equal(duplicate.selection.used,metadata.selection.used);assert.equal(duplicate.rows[1].duplicate_of,1);
 const attribution=await inspect({...one,notes:[{...one.notes[0],source:'😀'.repeat(129)}]});assert.equal(attribution.fits,false);assert.equal(attribution.rows[0].source_units,258);
 const nine=await inspect({...initial,notes:Array(9).fill(notes[0]),material_edits:Array(9).fill(edits[0])});assert.equal(nine.notes.used,9);assert.equal(nine.selection.used,null);assert.equal(nine.issues[0].code,'whole_note_limit');
 const bigDefinition={...one,definition:{goal:'😀'.repeat(2000),success_criteria:['😀'.repeat(500),'한'.repeat(500),'a'.repeat(500)],non_goals:['z'.repeat(500)]}};
 const big=await inspect(bigDefinition);assert(big.definition.remaining<0);assert.equal(big.fits,false);assert.equal((await c.request('/api/drafts',bigDefinition)).data.error,'first_work_definition_too_large');
 const missingMetric=await inspect({...initial,material_edits:edits.map((m,i)=>i===3?{...m,dependencies:[-1]}:m)});assert.equal(missingMetric.issues.at(-1).code,'invalid_dependencies');assert.equal(missingMetric.relations.used,null);
 for(const request of [{check_id:randomUUID(),...initial,project_id:randomUUID()},{check_id:randomUUID(),...initial}]){
   const result=await c.request('/api/capacity',request,request.project_id?{}:{'x-csrf-token':'wrong'});assert.equal(result.status,403);
 }
 const huge=await c.request('/api/capacity',{check_id:randomUUID(),...initial,notes:[{...notes[0],text:'x'.repeat(1_500_000)}]});assert.equal(huge.status,413);assert.equal(huge.data.error,'request_too_large');
 passed('capacity: exact UTF-8 boundary, Unicode/codepoints, raw text bounds, metadata, duplicates, attribution units, count/definition/request and dependency refusals');

 // Separately exercise relation growth: an admissible prior review can leave
 // insufficient space for eight explicit adaptation links.
 const small=Array.from({length:8},(_,i)=>({...notes[0],text:'n'+i,source:'Synthetic',label:'Next check',observed_at:null}));
 const base=normalizePayload(scope,definition,small);const own=randomUUID(),other={work_id:randomUUID(),revision:1,fingerprint:'sha256:'+'1'.repeat(64)};
 const ownRef={...other,work_id:own};
 let previous;
 for(let length=1;length<=500;length++){
   const review={source:other,target:ownRef,dispositions:base.sources.map(s=>({source_ref:s.source_ref,disposition:'deferred',rationale:'r'.repeat(length)})).sort((a,b)=>a.source_ref.localeCompare(b.source_ref)),rationale:'Review',next_question:'Next'};
   const relations={origin:{source:other,reason:'Synthetic branch',selection:base.sources.map(s=>s.source_ref),starting_review:review},materials:base.sources.map(s=>({source_ref:s.source_ref,kind:'authored',from:null,dependencies:[]})),review};
   if(canonicalBytes(relations)>11_000){validateRelations(relations,base,own);previous=makeRevision(scope,own,{revision:0,fingerprint:null},randomUUID(),{...base,relations},'2026-09-20T00:00:00.000Z');break;}
 }
 assert(previous);
 const adaptedInput={definition,notes:previous.sources.map((s,i)=>({...small[i],text:'changed '+i,provenance:'derived_interpretation'})),material_edits:previous.sources.map(s=>({dependencies:[],adapts:s.source_ref}))};
 const relationMetric=inspectDraftCapacity(scope,adaptedInput,previous);assert(relationMetric.relations.used>RELATION_BYTES);assert.equal(relationMetric.fits,false);assert(relationMetric.issues.some(i=>i.code==='relation_budget_exceeded'));
 assert.throws(()=>editedPayload(scope,normalizePayload(scope,definition,adaptedInput.notes),adaptedInput.notes,adaptedInput.material_edits,previous),e=>e.code==='relation_budget_exceeded');
 const full={...first,revision:32};assert.equal(inspectDraftCapacity(scope,{...initial,definition:{...definition,goal:definition.goal+" updated"}},full).fits,true);
 const unchanged={definition:first.definition,notes:first.sources.map(s=>({text:s.bounded_summary,source:s.compatibility_source_ref.external_id,label:s.why_included,provenance:s.trust_class,observed_at:s.external_ref.observed_at})),material_edits:first.sources.map(s=>({dependencies:first.relations.materials.find(m=>m.source_ref===s.source_ref).dependencies.map(ref=>first.sources.findIndex(s=>s.source_ref===ref)),adapts:null}))};
 assert.equal(inspectDraftCapacity(scope,unchanged,full).fits,true);
 passed('capacity: independent relation budget and history disclosure and no-op remain authoritative');
 const envelopes=capacityEnvelopeEstimates(scope);assert(envelopes[1].request_bytes_upper_bound<1_500_000);assert(envelopes[2].request_bytes_upper_bound>1_500_000);
 console.log(JSON.stringify({synthetic_capacity_example:{baseline,addition:overMetric.selection.used,after_revision:metric.selection.used,text:metric.selection.text_bytes,metadata:metric.selection.metadata_bytes,relation:metric.relations.used,save_refusals:1,editing:'append one result; inspect; one deliberate refusal check; replace existing result detail and preserve three required notes',general_usability_claim:false},hypothetical_component_envelope_bounds:envelopes}));
}
