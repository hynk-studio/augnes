import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
export const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../apps/web_planning");
export async function bundleWebPlanning(entry=path.join(webRoot,"src/worker.ts")) {
  const result=await build({entryPoints:[entry],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022",
    external:["node:crypto","node:buffer"],loader:{".txt":"text"},tsconfig:path.join(webRoot,"../../tsconfig.json"),metafile:true});
  return {code:result.outputFiles[0].text,inputs:Object.keys(result.metafile.inputs)};
}
export async function buildWebPlanning(out=path.join(webRoot,"dist")) {
  const localRequire=createRequire(path.join(webRoot,"package.json"));
  const viteEntry=localRequire.resolve('vite');
  if(!viteEntry.startsWith(path.join(webRoot,'node_modules')+path.sep))throw new Error('web_planning_local_dependencies_not_installed');
  const {createBuilder}=await import(pathToFileURL(viteEntry).href);
  const dist=path.join(webRoot,'dist');
  await rm(dist,{recursive:true,force:true});
  const builder=await createBuilder({configFile:path.join(webRoot,'vite.config.mjs')});
  await builder.buildApp();
  // Copy only the official build output when a lifecycle-owned test needs its
  // own artifact. The Sites plugin itself owns .openai staging.
  if(path.resolve(out)!==dist)await cp(dist,out,{recursive:true});
  const config=JSON.parse(await readFile(path.join(out,'server/wrangler.json'),'utf8'));
  if(config.main!=='index.js' || config.assets || !config.compatibility_flags?.includes('nodejs_compat') ||
    config.d1_databases?.length!==1 || config.d1_databases[0].binding!=='DB')throw new Error('unexpected_worker_build_contract');
  return {artifact:out,entrypoint:'server/index.js',compatibility_date:config.compatibility_date,compatibility_flags:config.compatibility_flags};
}
export async function buildCloudflarePlanning(out=path.join(webRoot,'dist-cloudflare')) {
  if((await readdir(webRoot)).some(name=>name.startsWith('.dev.vars')||name.startsWith('.env')))
    throw new Error('web_planning_build_refuses_local_environment_files');
  const config=JSON.parse(await readFile(path.join(webRoot,'wrangler.cloudflare.json'),'utf8'));
  if(config.assets||config.access||config.routes||config.vars||config.account_id||config.preview_urls!==false||
    config.d1_databases?.length!==1||config.d1_databases[0].database_id!=='00000000-0000-4000-8000-000000000000')
    throw new Error('direct_build_requires_unbound_production_configuration');
  const built=await bundleWebPlanning(path.join(webRoot,'src/cloudflare-worker.ts'));
  if(built.inputs.some(id=>/\/runtime\/|better-sqlite|local-ingress|test-web-planning/.test(id)))
    throw new Error('nonportable_or_test_dependency_in_artifact');
  await rm(out,{recursive:true,force:true});
  await mkdir(out,{recursive:true});
  // No Vite assets router: ctx.access must reach the Worker directly. Local
  // identity simulation and real bindings are never inputs to this artifact.
  await writeFile(path.join(out,'worker.js'),built.code);
  const {$schema,...portable}=config;
  await writeFile(path.join(out,'wrangler.json'),JSON.stringify({...portable,main:'worker.js',
    d1_databases:config.d1_databases.map(db=>({...db,migrations_dir:'migrations'}))},null,2)+'\n');
  await mkdir(path.join(out,'migrations'),{recursive:true});
  for(const name of (await readdir(path.join(webRoot,'drizzle'))).filter(n=>n.endsWith('.sql')))
    await cp(path.join(webRoot,'drizzle',name),path.join(out,'migrations',name));
  return {artifact:out,entrypoint:'worker.js',compatibility_date:config.compatibility_date,compatibility_flags:config.compatibility_flags};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(process.argv.length>3 || (process.argv[2]&&process.argv[2]!=='cloudflare'))throw new Error('Use cloudflare or no argument for Sites');
  console.log(JSON.stringify(await (process.argv[2]==='cloudflare'?buildCloudflarePlanning():buildWebPlanning())));
}
