import { login, projectEntryEnabled, type Access } from './access';
import { binding, boundedText, canonical, exact, fail, hash, headBinding, makeRevision, sameBinding, UUID, type Revision } from './contract';
import { append, readWork } from './store';

interface Grant {
  grant_id:string; workspace_id:string; project_id:string; work_id:string;
  issuer_hash:string; recipient_login:string; recipient_hash:string; obligation:string;
  creation_fingerprint:string; expires:number; max_updates:number; revoked_at:string|null;
}
const scope=(s:Access)=>[s.workspace_id,s.project_id];
async function available(s:Access) {
  if(!projectEntryEnabled(s.env))fail('continuation_disabled',403);
  if(!await s.DB.prepare("SELECT 1 FROM web_planning_schema WHERE version=6").first())fail('continuation_migration_required',503);
}
function owner(s:Access){if(s.recipientHash||s.projectEntry||s.principalHash!==s.ownerHash)fail('scope_denied',403);}
function view(s:Access,g:Grant){return {id:g.grant_id,work_id:g.work_id,recipient:g.recipient_login,obligation:g.obligation,
  expires:g.expires,max_updates:g.max_updates,revoked_at:g.revoked_at,role:'continue-work-v1',link:s.env.APP_ORIGIN+'/continue/'+g.grant_id};}
