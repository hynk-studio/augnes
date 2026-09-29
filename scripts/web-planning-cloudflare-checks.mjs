import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildCloudflarePlanning, webRoot } from './build-web-planning.mjs';
import { accessSimulation, dispatchNavigation } from './web-planning-local-runtime.mjs';
import { headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

export async function checkCloudflarePlanning({root,start,client,newWork,save,edit,passed,open}) {
 const artifact=path.join(root,'direct-artifact');await buildCloudflarePlanning(artifact);
 const code=await readFile(path.join(artifact,'worker.js'),'utf8'),runtimeConfig=JSON.parse(await readFile(path.join(artifact,'wrangler.json'),'utf8'));
 const directWorker=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
 const require=createRequire(path.join(webRoot,'package.json'));
 assert.equal(require('wrangler/package.json').version,'4.126.0');
 const wranglerRequire=createRequire(require.resolve('wrangler'));
 assert.equal(wranglerRequire('miniflare/package.json').version,'5.20260825.0-alpha');
 assert.equal(runtimeConfig.assets,undefined);assert.equal(runtimeConfig.access,undefined);assert.equal(runtimeConfig.vars,undefined);
 assert.equal(runtimeConfig.preview_urls,false);assert.equal(runtimeConfig.workers_dev,false);assert.equal(runtimeConfig.no_bundle,true);assert.equal(runtimeConfig.main,'worker.js');
 assert.equal(runtimeConfig.d1_databases[0].database_id,'00000000-0000-4000-8000-000000000000');
 assert.deepEqual((await readdir(artifact,{recursive:true,withFileTypes:true})).filter(e=>e.isFile()).map(e=>path.relative(artifact,path.join(e.parentPath,e.name))).sort(),
   ['migrations/0000_web_planning.sql','migrations/0001_schema_version.sql','worker.js','wrangler.json']);
 for(const sql of ['0000_web_planning.sql','0001_schema_version.sql'])assert.equal(await readFile(path.join(artifact,'migrations',sql),'utf8'),await readFile(path.join(webRoot,'drizzle',sql),'utf8'));
 for(const forbidden of ['LOCAL_SESSION','/_local/login','web_planning_local=','synthetic-owner@example.test','web-planning-artifact-secret-sentinel',
   'MF-Original-URL','local_dispatch_only','sitesPrincipal','get("oai-authenticated-user-email")','getUserEmail','better-sqlite3'])assert(!code.includes(forbidden),forbidden);
 const dryRun=await runCanonicalChild({suite:'web-planning',label:'direct-build-dry-run',command:process.execPath,
   args:[path.join(path.dirname(require.resolve('wrangler/package.json')),'bin/wrangler.js'),'deploy','--dry-run','--config',path.join(artifact,'wrangler.json'),'--outdir',path.join(root,'direct-dry-run')],cwd:webRoot,
   env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_WRITE_LOGS:'false',CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false'},timeoutMs:30000});
 const failure=canonicalChildAcceptanceFailure(dryRun,{requireNaturalExit:true});if(failure)throw new Error(failure);
 passed('direct artifact: actual pinned Wrangler dry-run, no assets router, preview disabled, no fixture/real bindings; shipped SQL bytes retained');
 const options={direct:true,code,runtimeConfig,migrationsFolder:path.join(artifact,'migrations')};
 let server=await start('direct',options);
 const count=async s=>(await s.db.prepare('SELECT count(*) n FROM web_planning_workspace').first()).n;
 assert.equal(await count(server),0);
 assert.deepEqual((await server.db.prepare('SELECT name FROM d1_migrations ORDER BY id').all()).results.map(r=>r.name),['0000_web_planning.sql','0001_schema_version.sql']);
 assert.equal(await server.db.prepare("SELECT name FROM sqlite_master WHERE name='__drizzle_migrations'").first(),null);
 const spoof={'oai-authenticated-user-email':server.env.OWNER_EMAIL,'Cf-Access-Authenticated-User-Email':server.env.OWNER_EMAIL,'Cf-Access-Jwt-Assertion':'forged','cookie':'web_planning_local=forged'};
 // Reconfigure the same disposable workerd to exercise the official Access
 // simulation boundary. No test identity is passed to the application handler.
 const valid={access:accessSimulation,bindings:server.env};
 for(const access of [undefined,{aud:'b'.repeat(64),identity:accessSimulation.identity},{aud:accessSimulation.aud},
   {...accessSimulation,identity:{email:'outsider@example.test'}},{...accessSimulation,identity:{email:'invalid'}},
   {...accessSimulation,identity:{email:['synthetic-owner@example.test']}}]) {
   await server.setOptions({...valid,access});
   for(const url of ['/','/client.js','/style.css','/api/works','/_local/login','/?setup=1','/api/work/155448c4-983f-4e32-83c5-6d340db5d4fd/export'])
     assert.equal((await server.mf.dispatchFetch(server.origin+url,{headers:spoof})).status,403,url);
   assert.equal(await count(server),0);
 }
 await server.setOptions(valid);
 for(const [url,headers,method] of [[server.origin+'/?setup=1',{},'GET'],[server.origin+'/',{},'POST'],[server.origin+'/api/works',{},'GET'],
   [server.origin+'/',{origin:'https://other.example'},'GET'],[server.origin+'/',{'x-web-planning-local-owner':'true'},'GET'],
   ['http://127.0.0.1:'+new URL(server.origin).port+'/',{},'GET'],[server.origin+'/',{'sec-fetch-site':'cross-site'},'GET']]) {
   assert.equal((await server.mf.dispatchFetch(url,{headers,method})).status,403);assert.equal(await count(server),0);
 }
 const noDB={...server.env,DB:{prepare(){throw new Error('identity_must_precede_storage');}}};
 for(const ctx of [{},{access:{aud:accessSimulation.aud,async getIdentity(){throw new Error('private identity payload');}}},
   {access:{aud:accessSimulation.aud,async getIdentity(){return null;}}}])
   assert.equal((await directWorker.fetch(new Request(server.origin+'/'),noDB,ctx)).status,403);
 const identity={access:{aud:accessSimulation.aud,async getIdentity(){return accessSimulation.identity;}}};
 for(const audience of ['',undefined,'not-an-audience','b'.repeat(64)])assert.equal((await directWorker.fetch(new Request(server.origin+'/'),{...noDB,ACCESS_AUDIENCE:audience},identity)).status,403);
 const pages=await Promise.all(Array.from({length:8},()=>dispatchNavigation(server,server.origin+'/',{headers:{'sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document'}})));
 assert(pages.every(r=>r.status===200));assert.equal(await count(server),1);
 assert.match(await pages[0].text(),/href="\/cdn-cgi\/access\/logout"/);
 let c=await client(server);let w=await newWork(c);let target=(await save(c,w)).data.saved;
 const originalEnv=server.env;
 await server.setOptions({...valid,bindings:{...originalEnv,WORKSPACE_ID:crypto.randomUUID()}});
 assert.equal((await server.mf.dispatchFetch(server.origin+'/')).status,403);assert.equal(await count(server),1);
 await server.setOptions(valid);
 passed('actual ctx.access audience/owner/missing identity refusals, lookup failure, no header/fixture fallback, navigation-only concurrent bootstrap and no rebinding');
 const op=(id,action,input)=>c.request('/api/work/'+id+'/'+action,input);
 const bp=(await op(w.id,'branch-preview',{expected:headBinding(target),intent:{reason:'Consider a quieter room independently.'}})).data;
 const commit=p=>op(p.work_id,'relation-save',{ticket:p.ticket,intent:p.intent});
 let branch=(await commit(bp)).data.saved;
 target=(await save(c,await edit(c,target,'Original direction revised independently'))).data.saved;
 const change=await edit(c,branch,'Measure the evening room');
 change.input.notes=[
   {text:'Only Tuesday evenings were measured.',source:'Synthetic condition',observed_at:null,provenance:'user_declaration',label:'Deferred item / revisit condition'},
   {text:'Tuesday noise was low under that condition.',source:'Synthetic observation',observed_at:null,provenance:'user_declaration',label:'Changed assumption / user correction'},
   {text:'Choose it for every event.',source:'Synthetic recommendation',observed_at:null,provenance:'derived_interpretation',label:'New candidate'}];
 change.input.material_edits=[{dependencies:[],adapts:null},{dependencies:[0],adapts:null},{dependencies:[0,1],adapts:null}];
 branch=(await save(c,change)).data.saved;
 const comparison=await op(w.id,'compare',{expected:headBinding(target),source:reference(branch)});
 assert.equal(comparison.status,200);assert.equal(comparison.data.baseline.revision,1);
 const recommendation=branch.sources.find(s=>s.bounded_summary==='Choose it for every event.').source_ref;
 const condition=branch.sources.find(s=>s.bounded_summary==='Only Tuesday evenings were measured.').source_ref;
 const intent={source:reference(branch),dispositions:branch.sources.map(s=>({source_ref:s.source_ref,disposition:s.source_ref===recommendation?'declined':'incorporated',rationale:s.source_ref===recommendation?'Weekend conditions remain unknown.':''})),rationale:'Keep the qualified observation only.',next_question:'Measure weekends next.'};
 const incomplete={...intent,dispositions:intent.dispositions.map(d=>d.source_ref===condition?{...d,disposition:'not_selected'}:d)};
 assert.equal((await op(w.id,'incorporation-preview',{expected:headBinding(target),intent:incomplete})).data.error,'required_material_missing');
 const prepared=await op(w.id,'incorporation-preview',{expected:headBinding(target),intent});assert.equal(prepared.status,200,JSON.stringify(prepared.data));const preview=prepared.data;
 assert.equal((await op(w.id,'relation-resolve',{ticket:preview.ticket,intent:preview.intent})).data.outcome,'unknown');
 target=(await commit(preview)).data.saved;
 assert.equal((await commit(preview)).data.saved.fingerprint,target.fingerprint);
 assert.equal((await op(w.id,'relation-resolve',{ticket:preview.ticket,intent:preview.intent})).data.saved.fingerprint,target.fingerprint);
 assert.equal((await c.request('/api/work/'+branch.work_id)).data.saved.fingerprint,branch.fingerprint);
 assert(!target.sources.some(s=>s.bounded_summary==='Choose it for every event.'));
 const exported=(await c.request('/api/work/'+w.id+'/export')).data;
 await server.close();open.splice(open.indexOf(server),1);
 server=await start('direct',{...options,bindings:originalEnv,port:Number(new URL(originalEnv.APP_ORIGIN).port)});c=await client(server);
 assert.deepEqual((await c.request('/api/work/'+w.id+'/export')).data,exported);
 const context=await op(w.id,'context',{expected:headBinding(target)});
 assert.equal(context.status,200);assert.match(context.data,/Only Tuesday evenings/);assert.match(context.data,/declined/);assert.match(context.data,/Measure weekends next/);
 assert.equal((await op(w.id,'context',{expected:headBinding(exported.revisions[0])})).status,409);
 for(const action of ['branch-preview','compare','incorporation-preview','relation-save','relation-resolve','erase']) {
   assert.equal((await op(w.id,action,{workspace_id:crypto.randomUUID()})).status,403);
   assert.equal((await c.request('/api/work/'+w.id+'/'+action,{}, {'x-csrf-token':'wrong'})).status,403);
   assert.equal((await c.request('/api/work/'+w.id+'/'+action,{}, {origin:'https://other.example'})).status,403);
 }
 assert.equal((await op(w.id,'erase',{expected:headBinding(target),confirm:'erase-whole-work'})).status,200);
 assert.equal((await commit(preview)).status,410);assert.equal((await c.request('/api/work/'+branch.work_id)).status,200);
 await assert.rejects(server.db.prepare('DELETE FROM web_planning_workspace').run(),/FOREIGN KEY/);assert.equal(await count(server),1);
 passed('direct Worker complete branch/comparison/qualified incorporation, exact replay/unknown resolution, restart/fresh read/export, CSRF/scope/origin, erasure and persistent mapping integrity');
 await server.close();open.splice(open.indexOf(server),1);
}
