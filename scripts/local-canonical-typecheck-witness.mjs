import { digest } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { readFileSync, realpathSync, existsSync, lstatSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

export const REPOSITORY_TYPECHECK = "repository-typecheck-v1";
const compilerPaths=["node_modules/typescript/package.json","node_modules/typescript/lib/tsc.js",
  "node_modules/typescript/lib/_tsc.js","node_modules/typescript/lib/typescript.js"];
export function observeTypecheckCompiler(repositoryRoot,{env=process.env}={}) {
  const entrypoints=[ ["tsc","node_modules/typescript/bin/tsc"], ["next","node_modules/next/dist/bin/next"] ].map(([id,expected])=>{
    const file=realpathSync(path.join(repositoryRoot,"node_modules/.bin",id));
    if(file!==realpathSync(path.join(repositoryRoot,expected))) throw new Error("revision_typecheck_launcher_invalid");
    return{id,location_fingerprint:digest(file),sha256:digest(readFileSync(file))};
  });
  const npm=(env.PATH??"").split(path.delimiter).map(dir=>path.join(dir,"npm")).find(existsSync);
  if(!npm) throw new Error("revision_typecheck_launcher_invalid");
  const npmFile=realpathSync(npm);
  entrypoints.push({id:"npm",location_fingerprint:digest(npmFile),sha256:digest(readFileSync(npmFile))});
  const node=(env.PATH??"").split(path.delimiter).map(dir=>path.join(dir,"node")).find(existsSync);
  if(!node || realpathSync(node)!==realpathSync(process.execPath)) throw new Error("revision_typecheck_node_mismatch");
  entrypoints.push({id:"node",location_fingerprint:digest(realpathSync(node)),sha256:digest(readFileSync(node))});
  const config=key=>execFileSync(npm,["config","get",key],{cwd:repositoryRoot,env,encoding:"utf8",timeout:5000}).trim();
  if (["NODE_OPTIONS","npm_config_node_options","npm_config_script_shell"].some(key=>env[key]) ||
      config("node-options")!=="null" || config("script-shell")!=="null" ||
      execFileSync("node",["--version"],{env,encoding:"utf8",timeout:5000}).trim()!==process.version)
    throw new Error("revision_typecheck_overrides_invalid");
  return {compiler_version:JSON.parse(readFileSync(path.join(repositoryRoot,compilerPaths[0]),"utf8")).version,
    compiler:compilerPaths.map(file=>({path:file,sha256:digest(readFileSync(path.join(repositoryRoot,file)))})),
    entrypoints,overrides:{node_options:null,script_shell:null}};
}
export function observeGeneratedTypeInputs(repositoryRoot) {
  const file=name=>{const at=path.join(repositoryRoot,name),s=lstatSync(at);
    if(!s.isFile()||s.isSymbolicLink()||s.size>2*1024*1024)throw new Error("revision_typecheck_generated_unsafe");
    return{path:name,sha256:digest(readFileSync(at))};};
  const roots=[".next/types",".next/dev/types"].map(name=>{
    let at=repositoryRoot;
    for(const part of name.split("/")){at=path.join(at,part);const s=lstatSync(at,{throwIfNoEntry:false});if(!s)return{path:name,state:"absent",files:[]};
      if(!s.isDirectory()||s.isSymbolicLink())throw new Error("revision_typecheck_generated_unsafe");}
    const paths=[];
    const visit=relative=>{for(const entry of readdirSync(path.join(repositoryRoot,relative),{withFileTypes:true})){
      if(entry.isSymbolicLink())throw new Error("revision_typecheck_generated_unsafe");
      const next=relative+"/"+entry.name;if(entry.isDirectory())visit(next);else if(entry.isFile()&&entry.name.endsWith(".ts"))paths.push(next);
      if(paths.length>128)throw new Error("revision_typecheck_generated_unsafe");}};visit(name);
    return{path:name,state:"present",files:paths.sort().map(file)};
  });
  return{next_env:file("next-env.d.ts"),roots};
}
const equal=(a,b)=>a!==undefined && b!==undefined && digest(a)===digest(b);
const sha=v=>/^[a-f0-9]{64}$/u.test(v??"");
const fail=()=>{throw Object.assign(new Error("revision_typecheck_witness_invalid"),{code:"revision_typecheck_witness_invalid"});};
export const typecheckDiagnostics = text => [...text.matchAll(/^([^\r\n]+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gmu)]
  .map(([,file,line,column,code,message])=>({file,line:Number(line),column:Number(column),code:Number(code),message}));

// This is the unchanged repository compiler command, not a Node assertion
// wrapper or a driver retrospectively attributed to the failed source.
export function verifyRepositoryTypecheck(p,prior,focused,{git,parse,bytes,completedAt}) {
  const regression=focused.regression;
  if (!equal(Object.keys(regression).sort(),["after","before","kind"]) ||
      regression.kind!==REPOSITORY_TYPECHECK || focused.failed_phase!=="typecheck" ||
      !equal(focused.input_remedy_resources,[]) || !focused.implicated_paths.length) fail();
  const before=parse(regression.before), after=parse(regression.after);
  const config=["package.json","package-lock.json","tsconfig.json"];
  const sources=head=>digest(git(["ls-tree","-r","--full-tree",head]));
  const configAt=head=>config.map(path=>({path,sha256:digest(git(["show",head+":"+path]))}));
  if (!equal(configAt(prior.head),configAt(p.head))) fail();
  const pkg=JSON.parse(git(["show",p.head+":package.json"]));
  const lock=JSON.parse(git(["show",p.head+":package-lock.json"]));
  if (pkg.scripts?.typecheck!=="npm run typegen && tsc --noEmit" || pkg.scripts?.typegen!=="next typegen" ||
      before.compiler_version!==lock.packages?.["node_modules/typescript"]?.version ||
      after.compiler_version!==before.compiler_version || !equal(before.compiler,after.compiler) ||
      !equal(before.compiler?.map(v=>v.path),compilerPaths) || before.compiler.some(v=>!sha(v.sha256)) ||
      !sha(before.environment) || before.environment!==after.environment ||
      before.npm_version!==after.npm_version || !/^\d+\.\d+\.\d+$/u.test(before.npm_version??"")) fail();
  const runtime=parse(p.inputs.current);
  if (!equal(before.entrypoints,after.entrypoints) || !equal(before.entrypoints?.map(v=>v.id),["tsc","next","npm","node"]) ||
      before.entrypoints.some(v=>!sha(v.location_fingerprint)||!sha(v.sha256)) ||
      before.entrypoints[3].location_fingerprint!==runtime.node.location_fingerprint || before.entrypoints[3].sha256!==runtime.node.observation.sha256 ||
      !equal(before.overrides,{node_options:null,script_shell:null}) || !equal(before.overrides,after.overrides) ||
      !equal(before.compiler_after,{compiler:before.compiler,entrypoints:before.entrypoints,overrides:before.overrides,compiler_version:before.compiler_version}) ||
      !equal(after.compiler_after,{compiler:after.compiler,entrypoints:after.entrypoints,overrides:after.overrides,compiler_version:after.compiler_version})) fail();
  const generated=before.generated;
  if (!equal(generated,after.generated) || generated?.next_env?.path!=="next-env.d.ts" || !sha(generated.next_env.sha256) ||
      !equal(generated.roots?.map(v=>v.path),[".next/types",".next/dev/types"]) || generated.roots[0].state!=="present" ||
      generated.roots.some(root=>!["present","absent"].includes(root.state) || !Array.isArray(root.files) || root.files.length>128 ||
        root.state==="absent" && root.files.length!==0 || new Set(root.files.map(v=>v.path)).size!==root.files.length ||
        root.files.some(v=>!sha(v.sha256) || typeof v.path!=="string" || !v.path.startsWith(root.path+"/") || !/^\.next\/(?:dev\/)?types\/[A-Za-z0-9_./-]+\.ts$/u.test(v.path) || v.path.split("/").includes("..")))) fail();
  for (const [w,head,exit] of [[before,prior.head,2],[after,p.head,0]]) {
    const r=w.result, output=bytes(w.stdout,2*1024*1024).toString(), diagnostics=typecheckDiagnostics(output);
    if (w.contract!=="augnes.repository-typecheck-witness.v1" || w.command!=="npm run typecheck" ||
        w.tested_source_head!==head || w.tree!==git(["rev-parse",head+"^{tree}"]).toString().trim() ||
        w.source_tree_sha256!==sources(head) || !equal(w.config,configAt(head)) ||
        w.dirty!=="" || !equal(w.source_after,{head,dirty:"",files_unchanged:true}) || w.cache_before!=="absent" ||
        w.runtime_inputs_sha256!==p.inputs.identity_sha256 || w.node_version!==CANONICAL_NODE_VERSION ||
        !equal(w.diagnostics,diagnostics) || (exit===2 ? diagnostics.length===0 : diagnostics.length!==0) ||
        !output.includes("> npm run typegen && tsc --noEmit") || !output.includes("Types generated successfully") ||
        (output.match(/error TS\d+:/gu)??[]).length!==diagnostics.length ||
        r?.exit_code!==exit || r.timed_out!==false || r.cancelled!==false || r.cleanup_completed!==true ||
        r.remaining_owned_processes!==0 || r.termination_reason!=="natural_exit" || r.exit_observed!==true || r.streams_closed!==true ||
        !(Date.parse(completedAt)<Date.parse(w.started_at) && Date.parse(w.started_at)<Date.parse(w.finished_at))) fail();
  }
  if (!(Date.parse(before.finished_at)<Date.parse(after.started_at) && Date.parse(after.finished_at)<=Date.parse(focused.finished_at)) ||
      !focused.commands.some(c=>c.command===after.command && c.tested_source_head===p.head && equal(c.record,regression.after) && equal(c.stdout,after.stdout))) fail();
  return p.head;
}
