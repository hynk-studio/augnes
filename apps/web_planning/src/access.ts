import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { binding, canonical, exact, fail, FINGERPRINT, hash, UUID, type Binding, type Scope } from "./contract";
import type { Database, Store } from "./store";
export interface Environment {
  DB: Database; APP_ORIGIN: string; OWNER_EMAIL: string; WORKSPACE_ID: string;
  PROJECT_ID: string; AUTHOR_REF: string; REQUEST_SECRET: string;
  SITES_INGRESS_MODE?: string; RECONSTRUCTION_MODE?: string;
}
export type Principal = { login: string | null; localFixture?: true };
export type Access = Store & { env: Environment; local: boolean };
export interface Ticket { kind: "save"; workspace_id: string; project_id: string; author_ref: string;
  work_id: string; request_key: string; expected: Binding; expires: number; payload_fingerprint?: string }
const loginPattern = /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/;
function login(value: unknown): string | null { return typeof value==="string" && loginPattern.test(value) ? value.toLowerCase() : null; }
export function sitesPrincipal(request: Request, env: Environment): Principal {
  // This is a platform trust contract, not header-based standalone authentication.
  // Leave disabled until the Sites deployment proves overwrite + no backend bypass.
  if (env.SITES_INGRESS_MODE !== "verified-private-sites" || !env.APP_ORIGIN?.startsWith("https://")) return {login:null};
  return {login:login(request.headers.get("oai-authenticated-user-email"))};
}
export async function authorize(request: Request, env: Environment, principal: Principal): Promise<Access> {
  const url=new URL(request.url);
  const entry=request.method==='GET' && url.pathname==='/' && !url.search;
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
  if (!login(principal.login)) refuse(env.SITES_INGRESS_MODE!=='verified-private-sites'?'ingress_disabled':
    request.headers.has('oai-authenticated-user-email')?'identity_invalid':'identity_absent','access_denied',403);
  if (login(principal.login)!==login(env.OWNER_EMAIL)) refuse('owner_mismatch','access_denied',403);
  const schema=await env.DB.prepare("SELECT version FROM web_planning_schema").all<{version:number}>();
  if (schema.results.length!==1 || schema.results[0].version!==1) refuse('schema','incompatible_schema',503);
  let owners=await env.DB.prepare("SELECT * FROM web_planning_workspace").all<Record<string,unknown>>();
  const expected={ singleton:1, workspace_id:env.WORKSPACE_ID, project_id:env.PROJECT_ID,
    author_ref:env.AUTHOR_REF, owner_login_hash:hash(login(env.OWNER_EMAIL)!) };
  // A normal authenticated owner page may initialize an empty hosted store.
  // Never trust a first visitor, local fixture, setup URL, or changed config to
  // choose/repair ownership. The single statement settles concurrent requests;
  // an exact reread admits only the configured mapping (including a race winner).
  if(owners.results.length===0 && !principal.localFixture &&
    env.SITES_INGRESS_MODE==='verified-private-sites' && request.method==='GET' && url.pathname==='/' && !url.search) {
    await env.DB.prepare(`INSERT INTO web_planning_workspace(singleton,workspace_id,project_id,author_ref,owner_login_hash)
      SELECT 1,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM web_planning_workspace)
        AND NOT EXISTS(SELECT 1 FROM web_planning_revision)
        AND NOT EXISTS(SELECT 1 FROM web_planning_erased)
        AND (SELECT count(*) FROM web_planning_schema)=1
        AND EXISTS(SELECT 1 FROM web_planning_schema WHERE version=1)
      ON CONFLICT DO NOTHING`)
      .bind(expected.workspace_id,expected.project_id,expected.author_ref,expected.owner_login_hash).run();
    owners=await env.DB.prepare("SELECT * FROM web_planning_workspace").all<Record<string,unknown>>();
  }
  if(owners.results.length!==1 || canonical(owners.results[0])!==canonical(expected)) refuse(
    owners.results.length===0?'mapping_absent':'mapping_mismatch','workspace_mapping_mismatch',403);
  return {DB:env.DB,workspace_id:env.WORKSPACE_ID,project_id:env.PROJECT_ID,author_ref:env.AUTHOR_REF,env,local:principal.localFixture===true};
}
export function seal(access: Access, material: unknown): string {
  const text=Buffer.from(canonical(material)).toString("base64url");
  return text+"."+createHmac("sha256",access.env.REQUEST_SECRET).update(text).digest("base64url");
}
export function unseal(access: Access, value: unknown): Record<string,any> {
  if(typeof value!=="string" || value.length>2500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) fail("invalid_request_binding",403);
  const [data,sig]=value.split(".");
  const expected=createHmac("sha256",access.env.REQUEST_SECRET).update(data).digest();
  const actual=Buffer.from(sig,"base64url");
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected)) fail("invalid_request_binding",403);
  try { return JSON.parse(Buffer.from(data,"base64url").toString("utf8")); } catch { fail("invalid_request_binding",403); }
}
function identity(s: Scope) { return {workspace_id:s.workspace_id,project_id:s.project_id,author_ref:s.author_ref}; }
export function ticket(access: Access, work_id: string, expected: Binding, payloadFingerprint?:string): string {
  return seal(access,{kind:"save",...identity(access),work_id,request_key:crypto.randomUUID(),expected,expires:Date.now()+86_400_000,...(payloadFingerprint?{payload_fingerprint:payloadFingerprint}:{})});
}
export function readTicket(access: Access, value: unknown, work_id: string, allowExpired=false): Ticket {
  const t=unseal(access,value);
  exact(t,"kind,workspace_id,project_id,author_ref,work_id,request_key,expected,expires"+("payload_fingerprint" in t?",payload_fingerprint":""));
  if(t.kind!=="save" || t.work_id!==work_id || !UUID.test(t.work_id) || !UUID.test(t.request_key) ||
    t.workspace_id!==access.workspace_id || t.project_id!==access.project_id || t.author_ref!==access.author_ref ||
    !Number.isSafeInteger(t.expires)) fail("invalid_request_binding",403);
  binding(t.expected);
  if("payload_fingerprint" in t && !FINGERPRINT.test(t.payload_fingerprint))fail("invalid_request_binding",403);
  if(!allowExpired && t.expires<Date.now()) fail("save_ticket_expired",409);
  return t as Ticket;
}
const COOKIE="web_planning_csrf";
function cookie(request:Request):string|null {
  const values=(request.headers.get("cookie")??"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(COOKIE+"="));
  return values.length===1? values[0].slice(COOKIE.length+1):null;
}
export function csrfToken(access: Access, request: Request): string {
  const existing=cookie(request);
  try { if(existing) { validateCsrf(access,existing); return existing; } } catch { /* New page explicitly rebinds an expired CSRF token. */ }
  return seal(access,{kind:"csrf",...identity(access),nonce:crypto.randomUUID(),expires:Date.now()+86_400_000});
}
function validateCsrf(access:Access,value:unknown) {
  const t=unseal(access,value);
  exact(t,"kind,workspace_id,project_id,author_ref,nonce,expires");
  if(t.kind!=="csrf" || t.workspace_id!==access.workspace_id || t.project_id!==access.project_id || t.author_ref!==access.author_ref ||
    !UUID.test(t.nonce) || !Number.isSafeInteger(t.expires) || t.expires<Date.now()) fail("csrf_required",403);
}
export function csrfCookie(access:Access,token:string) { return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict${access.local?"":"; Secure"}`; }
export function requireCsrf(access:Access,request:Request) {
  if(request.headers.get("origin")!==access.env.APP_ORIGIN || !cookie(request) || request.headers.get("x-csrf-token")!==cookie(request)) fail("csrf_required",403);
  validateCsrf(access,cookie(request));
}
export function requireScope(access:Access,body:Record<string,any>) {
  if(body.workspace_id!==access.workspace_id || body.project_id!==access.project_id) fail("scope_denied",403);
}