export async function listContinuations(s:Access,id:string,cursor='') {
  owner(s);await available(s);if(cursor&&!UUID.test(cursor))fail('invalid_cursor');
  const {results}=await s.DB.prepare(`SELECT * FROM web_planning_continuation WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id>? ORDER BY grant_id LIMIT 21`)
    .bind(...scope(s),id,cursor).all<Grant>();
  return {grants:results.slice(0,20).map(g=>view(s,g)),next:results.length>20?results[19].grant_id:null};
}
export async function createContinuation(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await available(s);
  exact(input,'workspace_id,project_id,grant_id,expected,recipient,obligation,expires,max_updates,confirm');
  const expected=binding(input.expected),recipient=login(input.recipient),obligation=boundedText(input.obligation,true);
  if(!UUID.test(String(input.grant_id))||!recipient||hash(recipient)===s.ownerHash)fail('invalid_successor');
  if(input.confirm!=='share-this-work-history')fail('confirmation_required');
  const admitted=JSON.parse(s.env.PROJECT_ADMITTED_EMAILS??'[]') as string[];
  if(recipient!==login(s.env.OWNER_EMAIL)&&!admitted.some(v=>login(v)===recipient))fail('successor_not_admitted',403);
  if(!Number.isSafeInteger(input.expires)||!Number.isSafeInteger(input.max_updates)||Number(input.max_updates)<1||Number(input.max_updates)>20)fail('invalid_continuation_limit');
  const fingerprint=hash(canonical({work_id:id,expected,recipient,obligation,expires:input.expires,max_updates:input.max_updates}));
  const read=()=>s.DB.prepare('SELECT * FROM web_planning_continuation WHERE grant_id=? AND workspace_id=? AND project_id=?')
    .bind(String(input.grant_id),...scope(s)).first<Grant>();
  const prior=await read();
  if(prior){if(prior.creation_fingerprint!==fingerprint)fail('altered_replay',409);return view(s,prior);}
  if(Number(input.expires)<=Date.now()||Number(input.expires)>Date.now()+90*86400000)fail('invalid_continuation_expiry');
  const chain=await readWork(s,id);
  if(!chain.length||!sameBinding(headBinding(chain.at(-1)),expected))fail('refresh_required',409);
  await s.DB.prepare(`INSERT INTO web_planning_continuation
    (grant_id,workspace_id,project_id,work_id,issuer_hash,recipient_login,recipient_hash,obligation,creation_fingerprint,expires,max_updates)
    SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=? AND work_id=?)
      AND (SELECT MAX(revision) FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=?)=?
      AND EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=? AND revision=? AND fingerprint=?)
    ON CONFLICT DO NOTHING`).bind(String(input.grant_id),...scope(s),id,s.principalHash,recipient,hash(recipient),obligation,fingerprint,Number(input.expires),Number(input.max_updates),
      ...scope(s),id,...scope(s),id,expected.revision,...scope(s),id,expected.revision,expected.fingerprint).run();
  const saved=await read();if(!saved)fail('refresh_required',409);
  if(saved.creation_fingerprint!==fingerprint)fail('altered_replay',409);return view(s,saved);
}
export async function revokeContinuation(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await available(s);exact(input,'workspace_id,project_id,grant_id');
  if(!UUID.test(String(input.grant_id)))fail('invalid_continuation');
  await s.DB.prepare(`UPDATE web_planning_continuation SET revoked_at=COALESCE(revoked_at,?) WHERE grant_id=? AND workspace_id=? AND project_id=? AND work_id=?`)
    .bind(new Date().toISOString(),String(input.grant_id),...scope(s),id).run();
  const g=await s.DB.prepare('SELECT * FROM web_planning_continuation WHERE grant_id=? AND workspace_id=? AND project_id=? AND work_id=?')
    .bind(String(input.grant_id),...scope(s),id).first<Grant>();
  if(!g)fail('continuation_unavailable',403);return view(s,g);
}
export async function resolveContinuation(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await available(s);exact(input,'workspace_id,project_id,grant_id');
  if(!UUID.test(String(input.grant_id)))fail('invalid_continuation');
  const g=await s.DB.prepare('SELECT * FROM web_planning_continuation WHERE grant_id=? AND workspace_id=? AND project_id=? AND work_id=?')
    .bind(String(input.grant_id),...scope(s),id).first<Grant>();
  return {outcome:g?'created':'unknown',grant:g?view(s,g):null};
}
export async function activeContinuation(s:Access) {
  const g=await s.DB.prepare(`SELECT * FROM web_planning_continuation WHERE grant_id=? AND workspace_id=? AND project_id=? AND recipient_hash=? AND issuer_hash=?`)
    .bind(s.successorId??'',...scope(s),s.principalHash,s.ownerHash??'').first<Grant>();
  if(!g||g.revoked_at!==null||g.expires<=Date.now())fail('continuation_unavailable',403);
  return g;
}
export async function continuationContext(s:Access) {
  const g=await activeContinuation(s),chain=await readWork(s,g.work_id);
  if(!chain.length)fail('continuation_unavailable',403);
  return {g,chain};
}
type Context=Awaited<ReturnType<typeof continuationContext>>;
export function continuationView(s:Access,{g,chain}:Context) {
  return {workspace_id:s.workspace_id,project_id:s.project_id,work_id:g.work_id,grant_id:g.grant_id,
    role:'continue-work-v1',obligation:g.obligation,expires:g.expires,max_updates:g.max_updates,
    remaining_updates:g.max_updates-chain.filter(r=>r.continuation?.grant_id===g.grant_id).length,
    saved:chain.at(-1),history:chain,attribution:'Updates identify the authenticated sign-in; human, agent and model authorship are not independently verified.'};
}
export async function writeContinuation(s:Access,c:Context,input:Record<string,unknown>,resolve=false) {
  exact(input,resolve?'workspace_id,project_id,request_key':'workspace_id,project_id,request_key,expected,report,next_action');
  if(!UUID.test(String(input.request_key)))fail('invalid_request_key');
  const prior=c.chain.find(r=>r.request_key===input.request_key);
  if(resolve)return {outcome:prior?.continuation?.grant_id===c.g.grant_id?'saved':'unknown',
    saved:prior?.continuation?.grant_id===c.g.grant_id?prior:null,head:headBinding(c.chain.at(-1))};
  const expected=binding(input.expected),base=c.chain[expected.revision-1];
  if(!base||!sameBinding(headBinding(base),expected))fail('refresh_required',409);
  const payload={definition:base.definition,sources:base.sources,...(base.relations?{relations:base.relations}:{}),files:base.files??[],
    continuation:{grant_id:c.g.grant_id,principal_ref:s.principalHash,issuer_ref:c.g.issuer_hash,
      authentication:s.local?'local_fixture_email' as const:'verified_ingress_email' as const,
      obligation:c.g.obligation,report:boundedText(input.report,true),next_action:boundedText(input.next_action,true)}};
  const next=makeRevision(s,c.g.work_id,expected,String(input.request_key),payload,new Date().toISOString());
  if(prior){if(prior.request_fingerprint!==next.request_fingerprint)fail('altered_replay',409);return {outcome:'saved',saved:prior};}
  if(!sameBinding(headBinding(c.chain.at(-1)),expected))fail('refresh_required',409);
  if(c.chain.filter(r=>r.continuation?.grant_id===c.g.grant_id).length>=c.g.max_updates)fail('continuation_limit_reached',409);
  s.continuationGrant={id:c.g.grant_id,recipient_hash:c.g.recipient_hash,issuer_hash:c.g.issuer_hash};
  await append(s,c.chain,next);
  const current=await continuationContext(s),saved=current.chain.find(r=>r.request_key===input.request_key);
  if(!saved)fail('refresh_required',409);
  if(saved.request_fingerprint!==next.request_fingerprint)fail('altered_replay',409);
  return {outcome:'saved',saved};
}
