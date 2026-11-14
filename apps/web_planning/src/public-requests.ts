import { login, projectEntryEnabled, requireScope, type Access, type Environment } from './access';
import { binding, boundedText, canonical, exact, fail, hash, headBinding, reference, sameBinding, UUID, workRef, type Binding, type WorkRef } from './contract';
import { boundedDatabase, readWork, type Database, type Store } from './store';
import { detectPrivacyRedactionRuntimeGuardFindingsV01 } from '../../../lib/privacy/redaction-guard';

const MODE = 'selected-public-request-v1';
const SCHEMA = 'augnes.public-request.v1';
const SUMMARY_KEYS = 'project,title,purpose,need,reason,evidence,expected_return,checking_use';
export interface PublicRequestSummary {
  project:string; title:string; purpose:string; need:string; reason:string;
  evidence:string; expected_return:string; checking_use:string;
}
interface Material {
  request:WorkRef; expected:Binding; grant_id:string; summary:PublicRequestSummary;
  issuer_ref:string; authentication:'local_fixture_email'|'verified_ingress_email'; expires:number;
}
interface Publication {
  publication_id:string; workspace_id:string; project_id:string; work_id:string;
  issuer_hash:string; grant_id:string; grant_fingerprint:string;
  material:string; material_fingerprint:string; created_at:string; expires:number; revoked_at:string|null;
}
interface Grant {
  grant_id:string; work_id:string; disclosure:string; disclosure_fingerprint:string; expires:number; revoked_at:string|null;
}
const scope = (s:Access) => [s.workspace_id,s.project_id];
const where = 'workspace_id=? AND project_id=? AND work_id=? AND publication_id=?';
const nowSql = "(julianday('now')-2440587.5)*86400000";

