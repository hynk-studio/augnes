import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { validateFileExport } from '../apps/web_planning/src/files.ts';
import { planningDraft, prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { digest, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { projectSession as session, projectOk as ok, projectAgentSession as agent, projectBindings, projectInput } from './web-planning-project-checks.mjs';
import { authorize } from '../apps/web_planning/src/access.ts';
import { participantContext } from '../apps/web_planning/src/participation.ts';
import { retainContribution,returnContribution } from '../apps/web_planning/src/contributions.ts';

const file=(name,text)=>({name,media_type:'text/plain',bytes:Buffer.byteLength(text),digest:digest(Buffer.from(text)),data:Buffer.from(text).toString('base64')});
const route=(r,suffix='')=>'/api/work/'+r.work_id+(suffix?'/'+suffix:'');
export async function checkCrossProjectContributions({start,root,passed}){
  const s=await start('cross-project-contributions',{bindings:projectBindings()});
  const ca=await ok(await session(s,'A'),'/api/projects',projectInput('A'));
  const cb=await ok(await session(s,'B'),'/api/projects',projectInput('B'));
  const a=ca.project,b=cb.project,owner=await session(s,'A',a),own=await session(s,'B',b);
  const request=async(name)=>{
    const draft=await ok(owner,'/api/drafts',{}),base=(await ok(owner,route({work_id:draft.work_id},'save'),{
      ticket:draft.ticket,definition:{goal:name,success_criteria:['Check the notice'],non_goals:[]},notes:[]})).saved;
    const event=await ok(owner,route(base,'exchanges/save'),{request_key:randomUUID(),expected:headBinding(base),kind:'request',basis:null,
      message:'A_PRIVATE_BRIEF',next_action:'A_PRIVATE_NEXT',files:[file('notice.md','\ufeffArrival 18:30.\r\nUse the east ramp.\r\n'),file('private.txt','A_PRIVATE_FILE')]});
    const grant=await ok(owner,route(base,'participation/create'),{grant_id:randomUUID(),request:event.item.ref,expected:event.head,recipient:s.env.LOCAL_PARTICIPANT_LOGIN,
      indices:[0],brief:'Confirm the arrival time and suggest an accessible entrance.',next_action:'Keep venue uncertainty. Return a correction or useful question.',expires:Date.now()+3600000});
    return {base,event,grant};
  };
  async function participant(g){return session(s,'B',a,'/participate/'+g.id);}
  const first=await request('A private notice work'),p=await participant(first.grant),prefix='/api/participation/'+first.grant.id;
  const view=await ok(p,prefix);assert(!JSON.stringify(view).includes('A_PRIVATE'));
  const original=await s.mf.dispatchFetch(s.origin+view.items[0].files[0].download,{headers:{cookie:p.cookies}});assert.equal(original.status,200);assert.deepEqual(Buffer.from(await original.arrayBuffer()),Buffer.from('\ufeffArrival 18:30.\r\nUse the east ramp.\r\n'));
  const retain={destination_project_id:b.project_id,request_key:randomUUID(),request:first.event.item.ref,indices:[0],title:'B checks venue access',next_action:'Check the signed venue note.',confirm:'retain-selected-request'};
  assert.equal((await ok(p,prefix+'/retain-resolve',retain)).outcome,'unknown');
  await ok(p,prefix+'/retain',retain); // Lose the actual acknowledgement.
  const fresh=await participant(first.grant),kept=await ok(fresh,prefix+'/retain-resolve',retain);
  assert.equal(kept.outcome,'saved');assert.equal(kept.saved.project_id,b.project_id);assert.equal(kept.saved.author_ref,b.author_ref);
  assert.equal(kept.saved.format,'web_planning_revision.v0.11');
  assert.equal(kept.saved.contribution_request.project_id,a.project_id);
  assert.deepEqual((await ok(fresh,prefix+'/retain',retain)).saved,kept.saved);
  assert.equal((await fresh.request(prefix+'/retain',{...retain,title:'Altered'})).status,409);
  assert.equal((await fresh.request(prefix+'/retain',{...retain,destination_project_id:a.project_id})).status,403);
  assert.equal((await fresh.request(prefix+'/retain',{...retain,indices:[1],request_key:randomUUID()})).status,403);
  assert.equal((await fresh.request(prefix+'/retain',{...retain,request:{...retain.request,work_id:randomUUID()}})).status,403);
  assert.equal((await fresh.request(prefix,undefined,{'x-web-planning-project':b.project_id})).status,403);
  assert.equal((await owner.request(prefix)).status,403);
  assert.equal((await own.request(route(first.base))).status,404);
  assert.equal((await ok(own,'/api/works')).items.filter(w=>w.work_id===kept.saved.work_id).length,1);
  passed('cross-project retain: independently created A/B, exact deliberate disclosure, original BOM/CRLF, ownership refusal and fresh uncertain-retention reconciliation without duplicates');

  const pending=planningDraft(kept.saved);pending.definition.success_criteria=['Confirm the venue response before publication.'];
  pending.files=[{name:'correction.md',role:'results',data:Buffer.from('Arrival is 18:00.\r\nEast ramp is accessible.\r\nNoise remains unknown.\r\n').toString('base64')},
    {name:'question.md',role:'results',data:Buffer.from('Could a quieter venue meet the same need?\n').toString('base64')},
    {name:'private-b.txt',role:'other',data:Buffer.from('B_PRIVATE_REASON').toString('base64')}];
  const ticket=await ok(own,route(kept.saved,'ticket'),{...pending,expected:headBinding(kept.saved)});
  const made=(await ok(own,route(kept.saved,'save'),{...pending,ticket:ticket.ticket})).saved;
  const setup=await ok(fresh,prefix+'/setup'),setupPath=path.join(root,'contributor-setup.json');
  await writeFile(setupPath,JSON.stringify(setup));
  const send={destination_project_id:b.project_id,request_key:randomUUID(),expected:first.event.head,source:reference(made),indices:[0,1],
    message:'Checked arrival; entrance confirmed, noise unknown. A quieter venue is another option.',next_action:'Use only the checked parts; review the open question.',confirm:'share-selected-results-and-attribution'};
  let returned;
  await agent(s,'B',async()=>{
    const client=await openFileTask(setupPath);
    assert.equal((await client.cooperation.works(b.project_id)).works[0].ref.fingerprint,made.fingerprint);
    await client.cooperation.returnSaved(send); // Lose the actual committed response.
    const nextClient=await openFileTask(setupPath);returned=await nextClient.cooperation.returnSaved(send,true);
    assert.equal(returned.outcome,'saved');
    assert.deepEqual((await nextClient.cooperation.returnSaved(send)).item,returned.item);
    await assert.rejects(nextClient.cooperation.returnSaved({...send,indices:[2]}),/altered_replay/);
    await assert.rejects(nextClient.cooperation.returnSaved({...send,request_key:randomUUID()}),/exchange_already_answered|refresh_required/);
  });
  assert.deepEqual(returned.item.contributor.project,{project_id:b.project_id,author_ref:b.author_ref,work:reference(made),indices:[0,1]});
  assert(!JSON.stringify(returned).includes('B_PRIVATE'));
  assert.equal((await ok(owner,route(first.base,'history'))).revisions.length,3);
  for(const [i,f] of returned.item.files.entries())assert.equal(await ok(fresh,f.download),Buffer.from(pending.files[i].data,'base64').toString());
  const forged={...setup,project_id:b.project_id},forgedPath=path.join(root,'edited-setup.json');await writeFile(forgedPath,JSON.stringify(forged));
  await agent(s,'B',async()=>{await assert.rejects(async()=>{const client=await openFileTask(forgedPath);await client.cooperation.returnSaved(send);},/Participant request selection changed/);});
  passed('cross-project return: ordinary B writer and supported client send only selected exact saved files, attributable project/work origin, one cumulative answer, altered setup refusal and fresh read-only reconciliation');

  const req=(url,body)=>ok(owner,url,body);
  const inspect=await req(route(first.base,'inspect-return'),{returned:returned.item.ref,index:0,after:null});
  const judgment={decision:'adapted',name:'private-final.md',text:'Arrival 18:00. Use the east ramp. Room B.\r\n',rationale:'A_PRIVATE_REASON',
    reported_check:'Compared arrival with venue email; noise is not verified.',limits:'A_PRIVATE_LIMIT',next_action:'A_PRIVATE_NEXT',
    participant_feedback:{explanation:'Used the checked arrival and entrance, added our room. Did not use the noise claim.',next_action:'No new work is requested.'}};
  const prepared=await prepareReturnDraft(req,inspect.selection,judgment,{goal:'A_PRIVATE_DESTINATION'});
  const used=(await req(route(prepared,'save'),prepared.body)).saved;assert.equal(used.format,'web_planning_revision.v0.11');
  const second=await req(route(first.base,'inspect-return'),{returned:returned.item.ref,index:1,after:null});
  const decline=await prepareReturnDraft(req,second.selection,{decision:'declined',rationale:'A_PRIVATE_DECLINE',next_action:'Keep our venue.',
    participant_feedback:{explanation:'We are keeping the booked venue; the alternative question is not used.',next_action:'Continue your own investigation if useful.'}},{saved:(await req(route(first.base))).saved});
  await req(route(decline,'save'),decline.body);
  const feedback=await ok(await participant(first.grant),prefix+'/feedback');assert.deepEqual(new Set(feedback.feedback.map(f=>f.disposition)),new Set(['adapted','declined']));
  for(const secret of ['PRIVATE',used.work_id,used.fingerprint,'private-final.md',judgment.text,judgment.reported_check])assert(!JSON.stringify(feedback).includes(secret));
  const bFresh=await session(s,'B',b),ownCurrent=(await ok(bFresh,route(made))).saved;
  const later=planningDraft(ownCurrent);later.definition.success_criteria=['Measure noise for B’s separate venue investigation.'];
  const bt=await ok(bFresh,route(made,'ticket'),{...later,expected:headBinding(ownCurrent)});
  const continued=(await ok(bFresh,route(made,'save'),{...later,ticket:bt.ticket})).saved;
  assert.equal(continued.revision,made.revision+1);assert.equal(continued.author_ref,b.author_ref);
  assert.deepEqual((await ok(owner,route(used))).saved,used);
  passed('checked partial use and non-use: A saves an adaptation and declines a separate returned file, shares only intended feedback; a fresh B session independently continues its work');

  const aExport=await req(route(first.base,'export')),bExport=await ok(bFresh,route(made,'export'));
  for(const [scope,exported] of [[a,aExport],[b,bExport]]){
    assert.equal(exported.format,'web_planning_export.v0.11');validateFileExport(scope,exported);
    assert.deepEqual(Object.keys(exported).sort(),['compatibility','files','fingerprint','format','revisions','schema']);
    assert(!JSON.stringify(exported).includes(s.env.LOCAL_PARTICIPANT_LOGIN));
  }
  await req(route(first.base,'participation/revoke'),{grant_id:first.grant.id});
  for(const suffix of ['', '/feedback'])assert.equal((await fresh.request(prefix+suffix)).status,403);
  for(const suffix of ['/retain','/retain-resolve'])assert.equal((await fresh.request(prefix+suffix,retain)).status,403);
  for(const suffix of ['/project-return','/project-return-resolve'])assert.equal((await fresh.request(prefix+suffix,{...send,request:first.event.item.ref})).status,403);
  assert.equal(canonical(await ok(bFresh,route(made,'export'))),canonical(bExport));
  assert.deepEqual((await ok(bFresh,route(made))).saved,continued);
  assert.deepEqual((await ok(owner,route(first.base,'export'))),aExport);
  passed('revocation and portability: source access stops, independent retained work and exact returned history remain; v0.11 exports validate without operational grants or credentials');

  // An empty, independently configured recovery fixture uses the public restore
  // writer. There is no manual database edit or imported live authorization.
  const recovery=await start('contribution-portable-recovery',{bindings:{WORKSPACE_ID:b.workspace_id,PROJECT_ID:b.project_id,AUTHOR_REF:b.author_ref,
    OWNER_EMAIL:s.env.LOCAL_PARTICIPANT_LOGIN,LOCAL_LOGIN:s.env.LOCAL_PARTICIPANT_LOGIN}});
  const restored=await session(recovery,'A',b);
  await ok(restored,'/api/reconstruct-exchange',{export:bExport,confirm:'reconstruct-empty-store'});
  assert.deepEqual(await ok(restored,route(made,'export')),bExport);
  assert.equal((await recovery.db.prepare('SELECT count(*) n FROM web_planning_participation').first()).n,0);
  assert.equal((await restored.request(prefix)).status,403);
  const recoveredDraft=planningDraft(continued);recoveredDraft.definition.success_criteria=['Continue from the portable copy without requesting source access.'];
  const recoveredTicket=await ok(restored,route(made,'ticket'),{...recoveredDraft,expected:headBinding(continued)});
  assert.equal((await ok(restored,route(made,'save'),{...recoveredDraft,ticket:recoveredTicket.ticket})).saved.revision,continued.revision+1);
  passed('portable recovery: public empty-store reconstruction preserves exact B bytes/attribution and supports independent next work without recreating a source grant');

  // Interpose only at D1 batch submission. All context reads, mutations and SQL
  // predicates are production owners over the actual disposable D1 database.
  async function accesses(g){
    const principal={login:s.env.LOCAL_PARTICIPANT_LOGIN,localFixture:true},env={...s.env,DB:s.db};
    const access=await authorize(new Request(s.origin+'/api/participation/'+g.id),env,principal,g.id);
    const ownAccess=await authorize(new Request(s.origin+'/api/project',{headers:{'x-web-planning-project':b.project_id}}),env,principal);
    return {access,ownAccess,context:await participantContext(access,g.id)};
  }
  const retentionRace=await request('Revoke before retention commit'),ar=await accesses(retentionRace.grant);
  const raceRetain={...retain,workspace_id:a.workspace_id,project_id:a.project_id,request_key:randomUUID(),request:retentionRace.event.item.ref};
  const originalDb=ar.ownAccess.DB;
  ar.ownAccess.DB={prepare:sql=>originalDb.prepare(sql),batch:async statements=>{
    await ok(owner,route(retentionRace.base,'participation/revoke'),{grant_id:retentionRace.grant.id});return originalDb.batch(statements);
  }};
  await assert.rejects(retainContribution(ar.access,ar.ownAccess,ar.context,raceRetain,false),e=>e.code==='contribution_not_saved');
  assert.equal((await own.request(route({work_id:raceRetain.request_key}))).status,404);

  const returningRace=await request('B changes before return commit'),rp=await participant(returningRace.grant),rr='/api/participation/'+returningRace.grant.id;
  const raceKept=(await ok(rp,rr+'/retain',{...retain,request_key:randomUUID(),request:returningRace.event.item.ref})).saved;
  const ra=await accesses(returningRace.grant),returnDb=ra.access.DB;
  ra.access.DB={prepare:sql=>returnDb.prepare(sql),batch:async statements=>{
    const changed=planningDraft(raceKept);changed.definition.success_criteria=['B changed the basis before sending.'];
    const t=await ok(own,route(raceKept,'ticket'),{...changed,expected:headBinding(raceKept)});
    await ok(own,route(raceKept,'save'),{...changed,ticket:t.ticket});return returnDb.batch(statements);
  }};
  const raceSend={...send,workspace_id:a.workspace_id,project_id:a.project_id,request_key:randomUUID(),request:returningRace.event.item.ref,
    expected:returningRace.event.head,source:reference(raceKept),indices:[0]};
  await assert.rejects(returnContribution(ra.access,ra.ownAccess,ra.context,raceSend,false),e=>e.code==='conflict');
  assert.equal((await ok(owner,route(returningRace.base,'history'))).revisions.length,2);
  assert.equal((await ok(rp,rr+'/project-return-resolve',raceSend)).retry_allowed,false);
  passed('atomic cross-project gates: revoke after authorized read prevents retention; B head change after file read prevents return, with no partial files or duplicate effects');
}
