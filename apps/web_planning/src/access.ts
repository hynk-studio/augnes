import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { binding, canonical, exact, fail, FINGERPRINT, hash, UUID, type Binding, type Scope } from "./contract";
import { boundedDatabase, type Database, type Store } from "./store";
export interface Environment {
  DB: Database; APP_ORIGIN: string; OWNER_EMAIL: string; WORKSPACE_ID: string;
  PROJECT_ID: string; PROJECT_NAME?: string; AUTHOR_REF: string; REQUEST_SECRET: string;
  SITES_INGRESS_MODE?: string; RECONSTRUCTION_MODE?: string; PARTICIPATION_MODE?: string;
  PROJECT_ENTRY_MODE?: string; PROJECT_ADMITTED_EMAILS?: string; PUBLIC_REQUEST_MODE?: string; REQUEST_APPLICATION_MODE?: string;
  PUBLIC_SUCCESSION_MODE?: string;
}
export type Principal = { login: string | null; localFixture?: true; ingress?: "sites" | "cloudflare-access" };
export type Access = Store & { env: Environment; local: boolean; signout: string; recipientHash?: string;
  principalHash: string; ownerHash?: string; projectEntry?: true; projectName?: string; continuationWork?: string | null; successorId?: string };
export interface Ticket { kind: "save"; workspace_id: string; project_id: string; author_ref: string;
  work_id: string; request_key: string; expected: Binding; expires: number; payload_fingerprint?: string; draft_fingerprint?: string }
const loginPattern = /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/;
export function login(value: unknown): string | null { return typeof value==="string" && loginPattern.test(value) ? value.toLowerCase() : null; }
export function sitesPrincipal(request: Request, env: Environment): Principal {
  // This is a platform trust contract, not header-based standalone authentication.
  // Leave disabled until the Sites deployment proves overwrite + no backend bypass.
  if (env.SITES_INGRESS_MODE !== "verified-private-sites" || !env.APP_ORIGIN?.startsWith("https://")) return {login:null};
  return {login:login(request.headers.get("oai-authenticated-user-email")),ingress:"sites"};
}
export function projectEntryEnabled(env:Environment) { return env.PROJECT_ENTRY_MODE==='admitted-private-v1'; }
export function sharedHomeEnabled(env:Environment) {
  return projectEntryEnabled(env) && env.PUBLIC_SUCCESSION_MODE==='verified-email-home-v1';
}

export async function requireSharedHomeSchema(db:Database) {
  const ready=await db.prepare(`SELECT 1 FROM web_planning_schema WHERE version=6 AND EXISTS
    (SELECT 1 FROM sqlite_master WHERE type='index' AND name='web_planning_continuation_recipient')`).first();
  if(!ready)fail('shared_home_migration_required',503);
}
function projectAuthorAdmitted(env:Environment,email:string,refuse:(reason:string,code:string,status:number)=>never) {
  let admitted:unknown;
  try { admitted=JSON.parse(env.PROJECT_ADMITTED_EMAILS??'[]'); }
  catch { return refuse('admission_configuration','workspace_not_configured',503); }
  if(!Array.isArray(admitted)||admitted.length>100||admitted.some(value=>!login(value)))refuse('admission_configuration','workspace_not_configured',503);
  return email===login(env.OWNER_EMAIL)||admitted.some(value=>login(value)===email);
}
export function selectedProject(request:Request):string|null {
  const url=new URL(request.url),management=url.pathname.match(/^\/(?:delegations|publications)\/([a-f0-9-]{36})\/([a-f0-9-]{36})$/);
  const query=management?.[1]??(url.pathname==='/'?url.searchParams.get('project'):null),header=request.headers.get('x-web-planning-project');
  if(url.pathname==='/' && url.search && (url.searchParams.getAll('project').length!==1 || [...url.searchParams.keys()].some(k=>k!=='project')) ||
    query!==null && header!==null && query!==header || [query,header].some(v=>v!==null&&!UUID.test(v)))fail('scope_denied',403);
  return header??query;
}
export function applicationMode(env:Environment) {
  return env.REQUEST_APPLICATION_MODE==='verified-applicant-v1' &&
    env.PUBLIC_REQUEST_MODE==='selected-public-request-v1' && env.PARTICIPATION_MODE==='verified-recipient-v1';
}

// This context cannot be passed to a private work, project, or recipient reader.
export interface ApplicantAccess {
  DB:Database; env:Environment; login:string; principalHash:string; publicationId:string; local:boolean; signout:string;
}

