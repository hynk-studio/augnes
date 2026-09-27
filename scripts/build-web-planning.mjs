import { build } from "esbuild";
import { cp, readFile, rm } from "node:fs/promises";
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
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildWebPlanning()));
