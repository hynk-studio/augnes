import { predecessorCode } from "./web-planning-branch-checks.mjs";
import { checkRetainedRevisions } from './web-planning-retained-revision-checks.mjs';
import { digestBytes } from "../apps/web_planning/src/files.ts";
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonical,headBinding,reference,hash,makeRevision } from '../apps/web_planning/src/contract.ts';
import { SCENE_FILE } from '../apps/web_planning/src/scene-contract.ts';
import { storyOriginal,storyRevised,storyMarker,storyUpload } from './story-worldbuilding-fixture.mjs';
import { sceneFixture,sceneChoices,sceneReason } from './scene-continuity-fixture.mjs';
import { alternateScene,alternateReason,bell,primarySuccessor,alternateSuccessor } from './alternate-continuation-fixture.mjs';
export async function checkDirections({start,client,newWork,save,passed}){
 const server=await start('directions'),c=await client(server),w=await newWork(c,{goal:'황제의 두 갈래',success_criteria:['갈래와 원문을 보존한다.'],non_goals:['실제 출판']},[]);
 w.input.files=[storyMarker,storyUpload(storyOriginal)];let primary=(await save(c,w)).data.saved;
 const route=(r,action)=>`/api/work/${r.work_id}/${action}`;
 const ok=async(p)=>{const r=await p;assert.equal(r.status,200,canonical(r.data));return r.data;};
 async function ordinary(r,changes){const draft={definition:r.definition,notes:[],files:r.files,...changes},t=await ok(c.request(route(r,'ticket'),{expected:headBinding(r),...draft}));return (await ok(c.request(route(r,'save'),{ticket:t.ticket,...draft}))).saved;}
 async function review(r,scene,choices,reason){const p=await ok(c.request(route(r,'scene-review-preview'),{expected:headBinding(r),intent:{scene_id:scene.id,dispositions:choices,reason}}));return (await ok(c.request(route(r,'scene-review-save'),{ticket:p.ticket,intent:p.intent}))).saved;}
 primary=await ordinary(primary,{files:[storyMarker,storyUpload(storyRevised)]});const oldScene={id:randomUUID(),...sceneFixture};primary=await ordinary(primary,{scene:oldScene});primary=await review(primary,oldScene,sceneChoices,sceneReason);
 const origin=primary,originalExport=await ok(c.request(route(primary,'export')));
 const branch=await ok(c.request(route(primary,'branch-preview'),{expected:headBinding(primary),intent:{reason:alternateReason}})),branchRequest={ticket:branch.ticket,intent:branch.intent};
 assert.equal((await c.request(`/api/work/${branch.work_id}/relation-save`,{...branchRequest,project_id:randomUUID()})).status,403);
 let alternate=(await ok(c.request(`/api/work/${branch.work_id}/relation-save`,branchRequest))).saved;
 assert.equal((await ok(c.request(route(alternate,'relation-save'),branchRequest))).saved.fingerprint,alternate.fingerprint);
 const book=async r=>{const i=r.files.findIndex(f=>f.name===SCENE_FILE);return JSON.parse((await ok(c.request(`/api/work/${r.work_id}/files/${r.revision}/${r.fingerprint.slice(7)}/${i}`))));};
 assert.deepEqual((await book(alternate)).inheritance.scenes[0].review.dispositions,sceneChoices);
 assert.equal((await book(alternate)).scenes.length,0);assert.deepEqual(await ok(c.request(route(primary,'export'))),originalExport);
 const altScene={id:randomUUID(),...alternateScene(primary.work_id,oldScene.id)};alternate=await ordinary(alternate,{definition:{...alternate.definition,goal:'황제의 대안'},scene:altScene});alternate=await review(alternate,altScene,['adopted','adopted','undecided'],alternateReason);
 const parameters={title:'새벽의 다음 장면',viewpoint:'하린',event_time:3,reveal_order:2,source_names:['manuscript.txt']};
 const context=async(r,p=parameters)=>ok(c.request(route(r,'scene-context'),{expected:headBinding(r),intent:p}));
 const pcontext=await context(primary),acontext=await context(alternate);
 assert(pcontext.entries.some(e=>e.text===sceneFixture.proposals[3].text&&e.disposition==='adopted'));
 assert(acontext.entries.some(e=>e.text===altScene.proposals[0].text&&e.effective==='current'));
 assert(acontext.entries.some(e=>e.text===sceneFixture.proposals[3].text&&e.effective==='superseded'));
 assert(!(await context(alternate,{...parameters,event_time:1})).entries.some(e=>e.text===altScene.proposals[0].text));
 const compare=async()=>ok(c.request(route(primary,'compare'),{expected:headBinding(primary),source:reference(alternate)}));await compare();
 const intent=()=>({source:reference(alternate),selection:{dispositions:['undecided','adopted','undecided'],reason:'종의 설정만 원래 갈래에 채택한다. 폭로와 대안 원고는 가져오지 않는다.'}});
 const preview=async()=>ok(c.request(route(primary,'incorporation-preview'),{expected:headBinding(primary),intent:intent()}));
 const stale=await preview();primary=await ordinary(primary,{definition:{...primary.definition,goal:'황제의 원래 갈래 — 독립 수정'}});
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:stale.ticket,intent:stale.intent})).data.error,'refresh_required');
 const sourceStale=await preview();alternate=await ordinary(alternate,{definition:{...alternate.definition,goal:'황제의 대안 — 독립 수정'}});
 assert.equal((await c.request(route(primary,'relation-save'),{ticket:sourceStale.ticket,intent:sourceStale.intent})).data.error,'refresh_required');
 await compare();const p=await preview(),request={ticket:p.ticket,intent:p.intent};
 assert.equal((await c.request(route(primary,'relation-save'),{...request,intent:{...p.intent,selection:{...p.intent.selection,dispositions:['adopted','adopted','undecided']}}})).data.error,'altered_replay');
 const before=await ok(c.request(route(primary,'history')));
 await server.db.prepare("CREATE TRIGGER direction_failure BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic direction rollback'); END").run();
 assert.equal((await c.request(route(primary,'relation-save'),request)).status,503);assert.deepEqual(await ok(c.request(route(primary,'history'))),before);
 assert.equal((await ok(c.request(route(primary,'relation-resolve'),request))).outcome,'unknown');
 await server.db.prepare('DROP TRIGGER direction_failure').run();await ok(c.request(route(primary,'relation-save'),request)); // lost acknowledgement
 primary=(await ok(c.request(route(primary,'relation-resolve'),request))).saved;assert.equal((await ok(c.request(route(primary,'relation-save'),request))).saved.fingerprint,primary.fingerprint);
 const noChange=await preview();assert(noChange.noop);assert((await ok(c.request(route(primary,'relation-save'),{ticket:noChange.ticket,intent:noChange.intent}))).noop);
 assert.equal(primary.definition.goal,'황제의 원래 갈래 — 독립 수정');assert.equal(alternate.definition.goal,'황제의 대안 — 독립 수정');
 const current=await context(primary);assert(current.entries.some(e=>e.text===bell&&e.disposition==='adopted'));assert(current.entries.some(e=>e.text===sceneFixture.proposals[3].text&&e.effective==='current'));assert(!current.entries.some(e=>e.text===altScene.proposals[0].text&&e.disposition==='adopted'));
 primary=await ordinary(primary,{scene:{id:randomUUID(),...parameters,draft:primarySuccessor,proposals:[]}});alternate=await ordinary(alternate,{scene:{id:randomUUID(),...parameters,draft:alternateSuccessor,proposals:[]}});
 assert.equal((await book(primary)).scenes.at(-1).draft,primarySuccessor);assert.equal((await book(alternate)).scenes.at(-1).draft,alternateSuccessor);
 assert.equal((await c.request(route(primary,'export'))).data.error,'direction_closure_required');
 assert.equal((await c.request(route(primary,'direction-export'),{expected:headBinding(primary),source:reference(alternate)},{cookie:'web_planning_local=wrong'})).status,403);
 const bundle=await ok(c.request(route(primary,'direction-export'),{expected:headBinding(primary),source:reference(alternate)}));assert.equal(bundle.recovery.works.length,2);assert(bundle.reading[1].includes(alternateSuccessor));
 const dest=await start('direction-recovery'),dc=await client(dest),empty=async()=>{for(const t of ['web_planning_revision','web_planning_file'])assert.equal((await dest.db.prepare(`SELECT count(*) n FROM ${t}`).first()).n,0);};
 const damaged=structuredClone(bundle.recovery),exported=damaged.works[1],last=exported.revisions.at(-1),file=last.files.find(f=>f.name===SCENE_FILE),body=exported.files.find(b=>b.digest===file.digest),bookValue=JSON.parse(Buffer.from(body.data,'base64'));bookValue.format='augnes_scene_notebook.v99';
 const bytes=Buffer.from(canonical(bookValue));body.digest=digestBytes(bytes);body.bytes=bytes.length;body.data=bytes.toString('base64');Object.assign(file,{digest:body.digest,bytes:body.bytes});
 exported.revisions[exported.revisions.length-1]=makeRevision(last,last.work_id,headBinding(exported.revisions.at(-2)),last.request_key,{definition:last.definition,sources:last.sources,relations:last.relations,files:last.files},last.recorded_at);exported.files.sort((a,b)=>a.digest.localeCompare(b.digest));
 const rehash=v=>{const {fingerprint,...rest}=v;v.fingerprint=hash(canonical(rest));};rehash(exported);rehash(damaged);
 for(const broken of [damaged,{...bundle.recovery,compatibility:'future'}, {...bundle.recovery,works:bundle.recovery.works.slice(0,1)}]){assert.notEqual((await dc.request('/api/reconstruct-files',{export:broken,confirm:'reconstruct-empty-store'})).status,200);await empty();}
 const missing=structuredClone(bundle.recovery);missing.works[0].files.pop();assert.notEqual((await dc.request('/api/reconstruct-files',{export:missing,confirm:'reconstruct-empty-store'})).status,200);await empty();
 await dest.db.prepare(`CREATE TRIGGER second_scope_failure BEFORE INSERT ON web_planning_revision WHEN NEW.work_id='${alternate.work_id}' BEGIN SELECT RAISE(ABORT,'second scope rollback'); END`).run();
 assert.equal((await dc.request('/api/reconstruct-files',{export:bundle.recovery,confirm:'reconstruct-empty-store'})).status,503);await empty();await dest.db.prepare('DROP TRIGGER second_scope_failure').run();
 assert.equal((await dc.request('/api/reconstruct-files',{export:bundle.recovery.works[1],confirm:'reconstruct-empty-store'})).data.error,'direction_source_unavailable');await empty();
 await ok(dc.request('/api/reconstruct-files',{export:bundle.recovery,confirm:'reconstruct-empty-store'}));
 for(const r of [primary,alternate]){assert.deepEqual((await ok(dc.request(`/api/work/${r.work_id}`))).saved,r);assert.deepEqual(await ok(dc.request(route(r,'scene-context'),{expected:headBinding(r),intent:parameters})),await context(r));}
 assert.deepEqual((await ok(dc.request(route(primary,'direction-export'),{expected:headBinding(primary),source:reference(alternate)}))).recovery,bundle.recovery);
 assert.deepEqual(bundle.recovery.works[0].revisions.slice(0,4),originalExport.revisions);
 await checkRetainedRevisions({start,client,bundle:bundle.recovery,passed});
 await dest.setOptions({script:await predecessorCode('5c5c2cc89e2871b7cd2379927610275cae9cc1c0')});
 for(const r of [primary,alternate]){const oldRead=await dc.request(`/api/work/${r.work_id}`);assert.equal(oldRead.status,422);assert.equal(oldRead.data.error,'invalid_fields');}
 await dest.setOptions({script:dest.code});assert.deepEqual((await ok(dc.request(`/api/work/${primary.work_id}`))).saved,primary);
 passed('directions: real D1 branch copies originals with inherited attribution; explicit retcon; selected-only target adoption; stale source/target, foreign and altered replay refusal; atomic fault, exact unknown/replay/no-op; independent successors and two-scope recovery closure');
 // A declared dependency on alternate-only knowledge cannot be taken alone.
 const dependent={id:randomUUID(),...parameters,draft:'必要な背景を伴う提案。',proposals:[{kind:'fact',subject:'記録',text:'하린의 비밀 답장 보관함',event_time:3,reveal_order:2,revises:[],requires:[{work_id:alternate.work_id,scene_id:altScene.id,proposal:0}]}]};
 alternate=await ordinary(alternate,{scene:dependent});alternate=await review(alternate,dependent,['adopted'],'명시된 전제와 함께 채택');
 const selection={dispositions:['undecided','undecided','undecided','adopted'],reason:'전제 없는 선택은 거절되어야 한다.'};
 assert.equal((await c.request(route(primary,'incorporation-preview'),{expected:headBinding(primary),intent:{source:reference(alternate),selection}})).data.error,'scene_prerequisite_missing');
 const growing={id:randomUUID(),...parameters,draft:'容量のある範囲の下書き',proposals:[]};let capacity=false;
 for(let i=0;i<16;i++){const draft={definition:alternate.definition,notes:[],files:alternate.files,scene:{...growing,draft:growing.draft+i}},ticket=await c.request(route(alternate,'ticket'),{expected:headBinding(alternate),...draft});if(ticket.status!==200){assert.equal(ticket.data.error,'file_history_count_exceeded');capacity=true;break;}alternate=(await ok(c.request(route(alternate,'save'),{ticket:ticket.data.ticket,...draft}))).saved;}
 assert(capacity);assert.equal((await ok(c.request(`/api/work/${alternate.work_id}`))).saved.fingerprint,alternate.fingerprint);
 await ok(c.request(route(alternate,'erase'),{expected:headBinding(alternate),confirm:'erase-whole-work'}));assert.notEqual((await c.request(route(primary,'scene-context'),{expected:headBinding(primary),intent:parameters})).status,200);
 passed('directions: missing explicitly linked prerequisite refuses, and missing external source cannot masquerade as complete context');
}