function authenticateRequest(request:Request,env:Environment,principal:Principal,entry:boolean) {
  const url=new URL(request.url);
  // One fixed classification per refused entry; never serialize a request,
  // identity, environment value, or exception into production logs.
  function refuse(reason:string,code:string,status:number):never {
    if(entry && !principal.localFixture) console.warn(JSON.stringify({event:'web_planning_entry_refused',reason}));
    return fail(code,status);
  }
  let origin: URL;
  try { origin=new URL(env.APP_ORIGIN); } catch { refuse('configuration_origin','workspace_not_configured',503); }
  if (origin.origin!==env.APP_ORIGIN || !login(env.OWNER_EMAIL) || !UUID.test(env.WORKSPACE_ID) || !UUID.test(env.PROJECT_ID) ||
    !UUID.test(env.AUTHOR_REF) || typeof env.REQUEST_SECRET!=="string" || env.REQUEST_SECRET.length<32) refuse('configuration','workspace_not_configured',503);
  if(url.origin!==env.APP_ORIGIN) refuse('request_origin','same_origin_required',403);
  const requestOrigin=request.headers.get('origin');
  if(requestOrigin!==null && requestOrigin!==env.APP_ORIGIN) refuse('origin_header','same_origin_required',403);
  // Sign-in returns and external links can be cross-site navigations. Only the
  // exact entry page gets this exception, never APIs, subresources or frames.
  const navigation=entry && request.headers.get('sec-fetch-mode')==='navigate' && request.headers.get('sec-fetch-dest')==='document';
  if (["cross-site","same-site"].includes(request.headers.get("sec-fetch-site")??"") && !navigation) refuse('fetch_metadata','same_origin_required',403);
  if (!principal.localFixture && (origin.protocol!=="https:" || request.headers.has("x-web-planning-local-owner"))) refuse('untrusted_transport_or_local_identity','access_denied',403);
  if (!login(principal.login)) refuse(principal.ingress==='cloudflare-access'?'access_identity_unavailable':env.SITES_INGRESS_MODE!=='verified-private-sites'?'ingress_disabled':
    request.headers.has('oai-authenticated-user-email')?'identity_invalid':'identity_absent','access_denied',403);
  return refuse;
}

export function authorizeApplicant(request:Request,env:Environment,principal:Principal,publicationId:string):ApplicantAccess {
  if(!applicationMode(env) || !UUID.test(publicationId)) fail('application_unavailable',404);
  const url=new URL(request.url);
  const entry=request.method==='GET' && url.pathname==='/apply/'+publicationId && !url.search;
  authenticateRequest(request,env,principal,entry);
  const email=login(principal.login);
  if(!email || email.length>254 || (!principal.localFixture && !principal.ingress) ||
    url.search || request.headers.has('x-web-planning-project')) fail('access_denied',403);
  const DB=boundedDatabase(env.DB);
  return {DB,env:{...env,DB},publicationId,login:email,principalHash:hash(email),local:!!principal.localFixture,
    signout:principal.ingress==='cloudflare-access'?'/cdn-cgi/access/logout':'/signout-with-chatgpt'};
}
// A home can list grants for one verified email. It carries no work or project write scope.
export function authorizeSharedHome(request:Request,env:Environment,principal:Principal) {
  if(!sharedHomeEnabled(env))fail('not_found',404);
  const url=new URL(request.url);
  const entry=request.method==='GET' && !url.search && ['/', '/projects', '/shared-work'].includes(url.pathname);
  const refuse=authenticateRequest(request,env,principal,entry);
  const email=login(principal.login);
  if(!email || email.length>254 || (!principal.localFixture&&!principal.ingress) || request.headers.has('x-web-planning-project'))fail('access_denied',403);
  return {DB:boundedDatabase(env.DB),env,principalHash:hash(email),mayManageProjects:projectAuthorAdmitted(env,email,refuse),
    signout:principal.ingress==='cloudflare-access'?'/cdn-cgi/access/logout':'/signout-with-chatgpt'};
}
export type SharedHomeAccess=ReturnType<typeof authorizeSharedHome>;

