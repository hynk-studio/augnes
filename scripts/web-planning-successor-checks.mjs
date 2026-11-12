import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { headBinding, canonical, hash } from '../apps/web_planning/src/contract.ts';
import { authorize } from '../apps/web_planning/src/access.ts';
import { continuationContext, writeContinuation } from '../apps/web_planning/src/continuation.ts';
import { openFileContinuation } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { directionExport } from '../apps/web_planning/src/direction-recovery.ts';
import { CONTINUATION_EXPORT } from '../apps/web_planning/src/continuation-contract.ts';
import { LARGE_EXPORT } from '../apps/web_planning/src/exchange.ts';
import { FILE_EXPORT_FORMAT, FILE_EXPORT_REQUEST_BYTES, LARGE_PAIR_REQUEST_BYTES } from '../apps/web_planning/src/files.ts';
import { projectSession as session, projectOk as ok, projectAgentSession as agent, projectBindings as bindings, projectInput as input } from './web-planning-project-checks.mjs';

export function checkContinuationDirectionBudget(){
  // Exercise the pair envelope's format-dependent byte boundary independently
  // of revision validation. Succession must preserve the existing large limit.
  const payload='x'.repeat(FILE_EXPORT_REQUEST_BYTES);
  for(const format of [LARGE_EXPORT,CONTINUATION_EXPORT])assert.doesNotThrow(()=>directionExport([{format,payload},{format:FILE_EXPORT_FORMAT}]));
  assert.throws(()=>directionExport([{format:FILE_EXPORT_FORMAT,payload},{format:FILE_EXPORT_FORMAT}]),/reconstruction_budget_exceeded/);
  assert.throws(()=>directionExport([{format:CONTINUATION_EXPORT,payload:'x'.repeat(LARGE_PAIR_REQUEST_BYTES)}]),/reconstruction_budget_exceeded/);
}
export async function checkWorkContinuation({start,root,passed}) {
  checkContinuationDirectionBudget();
  const s=await start('work-succession',{bindings:bindings()}),entry=await session(s,'A');
  const created=await ok(entry,'/api/projects',input('A')),other=await ok(entry,'/api/projects',{...input('A'),name:'Unshared project'});
  const p=created.project,id=p.continuation_work_id,owner=await session(s,'A',p),work='/api/work/'+id,grants=work+'/continuation';
  let head=created.saved;
  const grantInput=()=>({grant_id:randomUUID(),expected:headBinding(head),recipient:s.env.LOCAL_PARTICIPANT_LOGIN,
    obligation:'Confirm the arrival time before sending the notice; retain the unknown room-noise condition.',expires:Date.now()+3600000,max_updates:2,confirm:'share-this-work-history'});
  const gi=grantInput();
  assert.deepEqual(await ok(owner,grants+'/resolve',{grant_id:gi.grant_id}),{outcome:'unknown',grant:null});
  assert.deepEqual((await ok(owner,grants)).grants,[],'grant reconciliation cannot create access');
  const g=await ok(owner,grants+'/create',gi);
  assert.deepEqual(await ok(owner,grants+'/resolve',{grant_id:gi.grant_id}),{outcome:'created',grant:g});
  assert.deepEqual(await ok(owner,grants+'/create',gi),g);
  assert.equal((await owner.request(grants+'/create',{...gi,max_updates:3})).status,409);
  assert.equal((await owner.request(grants+'/create',{...grantInput(),recipient:'not-admitted@example.test'})).status,403);
  const delegate=await session(s,'B',p,'/continue/'+g.id),api='/api/continuation/'+g.id;
  const context=await ok(delegate,api);
  assert.deepEqual(context.saved,head);assert.equal(context.remaining_updates,2);
  assert(context.obligation.includes('unknown room-noise'));
  assert(!JSON.stringify(context).includes(other.project.project_id));
  const report={request_key:randomUUID(),expected:headBinding(head),report:'The venue email confirms arrival at 18:00. Evening noise is still unmeasured.',next_action:'Ask the venue about the noise limit before sending the notice.'};
  assert.equal((await ok(delegate,api+'/resolve',{request_key:report.request_key})).outcome,'unknown');
  await ok(delegate,api+'/save',report); // Deliberately discard a committed acknowledgement.
  const fresh=await session(s,'B',p,'/continue/'+g.id);
  const resolved=await ok(fresh,api+'/resolve',{request_key:report.request_key});
  assert.equal(resolved.outcome,'saved');head=resolved.saved;
  assert.deepEqual(await ok(fresh,api+'/save',report),{outcome:'saved',saved:head});
  assert.equal((await fresh.request(api+'/save',{...report,report:'Changed after submission'})).status,409);
  assert.deepEqual(head.definition,created.saved.definition);assert.deepEqual(head.sources,created.saved.sources);
  assert.equal(head.author_ref,p.author_ref);assert.equal(head.continuation.principal_ref,hash(s.env.LOCAL_PARTICIPANT_LOGIN));
  assert.equal(head.continuation.issuer_ref,hash(s.env.OWNER_EMAIL));
  assert.equal((await ok(fresh,api)).remaining_updates,1);
  assert.deepEqual((await ok(owner,work+'/history')).revisions[0],created.saved);
  assert.equal((await ok(owner,'/api/works')).items[0].latest_continuation.report,report.report);
  passed('successor: a separately signed-in fresh client reads existing purpose, source-grounded work and obligation; saves an attributed next step; reconciles a lost response without duplicate effects or changing historical authorship');

  for(const url of [work,work+'/history',work+'/export',grants, '/api/project','/api/works']){
    assert.equal((await fresh.request(url,undefined,{'x-web-planning-project':p.project_id})).status,403,url);
  }
  assert.equal((await fresh.request(api,undefined,{'x-web-planning-project':other.project.project_id})).status,403);
  assert.equal((await owner.request(api)).status,403,'issuer is not the successor');
  assert.equal((await fresh.request(api+'/save',{...report,principal_ref:s.env.OWNER_EMAIL})).status,422);
  assert.equal((await fresh.request(api+'/erase',{confirm:'erase-whole-work'})).status,403);
  const distinct=await ok(owner,grants+'/create',grantInput()),second=await session(s,'B',p,'/continue/'+distinct.id);
  const mixed=await second.request('/api/continuation/'+distinct.id+'/save',{...report,request_key:randomUUID(),expected:headBinding(head)},
    {cookie:fresh.cookies,'x-csrf-token':fresh.csrf});
  assert.equal(mixed.status,403,'a CSRF session cannot change delegation');
  const setup=await ok(fresh,api+'/setup'),setupPath=path.join(root,'successor-setup.json');
  await writeFile(setupPath,JSON.stringify(setup),{mode:0o600});
  await agent(s,'B',async()=>{
    const client=await openFileContinuation(setupPath);assert.deepEqual((await client.read()).saved,head);
    assert.equal((await client.resolve(report.request_key)).saved.fingerprint,head.fingerprint);
  });
  await writeFile(setupPath,JSON.stringify({...setup,work_id:other.project.continuation_work_id}));
  await agent(s,'B',()=>assert.rejects(openFileContinuation(setupPath),/Continuation selection changed/));
  await writeFile(setupPath,JSON.stringify(setup));
  const next={...report,expected:headBinding(head),report:'Noise limit is 40 dBA according to the venue response.',next_action:'Check the 18:00 room measurement against 40 dBA.'};
  const race=await Promise.all([1,2].map(()=>fresh.request(api+'/save',{...next,request_key:randomUUID()})));
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);head=race.find(r=>r.status===200).data.saved;
  assert.equal((await ok(fresh,api)).remaining_updates,0);
  assert.equal((await fresh.request(api+'/save',{...next,request_key:randomUUID(),expected:headBinding(head)})).status,409);
  assert.equal((await ok(await session(s,'B',p,'/continue/'+g.id),api)).remaining_updates,0,'fresh sessions cannot reset the grant budget');
  passed('scope and limits: unshared projects, owner APIs, erasure, edited setup and cross-grant CSRF refuse; concurrent writes consume only the permitted number of updates across fresh sessions');

  // Admit an operation, then revoke via the ordinary owner route before its
  // INSERT. The SQL gate must refuse despite its already-read JS context.
  const request=new Request(s.origin+'/api/continuation/'+distinct.id);
  const access=await authorize(request,{...s.env,DB:s.db},{login:s.env.LOCAL_PARTICIPANT_LOGIN,localFixture:true},undefined,false,distinct.id);
  const before=await continuationContext(access);
  await ok(owner,grants+'/revoke',{grant_id:distinct.id});
  await assert.rejects(writeContinuation(access,before,{workspace_id:p.workspace_id,project_id:p.project_id,...next,expected:headBinding(head),request_key:randomUUID()}),/continuation_unavailable/);
  assert.equal((await ok(owner,work)).saved.fingerprint,head.fingerprint,'revoke racing an admitted save commits nothing');
  await ok(owner,grants+'/revoke',{grant_id:g.id});
  for(const suffix of ['','/setup'])assert.equal((await fresh.request(api+suffix)).status,403);
  assert.equal((await fresh.request(api+'/resolve',{request_key:report.request_key})).status,403);
  assert.deepEqual((await ok(owner,work+'/history')).revisions.map(r=>r.continuation?.obligation).filter(Boolean),[gi.obligation,gi.obligation]);
  const expired=await ok(owner,grants+'/create',grantInput());
  const expirySession=await session(s,'B',p,'/continue/'+expired.id);
  // Controlled clock-boundary fixture, not a product setup or adoption claim.
  await s.db.prepare('UPDATE web_planning_continuation SET expires=? WHERE grant_id=?').bind(Date.now()-1,expired.id).run();
  assert.equal((await expirySession.request('/api/continuation/'+expired.id)).status,403);
  passed('revocation: new reads and writes refuse, including a save authorized before revocation; expiration refuses; committed updates and unresolved obligations remain readable to the owner');

  const replacement=await ok(owner,grants+'/create',grantInput());
  await writeFile(setupPath,JSON.stringify({...setup,grant_id:replacement.id}));
  await agent(s,'B',async()=>{
    const client=await openFileContinuation(setupPath),restored=await client.read();
    assert.equal(restored.history.length,3);assert(restored.history[1].continuation.next_action.includes('noise limit'));
    await client.save({...next,expected:headBinding(restored.saved),request_key:randomUUID(),report:'The 18:00 reading is 38 dBA; within the reported venue limit.',next_action:'Owner reviews the notice before sending.'});
  });
  head=(await ok(owner,work)).saved;
  const draft=planningDraft(head);draft.definition.success_criteria=['Review the notice using the recorded 38 dBA result.'];
  const t=await ok(owner,work+'/ticket',{...draft,expected:headBinding(head)});
  head=(await ok(owner,work+'/save',{...draft,ticket:t.ticket})).saved;
  const exported=await ok(owner,work+'/export');assert.equal(exported.format,'web_planning_export.v0.10');
  assert.equal(exported.revisions.filter(r=>r.continuation).length,3);
  assert(!('grants' in exported));
  const reading=await owner.request(work+'/reading-export');assert.equal(reading.status,200);assert(reading.raw.includes('38 dBA'));assert(reading.raw.includes(hash(s.env.LOCAL_PARTICIPANT_LOGIN)));
  // Ordinary empty-store recovery: preserve original bytes but end all live
  // delegations in this project. The other project remains populated.
  const otherOwner=await session(s,'A',other.project),otherBefore=await ok(otherOwner,'/api/project/continuation');
  await s.db.prepare('DELETE FROM web_planning_revision WHERE workspace_id=? AND project_id=?').bind(p.workspace_id,p.project_id).run();
  await ok(owner,'/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'});
  assert.equal(canonical(await ok(owner,work+'/export')),canonical(exported));
  assert.deepEqual(await ok(otherOwner,'/api/project/continuation'),otherBefore);
  assert((await ok(owner,grants)).grants.every(g=>g.revoked_at));
  assert.equal((await fresh.request('/api/continuation/'+replacement.id)).status,403);
  passed('ordinary agent continuation and recovery: a successor reconciles prior effects and saves meaningful new work, owner editing remains compatible, portable attribution survives exact reconstruction while live grants remain revoked');

  // A grant to another explicitly chosen work exposes only that work's exact
  // file revisions, including the useful original filename and integrity fields.
  const fileWork='/api/work/'+otherBefore.saved.work_id,fileDraft=planningDraft(otherBefore.saved),originalText='장소 안내\r\nArrival at 18:00.\r\n';
  fileDraft.files=[{name:'venue-안내.txt',role:'source',data:Buffer.from(originalText).toString('base64')}];
  const fileTicket=await ok(otherOwner,fileWork+'/ticket',{...fileDraft,expected:headBinding(otherBefore.saved)});
  const fileHead=(await ok(otherOwner,fileWork+'/save',{...fileDraft,ticket:fileTicket.ticket})).saved;
  const fileGrant=await ok(otherOwner,fileWork+'/continuation/create',{...grantInput(),expected:headBinding(fileHead)});
  const fileReader=await session(s,'B',other.project,'/continue/'+fileGrant.id),fileRoot='/api/continuation/'+fileGrant.id;
  const download=fileRoot+'/files/'+fileHead.revision+'/'+fileHead.fingerprint.slice(7)+'/0';
  const response=await s.mf.dispatchFetch(s.origin+download,{headers:{cookie:fileReader.cookies}});
  assert.equal(response.status,200);assert.equal(await response.text(),originalText);
  assert(response.headers.get('content-disposition').includes(encodeURIComponent('venue-안내.txt')));
  assert.equal(response.headers.get('x-content-sha256'),fileHead.files[0].digest);
  assert.equal(response.headers.get('content-length'),String(Buffer.byteLength(originalText)));
  assert.equal((await fileReader.request(fileRoot+'/files/'+fileHead.revision+'/'+head.fingerprint.slice(7)+'/0')).status,409);
  await ok(otherOwner,fileWork+'/continuation/revoke',{grant_id:fileGrant.id});
  assert.equal((await fileReader.request(download)).status,403);
  passed('successor files: exact UTF-8/CRLF bytes, original filename and digest remain scoped to the granted revision; foreign fingerprints and revoked access refuse');
}
