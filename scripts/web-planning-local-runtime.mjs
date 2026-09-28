import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import { bundleWebPlanning, webRoot } from "./build-web-planning.mjs";
const localRequire=createRequire(path.join(webRoot,"package.json"));
const runtimeEntry=localRequire.resolve("miniflare");
if(!runtimeEntry.startsWith(path.join(webRoot,"node_modules")+path.sep))throw new Error("web_planning_local_dependencies_not_installed");
const { Miniflare, Log, LogLevel, CoreHeaders }=localRequire("miniflare");
const { drizzle }=localRequire('drizzle-orm/d1');
const { migrate }=localRequire('drizzle-orm/d1/migrator');
const workerConfig=JSON.parse(await readFile(path.join(webRoot,'wrangler.json'),'utf8'));
export const fixtureScope={workspace_id:'155448c4-983f-4e32-83c5-6d340db5d4fd',project_id:'bb63e047-9125-43c0-88cd-79f6b212b2ad',author_ref:'e89e1ee0-d67c-40a9-bb0c-661a86965452'};
export async function availablePort(){const server=net.createServer();await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});const port=server.address().port;await new Promise(ok=>server.close(ok));return port;}
// Miniflare's Fetch helpers overwrite Sec-Fetch-Mode with "cors". Use its
// exported local-dispatch URL header over raw loopback HTTP for navigation
// fixtures. This is test ingress only; the production Worker never reads it.
export async function dispatchNavigation(server,url,init={}) {
  const target=new URL(url),local=new URL(server.origin);
  if(local.hostname!=='127.0.0.1' || local.protocol!=='http:')throw new Error('local_dispatch_only');
  const headers=Object.fromEntries(new Headers(init.headers));
  headers[CoreHeaders.ORIGINAL_URL]=target.href;
  return new Promise((resolve,reject)=>{
    const req=http.request(new URL(target.pathname+target.search,local),{method:init.method??'GET',headers,agent:false},res=>{
      const chunks=[];res.on('error',reject);res.on('data',chunk=>chunks.push(chunk));
      res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));
    });
    req.setTimeout(10000,()=>req.destroy(new Error('local_dispatch_timeout')));
    req.on('error',reject);req.end(init.body);
  });
}
export async function startLocal({root,port,production=false,bindings={},code,initialize=true,seedMapping=true,
  migrationsFolder=path.join(webRoot,'drizzle'),runtimeConfig=workerConfig,handleStructuredLogs}={}) {
  port??=await availablePort();const origin=`http://127.0.0.1:${port}`;
  const env={APP_ORIGIN:origin,OWNER_EMAIL:'synthetic-owner@example.test',WORKSPACE_ID:fixtureScope.workspace_id,PROJECT_ID:fixtureScope.project_id,AUTHOR_REF:fixtureScope.author_ref,
    REQUEST_SECRET:randomUUID()+randomUUID(),LOCAL_SESSION:randomUUID(),LOCAL_LOGIN:'synthetic-owner@example.test',RECONSTRUCTION_MODE:'quiesced-empty-store',...bindings};
  const built=code??(await bundleWebPlanning(production?undefined:path.resolve(webRoot,'../../scripts/web-planning-local-ingress.ts'))).code;
  let externalRequests=0;
  const mf=new Miniflare({modules:true,script:built,compatibilityDate:runtimeConfig.compatibility_date,compatibilityFlags:runtimeConfig.compatibility_flags,
    host:'127.0.0.1',port,bindings:env,d1Databases:{DB:'web-planning-local-only'},d1Persist:path.join(root,'d1'),
    log:new Log(LogLevel.NONE),handleStructuredLogs,outboundService:()=>{externalRequests++;return new Response('External network forbidden',{status:403});}});
  try {
    await mf.ready;const db=await mf.getD1Database('DB');
    if(initialize){
      const exists=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='web_planning_schema'").first();
      if(!exists) {
        await migrate(drizzle(db),{migrationsFolder});
        if(seedMapping)await db.prepare('INSERT INTO web_planning_workspace(singleton,workspace_id,project_id,author_ref,owner_login_hash) VALUES (1,?,?,?,?)')
          .bind(env.WORKSPACE_ID,env.PROJECT_ID,env.AUTHOR_REF,'sha256:'+createHash('sha256').update(env.OWNER_EMAIL.toLowerCase()).digest('hex')).run();
      }
    }
    return {mf,db,origin,env,code:built,externalRequests:()=>externalRequests,async close(){await mf.dispose();
      const closed=await new Promise(resolve=>{const c=net.connect(port,'127.0.0.1');c.once('connect',()=>{c.destroy();resolve(false);});c.once('error',()=>resolve(true));});
      if(!closed)throw new Error('web_planning_listener_residue');if(externalRequests)throw new Error('web_planning_external_request');}};
  } catch(e){await mf.dispose();throw e;}
}
