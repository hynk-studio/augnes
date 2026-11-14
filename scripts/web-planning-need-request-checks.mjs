import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { closeTrackedServer, trackServerConnections } from './test-harness-process-lifecycle.mjs';
import { projectSession as session, projectOk as ok, projectBindings } from './web-planning-project-checks.mjs';
import { headBinding } from '../apps/web_planning/src/contract.ts';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { digest, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';

// This is a controlled HTTP exchange between simulated principals, over real
// production writers/D1 and separate CLI processes. It never contacts a person.
export async function checkNeedDrivenRequest({start,root,passed}){
  let runtime,dropAfter=null,dropBefore=null,failRead=null;
  const mutations=[];
  const gateway=trackServerConnections(http.createServer(async(req,res)=>{
    try{
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      if(req.method==='POST')mutations.push(req.url);
      if(req.method==='GET'&&req.url===failRead){failRead=null;res.writeHead(503,{'X-Web-Planning-Response':'1','Content-Type':'application/json'});res.end('{"error":"storage_unavailable"}');return;}
      if(req.method==='POST'&&req.url===dropBefore){dropBefore=null;res.destroy();return;}
      const response=await runtime.mf.dispatchFetch(runtime.env.APP_ORIGIN+req.url,{
        method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
      const bytes=Buffer.from(await response.arrayBuffer());
      if(req.method==='POST'&&req.url===dropAfter){assert.equal(response.status,200);dropAfter=null;res.destroy();return;}
      const headers=Object.fromEntries(response.headers);
      if(response.headers.getSetCookie)headers['set-cookie']=response.headers.getSetCookie();
      res.writeHead(response.status,headers);res.end(bytes);
    }catch(error){res.destroy(error);}
  }));
  try{
    await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(0,'127.0.0.1',resolve);});
    const origin='http://127.0.0.1:'+gateway.address().port;
    runtime=await start('need-driven-http',{bindings:{...projectBindings(),APP_ORIGIN:origin}});
    const created=await ok(await session(runtime,'A'),'/api/projects',{request_key:randomUUID(),name:'Request transport development',
      purpose:'Implement the bounded request-to-checked-use path for Augnes issue 1642.',
      judgment:{text:'The existing CLI transports files, but does not create recipient scopes or recover their uncertain acknowledgements.',source:'apps/augnes_apps/scripts/file-exchange.mjs at the task source revision'},
      unfinished:'Need a contract-based check of the smallest HTTP pull integration; hosted delivery remains unobserved.',
      next_action:'Compare direct inspection with a scoped outside contract question. Keep external execution and spending unauthorized.'});
    const owner=await session(runtime,'A',created.project),base=created.saved;
    const dir=path.join(root,'need-request-clients');await mkdir(dir);
    const setup=path.join(dir,'owner.json');
    await writeFile(setup,JSON.stringify({format:'augnes_web_file_task.v1',origin,...created.project,work_id:base.work_id}));
    const selected=Buffer.from((await readFile('apps/web_planning/README.md','utf8')).split('### Cross-project contributions (#1630)')[1].split('### Scoped work succession')[0]);
    const source=path.join(dir,'selected-contract.md'),privateFile=path.join(dir,'private.txt');
    await writeFile(source,selected);await writeFile(privateFile,'UNRELATED_PRIVATE_MATERIAL');
    const prefix='/api/work/'+base.work_id;
    const count=url=>mutations.filter(p=>p===url).length;
    async function cli(actor,selection,args,success=true){
      let stdout='',stderr='';
      const result=await runCanonicalChild({suite:'web-planning',label:'need-request-'+args[0],command:process.execPath,
        cwd:path.resolve('apps/augnes_apps'),env:{...process.env,AUGNES_WEB_ORIGIN:origin,AUGNES_WEB_PROJECT_ID:'',
          AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+(actor==='B'?runtime.env.LOCAL_PARTICIPANT_SESSION:runtime.env.LOCAL_SESSION)},
        args:['scripts/file-exchange.mjs',selection,...args],timeoutMs:10000,
        stdout:{write:data=>{stdout+=data;}},stderr:{write:data=>{stderr+=data;}}});
      if(success){assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
      assert.equal(result.exit_code,1,stderr);return stderr;
    }
    const context=await cli('A',setup,['context']);assert.equal(context.sources.length,3);
    // The choice is an attributed, source-linked question on actual project
    // material, not an autonomous-judgment or outside-participation claim.
    dropAfter=prefix+'/exchanges/save';
    await cli('A',setup,['request','Check the selected contribution contract for scope, lost-acknowledgement and return-use constraints. Direct inspection remains available.',source,privateFile],false);
    dropBefore=prefix+'/exchanges/resolve';await cli('A',setup,['retry'],false);assert.equal(count(prefix+'/exchanges/save'),1);
    const asked=await cli('A',setup,['retry']);assert.equal(asked.outcome,'saved');assert.equal(count(prefix+'/exchanges/save'),1);
    const request=asked.item.ref,scopeFile=path.join(dir,'scope.json');
    const scope={recipient:runtime.env.LOCAL_PARTICIPANT_LOGIN,brief:'Check the selected contract for our issue 1642 HTTP pull path. Return a useful clarification or partial recommendation; no private project history is disclosed.',
      next_action:'Return only checked advice. No contact, execution, spending or new commitments. Owner checks use; hosted delivery and remaining qualification stay UNKNOWN.',indices:[0],expires:Date.now()+3600000};
    await writeFile(scopeFile,JSON.stringify(scope));
    dropAfter=prefix+'/participation/create';
    await Promise.all([cli('A',setup,['scope',String(request.revision),scopeFile],false),
      cli('A',setup,['scope',String(request.revision),scopeFile],false)]);
    assert.match(await cli('A',setup,['scope',String(request.revision),scopeFile],false),/previous pending/);
    failRead=prefix+'/participation';await cli('A',setup,['retry'],false);assert.equal(count(prefix+'/participation/create'),1);
    const scoped=await cli('A',setup,['retry']);assert.equal(scoped.outcome,'saved');assert.equal(scoped.delivery,'UNKNOWN');
    assert.equal(count(prefix+'/participation/create'),1);
    const grant=scoped.grant;
    assert.deepEqual(grant.disclosure.request,request);assert.deepEqual(grant.disclosure.files.map(f=>f.index),[0]);
    assert.equal((await cli('A',setup,['scope',String(request.revision),scopeFile])).grant.id,grant.id);
    assert.equal(count(prefix+'/participation/create'),1);
    const beforeReturn=await cli('A',setup,['request-context',String(request.revision)]);
    assert.equal(beforeReturn.delivery,'UNKNOWN');assert.equal(beforeReturn.scopes[0].status,'open');
    assert.deepEqual(beforeReturn.request_basis,base);assert.equal(beforeReturn.current.sources.length,3);
    passed('need/request: real project purpose and source material, exact request and recipient scope, lost acknowledgements reconciled by fresh CLI processes without repeated writes; delivery remains UNKNOWN');

    // Explicit controlled operator relay of the locator. No invitation or
    // message to a real recipient and no borrowed owner authentication.
    const participant=await session(runtime,'B',created.project,'/participate/'+grant.id),part='/api/participation/'+grant.id;
    const participantSetup=path.join(dir,'participant.json');
    await writeFile(participantSetup,JSON.stringify(await ok(participant,part+'/setup')));
    const visible=await cli('B',participantSetup,['list']);assert.equal(visible.items[0].files.length,1);
    assert(!JSON.stringify(visible).includes('UNRELATED_PRIVATE'));
    const received=path.join(dir,'received.md');await cli('B',participantSetup,['get',String(request.revision),'selected-contract.md',received]);
    assert.deepEqual(await readFile(received),selected);
    assert.match(await cli('B',participantSetup,['scope',String(request.revision),scopeFile],false),/Owner|owner/);
    const advice=path.join(dir,'advice.md'),offer=path.join(dir,'conditional-offer.md');
    await writeFile(advice,'Clarification: resolve the exact pending operation before repeating. The recipient pulls only selected originals, and return-use stays an explicit owner judgment. Hosted delivery remains unobserved.\n');
    await writeFile(offer,'Conditional offer only: an independently hosted run would need new authority. This reply does not supply that authority or discharge the remaining verification.\n');
    dropAfter=part+'/save';
    await cli('B',participantSetup,['return',String(request.revision),'Partial contract clarification; hosted behavior is not checked.','Owner: check the advice. The hosted-run offer remains unaccepted.',advice,offer],false);
    const returned=await cli('B',participantSetup,['retry']);assert.equal(returned.outcome,'saved');assert.equal(count(part+'/save'),1);
    assert.equal(returned.item.basis.fingerprint,request.fingerprint);
    assert.equal(returned.item.contributor.authentication,'local_fixture_email');
    passed('transport/response: authenticated HTTP pull and correlated partial return preserve original bytes, conditions and actual simulated-principal attribution; lost return acknowledgement does not duplicate the answer');

    const observation=path.join(dir,'observed.json'),choice=path.join(dir,'choice.json'),pendingUse=path.join(dir,'use.json');
    await cli('A',setup,['inspect-return',String(returned.item.ref.revision),'advice.md',observation]);
    const output='Checked against the selected contract: retain the exact operation before dispatch; reconcile before repeat; preserve scope and original response.\nHosted delivery is unknown. Do not accept new contact or spending from a reply.\n';
    await writeFile(choice,JSON.stringify({decision:'adapted',name:'request-integration-checklist.md',text:output,
      rationale:'Use the checked reconciliation and disclosure advice; preserve the narrower authority boundary.',reported_check:'Compared the original response bytes with the selected source contract; HTTP mechanism only, no independent review.',
      limits:'Partial advice. Hosted delivery, outside participation and qualification remain unobserved.',next_action:'Use the saved checklist to review the task delta; retain the unaccepted hosted-run offer and the no-contact/no-spending boundary.',
      participant_feedback:{explanation:'Used the reconciliation and disclosure clarification only.',next_action:'No additional work is requested.'}}));
    await cli('A',setup,['prepare-use',observation,choice,'current',pendingUse]);
    await cli('A',setup,['commit-use',pendingUse]);
    const declineObservation=path.join(dir,'offer.json'),decline=path.join(dir,'decline.json'),pendingDecline=path.join(dir,'decline-use.json');
    await cli('A',setup,['inspect-return',String(returned.item.ref.revision),'conditional-offer.md',declineObservation]);
    await writeFile(decline,JSON.stringify({decision:'declined',rationale:'No authority for the conditional hosted run. Preserve the offer as unaccepted, without a new obligation.',
      reported_check:'Read the exact conditional offer. It is not delivered work or permission.',limits:'Local mechanism evidence only.',
      next_action:'Review request-integration-checklist.md against the task diff. Continue local checks; leave hosted qualification and outside contact unrequested.',
      participant_feedback:{explanation:'The additional hosted run is not authorized or accepted.',next_action:'No new commitment or work is requested.'}}));
    await cli('A',setup,['prepare-use',declineObservation,decline,'current',pendingDecline]);await cli('A',setup,['commit-use',pendingDecline]);
    const fresh=await cli('A',setup,['request-context',String(request.revision)]);
    assert.equal(fresh.delivery,'correlated_response_recorded');assert.equal(fresh.scopes[0].status,'answered');
    assert.deepEqual(fresh.decisions.map(d=>d.decision),['adapted','declined']);
    assert.match(fresh.last_local_use.next_action,/Continue local checks/);
    assert.equal(fresh.responses[0].next_action,returned.item.next_action);
    assert.deepEqual(fresh.current.sources,base.sources);
    const saved=await cli('A',setup,['read-saved',String(fresh.decisions[0].destination.revision),'request-integration-checklist.md']);
    assert.equal(saved.text,output);assert.equal(saved.file.digest,digest(Buffer.from(output)));
    const feedback=await cli('B',participantSetup,['feedback']);assert.equal(feedback.feedback.length,2);
    assert(!JSON.stringify(feedback).includes('reported_check'));
    assert.equal(count(prefix+'/exchanges/save'),1);assert.equal(count(prefix+'/participation/create'),1);assert.equal(count(part+'/save'),1);
    passed('checked use/fresh continuation: original partial response and unaccepted offer, explicit adaptation/non-use, actual saved output, shared-only feedback and meaningful next action survive process replacement without a resend or new authority');

    await ok(owner,prefix+'/participation/revoke',{grant_id:grant.id});
    assert.match(await cli('B',participantSetup,['list'],false),/participation_unavailable/);
    assert.equal((await cli('A',setup,['request-context',String(request.revision)])).scopes[0].status,'revoked');
    // Absent creation is not carte blanche: source movement blocks replay and
    // preserves the exact private scope for deliberate recovery.
    const second=await cli('A',setup,['request','Check only the remaining local obligation.',source]);
    dropBefore=prefix+'/participation/create';await cli('A',setup,['scope',String(second.item.ref.revision),scopeFile],false);
    const latest=(await ok(owner,prefix)).saved,draft=planningDraft(latest);draft.definition.success_criteria=['Reassess local work before a new disclosure.'];
    const ticket=await ok(owner,prefix+'/ticket',{...draft,expected:headBinding(latest)});await ok(owner,prefix+'/save',{...draft,ticket:ticket.ticket});
    const posts=count(prefix+'/participation/create');
    const stale=await cli('A',setup,['retry']);assert.equal(stale.outcome,'unknown');assert.equal(stale.retry_allowed,false);
    assert.equal(count(prefix+'/participation/create'),posts);
    const recovered=path.join(dir,'stale-scope');await cli('A',setup,['recover',recovered]);
    assert.equal(JSON.parse(await readFile(path.join(recovered,'scope.json'))).body.request.fingerprint,second.item.ref.fingerprint);
    assert.deepEqual(await readdir(setup+'.pending'),[]);
    passed('authority/currentness: recipient cannot create scopes; revocation ends disclosure while preserving owner history; uncertain absent creation with a moved source cannot retry and its exact scope remains recoverable');
  }finally{await closeTrackedServer(gateway);}
}
