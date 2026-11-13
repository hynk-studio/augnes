import { Buffer } from 'node:buffer';
import type { Access } from './access';
import { boundedText, canonical, exact, fail, headBinding, makeRevision, normalizePayload, reference, sameBinding, UUID, workRef } from './contract';
import { contributionIndices, type ContributionRequest } from './contribution-contract';
import { fileManifest } from './files';
import { append, downloadFile, readWork, requestRevision } from './store';
import { participantWrite, type ParticipantContext } from './participation';

function independent(a:Access,b:Access){
  if(a.principalHash!==b.ownerHash||b.recipientHash||a.workspace_id!==b.workspace_id||a.project_id===b.project_id)fail('contribution_project_denied',403);
}
function retainedRequest(a:Access,c:ParticipantContext,indices:number[]):ContributionRequest {
  const files=indices.map(index=>{const file=c.d.files.find(f=>f.index===index);if(!file)fail('scope_denied',403);return file;});
  fileManifest(files.map(f=>f.original.file)); // Ordinary retained-work quotas remain unchanged.
  return {workspace_id:a.workspace_id,project_id:a.project_id,author_ref:a.author_ref,grant_id:c.g.grant_id,
    request:c.d.request,disclosure_fingerprint:c.g.disclosure_fingerprint,brief:c.d.brief,next_action:c.d.next_action,expires:c.g.expires,files};
}
export async function retainContribution(a:Access,b:Access,c:ParticipantContext,input:Record<string,unknown>,resolve:boolean){
  independent(a,b);
  exact(input,'workspace_id,project_id,destination_project_id,request_key,request,indices,title,next_action,confirm');
  if(input.destination_project_id!==b.project_id||!UUID.test(String(input.request_key))||input.confirm!=='retain-selected-request'||
    canonical(input.request)!==canonical(c.d.request))fail('scope_denied',403);
  const id=String(input.request_key),indices=contributionIndices(input.indices),retained=retainedRequest(a,c,indices);
  const title=boundedText(input.title,true),next=boundedText(input.next_action,true);
  const attribution='Shared request '+c.d.request.fingerprint;
  const payload={...normalizePayload(b,{goal:title,success_criteria:[next],non_goals:[]},[
    {text:c.d.brief,source:attribution,provenance:'imported_unverified',observed_at:null,label:'Open question'},
    ...(c.d.next_action?[{text:c.d.next_action,source:attribution,provenance:'imported_unverified',observed_at:null,label:'Next check'}]:[]),
  ]),files:retained.files.map(f=>f.original.file),contribution_request:retained};
  const revision=makeRevision(b,id,{revision:0,fingerprint:null},id,payload,new Date().toISOString());
  const prior=await requestRevision(b,id);
  if(prior&&(prior.work_id!==id||prior.request_fingerprint!==revision.request_fingerprint))fail('altered_replay',409);
  if(!prior&&!resolve){
    const bodies=[];
    for(const f of retained.files){const {file,bytes}=await downloadFile(a,c.r,f.index,true);bodies.push({digest:file.digest,bytes:file.bytes,data:Buffer.from(bytes).toString('base64')});}
    const store={...b,disclosureGrant:{workspace_id:a.workspace_id,project_id:a.project_id,work_id:c.g.work_id,id:c.g.grant_id,
      recipient_hash:c.g.recipient_hash,disclosure_fingerprint:c.g.disclosure_fingerprint,request:c.d.request}};
    await append(store,[],revision,undefined,bodies);
  }
  const chain=await readWork(b,id),saved=chain[0];
  if(saved&&saved.request_fingerprint!==revision.request_fingerprint)fail('altered_replay',409);
  if(!saved&&!resolve)fail('contribution_not_saved',409);
  return {outcome:saved?'saved':'unknown',retry_allowed:!saved,saved:saved??null,current:chain.at(-1)??null};
}
export async function contributionWorks(a:Access,b:Access,c:ParticipantContext,cursor=''){
  independent(a,b);if(cursor&&!UUID.test(cursor))fail('invalid_cursor');
  const {results}=await b.DB.prepare(`SELECT work_id FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND revision=1
    AND json_extract(envelope,'$.contribution_request.grant_id')=? AND work_id>? ORDER BY work_id LIMIT 11`)
    .bind(b.workspace_id,b.project_id,c.g.grant_id,cursor).all<{work_id:string}>();
  const works=[];
  for(const row of results.slice(0,10)){
    const chain=await readWork(b,row.work_id),head=chain.at(-1)!;
    if(canonical(chain[0].contribution_request)!==canonical(retainedRequest(a,c,chain[0].contribution_request!.files.map(f=>f.index))))fail('invalid_contribution_request',409);
    works.push({ref:reference(head),title:head.definition.goal,files:head.files??[],retained:reference(chain[0])});
  }
  return {project_id:b.project_id,works,next:results.length>10?results[9].work_id:null};
}
export async function returnContribution(a:Access,b:Access,c:ParticipantContext,input:Record<string,unknown>,resolve:boolean){
  independent(a,b);
  exact(input,'workspace_id,project_id,destination_project_id,request_key,request,expected,source,indices,message,next_action,confirm');
  if(input.destination_project_id!==b.project_id||input.confirm!=='share-selected-results-and-attribution'||
    canonical(input.request)!==canonical(c.d.request)||canonical(input.expected)!==canonical(c.d.expected)||!UUID.test(String(input.request_key)))fail('scope_denied',403);
  const source=workRef(input.source),indices=contributionIndices(input.indices);
  const project={project_id:b.project_id,author_ref:b.author_ref,work:source,indices};
  // Read the committed effect first. Reconciliation still works after B edits or
  // erases its own work; it cannot cause a second cross-project write.
  const answer=c.chain.find(r=>r.request_key===input.request_key);
  if(answer){
    if(answer.exchange?.contributor?.grant_id!==c.g.grant_id||answer.exchange.contributor.principal_ref!==a.principalHash||
      canonical(answer.exchange.contributor.project)!==canonical(project)||answer.exchange.message!==boundedText(input.message,true)||
      answer.exchange.next_action!==boundedText(input.next_action,true))fail('altered_replay',409);
    const files=[];for(let i=0;i<answer.exchange.artifacts.length;i++){
      const {file,bytes}=await downloadFile(a,answer,i,true);files.push({name:file.name,bytes:file.bytes,digest:file.digest,media_type:answer.exchange.artifacts[i].media_type,data:Buffer.from(bytes).toString('base64')});
    }
    return participantWrite(a,c,{workspace_id:a.workspace_id,project_id:a.project_id,expected:input.expected,request_key:input.request_key,
      kind:'return',basis:input.request,message:input.message,next_action:input.next_action,files},true,project);
  }
  if(resolve){
    const pendingSource=await readWork(b,source.work_id);
    return {outcome:'unknown',retry_allowed:c.canSubmit&&sameBinding(headBinding(pendingSource.at(-1)),{revision:source.revision,fingerprint:source.fingerprint})};
  }
  const chain=await readWork(b,source.work_id),r=chain.at(-1);
  if(!r||!sameBinding(headBinding(r),{revision:source.revision,fingerprint:source.fingerprint}))fail('refresh_required',409);
  const retained=chain[0].contribution_request;
  if(!retained||canonical(retained)!==canonical(retainedRequest(a,c,retained.files.map(f=>f.index))))fail('contribution_request_mismatch',403);
  const files=[];
  for(const index of indices){
    const {file,bytes}=await downloadFile(b,r,index);
    files.push({name:file.name,bytes:file.bytes,digest:file.digest,media_type:null,data:Buffer.from(bytes).toString('base64')});
  }
  a.contributionSource={workspace_id:b.workspace_id,project_id:b.project_id,author_ref:b.author_ref,...source};
  return participantWrite(a,c,{workspace_id:a.workspace_id,project_id:a.project_id,expected:input.expected,request_key:input.request_key,
    kind:'return',basis:input.request,message:input.message,next_action:input.next_action,files},false,project);
}
