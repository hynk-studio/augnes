import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as schema from '../apps/web_planning/db/schema.ts';
import { webRoot } from './build-web-planning.mjs';
import { hash } from '../apps/web_planning/src/contract.ts';

const localRequire=createRequire(path.join(webRoot,'package.json'));
const {generateSQLiteDrizzleJson,generateSQLiteMigration}=localRequire('drizzle-kit/api');
const {readMigrationFiles}=localRequire('drizzle-orm/migrator');
const json=async file=>JSON.parse(await readFile(file,'utf8'));
// The CLI serializes undefined fields away and adds an empty SQLite schemas
// rename map. Normalize only those representation differences, not table data.
const shape=({id,prevId,...snapshot})=>JSON.parse(JSON.stringify({...snapshot,_meta:{schemas:{},...snapshot._meta}}));
const sqlParts=text=>text.split('--> statement-breakpoint').map(s=>s.trim());

async function migrationParity(folder,generated) {
  const journal=await json(path.join(folder,'meta/_journal.json'));
  assert.equal(journal.dialect,'sqlite');
  assert.deepEqual(journal.entries.map(e=>[e.idx,e.tag,e.breakpoints]),[[0,'0000_web_planning',true],[1,'0001_schema_version',true]]);
  assert(journal.entries[0].when<journal.entries[1].when);
  const snapshots=await Promise.all(['0000','0001'].map(n=>json(path.join(folder,`meta/${n}_snapshot.json`))));
  for(const snapshot of snapshots)assert.deepEqual(shape(snapshot),shape(generated.snapshot),'Drizzle schema/snapshot drift');
  assert.equal(snapshots[1].prevId,snapshots[0].id);
  const initial=await readFile(path.join(folder,'0000_web_planning.sql'),'utf8');
  assert.deepEqual(sqlParts(initial),generated.statements.map(s=>s.trim()),'Drizzle schema/SQL drift');
  const seed=await readFile(path.join(folder,'0001_schema_version.sql'),'utf8');
  assert.equal(seed.replace(/^--.*$/gm,'').trim(),'INSERT INTO web_planning_schema(version) VALUES (1);');
  return {snapshots,initial};
}

export async function checkSitesArtifact(artifact,code) {
  const folder=path.join(webRoot,'drizzle');
  const snapshot=await generateSQLiteDrizzleJson(schema);
  const statements=await generateSQLiteMigration(await generateSQLiteDrizzleJson({}),snapshot);
  const generated={snapshot,statements};
  const committed=await migrationParity(folder,generated);
  const staged=path.join(artifact,'.openai/drizzle');
  await migrationParity(staged,generated);
  assert.deepEqual(readMigrationFiles({migrationsFolder:staged}),readMigrationFiles({migrationsFolder:folder}));
  // Negative controls: generator changes must fail even if checked-in SQL and
  // snapshots agree with each other. No second handwritten schema is retained.
  await assert.rejects(migrationParity(folder,{...generated,snapshot:{...snapshot,tables:{}}}),/schema\/snapshot drift/);
  await assert.rejects(migrationParity(folder,{...generated,statements:statements.map(s=>s.replace('BETWEEN 1 AND 32','BETWEEN 1 AND 33'))}),/schema\/SQL drift/);
  assert(committed.initial.includes('json_valid'));
  const tree=(await readdir(artifact,{recursive:true,withFileTypes:true})).filter(e=>e.isFile())
    .map(e=>path.relative(artifact,path.join(e.parentPath,e.name))).sort();
  assert.deepEqual(tree,[
    '.openai/drizzle/0000_web_planning.sql','.openai/drizzle/0001_schema_version.sql',
    '.openai/drizzle/meta/0000_snapshot.json','.openai/drizzle/meta/0001_snapshot.json','.openai/drizzle/meta/_journal.json',
    '.openai/hosting.json','server/.vite/manifest.json','server/index.js','server/wrangler.json',
  ]);
  assert.deepEqual(await json(path.join(artifact,'.openai/hosting.json')),{d1:'DB',r2:null});
  const manifest=await json(path.join(artifact,'server/.vite/manifest.json'));
  assert(Object.values(manifest).some(v=>v.isEntry && v.file==='index.js'));
  const config=await json(path.join(artifact,'server/wrangler.json'));
  const source=await json(path.join(webRoot,'wrangler.json'));
  assert.equal(config.main,'index.js');assert.equal(config.no_bundle,true);assert.equal(config.assets,undefined);
  assert.equal(config.compatibility_date,source.compatibility_date);
  assert.deepEqual(config.compatibility_flags,['nodejs_compat']);
  assert.deepEqual(config.d1_databases,source.d1_databases);
  assert.deepEqual(config.vars,{});assert.deepEqual(config.r2_buckets,[]);
  for(const forbidden of ['LOCAL_SESSION','/_local/login','web_planning_local=','synthetic-owner@example.test',
    'better-sqlite3','seedy@sites.test','__sites_local_auth','web-planning-artifact-secret-sentinel'])assert(!code.includes(forbidden),forbidden);
  return config;
}

