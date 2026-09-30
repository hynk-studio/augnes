import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';
import { randomUUID } from 'node:crypto';
import { startLocal, fixtureScope, dispatchNavigation } from './web-planning-local-runtime.mjs';
import { buildWebPlanning, webRoot } from './build-web-planning.mjs';
import { canonical, hash, exportWork, headBinding, normalizePayload } from '../apps/web_planning/src/contract.ts';
import { normalizeInitialProjectWorkDefinitionV01 as legacyNormalize } from '../lib/vnext/runtime/initial-project-work-context.ts';
import { buildSelectedWorkSourceEntry, normalizeSelectedWorkSources } from '../lib/intake/selected-work-source-comparison.ts';
import { seal } from '../apps/web_planning/src/access.ts';
import { checkSitesArtifact, exerciseSitesBootstrap } from './web-planning-sites-checks.mjs';
import { checkCapacity } from './web-planning-capacity-checks.mjs';
import { checkBranching } from './web-planning-branch-checks.mjs';
import { checkCloudflarePlanning } from './web-planning-cloudflare-checks.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw new Error('owned_test_root_required');
let local;const open=[];let checks=0;
function passed(name){checks++;console.log('web-planning: '+name);}
const scope={workspace_id:fixtureScope.workspace_id,project_id:fixtureScope.project_id};
const baseDefinition={goal:'Plan a quiet community reading room',success_criteria:['Keep one owner','Reopen the saved plan'],non_goals:['No file uploads']};
const notes=[{source:'Synthetic owner observation',text:'Do not treat an open issue as proof of unfinished implementation.',observed_at:'2026-09-20T12:00:00.000Z',provenance:'user_declaration',label:'Changed assumption / user correction'},
 {source:'Synthetic research question',text:'The evening noise level is unknown; measure it before choosing the room.',observed_at:null,provenance:'derived_interpretation',label:'Open question'}];
