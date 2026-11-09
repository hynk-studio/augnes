// Structural/refusal fixtures only; successful predicates are not real causal
// witnesses, current authority, preparation or deciding verification.
import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest, observeInputFile } from "./local-canonical-inputs.mjs";
import { verifyGitSourceRepair } from "./local-canonical-git-observation.mjs";
import { revisionArtifact } from "./local-canonical-attempts.mjs";
import { validateCaptureBrowserUses, replaceCaptureModule, finalizeFocusedCapture, checkCaptureSource, verifyCaptureDependencyProvenance, TS_REPAIR_DRIVER as driver, TS_REPAIR_MODULE as module } from "./capture-canonical-ts-repair.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
const owner=createCanonicalTestResourceRoot("ag-resource-test-"),root=owner.root;
const save=(name,value)=>{const b=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value));writeFileSync(path.join(root,name),b,{mode:0o600});return {artifact:name,sha256:digest(b)};};
const head="a".repeat(40),old="b".repeat(40),fixture="scripts/result-draft-capture-scheduler.mjs";
const files=new Map([[driver,Buffer.from("candidate driver")],[module,Buffer.from("corrected helper")],[fixture,Buffer.from("common scheduler")],
 ["app/api/autonomy/runs/[id]/route.ts",Buffer.from("dynamic route")],["app/projects/[projectId]/page.tsx",Buffer.from("project route")],
 ["package.json",Buffer.from("{}")],["package-lock.json",Buffer.from("{}")]]);