export async function exerciseSitesBootstrap({start,artifact,code,runtimeConfig,client,newWork,save,edit,headBinding,passed}) {
  const bindings={APP_ORIGIN:'https://planning.example.test',SITES_INGRESS_MODE:'verified-private-sites'};
  const options={production:true,code,runtimeConfig,seedMapping:false,migrationsFolder:path.join(artifact,'.openai/drizzle'),bindings};
  const server=await start('sites-bootstrap',options);
  const count=async s=>(await s.db.prepare('SELECT count(*) n FROM web_planning_workspace').first()).n;
  const request=(s,url=s.env.APP_ORIGIN+'/',headers={},method='GET')=>s.mf.dispatchFetch(url,{method,headers:{'oai-authenticated-user-email':s.env.OWNER_EMAIL,...headers}});
  // Real production entry, with only synthetic platform-shaped requests. This
  // checks application decisions, not hosted header overwrite/backend isolation.
  for(const [url,headers,method] of [
    [bindings.APP_ORIGIN+'/',{'oai-authenticated-user-email':''}],
    [bindings.APP_ORIGIN+'/',{'oai-authenticated-user-email':'outsider@example.test'}],
    [bindings.APP_ORIGIN+'/',{'oai-authenticated-user-email':server.env.OWNER_EMAIL+','+server.env.OWNER_EMAIL}],
    [bindings.APP_ORIGIN+'/',{'origin':'https://foreign.example.test'}],
    [bindings.APP_ORIGIN+'/',{'sec-fetch-site':'cross-site'}],
    [bindings.APP_ORIGIN+'/',{'x-web-planning-local-owner':server.env.OWNER_EMAIL}],
    ['https://direct-backend.example.test/'],
    [bindings.APP_ORIGIN+'/api/works'],[bindings.APP_ORIGIN+'/?setup=1'],[bindings.APP_ORIGIN+'/',{},'POST'],
  ]) {assert.equal((await request(server,url,headers,method)).status,403);assert.equal(await count(server),0);}
  for(const [name,override] of [
    ['unset-ingress',{SITES_INGRESS_MODE:''}],['untrusted-ingress',{SITES_INGRESS_MODE:'unverified'}],
    ['bad-owner-config',{OWNER_EMAIL:''}],['bad-workspace-config',{WORKSPACE_ID:''}],
    ['bad-project-config',{PROJECT_ID:''}],['bad-author-config',{AUTHOR_REF:''}],
  ]) {
    const denied=await start(name,{...options,bindings:{...bindings,...override}});
    assert([403,503].includes((await request(denied)).status));assert.equal(await count(denied),0);
  }
  await server.db.prepare('DELETE FROM web_planning_schema').run();
  assert.equal((await request(server)).status,503);assert.equal(await count(server),0);
  await server.db.prepare('INSERT INTO web_planning_schema(version) VALUES (1)').run();
  const responses=await Promise.all(Array.from({length:8},()=>request(server)));
  assert.deepEqual(responses.map(r=>r.status),Array(8).fill(200));assert.equal(await count(server),1);
  const expected={singleton:1,workspace_id:server.env.WORKSPACE_ID,project_id:server.env.PROJECT_ID,
    author_ref:server.env.AUTHOR_REF,owner_login_hash:hash(server.env.OWNER_EMAIL.toLowerCase())};
  assert.deepEqual(await server.db.prepare('SELECT * FROM web_planning_workspace').first(),expected);
  assert.equal((await request(server)).status,200);assert.equal(await count(server),1);
  await server.db.prepare('UPDATE web_planning_workspace SET author_ref=?').bind('different-configured-author').run();
  const mismatch=await server.db.prepare('SELECT * FROM web_planning_workspace').first();
  assert.equal((await request(server)).status,403);
  assert.deepEqual(await server.db.prepare('SELECT * FROM web_planning_workspace').first(),mismatch);
  await server.db.prepare('UPDATE web_planning_workspace SET author_ref=?').bind(expected.author_ref).run();
  passed('Sites owner bootstrap: refusal before writes, eight concurrent requests one exact mapping, idempotency and no rebind');

  // Constraint tests execute the staged Drizzle material on real D1, including
  // boundaries otherwise masked by the application's validation/conditional SQL.
  const db=server.db;
  assert.deepEqual((await db.prepare('SELECT version FROM web_planning_schema').all()).results,[{version:1}]);
  assert.equal((await db.prepare('SELECT count(*) n FROM __drizzle_migrations').first()).n,2);
  await assert.rejects(db.prepare('INSERT INTO web_planning_schema VALUES (2)').run());
  await assert.rejects(db.prepare('INSERT INTO web_planning_schema VALUES (1)').run());
  await assert.rejects(db.prepare('UPDATE web_planning_workspace SET singleton=2').run());
  const insert=(work,revision,requestKey,envelope='{}',workspace=expected.workspace_id)=>db.prepare(
    'INSERT INTO web_planning_revision VALUES (?,?,?,?,?,?,?,?)').bind(workspace,expected.project_id,work,revision,'fp',requestKey,'request-fp',envelope).run();
  for(const n of [0,33])await assert.rejects(insert('constraint',n,'key'));
  await assert.rejects(insert('constraint',1,'key','invalid-json'));
  await assert.rejects(insert('constraint',1,'key','{}','wrong-workspace'));
  await insert('constraint',1,'key');
  await assert.rejects(insert('constraint',1,'different-key'));
  await assert.rejects(insert('another-work',1,'key'));
  const erased=(workspace=expected.workspace_id)=>db.prepare('INSERT INTO web_planning_erased VALUES (?,?,?)').bind(workspace,expected.project_id,'constraint').run();
  await assert.rejects(erased('wrong-workspace'));await erased();await assert.rejects(erased());
  await db.batch([db.prepare('DELETE FROM web_planning_revision'),db.prepare('DELETE FROM web_planning_erased')]);
  passed('staged Drizzle journal applies to empty real D1; version, scope foreign keys, JSON, 1..32 and uniqueness constraints enforce');

  const c=await client(server,{sites:true});
  const work=await newWork(c);const first=await save(c,work);assert.equal(first.status,200);
  assert.equal((await save(c,work)).data.saved.revision,1);
  const competitor=await edit(c,first.data.saved,'First successor');
  const stale=await edit(c,first.data.saved,'Stale successor');
  const saved=(await save(c,competitor)).data.saved;
  assert.equal((await save(c,stale)).status,409);
  assert.equal((await c.request('/api/work/'+work.id)).data.saved.fingerprint,saved.fingerprint);
  assert.equal((await c.request('/api/work/'+work.id+'/export')).data.revisions.length,2);
  assert.equal((await c.request('/api/work/'+work.id+'/erase',{expected:headBinding(saved),confirm:'erase-whole-work'})).status,200);
  assert.equal((await save(c,work)).status,410);
  assert.equal((await db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);
  assert.equal(await count(server),1);assert.equal(server.externalRequests(),0);
  passed('official server/index.js executes in workerd using generated compatibility config: authenticated save/reopen/replay/conflict/export/erase');
}