async function client(server,options={}) {
 const origin=options.sites?server.env.APP_ORIGIN:server.origin;
 const identity=options.sites?{'oai-authenticated-user-email':server.env.OWNER_EMAIL}:{};
 const cookie=options.cookie??(options.sites?'':`web_planning_local=${server.env.LOCAL_SESSION}`);
 const entry={headers:{cookie,...identity,...options.entryHeaders}};
 const first=await (options.entryHeaders?dispatchNavigation(server,origin+'/',entry):server.mf.dispatchFetch(origin+'/',entry));
 if(options.denied){assert.equal(first.status,403);return;}
 assert.equal(first.status,200);const text=await first.text();const csrf=text.match(/name="csrf-token" content="([^"]+)"/)[1];
 const cookies=cookie+'; '+first.headers.get('set-cookie').split(';')[0];
 return {csrf,cookies,async request(url,body,extra={}){
   const res=await server.mf.dispatchFetch(origin+url,{method:body===undefined?'GET':'POST',headers:{cookie:cookies,...identity,...(body===undefined?{}:{origin,'content-type':'application/json','x-csrf-token':csrf}),...extra},...(body===undefined?{}:{body:JSON.stringify({...scope,...body})})});
   assert.match(res.headers.get('cache-control'),/no-store/);assert.equal(res.headers.get('access-control-allow-origin'),null);
   const data=(res.headers.get('content-type')??'').includes('application/json')?await res.json():await res.text();return {status:res.status,data};
 }};
}
async function newWork(c,definition=baseDefinition,selected=notes){const draft=await c.request('/api/drafts',{});assert.equal(draft.status,200);const input={ticket:draft.data.ticket,definition,notes:selected};return {id:draft.data.work_id,input};}
async function save(c,w){return c.request('/api/work/'+w.id+'/save',w.input);}
async function edit(c,saved,goal){const t=await c.request('/api/work/'+saved.work_id+'/ticket',{expected:headBinding(saved)});assert.equal(t.status,200);return {id:saved.work_id,input:{ticket:t.data.ticket,definition:{...saved.definition,goal},notes:saved.sources.map(s=>({text:s.bounded_summary,source:s.compatibility_source_ref.external_id,observed_at:s.external_ref.observed_at??null,provenance:s.trust_class,label:s.why_included}))}};}
async function start(name,options={}){const dir=path.join(root,name);await mkdir(dir,{recursive:true});const s=await startLocal({root:dir,...options});open.push(s);return s;}
try {
 new Script(await readFile(path.join(webRoot,'src/client.js.txt'),'utf8'));
 const artifact=path.join(root,'artifact');
 process.env.OWNER_EMAIL='web-planning-artifact-secret-sentinel';
 process.env.REQUEST_SECRET='web-planning-artifact-secret-sentinel';
 await buildWebPlanning(artifact);
 const code=await readFile(path.join(artifact,'server/index.js'),'utf8');
 const runtimeConfig=await checkSitesArtifact(artifact,code);
 await exerciseSitesBootstrap({start,artifact,code,runtimeConfig,client,newWork,save,edit,headBinding,passed});
 local=await start('primary');let c=await client(local);
 const normalized=normalizePayload(fixtureScope,{goal:'  계획 🌿  ',success_criteria:[' b ','a','a',''],non_goals:[]},notes);
 assert.deepEqual(normalized.definition,{goal:'계획 🌿',success_criteria:['a','b'],non_goals:[]});
 // Frozen byte fingerprints collected from the merged d7c8c326 normalizer/source owner,
 // before extraction; these are not generated from the new implementation at test time.
 assert.equal(hash(canonical(normalized.definition)),'sha256:057eb9be4af7ba40fe767c4b7a6a2d2a825ae8df6f3b1ae4486947fadbef68df');
 const golden=normalizePayload(fixtureScope,baseDefinition,[{source:'Original observation',text:' 원본 🌿 ',observed_at:'2026-09-20T12:00:00+09:00',provenance:'user_declaration',label:'Changed assumption / user correction'}]);
 assert.equal(hash(canonical(golden.sources)),'sha256:64365a419418aa23686e92de4a67e2b236bf67c2b033dbe045586010d26dc528');
 assert.deepEqual(normalized.definition,legacyNormalize({goal:'  계획 🌿  ',success_criteria:[' b ','a','a',''],non_goals:[]}));
 assert.deepEqual(normalized.sources,normalizeSelectedWorkSources(fixtureScope,notes.map(n=>buildSelectedWorkSourceEntry(fixtureScope,n))));
 passed('portable normalized material and production artifact exclude native admission/test ingress');
 const first=await newWork(c);let r=await save(c,first);assert.equal(r.status,200);let head=r.data.saved;assert.equal(head.revision,1);
 assert.deepEqual(head.definition,legacyNormalize(baseDefinition));assert.deepEqual(head.sources,normalizePayload(fixtureScope,baseDefinition,notes).sources);
 let repeat=await save(c,first);assert.equal(repeat.status,200);assert.deepEqual(repeat.data.saved,head);
 repeat=await save(c,{...first,input:{...first.input,definition:{...baseDefinition,goal:'Altered'}}});assert.equal(repeat.status,409);assert.equal(repeat.data.error,'altered_replay');
 passed('first save and identical/altered replay bind exact normalized material');
 const left=await edit(c,head,'Competing left'),right=await edit(c,head,'Competing right');
 const race=await Promise.all([save(c,left),save(c,right)]);assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);head=race.find(r=>r.status===200).data.saved;assert.equal(head.revision,2);
 assert.equal((await c.request('/api/work/'+head.work_id+'/history')).data.revisions.length,2);
 let stale=await c.request('/api/work/'+head.work_id+'/context',{expected:{revision:1,fingerprint:r.data.saved.fingerprint}});assert.equal(stale.status,409);assert(!JSON.stringify(stale.data).includes('Competing'));
 passed('two competing SQL appends admit exactly one successor; stale context withholds replacement');
 const lost=await edit(c,head,'Response lost after commit');const pending=await c.request('/api/work/'+head.work_id+'/resolve',lost.input);assert.equal(pending.data.outcome,'unknown');
 await save(c,lost); // Deliberately discard acknowledgement; the producer actually committed.
 const resolved=await c.request('/api/work/'+head.work_id+'/resolve',lost.input);assert.equal(resolved.data.outcome,'saved');head=resolved.data.saved;
 assert.equal((await save(c,lost)).data.saved.revision,3);assert.equal((await c.request('/api/work/'+head.work_id+'/history')).data.revisions.length,3);
 passed('absent request stays unknown; lost acknowledgement resolves and retries without duplication');
 const fault=await edit(c,head,'Must not partially persist');
 await local.db.prepare("CREATE TRIGGER injected_storage_fault BEFORE INSERT ON web_planning_revision BEGIN SELECT RAISE(ABORT,'synthetic-storage-fault'); END").run();
 assert.equal((await save(c,fault)).status,503);assert.equal((await c.request('/api/work/'+head.work_id)).data.saved.fingerprint,head.fingerprint);
 await local.db.prepare('DROP TRIGGER injected_storage_fault').run();
 passed('real D1 storage fault leaves the whole prior revision intact');
 await local.db.prepare('UPDATE web_planning_revision SET fingerprint=? WHERE work_id=? AND revision=3').bind('sha256:'+'0'.repeat(64),head.work_id).run();
 assert.equal((await c.request('/api/work/'+head.work_id)).status,503);
 await local.db.prepare('UPDATE web_planning_revision SET fingerprint=? WHERE work_id=? AND revision=3').bind(head.fingerprint,head.work_id).run();
 const expiredMaterial=JSON.parse(Buffer.from(fault.input.ticket.split('.')[0],'base64url').toString());
 const expired={...fault,input:{...fault.input,ticket:seal({env:local.env},{...expiredMaterial,expires:Date.now()-1000})}};
 assert.equal((await save(c,expired)).data.error,'save_ticket_expired');
 assert.equal((await c.request('/api/work/'+head.work_id+'/resolve',expired.input)).data.outcome,'unknown');
 const snapshots={root:path.join(root,'primary'),port:Number(new URL(local.origin).port),bindings:local.env,code:local.code};
 await local.close();open.splice(open.indexOf(local),1);local=await startLocal(snapshots);open.push(local);c=await client(local);
 assert.deepEqual((await c.request('/api/work/'+head.work_id)).data.saved,head);
 passed('fresh client and restarted workerd reopen persisted D1 without browser state');
 const bad={goal:'😀'.repeat(2001),success_criteria:['a'],non_goals:[]};const boundary=await newWork(c,bad,[]);assert.equal((await save(c,boundary)).status,422);
 const good=await newWork(c,{...bad,goal:'😀'.repeat(2000)},[]);assert.equal((await save(c,good)).status,200);
 const bytes=await newWork(c,{goal:'😀'.repeat(2000),success_criteria:['😀'.repeat(500),'한'.repeat(500),'a'.repeat(500)],non_goals:['z'.repeat(500)]},[]);assert.equal((await save(c,bytes)).status,422);
 const many=await newWork(c,baseDefinition,Array.from({length:9},(_,i)=>({...notes[0],text:'note'+i})));assert.equal((await save(c,many)).status,422);
 const long=await newWork(c,baseDefinition,[{...notes[0],text:'한'.repeat(2001)}]);assert.equal((await save(c,long)).status,422);
 const whole=await newWork(c,baseDefinition,[{...notes[0],text:'😀'.repeat(2000)},{...notes[1],text:'😀'.repeat(2000)}]);assert.equal((await save(c,whole)).status,422);
 const beforeCount=(await local.db.prepare('SELECT COUNT(*) n FROM web_planning_revision').first()).n;
 for(const invalid of [boundary,bytes,many,long,whole])assert.equal((await c.request('/api/work/'+invalid.id)).status,404);
 assert.equal((await local.db.prepare('SELECT COUNT(*) n FROM web_planning_revision').first()).n,beforeCount);
 passed('multibyte codepoints, UTF-8 totals and whole-note bounds refuse without clipping/rows');
 const hostile=await newWork(c,{...baseDefinition,goal:'<script>globalThis.compromised=true</script>'},[{...notes[0],text:'<img src="https://forbidden.test/x" onerror="alert(1)">',source:'javascript:alert(2)'}]);
 const hostSaved=(await save(c,hostile)).data.saved;const rendered=await c.request('/api/work/'+hostile.id+'/context',{expected:headBinding(hostSaved)});
 assert.equal(rendered.status,200);assert(!rendered.data.includes('<img'));assert(!rendered.data.includes('<script>'));assert(rendered.data.includes('&lt;img'));assert.equal(local.externalRequests(),0);
 passed('hostile source/text remains inert and no source URL is fetched');
 await client(local,{cookie:'web_planning_local=wrong',denied:true});
 await client(local,{cookie:`web_planning_local=${local.env.LOCAL_SESSION}; web_planning_local=${local.env.LOCAL_SESSION}`,denied:true});
 const outsider=await start('outsider',{bindings:{LOCAL_LOGIN:'other-owner@example.test'}});await client(outsider,{denied:true});
 const targets=['/','/client.js','/api/works','/api/work/'+head.work_id,'/api/work/'+head.work_id+'/history','/api/work/'+head.work_id+'/export'];
 for(const target of targets){const res=await local.mf.dispatchFetch(local.origin+target,{headers:{'oai-authenticated-user-email':local.env.OWNER_EMAIL}});assert.equal(res.status,403);assert(!(await res.text()).includes(head.definition.goal));}
 for(const action of ['save','erase','resolve','context','ticket','capacity']) {
   const res=await local.mf.dispatchFetch(local.origin+'/api/work/'+head.work_id+'/'+action,{method:'POST',headers:{'content-type':'application/json',origin:local.origin,'x-csrf-token':c.csrf},body:JSON.stringify({...scope,...fault.input})});assert.equal(res.status,403);
 }
 for(const target of ['/api/drafts','/api/reconstruct','/api/capacity'])assert.equal((await local.mf.dispatchFetch(local.origin+target,{method:'POST'})).status,403);
 assert.equal((await c.request('/api/work/'+head.work_id+'/context',{expected:headBinding(head),workspace_id:randomUUID()})).status,403);
 assert.equal((await c.request('/api/works?project_id=wrong')).status,403);
 assert.equal((await c.request('/api/drafts',{}, {origin:'https://other.example'})).status,403);
 assert.equal((await c.request('/api/drafts',{}, {'x-csrf-token':'wrong'})).status,403);
 assert.equal((await c.request('/api/works',undefined,{'sec-fetch-site':'cross-site'})).status,403);
 const prod=await start('production',{production:true});const spoof=await prod.mf.dispatchFetch(prod.origin+'/',{headers:{'oai-authenticated-user-email':prod.env.OWNER_EMAIL,'x-web-planning-local-owner':prod.env.OWNER_EMAIL}});assert.equal(spoof.status,403);
 passed('all private route families deny missing identity; wrong scope, CSRF, origin, fixture/header spoof are refused');
 const exported=(await c.request('/api/work/'+head.work_id+'/export')).data;assert.deepEqual(exported,exportWork((await c.request('/api/work/'+head.work_id+'/history')).data.revisions));
 const restore=await start('restore');const rc=await client(restore);
 for(const mutated of [{...exported,format:'future'}, {...exported,revisions:exported.revisions.slice(1)}, {...exported,revisions:exported.revisions.map((v,i)=>i? v:{...v,definition:{...baseDefinition,goal:'Tampered after export'}})}])assert.notEqual((await rc.request('/api/reconstruct',{export:mutated,confirm:'reconstruct-empty-store'})).status,200);
 const missing=exportWork(exported.revisions.slice(1));assert.notEqual((await rc.request('/api/reconstruct',{export:missing,confirm:'reconstruct-empty-store'})).status,200);
 const incompatible=exportWork(exported.revisions.map(v=>({...v,compatibility:'future/2'})));assert.notEqual((await rc.request('/api/reconstruct',{export:incompatible,confirm:'reconstruct-empty-store'})).status,200);
 const changedParent=exportWork(exported.revisions.map((v,i)=>i===1?{...v,predecessor:'sha256:'+'0'.repeat(64)}:v));assert.notEqual((await rc.request('/api/reconstruct',{export:changedParent,confirm:'reconstruct-empty-store'})).status,200);
 assert.equal((await restore.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);
 await restore.db.prepare("CREATE TRIGGER fail_import BEFORE INSERT ON web_planning_revision WHEN NEW.revision=2 BEGIN SELECT RAISE(ABORT,'synthetic-import-fault'); END").run();
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);assert.equal((await restore.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);
 await restore.db.prepare('DROP TRIGGER fail_import').run();
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
 assert.deepEqual((await rc.request('/api/work/'+head.work_id+'/export')).data,exported);
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 assert.equal((await rc.request('/api/work/'+head.work_id+'/erase',{expected:headBinding(head),confirm:'erase-whole-work'})).status,200);
 assert.equal((await restore.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 passed('full export reconstructs exact history in empty D1; tamper/version/parent/partial-import/nonempty refusals');
 const erasePath='/api/work/'+head.work_id+'/erase',eraseInput={expected:headBinding(head),confirm:'erase-whole-work'};
 assert.equal((await c.request(erasePath,{...eraseInput,expected:{revision:1,fingerprint:exported.revisions[0].fingerprint}})).status,409);
 await local.db.prepare("CREATE TRIGGER fail_erase BEFORE DELETE ON web_planning_revision BEGIN SELECT RAISE(ABORT,'synthetic-erase-fault'); END").run();
 assert.equal((await c.request(erasePath,eraseInput)).status,503);assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_erased').first()).n,0);
 assert.equal((await c.request('/api/work/'+head.work_id+'/history')).data.revisions.length,3);
 await local.db.prepare('DROP TRIGGER fail_erase').run();
 const delayed=await edit(c,head,'Late save that must not resurrect');assert.equal((await c.request(erasePath,eraseInput)).status,200);
 for(const w of [delayed,first,lost])assert.equal((await save(c,w)).status,410);
 for(const pathSuffix of ['', '/history','/export'])assert.equal((await c.request('/api/work/'+head.work_id+pathSuffix)).status,410);
 const marker=await local.db.prepare('SELECT * FROM web_planning_erased WHERE work_id=?').bind(head.work_id).first();assert.deepEqual(Object.keys(marker).sort(),['project_id','work_id','workspace_id']);
 assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(head.work_id).first()).n,0);
 passed('whole-work erase rolls back on fault, deletes all requests/history and prevents delayed resurrection');
 const raceWork=await newWork(c);let raceHead=(await save(c,raceWork)).data.saved;const racing=await edit(c,raceHead,'Racing successor');
 const er=await Promise.all([save(c,racing),c.request('/api/work/'+raceWork.id+'/erase',{expected:headBinding(raceHead),confirm:'erase-whole-work'})]);
 if(er[1].status===200){assert.equal(er[0].status,410);assert.equal((await save(c,racing)).status,410);}else{assert.equal(er[1].status,409);assert.equal(er[0].status,200);assert.equal((await c.request('/api/work/'+raceWork.id)).data.saved.revision,2);}
 passed('save/erase concurrency serializes to whole save or whole erasure');
 const cap=await newWork(c);let capHead=(await save(c,cap)).data.saved;
 for(let i=2;i<=32;i++)capHead=(await save(c,await edit(c,capHead,'Capacity revision '+i))).data.saved;
 const capWrite=await edit(c,capHead,'Overflow');assert.equal((await save(c,capWrite)).data.error,'history_capacity');assert.equal((await c.request('/api/work/'+cap.id+'/history')).data.revisions.length,32);
 for(let i=0;i<10;i++)assert.equal((await save(c,await newWork(c,{...baseDefinition,goal:'List item '+i},[]))).status,200);
 const p1=await c.request('/api/works');assert.equal(p1.data.items.length,10);assert(p1.data.next);const p2=await c.request('/api/works?cursor='+p1.data.next);assert(p2.data.items.length>0);assert(!p2.data.items.some(i=>p1.data.items.some(j=>i.work_id===j.work_id)));
 passed('32-revision capacity and work-list pagination are bounded with exact effects');
 await checkCapacity({c,scope:fixtureScope,passed});
 await checkBranching({start,client,newWork,save,edit,passed,open});
 await checkCloudflarePlanning({root,start,client,newWork,save,edit,passed,open});
 console.log(JSON.stringify({web_planning_d1_checks:checks,storage:'Miniflare/workerd D1',hosted_acceptance:false}));
} finally {for(const server of open.reverse())await server.close();console.log('web_planning_owned_runtime_cleanup_complete');}
