import { WorkOS } from '@workos-inc/node';
import { AuthService, CookieSessionStorage, selectStalePKCEVerifierCookieNames, sessionEncryption, type AuthKitConfig, type CookieOptions,
  type HeadersBag } from '@workos/authkit-session';
import { login, sharedHomeEnabled, type Environment } from './access';
import { UUID } from './contract';
import { handle } from './handler';
import { style } from './page';

type RecipientEnvironment = Environment & { WORKOS_CLIENT_ID: string; WORKOS_ISSUER: string; WORKOS_COOKIE_PASSWORD: string };
const cookiePrefix='__Host-';
class RecipientCookies extends CookieSessionStorage<Request,undefined> {
  protected serializeCookie(name:string,value:string,options:CookieOptions,flags?:{expired?:boolean}) {
    return super.serializeCookie(cookiePrefix+name,value,{...options,secure:true},flags);
  }
  async getCookie(request:Request,name:string) {
    const key=cookiePrefix+name+'=';
    const matches=(request.headers.get('Cookie')??'').split(';').map(part=>part.trim()).filter(part=>part.startsWith(key));
    if(matches.length!==1)return null;
    try {return decodeURIComponent(matches[0].slice(key.length));} catch {return null;}
  }
}
const services=new WeakMap<RecipientEnvironment,AuthService<Request,undefined>>();
function serviceFor(env:RecipientEnvironment) {
  let service=services.get(env);
  if(!service){
    const clientId=env.WORKOS_CLIENT_ID;
    if(typeof clientId!=='string' || !/^client_[A-Za-z0-9]{1,100}$/.test(clientId) ||
      typeof env.WORKOS_ISSUER!=='string' || new URL(env.WORKOS_ISSUER).protocol!=='https:' ||
      typeof env.WORKOS_COOKIE_PASSWORD!=='string' || env.WORKOS_COOKIE_PASSWORD.length<32)throw new Error('recipient_auth_configuration');
    const config:AuthKitConfig={clientId,redirectUri:env.APP_ORIGIN+'/auth/callback',
      issuer:env.WORKOS_ISSUER,apiHttps:true,
      cookiePassword:env.WORKOS_COOKIE_PASSWORD,cookieName:'augnes-recipient',cookieMaxAge:86400,cookieSameSite:'lax'};
    const client=new WorkOS({clientId});
    if(client.key)throw new Error('public_client_required');
    service=new AuthService(config,new RecipientCookies(config),client,sessionEncryption);
    services.set(env,service);
  }
  return service;
}
function withCookies(response:Response,bag?:HeadersBag) {
  const cookies=bag?.['Set-Cookie'];
  if(cookies)for(const value of Array.isArray(cookies)?cookies:[cookies])response.headers.append('Set-Cookie',value);
  return response;
}
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','Vary':'Cookie',
  'Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'; style-src 'self'",
  'X-Content-Type-Options':'nosniff','X-Web-Planning-Response':'1','X-Robots-Tag':'noindex, nofollow'};
