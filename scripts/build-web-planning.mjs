import { build } from "esbuild";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../apps/web_planning");
export async function bundleWebPlanning(entry=path.join(webRoot,"src/worker.ts")) {
  const result=await build({entryPoints:[entry],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022",
    external:["node:crypto","node:buffer"],loader:{".txt":"text"},tsconfig:path.join(webRoot,"../../tsconfig.json"),metafile:true});
  return {code:result.outputFiles[0].text,inputs:Object.keys(result.metafile.inputs)};
}
export async function buildWebPlanning(out=path.join(webRoot,"../../dist/web-planning")) {
  const {code,inputs}=await bundleWebPlanning();
  if(inputs.some(p=>/runtime\/|better-sqlite|local-ingress|test-web-planning/.test(p)))throw new Error("nonportable_or_test_dependency_in_artifact");
  await mkdir(path.join(out,".openai"),{recursive:true});await mkdir(path.join(out,"migrations"),{recursive:true});
  await writeFile(path.join(out,"worker.mjs"),code);
  await copyFile(path.join(webRoot,".openai/hosting.json"),path.join(out,".openai/hosting.json"));
  await copyFile(path.join(webRoot,"migrations/0001.sql"),path.join(out,"migrations/0001.sql"));
  await writeFile(path.join(out,"artifact.json"),JSON.stringify({entrypoint:"worker.mjs",format:"esm",compatibility_date:"2026-07-01",compatibility_flags:["nodejs_compat"],schema:1},null,2)+"\n");
  return {entrypoint:"worker.mjs",inputs:inputs.length};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildWebPlanning()));
