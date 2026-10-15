import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonical, headBinding, makeRevision, hash } from '../apps/web_planning/src/contract.ts';
import { digestBytes } from '../apps/web_planning/src/files.ts';
import { SCENE_FILE } from '../apps/web_planning/src/scene-contract.ts';
import { storyOriginal,storyRevised,storyMarker,storyUpload } from './story-worldbuilding-fixture.mjs';
import { sceneFixture,sceneChoices,sceneReason,deterministicSuccessor } from './scene-continuity-fixture.mjs';
export async function checkSceneContinuity({start,client,newWork,save,passed}){
 const server=await start('scenes'),c=await client(server),w=await newWork(c,{goal:'봉인과 황제',success_criteria:['원문과 시점, 선택을 보존한다.'],non_goals:['출판하지 않는다.']},[]);
 w.input.files=[storyMarker,storyUpload(storyOriginal)];let r=(await save(c,w)).data.saved;
 const route=(action,id=w.id)=>`/api/work/${id}/${action}`;
 async function ticket(r,changes={}){const draft={definition:r.definition,notes:[],files:r.files,...changes};const p=await c.request(route('ticket'),{expected:headBinding(r),...draft});assert.equal(p.status,200,canonical(p.data));return {ticket:p.data.ticket,...draft};}
 const ordinary=async(r,changes)=>{const v=await c.request(route('save'),await ticket(r,changes));assert.equal(v.status,200,canonical(v.data));return v.data.saved;};
 r=await ordinary(r,{files:[r.files[0],storyUpload(storyRevised)]});
 const params={title:'다음 장면',viewpoint:'하린',event_time:3,reveal_order:2,source_names:['manuscript.txt']};
 const context=async(r,p=params)=>{const v=await c.request(route('scene-context'),{expected:headBinding(r),intent:p});assert.equal(v.status,200,canonical(v.data));return v.data;};
 assert.equal((await context(r)).originals[0].text,storyRevised);
 const draft={id:randomUUID(),...sceneFixture};r=await ordinary(r,{scene:draft});
 assert((await context(r)).entries.every(e=>e.disposition==='undecided'));
 const edited={...draft,draft:draft.draft+'\n\n그는 문밖의 발소리를 들었다.'};const draftRequest=await ticket(r,{scene:edited});r=(await c.request(route('save'),draftRequest)).data.saved;
 assert.equal((await c.request(route('resolve'),draftRequest)).data.saved.fingerprint,r.fingerprint);
 assert.equal((await c.request(route('save'),draftRequest)).data.saved.fingerprint,r.fingerprint);
 const intent={scene_id:draft.id,dispositions:sceneChoices,reason:sceneReason};
 const preview=async(head=r,i=intent)=>c.request(route('scene-review-preview'),{expected:headBinding(head),intent:i});
 const review=await preview(),stale=await preview();assert.equal(review.status,200,canonical(review.data));const request={ticket:review.data.ticket,intent:review.data.intent};
 assert.equal((await c.request(route('scene-review-save'),{...request,project_id:randomUUID()})).status,403);
 assert.equal((await c.request(route('scene-review-save'),request,{cookie:'web_planning_local=wrong'})).status,403);
 assert.equal((await c.request(route('scene-review-save',randomUUID()),request)).status,403);
 assert.equal((await preview(r,{...intent,scene_id:randomUUID()})).data.error,'scene_unavailable');
 assert.equal((await c.request(route('scene-review-save'),{...request,intent:{...intent,dispositions:sceneChoices.map(()=> 'adopted')}})).data.error,'altered_replay');
 const before=(await c.request(route('export'))).data;
 await server.db.prepare("CREATE TRIGGER scene_failure BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic scene write failure'); END").run();
 assert.equal((await c.request(route('scene-review-save'),request)).status,503);
 assert.equal(canonical((await c.request(route('export'))).data),canonical(before));
 assert.equal((await c.request(route('scene-review-resolve'),request)).data.outcome,'unknown');
 await server.db.prepare('DROP TRIGGER scene_failure').run();
 // The response is deliberately not used as the consumer's acknowledgement.
 assert.equal((await c.request(route('scene-review-save'),request)).status,200);
 r=(await c.request(route('scene-review-resolve'),request)).data.saved;assert.equal(r.revision,5);
 assert.equal((await c.request(route('scene-review-save'),request)).data.saved.fingerprint,r.fingerprint);
 assert.equal((await c.request(route('scene-review-save'),{ticket:stale.data.ticket,intent:stale.data.intent})).data.error,'refresh_required');
 assert.equal((await preview()).data.error,'scene_review_locked');
 const next=await context(r);assert.equal(next.originals[0].text,storyRevised);
 assert(next.entries.some(e=>e.kind==='knowledge'&&e.disposition==='adopted'&&e.text.includes('아직 열지')));
 assert(next.entries.some(e=>e.kind==='intention'&&e.disposition==='undecided'));
 assert(next.entries.some(e=>e.kind==='knowledge'&&e.disposition==='rejected'));
 assert.equal((await context(r,{...params,event_time:1,reveal_order:1})).entries.length,3);
 assert(!(await context(r,{...params,viewpoint:'문지기'})).entries.some(e=>e.kind==='belief'||e.kind==='knowledge'));
 assert(!(await context(r,{...params,reveal_order:0})).text.includes(edited.draft));
 const secondScene={id:randomUUID(),...params,draft:deterministicSuccessor,proposals:[]};r=await ordinary(r,{scene:secondScene});
 const successorRequest=await ticket(r,{scene:{...secondScene,draft:deterministicSuccessor+'\n\n추가 원문.'}});r=(await c.request(route('save'),successorRequest)).data.saved;
 assert.equal((await c.request(route('resolve'),successorRequest)).data.saved.fingerprint,r.fingerprint);
 const exported=(await c.request(route('export'))).data;
 assert.equal(exported.revisions.length,7);assert.equal(exported.files.length,8);
 const notebook=()=>{const file=r.files.find(f=>f.name===SCENE_FILE);return JSON.parse(Buffer.from(exported.files.find(f=>f.digest===file.digest).data,'base64'));};
 assert.deepEqual(notebook().scenes[0].review.dispositions,sceneChoices);assert.equal(notebook().scenes[1].review,null);
 assert.equal((await c.request(route('ticket'),{expected:headBinding(r),definition:r.definition,notes:[],files:r.files.filter(f=>f.name!==SCENE_FILE)})).data.error,'scene_notebook_owned');
 passed('scene: persisted originals and draft revisions; scoped grouped adoption, real atomic rollback, unknown-save reconciliation, replay, stale/foreign/unauthorized refusal; time/reveal/viewpoint-specific consumer context');
 const destination=await start('scene-recovery'),dc=await client(destination);
 const empty=async()=>{for(const table of ['web_planning_revision','web_planning_file'])assert.equal((await destination.db.prepare(`SELECT count(*) n FROM ${table}`).first()).n,0);};
 // Corrupt the domain body while recomputing the ordinary envelope hashes: the
 // domain validator must refuse before the transaction, not merely checksum it.
 function damagedNotebook(index,change){
  const broken=structuredClone(exported),body=broken.files.find(f=>f.digest===broken.revisions[index].files.find(f=>f.name===SCENE_FILE).digest),old=body.digest;
  const wrong=JSON.parse(Buffer.from(body.data,'base64'));change(wrong);const bytes=Buffer.from(canonical(wrong));body.data=bytes.toString('base64');body.bytes=bytes.length;body.digest=digestBytes(bytes);
  let previous;broken.revisions=broken.revisions.map(v=>{const files=v.files.map(f=>f.digest===old?{...f,digest:body.digest,bytes:body.bytes}:f);const made=makeRevision(v,v.work_id,headBinding(previous),v.request_key,{definition:v.definition,sources:v.sources,relations:v.relations,files},v.recorded_at);previous=made;return made;});
  broken.files.sort((a,b)=>a.digest.localeCompare(b.digest));const {fingerprint,...content}=broken;broken.fingerprint=hash(canonical(content));return broken;
 }
 for(const [broken,error] of [
  [damagedNotebook(2,b=>b.format='augnes_scene_notebook.v99'),'scene_notebook_incompatible'],
  [damagedNotebook(2,b=>b.scenes[0].basis.work_id=randomUUID()),'scene_source_binding'],
  [damagedNotebook(4,b=>b.scenes[0].review.author_ref=randomUUID()),'scene_review_binding'],
  [damagedNotebook(2,b=>b.scenes[0].review={basis:b.scenes[0].basis,author_ref:exported.revisions[0].author_ref,reason:'forged initial adoption',dispositions:sceneChoices}),'scene_review_binding']
 ]){assert.equal((await dc.request('/api/reconstruct-files',{export:broken,confirm:'reconstruct-empty-store'})).data.error,error);await empty();}
 assert.notEqual((await dc.request('/api/reconstruct-files',{export:{...exported,files:exported.files.slice(1)},confirm:'reconstruct-empty-store'})).status,200);await empty();
 assert.equal((await dc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
 assert.equal(canonical((await dc.request(route('export'))).data),canonical(exported));
 const recovered=await dc.request(route('scene-context'),{expected:headBinding(r),intent:params});assert.equal(recovered.status,200);assert.equal(recovered.data.text,(await context(r)).text);
 const reading=await dc.request(route('reading-export'));assert.equal(reading.status,200);assert(reading.data.includes('adopted'));assert(reading.data.includes('rejected'));
 passed('scene: complete export consumed by separate empty D1; exact original, draft, proposal, disposition and lineage readback; incompatible domain and malformed recovery refuse without partial state');
 // An original source edit is not implicit permission to adopt old proposals.
 r=await ordinary(r,{files:r.files.map(f=>f.name==='manuscript.txt'?storyUpload(storyRevised+'\n추가 설정.'):f)});
 const i={scene_id:secondScene.id,dispositions:[],reason:'다음 장면의 검토'};
 assert.equal((await preview(r,i)).data.error,'scene_sources_changed');
 assert.equal((await c.request(route('scene-context'),{expected:headBinding(r),intent:{...params,source_names:['missing.txt']}})).data.error,'scene_source_unavailable');
 r=await ordinary(r,{scene:{...secondScene,draft:'현재 원문을 다시 준비한 초안.'}});
 const race=await Promise.all([preview(r,i),preview(r,{...i,reason:'같은 장면의 별도 검토'})]);
 const raced=await Promise.all(race.map(p=>c.request(route('scene-review-save'),{ticket:p.data.ticket,intent:p.data.intent})));
 assert.deepEqual(raced.map(v=>v.status).sort(),[200,409]);r=raced.find(v=>v.status===200).data.saved;
 const currentDraft={...secondScene,id:randomUUID(),draft:'다음의 미채택 초안'};r=await ordinary(r,{scene:currentDraft});
 let refused=false;
 for(let n=0;n<16;n++){const changed={...currentDraft,draft:'보존된 초안 '+n};const d={definition:r.definition,notes:[],files:r.files,scene:changed};const t=await c.request(route('ticket'),{expected:headBinding(r),...d});if(t.status!==200){assert.equal(t.data.error,'file_history_count_exceeded');refused=true;break;}r=(await c.request(route('save'),{ticket:t.data.ticket,...d})).data.saved;}
 assert(refused);assert.equal((await c.request(route('export'))).data.files.length,16);
 const large=await newWork(c,r.definition,[]);large.input.files=[storyUpload('큰 원문\n'.repeat(2000))];const largeSaved=(await save(c,large)).data.saved;
 assert.equal((await c.request(`/api/work/${large.id}/scene-context`,{expected:headBinding(largeSaved),intent:params})).data.error,'scene_context_capacity');
 assert.equal((await c.request(`/api/work/${large.id}/files/1/${largeSaved.fingerprint.slice(7)}/0`)).data,'큰 원문\n'.repeat(2000));
 const malformed={...currentDraft,draft:'malformed \ud800'};
 assert.equal((await c.request(route('ticket'),{expected:headBinding(r),definition:r.definition,notes:[],files:r.files,scene:malformed})).data.error,'invalid_scene_text');
 passed('scene: changed-source review refusal, real concurrent adoption has one winner, truthful missing sources, unchanged history/context capacities without clipping, exact large original still accessible and malformed Unicode draft refusal');
}