function denied(status:number) {
  return Response.json({error:status===503?'signin_unavailable':'access_denied'},{status,headers});
}
function redirect(location:string) {
  return new Response(null,{status:303,headers:{...headers,Location:location}});
}
function entryPath(value:unknown):value is string {
  if(typeof value!=='string')return false;
  return ['/','/projects','/shared-work'].includes(value) ||
    value.length==='/continue/'.length+36 && value.startsWith('/continue/') && UUID.test(value.slice('/continue/'.length));
}
function form(title:string,action:string,button:string,status=200) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+
    title+' · Augnes</title><link rel="stylesheet" href="/auth/style.css"></head><body><header><a class="wordmark" href="/">augnes</a></header><main><h1>'+title+'</h1><form method="post" action="'+action+'"><button>'+button+'</button></form></main></body></html>',
    {status,headers:{...headers,'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8'}});
}
function signin(path:string,status=200) {
  // The only variable path interpolated in HTML is a known local entry or a validated grant UUID.
  return form(status===200?'Sign in to see shared work':'Sign-in could not be completed',
    path==='/'?'/auth/login':'/auth/login?next='+encodeURIComponent(path),'Sign in with email',status);
}
function verifiedEmail(user:{email?:string;emailVerified?:boolean}|null|undefined) {
  const email=login(user?.email);
  return user?.emailVerified===true && email && email.length<=254 ? email : null;
}
async function fetchRecipient(request:Request,env:RecipientEnvironment):Promise<Response> {
  const url=new URL(request.url),path=url.pathname;
  if(url.protocol!=='https:' || url.origin!==env.APP_ORIGIN || request.headers.has('x-web-planning-local-owner'))return denied(403);
  if(!sharedHomeEnabled(env))return denied(503);
  const origin=request.headers.get('Origin');
  if(origin!==null && origin!==env.APP_ORIGIN)return denied(403);
  const service=serviceFor(env);
  if(path==='/auth/style.css' && request.method==='GET' && !url.search)
    return new Response(style,{headers:{...headers,'Content-Type':'text/css; charset=utf-8'}});
  if(path==='/auth/login' || path==='/auth/logout'){
    if(path==='/auth/logout' && request.method==='GET' && !url.search)return form('Sign out of Augnes','/auth/logout','Sign out');
    if(request.method!=='POST' || origin!==env.APP_ORIGIN)return denied(403);
    if(path==='/auth/login'){
      const next=url.searchParams.get('next')??'/';
      if(!entryPath(next) || [...url.searchParams.keys()].some(k=>k!=='next') || url.searchParams.getAll('next').length>1)return denied(400);
      const flow=await service.createSignIn(undefined,{returnPathname:next});
      const response=withCookies(redirect(flow.url),flow.headers);
      const names=(request.headers.get('Cookie')??'').split(';').map(part=>part.trim().split('=',1)[0])
        .filter(name=>name.startsWith(cookiePrefix)).map(name=>name.slice(cookiePrefix.length));
      for(const cookieName of selectStalePKCEVerifierCookieNames(names,{keep:flow.cookieName})){
        withCookies(response,(await service.clearPendingVerifierByName(undefined,{cookieName})).headers);
      }
      return response;
    }
    if(url.search)return denied(400);
    const {auth}=await service.withAuth(request);
    if(auth.user){
      const end=await service.signOut(auth.sessionId,{returnTo:env.APP_ORIGIN+'/'});
      return withCookies(redirect(end.logoutUrl),end.headers);
    }
    return withCookies(redirect('/'),(await service.clearSession(undefined)).headers);
  }
  if(path==='/auth/callback'){
    if(request.method!=='GET')return denied(405);
    const code=url.searchParams.get('code'),state=url.searchParams.get('state');
    if(!code || !state || code.length>2048 || state.length>4096 || ['code','state'].some(k=>url.searchParams.getAll(k).length!==1))return signin('/',400);
    try {
      const result=await service.handleCallback(request,undefined,{code,state});
      if(!verifiedEmail(result.authResponse.user) || result.authResponse.impersonator){
        const response=withCookies(signin('/',403),(await service.clearSession(undefined)).headers);
        return withCookies(response,(await service.clearPendingVerifier(undefined,{state})).headers);
      }
      return withCookies(redirect(entryPath(result.returnPathname)?result.returnPathname:'/'),result.headers);
    } catch {
      return withCookies(signin('/',400),(await service.clearPendingVerifier(undefined,{state})).headers);
    }
  }
  const {auth,refreshedSessionData}=await service.withAuth(request);
  const email=verifiedEmail(auth.user);
  if(!auth.user || !email || auth.impersonator || auth.claims.sub!==auth.user.id ||
    auth.claims.iss!==env.WORKOS_ISSUER){
    if(request.method==='GET' && !url.search && entryPath(path))return signin(path);
    return denied(401);
  }
  const result=await handle(request,env,{ingress:'public-recipient',login:email});
  return refreshedSessionData?withCookies(result,(await service.saveSession(undefined,refreshedSessionData)).headers):result;
}
export default {
  async fetch(request:Request,env:RecipientEnvironment) {
    try {return await fetchRecipient(request,env);} catch {return denied(503);}
  }
};
