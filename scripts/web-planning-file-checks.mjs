import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, hash, headBinding, reference, selectedWorkSourceInput } from '../apps/web_planning/src/contract.ts';
import { digestBytes, FILE_LIMIT, FILE_EXPORT_REQUEST_BYTES, historyFiles, validateFileExport } from '../apps/web_planning/src/files.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { predecessorCode } from './web-planning-branch-checks.mjs';
import { capacityEnvelopeEstimates } from './web-planning-capacity-fixture.mjs';
import { fileFixtures, uploadFiles } from './web-planning-file-fixtures.mjs';

const fileUrl=(r,i)=>`/api/work/${r.work_id}/files/${r.revision}/${r.fingerprint.slice(7)}/${i}`;
export async function checkFiles({start,client,newWork,save,passed,root,open}) {
 // Upgrade the last accepted hosted source through its real writer and the
 // direct host's pinned Wrangler migration ledger, not a fabricated v0.2 row.
 const deployed='7d4320a4c6ebd08f2f8b4e530f5150d972a58ec1';
 let old=await start('nonempty-v2-direct',{direct:true,code:await predecessorCode(deployed,'apps/web_planning/src/cloudflare-worker.ts'),migrationsFolder:path.join(root,'pre-files-migrations')});
 let oc=await client(old,{entryHeaders:{'sec-fetch-site':'none','sec-fetch-mode':'navigate','sec-fetch-dest':'document'}});
 const ow=await newWork(oc);const or1=(await save(oc,ow)).data.saved;
 const ot=await oc.request(`/api/work/${ow.id}/ticket`,{expected:headBinding(or1)});
 const or2=(await save(oc,{id:ow.id,input:{...ow.input,ticket:ot.data.ticket,material_edits:ow.input.notes.map(()=>({dependencies:[],adapts:null}))}})).data.saved;
 assert.equal(or2.format,'web_planning_revision.v0.2');
 const oldBytes=await (await old.mf.dispatchFetch(old.origin+`/api/work/${ow.id}/export`,{headers:{cookie:oc.cookies}})).text();
 const rowsBefore=(await old.db.prepare('SELECT envelope FROM web_planning_revision ORDER BY revision').all()).results;
 const options={direct:true,port:Number(new URL(old.origin).port),bindings:old.env};
 await old.close();open.splice(open.indexOf(old),1);old=await start('nonempty-v2-direct',options);oc=await client(old);
 assert.equal(await (await old.mf.dispatchFetch(old.origin+`/api/work/${ow.id}/export`,{headers:{cookie:oc.cookies}})).text(),oldBytes);
 assert.deepEqual((await old.db.prepare('SELECT envelope FROM web_planning_revision ORDER BY revision').all()).results,rowsBefore);
 assert.deepEqual((await old.db.prepare('SELECT name FROM d1_migrations ORDER BY id').all()).results.map(r=>r.name),['0000_web_planning.sql','0001_schema_version.sql','0002_revision_files.sql']);
 passed('files: accepted hosted 7d4320a writer creates mixed v0.1/v0.2 history; pinned Wrangler upgrades nonempty D1 once with byte-identical envelopes/export');
 const server=await start('files'),c=await client(server);
 const count=async table=>(await server.db.prepare(`SELECT count(*) n FROM ${table}`).first()).n;
 // Protect quota semantics independently of application admission. Local D1
 // checks do not qualify the provider's remote migration parsing path.
 const checkFullQuota=async (workId,overflow,code)=>{
   const scope=[fixtureScope.workspace_id,fixtureScope.project_id,workId];
   const totals=()=>server.db.prepare('SELECT count(*) n,SUM(bytes) bytes FROM web_planning_file WHERE workspace_id=? AND project_id=? AND work_id=?').bind(...scope).first();
   const before=await totals();
   const existing=await server.db.prepare('SELECT digest,bytes,body FROM web_planning_file WHERE workspace_id=? AND project_id=? AND work_id=? LIMIT 1').bind(...scope).first();
   await server.db.prepare('INSERT OR IGNORE INTO web_planning_file VALUES (?,?,?,?,?,?)').bind(...scope,existing.digest,existing.bytes,Buffer.from(existing.body)).run();
   assert.deepEqual(await totals(),before,'a duplicate at the quota must remain a no-op');
   const markerWork=randomUUID(),marker=Buffer.from('batch marker');
   await assert.rejects(server.db.batch([
     server.db.prepare('INSERT INTO web_planning_file VALUES (?,?,?,?,?,?)').bind(fixtureScope.workspace_id,fixtureScope.project_id,markerWork,digestBytes(marker),marker.length,marker),
     server.db.prepare('INSERT INTO web_planning_file VALUES (?,?,?,?,?,?)').bind(...scope,digestBytes(overflow),overflow.length,overflow),
   ]),new RegExp(code));
   assert.equal((await server.db.prepare('SELECT count(*) n FROM web_planning_file WHERE work_id=?').bind(markerWork).first()).n,0,'quota failure must roll back the preceding batch write');
   assert.deepEqual(await totals(),before,'quota failure must preserve the full work');
 };
 const read=id=>c.request('/api/work/'+id);
 const write=async (r,files,goal=r.definition.goal)=>{
   const content={definition:{...r.definition,goal},notes:r.sources.map(selectedWorkSourceInput),files};
   const t=await c.request(`/api/work/${r.work_id}/ticket`,{expected:headBinding(r),...content});
   assert.equal(t.status,200,JSON.stringify(t.data));return {id:r.work_id,input:{...content,ticket:t.data.ticket}};
 };
 const raw=(url,headers={})=>server.mf.dispatchFetch(server.origin+url,{headers:{cookie:c.cookies,...headers}});
 assert.deepEqual(fileFixtures.map(f=>f.bytes.length),[13634,12601,39801,3180]);
 const w=await newWork(c);w.input.files=uploadFiles(fileFixtures);
 let result=await save(c,w);assert.equal(result.status,200,JSON.stringify(result.data));const first=result.data.saved;let r=first;
 assert.equal(r.format,'web_planning_revision.v0.3');assert.equal(r.files.length,4);
 const rows=await server.db.prepare('SELECT digest,bytes,typeof(body) kind,length(body) size FROM web_planning_file').all();
 assert(rows.results.every(f=>f.kind==='blob'&&f.size===f.bytes));assert.equal(rows.results.reduce((n,f)=>n+f.bytes,0),69216);
 const context=await c.request(`/api/work/${r.work_id}/context`,{expected:headBinding(r)});assert.match(context.data,/Download 보고서/);assert(!context.data.includes(fileFixtures[0].bytes.toString('base64')));
 const downloadDir=path.join(root,'download-only-successor');await mkdir(downloadDir);
 for(const [i,f] of fileFixtures.entries()) {
   const response=await raw(fileUrl(r,i));assert.equal(response.status,200);
   assert.equal(response.headers.get('content-type'),'application/octet-stream');assert.match(response.headers.get('content-disposition'),/attachment; filename="artifact.bin"; filename\*=UTF-8''/);
   assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,f.bytes);assert.equal(digestBytes(bytes),r.files[i].digest);
   await writeFile(path.join(downloadDir,f.name),bytes);
 }
 let childOutput='';
 const child=await runCanonicalChild({suite:'web-planning',label:'download-only-synthetic-continuation',command:process.execPath,
   args:['analysis.mjs','results.json'],cwd:downloadDir,env:process.env,timeoutMs:10000,stdout:{write(chunk){childOutput+=chunk.toString();}}});
 assert.equal(canonicalChildAcceptanceFailure(child,{requireNaturalExit:true}),null);
 // Read the child result, not producer-private inputs. This is same-Mac feasibility only.
 assert.match(childOutput,/"sum":499500/);assert.match(childOutput,/"mean":499.5/);
 passed('revision files: actual D1 BLOBs and authenticated inert byte downloads; 69,216-byte synthetic bundle; downloaded-only same-Mac continuation gives n=1000 sum=499500 mean=499.5');
 assert.equal((await save(c,w)).data.saved.fingerprint,r.fingerprint);assert.equal(await count('web_planning_file'),4);
 const altered={...w,input:{...w.input,files:uploadFiles([{...fileFixtures[0],bytes:Buffer.from('changed')}])}};
 assert.equal((await save(c,altered)).data.error,'altered_replay');
 const noteOnly={...w,input:{...w.input}};delete noteOnly.input.files;
 const legacy=await c.request(`/api/work/${r.work_id}/ticket`,{expected:headBinding(r)});
 assert.equal((await save(c,{id:r.work_id,input:{...noteOnly.input,ticket:legacy.data.ticket}})).data.error,'explicit_file_selection_required');
 const successor=await write(r,[...r.files,{name:'followup.json',role:'results',data:Buffer.from(childOutput).toString('base64')}],'Record the bounded synthetic continuation');
 assert.equal((await c.request(`/api/work/${r.work_id}/resolve`,successor.input)).data.outcome,'unknown');
 await save(c,successor); // Lost acknowledgement after actual commit.
 r=(await c.request(`/api/work/${r.work_id}/resolve`,successor.input)).data.saved;assert.equal(r.revision,2);
 assert.equal((await save(c,successor)).data.saved.fingerprint,r.fingerprint);assert.equal(await count('web_planning_file'),5);
 assert.deepEqual(Buffer.from(await (await raw(fileUrl(first,0))).arrayBuffer()),fileFixtures[0].bytes);
 assert.equal((await c.request(`/api/work/${r.work_id}/context`,{expected:headBinding(first)})).status,409);
 assert.equal((await raw(fileUrl({...r,fingerprint:'sha256:'+'0'.repeat(64)},0))).status,409);
 assert.equal((await raw(fileUrl({...r,work_id:randomUUID()},0))).status,409);
 assert.equal((await raw(fileUrl(r,0),{cookie:'web_planning_local=wrong'})).status,403);
 assert.equal((await raw(fileUrl(r,0),{origin:'https://foreign.example'})).status,403);
 assert.equal((await c.request(`/api/work/${r.work_id}/save`,successor.input,{'x-csrf-token':'wrong'})).status,403);
 assert.equal((await c.request(`/api/work/${r.work_id}/save`,{...successor.input,workspace_id:randomUUID()})).status,403);
 assert.equal((await c.request(`/api/work/${r.work_id}/branch-preview`,{expected:headBinding(r),intent:{reason:'Do not silently copy attachments'}})).data.error,'file_branch_selection_unsupported');
 passed('files: exact historical binding; stale/foreign/auth/CSRF refusal; explicit selection; altered replay; lost acknowledgement resolves without duplicate bodies; branch copy refuses explicitly');
 const exported=(await c.request(`/api/work/${r.work_id}/export`)).data;
 assert.equal(exported.files.length,5);validateFileExport(fixtureScope,exported);
 const replacement=await start('files-reconstruction'),rc=await client(replacement);
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,422);
 const reconstructed=await rc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'});assert.equal(reconstructed.status,200,JSON.stringify(reconstructed.data));
 assert.deepEqual((await rc.request(`/api/work/${r.work_id}/export`)).data,exported);
 const portable=path.join(root,'synthetic-complete-file-export.json');await writeFile(portable,canonical(exported));
 for(const mutate of [
   e=>e.files.pop(),e=>e.files.push(e.files[0]),e=>e.files[0].data=e.files[0].data.slice(0,-4),
   e=>e.files[0].data=Buffer.from('corrupt').toString('base64'),e=>e.revisions[0].files[0].bytes++,
   e=>e.revisions[0].project_id=randomUUID(),
 ]) {const damaged=structuredClone(exported);mutate(damaged);const {fingerprint,...content}=damaged;damaged.fingerprint=hash(canonical(content));assert.throws(()=>validateFileExport(fixtureScope,damaged));}
 const empty=await start('files-import-fault'),ec=await client(empty);
 await empty.db.prepare("CREATE TRIGGER injected_file_failure BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic-file-fault'); END").run();
 assert.equal((await ec.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,503);
 for(const table of ['web_planning_revision','web_planning_file'])assert.equal((await empty.db.prepare(`SELECT count(*) n FROM ${table}`).first()).n,0);
 passed('files: complete portable bytes roundtrip; missing/extra/truncated/corrupt/wrong-scope refusals; failed reconstruction rolls back all revisions and bodies');
 // Body-write and erasure failures must roll back the revision/marker too.
 const failedAppend=await write(r,[...r.files,{name:'fault.txt',role:'other',data:'Yw=='}]);
 await server.db.prepare("CREATE TRIGGER injected_body_failure BEFORE INSERT ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic-body-fault'); END").run();
 assert.equal((await save(c,failedAppend)).status,503);
 assert.equal((await c.request(`/api/work/${r.work_id}/resolve`,failedAppend.input)).data.outcome,'unknown');
 assert.deepEqual((await c.request(`/api/work/${r.work_id}/export`)).data,exported);
 await server.db.prepare('DROP TRIGGER injected_body_failure').run();
 await server.db.prepare("CREATE TRIGGER injected_body_erase BEFORE DELETE ON web_planning_file BEGIN SELECT RAISE(ABORT,'synthetic-erase-fault'); END").run();
 assert.equal((await c.request(`/api/work/${r.work_id}/erase`,{expected:headBinding(r),confirm:'erase-whole-work'})).status,503);
 assert.equal(await count('web_planning_erased'),0);assert.deepEqual((await c.request(`/api/work/${r.work_id}/export`)).data,exported);
 await server.db.prepare('DROP TRIGGER injected_body_erase').run();
 // Known corruption in a disposable store must never yield a complete success.
 const digest=r.files[0].digest;
 await server.db.prepare('UPDATE web_planning_file SET body=? WHERE work_id=? AND digest=?').bind(Buffer.alloc(r.files[0].bytes),r.work_id,digest).run();
 assert.equal((await raw(fileUrl(r,0))).status,409);assert.equal((await c.request(`/api/work/${r.work_id}/export`)).data.error,'file_content_integrity');
 await server.db.prepare('UPDATE web_planning_file SET body=? WHERE work_id=? AND digest=?').bind(fileFixtures[0].bytes,r.work_id,digest).run();
 const missing=await start('files-missing'),mc=await client(missing);
 assert.equal((await mc.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
 await missing.db.prepare('DELETE FROM web_planning_file WHERE digest=?').bind(digest).run();
 for(const suffix of ['', '/export','/context'])assert.equal((await mc.request(`/api/work/${r.work_id}${suffix}`,suffix==='/context'?{expected:headBinding(r)}:undefined)).data.error,'file_content_unavailable');
 passed('files: body-write and body-erase faults roll back revisions/marker; corrupted downloads/export and missing-content reads refuse completeness');
 const concurrent=await newWork(c);concurrent.input.files=[{name:'base.txt',role:'other',data:'YQ=='}];const cr=(await save(c,concurrent)).data.saved;
 const left=await write(cr,[...cr.files,{name:'left',role:'other',data:'Yg=='}]),right=await write(cr,[...cr.files,{name:'right',role:'other',data:'Yw=='}]);
 const saves=await Promise.all([save(c,left),save(c,right)]);assert.equal(saves.filter(x=>x.status===200).length,1);assert(saves.every(x=>[200,409,503].includes(x.status)));
 const concurrentExport=(await c.request(`/api/work/${cr.work_id}/export`)).data;assert.equal(concurrentExport.revisions.length,2);assert.equal(concurrentExport.files.length,2);
 const counts=await newWork(c);counts.input.files=Array.from({length:8},(_,i)=>({name:'count-'+i,role:'other',data:Buffer.from([i]).toString('base64')}));let nr=(await save(c,counts)).data.saved;
 nr=(await save(c,await write(nr,Array.from({length:8},(_,i)=>({name:'count-'+(i+8),role:'other',data:Buffer.from([i+8]).toString('base64')}))))).data.saved;
 const nt=await c.request(`/api/work/${nr.work_id}/ticket`,{expected:headBinding(nr)});
 assert.equal((await save(c,{id:nr.work_id,input:{...counts.input,ticket:nt.data.ticket,files:[{name:'17th',role:'other',data:Buffer.from([16]).toString('base64')}]}})).data.error,'file_history_count_exceeded');
 await assert.rejects(server.db.prepare('INSERT INTO web_planning_file VALUES (?,?,?,?,?,?)').bind(fixtureScope.workspace_id,fixtureScope.project_id,nr.work_id,'sha256:'+'f'.repeat(64),1,Buffer.from([16])).run(),/file_history_count_exceeded/);
 await checkFullQuota(nr.work_id,Buffer.from([16]),'file_history_count_exceeded');
 passed('files: competing same-head saves leave only winner bodies; 16 unique-body history count enforced in both admission and SQL');
 const largestManifest=Array.from({length:8},(_,i)=>({name:'"'.repeat(159)+i,role:'results',bytes:262144,digest:'sha256:'+'f'.repeat(64)}));
 const exportBound=capacityEnvelopeEstimates(fixtureScope)[0].request_bytes_upper_bound+32*Buffer.byteLength(',"files":'+canonical(largestManifest))+1398144+4096;
 assert(exportBound<FILE_EXPORT_REQUEST_BYTES);
 assert.equal((await c.request('/api/reconstruct-files',{export:'x'.repeat(FILE_EXPORT_REQUEST_BYTES),confirm:'reconstruct-empty-store'})).status,413);
 console.log(JSON.stringify({file_export_conservative_request_bound:exportBound,limit:FILE_EXPORT_REQUEST_BYTES,body_insert_max_parameters:59,reconstruction_batch_max_statements:34}));
 const maxFile=n=>({name:`bounded-${n}.bin`,role:'other',data:Buffer.alloc(FILE_LIMIT,n).toString('base64')});
 const invalid=await newWork(c);
 for(const [files,code] of [
   [Array.from({length:9},(_,i)=>({name:String(i),role:'other',data:''})),'file_count_exceeded'],
   [[{name:'large',role:'other',data:Buffer.alloc(FILE_LIMIT+1).toString('base64')}],'file_bytes_exceeded'],
   [[maxFile(1),maxFile(2),maxFile(3)],'file_selection_bytes_exceeded'],
   [[{name:'../bad',role:'other',data:''}],'invalid_file_name_or_role'],
   [[{name:'bad\r\nheader',role:'other',data:''}],'invalid_file_name_or_role'],
   [[{name:'a'.repeat(161),role:'other',data:''}],'invalid_file_name_or_role'],
   [[{name:'bad',role:'other',data:'YQ'}],'invalid_file_encoding'],
   [[{name:'one',role:'other',data:'AB=='}],'invalid_file_encoding'],
   [[...r.files,{...r.files[0],name:'foreign'}],'file_not_in_saved_selection'],
 ]) {const refused=await save(c,{...invalid,input:{...invalid.input,files}});assert.equal(refused.data.error,code,JSON.stringify(refused));}
 assert.equal((await read(invalid.id)).status,404);assert.equal((await server.db.prepare('SELECT count(*) n FROM web_planning_file WHERE work_id=?').bind(r.work_id).first()).n,5);
 const q=await newWork(c);q.input.files=[maxFile(1),maxFile(2)];let qr=(await save(c,q)).data.saved;
 qr=(await save(c,await write(qr,[maxFile(3),maxFile(4)]))).data.saved;
 assert.equal([...historyFiles((await c.request(`/api/work/${q.id}/history`)).data.revisions).values()].reduce((a,b)=>a+b),1048576);
 const qt=await c.request(`/api/work/${q.id}/ticket`,{expected:headBinding(qr)});
 const exceed={...q.input,ticket:qt.data.ticket,files:[{name:'extra',role:'other',data:'YQ=='}]};
 assert.equal((await c.request(`/api/work/${q.id}/save`,exceed)).data.error,'file_history_bytes_exceeded');
 assert.equal((await read(q.id)).data.saved.revision,2);
 // SQL quota refusal under concurrent admission, independent of application preflight.
 const raceId=randomUUID(),scope=[fixtureScope.workspace_id,fixtureScope.project_id,raceId];
 const insert=n=>server.db.prepare('INSERT INTO web_planning_file VALUES (?,?,?,?,?,?)').bind(...scope,'sha256:'+String(n).padStart(64,'0'),FILE_LIMIT,Buffer.alloc(FILE_LIMIT,n));
 await server.db.batch([insert(1),insert(2),insert(3)]);
 const race=await Promise.allSettled([insert(4).run(),insert(5).run()]);assert.equal(race.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await server.db.prepare('SELECT SUM(bytes) n FROM web_planning_file WHERE work_id=?').bind(raceId).first()).n,1048576);
 await checkFullQuota(raceId,Buffer.from([99]),'file_history_bytes_exceeded');
 passed('files: duplicate bodies remain no-ops at both full SQL quotas; count and byte refusals roll back preceding batch writes');
 await server.db.prepare('DELETE FROM web_planning_file WHERE work_id=?').bind(raceId).run();
 const z=await newWork(c);z.input.files=[{name:'空.txt',role:'other',data:''}];const zr=(await save(c,z)).data.saved;
 assert.equal((await raw(fileUrl(zr,0))).headers.get('content-length'),'0');
 passed('files: exact per-file/selection/history limits, strict Unicode names/base64, zero-byte identity and concurrent SQL quota admission; no refused-upload orphan');
 // Saving versus erasing shares the exact head gate and transactional file insertion.
 const change=await write(r,[...r.files,{name:'race.txt',role:'other',data:'Yg=='}]);
 const outcome=await Promise.all([save(c,change),c.request(`/api/work/${r.work_id}/erase`,{expected:headBinding(r),confirm:'erase-whole-work'})]);
 if(outcome[0].status===200){r=outcome[0].data.saved;assert.equal(outcome[1].status,409);assert.equal((await c.request(`/api/work/${r.work_id}/erase`,{expected:headBinding(r),confirm:'erase-whole-work'})).status,200);}
 else {assert.equal(outcome[1].status,200);assert([409,410].includes(outcome[0].status));}
 assert.equal((await save(c,change)).status,410);assert.equal((await raw(fileUrl(first,0))).status,410);
 for(const table of ['web_planning_revision','web_planning_file'])assert.equal((await server.db.prepare(`SELECT count(*) n FROM ${table} WHERE work_id=?`).bind(r.work_id).first()).n,0);
 assert.deepEqual((await rc.request(`/api/work/${r.work_id}/export`)).data,exported);
 passed('files: save/erase race has an atomic outcome; all owned history/body metadata erased; tombstone blocks retry; independently reconstructed copy remains');
}
