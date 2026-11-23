import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { headBinding, hash } from '../apps/web_planning/src/contract.ts';
import { buildCloudflarePlanning } from './build-web-planning.mjs';
import { accessSimulation } from './web-planning-local-runtime.mjs';
import { projectInput, projectOk, projectSession } from './web-planning-project-checks.mjs';

const clientId='client_recipientfixture', publicOrigin='https://recipient.example.test';
const issuer='https://api.workos.com/';
const sessionName='__Host-augnes-recipient';
const cookiePair=header=>header.split(';')[0];
function fixtureProvider() {
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk={...publicKey.export({format:'jwk'}),alg:'RS256',kid:'fixture',use:'sig'};
  const codes=new Map(),refreshes=new Map(),calls=[];
  function tokens(person,expired) {
    const now=Math.floor(Date.now()/1000);
    const payload={iss:issuer,sub:person.id,sid:person.sid,auth_time:now-60,iat:now-60,exp:now+(expired?-20:300)};
    const encode=object=>Buffer.from(JSON.stringify(object)).toString('base64url');
    const unsigned=encode({alg:'RS256',kid:jwk.kid})+'.'+encode(payload);
    const refresh=randomUUID();refreshes.set(refresh,person);
    return {user:{object:'user',id:person.id,email:person.email,email_verified:person.verified,
      created_at:'2025-01-01T00:00:00Z',updated_at:'2025-01-01T00:00:00Z'},authentication_method:'MagicAuth',
      access_token:unsigned+'.'+sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url'),refresh_token:refresh};
  }
  return {calls, issue(challenge,email,{verified=true,expire=false,ended=false}={}) {
    const code=randomUUID();
    codes.set(code,{challenge,person:{email,verified,expire,ended,id:'user_'+randomUUID(),sid:'session_'+randomUUID()}});
    return code;
  },async fetch(request) {
    const url=new URL(request.url);calls.push(request.method+' '+url.pathname);
    assert.equal(url.origin,'https://api.workos.com');
    if(url.pathname==='/sso/jwks/'+clientId && request.method==='GET')return Response.json({keys:[jwk]});
    assert.equal(url.pathname,'/user_management/authenticate');assert.equal(request.method,'POST');
    const body=await request.json();assert.equal(body.client_id,clientId);
    assert.equal(body.client_secret,undefined);
    if(body.grant_type==='refresh_token'){
      const person=refreshes.get(body.refresh_token);refreshes.delete(body.refresh_token);
      return person && !person.ended?Response.json(tokens(person,false)):Response.json({error:'invalid_grant'},{status:400});
    }
    assert.equal(body.grant_type,'authorization_code');
    const entry=codes.get(body.code);codes.delete(body.code);
    if(!entry || createHash('sha256').update(body.code_verifier).digest('base64url')!==entry.challenge)
      return Response.json({error:'invalid_grant'},{status:400});
    return Response.json(tokens(entry.person,entry.person.expire));
  }};
}
export async function checkRecipientSignIn({server,root,passed}) {
  const artifact=path.join(root,'recipient-artifact');
  await buildCloudflarePlanning(artifact,{recipient:true});
  const script=await readFile(path.join(artifact,'worker.js'),'utf8');
  const config=JSON.parse(await readFile(path.join(artifact,'wrangler.json'),'utf8'));
  assert.equal(config.name,'web-augnes-recipient');assert.equal(config.workers_dev,false);assert.equal(config.routes,undefined);
  const recipient='new-recipient@example.test', provider=fixtureProvider();
  const privateBindings={...server.env,PROJECT_ENTRY_MODE:'admitted-private-v1',PROJECT_ADMITTED_EMAILS:'[]',
    PUBLIC_SUCCESSION_MODE:'verified-email-home-v1',PUBLIC_RECIPIENT_ORIGIN:publicOrigin};
  const publicBindings={...privateBindings,APP_ORIGIN:publicOrigin,WORKOS_CLIENT_ID:clientId,WORKOS_ISSUER:issuer,WORKOS_COOKIE_PASSWORD:randomUUID()+randomUUID()};
  const privateWorker=()=>server.setOptions({script:server.code,access:accessSimulation,bindings:privateBindings});
  const publicWorker=()=>server.setOptions({script,access:undefined,bindings:publicBindings,outboundService:req=>provider.fetch(req)});
  const get=(route,cookie='',init={})=>server.mf.dispatchFetch(publicOrigin+route,{redirect:'manual',...init,
    headers:{...(cookie?{cookie}:{}),...init.headers}});
  const post=(route,cookie='')=>get(route,cookie,{method:'POST',headers:{origin:publicOrigin}});
  async function begin(next='/') {
    const r=await post('/auth/login?next='+encodeURIComponent(next));
    assert.equal(r.status,303);const location=new URL(r.headers.get('location'));
    assert.equal(location.origin,'https://api.workos.com');assert.equal(location.searchParams.get('provider'),'authkit');
    assert.equal(location.searchParams.get('client_id'),clientId);
    assert.equal(location.searchParams.get('redirect_uri'),publicOrigin+'/auth/callback');assert.equal(location.searchParams.get('code_challenge_method'),'S256');
    const [set]=r.headers.getSetCookie();assert.match(set,/^__Host-wos-auth-verifier-/);
    for(const flag of ['Path=/','Secure','HttpOnly','SameSite=Lax'])assert(set.includes(flag));
    return {cookie:cookiePair(set),state:location.searchParams.get('state'),challenge:location.searchParams.get('code_challenge')};
  }
  const callback=(flow,code,cookie=flow.cookie)=>get('/auth/callback?'+new URLSearchParams({state:flow.state,code}),cookie);
  async function signedIn(email,options={},next='/') {
    const flow=await begin(next);const r=await callback(flow,provider.issue(flow.challenge,email,options));
    assert.equal(r.status,303);assert.equal(r.headers.get('location'),next);
    const cookies=r.headers.getSetCookie();assert.equal(cookies.length,2);
    assert(cookies.some(value=>value.startsWith(flow.cookie.split('=')[0]+'=;') && value.includes('Max-Age=0')));
    const session=cookies.find(value=>value.startsWith(sessionName+'='));
    for(const flag of ['Path=/','HttpOnly','Secure','SameSite=Lax'])assert(session.includes(flag));
    assert(!session.includes(email));return cookiePair(session);
  }
  await publicWorker();
  const countWorkspaces=async()=>(await server.db.prepare('SELECT count(*) n FROM web_planning_workspace').first()).n;
  const before=await countWorkspaces();
  const home=await get('/');assert.match(await home.text(),/Sign in with email/);
  assert.equal(home.headers.get('referrer-policy'),'same-origin','the sign-in form must send its Origin on POST');
  assert.equal((await get('/auth/style.css')).status,200);
  assert.equal((await get('/api/shared-work','',{headers:{'Cf-Access-Authenticated-User-Email':recipient,'oai-authenticated-user-email':recipient}})).status,401);
  assert.equal((await get('/auth/login','',{method:'POST',headers:{origin:'https://elsewhere.example'}})).status,403);
  assert.equal((await post('/auth/login?next=https://elsewhere.example')).status,400);
  const pending=await begin(), code=provider.issue(pending.challenge,recipient);
  assert.equal((await callback(pending,code,'')).status,400);
  assert.equal((await callback({...pending,state:pending.state+'x'},code)).status,400);
  assert.equal(provider.calls.length,0,'a callback without its matching verifier never exchanges a code');
  const unverified=await begin(), refused=await callback(unverified,provider.issue(unverified.challenge,recipient,{verified:false}));
  assert.equal(refused.status,403);assert(!refused.headers.getSetCookie().some(v=>v.startsWith(sessionName+'=')&&!v.includes('Max-Age=0')));
  const session=await signedIn(recipient.toUpperCase());
  const first=await get('/',session);assert.equal(first.status,200);assert.match(await first.text(),/No work has been shared/);
  assert.deepEqual(await (await get('/api/shared-work',session)).json(),{items:[],next:null});
  assert.equal(await countWorkspaces(),before);
  const publicOwner=await signedIn(server.env.OWNER_EMAIL);
  assert.doesNotMatch(await (await get('/projects',publicOwner)).text(),/Create a project|csrf-token/);
  for(const route of ['/api/projects','/?project='+server.env.PROJECT_ID,'/api/works','/public-requests/'+randomUUID(),'/apply/'+randomUUID()])
    assert.equal((await get(route,publicOwner)).status,404,route);
  assert.equal((await post('/api/projects',publicOwner)).status,404);
  passed('public recipient: browser-bound PKCE, verified email, empty home, no owner or operator capabilities');

  await privateWorker();
  const created=await projectOk(await projectSession(server,'A'),'/api/projects',projectInput('A')),project=created.project;
  const owner=await projectSession(server,'A',project),grants='/api/work/'+project.continuation_work_id+'/continuation';
  const grant=await projectOk(owner,grants+'/create',{grant_id:randomUUID(),recipient,expected:headBinding(created.saved),
    obligation:'Confirm the date',expires:Date.now()+3600000,max_updates:2,confirm:'share-this-work-history'});
  const page='/continue/'+grant.id,api='/api/continuation/'+grant.id;
  assert.equal(grant.link,publicOrigin+page);
  await publicWorker();
  const shared=await (await get('/api/shared-work',session)).json();assert.deepEqual(shared.items.map(item=>item.work_id),[created.saved.work_id]);
  assert.deepEqual(await (await get('/api/shared-work',publicOwner)).json(),{items:[],next:null});
  assert.equal((await get(api,publicOwner)).status,403);
  const reentered=await signedIn(recipient,{},page);
  const entry=await get(page,reentered),csrf=(await entry.text()).match(/name="csrf-token" content="([^"]+)"/)[1];
  const cookies=reentered+'; '+cookiePair(entry.headers.get('set-cookie'));
  const report={workspace_id:project.workspace_id,project_id:project.project_id,request_key:randomUUID(),expected:headBinding(created.saved),
    report:'Confirmed the date by email.',next_action:'Send the notice.'};
  const write=await get(api+'/save',cookies,{method:'POST',headers:{origin:publicOrigin,'x-web-planning-project':project.project_id,
    'x-csrf-token':csrf,'content-type':'application/json'},body:JSON.stringify(report)});
  const saved=await write.json();assert.equal(write.status,200,JSON.stringify(saved));
  assert.equal(saved.saved.continuation.principal_ref,hash(recipient));
  assert.equal((await (await get(api,session)).json()).saved.fingerprint,saved.saved.fingerprint);

  const refreshable=await signedIn(recipient,{expire:true}),renewed=await get('/api/shared-work',refreshable);
  assert.equal(renewed.status,200);const rotated=renewed.headers.getSetCookie().find(v=>v.startsWith(sessionName+'='));
  assert(rotated && cookiePair(rotated)!==refreshable);assert.equal((await get(api,cookiePair(rotated))).status,200);
  const expired=await signedIn(recipient,{expire:true,ended:true});
  assert.equal((await get(api,expired)).status,401);assert.match(await (await get('/',expired)).text(),/Sign in with email/);
  const fresh=await signedIn(recipient);assert.equal((await get(api,fresh)).status,200);
  const logout=await post('/auth/logout',fresh);assert.equal(logout.status,303);
  const logoutURL=new URL(logout.headers.get('location'));assert.equal(logoutURL.origin,'https://api.workos.com');
  assert.equal(logoutURL.searchParams.get('return_to'),publicOrigin+'/');assert(logout.headers.getSetCookie()[0].includes('Max-Age=0'));
  await privateWorker();await projectOk(owner,grants+'/revoke',{grant_id:grant.id});
  await publicWorker();assert.deepEqual(await (await get('/api/shared-work',session)).json(),{items:[],next:null});
  assert.equal((await get(api,session)).status,403);
  passed('public recipient: private owner shares an existing work, recipient saves and reopens it, session refresh/expiry and re-entry, logout and revocation');

  await privateWorker();
  const request={grant_id:randomUUID(),recipient,expected:headBinding(saved.saved),obligation:'Read the confirmed date',
    expires:Date.now()+3600000,max_updates:0,confirm:'share-this-work-history'};
  const readGrant=await projectOk(owner,grants+'/create',request),readApi='/api/continuation/'+readGrant.id;
  assert.equal(readGrant.role,'read-work-v1');
  assert.deepEqual(await projectOk(owner,grants+'/create',request),readGrant);
  assert.equal((await owner.request(grants+'/create',{...request,max_updates:1})).status,409);
  await publicWorker();
  assert.deepEqual((await (await get('/api/shared-work',session)).json()).items.map(i=>i.grant_id),[readGrant.id]);
  assert.equal((await get(readApi,publicOwner)).status,403);
  const readEntry=await get('/continue/'+readGrant.id,session),html=await readEntry.text();
  assert.equal(readEntry.status,200);assert.match(html,/name="continuation-mode" content="read-only"/);
  assert.doesNotMatch(html,/id="update-form"/);
  const readContext=await (await get(readApi,session)).json();
  assert.equal(readContext.role,'read-work-v1');assert.equal(readContext.remaining_updates,0);
  assert.deepEqual(readContext.history,[created.saved,saved.saved]);
  const readCookies=session+'; '+cookiePair(readEntry.headers.get('set-cookie'));
  const denied=await get(readApi+'/save',readCookies,{method:'POST',headers:{origin:publicOrigin,
    'x-csrf-token':html.match(/name="csrf-token" content="([^"]+)"/)[1],'x-web-planning-project':project.project_id,
    'content-type':'application/json'},body:JSON.stringify({...report,expected:headBinding(saved.saved),request_key:randomUUID()})});
  assert.equal(denied.status,403);assert.equal((await denied.json()).error,'continuation_read_only');
  assert.deepEqual(await (await get(readApi,session)).json(),readContext);
  await privateWorker();await projectOk(owner,grants+'/revoke',{grant_id:readGrant.id});
  await publicWorker();assert.deepEqual(await (await get('/api/shared-work',session)).json(),{items:[],next:null});
  assert.equal((await get(readApi,session)).status,403);
  passed('read-only public sharing: scoped discovery, complete history and no edit form; authenticated save refused without changing a revision, unrelated email and revoked grants denied');
}
