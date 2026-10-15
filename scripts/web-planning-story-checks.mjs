import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { storyOriginal, storyRevised, storyMarker, storyUpload } from './story-worldbuilding-fixture.mjs';
import { canonical, headBinding } from '../apps/web_planning/src/contract.ts';
import { escape } from '../apps/web_planning/src/page.ts';

export async function checkStoryWriting({start,client,newWork,save,passed}) {
 const server=await start('story-writing'),c=await client(server);
 const w=await newWork(c,{goal:'황제의 귀환 — 원본 설정',success_criteria:['원문과 미정인 의도를 유지한다.'],non_goals:['장면 채택이나 출판은 하지 않는다.']},[]);
 w.input.files=[storyMarker,storyUpload(storyOriginal)];
 const first=(await save(c,w)).data.saved;assert.equal(first.revision,1);assert.equal(first.sources.length,0);
 const write=async(r,files)=>{const draft={definition:r.definition,notes:[],files};const t=await c.request(`/api/work/${r.work_id}/ticket`,{expected:headBinding(r),...draft});assert.equal(t.status,200);return {id:r.work_id,input:{...draft,ticket:t.data.ticket}};};
 const revision=await write(first,[first.files[0],storyUpload(storyRevised)]);
 const second=(await save(c,revision)).data.saved;assert.equal(second.predecessor,first.fingerprint);
 assert.equal((await save(c,revision)).data.saved.fingerprint,second.fingerprint);
 const stale=await c.request(`/api/work/${first.work_id}/ticket`,{expected:headBinding(first),definition:first.definition,notes:[],files:[storyMarker,storyUpload('stale draft')]});assert.equal(stale.data.error,'refresh_required');
 const detached=(await save(c,await write(second,[second.files[1]]))).data.saved;
 assert.equal(detached.work_id,first.work_id);assert.equal(detached.project_id,first.project_id);assert.deepEqual(detached.files,[second.files[1]]);
 const fourth=(await save(c,await write(detached,[storyMarker,detached.files[0]]))).data.saved;
 const exported=(await c.request(`/api/work/${w.id}/export`)).data;
 assert.equal(exported.revisions.length,4);assert.equal(exported.files.length,3);
 for(const [r,text] of [[first,storyOriginal],[second,storyRevised],[fourth,storyRevised]]){const i=r.files.findIndex(f=>f.name==='manuscript.txt');const result=await c.request(`/api/work/${w.id}/files/${r.revision}/${r.fingerprint.slice(7)}/${i}`);assert.equal(result.data,text);}
 const reading=await c.request(`/api/work/${w.id}/reading-export`);assert.equal(reading.status,200);
 assert(reading.data.includes('<pre>'+escape(storyOriginal)+'</pre>'));assert(reading.data.includes('<pre>'+escape(storyRevised)+'</pre>'));assert(!reading.data.includes('<script>fiction only</script>'));
 for(const r of exported.revisions)assert(reading.data.includes(r.fingerprint));
 assert.equal((await c.request(`/api/work/${w.id}/reading-export`,undefined,{cookie:'web_planning_local=wrong'})).status,403);
 assert.equal((await c.request(`/api/work/${w.id}/save`,{...revision.input,project_id:randomUUID()})).status,403);
 passed('story: ordinary scoped producer retains exact Unicode paragraphs, original/revised files and lineage; presentation attach/detach retains identity; readable history is escaped and access-bound');
 const dest=await start('story-recovery'),dc=await client(dest);
 const empty=async()=>{for(const table of ['web_planning_revision','web_planning_file'])assert.equal((await dest.db.prepare(`SELECT count(*) n FROM ${table}`).first()).n,0);};
 for(const broken of [{...exported,compatibility:'future/99'},{...exported,files:exported.files.slice(1)},{...exported,revisions:exported.revisions.slice(1)}]){assert.notEqual((await dc.request('/api/reconstruct-files',{export:broken,confirm:'reconstruct-empty-store'})).status,200);await empty();}
 assert.equal((await dc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store',project_id:randomUUID()})).status,403);await empty();
 await dest.db.prepare("CREATE TRIGGER story_recovery_fault BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic story recovery fault'); END").run();
 assert.equal((await dc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,503);await empty();
 await dest.db.prepare('DROP TRIGGER story_recovery_fault').run();
 assert.equal((await dc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
 assert.equal(canonical((await dc.request(`/api/work/${w.id}/export`)).data),canonical(exported));assert.equal((await dc.request(`/api/work/${w.id}/reading-export`)).data,reading.data);
 assert.equal((await dc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 const digest=fourth.files.find(f=>f.name==='manuscript.txt').digest;
 await dest.db.prepare('DELETE FROM web_planning_file WHERE digest=?').bind(digest).run();
 for(const suffix of ['', '/reading-export','/export'])assert.equal((await dc.request(`/api/work/${w.id}${suffix}`)).data.error,'file_content_unavailable');
 passed('story: supported empty-destination recovery consumes the complete export; exact history and readable output match; malformed/incompatible/wrong-project/nonempty/partial-body refusals and missing-source truthfulness');
 // Durable writing is not a selected 2,000-code-point note. Neither bounds nor
 // note selection changes to accommodate this explicitly authored file.
 const long=storyOriginal+'\n\n'+'긴 원문 🌿\n'.repeat(450),lw=await newWork(c,first.definition,[]);lw.input.files=[storyUpload(long)];const lr=(await save(c,lw)).data.saved;
 assert([...long].length>2000);assert.equal(lr.sources.length,0);assert.equal((await c.request(`/api/work/${lr.work_id}/files/1/${lr.fingerprint.slice(7)}/0`)).data,long);
 passed('story: original writing beyond selected-note length uses unchanged file limits without clipping or extra context notes');
}