export async function authorize(request: Request, env: Environment, principal: Principal, participant?:string, projectEntry=false, successor?:string): Promise<Access> {
  env={...env,DB:boundedDatabase(env.DB)};
  const url=new URL(request.url);
  const multi=projectEntryEnabled(env);
  const projectNavigation=url.searchParams.getAll('project').length===1 && [...url.searchParams.keys()].every(k=>k==='project') &&
    UUID.test(url.searchParams.get('project')??'') && (!request.headers.has('x-web-planning-project') || request.headers.get('x-web-planning-project')===url.searchParams.get('project'));
  const entry=request.method==='GET' && ((url.pathname==='/' && (!url.search || projectNavigation)) || (multi&&url.pathname==='/projects'&&!url.search) || (multi&&/^\/delegations\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(url.pathname)&&!url.search) || (env.PUBLIC_REQUEST_MODE==='selected-public-request-v1'&&/^\/publications\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(url.pathname)&&!url.search) || (multi&&successor&&url.pathname==='/continue/'+successor&&!url.search) || (participant && /^\/participate\/[a-f0-9-]{36}$/.test(url.pathname)&&!url.search));
  const refuse:(reason:string,code:string,status:number)=>never=authenticateRequest(request,env,principal,Boolean(entry));
  const selection=selectedProject(request);
  if(participant){if(!principal.localFixture&&!principal.ingress)refuse('ingress_unverified','access_denied',403);if(env.PARTICIPATION_MODE!=='verified-recipient-v1')refuse('participation_disabled','access_denied',403);}
  else if(multi){
    if(!principal.localFixture&&!principal.ingress)refuse('ingress_unverified','access_denied',403);
    const email=login(principal.login)!;
    if(!projectAuthorAdmitted(env,email,refuse)){
      if(!successor || !sharedHomeEnabled(env) || email.length>254)refuse('principal_not_admitted','access_denied',403);
      await requireSharedHomeSchema(env.DB);
    }
  } else if (login(principal.login)!==login(env.OWNER_EMAIL)) refuse('owner_mismatch','access_denied',403);
  const schema=await env.DB.prepare("SELECT version,(SELECT sql FROM sqlite_master WHERE name='web_planning_revision' AND type='table') AS revision_sql,EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='web_planning_file_part' AND instr(sql,'web_planning_part_ordinal')>0) AS parts FROM web_planning_schema").all<{version:number;revision_sql:string;parts:number}>();
  if (schema.results.length!==1 || ![4,5,6].includes(schema.results[0].version) || multi&&![5,6].includes(schema.results[0].version) || schema.results[0].parts!==1 || !schema.results[0].revision_sql?.includes('web_planning_revision_positive')) refuse('schema','incompatible_schema',503);
  const common={DB:env.DB,historyRead:{rows:0,bytes:0},env,local:principal.localFixture===true,principalHash:hash(login(principal.login)!),
    signout:principal.ingress==='cloudflare-access'?'/cdn-cgi/access/logout':'/signout-with-chatgpt'};
  if(projectEntry){
    if(!multi)refuse('entry_disabled','access_denied',403);
    return {...common,workspace_id:env.WORKSPACE_ID,project_id:env.PROJECT_ID,author_ref:env.AUTHOR_REF,projectEntry:true};
  }
  if(successor){
    if(!multi||schema.results[0].version!==6||!UUID.test(successor))fail('continuation_unavailable',403);
    const row=await env.DB.prepare(`SELECT w.*,g.work_id FROM web_planning_workspace w JOIN web_planning_continuation g
      ON g.workspace_id=w.workspace_id AND g.project_id=w.project_id AND g.issuer_hash=w.owner_login_hash
      WHERE g.grant_id=? AND g.recipient_hash=? AND g.workspace_id=?`).bind(successor,common.principalHash,env.WORKSPACE_ID).first<Record<string,any>>();
    if(!row||selection&&selection!==row.project_id)fail('continuation_unavailable',403);
    if(row.singleton===1&&(row.project_id!==env.PROJECT_ID||row.author_ref!==env.AUTHOR_REF||row.owner_login_hash!==hash(login(env.OWNER_EMAIL)!)))fail('workspace_mapping_mismatch',403);
    return {...common,workspace_id:row.workspace_id,project_id:row.project_id,author_ref:row.author_ref,
      ownerHash:row.owner_login_hash,recipientHash:common.principalHash,successorId:successor,continuationWork:row.work_id};
  }
  if(participant){
    if(!UUID.test(participant))fail('participation_unavailable',403);
    const {results}=await env.DB.prepare(`SELECT w.* FROM web_planning_workspace w JOIN web_planning_participation g
      ON g.workspace_id=w.workspace_id AND g.project_id=w.project_id WHERE g.grant_id=? AND g.recipient_hash=? LIMIT 2`)
      .bind(participant,common.principalHash).all<Record<string,any>>();
    if(results.length!==1 || results[0].workspace_id!==env.WORKSPACE_ID || !multi && results[0].project_id!==env.PROJECT_ID ||
      selection && selection!==results[0].project_id)fail('participation_unavailable',403);
    const row=results[0];
    if(row.singleton!==1)return {...common,workspace_id:row.workspace_id,project_id:row.project_id,author_ref:row.author_ref,ownerHash:row.owner_login_hash,recipientHash:common.principalHash};
  }
  if(multi && selection && selection!==env.PROJECT_ID){
    const row=await env.DB.prepare('SELECT * FROM web_planning_workspace WHERE workspace_id=? AND project_id=? AND owner_login_hash=?')
      .bind(env.WORKSPACE_ID,selection,common.principalHash).first<Record<string,any>>();
    if(!row)refuse('project_scope','access_denied',403);
    return {...common,workspace_id:row.workspace_id,project_id:row.project_id,author_ref:row.author_ref,ownerHash:row.owner_login_hash,
      projectName:row.name,continuationWork:row.continuation_work_id};
  }
  if(!participant && (selection&&selection!==env.PROJECT_ID || login(principal.login)!==login(env.OWNER_EMAIL)))refuse('project_scope','access_denied',403);
  let owners=await env.DB.prepare("SELECT singleton,workspace_id,project_id,author_ref,owner_login_hash FROM web_planning_workspace WHERE singleton=1").all<Record<string,unknown>>();
  const expected={ singleton:1, workspace_id:env.WORKSPACE_ID, project_id:env.PROJECT_ID,
    author_ref:env.AUTHOR_REF, owner_login_hash:hash(login(env.OWNER_EMAIL)!) };
  // A normal authenticated owner page may initialize an empty hosted store.
  // Never trust a first visitor, local fixture, setup URL, or changed config to
  // choose/repair ownership. The single statement settles concurrent requests;
  // an exact reread admits only the configured mapping (including a race winner).
  if(owners.results.length===0 && !participant && !principal.localFixture &&
    principal.ingress && request.method==='GET' && url.pathname==='/' && (!url.search || selection===env.PROJECT_ID)) {
    await env.DB.prepare(`INSERT INTO web_planning_workspace(singleton,workspace_id,project_id,author_ref,owner_login_hash)
      SELECT 1,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM web_planning_workspace WHERE singleton=1)
        AND NOT EXISTS(SELECT 1 FROM web_planning_revision WHERE workspace_id=? AND project_id=?)
        AND NOT EXISTS(SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=?)
        AND (SELECT count(*) FROM web_planning_schema)=1
        AND EXISTS(SELECT 1 FROM web_planning_schema WHERE version IN (4,5,6))
        AND NOT EXISTS(SELECT 1 FROM web_planning_file WHERE workspace_id=? AND project_id=?)
      ON CONFLICT DO NOTHING`)
      .bind(expected.workspace_id,expected.project_id,expected.author_ref,expected.owner_login_hash,...Array(3).fill([expected.workspace_id,expected.project_id]).flat()).run();
    owners=await env.DB.prepare("SELECT singleton,workspace_id,project_id,author_ref,owner_login_hash FROM web_planning_workspace WHERE singleton=1").all<Record<string,unknown>>();
  }
  if(owners.results.length!==1 || canonical(owners.results[0])!==canonical(expected)) refuse(
    owners.results.length===0?'mapping_absent':'mapping_mismatch','workspace_mapping_mismatch',403);
  return {...common,workspace_id:env.WORKSPACE_ID,project_id:env.PROJECT_ID,author_ref:env.AUTHOR_REF,ownerHash:expected.owner_login_hash,
    projectName:env.PROJECT_NAME,...(participant?{recipientHash:common.principalHash}:{})};
}
export function seal(access: Pick<Access,"env">, material: unknown): string {
  const text=Buffer.from(canonical(material)).toString("base64url");
  return text+"."+createHmac("sha256",access.env.REQUEST_SECRET).update(text).digest("base64url");
}
export function unseal(access: Pick<Access,"env">, value: unknown): Record<string,any> {
  if(typeof value!=="string" || value.length>2500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) fail("invalid_request_binding",403);
  const [data,sig]=value.split(".");
  const expected=createHmac("sha256",access.env.REQUEST_SECRET).update(data).digest();
  const actual=Buffer.from(sig,"base64url");
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected)) fail("invalid_request_binding",403);
  try { return JSON.parse(Buffer.from(data,"base64url").toString("utf8")); } catch { fail("invalid_request_binding",403); }
}
function identity(s: Scope) { return {workspace_id:s.workspace_id,project_id:s.project_id,author_ref:s.author_ref}; }
export function ticket(access: Access, work_id: string, expected: Binding, payloadFingerprint?:string,draftFingerprint?:string): string {
  return seal(access,{kind:"save",...identity(access),work_id,request_key:crypto.randomUUID(),expected,expires:Date.now()+86_400_000,...(payloadFingerprint?{payload_fingerprint:payloadFingerprint}:{}),...(draftFingerprint?{draft_fingerprint:draftFingerprint}:{})});
}
export function readTicket(access: Access, value: unknown, work_id: string, allowExpired=false): Ticket {
  const t=unseal(access,value);
  exact(t,"kind,workspace_id,project_id,author_ref,work_id,request_key,expected,expires"+("payload_fingerprint" in t?",payload_fingerprint":"")+("draft_fingerprint" in t?",draft_fingerprint":""));
  if(t.kind!=="save" || t.work_id!==work_id || !UUID.test(t.work_id) || !UUID.test(t.request_key) ||
    t.workspace_id!==access.workspace_id || t.project_id!==access.project_id || t.author_ref!==access.author_ref ||
    !Number.isSafeInteger(t.expires)) fail("invalid_request_binding",403);
  binding(t.expected);
  if("payload_fingerprint" in t && !FINGERPRINT.test(t.payload_fingerprint))fail("invalid_request_binding",403);
  if("draft_fingerprint" in t && (!t.payload_fingerprint || !FINGERPRINT.test(t.draft_fingerprint)))fail("invalid_request_binding",403);
  if(!allowExpired && t.expires<Date.now()) fail("save_ticket_expired",409);
  return t as Ticket;
}
const COOKIE="web_planning_csrf";
type CsrfContext = Access | ApplicantAccess;
function csrfCookieName(access:CsrfContext):string {
  if('publicationId' in access)return COOKIE+'_apply_'+access.publicationId;
  if(!projectEntryEnabled(access.env))return COOKIE;
  if(access.projectEntry)return COOKIE+'_account_'+access.principalHash.slice(7);
  return COOKIE+'_project_'+access.project_id+(access.successorId?'_successor_'+access.successorId:'')+(access.recipientHash?'_recipient_'+access.recipientHash.slice(7):'');
}
function cookie(access:CsrfContext,request:Request):string|null {
  const name=csrfCookieName(access);
  const values=(request.headers.get("cookie")??"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(name+"="));
  return values.length===1? values[0].slice(name.length+1):null;
}
function csrfBinding(access:CsrfContext):Record<string,string> {
  if('publicationId' in access) return {workspace_id:access.env.WORKSPACE_ID,publication_id:access.publicationId,
    applicant:access.principalHash,operation:'apply'};
  return {...identity(access),...(access.recipientHash?{recipient:access.recipientHash}:{}),
    ...(access.successorId?{delegation:access.successorId}:{}),...(access.projectEntry?{account:access.principalHash}:{})};
}
export function csrfToken(access:CsrfContext,request:Request):string {
  const existing=cookie(access,request);
  try { if(existing) { validateCsrf(access,existing); return existing; } } catch { /* The entry page rebinds an expired token. */ }
  return seal(access,{kind:"csrf",...csrfBinding(access),nonce:crypto.randomUUID(),expires:Date.now()+86_400_000});
}
function validateCsrf(access:CsrfContext,value:unknown) {
  const t=unseal(access,value),bound=csrfBinding(access);
  exact(t,['kind','nonce','expires',...Object.keys(bound)].join(','));
  if(t.kind!=="csrf" || Object.entries(bound).some(([key,expected])=>t[key]!==expected) ||
    !UUID.test(t.nonce) || !Number.isSafeInteger(t.expires) || t.expires<Date.now()) fail("csrf_required",403);
}
export function csrfCookie(access:CsrfContext,token:string) { return `${csrfCookieName(access)}=${token}; Path=/; HttpOnly; SameSite=Strict${access.local?"":"; Secure"}`; }
export function requireCsrf(access:CsrfContext,request:Request) {
  if(request.headers.get("origin")!==access.env.APP_ORIGIN || !cookie(access,request) || request.headers.get("x-csrf-token")!==cookie(access,request)) fail("csrf_required",403);
  validateCsrf(access,cookie(access,request));
}
export function requireScope(access:Access,body:Record<string,any>) {
  if(body.workspace_id!==access.workspace_id || body.project_id!==access.project_id) fail("scope_denied",403);
}
