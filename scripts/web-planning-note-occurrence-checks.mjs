import assert from 'node:assert/strict';
import { headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { planningDraft, selectHistoricalNote } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { predecessorCode } from './web-planning-branch-checks.mjs';

// Mint the outstanding tickets with the Worker that could actually accept the
// incomplete graph, then exercise preview, persistence and replay on the upgrade.
export async function checkIncomingOccurrences({start,client,passed}) {
  const server=await start('incoming-occurrences'),current=server.code;
  await server.setOptions({script:await predecessorCode('ddc53e87a4c0dfa5dceb9d343376e15be321d23c')});
  let c=await client(server);
  const ok=async req=>{const r=await req;assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  const refused=async(req,status,code)=>{const r=await req;assert.equal(r.data.error,code);assert.equal(r.status,status);};
  const post=(r,op='',body)=>c.request('/api/work/'+r.work_id+(op?'/'+op:''),body);
  const note=text=>({text,source:'Bindery',label:'Next check',provenance:'user_declaration',observed_at:null});
  const X=note('Release this edition after proofing.'),Y=note('Use the numbered proof.'),Z=note('The proof needs a signed correction.');
  const draft=(goal,notes=[],edges=notes.map(()=>[]))=>({definition:{goal,success_criteria:['Keep the agreed conditions'],non_goals:[]},notes,
    material_edits:edges.map(dependencies=>({adapts:null,dependencies})),files:[]});
  const newFile=(name,body)=>({name,role:'source',data:Buffer.from(body).toString('base64')});
  const create=async d=>{const t=await ok(c.request('/api/drafts',d));return (await ok(post(t,'save',{...d,ticket:t.ticket}))).saved;};
  const ref=(r,n)=>r.sources.find(s=>s.bounded_summary===n.text).source_ref;
  const occurrence=(r,n)=>({...reference(r),source_ref:ref(r,n)});
  const mat=(r,n)=>r.relations.materials.find(m=>m.source_ref===ref(r,n));
  const pick=(base,source,n=X,d=planningDraft(base))=>selectHistoricalNote(d,base,source,ref(source,n));
  const prepare=async(r,d)=>({...d,ticket:(await ok(post(r,'ticket',{expected:headBinding(r),...d}))).ticket});
  const save=async(r,d)=>(await ok(post(r,'save',await prepare(r,d)))).saved;
  const reopen=async r=>(await ok(post(r))).saved;
  const originalInput=d=>({...d,material_edits:d.material_edits.map(m=>m.mode==='required'?{...m,mode:'reuse'}:m)});
  const operation=p=>({ticket:p.ticket,intent:p.intent});
  const A=await create(draft('Bindery instructions',[X,Y,Z],[[1],[2],[]])),cases=[];
  for(const files of [false,true]){
    const initial=draft('Plan a distribution');if(files)initial.files.push(newFile('schedule.txt','Existing schedule'));
    const base=await create(initial),fork=await ok(post(base,'branch-preview',{expected:headBinding(base),intent:{reason:'Review another edition'}}));
    const branchBase=(await ok(post(fork,'relation-save',operation(fork)))).saved;
    const input=originalInput(pick(branchBase,A));if(files)input.files.push(newFile('change.txt','Incoming new insert'));
    const branch=await save(branchBase,input),weaker=draft('Plan a distribution',files?[Y,Z]:[Y]);weaker.files=base.files??[];
    const target=await save(base,weaker);
    const intent=chosen=>({source:reference(branch),dispositions:branch.sources.map(s=>({source_ref:s.source_ref,
      disposition:chosen.includes(s.source_ref)?'incorporated':'not_selected',rationale:''})),rationale:'Choose the edition instructions',next_question:'',
      target_selection:target.sources.map(s=>s.source_ref),...(files?{file_selection:{target:target.files,source:branch.files.filter(f=>f.name==='change.txt')}}:{})});
    const partial=intent([ref(branch,X)]),complete=intent([X,Y,Z].map(n=>ref(branch,n)));
    const old=await ok(post(target,'incorporation-preview',{expected:headBinding(target),intent:partial}));
    cases.push({files,target,branch,partial,complete,old:operation(old)});
  }
  // Preserve the earlier Worker's actual mismatched commit as historical data.
  const C=await create(draft('Independent second notebook',[X,Y,Z],[[1],[2],[]]));
  const b0=await create(draft('Legacy handover')),b1=await save(b0,originalInput(pick(b0,C)));
  const wrong=originalInput(pick(b1,A));wrong.definition.non_goals=['Keep proof copies'];
  const priorTicket=await prepare(b1,wrong),oldSaved=(await ok(post(b1,'save',priorTicket))).saved;
  assert.deepEqual(mat(oldSaved,X).from,occurrence(C,X));
  const oldNoop=await prepare(oldSaved,originalInput(pick(oldSaved,A)));
  await server.setOptions({script:current});c=await client(server);
  const snapshot=async target=>({export:await ok(post(target,'export')),rows:(await server.db.prepare('SELECT revision,fingerprint FROM web_planning_revision WHERE work_id=? ORDER BY revision').bind(target.work_id).all()).results,
    files:(await server.db.prepare('SELECT digest,bytes FROM web_planning_file WHERE work_id=? ORDER BY digest').bind(target.work_id).all()).results});
  for(const {files,target,branch,partial,complete,old} of cases){
    const before=await snapshot(target);
    await refused(post(target,'incorporation-preview',{expected:headBinding(target),intent:partial}),422,'required_material_missing');
    await refused(post(target,'relation-save',old),422,'required_material_missing');
    assert.equal((await ok(post(target,'relation-resolve',old))).outcome,'unknown');assert.deepEqual(await snapshot(target),before);
    const good=await ok(post(target,'incorporation-preview',{expected:headBinding(target),intent:complete}));
    const result=(await ok(post(target,'relation-save',operation(good)))).saved,again=await reopen(target);
    assert.deepEqual(again,result);assert.equal(again.revision,target.revision+1);
    assert.deepEqual(mat(again,X).from,occurrence(branch,X));assert.deepEqual(mat(again,X).dependencies,[ref(again,Y)]);assert.deepEqual(mat(again,Y).dependencies,[ref(again,Z)]);
    if(files)assert.deepEqual(again.files.map(f=>f.name).sort(),['change.txt','schedule.txt']);
    // Now Y already carries its edge to Z. Choosing just X can share that context.
    const shared={...partial,target_selection:again.sources.map(s=>s.source_ref),...(files?{file_selection:{target:again.files,source:[]}}:{})};
    const compatible=await ok(post(again,'incorporation-preview',{expected:headBinding(again),intent:shared}));
    const continued=(await ok(post(again,'relation-save',operation(compatible)))).saved;
    assert.deepEqual(await reopen(again),continued);assert.deepEqual(mat(continued,Y),mat(again,Y));assert.deepEqual(mat(continued,X).dependencies,[ref(again,Y)]);
  }
  passed('incoming branch condition closure: note-only and file selections refuse preview and old ticket before any row or file; full choices reopen with both edges');
  const beforeLegacy=await snapshot(oldSaved);
  for(const op of ['save','resolve'])await refused(post(oldSaved,op,priorTicket),409,'historical_selection_conflict');
  await refused(post(oldSaved,'resolve',oldNoop),409,'historical_selection_conflict');assert.deepEqual(await snapshot(oldSaved),beforeLegacy);
  const own=await create(draft('Written locally',[X,Y,Z],[[1],[2],[]]));
  const authored=await save(own,pick(own,A));assert.deepEqual(mat(authored,X).from,occurrence(A,X));assert.equal(mat(authored,Y).from,null);
  const reselect=planningDraft(oldSaved),index=reselect.notes.findIndex(n=>n.text===X.text);
  reselect.notes.splice(index,1);reselect.material_edits.splice(index,1);
  for(const m of reselect.material_edits)m.dependencies=m.dependencies.map(i=>i>index?i-1:i);
  reselect.definition.non_goals=['Keep the revision marks'];const input=pick(oldSaved,A,X,reselect),bound=await prepare(oldSaved,input);
  const next=(await ok(post(oldSaved,'save',bound))).saved;assert.deepEqual((await reopen(next)),next);
  assert.deepEqual(mat(next,X).from,occurrence(A,X));assert.deepEqual(mat(next,Y).from,occurrence(C,Y));assert.deepEqual(next.definition.non_goals,input.definition.non_goals);
  const same=await prepare(next,pick(next,A));assert.equal((await ok(post(next,'save',same))).noop,true);
  const fresh=await create(draft('Independent commission')),choice=pick(fresh,A);choice.definition.non_goals=['Keep the budget line'];
  const stale=await prepare(fresh,choice),other=await save(fresh,pick(fresh,C));
  await refused(post(fresh,'save',stale),409,'conflict');assert.deepEqual(await reopen(fresh),other);
  const rebased=await prepare(other,choice),result=(await ok(post(other,'save',rebased))).saved;
  assert.deepEqual(await reopen(other),result);assert.deepEqual(mat(result,X).from,occurrence(A,X));assert.deepEqual(mat(result,Y).from,occurrence(C,Y));assert.deepEqual(result.definition.non_goals,choice.definition.non_goals);
  await ok(post(A,'erase',{expected:headBinding(A),confirm:'erase-whole-work'}));
  assert.equal((await ok(post(next,'resolve',same))).noop,true);
  for(const [r,t] of [[next,bound],[result,rebased]])for(const op of ['save','resolve'])assert.deepEqual((await ok(post(r,op,t))).saved,r);
  for(const {target} of cases){const saved=await reopen(target);assert.deepEqual(mat(saved,Y).dependencies,[ref(saved,Z)]);assert.deepEqual((await ok(post(target,'export'))).revisions.at(-1),saved);}
  passed('exact occurrence: authored replacement, remove/reselect, reviewed stale rebase, shared prerequisites, same occurrence no-op and replay after erasure; legacy mismatches explicitly refused');
}
