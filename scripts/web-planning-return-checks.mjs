import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { planningDraft,prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { hash, canonical, reference, headBinding } from '../apps/web_planning/src/contract.ts';

export async function checkReturnContinuation({start,client,newWork,save,passed}){
  const db=await start('return-continuation'),c=await client(db);
  const req=async(path,body)=>{const r=await c.request(path,body);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  const prep=(selection,judgment,dest)=>prepareReturnDraft(req,selection,judgment,dest);
  const route=(r,k)=>'/api/work/'+r.work_id+'/'+k;
  const send=(p,k='save',body=p.body)=>c.request(route(p,k),body);
  const ok=async(p,k='save')=>{const r=await send(p,k);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  const def=goal=>({goal,success_criteria:['Keep exact material'],non_goals:[]});
  const src=(await save(c,await newWork(c,def('Return source'),[]))).data.saved;
  const tw=await newWork(c,def('Retain existing notes and files'));tw.input.files=[{name:'unrelated.txt',role:'source',data:Buffer.from('keep me').toString('base64')}];
  const dst=(await save(c,tw)).data.saved;
  const digest=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
  const file=(name,data)=>({name,media_type:'text/plain',bytes:data.length,digest:digest(data),data:data.toString('base64')});
  const same=file('shared.txt',Buffer.from('Original\r\nkeep these exact bytes\r\n')),big=file('large.txt',Buffer.alloc(262145,65));
  let head=headBinding(src);
  async function event(kind,basis,files){const r=await req(route(src,'exchanges/save'),{kind,basis,expected:head,request_key:randomUUID(),message:kind+' selected files',next_action:kind==='return'?'Compare with current work':'',files});head=r.head;return r.item;}
  const a=await event('request',null,[same]),b=await event('request',null,[same]);
  const first=await event('return',a.ref,[same,big]),second=await event('return',b.ref,[same]);
  const inspect=(r,i=0,after=null)=>req(route(src,'inspect-return'),{returned:r.ref,index:i,after});
  const one=await inspect(first),two=await inspect(second),oversize=await inspect(first,1);
  assert.deepEqual(one.request.ref,a.ref);assert.deepEqual(one.request_basis.ref,reference(src));assert.equal(one.current.ref.revision,5);
  assert.deepEqual(two.request.ref,b.ref);assert.equal(one.decisions.length,0);assert.deepEqual(one.selection.original,two.selection.original);
  assert.equal((await c.request(route(src,'inspect-return'),{returned:first.ref,index:0,after:null,project_id:randomUUID()})).status,403);
  assert.equal((await c.request(route(src,'inspect-return'),{returned:first.ref,index:0,after:null},{cookie:''})).status,403);
  const plan=(decision,more={})=>({decision,rationale:'Compared with current conditions',limits:'One selected file only',next_action:'Prepare the marked aisle',...more});
  const keep=plan('unchanged',{name:'kept.txt'}),adapt=plan('adapted',{name:'authored.txt',text:'Adapt the count to 22 with a spare kit.'});
  await assert.rejects(prep(oversize.selection,keep,{saved:dst}),/return_exceeds_selected_file_limit/);
  assert.equal((await c.request(first.files[1].download)).data.length,big.bytes);
  await assert.rejects(prep(one.selection,{...adapt,text:'Original\r\nkeep these exact bytes\r\n'},{saved:dst}),/return_adaptation_unchanged/);
  await assert.rejects(prep(one.selection,plan('deferred'),{goal:'No phantom work'}),/record_nonuse_on_original/);
  const notCreated=await prep(one.selection,adapt,{goal:'Uncommitted follow-on'}),staleTarget=await prep(two.selection,adapt,{saved:dst});
  assert.equal((await ok(notCreated,'resolve')).outcome,'unknown');
  const p=await prep(one.selection,keep,{saved:dst});
  const altered=structuredClone(p.body);altered.return_choice.selection=two.selection;
  assert.equal((await send(p,'save',altered)).data.error,'altered_replay');
  const saved=(await ok(p)).saved;assert.deepEqual(saved.sources,dst.sources);assert.deepEqual(saved.files[0],dst.files[0]);
  assert.equal(saved.files[1].digest,same.digest);assert.deepEqual(saved.return_use.returned,first.ref);
  assert.deepEqual(saved.return_use.original,one.selection.original);
  assert.equal((await send(staleTarget)).status,409);
  assert.equal((await inspect(first)).decisions[0].destination.fingerprint,saved.fingerprint);assert.equal((await inspect(second)).decisions.length,0);
  assert.equal((await c.request((await inspect(first)).decisions[0].download)).data,Buffer.from(same.data,'base64').toString());
  await assert.rejects(prep(one.selection,keep,{saved}),/return_output_name_in_use/);
  // Later ordinary edits may remove the output; the recorded decision still
  // opens its own original saved bytes, never the latest same-name file.
  const normal=planningDraft(saved);normal.files=normal.files.filter(f=>f.name!=='kept.txt');
  normal.files.push({name:'kept.txt',role:'other',data:Buffer.from('different later bytes').toString('base64')});
  const t=await req(route(saved,'ticket'),{...normal,expected:headBinding(saved)});
  const changed=(await req(route(saved,'save'),{...normal,ticket:t.ticket})).saved;
  assert.notEqual(changed.files.at(-1).digest,same.digest);assert.equal(changed.return_use,undefined);
  const historical=(await req(route(saved,'exchanges'))).decisions[0];assert.equal(historical.destination.fingerprint,saved.fingerprint);
  assert.equal((await c.request(historical.download)).data,Buffer.from(same.data,'base64').toString());
  const self=(await req('/api/work/'+src.work_id)).saved;
  const no=await prep(two.selection,plan('deferred'),{saved:self});const noResult=(await ok(no)).saved;
  assert.equal(noResult.return_use.output,null);assert.deepEqual(noResult.files,self.files);assert.deepEqual(noResult.sources,self.sources);
  assert.equal((await send(notCreated)).data.error,'return_conditions_changed');assert.equal((await ok(notCreated,'resolve')).outcome,'unknown');
  assert.equal((await c.request('/api/work/'+notCreated.work_id)).status,404);
  assert.equal((await inspect(first)).decisions.length,1);assert.equal((await inspect(second)).decisions[0].decision,'deferred');
  const fresh=await inspect(second),newWorkPlan=await prep(fresh.selection,adapt,{goal:'Distinct saved preparation'});
  const created=(await ok(newWorkPlan)).saved;
  assert.equal(created.revision,1);assert.notEqual(created.work_id,src.work_id);assert.equal(created.files[0].digest,digest(Buffer.from(adapt.text)));
  const again=await ok(newWorkPlan);assert.equal(again.saved.fingerprint,created.fingerprint);
  assert.deepEqual((await inspect(second)).decisions.map(d=>d.decision).sort(),['adapted','deferred']);
  const planRows=(await db.db.prepare("EXPLAIN QUERY PLAN SELECT work_id,revision FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND (envelope ->> '$.return_use.returned.fingerprint')=? AND (envelope ->> '$.return_use.index')=? AND (work_id,revision)>(?,?) ORDER BY work_id,revision LIMIT 11").bind(src.workspace_id,src.project_id,first.ref.fingerprint,0,'',0).all()).results;
  assert(planRows.some(row=>row.detail.includes('web_planning_return_destination')));
  const exported=await req(route(created,'export'));assert.equal(exported.format,'web_planning_export.v0.7');
  assert.equal(exported.files[0].data,Buffer.from(adapt.text).toString('base64'));
  assert((await c.request(route(created,'reading-export'))).data.includes(second.ref.fingerprint));
  const original=await req(route(src,'export'));assert(original.files.some(f=>f.data===same.data));assert.equal(original.format,'web_planning_export.v0.7');
  await req(route(src,'erase'),{expected:headBinding(noResult),confirm:'erase-whole-work'});
  assert.equal((await c.request(route(src,'inspect-return'),{returned:first.ref,index:0,after:null})).status,410);
  for(const t of [p,newWorkPlan]){
    const r=await ok(t,'resolve');assert.equal(r.outcome,'saved');assert.equal((await ok(t)).saved.fingerprint,r.saved.fingerprint);
    const marker=await send(t,'resolve',{ticket:t.body.ticket});assert.equal(marker.data.saved.fingerprint,r.saved.fingerprint);
    assert.equal((await req(route(t,'history'))).revisions.filter(d=>d.return_use).length,1);
  }
  const unauthorized=await c.request(route(saved,'resolve'),{ticket:p.body.ticket},{'x-csrf-token':'invalid'});assert.equal(unauthorized.status,403);
  const rc=await client(await start('restore-return-continuation'));
  const restore=value=>rc.request('/api/reconstruct-exchange',{export:value,confirm:'reconstruct-empty-store'});
  const copy=(await restore(exported)).data.saved;assert.equal(copy.fingerprint,created.fingerprint);
  assert.equal((await rc.request(route(copy,'exchanges'))).data.decisions[0].returned.fingerprint,second.ref.fingerprint);
  assert.equal((await rc.request((await rc.request(route(copy,'exchanges'))).data.decisions[0].download)).data,adapt.text);
  assert.equal((await rc.request(route(src,'inspect-return'),{returned:second.ref,index:0,after:null})).status,409);
  const forged=structuredClone(exported);forged.revisions[0].return_use.output.digest=same.digest;
  const {fingerprint,...content}=forged;forged.fingerprint=hash(canonical(content));assert.notEqual((await restore(forged)).status,200);
  assert.equal((await restore(original)).status,503,'nonempty replacements stay closed');
  const sc=await client(await start('restore-return-source'));
  const restoreSource=await sc.request('/api/reconstruct-exchange',{export:original,confirm:'reconstruct-empty-store'});assert.equal(restoreSource.status,200,JSON.stringify(restoreSource.data).slice(0,130));
  const restoredView=(await sc.request(route(src,'inspect-return'),{returned:second.ref,index:0,after:null})).data;
  assert.deepEqual(restoredView.decisions.map(r=>r.destination.fingerprint),[noResult.fingerprint]);
  const history=await req(route(created,'history'));assert.equal(history.revisions.length,1);
  console.log(JSON.stringify({returned_file_controls:{competing_returns:[first.ref,second.ref],same_digest:same.digest,retained:saved.return_use,adapted:created.return_use,deferred:noResult.return_use,
    replay_after_erasure:true,unknown_work_not_created:true,restored:reference(copy),reverse_query_plan:planRows}}));
  passed('returned material: exact competing occurrences, current/follow-on bytes, applicability, stale/uncertain saves, scope, quotas and independent restore');
}
