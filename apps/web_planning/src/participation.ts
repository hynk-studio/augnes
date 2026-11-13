import type { ContributionSource } from './contribution-contract';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { binding, boundedText, canonical, exact, fail, hash, headBinding, reference, sameBinding, UUID, workRef, type Binding, type Revision, type WorkRef } from './contract';
import { login, type Access } from './access';
import { exchangeView, type ExchangeFile } from './exchange';
import { writeExchange } from './exchange-write';
import { downloadFile, headsCurrent, readWork } from './store';
import { exactReturn, returnUse } from './return-use';
import type { Contributor } from './participation-contract';

interface Disclosure { request:WorkRef; expected:Binding; brief:string; next_action:string; files:{index:number; original:ExchangeFile}[] }
interface Grant { workspace_id:string; project_id:string; grant_id:string; work_id:string; recipient_login:string; recipient_hash:string;
  disclosure:string; disclosure_fingerprint:string; expires:number; revoked_at:string|null }
const where='workspace_id=? AND project_id=? AND grant_id=?';
const scope=(s:Access)=>[s.workspace_id,s.project_id];
// A signature alone would expose the private destination in a base64 cursor.
function cursorKey(s:Access){return createHash('sha256').update('participant-feedback-cursor\0'+s.env.REQUEST_SECRET).digest();}
function encodeCursor(s:Access,value:unknown){
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cursorKey(s),nonce);
  return Buffer.concat([nonce,cipher.update(canonical(value),'utf8'),cipher.final(),cipher.getAuthTag()]).toString('base64url');
}
function decodeCursor(s:Access,value:string){
  try{
    if(value.length>1200||!/^[A-Za-z0-9_-]+$/.test(value))throw Error();
    const bytes=Buffer.from(value,'base64url'),cipher=createDecipheriv('aes-256-gcm',cursorKey(s),bytes.subarray(0,12));
    cipher.setAuthTag(bytes.subarray(-16));
    return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(12,-16)),cipher.final()]).toString('utf8'));
  }catch{fail('invalid_feedback_cursor');}
}
export async function participationAvailable(s:Access) {
  if(s.env.PARTICIPATION_MODE!=='verified-recipient-v1')fail('participation_disabled',403);
  if(!await s.DB.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='web_planning_participation'").first())fail('participation_migration_required',503);
}
function disclosure(g:Grant):Disclosure {
  const d=JSON.parse(g.disclosure);exact(d,'request,expected,brief,next_action,files');
  if(hash(canonical(d))!==g.disclosure_fingerprint || d.request.work_id!==g.work_id)fail('participation_integrity',503);
  workRef(d.request);binding(d.expected);boundedText(d.brief,true);boundedText(d.next_action);
  if(!Array.isArray(d.files)||!d.files.length||d.files.length>8||new Set(d.files.map((f:any)=>f.index)).size!==d.files.length)fail('participation_integrity',503);
  return d as Disclosure;
}
function ownerView(s:Access,g:Grant) {
  return {id:g.grant_id,recipient:g.recipient_login,disclosure:disclosure(g),expires:g.expires,revoked_at:g.revoked_at,
    link:s.env.APP_ORIGIN+'/participate/'+g.grant_id};
}
export async function listGrants(s:Access,id:string,cursor='') {
  await participationAvailable(s);
  if(cursor&&!UUID.test(cursor))fail('invalid_cursor');
  const {results}=await s.DB.prepare('SELECT * FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id>? ORDER BY grant_id LIMIT 11').bind(...scope(s),id,cursor).all<Grant>();
  return {grants:results.slice(0,10).map(g=>ownerView(s,g)),next:results.length>10?results[9].grant_id:null};
}
export async function createGrant(s:Access,id:string,input:Record<string,unknown>) {
  await participationAvailable(s);
  exact(input,'workspace_id,project_id,grant_id,request,expected,recipient,brief,next_action,indices,expires');
  const ref=workRef(input.request),expected=binding(input.expected),recipient=login(input.recipient);
  if(!UUID.test(String(input.grant_id))||ref.work_id!==id||!recipient||hash(recipient)===s.ownerHash)fail('invalid_participant');
  if(!Number.isSafeInteger(input.expires)||Number(input.expires)<=Date.now()||Number(input.expires)>Date.now()+90*86400000)fail('invalid_participation_expiry');
  const chain=await readWork(s,id),r=chain[ref.revision-1];
  if(!r||r.exchange?.kind!=='request'||canonical(reference(r))!==canonical(ref))fail('exchange_request_unavailable',409);
  if(!Array.isArray(input.indices)||!input.indices.length||input.indices.length>8||new Set(input.indices).size!==input.indices.length)fail('invalid_disclosure');
  const files=input.indices.map(index=>{
    if(!Number.isSafeInteger(index)||index<0||!r.exchange!.artifacts[index])fail('invalid_disclosure');
    return {index,original:r.exchange!.artifacts[index]};
  });
  const d:Disclosure={request:ref,expected,brief:boundedText(input.brief,true),next_action:boundedText(input.next_action),files};
  const encoded=canonical(d),fingerprint=hash(encoded),recipientHash=hash(recipient);
  const prior=await s.DB.prepare(`SELECT * FROM web_planning_participation WHERE ${where}`).bind(...scope(s),String(input.grant_id)).first<Grant>();
  if(prior){
    if(prior.disclosure!==encoded||prior.recipient_hash!==recipientHash||prior.expires!==input.expires)fail('altered_replay',409);
    return ownerView(s,prior);
  }
  if(!sameBinding(headBinding(chain.at(-1)),expected))fail('refresh_required',409);
  if(chain.some(v=>v.exchange?.basis?.fingerprint===ref.fingerprint))fail('exchange_already_answered',409);
  for(const f of files)await downloadFile(s,r,f.index,true);
  // Freeze precisely this observed work head. Creation never retargets a request.
  await s.DB.prepare(`INSERT INTO web_planning_participation
    (workspace_id,project_id,grant_id,work_id,recipient_login,recipient_hash,disclosure,disclosure_fingerprint,expires)
    SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=? AND work_id=?)
      AND (SELECT MAX(revision) FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=?)=?
      AND EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=? AND revision=? AND fingerprint=?)
    ON CONFLICT DO NOTHING`).bind(...scope(s),String(input.grant_id),id,recipient,recipientHash,encoded,fingerprint,Number(input.expires),
      ...scope(s),id,...scope(s),id,expected.revision,...scope(s),id,expected.revision,expected.fingerprint).run();
  const saved=await s.DB.prepare(`SELECT * FROM web_planning_participation WHERE ${where}`).bind(...scope(s),String(input.grant_id)).first<Grant>();
  if(!saved)fail('refresh_required',409);
  if(saved.disclosure!==encoded||saved.recipient_hash!==recipientHash||saved.expires!==input.expires)fail('altered_replay',409);
  return ownerView(s,saved);
}
export async function revokeGrant(s:Access,id:string,input:Record<string,unknown>) {
  await participationAvailable(s);exact(input,'workspace_id,project_id,grant_id');
  if(!UUID.test(String(input.grant_id)))fail('invalid_participation');
  await s.DB.prepare(`UPDATE web_planning_participation SET revoked_at=COALESCE(revoked_at,?) WHERE ${where} AND work_id=?`)
    .bind(new Date().toISOString(),...scope(s),String(input.grant_id),id).run();
  const g=await s.DB.prepare(`SELECT * FROM web_planning_participation WHERE ${where} AND work_id=?`).bind(...scope(s),String(input.grant_id),id).first<Grant>();
  if(!g)fail('participation_unavailable',403);return ownerView(s,g);
}
export async function knownRecipient(s:Access,id:string) {
  await participationAvailable(s);
  const g=await s.DB.prepare(`SELECT * FROM web_planning_participation WHERE ${where} AND recipient_hash=?`)
    .bind(...scope(s),id,s.recipientHash??'').first<Grant>();
  if(!g)fail('participation_unavailable',403);
  return g;
}
export async function activeGrant(s:Access,id:string) {
  const g=await knownRecipient(s,id);
  if(g.revoked_at!==null||g.expires<=Date.now())fail('participation_unavailable',403);
  return {g,d:disclosure(g)};
}
export async function participantContext(s:Access,id:string) {
  const {g,d}=await activeGrant(s,id),chain=await readWork(s,g.work_id),r=chain[d.request.revision-1];
  if(!r||r.exchange?.kind!=='request'||canonical(reference(r))!==canonical(d.request)||
    d.files.some(f=>canonical(r.exchange!.artifacts[f.index])!==canonical(f.original)))fail('exchange_request_unavailable',409);
  const answer=chain.find(v=>v.exchange?.basis?.fingerprint===d.request.fingerprint);
  const ownAnswer=answer?.exchange?.contributor?.grant_id===id&&answer.exchange.contributor.principal_ref===g.recipient_hash?answer:undefined;
  return {g,d,chain,r,answer:ownAnswer,canSubmit:!answer&&sameBinding(headBinding(chain.at(-1)),d.expected)};
}
export type ParticipantContext=Awaited<ReturnType<typeof participantContext>>;
function participantItem(s:Access,c:ParticipantContext,r:Revision) {
  const v=exchangeView(r),original=r===c.r;
  return {...v,message:original?c.d.brief:v.message,next_action:original?c.d.next_action:v.next_action,
    // Never disclose an owner's request key, predecessor or undisclosed originals.
    request_key:original?null:v.request_key,expected:original?null:c.d.expected,
    files:(original?c.d.files.map(f=>({index:f.index,file:v.files[f.index]})):v.files.map((file,index)=>({index,file})))
      .map(({index,file})=>({...file,download:'/api/participation/'+c.g.grant_id+'/files/'+r.revision+'/'+r.fingerprint.slice(7)+'/'+index}))};
}
export function participantView(s:Access,c:ParticipantContext) {
  return {independent_projects:s.env.PROJECT_ENTRY_MODE==='admitted-private-v1',workspace_id:s.workspace_id,project_id:s.project_id,work_id:c.g.work_id,task:c.d.brief,head:c.d.expected,
    expires:c.g.expires,can_submit:c.canSubmit,attribution:(s.local?'A simulated local email principal controls this fixture grant.':'The verified ingress email controls this grant.')+' Human, agent and model authorship are not independently verified.',
    items:[participantItem(s,c,c.r),...(c.answer?[participantItem(s,c,c.answer)]:[])]};
}
export function participantFile(c:ParticipantContext,revision:number,fingerprint:string,index:number) {
  const r=c.chain[revision-1];
  if(!r||r.fingerprint!==fingerprint||!(r===c.r&&c.d.files.some(f=>f.index===index) || r===c.answer))fail('scope_denied',403);
  return r;
}
export async function participantWrite(s:Access,c:ParticipantContext,input:Record<string,unknown>,resolve:boolean,project?:ContributionSource) {
  if(input.kind!=='return'||canonical(input.basis)!==canonical(c.d.request)||canonical(input.expected)!==canonical(c.d.expected))fail('scope_denied',403);
  const attribution:Contributor={...(project?{project}:{}),grant_id:c.g.grant_id,principal_ref:c.g.recipient_hash,authentication:s.local?'local_fixture_email':'verified_ingress_email'};
  s.participantGrant={id:c.g.grant_id,recipient_hash:c.g.recipient_hash,disclosure_fingerprint:c.g.disclosure_fingerprint};
  const result=await writeExchange(s,c.g.work_id,input,resolve,attribution);
  const refreshed=await participantContext(s,c.g.grant_id);
  return {outcome:result.outcome,head:c.d.expected,retry_allowed:refreshed.canSubmit,
    ...(result.outcome==='saved'&&refreshed.answer?{item:participantItem(s,refreshed,refreshed.answer)}:{})};
}
export async function participantFeedbackView(s:Access,c:ParticipantContext,cursor:string|null) {
  if(!c.answer)return {feedback:[],next:null};
  let work='',revision=0;
  if(cursor){const value=decodeCursor(s,cursor);exact(value,'kind,grant,work,revision');
    if(value.kind!=='participant_feedback'||value.grant!==c.g.grant_id||!UUID.test(value.work)||!Number.isSafeInteger(value.revision))fail('invalid_feedback_cursor');
    work=value.work;revision=value.revision;}
  const ref=reference(c.answer);
  const {results}=await s.DB.prepare(`SELECT envelope,work_id,revision,fingerprint FROM web_planning_revision
    WHERE workspace_id=? AND project_id=? AND (envelope ->> '$.return_use.returned.fingerprint')=?
    AND json_type(envelope,'$.return_use.participant_feedback') IS NOT NULL
    AND (work_id,revision)>(?,?) ORDER BY work_id,revision LIMIT 11`)
    .bind(...scope(s),ref.fingerprint,work,revision).all<{envelope:string;work_id:string;revision:number;fingerprint:string}>();
  const rows=results.slice(0,10),feedback=rows.map(row=>{
    const r:Revision=JSON.parse(row.envelope),{fingerprint,...material}=r;
    if(r.workspace_id!==s.workspace_id||r.project_id!==s.project_id||r.author_ref!==s.author_ref||r.work_id!==row.work_id||r.revision!==row.revision||
      fingerprint!==row.fingerprint||hash(canonical(material))!==fingerprint)fail('history_integrity',409);
    const use=returnUse(r.return_use,r,r.work_id),o=exactReturn(c.chain,ref,use.index);
    if(canonical(use.contributor)!==canonical(c.answer!.exchange!.contributor)||canonical(use.returned)!==canonical(ref)||canonical(use.request)!==canonical(c.d.request)||canonical(use.original)!==canonical(o.original)||
      canonical(use.request_basis)!==canonical(reference(o.basis))||c.chain[use.source_head.revision-1]?.fingerprint!==use.source_head.fingerprint)fail('invalid_return_origin',409);
    return {id:hash(c.g.grant_id+fingerprint),file_index:use.index,recorded_at:r.recorded_at,disposition:use.decision,
      explanation:use.participant_feedback!.explanation,next_action:use.participant_feedback!.next_action};
  });
  if(!await headsCurrent(s,reference(c.chain.at(-1)!),reference(c.chain.at(-1)!)))fail('refresh_required',409);
  const last=rows.at(-1);
  return {feedback,next:results.length>10&&last?encodeCursor(s,{kind:'participant_feedback',grant:c.g.grant_id,work:last.work_id,revision:last.revision}):null};
}
