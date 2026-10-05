import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { assertHistoryBudget, canonical, canonicalBytes, exportWork, headBinding, HISTORY_READ_BYTES, HISTORY_READ_ROWS, makeRevision, normalizePayload, reference } from '../apps/web_planning/src/contract.ts';
import { boundedDatabase, readWork } from '../apps/web_planning/src/store.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { bundleWebPlanning } from './build-web-planning.mjs';
import { predecessorCode } from './web-planning-branch-checks.mjs';

// Test-only clock; production keeps its ordinary clock and 24-hour seals.
export function advancedClock(code,days=4){return `const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[OriginalDate.now()+${days*86400000}]));}static now(){return OriginalDate.now()+${days*86400000};}};\n`+code;}
const predecessor='f618ed105308c51bcd247afec08614800f125f08';
const definition={goal:'Retain a qualified cumulative plan',success_criteria:['Read exact saved context'],non_goals:['No execution authority']};
const scope={workspace_id:fixtureScope.workspace_id,project_id:fixtureScope.project_id};
const unchanged=async server=>{
 const result={};for(const table of ['web_planning_revision','web_planning_file','web_planning_workspace','web_planning_erased'])
   result[table]=(await server.db.prepare(`SELECT * FROM ${table} ORDER BY 1,2,3`).all()).results;
 return result;
};
// Canonical constructed history, distinctly labelled; no claim that these
// rows came from human actions. The normal-writer crossing is tested separately.
function prefix(count,payload=normalizePayload(fixtureScope,definition,[]),id=randomUUID()){
 const rows=[];for(let i=0;i<count;i++)rows.push(makeRevision(fixtureScope,id,headBinding(rows.at(-1)),randomUUID(),payload,'2026-09-20T00:00:00.000Z'));
 return rows;
}
async function seed(db,chain){
 for(let i=0;i<chain.length;i+=128)await db.prepare(`INSERT INTO web_planning_revision
   SELECT json_extract(value,'$.workspace_id'),json_extract(value,'$.project_id'),json_extract(value,'$.work_id'),
   json_extract(value,'$.revision'),json_extract(value,'$.fingerprint'),json_extract(value,'$.request_key'),
   json_extract(value,'$.request_fingerprint'),value FROM json_each(?)`).bind(canonical(chain.slice(i,i+128))).run();
}
function observe(db,transform=value=>value,events=[]){
 const wrap=(s,sql)=>({bind(...v){return wrap(s.bind(...v),sql);},async all(){const value=await s.all();events.push({sql,rows:value.results.length});return transform(value,sql);},first(){events.push({sql});return s.first();},run(){events.push({sql});return s.run();}});
 return {prepare(sql){return wrap(db.prepare(sql),sql);},batch:db.batch.bind(db)};
}
export async function checkCumulativeHistory({start,client,newWork,save,edit,passed,root,open}){
 const close=async s=>{await s.close();open.splice(open.indexOf(s),1);};
 const oldFolder=path.join(root,'schema-two');await mkdir(path.join(oldFolder,'meta'),{recursive:true});
 for(const f of ['0000_web_planning.sql','0001_schema_version.sql','0002_revision_files.sql'])await cp(path.resolve('apps/web_planning/drizzle',f),path.join(oldFolder,f));
 const journal=JSON.parse(await readFile('apps/web_planning/drizzle/meta/_journal.json','utf8'));journal.entries=journal.entries.slice(0,3);
 await writeFile(path.join(oldFolder,'meta/_journal.json'),JSON.stringify(journal));
 const current=(await bundleWebPlanning(path.resolve('scripts/web-planning-local-ingress.ts'))).code;
 for(const direct of [false,true]){
   const name='history-upgrade-'+(direct?'wrangler':'drizzle');
   const oldCode=await predecessorCode(predecessor,direct?'apps/web_planning/src/cloudflare-worker.ts':'scripts/web-planning-local-ingress.ts');
   let server=await start(name,{direct,code:oldCode,migrationsFolder:oldFolder}),c=await client(server);
   const w=await newWork(c,definition,[]);let r=(await save(c,w)).data.saved;
   assert.equal(r.format,'web_planning_revision.v0.1');
   let input=await edit(c,r,'Retain the unresolved qualification');input.input.material_edits=[];
   r=(await save(c,input)).data.saved;assert.equal(r.format,'web_planning_revision.v0.2');
   input=await edit(c,r,'Retain original file bytes');input.input.files=[{name:'qualified.txt',role:'source',data:Buffer.from('Unknown outcome remains unknown.').toString('base64')}];
   r=(await save(c,input)).data.saved;assert.equal(r.format,'web_planning_revision.v0.3');
   for(let n=4;n<=32;n++){input=await edit(c,r,'Normal writer revision '+n);input.input.files=r.files;r=(await save(c,input)).data.saved;assert.equal(r.revision,n);}
   const refused=await edit(c,r,'Normal writer revision 33');refused.input.files=r.files;
   assert.equal((await save(c,refused)).data.error,'history_capacity');
   const doomed=await newWork(c,definition,[]),dead=(await save(c,doomed)).data.saved;
   assert.equal((await c.request('/api/work/'+dead.work_id+'/erase',{expected:headBinding(dead),confirm:'erase-whole-work'})).status,200);
   const before=await unchanged(server),exported=(await c.request('/api/work/'+w.id+'/export')).data;
   if(!direct){
     await server.setOptions({script:current});
     assert.equal((await server.mf.dispatchFetch(server.origin+'/',{headers:{cookie:c.cookies}})).status,503,'new binary refuses schema 2');
     await server.db.batch([server.db.prepare('DROP TABLE web_planning_schema'),server.db.prepare('CREATE TABLE web_planning_schema(version integer PRIMARY KEY)'),server.db.prepare('INSERT INTO web_planning_schema VALUES (3)')]);
     assert.equal((await server.mf.dispatchFetch(server.origin+'/',{headers:{cookie:c.cookies}})).status,503,'a marker-only partial migration cannot admit old revision SQL');
     await server.db.batch([server.db.prepare('DROP TABLE web_planning_schema'),server.db.prepare('CREATE TABLE web_planning_schema(version integer PRIMARY KEY CHECK(version=2))'),server.db.prepare('INSERT INTO web_planning_schema VALUES (2)')]);
     await server.setOptions({script:oldCode});
     // A failed forward migration must roll back its earlier table copy too.
     const broken=path.join(root,'broken-history-migration');await cp(path.resolve('apps/web_planning/drizzle'),broken,{recursive:true});
     const file=path.join(broken,'0003_cumulative_history.sql');await writeFile(file,(await readFile(file,'utf8')).replace('DROP TABLE web_planning_revision_old;','INSERT INTO missing_migration_table VALUES (1);'));
     const options={port:Number(new URL(server.origin).port),bindings:server.env};await close(server);
     await assert.rejects(start(name,{...options,migrationsFolder:broken}));
     server=await start(name,{...options,code:oldCode,initialize:false});c=await client(server);assert.deepEqual(await unchanged(server),before);
   }
   const options={direct,port:Number(new URL(server.origin).port),bindings:server.env};await close(server);
   server=await start(name,options);c=await client(server);
   assert.deepEqual(await unchanged(server),before,'migration copies exact rows, files, mapping and tombstones');
   assert.deepEqual((await c.request('/api/work/'+w.id+'/export')).data,exported);
   assert.deepEqual((await server.db.prepare('PRAGMA foreign_key_check').all()).results,[]);
   await server.setOptions({script:oldCode});assert.equal((await server.mf.dispatchFetch(server.origin+'/',{headers:{cookie:c.cookies}})).status,503,'old binary refuses schema 3');
   const newCode=direct?(await bundleWebPlanning(path.resolve('apps/web_planning/src/cloudflare-worker.ts'))).code:current;
   await server.setOptions({script:newCode});c=await client(server);
   input=await edit(c,r,'Same saved work at revision 33');input.input.files=r.files;
   r=(await save(c,input)).data.saved;assert.equal(r.revision,33);
   assert.equal((await c.request('/api/work/'+r.work_id+'/context',{expected:headBinding(r)})).status,200);
   const url=`/api/work/${r.work_id}/files/${r.revision}/${r.fingerprint.slice(7)}/0`;
   assert.equal(await (await server.mf.dispatchFetch(server.origin+url,{headers:{cookie:c.cookies}})).text(),'Unknown outcome remains unknown.');
   const oldCsrf=c,expired=await edit(c,r,'Expired mutation must refuse');expired.input.files=r.files;
   // Real fresh workerd process, same D1 and seals, now four days later.
   const again={...options,code:advancedClock(newCode)};await close(server);server=await start(name,again);c=await client(server);
   assert.equal((await c.request('/api/work/'+r.work_id)).data.saved.fingerprint,r.fingerprint);
   assert.equal((await server.mf.dispatchFetch(server.origin+'/api/drafts',{method:'POST',headers:{cookie:oldCsrf.cookies,origin:server.origin,'content-type':'application/json','x-csrf-token':oldCsrf.csrf},body:JSON.stringify(scope)})).status,403);
   assert.equal((await save(c,expired)).data.error,'save_ticket_expired');
   assert.equal((await c.request('/api/work/'+r.work_id+'/resolve',input.input)).data.saved.fingerprint,r.fingerprint,'original successful request reconciles after expiry');
   assert.equal((await c.request('/api/work/'+r.work_id+'/resolve',expired.input)).data.outcome,'unknown');
   input=await edit(c,r,'Fresh authorization after four days');input.input.files=r.files;
   r=(await save(c,input)).data.saved;assert.equal(r.revision,34);
   assert.deepEqual((await unchanged(server)).web_planning_revision.filter(v=>v.revision<=32),before.web_planning_revision);
   assert.equal((await save(c,doomed)).data.error,'save_ticket_expired');
   assert.equal((await c.request('/api/work/'+dead.work_id)).status,410);
   await close(server);
   passed(`history: ${direct?'Wrangler':'Drizzle'} nonempty old-writer 32 refusal, mixed v0.1/v0.2/v0.3 exact migration, 33/file/context, fresh workerd +4 days/fresh-auth 34, expired seals and request reconciliation`);
 }
 const server=await start('large-history'),c=await client(server),chain=prefix(260),id=chain[0].work_id;
 await seed(server.db,chain);
 const events=[],store={...fixtureScope,DB:observe(server.db,undefined,events)};
 const began=performance.now();assert.deepEqual(await readWork(store,id),chain);const elapsed=performance.now()-began;
 assert.equal(events.length,1);assert.equal(events[0].rows,261);
 assert.equal((await c.request('/api/work/'+id+'/context',{expected:headBinding(chain.at(-1))})).status,200);
 assert.deepEqual((await c.request('/api/work/'+id+'/history')).data.revisions,chain);
 const exported=(await c.request('/api/work/'+id+'/export')).data;assert.deepEqual(exported,exportWork(chain));
 const restore=await start('large-history-restore'),rc=await client(restore);
 await restore.db.prepare("CREATE TRIGGER fail_later_chunk BEFORE INSERT ON web_planning_revision WHEN NEW.revision=129 BEGIN SELECT RAISE(ABORT,'injected-later-chunk'); END").run();
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 assert.equal((await restore.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);
 await restore.db.prepare('DROP TRIGGER fail_later_chunk').run();
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
 assert.deepEqual((await rc.request('/api/work/'+id+'/export')).data,exported);
 // The former file URL parser had its own two-digit ceiling. A real initial
 // file save plus a labelled canonical continuation must retain revision 100.
 const fw=await newWork(c,definition,[]);fw.input.files=[{name:'history.txt',role:'source',data:Buffer.from('Exact historical file bytes').toString('base64')}];
 const fileHead=(await save(c,fw)).data.saved,fileChain=[fileHead];
 const filePayload={definition:fileHead.definition,sources:fileHead.sources,files:fileHead.files};
 for(let n=2;n<=130;n++)fileChain.push(makeRevision(fixtureScope,fw.id,headBinding(fileChain.at(-1)),randomUUID(),filePayload,'2026-09-20T00:00:00.000Z'));
 await seed(server.db,fileChain.slice(1));
 const historical=fileChain[99],filePath=`/api/work/${fw.id}/files/100/${historical.fingerprint.slice(7)}/0`;
 assert.equal(await (await server.mf.dispatchFetch(server.origin+filePath,{headers:{cookie:c.cookies}})).text(),'Exact historical file bytes');
 const fi=await edit(c,fileChain.at(-1),'File-bearing ordinary revision 131');fi.input.files=fileHead.files;
 assert.equal((await save(c,fi)).data.saved.revision,131);
 const fileExport=(await c.request('/api/work/'+fw.id+'/export')).data;
 const fileRestore=await start('large-file-history-restore'),fc=await client(fileRestore);
 assert.equal((await fc.request('/api/reconstruct-files',{export:fileExport,confirm:'reconstruct-empty-store'})).status,200);
 assert.deepEqual((await fc.request('/api/work/'+fw.id+'/export')).data,fileExport);await close(fileRestore);
 passed('history: v0.3 canonical continuation retains revision-100 downloads, genuine ordinary revision 131 and complete file reconstruction');
 const earlier=chain.at(-1),left=await edit(c,earlier,'Competing left beyond 260'),right=await edit(c,earlier,'Competing right beyond 260');
 const race=await Promise.all([save(c,left),save(c,right)]);assert.deepEqual(race.map(v=>v.status).sort(),[200,409]);let head=race.find(v=>v.status===200).data.saved;
 const p=(await c.request('/api/work/'+id+'/branch-preview',{expected:headBinding(head),intent:{reason:'Preserve uncertainty in an independent direction'}})).data;
 let branch=(await c.request('/api/work/'+p.work_id+'/relation-save',{ticket:p.ticket,intent:p.intent})).data.saved;
 assert.deepEqual(branch.relations.origin.source,reference(head));
 for(let n=2;n<=34;n++)branch=(await save(c,await edit(c,branch,'Independent branch revision '+n))).data.saved;
 const intention={source:reference(branch),dispositions:[],rationale:'Still unresolved; no unsupported adoption',next_question:'Which observation would discriminate?'};
 const preview=()=>c.request('/api/work/'+id+'/incorporation-preview',{expected:headBinding(head),intent:{...intention,source:reference(branch)}});
 const stale=await preview();assert.equal(stale.status,200);
 branch=(await save(c,await edit(c,branch,'Source changes beyond 32'))).data.saved;
 assert.equal((await c.request('/api/work/'+id+'/relation-save',{ticket:stale.data.ticket,intent:stale.data.intent})).data.error,'refresh_required');
 const next=await preview();head=(await save(c,await edit(c,head,'Target changes beyond first 128 records'))).data.saved;
 assert.equal((await c.request('/api/work/'+id+'/relation-save',{ticket:next.data.ticket,intent:next.data.intent})).data.error,'refresh_required');
 const fresh=await preview(),merged=await c.request('/api/work/'+id+'/relation-save',{ticket:fresh.data.ticket,intent:fresh.data.intent});
 assert.equal(merged.status,200);head=merged.data.saved;assert.equal(head.revision,263);
 assert.deepEqual(head.relations.review.source,reference(branch));
 assert.equal((await c.request('/api/work/'+id+'/relation-save',{ticket:fresh.data.ticket,intent:fresh.data.intent})).data.saved.fingerprint,head.fingerprint);
 assert.equal((await c.request('/api/work/'+id+'/relation-save',{ticket:fresh.data.ticket,intent:{...fresh.data.intent,rationale:'altered'}})).data.error,'altered_replay');
 const savedChain=(await c.request('/api/work/'+id+'/history')).data.revisions;
 // Corrupt/incomplete observation controls wrap results of the real atomic D1
 // query. There are no separate history pages to combine or silently omit.
 for(const [name,change] of [
   ['lost summary',rows=>rows.slice(1)],['lost all observations',()=>[]],
   ['missing middle',rows=>rows.filter(r=>r.revision!==129)],['missing tail',rows=>rows.slice(0,-1)],
   ['reordered',rows=>[rows[0],...rows.slice(1).reverse()]],
   ['malformed',rows=>rows.map(r=>r.revision===129?{...r,envelope:'{bad'}:r)],
   ['foreign',rows=>rows.map(r=>r.revision===129?{...r,envelope:r.envelope.replace(fixtureScope.project_id,randomUUID())}:r)],
   ['duplicate request',rows=>rows.map(r=>r.revision===129?{...r,request_key:savedChain[0].request_key,envelope:r.envelope.replace(savedChain[128].request_key,savedChain[0].request_key)}:r)],
 ])await assert.rejects(readWork({...fixtureScope,DB:observe(server.db,value=>({results:change(value.results)}))},id),undefined,name);
 const limited={...fixtureScope,historyRead:{rows:10*HISTORY_READ_ROWS,bytes:0},DB:server.db};
 await assert.rejects(readWork(limited,id),e=>e.code==='operation_read_budget_exceeded');
 const budget=boundedDatabase(server.db);for(let i=0;i<40;i++)await budget.prepare('SELECT 1').first();assert.throws(()=>budget.prepare('SELECT 1').first(),e=>e.code==='operation_query_budget_exceeded');
 passed('history: 260-row canonical prefix, one atomic read, complete chunked reconstruction and later-chunk rollback; real >32 branch/incorporation, later-history source/target drift, replay and incomplete-observation refusals');
 // Exact count and byte boundaries, using canonical fixtures in disposable D1.
 const full=prefix(HISTORY_READ_ROWS);assertHistoryBudget(full);await seed(server.db,full);
 const fr=await c.request('/api/work/'+full[0].work_id);assert.equal(fr.status,200);
 const fedit=await edit(c,fr.data.saved,'Over row operation budget');assert.equal((await save(c,fedit)).data.error,'history_read_budget_exceeded');
 assert.equal((await c.request('/api/work/'+full[0].work_id+'/history')).data.revisions.length,HISTORY_READ_ROWS);
 const beyond=makeRevision(fixtureScope,full[0].work_id,headBinding(full.at(-1)),randomUUID(),normalizePayload(fixtureScope,definition,[]),'2026-09-20T00:00:00.000Z');await seed(server.db,[beyond]);
 assert.equal((await c.request('/api/work/'+full[0].work_id)).data.error,'history_read_budget_exceeded');
 const largePayload=normalizePayload(fixtureScope,definition,[{text:'x'.repeat(2000),source:'Synthetic bytes',provenance:'user_declaration',observed_at:null,label:'Open question'}]);
 const bytes=prefix(1,largePayload);while(canonicalBytes(bytes)<=HISTORY_READ_BYTES)bytes.push(makeRevision(fixtureScope,bytes[0].work_id,headBinding(bytes.at(-1)),randomUUID(),largePayload,'2026-09-20T00:00:00.000Z'));
 const over=bytes.pop();await seed(server.db,bytes);assert.equal((await c.request('/api/work/'+bytes[0].work_id)).status,200);
 assert.equal((await save(c,await edit(c,bytes.at(-1),definition.goal))).data.error,'history_read_budget_exceeded');
 await seed(server.db,[over]);assert.equal((await c.request('/api/work/'+over.work_id+'/export')).data.error,'history_read_budget_exceeded');
 const delayed=await edit(c,head,'Delayed save must not resurrect');
 assert.equal((await c.request('/api/work/'+id+'/erase',{expected:headBinding(head),confirm:'erase-whole-work'})).status,200);
 assert.equal((await save(c,delayed)).status,410);assert.equal((await c.request('/api/work/'+id)).status,410);
 assert.equal((await c.request('/api/work/'+branch.work_id+'/context',{expected:headBinding(branch)})).status,200);
 assert.equal((await rc.request('/api/work/'+id+'/erase',{expected:headBinding(earlier),confirm:'erase-whole-work'})).status,200);
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 console.log(JSON.stringify({cumulative_history_measurement:{fixture:'canonical constructed prefix',revisions:260,queries:events.length,returned_rows:events[0].rows,envelope_bytes:canonicalBytes(chain),elapsed_ms:Math.round(elapsed),read_snapshot:'single primary SQL statement',reconstruction_chunk_rows:128,reconstruction_chunk_bytes:200000,normal_writer_crossing:[31,32,33,34],byte_boundary:{last_readable_revisions:bytes.length,bytes:canonicalBytes(bytes),refused_bytes:canonicalBytes([...bytes,over])},provider_egress:0,hosted_acceptance:false}}));
 passed('history: retained row/byte/query budgets fail explicitly, erased IDs prevent delayed writes/reconstruction and independent branch survives');
 await close(restore);await close(server);
}
