import assert from 'node:assert/strict';
import { canonical, headBinding, reference, selectedWorkSourceInput } from '../apps/web_planning/src/contract.ts';
import { digestBytes, validateFileExport } from '../apps/web_planning/src/files.ts';
import { saveOperation } from '../apps/web_planning/src/relations.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { predecessorCode } from './web-planning-branch-checks.mjs';

const base='66ab79ca8106fb9037300a3aada9f915e2c5c5f9';
const upload=(name,text,role='source')=>({name,role,data:Buffer.from(text).toString('base64')});
const route=(r,action='')=>`/api/work/${r.work_id}${action?'/'+action:''}`;
const ok=async promise=>{const r=await promise;assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
export async function checkOrdinaryFiles({start,client,newWork,save,passed,open}) {
 const oldCode=await predecessorCode(base);
 let server=await start('ordinary-file-upgrade',{code:oldCode}),c=await client(server);
 const create=async(files,notes=[])=>{const w=await newWork(c,{goal:'Ordinary file work',success_criteria:['Retain exact requirements and qualified results'],non_goals:[]},notes);w.input.files=files;return (await ok(save(c,w))).saved;};
 const write=async(r,files,notes=r.sources.map(selectedWorkSourceInput))=>{const content={definition:r.definition,notes,files};const t=await ok(c.request(route(r,'ticket'),{expected:headBinding(r),...content}));return (await ok(save(c,{id:r.work_id,input:{...content,ticket:t.ticket}}))).saved;};
 const branch=async r=>ok(c.request(route(r,'branch-preview'),{expected:headBinding(r),intent:{reason:'Explore a direct ordinary alternative with exact files'}}));
 const commit=p=>c.request(route({work_id:p.work_id},'relation-save'),{ticket:p.ticket,intent:p.intent});
 const resolve=p=>c.request(route({work_id:p.work_id},'relation-resolve'),{ticket:p.ticket,intent:p.intent});
 const read=async r=>(await ok(c.request(route(r)))).saved;
 const exportOf=r=>ok(c.request(route(r,'export')));
 const erase=r=>ok(c.request(route(r,'erase'),{expected:headBinding(r),confirm:'erase-whole-work'}));
 const intent=(target,source,kept=target.files??[],selected=[])=>({source:reference(source),dispositions:source.sources.map(s=>({source_ref:s.source_ref,disposition:'not_selected',rationale:''})),target_selection:target.sources.map(s=>s.source_ref),file_selection:{target:kept,source:selected},rationale:'Keep requirements; use only the deliberately selected whole files.',next_question:'Synthetic checks do not establish real-world usefulness.'});
 const preview=(t,b,i=intent(t,b))=>c.request(route(t,'incorporation-preview'),{expected:headBinding(t),intent:i});
 const rows=async()=>Object.fromEntries(await Promise.all(['web_planning_revision','web_planning_file'].map(async t=>[t,(await server.db.prepare(`SELECT count(*) n FROM ${t}`).first()).n])));
 let target=await create([upload('requirements.txt','Keep units and uncertainty.\n'),upload('results.txt','original\n','results'),upload('same-bytes.txt','original\n','report'),upload('obsolete.txt','earlier unselected body')]);
 const first=target;target=await write(target,[target.files[0],upload('results.txt','baseline\n','results'),target.files[2]]);
 const legacy=await exportOf(target),legacyRows=(await server.db.prepare('SELECT envelope FROM web_planning_revision ORDER BY revision').all()).results;
 assert.equal((await c.request(route(target,'branch-preview'),{expected:headBinding(target),intent:{reason:'Ordinary files on accepted main'}})).data.error,'file_branch_selection_unsupported');
 passed('ordinary files: pinned accepted-main writer reproduces the intentional file-branch refusal with zero notes');
 const options={port:Number(new URL(server.origin).port),bindings:server.env};
 async function reopen(code){await server.close();open.splice(open.indexOf(server),1);server=await start('ordinary-file-upgrade',{...options,...(code?{code}:{})});c=await client(server);}
 await reopen();assert.deepEqual(await exportOf(target),legacy);assert.deepEqual((await server.db.prepare('SELECT envelope FROM web_planning_revision ORDER BY revision').all()).results,legacyRows);
 const p=await branch(target);let alternate=(await ok(commit(p))).saved;
 assert.equal(alternate.format,'web_planning_revision.v0.4');assert.equal(alternate.sources.length,0);assert.deepEqual(alternate.files,target.files);
 assert.deepEqual(alternate.relations.file_materials,alternate.files.map(file=>({file,kind:'inherited',from:reference(target)})));
 const copied=await exportOf(alternate);assert.equal(copied.revisions.length,1);assert.equal(copied.files.length,3);assert.equal(legacy.files.length,4);
 // Equal bodies under distinct names/roles remain separate selections.
 const equal=await create([upload('a.txt','equal'),upload('b.txt','equal','report')]);const equalBranch=(await ok(commit(await branch(equal)))).saved;
 assert.equal(equalBranch.files.length,2);assert.equal((await exportOf(equalBranch)).files.length,1);
 const changedRole=await write(equalBranch,[equalBranch.files[0],upload('b.txt','equal','source')]);
 assert.equal((await preview(equal,changedRole,intent(equal,changedRole,equal.files,[changedRole.files[1]]))).data.error,'file_name_choice_required');
 const roleResult=(await ok(commit(await ok(preview(equal,changedRole,intent(equal,changedRole,[equal.files[0]],[changedRole.files[1]])))))).saved;
 assert.equal(roleResult.files.length,2);assert.equal(roleResult.files[1].role,'source');assert.equal((await exportOf(roleResult)).files.length,1);
 const empty=await write(changedRole,[]);assert.equal(empty.format,'web_planning_revision.v0.4');assert.deepEqual(empty.relations.file_materials,[]);assert.equal((await exportOf(empty)).format,'web_planning_export.v0.4');
 assert.equal((await c.request(route(alternate,'branch-preview'),{expected:headBinding(alternate),intent:{reason:'Nested'}})).data.error,'ordinary_direct_branch_required');
 const explanation={text:'Alternative result is synthetic; retain the requirements.',source:'Branch explanation',observed_at:null,provenance:'user_declaration',label:'Open question'};
 alternate=await write(alternate,[alternate.files[0],upload('results.txt','alternative\n','results'),alternate.files[2]], [explanation]);
 assert.equal(alternate.relations.file_materials[1].kind,'authored');assert.equal(alternate.relations.file_materials[0].kind,'inherited');
 const comparison=await ok(c.request(route(target,'compare'),{expected:headBinding(target),source:reference(alternate)}));assert.equal(comparison.direction,undefined);
 const selected=alternate.files.filter(f=>f.name==='results.txt');
 const collision=intent(target,alternate,target.files,selected),before=await rows();
 assert.equal((await preview(target,alternate,collision)).data.error,'file_name_choice_required');assert.deepEqual(await rows(),before);
 for(const field of ['name','role','bytes','digest']){
   const bad=structuredClone(collision);bad.file_selection.source[0][field]=field==='bytes'?1:field==='digest'?'sha256:'+'0'.repeat(64):field==='role'?'other':'unknown.txt';
   assert.equal((await preview(target,alternate,bad)).data.error,'invalid_file_selection');
 }
 const selection=intent(target,alternate,target.files.filter(f=>f.name!=='results.txt'),selected);selection.dispositions[0].disposition='incorporated';
 let reviewed=await ok(preview(target,alternate,selection));assert.match(reviewed.html,/No longer selected/);assert.match(reviewed.html,/alternative|Exact file selection/);
 assert.equal((await commit({...reviewed,intent:{...reviewed.intent,rationale:'Changed after preview'}})).data.error,'altered_replay');
 assert.equal((await commit({...reviewed,intent:{...reviewed.intent,file_selection:{...reviewed.intent.file_selection,source:[]}}})).data.error,'altered_replay');
 assert.equal((await c.request(route({work_id:reviewed.work_id},'relation-save'),{ticket:reviewed.ticket,intent:reviewed.intent,project_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'})).status,403);
 await server.db.prepare("CREATE TRIGGER ordinary_copy_fault BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic-copy-fault'); END").run();
 assert.equal((await commit(reviewed)).status,503);assert.deepEqual(await rows(),before);assert.equal((await ok(resolve(reviewed))).outcome,'unknown');
 await server.db.prepare('DROP TRIGGER ordinary_copy_fault').run();
 await ok(commit(reviewed));target=(await ok(resolve(reviewed))).saved;assert.equal(target.revision,3);
 assert.equal((await ok(commit(reviewed))).saved.fingerprint,target.fingerprint);assert.equal((await exportOf(target)).revisions.length,3);
 assert.equal(target.relations.file_materials.find(m=>m.file.name==='results.txt').from.fingerprint,alternate.fingerprint);
 const resultExport=await exportOf(target);assert(resultExport.files.some(f=>f.digest===first.files[1].digest));assert(resultExport.files.some(f=>f.digest===legacy.revisions[1].files[1].digest));
 assert.deepEqual((await exportOf(alternate)).revisions[0],copied.revisions[0]);
 const same=await ok(preview(target,alternate,intent(target,alternate)));target=(await ok(commit(same))).saved;
 const noUse=await ok(preview(target,alternate,intent(target,alternate)));assert.equal(noUse.noop,true);assert.equal((await ok(commit(noUse))).saved.fingerprint,target.fingerprint);
 passed('ordinary files: complete identities, zero-note branch, independent selected bodies, explicit collision/replacement, retained history and notes, foreign/altered refusal, atomic rollback and exact lost-ack/no-op recovery');
 // Both reviewed heads are gated at actual SQL admission, after all async reads.
 for(const side of ['source','target'])for(const mutation of ['write','erase']){
   let t=await create([upload('keep.txt','keep')]),b=(await ok(commit(await branch(t)))).saved;
   b=await write(b,[upload('new.txt','new')]);const rp=await ok(preview(t,b,intent(t,b,t.files,b.files))),prior=await rows();
   const victim=side==='source'?b:t;
   const DB={prepare:q=>server.db.prepare(q),batch:async statements=>{if(mutation==='erase')await erase(victim);else await write(victim,[...victim.files,upload('later.txt','later')]);return server.db.batch(statements);}};
   const access={...fixtureScope,env:server.env,DB};
   await assert.rejects(saveOperation(access,t.work_id,rp.ticket,rp.intent),e=>['refresh_required','work_erased'].includes(e.code));
   const remaining=await c.request(route(t));if(remaining.status===200)assert(!remaining.data.saved.files.some(f=>f.name==='new.txt'));
   assert.equal((await server.db.prepare('SELECT count(*) n FROM web_planning_file WHERE work_id=? AND digest=?').bind(t.work_id,b.files[0].digest).first()).n,0);
 }
 // Valid heads with corrupted or missing source bytes cannot copy a body.
 for(const side of ['source','target'])for(const corruption of ['corrupt','missing']){
   const t=await create([upload('keep.txt','keep')]);let b=(await ok(commit(await branch(t)))).saved;b=await write(b,[upload('new.txt','new')]);
   const rp=await ok(preview(t,b,intent(t,b,t.files,b.files))),victim=side==='source'?b:t,file=victim.files[0],prior=await rows();
   if(corruption==='corrupt')await server.db.prepare('UPDATE web_planning_file SET body=? WHERE work_id=? AND digest=?').bind(Buffer.alloc(file.bytes),victim.work_id,file.digest).run();
   else await server.db.prepare('DELETE FROM web_planning_file WHERE work_id=? AND digest=?').bind(victim.work_id,file.digest).run();
   const response=await commit(rp);assert(['file_content_unavailable','file_content_integrity'].includes(response.data.error));assert.equal((await rows()).web_planning_revision,prior.web_planning_revision);
   assert.equal((await server.db.prepare('SELECT count(*) n FROM web_planning_file WHERE work_id=? AND digest=?').bind(t.work_id,b.files[0].digest).first()).n,0);
 }
 passed('ordinary files: deterministic post-read source/target write and erase races refuse at the atomic admission gate; corrupt/missing either-side bodies leave no new revision or orphan');
 // Current selection limits count entries/bytes, even when body storage deduplicates.
 for(const mode of ['entries','selected-bytes','history-count','history-bytes']){
   let t=await create(mode==='entries'?Array.from({length:8},(_,i)=>upload('f'+i,'same')):mode==='selected-bytes'?[upload('a',Buffer.alloc(262144,1)),upload('b',Buffer.alloc(262144,1))]:[upload('a',mode==='history-bytes'?Buffer.alloc(262144,1):'0')]);
   let b=(await ok(commit(await branch(t)))).saved;
   if(mode==='history-count')for(let i=1;i<16;i++)t=await write(t,[upload('a',String(i))]);
   if(mode==='history-bytes')for(let i=2;i<=4;i++)t=await write(t,[upload('a',Buffer.alloc(262144,i))]);
   b=await write(b,[upload('new','new')]);const prior=await rows();
   const response=await preview(t,b,intent(t,b,t.files,b.files));
   assert.equal(response.data.error,{'entries':'file_count_exceeded','selected-bytes':'file_selection_bytes_exceeded','history-count':'file_history_count_exceeded','history-bytes':'file_history_bytes_exceeded'}[mode]);assert.deepEqual(await rows(),prior);
 }
 passed('ordinary files: 8-entry, 524288-selected-byte, 16-history-digest and 1048576-history-byte bounds refuse without compaction or partial effects');
 // Fresh process and old-reader rollback: legacy bytes are unchanged; v4 refuses.
 const exportBefore=await exportOf(target),alternateExport=await exportOf(alternate);
 await reopen(oldCode);assert.equal((await c.request(route(target))).data.error,'incompatible_format');assert.equal((await c.request('/api/reconstruct-files',{export:exportBefore,confirm:'reconstruct-empty-store'})).data.error,'incompatible_format');
 await reopen();assert.deepEqual(await exportOf(target),exportBefore);assert.deepEqual(await exportOf(alternate),alternateExport);
 for(const e of [legacy,exportBefore,alternateExport]){
   validateFileExport(fixtureScope,e);const dest=await start('ordinary-recovery-'+e.fingerprint.slice(-12)),dc=await client(dest);
   assert.equal((await dc.request('/api/reconstruct-files',{export:e,confirm:'reconstruct-empty-store'})).status,200);
   assert.deepEqual((await dc.request(route(e.revisions.at(-1),'export'))).data,e);
 }
 await erase(alternate);assert.deepEqual(await exportOf(target),exportBefore);
 assert.match((await ok(c.request(route(target,'context'),{expected:headBinding(target)}))),/Origin unavailable or unverified/);
 const independent=(await ok(commit(await branch(target)))).saved,independentExport=await exportOf(independent);
 await erase(target);assert.deepEqual(await exportOf(independent),independentExport);
 for(const table of ['web_planning_revision','web_planning_file'])assert.equal((await server.db.prepare(`SELECT count(*) n FROM ${table} WHERE work_id=?`).bind(target.work_id).first()).n,0);
 assert.deepEqual((await server.db.prepare('SELECT version FROM web_planning_schema').all()).results,[{version:3}]);
 passed('ordinary files: unchanged legacy exports; schema-3 code upgrade/old-reader refusal/roll-forward; fresh-process v4 reopen and supported empty-store reconstruction; independent copies survive origin erasure and own erasure removes bodies');
}