function owner(s:Access) {
  if(s.recipientHash || s.successorId || s.projectEntry || s.principalHash!==s.ownerHash) fail('scope_denied',403);
}
async function tables(db:Database) {
  const rows=await db.prepare(`SELECT version,
    EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='web_planning_public_request') AS publication,
    EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='web_planning_participation') AS participation
    FROM web_planning_schema`).all<{version:number;publication:number;participation:number}>();
  if(rows.results.length!==1 || rows.results[0].version!==6 || rows.results[0].publication!==1 || rows.results[0].participation!==1)
    fail('public_request_migration_required',503);
}
export async function publicRequestsAvailable(s:Access) {
  if(s.env.PUBLIC_REQUEST_MODE!==MODE) fail('public_requests_disabled',403);
  await tables(s.DB);
}
// Defense in depth, not a classifier that makes arbitrary private prose safe.
// The publisher still explicitly selects and confirms every public field.
function containsLocalPath(value:string) {
  if(/^[\\/]/u.test(value.trim()) || /\bfile:\/\//iu.test(value) ||
    /(?:^|[\s("'`])\/(?!\/)(?:[^/\s"'`]+\/)+[^/\s"'`]+/u.test(value) ||
    /(?:^|[\s("'`])\\\\[^\s"'`]+\\[^\s"'`]+/u.test(value)) return true;
  // A spaced prose label ("C: notes") is not a drive-qualified path.
  return [...value.matchAll(/(?:^|[\s("'`])[a-zA-Z]:/gu)].some(match=>
    !/^[A-Za-z]:[ \t]+[\p{L}\p{N}]/u.test(value.slice(match.index+match[0].length-2)));
}
function summary(value:unknown):PublicRequestSummary {
  exact(value,SUMMARY_KEYS);
  const result:Record<string,string>={};
  for(const key of SUMMARY_KEYS.split(',')) {
    const text=boundedText(value[key],true);
    if(containsLocalPath(text) || /[\w.+-]+@[\w.-]+\.[a-z]{2,}/iu.test(text) ||
      /\b(?:cookie|authorization|token|secret|account_id|session_id|OPENAI_API_KEY|GITHUB_TOKEN)\s*[:=]/iu.test(text) ||
      detectPrivacyRedactionRuntimeGuardFindingsV01(text).some(f=>f.action!=='allowed')) fail('public_material_not_publishable');
    result[key]=text;
  }
  return result as unknown as PublicRequestSummary;
}
function material(p:Publication):Material {
  let m:Record<string,any>;
  try { m=JSON.parse(p.material); } catch { fail('public_request_integrity',503); }
  exact(m,'request,expected,grant_id,summary,issuer_ref,authentication,expires');
  if(hash(canonical(m))!==p.material_fingerprint || m.request?.work_id!==p.work_id || m.grant_id!==p.grant_id ||
    !UUID.test(m.grant_id) || !UUID.test(m.issuer_ref) || !['local_fixture_email','verified_ingress_email'].includes(m.authentication) ||
    m.expires!==p.expires || !Number.isSafeInteger(p.expires) ||
    !Number.isFinite(Date.parse(p.created_at))) fail('public_request_integrity',503);
  workRef(m.request);binding(m.expected);summary(m.summary);
  return m as Material;
}
function ownerView(s:Access,p:Publication) {
  const m=material(p);
  return {id:p.publication_id,work_id:p.work_id,request:m.request,expected:m.expected,grant_id:p.grant_id,
    summary:m.summary,issuer_ref:m.issuer_ref,created_at:p.created_at,expires:p.expires,revoked_at:p.revoked_at,
    link:s.env.APP_ORIGIN+'/public-requests/'+p.publication_id};
}
async function find(s:Access,id:string,publicationId:string) {
  return s.DB.prepare(`SELECT * FROM web_planning_public_request WHERE ${where}`).bind(...scope(s),id,publicationId).first<Publication>();
}
function locator(s:Access,id:string,input:Record<string,unknown>) {
  requireScope(s,input);
  if(!UUID.test(id) || !UUID.test(String(input.publication_id))) fail('invalid_public_request');
  return String(input.publication_id);
}
function validDisclosure(g:Grant,m:Pick<Material,'request'|'expected'>) {
  let d:Record<string,any>;
  try { d=JSON.parse(g.disclosure); } catch { fail('participation_integrity',503); }
  if(hash(canonical(d))!==g.disclosure_fingerprint) fail('participation_integrity',503);
  return canonical(d.request)===canonical(m.request) && canonical(d.expected)===canonical(m.expected);
}
export async function createPublicRequest(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await publicRequestsAvailable(s);
  exact(input,'workspace_id,project_id,publication_id,request,expected,grant_id,summary,expires,confirm');
  const publicationId=locator(s,id,input),request=workRef(input.request),expected=binding(input.expected);
  if(request.work_id!==id || !UUID.test(String(input.grant_id))) fail('invalid_public_request');
  if(input.confirm!=='publish-selected-request') fail('confirmation_required');
  if(!Number.isSafeInteger(input.expires)) fail('invalid_public_request_expiry');
  const m:Material={request,expected,grant_id:String(input.grant_id),summary:summary(input.summary),issuer_ref:s.author_ref,
    authentication:s.local?'local_fixture_email':'verified_ingress_email',expires:Number(input.expires)};
  const encoded=canonical(m),fingerprint=hash(encoded),prior=await find(s,id,publicationId);
  if(prior) {
    if(prior.material_fingerprint!==fingerprint || prior.issuer_hash!==s.principalHash) fail('altered_replay',409);
    return ownerView(s,prior);
  }
  if(s.env.PARTICIPATION_MODE!=='verified-recipient-v1') fail('public_response_route_unavailable',409);
  if(m.expires<=Date.now() || m.expires>Date.now()+90*86400000) fail('invalid_public_request_expiry');
  const chain=await readWork(s,id),r=chain[request.revision-1];
  if(!r || r.exchange?.kind!=='request' || canonical(reference(r))!==canonical(request)) fail('exchange_request_unavailable',409);
  if(!sameBinding(headBinding(chain.at(-1)),expected)) fail('refresh_required',409);
  if(chain.some(v=>v.exchange?.basis?.fingerprint===request.fingerprint)) fail('exchange_already_answered',409);
  const grant=await s.DB.prepare('SELECT * FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id=?')
    .bind(...scope(s),id,m.grant_id).first<Grant>();
  if(!grant || grant.revoked_at!==null || grant.expires<=Date.now() || !validDisclosure(grant,m)) fail('public_response_route_unavailable',409);
  if(m.expires>grant.expires) fail('invalid_public_request_expiry');
  const createdAt=new Date().toISOString();
  // Currentness, reply authority and erasure are checked by the committing SQL,
  // not only by the preceding read. The public summary never changes work bytes.
  await s.DB.prepare(`INSERT INTO web_planning_public_request
    (publication_id,workspace_id,project_id,work_id,issuer_hash,grant_id,grant_fingerprint,material,material_fingerprint,created_at,expires)
    SELECT ?,?,?,?,?,?,?,?,?,?,?
    WHERE NOT EXISTS(SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=? AND work_id=?)
      AND EXISTS(SELECT 1 FROM web_planning_workspace WHERE workspace_id=? AND project_id=? AND owner_login_hash=? AND author_ref=?)
      AND (SELECT MAX(revision) FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=?)=?
      AND EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=? AND revision=? AND fingerprint=?)
      AND EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=? AND revision=? AND fingerprint=? AND json_extract(envelope,'$.exchange.kind')='request')
      AND NOT EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND work_id=? AND json_extract(envelope,'$.exchange.basis.fingerprint')=?)
      AND EXISTS(SELECT 1 FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id=?
        AND disclosure_fingerprint=? AND revoked_at IS NULL AND expires>=? AND expires>${nowSql})
      AND ?>${nowSql}
    ON CONFLICT DO NOTHING`).bind(publicationId,...scope(s),id,s.principalHash,m.grant_id,grant.disclosure_fingerprint,encoded,fingerprint,createdAt,m.expires,
      ...scope(s),id,...scope(s),s.principalHash,s.author_ref,...scope(s),id,expected.revision,...scope(s),id,expected.revision,expected.fingerprint,
      ...scope(s),id,request.revision,request.fingerprint,...scope(s),id,request.fingerprint,
      ...scope(s),id,m.grant_id,grant.disclosure_fingerprint,m.expires,m.expires).run();
  const saved=await find(s,id,publicationId);
  if(!saved) fail('refresh_required',409);
  if(saved.material_fingerprint!==fingerprint || saved.issuer_hash!==s.principalHash) fail('altered_replay',409);
  return ownerView(s,saved);
}
export async function resolvePublicRequest(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await publicRequestsAvailable(s);exact(input,'workspace_id,project_id,publication_id');
  const p=await find(s,id,locator(s,id,input));
  return {outcome:p?'created':'unknown',publication:p?ownerView(s,p):null};
}
export async function listPublicRequests(s:Access,id:string,cursor='') {
  owner(s);await publicRequestsAvailable(s);
  if(!UUID.test(id) || cursor&&!UUID.test(cursor)) fail('invalid_cursor');
  const {results}=await s.DB.prepare(`SELECT * FROM web_planning_public_request
    WHERE workspace_id=? AND project_id=? AND work_id=? AND publication_id>? ORDER BY publication_id LIMIT 11`)
    .bind(...scope(s),id,cursor).all<Publication>();
  return {publications:results.slice(0,10).map(p=>ownerView(s,p)),next:results.length>10?results[9].publication_id:null};
}
export async function revokePublicRequest(s:Access,id:string,input:Record<string,unknown>) {
  owner(s);await publicRequestsAvailable(s);exact(input,'workspace_id,project_id,publication_id');
  const publicationId=locator(s,id,input);
  await s.DB.prepare(`UPDATE web_planning_public_request SET revoked_at=COALESCE(revoked_at,?) WHERE ${where}`)
    .bind(new Date().toISOString(),...scope(s),id,publicationId).run();
  const p=await find(s,id,publicationId);if(!p) fail('public_request_unavailable',404);
  return ownerView(s,p);
}
type PublicStatus='withdrawn'|'expired'|'source_unavailable'|'response_unavailable';
function tombstone(id:string,status:PublicStatus) { return {schema:SCHEMA,id,status,available:false as const}; }
export async function readPublicRequest(env:Environment,publicId:string) {
  if(env.PUBLIC_REQUEST_MODE!==MODE || !UUID.test(publicId)) fail('public_request_unavailable',404);
  let origin:URL;
  try { origin=new URL(env.APP_ORIGIN); } catch { fail('workspace_not_configured',503); }
  if(origin.origin!==env.APP_ORIGIN || !(origin.protocol==='https:' || origin.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname)) ||
    !UUID.test(env.WORKSPACE_ID) || !UUID.test(env.PROJECT_ID) || !UUID.test(env.AUTHOR_REF) || !login(env.OWNER_EMAIL) ||
    typeof env.REQUEST_SECRET!=='string' || env.REQUEST_SECRET.length<32) fail('workspace_not_configured',503);
  const DB=boundedDatabase(env.DB);await tables(DB);
  type Joined=Publication & {mapped_author:string;mapped_owner:string;singleton:number};
  const read=()=>DB.prepare(`SELECT p.*,w.author_ref AS mapped_author,w.owner_login_hash AS mapped_owner,w.singleton
    FROM web_planning_public_request p JOIN web_planning_workspace w ON w.workspace_id=p.workspace_id AND w.project_id=p.project_id
    WHERE p.publication_id=? AND p.workspace_id=?`).bind(publicId,env.WORKSPACE_ID).first<Joined>();
  const p=await read();if(!p) fail('public_request_unavailable',404);
  if(p.revoked_at!==null) return tombstone(publicId,'withdrawn');
  if(p.expires<=Date.now()) return tombstone(publicId,'expired');
  const m=material(p);
  if(p.mapped_owner!==p.issuer_hash || p.mapped_author!==m.issuer_ref ||
    (!projectEntryEnabled(env)&&p.project_id!==env.PROJECT_ID) ||
    p.singleton===1&&(p.project_id!==env.PROJECT_ID || p.mapped_author!==env.AUTHOR_REF || p.mapped_owner!==hash(login(env.OWNER_EMAIL)!)))
    return tombstone(publicId,'source_unavailable');
  if(env.PARTICIPATION_MODE!=='verified-recipient-v1') return tombstone(publicId,'response_unavailable');
  const store:Store={DB,workspace_id:p.workspace_id,project_id:p.project_id,author_ref:m.issuer_ref,historyRead:{rows:0,bytes:0}};
  if(await DB.prepare('SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=? AND work_id=?')
    .bind(p.workspace_id,p.project_id,p.work_id).first()) return tombstone(publicId,'source_unavailable');
  const chain=await readWork(store,p.work_id),r=chain[m.request.revision-1];
  if(!r || r.exchange?.kind!=='request' || canonical(reference(r))!==canonical(m.request)) return tombstone(publicId,'source_unavailable');
  const g=await DB.prepare('SELECT * FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id=?')
    .bind(p.workspace_id,p.project_id,p.work_id,p.grant_id).first<Grant>();
  if(!g || g.revoked_at!==null || g.expires<=Date.now() || g.disclosure_fingerprint!==p.grant_fingerprint || !validDisclosure(g,m))
    return tombstone(publicId,'response_unavailable');
  const answered=chain.some(v=>v.exchange?.basis?.fingerprint===m.request.fingerprint);
  const status=answered?'answered':sameBinding(headBinding(chain.at(-1)),m.expected)?'active':'stale';
  // Recheck the complete disclosure eligibility immediately before returning a
  // public projection, including source head changes while history was read.
  const current=await DB.prepare(`SELECT p.revoked_at,p.expires,g.revoked_at AS grant_revoked,g.expires AS grant_expires,
      EXISTS(SELECT 1 FROM web_planning_erased e WHERE e.workspace_id=p.workspace_id AND e.project_id=p.project_id AND e.work_id=p.work_id) AS erased,
      (SELECT MAX(v.revision) FROM web_planning_revision v WHERE v.workspace_id=p.workspace_id AND v.project_id=p.project_id AND v.work_id=p.work_id) AS revision,
      (SELECT v.fingerprint FROM web_planning_revision v WHERE v.workspace_id=p.workspace_id AND v.project_id=p.project_id AND v.work_id=p.work_id ORDER BY v.revision DESC LIMIT 1) AS head_fingerprint
    FROM web_planning_public_request p JOIN web_planning_participation g ON g.workspace_id=p.workspace_id AND g.project_id=p.project_id AND g.work_id=p.work_id AND g.grant_id=p.grant_id
    JOIN web_planning_workspace w ON w.workspace_id=p.workspace_id AND w.project_id=p.project_id AND w.owner_login_hash=p.issuer_hash
    WHERE p.publication_id=? AND p.material_fingerprint=? AND g.disclosure_fingerprint=? AND w.author_ref=?`)
    .bind(publicId,p.material_fingerprint,p.grant_fingerprint,m.issuer_ref).first<{revoked_at:string|null;expires:number;grant_revoked:string|null;grant_expires:number;erased:number;revision:number|null;head_fingerprint:string|null}>();
  if(!current || current.erased) return tombstone(publicId,'source_unavailable');
  if(current.revoked_at!==null) return tombstone(publicId,'withdrawn');
  if(current.expires<=Date.now()) return tombstone(publicId,'expired');
  if(current.grant_revoked!==null || current.grant_expires<=Date.now()) return tombstone(publicId,'response_unavailable');
  if(current.revision!==chain.at(-1)!.revision || current.head_fingerprint!==chain.at(-1)!.fingerprint) fail('public_request_changed',409);
  return {schema:SCHEMA,id:publicId,status,available:true as const,summary:m.summary,
    source:{request:m.request,publication_fingerprint:p.material_fingerprint,published_at:p.created_at},
    issuer:{author_ref:m.issuer_ref,authentication:m.authentication,
      boundary:'This request was published by the authenticated project principal. This is attribution, not independently verified real-world or agent identity.'},
    expires:p.expires,observed_at:new Date().toISOString(),
    reply:{url:env.APP_ORIGIN+'/participate/'+p.grant_id,can_submit:status==='active',
      requirements:'Only the separately authenticated recipient of the existing scoped participation grant may submit. Public reading or possession of this link grants no access or authority.'},
    boundary:'Owner-selected authored public summary, not independently verified findings or native accepted state. No spending, execution or new obligation is authorized. Withdrawal stops current service disclosure; it cannot recall copies already obtained.'};
}
export type PublicRequestView = Awaited<ReturnType<typeof readPublicRequest>>;