const priorModule=Buffer.from("genuine prior helper"),catalogue=[...files.keys()].sort().map(name=>({path:name,mode:"100644"}));
const raw=Buffer.from(catalogue.map(e=>`${e.mode} blob ${"c".repeat(40)}\t${e.path}\0`).join(""));
const content=(ref,name)=>ref===old&&name===module?priorModule:files.get(name);
const source=ref=>catalogue.map(e=>({...e,byte_size:content(ref,e.path).length,sha256:digest(content(ref,e.path))}));
const p={schema:"augnes.local-canonical-source-correction.v10",kind:"reviewed_revision",commission:{ordinal:2},head,tree:head,inputs:{identity_sha256:"d".repeat(64)}};
const prior={head:old,tree:old},command="node --import tsx "+driver;
const dep={contract:"augnes.local-canonical-prepared-dependencies.v2",phase_id:"dependencies-root",location_fingerprint:digest(root+"/node_modules"),sources:["package.json","package-lock.json"].map(name=>({name,sha256:digest(files.get(name)),bytes:files.get(name).length})),entries:5,bytes:40,layout_sha256:"1".repeat(64),content_sha256:"2".repeat(64),permission_sha256:"3".repeat(64),generated_directories:[{path:".cache",state:"absent"},{path:".vite-temp",state:"absent"}]};
const witness=(ref,exit,time)=>({scope:"SYNTHETIC structural fixture",attribution:"candidate-driver-prior-implicated-source",driver_source_head:head,tested_source_head:ref,
 source_files:save(ref===old?"before-source.json":"after-source.json",source(ref)),fixture_sha256:digest(source(head).filter(v=>[driver,fixture].includes(v.path))),environment:"e".repeat(64),file_sha256:digest(files.get(driver)),modules:[{path:module,sha256:digest(content(ref,module))}],command,node_version:"24.22.1",runtime_inputs_sha256:p.inputs.identity_sha256,prepared_dependencies:{before:structuredClone(dep),after:structuredClone(dep)},result:{exit_code:exit,timed_out:false,cancelled:false,cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit",exit_observed:true,streams_closed:true},finished_at:time,stdout:save("output-"+exit+".log",Buffer.from("synthetic fixture "+exit))});
const before=witness(old,1,"2026-01-02T00:00:00.000Z"),after=witness(head,0,"2026-01-03T00:00:00.000Z");
const focused={failed_phase:"e2e-project-experience",implicated_paths:[module],input_remedy_resources:[],source_files:[{path:driver},{path:module}],regression:{path:driver,node_args:["--import","tsx"],args:[],fixture_paths:[driver,fixture],attribution:"candidate-driver-prior-implicated-source",before:"before",after:"after"},finished_at:"2026-01-04T00:00:00.000Z",commands:[{command,tested_source_head:head,record:"after",stdout:after.stdout}]};
let parsed=0,refusals=0;
function check(b=before,a=after,tree=raw,proof=p,f=focused){parsed=0;return verifyGitSourceRepair(proof,prior,f,{repositoryRoot:root,completedAt:"2026-01-01T00:00:00.000Z",git:args=>{
 if(args[0]==="ls-tree")return tree;
 if(args[0]==="show"){const colon=args[1].indexOf(":"),ref=args[1].slice(0,colon),name=args[1].slice(colon+1);assert.ok([old,head].includes(ref));return content(ref,name);}
 if(args[0]==="rev-parse")return Buffer.from(args[2].startsWith(old)?"0".repeat(40):"1".repeat(40));
 if(args[0]==="diff")return Buffer.from("@@ -1 +1 @@\n-old\n+new\n");throw Error("unexpected Git operation");},
 parse:ref=>{parsed++;return ref==="before"?b:a;},bytes:(ref,max)=>revisionArtifact(root,ref,max)});}
const refuse=fn=>{assert.throws(fn,/revision_|capture_|dependency_input_/u);refusals++;};
try {
 assert.equal(check(),head);assert.equal(parsed,2);
 for(const name of ["app/../route.ts","app/[id]\n/route.ts","app/[id]\0/route.ts","app/[id]\t/route.ts","app/[id]\\route.ts","app/[id]:route.ts"]){refuse(()=>check(before,after,Buffer.from(raw.toString().replace("app/api/autonomy/runs/[id]/route.ts",name))));assert.equal(parsed,0);}
 for(const mutate of [s=>s.slice(1),s=>s.map(e=>e.path.includes("[id]")?{...e,path:e.path.replace("[id]","id")}:e),s=>s.map(e=>({...e,sha256:"0".repeat(64)}))]){const b=structuredClone(before);b.source_files=save("substituted-source.json",mutate(source(old)));refuse(()=>check(b));}
 for(const side of ["before","after"])for(const position of ["before","after"]){const b=structuredClone(before),a=structuredClone(after);(side==="before"?b:a).prepared_dependencies[position].content_sha256="0".repeat(64);refuse(()=>check(b,a));}
 for(const change of [w=>w.command="node other.ts",w=>w.environment="0".repeat(64),w=>w.runtime_inputs_sha256="0".repeat(64),w=>w.modules[0].sha256="0".repeat(64),w=>w.result.timed_out=true,w=>w.result.cleanup_completed=false,w=>w.result.remaining_owned_processes=1,w=>w.result.termination_reason="cancelled",w=>w.result.exit_code=1,w=>w.fixture_sha256="0".repeat(64),w=>w.prepared_dependencies.after.observed_at="later"]){const a=structuredClone(after);change(a);refuse(()=>check(before,a));}
 const other=structuredClone(p);other.schema="augnes.local-canonical-source-correction.v7";refuse(()=>check(before,after,raw,other));
 const ref=save("bounded.json",Buffer.alloc(600*1024,32));refuse(()=>revisionArtifact(root,ref));assert.equal(revisionArtifact(root,ref,2*1024*1024).length,600*1024);
 chmodSync(path.join(root,ref.artifact),0o666);refuse(()=>revisionArtifact(root,ref,2*1024*1024));chmodSync(path.join(root,ref.artifact),0o600);
 linkSync(path.join(root,ref.artifact),path.join(root,"linked.json"));refuse(()=>revisionArtifact(root,ref,2*1024*1024));unlinkSync(path.join(root,"linked.json"));
 symlinkSync(path.join(root,ref.artifact),path.join(root,"symlink.json"));refuse(()=>revisionArtifact(root,{...ref,artifact:"symlink.json"},2*1024*1024));
 refuse(()=>revisionArtifact(root,{...ref,sha256:"0".repeat(64)},2*1024*1024));
 // Physical collector checks are independent of catalogue assertions.
 mkdirSync(path.join(root,"scripts"));writeFileSync(path.join(root,module),files.get(module),{mode:0o600});
 const physical=source(head).filter(e=>e.path===module),git=args=>Buffer.from(args[0]==="rev-parse"?head:"");
 assert.equal(checkCaptureSource(root,physical,git,head).entries,1);
 writeFileSync(path.join(root,module),"substitute");refuse(()=>checkCaptureSource(root,physical,git,head));
 const receipt={phases:[{id:"dependencies-root",status:"pass",exit_status:0,command:"npm ci --no-audit --no-fund",timed_out:false,cleanup:{completed:true,exit_observed:true,streams_closed:true,remaining_owned_processes:0,termination_reason:"natural_exit"}}],inputs:{prepared_dependencies:[{phase_id:"dependencies-root",before:dep,after:dep,unchanged:true,error:null}]}};
 assert.ok(verifyCaptureDependencyProvenance(finalizeReceipt(receipt),dep,root));
 const bad=structuredClone(receipt);bad.phases[0].status="failure";refuse(()=>verifyCaptureDependencyProvenance(finalizeReceipt(bad),dep,root));
 const stale=structuredClone(dep);stale.content_sha256="0".repeat(64);refuse(()=>verifyCaptureDependencyProvenance(finalizeReceipt(receipt),stale,root));
 const observation=observeInputFile(process.execPath,{readOnlyExecutable:true});
 const use={contract:"augnes.local-canonical-browser-use.v2",consumer:"project-client",executable_name:"Structural fixture",location_fingerprint:digest(process.execPath),before:observation,after:observation,actual_version:"Chrome/1.0.0.0",runtime_versions:{http:"Chrome/1.0.0.0",cdp:"Chrome/1.0.0.0"},disposition:"unchanged",unchanged:true};
 const expected={location_fingerprint:use.location_fingerprint,before:observation};
 expected.actual_version=validateCaptureBrowserUses([use],expected,1);
 assert.equal(validateCaptureBrowserUses([use,use],expected,2),expected.actual_version);
 for(const altered of [[],[{}],[{...use,consumer:"other"}],[{...use,actual_version:"Chrome/2.0.0.0",runtime_versions:{http:"Chrome/2.0.0.0",cdp:"Chrome/2.0.0.0"}}]])refuse(()=>validateCaptureBrowserUses(altered,expected,1));
 refuse(()=>validateCaptureBrowserUses([use,{...use,actual_version:"Chrome/2.0.0.0",runtime_versions:{http:"Chrome/2.0.0.0",cdp:"Chrome/2.0.0.0"}}],{location_fingerprint:use.location_fingerprint,before:observation},2));
 const overlayFile=path.join(root,module),originalBytes=readFileSync(overlayFile),replacement=Buffer.from("replacement");
 linkSync(overlayFile,path.join(root,"hardlink.ts"));refuse(()=>replaceCaptureModule(overlayFile,originalBytes,replacement));assert.deepEqual(readFileSync(path.join(root,"hardlink.ts")),originalBytes);unlinkSync(path.join(root,"hardlink.ts"));
 refuse(()=>replaceCaptureModule(overlayFile,Buffer.from("stale"),replacement));assert.deepEqual(readFileSync(overlayFile),originalBytes);
 replaceCaptureModule(overlayFile,originalBytes,replacement);assert.deepEqual(readFileSync(overlayFile),replacement);
 replaceCaptureModule(overlayFile,replacement,originalBytes);assert.deepEqual(readFileSync(overlayFile),originalBytes);
 // A refusal before any child keeps its root prepared and cleans it. Failed
 // restoration or cleanup must not skip release/observation or rewrite fault.
 const unstarted=createCanonicalTestResourceRoot("ag-resource-test-");
 const pre=finalizeFocusedCapture({resources:()=>cleanupCanonicalTestResources([unstarted]),ownership:()=>({released:true})});
 assert.equal(pre.errors.length,0);assert.equal(existsSync(unstarted.root),false);
 const calls=[],primary=new Error("original_child_fault");
 const final=finalizeFocusedCapture({restore:()=>{calls.push("restore");throw Error("foreign_overlay");},resources:()=>{calls.push("resources");throw Error("unsafe_resource");},ownership:()=>{calls.push("ownership");return {released:true};},source:()=>{calls.push("source");throw Error("source_changed");}});
 assert.deepEqual(calls,["restore","resources","ownership","source"]);assert.equal(final.errors.length,3);assert.equal(primary.message,"original_child_fault");
 console.log(JSON.stringify({scope:"structural-only",positive:true,refusals}));
} finally {assert.ok(cleanupCanonicalTestResources([owner]).every(v=>v.completed));assert.equal(existsSync(root),false);}
