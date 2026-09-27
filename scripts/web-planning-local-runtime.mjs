import { Miniflare, Log, LogLevel } from "miniflare";
import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import net from "node:net";
import { bundleWebPlanning, webRoot } from "./build-web-planning.mjs";
export const fixtureScope={workspace_id:'155448c4-983f-4e32-83c5-6d340db5d4fd',project_id:'bb63e047-9125-43c0-88cd-79f6b212b2ad',author_ref:'e89e1ee0-d67c-40a9-bb0c-661a86965452'};
export async function availablePort(){const server=net.createServer();await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});const port=server.address().port;await new Promise(ok=>server.close(ok));return port;}
export async function startLocal({root,port,production=false,bindings={},code,initialize=true}={}) {
  port??=await availablePort();const origin=`http://127.0.0.1:${port}`;
  const env={APP_ORIGIN:origin,OWNER_EMAIL:'synthetic-owner@example.test',WORKSPACE_ID:fixtureScope.workspace_id,PROJECT_ID:fixtureScope.project_id,AUTHOR_REF:fixtureScope.author_ref,
    REQUEST_SECRET:randomUUID()+randomUUID(),LOCAL_SESSION:randomUUID(),LOCAL_LOGIN:'synthetic-owner@example.test',RECONSTRUCTION_MODE:'quiesced-empty-store',...bindings};
  const built=code??(await bundleWebPlanning(production?undefined:path.resolve(webRoot,'../../scripts/web-planning-local-ingress.ts'))).code;
  let externalRequests=0;
  const mf=new Miniflare({modules:true,script:built,compatibilityDate:'2026-07-01',compatibilityFlags:['nodejs_compat'],
    host:'127.0.0.1',port,bindings:env,d1Databases:{DB:'web-planning-local-only'},d1Persist:path.join(root,'d1'),
    log:new Log(LogLevel.NONE),outboundService:()=>{externalRequests++;return new Response('External network forbidden',{status:403});}});
  try {
    await mf.ready;const db=await mf.getD1Database('DB');
    if(initialize){
      const exists=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='web_planning_schema'").first();
      if(!exists) {
        const migration=await readFile(path.join(webRoot,'migrations/0001.sql'),'utf8');
        const statements=migration.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);
        await db.batch(statements.map(sql=>db.prepare(sql)));
        await db.prepare('INSERT INTO web_planning_workspace(singleton,workspace_id,project_id,author_ref,owner_login_hash) VALUES (1,?,?,?,?)')
          .bind(env.WORKSPACE_ID,env.PROJECT_ID,env.AUTHOR_REF,'sha256:'+createHash('sha256').update(env.OWNER_EMAIL.toLowerCase()).digest('hex')).run();
      }
    }
    return {mf,db,origin,env,code:built,externalRequests:()=>externalRequests,async close(){await mf.dispose();
      const closed=await new Promise(resolve=>{const c=net.connect(port,'127.0.0.1');c.once('connect',()=>{c.destroy();resolve(false);});c.once('error',()=>resolve(true));});
      if(!closed)throw new Error('web_planning_listener_residue');if(externalRequests)throw new Error('web_planning_external_request');}};
  } catch(e){await mf.dispose();throw e;}
}
