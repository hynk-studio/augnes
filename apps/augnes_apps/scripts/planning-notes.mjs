// A preview allocates only a signed ticket. The destination revision and bytes
// are created together, by the ordinary save, including for a new work.
export function returnDraft(selection, judgment, destination) {
  const base=destination.saved;
  if(!base && !destination.goal?.trim())throw Error('Choose a follow-on goal.');
  const draft=base?planningDraft(base):{definition:{goal:destination.goal,success_criteria:[judgment.next_action],non_goals:[]},notes:[],files:[]};
  const return_choice={selection,decision:judgment.decision,rationale:judgment.rationale,limits:judgment.limits??'',
    reported_check:judgment.reported_check??'',next_action:judgment.next_action,name:judgment.name??null,text:judgment.text??null};
  if(judgment.participant_feedback!==undefined)return_choice.participant_feedback=structuredClone(judgment.participant_feedback);
  return {...draft,return_choice};
}
export async function prepareReturnDraft(api,selection,judgment,destination){
  const base=destination.saved,body=returnDraft(selection,judgment,destination),expected=base?{revision:base.revision,fingerprint:base.fingerprint}:{revision:0,fingerprint:null};
  const prepared=base?await api('/api/work/'+base.work_id+'/ticket',{...body,expected}):await api('/api/drafts',body);
  return {work_id:base?.work_id??prepared.work_id,expected,body:{...body,ticket:prepared.ticket}};
}

// Pure draft composition shared by the browser editor and the scoped task client.
// The Worker resolves the reference again for capacity, ticket, save and replay.
export function noteFields(s) {
  return {text:s.bounded_summary,source:s.compatibility_source_ref.external_id,observed_at:s.external_ref.observed_at??null,provenance:s.trust_class,label:s.why_included};
}
export function planningDraft(saved) {
  const refs=saved.sources.map(s=>s.source_ref);
  return {definition:structuredClone(saved.definition),notes:saved.sources.map(noteFields),files:structuredClone(saved.files??[]),
    material_edits:refs.map(ref=>({adapts:null,dependencies:(saved.relations?.materials.find(m=>m.source_ref===ref)?.dependencies??[]).map(d=>refs.indexOf(d))}))};
}
export function sameOccurrence(a,b) {
  return !!a && !!b && ['work_id','revision','fingerprint','source_ref'].every(k=>a[k]===b[k]);
}
export function sameNote(a,b) { return Object.keys(b).every(key=>a[key]===b[key]); }

// Preserve the editor's row order, unsaved fields and unrelated
// file/scene choices. Traverse at most one revision's eight whole notes.
export function selectHistoricalNote(draft,base,revision,sourceRef,interpretation) {
  if(!base || !revision || revision.project_id!==base.project_id ||
      revision.workspace_id!==base.workspace_id || revision.author_ref!==base.author_ref || (revision.work_id===base.work_id && revision.revision>=base.revision)) throw Error('historical_note_unavailable');
  const result={...draft,notes:[...draft.notes],material_edits:[...draft.material_edits]};
  const entries=new Map(revision.sources.map(s=>[s.source_ref,s])),seen=new Map();
  function append(ref,root=false,adapt=false) {
    if(!adapt && seen.has(ref))return seen.get(ref);
    const entry=entries.get(ref);
    if(!entry)throw Error('required_material_missing');
    const original=noteFields(entry);
    if(adapt && (typeof interpretation!=='string' || !interpretation.trim() || interpretation.trim()===original.text))throw Error('historical_adaptation_required');
    const note=adapt?{...original,text:interpretation,source:base.author_ref,observed_at:null,provenance:'derived_interpretation'}:original;
    const existing=result.notes.findIndex(n=>sameNote(n,note));
    if(existing>=0 && adapt)throw Error('historical_selection_conflict');
    const index=existing>=0?existing:result.notes.length;
    if(!adapt)seen.set(ref,index);
    const edit={mode:adapt?'adapt':(root || revision.work_id===base.work_id)?'reuse':'required',historical:{work_id:revision.work_id,revision:revision.revision,fingerprint:revision.fingerprint,source_ref:ref},dependencies:[]};
    if(existing<0){result.notes.push(note);result.material_edits.push(edit);}
    const deps=revision.relations?.materials.find(m=>m.source_ref===ref)?.dependencies??[];
    const indices=deps.map(d=>append(d));
    if(existing>=0) {
      const prior=result.material_edits[existing];
      if(indices.some(i=>!prior.dependencies.includes(i)) || (root && prior.dependencies.length!==indices.length))throw Error('historical_selection_conflict');
      const from=prior.historical??base.relations?.materials.find(m=>m.source_ref===ref)?.from;
      if(root && (revision.work_id!==base.work_id || prior.mode==='required' || !sameOccurrence(from,edit.historical)))
        result.material_edits[existing]={...edit,dependencies:indices};
    } else edit.dependencies=indices;
    return index;
  }
  append(sourceRef,true,interpretation!==undefined);
  if(result.notes.length>8)throw Error('whole_note_limit');
  return result;
}
