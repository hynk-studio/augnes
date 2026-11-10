import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonical, hash, headBinding, makeRevision, reference } from '../apps/web_planning/src/contract.ts';
import { digestBytes } from '../apps/web_planning/src/files.ts';
import { SCENE_FILE } from '../apps/web_planning/src/scene-contract.ts';

export const retainedReason='열어 읽은 편지의 재해석을 이 갈래에서도 유지한다.';
export const additionalSetting={kind:'fact',subject:'정원',text:'정원의 등불은 푸른 유리로 덮여 있다.',event_time:1,reveal_order:1};
export const additionalDraft='푸른 유리의 등불 아래에 작은 돌이 놓여 있었다.\n\n편지의 문장은 지우지 않았다.';

// Reuse the pair produced by the C journey through supported reconstruction.
// All positive history below is made by real authenticated product writers.
export async function checkRetainedRevisions({start,client,bundle,passed}){
 const server=await start('retained-revision'),c=await client(server);
 const ok=async p=>{const r=await p;assert.equal(r.status,200,canonical(r.data));return r.data;};
 await ok(c.request('/api/reconstruct-files',{export:bundle,confirm:'reconstruct-empty-store'}));
 let [primary,alternate]=bundle.works.map(w=>w.revisions.at(-1));
 const route=(r,action)=>`/api/work/${r.work_id}/${action}`;
 const read=async r=>(await ok(c.request(`/api/work/${r.work_id}`))).saved;
 const book=async r=>JSON.parse(await ok(c.request(`/api/work/${r.work_id}/files/${r.revision}/${r.fingerprint.slice(7)}/${r.files.findIndex(f=>f.name===SCENE_FILE)}`)));
 const exportPair=async()=> (await ok(c.request(route(primary,'direction-export'),{expected:headBinding(primary),source:reference(alternate)}))).recovery;
 const compare=async()=>ok(c.request(route(primary,'compare'),{expected:headBinding(primary),source:reference(alternate)}));
 const preview=async(dispositions,reason=retainedReason)=>c.request(route(primary,'incorporation-preview'),{expected:headBinding(primary),intent:{source:reference(alternate),selection:{dispositions,reason}}});
 const confirm=async p=>ok(c.request(route(primary,'relation-save'),{ticket:p.ticket,intent:p.intent}));
 async function ordinary(r,changes){const draft={definition:r.definition,notes:[],files:r.files,...changes},t=await ok(c.request(route(r,'ticket'),{expected:headBinding(r),...draft}));return (await ok(c.request(route(r,'save'),{ticket:t.ticket,...draft}))).saved;}
 async function review(r,s,choices){const p=await ok(c.request(route(r,'scene-review-preview'),{expected:headBinding(r),intent:{scene_id:s.id,dispositions:choices,reason:retainedReason}}));return (await ok(c.request(route(r,'scene-review-save'),{ticket:p.ticket,intent:p.intent}))).saved;}
 const parameters={title:'유지한 재해석 뒤',viewpoint:'하린',event_time:3,reveal_order:2,source_names:['manuscript.txt']};
 const context=async(r,reader=c)=>ok(reader.request(route(r,'scene-context'),{expected:headBinding(r),intent:parameters}));
 const choices=['adopted','adopted','undecided'];
 await compare();const initial=await ok(preview(choices));assert.equal(initial.noop,false);
 primary=(await confirm(initial)).saved;const adopted=primary,firstBook=await book(primary),firstRecord=firstBook.adoptions.at(-1);
 assert.deepEqual((await confirm(initial)).saved,primary); // Original-ticket replay is separate.
 const before=await exportPair();await compare();
 const unchanged=await preview(choices);
 console.log(JSON.stringify({retained_revision_unchanged_preview:{status:unchanged.status,error:unchanged.data.error??null}}));
 if(unchanged.status===200){
  assert.notEqual(unchanged.data.ticket,initial.ticket);assert.equal(unchanged.data.noop,true);
  const result=await confirm(unchanged.data);assert.equal(result.noop,true);assert.deepEqual(result.saved,adopted);
  assert.deepEqual(await exportPair(),before); // Exact chain, fingerprints, file bodies and attribution.
  assert.equal((await ok(c.request(route(primary,'relation-resolve'),{ticket:unchanged.data.ticket,intent:unchanged.data.intent}))).noop,true);
 }
 // A changed reason/selection is a new recorded decision, not widened no-op equivalence.
 if(unchanged.status===200){
  assert.equal((await ok(preview(choices,retainedReason+' 理由を補足'))).noop,false);
  assert.equal((await ok(preview(['undecided','adopted','undecided']))).noop,false);
  alternate=await ordinary(alternate,{definition:{...alternate.definition,goal:alternate.definition.goal+' — 새 원본 버전'}});
  assert.equal((await ok(preview(choices))).noop,false);
 }
 const newScene={id:randomUUID(),...parameters,draft:additionalDraft,proposals:[additionalSetting]};
 alternate=await ordinary(alternate,{scene:newScene});alternate=await review(alternate,newScene,['adopted']);
 const expanded=[...choices,'adopted'];await compare();const addition=await preview(expanded);
 console.log(JSON.stringify({retained_revision_addition_preview:{status:addition.status,error:addition.data.error??null}}));
 // Collect both reported failures before the assertion, so the unchanged source
 // demonstrates A and B independently instead of stopping after the first refusal.
 assert.deepEqual([unchanged.status,addition.status],[200,200],'fresh unchanged and retained-plus-addition previews must both succeed');
 assert.equal(addition.data.noop,false);
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:addition.data.ticket,intent:{...addition.data.intent,selection:{...addition.data.intent.selection,reason:'改変'}}})).data.error,'altered_replay');
 const staleTarget=addition.data;primary=await ordinary(primary,{definition:{...primary.definition,goal:primary.definition.goal+' — 유지할 대상 수정'}});
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:staleTarget.ticket,intent:staleTarget.intent})).data.error,'refresh_required');
 const staleSource=await ok(preview(expanded));alternate=await ordinary(alternate,{definition:{...alternate.definition,goal:alternate.definition.goal+' — 유지할 원본 수정'}});
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:staleSource.ticket,intent:staleSource.intent})).data.error,'refresh_required');
 const current=await ok(preview(expanded)),beforeAddition=primary;
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:current.ticket,intent:current.intent,project_id:randomUUID()})).status,403);
 const beforeFault=await exportPair();await server.db.prepare("CREATE TRIGGER retained_fault BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'retained rollback'); END").run();
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:current.ticket,intent:current.intent})).status,503);assert.deepEqual(await exportPair(),beforeFault);
 await server.db.prepare('DROP TRIGGER retained_fault').run();primary=(await confirm(current)).saved;
 assert.equal(primary.revision,beforeAddition.revision+1);assert.deepEqual(primary.definition,beforeAddition.definition);
 const afterBook=await book(primary);assert.deepEqual(afterBook.adoptions.slice(0,firstBook.adoptions.length),firstBook.adoptions);
 assert.deepEqual(afterBook.adoptions.at(-1).units[0],firstRecord.units[0]);assert.deepEqual(afterBook.scenes,firstBook.scenes);
 assert.equal((await book(alternate)).scenes.at(-1).draft,additionalDraft);
 const entry=(await context(primary)).entries;assert(entry.some(e=>e.text===firstRecord.units[0].proposal.text&&e.effective==='current'&&e.disposition==='adopted'));
 assert(entry.some(e=>e.text===additionalSetting.text&&e.effective==='current'&&e.disposition==='adopted'));
 for(const ref of firstRecord.units[0].proposal.revises)assert(entry.some(e=>canonical(e.identity)===canonical(ref)&&e.effective==='superseded'));
 const valid=await exportPair();const repeated=await ok(preview(expanded));assert.equal(repeated.noop,true);assert.equal((await confirm(repeated)).noop,true);assert.deepEqual(await exportPair(),valid);
 passed('retained setting revision: NEW review ticket is a byte-identical no-op; retained retcon plus independent addition appends once; original attribution, unrelated edits, stale/altered/foreign and atomic guards remain');

 const dest=await start('retained-revision-recovery'),dc=await client(dest);
 const empty=async()=>{for(const t of ['web_planning_revision','web_planning_file'])assert.equal((await dest.db.prepare(`SELECT count(*) n FROM ${t}`).first()).n,0);};
 // Rehash a crafted LAST transition so structural hashes alone cannot mask a
 // different retained proposal, source file, original review, title or identity.
 function tamper(change){const damaged=structuredClone(valid),w=damaged.works[0],r=w.revisions.at(-1),f=r.files.find(f=>f.name===SCENE_FILE),b=w.files.find(b=>b.digest===f.digest),value=JSON.parse(Buffer.from(b.data,'base64'));
  change(value.adoptions.at(-1).units[0]);const bytes=Buffer.from(canonical(value));Object.assign(b,{digest:digestBytes(bytes),bytes:bytes.length,data:bytes.toString('base64')});Object.assign(f,{digest:b.digest,bytes:b.bytes});
  w.revisions[w.revisions.length-1]=makeRevision(r,r.work_id,headBinding(w.revisions.at(-2)),r.request_key,{definition:r.definition,sources:r.sources,relations:r.relations,files:r.files},r.recorded_at);w.files.sort((a,b)=>a.digest.localeCompare(b.digest));
  for(const v of [w,damaged]){const {fingerprint,...rest}=v;v.fingerprint=hash(canonical(rest));}return damaged;
 }
 for(const change of [u=>u.proposal.text+='偽造',u=>u.review.reason+='偽造',u=>u.review.author_ref='foreign-author',u=>u.title+='偽造',u=>u.source_files[0].name='missing.txt',u=>u.ref.work_id=randomUUID()]){
  const refused=await dc.request('/api/reconstruct-files',{export:tamper(change),confirm:'reconstruct-empty-store'});assert.equal(refused.status,409);await empty();
 }
 await ok(dc.request('/api/reconstruct-files',{export:valid,confirm:'reconstruct-empty-store'}));
 for(const r of [primary,alternate]){assert.deepEqual((await ok(dc.request(`/api/work/${r.work_id}`))).saved,r);assert.deepEqual(await context(r,dc),await context(r));}
 assert.deepEqual((await ok(dc.request(route(primary,'direction-export'),{expected:headBinding(primary),source:reference(alternate)}))).recovery,valid);
 await ok(dc.request(route(primary,'compare'),{expected:headBinding(primary),source:reference(alternate)}));
 const recoveredPreview=await ok(dc.request(route(primary,'incorporation-preview'),{expected:headBinding(primary),intent:{source:reference(alternate),selection:{dispositions:expanded,reason:retainedReason}}}));
 assert.equal(recoveredPreview.noop,true);assert.equal((await ok(dc.request(route(primary,'relation-save'),{ticket:recoveredPreview.ticket,intent:recoveredPreview.intent}))).noop,true);
 console.log(JSON.stringify({retained_revision_recovery:{primary,alternate,initial_retcon:firstRecord,final_selection:afterBook.adoptions.at(-1),recovery:valid,contexts:[await context(primary),await context(alternate)]}}));
 passed('retained setting revision: two-scope export/reconstruct/readback preserves all bytes and attribution; recovered NEW review remains no-op; rehashed content/provenance forgeries leave empty destination');

 // New local interpretations still require a current reviewed basis and explicit
 // prerequisites. A later adopted revision must not reactivate the old retcon.
 const invalid={id:randomUUID(),...parameters,draft:'保持する未採用草稿',proposals:[{...firstRecord.units[0].proposal,text:'古い基礎の競合する再解釈'}]};
 alternate=await ordinary(alternate,{scene:invalid});
 assert.equal((await c.request(route(alternate,'scene-review-preview'),{expected:headBinding(alternate),intent:{scene_id:invalid.id,dispositions:['adopted'],reason:retainedReason}})).data.error,'scene_revision_basis');
 invalid.proposals=[{...firstRecord.units[0].proposal,event_time:3,revises:[firstRecord.units[0].ref]}];alternate=await ordinary(alternate,{scene:invalid});
 assert.equal((await c.request(route(alternate,'scene-review-preview'),{expected:headBinding(alternate),intent:{scene_id:invalid.id,dispositions:['adopted'],reason:retainedReason}})).data.error,'scene_revision_basis');
 invalid.proposals=[{...additionalSetting,revises:[],requires:[{work_id:alternate.work_id,scene_id:randomUUID(),proposal:0}]}];alternate=await ordinary(alternate,{scene:invalid});
 assert.equal((await c.request(route(alternate,'scene-review-preview'),{expected:headBinding(alternate),intent:{scene_id:invalid.id,dispositions:['adopted'],reason:retainedReason}})).data.error,'scene_prerequisite_missing');
 assert.equal((await book(alternate)).scenes.at(-1).draft,invalid.draft);
 const superseding={id:randomUUID(),...parameters,draft:'同じ位置の別の解釈。',proposals:[{...firstRecord.units[0].proposal,text:'이 갈래의 재해석을 다시 고친다.',revises:[firstRecord.units[0].ref],requires:[]}]};
 primary=await ordinary(primary,{scene:superseding});primary=await review(primary,superseding,['adopted']);
 assert.equal((await preview(expanded)).data.error,'scene_revision_basis');assert.deepEqual(await read(primary),primary);
 assert.equal((await ok(preview(['undecided','adopted','undecided','adopted']))).noop,false);
 passed('retained setting revision: invalid new reinterpretation, missing prerequisite and superseded retcon reactivation refuse; drafts and historical adoption persist');
}
