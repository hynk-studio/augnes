import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir,readFile,writeFile,readdir,unlink,rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import { headBinding,reference,canonical } from '../apps/web_planning/src/contract.ts';
import { prepareReturnDraft,planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';

export const participantEmail='synthetic-contributor@example.test';
export const participantBindings=()=>({PARTICIPATION_MODE:'verified-recipient-v1',LOCAL_PARTICIPANT_SESSION:randomUUID(),LOCAL_PARTICIPANT_LOGIN:participantEmail});
export async function participantClient(server,id,cookie=`web_planning_local=${server.env.LOCAL_PARTICIPANT_SESSION}`){
  const root='/api/participation/'+id,origin=server.env.APP_ORIGIN;
  const entry=await server.mf.dispatchFetch(origin+'/participate/'+id,{headers:{cookie}});
  assert.equal(entry.status,200,await entry.clone().text());
  const html=await entry.text(),csrf=html.match(/name="csrf-token" content="([^"]+)"/)[1];
  const cookies=cookie+'; '+entry.headers.get('set-cookie').split(';')[0];
  return {root,cookies,csrf,async request(path='',body,headers={}){
    const response=await server.mf.dispatchFetch(origin+(path.startsWith('/api/')||path.startsWith('/participate/')?path:root+path),{
      method:body===undefined?'GET':'POST',headers:{cookie:cookies,...(body===undefined?{}:{origin,'content-type':'application/json','x-csrf-token':csrf}),...headers},
      ...(body===undefined?{}:{body:JSON.stringify({workspace_id:server.env.WORKSPACE_ID,project_id:server.env.PROJECT_ID,...body})})});
    const type=response.headers.get('content-type')??'';
    const data=type.includes('application/json')?await response.json():await response.text();return {status:response.status,data};
  }};
}
const file=(name,text)=>{const bytes=Buffer.from(text);return {name,media_type:'text/plain',bytes:bytes.length,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex'),data:bytes.toString('base64')};};
const route=(r,suffix='')=>'/api/work/'+r.work_id+(suffix?'/'+suffix:'');
const def=goal=>({goal,success_criteria:['Publish an accurate attendee notice'],non_goals:['Do not change the private budget']});
export async function checkParticipation({start,client,newWork,save,passed}){
  const server=await start('participant',{bindings:participantBindings()}),owner=await client(server);
  const req=async(path,body)=>{const r=await owner.request(path,body);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
  async function seed(goal='PRIVATE_OWNER_WORK'){
    const created=await save(owner,await newWork(owner,def(goal),[{source:'Owner only',text:'PRIVATE_INTERNAL_NOTE',observed_at:null,provenance:'user_declaration',label:'Open question'}]));
    assert.equal(created.status,200,JSON.stringify(created.data));const base=created.data.saved;
    const event=await req(route(base,'exchanges/save'),{kind:'request',basis:null,expected:headBinding(base),request_key:randomUUID(),
      message:'PRIVATE_REQUEST_REASON: check this draft',next_action:'PRIVATE_INTERNAL_NEXT',files:[file('notice.md','Workshop starts at 18:30. Use the north entrance.\r\n'),file('budget-private.txt','PRIVATE_BUDGET')]});
    const input={grant_id:randomUUID(),request:event.item.ref,expected:event.head,recipient:participantEmail,brief:'Clarify the arrival time. The step-free entrance is the east ramp.',
      next_action:'Return an attendee notice with arrival at 18:00 and start at 18:30.',indices:[0],expires:Date.now()+86400000};
    const grant=await req(route(base,'participation/create'),input);return {base,event,input,grant};
  }
  const s=await seed(),id=s.grant.id,p=await participantClient(server,id);
  assert.deepEqual(await req(route(s.base,'participation/create'),s.input),s.grant);
  assert.equal((await owner.request(route(s.base,'participation/create'),{...s.input,brief:'Changed'})).data.error,'altered_replay');
  const visible=(await p.request()).data;assert.equal(visible.items.length,1);assert.equal(visible.items[0].files.length,1);
  assert.equal(visible.items[0].message,s.input.brief);assert(!JSON.stringify(visible).includes('PRIVATE_'));
  assert.equal(visible.items[0].request_key,null);
  const original=visible.items[0].files[0],download=await p.request(original.download);assert.equal(download.data,'Workshop starts at 18:30. Use the north entrance.\r\n');
  const read=await p.request(original.download+'/text',{offset:0,find:''});assert.equal(read.data.text,download.data);
  assert.equal((await p.request(original.download.replace(/0$/,'1'))).status,403);
  assert.equal((await p.request(original.download.replace('/'+s.event.item.ref.revision+'/', '/1/'))).status,403);
  for(const path of ['/api/project','/api/works','/api/works/search?q=PRIVATE',route(s.base),route(s.base,'history'),route(s.base,'export'),route(s.base,'exchanges'),route(s.base,'participation')])assert.equal((await p.request(path)).status,403,path);
  for(const path of ['/api/drafts','/api/reconstruct',route(s.base,'save'),route(s.base,'erase'),route(s.base,'ticket'),route(s.base,'inspect-return'),route(s.base,'participation/create')])assert.equal((await p.request(path,{})).status,403,path);
  assert.equal((await p.request('/api/participation/'+randomUUID())).status,403);
  assert.equal((await p.request('',undefined,{cookie:owner.cookies})).status,403,'owner identity cannot impersonate participant');
  assert.equal((await p.request('',undefined,{cookie:'web_planning_local=wrong','oai-authenticated-user-email':participantEmail})).status,403);
  assert.equal((await p.request('',undefined,{'sec-fetch-site':'cross-site'})).status,403);
  passed('participation: separate principal sees only selected original and brief; wrong identity/request/file, owner readers/writers and header spoof refused');
  const returned=file('notice.md','Arrive at 18:00 for the 18:30 workshop. Use the east ramp for step-free access.\r\n');
  const body={expected:visible.head,request_key:randomUUID(),kind:'return',basis:visible.items[0].ref,message:'Corrected the arrival and accessible entrance.',next_action:'Owner: confirm the room and publish the notice.',files:[returned]};
  assert.equal((await p.request('/save',{...body,project_id:randomUUID()})).status,403);
  assert.equal((await p.request('/save',body,{origin:'https://wrong.test'})).status,403);
  assert.equal((await p.request('/save',body,{'x-csrf-token':'wrong'})).status,403);
  assert.equal((await p.request('/save',{...body,kind:'request',basis:null})).status,403);
  assert.equal((await p.request('/save',{...body,basis:{...body.basis,work_id:randomUUID()}})).status,403);
  assert.equal((await p.request('/save',{...body,files:[{...returned,digest:'sha256:'+'0'.repeat(64)}]})).data.error,'exchange_upload_integrity');
  assert.equal((await p.request('/save',{...body,contributor:{authentication:'verified_ingress_email'}})).data.error,'invalid_fields');
  assert.equal((await p.request('/resolve',body)).data.outcome,'unknown');
  await p.request('/save',body); // Discard a real committed acknowledgement.
  const fresh=await participantClient(server,id),resolved=await fresh.request('/resolve',body);
  assert.equal(resolved.data.outcome,'saved');assert.equal(resolved.data.item.contributor.authentication,'local_fixture_email');
  assert.equal(resolved.data.item.contributor.grant_id,id);
  assert.deepEqual((await fresh.request('/save',body)).data.item,resolved.data.item);
  assert.equal((await fresh.request('/save',{...body,message:'Different'})).data.error,'altered_replay');
  assert.equal((await fresh.request('/save',{...body,request_key:randomUUID()})).status,409);
  const history=await req(route(s.base,'history'));assert.equal(history.revisions.length,3);
  assert.equal(history.revisions[2].author_ref,server.env.AUTHOR_REF);assert.equal(history.revisions[2].format,'web_planning_revision.v0.8');
  assert.equal((await fresh.request('/feedback')).data.feedback.length,0);
  passed('participation: real atomic return, distinct contributor attribution, altered byte/body refusals and fresh lost-acknowledgement reconciliation preserve one answer');
  const returnedRef=resolved.data.item.ref;
  let inspect=await req(route(s.base,'inspect-return'),{returned:returnedRef,index:0,after:null});
  const judgment={decision:'adapted',name:'attendee-notice.md',text:'Doors open 18:00 in Room B. The workshop starts 18:30. Use the east ramp for step-free access.\r\n',
    rationale:'PRIVATE_INTERNAL_REASON',reported_check:'Compared the submitted notice with the room booking.',limits:'PRIVATE_LIMIT',next_action:'PRIVATE_OWNER_NEXT',
    participant_feedback:{explanation:'Used your corrected arrival time and east-ramp instructions, adding the confirmed room.',next_action:'No further work is requested. Thank you.'}};
  const prepared=await prepareReturnDraft(req,inspect.selection,judgment,{goal:'PRIVATE_DESTINATION_TITLE'});
  assert.equal((await fresh.request('/feedback')).data.feedback.length,0,'preview is not committed feedback');
  const output=await req(route(prepared,'save'),prepared.body);
  assert.equal(output.saved.format,'web_planning_revision.v0.8');
  const used=(await req(route(s.base,'inspect-return'),{returned:returnedRef,index:0,after:null})).decisions[0];
  assert.equal((await owner.request(used.download)).data,judgment.text);
  const again=await participantClient(server,id),feedback=(await again.request('/feedback')).data;
  assert.equal(feedback.feedback[0].disposition,'adapted');assert.equal(feedback.feedback[0].explanation,judgment.participant_feedback.explanation);
  for(const secret of ['PRIVATE_',prepared.work_id,output.saved.fingerprint,'attendee-notice.md',judgment.text,'reported_check','destination'])assert(!JSON.stringify(feedback).includes(secret),secret);
  console.log(JSON.stringify({request_participation_output:{original:download.data,returned:Buffer.from(returned.data,'base64').toString(),saved_output:judgment.text,shared_feedback:feedback.feedback[0],authentication:'local fixture email',hosted_adoption:false}}));
  // A deliberately unshared subsequent decline must not disclose its existence or private prose.
  inspect=await req(route(s.base,'inspect-return'),{returned:returnedRef,index:0,after:null});
  let current=(await req(route(s.base))).saved;
  const decline=await prepareReturnDraft(req,inspect.selection,{decision:'declined',rationale:'PRIVATE_DECLINE',next_action:'PRIVATE_RECONSIDER'},{saved:current});
  current=(await req(route(decline,'save'),decline.body)).saved;
  assert.equal((await again.request('/feedback')).data.feedback.length,1);
  // Pagination must never expose the private work identifier in the cursor.
  for(let i=0;i<10;i++){
    inspect=await req(route(s.base,'inspect-return'),{returned:returnedRef,index:0,after:null});
    const decision=await prepareReturnDraft(req,inspect.selection,{decision:'deferred',rationale:'PRIVATE_REASON_'+i,next_action:'PRIVATE_NEXT',
      participant_feedback:{explanation:'A later check is pending '+i,next_action:'No action requested.'}},{saved:current});
    current=(await req(route(decision,'save'),decision.body)).saved;
  }
  const page=(await again.request('/feedback')).data;assert.equal(page.feedback.length,10);assert(page.next);
  assert(!Buffer.from(page.next,'base64url').toString().includes(s.base.work_id));assert(!Buffer.from(page.next,'base64url').toString().includes(prepared.work_id));
  assert.equal((await again.request('/feedback?cursor='+encodeURIComponent(page.next))).data.feedback.length,1);
  assert.equal((await again.request('/feedback?cursor=altered')).status,422);
  passed('participation: owner saves useful adapted cross-work output; fresh feedback projects only explicitly shared committed fields, including opaque pagination and private non-use');
  const exported=await req(route(s.base,'export'));assert.equal(exported.format,'web_planning_export.v0.8');
  assert(!JSON.stringify(exported).includes(participantEmail));assert(!JSON.stringify(exported).includes(server.env.REQUEST_SECRET));
  const restore=await start('participant-restore',{bindings:participantBindings()}),restorer=await client(restore);
  // Simulate an operational grant retained alongside an empty work recovery: it must be retired atomically.
  const row=await server.db.prepare('SELECT * FROM web_planning_participation WHERE grant_id=?').bind(id).first();
  const keys=Object.keys(row);await restore.db.prepare('INSERT INTO web_planning_participation ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').bind(...Object.values(row)).run();
  assert.equal((await restorer.request('/api/reconstruct-exchange',{export:exported,confirm:'reconstruct-empty-store'})).status,200);
  assert.deepEqual((await restorer.request(route(s.base,'export'))).data,exported);
  assert((await restore.db.prepare('SELECT revoked_at FROM web_planning_participation WHERE grant_id=?').bind(id).first()).revoked_at);
  assert.equal((await restore.mf.dispatchFetch(restore.origin+'/participate/'+id,{headers:{cookie:'web_planning_local='+restore.env.LOCAL_PARTICIPANT_SESSION}})).status,403);
  await req(route(s.base,'participation/revoke'),{grant_id:id});
  for(const path of ['', '/feedback', original.download, '/resolve'])assert.equal((await again.request(path,path==='/resolve'?body:undefined)).status,403);
  assert.deepEqual(await req(route(s.base,'export')),exported);
  passed('participation: exports retain exact attribution/history without email or credentials; supported reconstruction revokes grants and access revocation leaves committed history intact');
  const stale=await seed('Stale request'),sp=await participantClient(server,stale.grant.id),old=(await sp.request()).data;
  const sh=(await req(route(stale.base))).saved,draft=planningDraft(sh);draft.definition.goal='PRIVATE_CHANGED_GOAL';
  const ticket=await req(route(sh,'ticket'),{expected:headBinding(sh),...draft});await req(route(sh,'save'),{...draft,ticket:ticket.ticket});
  const later=(await sp.request()).data;assert.equal(later.can_submit,false);assert.equal(later.task,old.task);assert.deepEqual(later.items,old.items);
  const staleBody={...body,request_key:randomUUID(),expected:old.head,basis:old.items[0].ref};
  assert.equal((await sp.request('/save',staleBody)).status,409);
  assert.equal((await sp.request('/resolve',staleBody)).data.retry_allowed,false);
  const tampered=await seed('Changed original'),tp=await participantClient(server,tampered.grant.id),tf=(await tp.request()).data.items[0].files[0];
  await server.db.prepare('UPDATE web_planning_file SET body=? WHERE work_id=? AND digest=?').bind(Buffer.alloc(tf.bytes,65).buffer,tampered.base.work_id,tf.digest).run();
  assert.equal((await tp.request(tf.download)).status,409);
  const expiring=await seed('Expired request'),ep=await participantClient(server,expiring.grant.id);
  await server.db.prepare('UPDATE web_planning_participation SET expires=? WHERE grant_id=?').bind(Date.now()-1,expiring.grant.id).run();
  assert.equal((await ep.request()).status,403);
  const erased=await seed('Erased request'),er=await participantClient(server,erased.grant.id);
  await req(route(erased.base,'erase'),{expected:erased.event.head,confirm:'erase-whole-work'});assert.equal((await er.request()).status,410);
  const race=await seed('Concurrent return'),rp=await participantClient(server,race.grant.id),rv=(await rp.request()).data;
  const b1={...body,basis:rv.items[0].ref,expected:rv.head,request_key:randomUUID()},b2={...b1,request_key:randomUUID(),message:'Competing return'};
  const raced=await Promise.all([rp.request('/save',b1),rp.request('/save',b2)]);assert.equal(raced.filter(r=>r.status===200).length,1);
  assert.equal((await req(route(race.base,'history'))).revisions.length,3);
  passed('participation: stale basis never retargets disclosure, altered originals and erased sources refuse, expiry ends reads, concurrent returns commit exactly one successor');
  const disabled=await start('participant-disabled',{bindings:{LOCAL_PARTICIPANT_SESSION:randomUUID(),LOCAL_PARTICIPANT_LOGIN:participantEmail}});
  assert.equal((await disabled.mf.dispatchFetch(disabled.origin+'/participate/'+id,{headers:{cookie:'web_planning_local='+disabled.env.LOCAL_PARTICIPANT_SESSION}})).status,403);
  assert.equal((await (await client(disabled)).request(route(s.base,'participation/create'),s.input)).data.error,'participation_disabled');
  passed('participation: existing owner-only deployment is unchanged unless explicitly activated');
  await checkParticipantMcp({server,seed,req,passed});
}

// The compiled production Worker gets identity only from workerd's simulated
// platform ctx.access. This proves routing/claims, not a real hosted login.
export async function checkProductionParticipant({server,owner,newWork,save,passed,accessSimulation}){
  const bindings={...server.env,PARTICIPATION_MODE:'verified-recipient-v1'};
  await server.setOptions({bindings,access:accessSimulation});
  const base=(await save(owner,await newWork(owner,def('Production participant fixture'),[]))).data.saved;
  const event=(await owner.request(route(base,'exchanges/save'),{kind:'request',basis:null,expected:headBinding(base),request_key:randomUUID(),message:'Private owner instruction',next_action:'Private next',files:[file('notice.md','Arrival 18:30.\r\n')]})).data;
  const grant=(await owner.request(route(base,'participation/create'),{grant_id:randomUUID(),request:event.item.ref,expected:event.head,recipient:participantEmail,brief:'Correct arrival to 18:00.',next_action:'Return the notice.',indices:[0],expires:Date.now()+86400000})).data;
  assert(grant.id,JSON.stringify(grant));
  const recipient={...accessSimulation,identity:{email:participantEmail}};
  await server.setOptions({bindings,access:recipient});
  const p=await participantClient(server,grant.id,''),view=(await p.request()).data;
  assert.equal((await p.request('/api/works')).status,403);
  assert.equal((await p.request('/api/drafts',{})).status,403);
  const answer=await p.request('/save',{kind:'return',basis:event.item.ref,expected:view.head,request_key:randomUUID(),message:'Corrected arrival.',next_action:'Check notice.',files:[file('notice.md','Arrival 18:00.\r\n')]});
  assert.equal(answer.status,200,JSON.stringify(answer.data));assert.equal(answer.data.item.contributor.authentication,'verified_ingress_email');
  for(const access of [undefined,{...recipient,aud:'b'.repeat(64)},{...recipient,identity:{email:'wrong-recipient@example.test'}}]){
    await server.setOptions({bindings,access});
    for(const url of ['/participate/'+grant.id,'/api/participation/'+grant.id,'/api/participation/'+grant.id+'/feedback'])
      assert.equal((await server.mf.dispatchFetch(server.origin+url,{headers:{'Cf-Access-Authenticated-User-Email':participantEmail,'oai-authenticated-user-email':participantEmail}})).status,403);
  }
  await server.setOptions({bindings:server.env,access:recipient});assert.equal((await p.request()).status,403,'opt-in absent');
  await server.setOptions({bindings:server.env,access:accessSimulation});
  passed('production participant: compiled Worker, simulated ctx.access email/audience, scoped return attribution, wrong recipient/audience/header spoof and absent opt-in refusal');
}
async function checkParticipantMcp({server,seed,req,passed}){
  const apps=path.resolve('apps/augnes_apps'),require=createRequire(path.join(apps,'package.json'));
  const {Client}=require('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');
  const dir=path.join(process.env.AUGNES_CANONICAL_TEMP_ROOT,'participant-mcp');await mkdir(dir,{mode:0o700});
  const s=await seed('Agent recipient fixture'),p=await participantClient(server,s.grant.id),setup=path.join(dir,'participant.json');
  await writeFile(setup,JSON.stringify((await p.request('/setup')).data),{mode:0o600});
  const env={...process.env,AUGNES_WEB_ORIGIN:server.origin,AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+server.env.LOCAL_PARTICIPANT_SESSION};
  // Delay only delivery of a real successful resolve response. Both SDK processes
  // retain their normal HTTP, D1, authentication and server one-answer assertions.
  const gate=path.join(dir,'response-order.mjs');
  await writeFile(gate,`import {readFile,writeFile,unlink} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const root=${JSON.stringify(dir)},real=globalThis.fetch;
globalThis.fetch=async(...args)=>{const response=await real(...args);
if(String(args[0]).endsWith('/resolve')){
  let armed=false;try{await unlink(root+'/arm');armed=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(armed){await writeFile(root+'/held-body',args[1].body);await writeFile(root+'/held',String(response.status));const deadline=Date.now()+10000;
    while(true){try{await readFile(root+'/release');break;}catch(e){if(e.code!=='ENOENT')throw e;}
      if(Date.now()>deadline)throw Error('controlled_response_deadline');await delay(10);}}
}return response;};`);
  const connect=async(name,gated=false)=>{const client=new Client({name,version:'1'}),transport=new StdioClientTransport({command:process.execPath,
    args:[...(gated?['--import',gate]:[]),path.join(apps,'scripts/file-review-stdio.mjs'),setup],env,stderr:'pipe'});
    await client.connect(transport);return {client,transport};};
  const {client:host,transport}=await connect('controlled-participant-client',true);let peer;
  const journals=async()=>Promise.all((await readdir(dir)).filter(n=>/^participant\.json\.review-pending(?:\.[a-f0-9]{64})?\.json$/.test(n))
    .map(async name=>({path:path.join(dir,name),record:JSON.parse(await readFile(path.join(dir,name),'utf8'))})));
  try{
    assert.deepEqual((await host.listTools()).tools.map(t=>t.name).sort(),['list_file_requests','read_exchange_text','read_participant_feedback','return_text_edit']);
    const call=async(name,args={})=>{const r=await host.callTool({name,arguments:args});assert(!r.isError,r.content[0]?.text);return JSON.parse(r.content[0].text);};
    assert.equal((await call('list_file_requests')).items[0].files.length,1);
    assert((await host.callTool({name:'read_exchange_text',arguments:{version:2,filename:'budget-private.txt'}})).isError);
    const read=await call('read_exchange_text',{version:2,filename:'notice.md'});
    const edit={version:2,filename:'notice.md',source_digest:read.file.digest,save_base:read.save_base,find:'north entrance',replacement:'east ramp',review:'Corrected accessible entrance.',next_action:'Confirm the arrival time.'};
    const sent=await call('return_text_edit',edit);assert.equal(sent.item.contributor.grant_id,s.grant.id);
    assert.equal((await call('return_text_edit',{...edit,check_only:true})).item.ref.fingerprint,sent.item.ref.fingerprint);
    assert.equal((await journals()).length,0);
    const inspected=await req(route(s.base,'inspect-return'),{returned:sent.item.ref,index:0,after:null});
    const choice=await prepareReturnDraft(req,inspected.selection,{decision:'deferred',rationale:'PRIVATE_PENDING_CONFIRMATION',next_action:'PRIVATE_CHECK_BOOKING',participant_feedback:{explanation:'The entrance correction is useful; the arrival time still needs confirmation.',next_action:'Please wait for confirmation.'}},{saved:(await req(route(s.base))).saved});
    await req(route(choice,'save'),choice.body);
    const feedback=await call('read_participant_feedback');assert.equal(feedback.feedback[0].disposition,'deferred');assert(!JSON.stringify(feedback).includes('PRIVATE_'));
    peer=await connect('concurrent-participant-client');await writeFile(path.join(dir,'arm'),'');
    const late=call('return_text_edit',{...edit,check_only:true});late.catch(()=>{});
    const deadline=Date.now()+10000;
    while(!(await readdir(dir)).includes('held')){assert(Date.now()<deadline,'resolve response was not held');await delay(10);}
    assert.equal(await readFile(path.join(dir,'held'),'utf8'),'200');
    const b=await peer.client.callTool({name:'return_text_edit',arguments:{...edit,replacement:'west ramp'}});
    assert(b.isError);assert.match(b.content[0].text,/refresh_required/);
    const [pending]=await journals();assert(pending);assert.equal(pending.record.body.files[0].name,'notice.md');
    await writeFile(path.join(dir,'release'),'');assert.equal((await late).item.ref.fingerprint,sent.item.ref.fingerprint);
    assert.deepEqual(await journals(),[pending],'late A acknowledgement must preserve the different B recovery record');
    assert.equal((await req(route(s.base,'exchanges'))).items.filter(item=>item.kind==='return').length,1);
    assert((await host.callTool({name:'return_text_edit',arguments:{...edit,replacement:'south ramp'}})).isError);
    assert.deepEqual(await journals(),[pending]);
    // Concurrent submissions can leave both complete records after lost/refused
    // replies. Seed the captured exact A in the legacy format alongside real B.
    const {workspace_id,project_id,...oldBody}=JSON.parse(await readFile(path.join(dir,'held-body'),'utf8'));
    await writeFile(setup+'.review-pending.json',JSON.stringify({...pending.record,body:oldBody}));
    await unlink(path.join(dir,'release'));await unlink(path.join(dir,'held'));await writeFile(path.join(dir,'arm'),'');
    let checkA;const resolvingA=host.callTool({name:'return_text_edit',arguments:{...edit,check_only:true}}).then(r=>(checkA=r));
    const bothDeadline=Date.now()+10000;
    while(!(await readdir(dir)).includes('held')){
      assert(!checkA?.isError,checkA?.content[0]?.text);assert(Date.now()<bothDeadline,'retained A did not reach resolve');await delay(10);
    }
    const checkB=await peer.client.callTool({name:'return_text_edit',arguments:{...edit,replacement:'west ramp',check_only:true}});
    assert(!checkB.isError,checkB.content[0].text);assert.equal(JSON.parse(checkB.content[0].text).outcome,'unknown');
    const retryB=await peer.client.callTool({name:'return_text_edit',arguments:{...edit,replacement:'west ramp'}});
    assert(retryB.isError);assert.match(retryB.content[0].text,/refresh_required/);
    assert.equal((await journals()).length,2,'both unresolved records stay intact before A acknowledgement');
    await writeFile(path.join(dir,'release'),'');await resolvingA;assert(!checkA.isError,checkA.content[0].text);
    assert.equal(JSON.parse(checkA.content[0].text).outcome,'saved');assert.deepEqual(await journals(),[pending]);
    // A fresh process must still inspect/reconcile an unresolved legacy record.
    await rename(pending.path,setup+'.review-pending.json');await peer.client.close();await peer.transport.close();
    peer=await connect('fresh-participant-client');
    const legacy=await peer.client.callTool({name:'return_text_edit',arguments:{...edit,replacement:'west ramp',check_only:true}});
    assert(!legacy.isError,legacy.content[0].text);assert.equal(JSON.parse(legacy.content[0].text).outcome,'unknown');
    assert.deepEqual((await journals())[0].record,pending.record);
    assert((await peer.client.callTool({name:'return_text_edit',arguments:edit})).isError);
    assert.deepEqual((await journals())[0].record,pending.record);
  }finally{await writeFile(path.join(dir,'release'),'');if(peer){await peer.client.close();await peer.transport.close();}await host.close();await transport.close();}
  passed('participant MCP: real concurrent SDK processes, delayed saved A preserves refused B, two retained operations reconcile independently, fresh legacy recovery and shared feedback; one server return, no model or owner credentials');
}
