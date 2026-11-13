import assert from "node:assert/strict";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { digest, observePreparedDependencyInputs } from "./local-canonical-inputs.mjs";
import { revisionArtifact } from "./local-canonical-attempts.mjs";
import { verifyGitSourceRepair, MATERIAL_SOURCE_CORRECTION, MATERIAL_COMMON_DRIVER } from "./local-canonical-git-observation.mjs";
import { commonDriverSources, COMMON_DRIVER_RESULT_PREFIX, inspectCurrentCommonDriverInputs } from "./local-canonical-common-driver.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// Controlled protocol data exercises the real production evidence reader. It
// is not a captured product comparison, authority packet or qualification.
const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);
const root=owner.root,repositoryRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const write=(name,value)=>{mkdirSync(path.dirname(path.join(root,name)),{recursive:true});writeFileSync(path.join(root,name),typeof value==="string"?value:JSON.stringify(value),{mode:0o600});};
const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:8*1024*1024});
const module="scripts/controlled-module.mjs",driver="scripts/controlled-driver.mjs";
let allSettled=true;
try{
 git(["init","--quiet"]);write(".gitignore","node_modules/\n");write(module,"export const value=false;\n");
 for(const dir of ["","apps/augnes_apps","apps/web_planning"]){const prefix=dir?dir+"/":"";write(prefix+"package.json",{name:"controlled"});write(prefix+"package-lock.json",{lockfileVersion:3});write(prefix+"node_modules/controlled/package.json",{name:"controlled"});}
 const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
 const prior={head:commit("controlled predecessor")};prior.tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
 write(module,"export const value=true;\n");write(driver,"import {value} from './controlled-module.mjs'; console.log(value);\n");
 const head=commit("controlled candidate and common driver"),tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
 const ref=(name,value)=>{write(name,value);return{artifact:name,sha256:digest(readFileSync(path.join(root,name)))};};
 const bytes=(r,max)=>revisionArtifact(root,r,max),parse=r=>JSON.parse(bytes(r));
 const runtime={contract:"augnes.local-canonical-runtime-inputs.v1",node:{location_fingerprint:digest(realpathSync(process.execPath)),observation:{present:true,sha256:digest("controlled Node observation")}},headers:{observation:{content_sha256:digest("controlled headers")}}};
 const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",head,tree,commission:{source_revision:MATERIAL_SOURCE_CORRECTION},inputs:{inventory_sha256:digest("controlled inventory"),identity_sha256:digest(runtime),current:ref("runtime.json",runtime)}};
 const sources=commonDriverSources(git,root,head,prior.head,[module]);
 const env=buildCanonicalChildEnvironment({temporaryRoot:root,resourceRoot:root});
 const deps=["dependencies-root","dependencies-nested","dependencies-web-planning"].map(phase_id=>{const observation=observePreparedDependencyInputs({repositoryRoot:root,phaseId:phase_id});return{phase_id,before:observation,after:observation};});
 const t=Date.now(),at=offset=>new Date(t+offset).toISOString(),completedAt=at(-10000);
 const result=exit=>({exit_code:exit,signal:null,spawn_error_code:null,timed_out:false,cancelled:false,exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit",duration_ms:1});
 const command="node --import tsx "+driver;
 const make=(label,catalogue,tested,exit)=>{
  const summary={contract:"augnes.common-request-transport-observation.v1",imports_complete:true,assertions_complete:exit===0,cleanup_complete:true,
   primary_error_stage:exit?"response_body":null,primary_error:exit?{name:"TypeError",cause:{code:"EPIPE"}}:null,primary_selected:exit===1,primary_response_status:exit?413:null,
   first_transport_error:exit?{code:"EPIPE"}:null,cleanup_errors:[],checkpoints:["controlled protocol assertion"],actual_imports:catalogue.map(({path,byte_size,sha256})=>({path,byte_size,sha256})),worker_bundle:{bytes:1,sha256:digest("controlled bundle")},worker_inputs:catalogue.filter(v=>v.path===driver).map(({path,byte_size,sha256})=>({path,byte_size,sha256})),
   selected_uploads:exit?[{correlated_requests:1,matching_413_headers:1,released:true,harness_error:null,transport_error:{code:"EPIPE"},payload_sha256:digest("controlled payload"),headers_sha256:digest("controlled headers"),declared_length:131072,enqueued_bytes:65536}]:[]};
  const stdout=ref(label+".log",COMMON_DRIVER_RESULT_PREFIX+JSON.stringify(summary)+"\n");
  return ref(label+".json",{attribution:MATERIAL_COMMON_DRIVER,driver_source_head:head,tested_source_head:tested,
   source_state:{kind:exit?"candidate-with-predecessor-modules":"exact-final-candidate",git_head:head,git_tree:tree,untracked_read_inputs:[]},
   source_state_after:{kind:exit?"candidate-with-predecessor-modules":"exact-final-candidate",git_head:head,git_tree:tree,untracked_read_inputs:[]},
   source_files:ref(label+"-source.json",catalogue),source_files_after:ref(label+"-source-after.json",catalogue),common_source_sha256:sources.common_sha256,
   modules:catalogue.filter(v=>v.path===module).map(({path,sha256})=>({path,sha256})),file_sha256:digest(git(["show",head+":"+driver])),command,
   runtime_before:runtime,runtime_after:runtime,runtime_inputs_sha256:p.inputs.identity_sha256,node_version:process.versions.node,node_executable:realpathSync(process.execPath),
   environment_before:env,environment_after:env,environment:digest(env),prepared_dependencies:deps,result:result(exit),
   resource_lifecycle:{owner,initial_entries:[],absent_after_cleanup:true,created_at:at(exit?-9500:-7500),cleanup_finished_at:at(exit?-8500:-6500),cleanup:{root,completed:true,failure_count:0,failures:[]}},
   started_at:at(exit?-9000:-7000),finished_at:at(exit?-8000:-6000),stdout});
 };
 const before=make("before",sources.before,prior.head,1),after=make("after",sources.after,head,0),green=parse(after);
 const focused={implicated_paths:[module],source_files:[{path:driver}],input_remedy_resources:[],finished_at:at(-5000),
  regression:{attribution:MATERIAL_COMMON_DRIVER,path:driver,node_args:["--import","tsx"],args:[],before,after},
  commands:[{command,tested_source_head:head,record:after,stdout:green.stdout,result:green.result}]};
 const verify=(f=focused,q=p,extra={})=>verifyGitSourceRepair(q,prior,f,{git,parse,bytes,completedAt,repositoryRoot:root,...extra});
 assert.equal(verify(),head);let refused=0;
 const mutateWitness=(role,mutate)=>{const f=structuredClone(focused),w=parse(f.regression[role]);mutate(w);f.regression[role]=ref("bad-"+(++refused)+".json",w);if(role==="after")f.commands=[{...f.commands[0],record:f.regression.after,stdout:w.stdout,result:w.result}];assert.throws(()=>verify(f));};
 for(const mutate of [w=>w.driver_source_head=prior.head,w=>w.source_state.kind="clean-predecessor",w=>w.source_state_after.git_head=prior.head,w=>w.modules[0].sha256=digest("substitution"),
  w=>w.source_files_after=ref("altered-source.json",[]),w=>w.prepared_dependencies.pop(),w=>w.prepared_dependencies[1].after.sources[0].sha256=digest("lock drift"),
  w=>w.runtime_after.node.observation.sha256=digest("runtime drift"),w=>w.environment_after.EXTRA="unbound",w=>w.result.timed_out=true,w=>w.result.cleanup_completed=false,
  w=>w.resource_lifecycle.initial_entries.push("shared-cache"),w=>w.resource_lifecycle.absent_after_cleanup=false])mutateWitness("before",mutate);
 for(const mutate of [s=>s.primary_error_stage="imports",s=>s.primary_selected=false,s=>s.primary_error={code:"MODULE_NOT_FOUND"},
  s=>s.primary_error=null,s=>s.primary_error={code:"UNRELATED"},s=>s.selected_uploads[0].transport_error=null,
  s=>s.first_transport_error={code:"EPIPE",message:"detached"},
  s=>s.worker_inputs.push({path:"scripts/untracked.mjs",byte_size:1,sha256:digest("untracked")}),
  s=>s.selected_uploads[0].matching_413_headers=2,s=>s.selected_uploads[0].harness_error={code:"ERR_CONTROLLED_UPLOAD_RESPONSE_TIMEOUT"},
  s=>s.cleanup_errors.push({code:"cleanup"}),s=>s.actual_imports[0].sha256=digest("wrong import")])mutateWitness("before",w=>{const s=JSON.parse(bytes(w.stdout).toString().slice(COMMON_DRIVER_RESULT_PREFIX.length));mutate(s);w.stdout=ref("bad-summary-"+refused+".log",COMMON_DRIVER_RESULT_PREFIX+JSON.stringify(s)+"\n");});
 mutateWitness("after",w=>w.tested_source_head=prior.head);
 mutateWitness("after",w=>w.resource_lifecycle.created_at=parse(before).resource_lifecycle.cleanup_finished_at);
 mutateWitness("after",w=>{const s=JSON.parse(bytes(w.stdout).toString().slice(COMMON_DRIVER_RESULT_PREFIX.length));s.worker_bundle.sha256=digest("different executed Worker");w.stdout=ref("different-bundle.log",COMMON_DRIVER_RESULT_PREFIX+JSON.stringify(s)+"\n");});
 mutateWitness("after",w=>{const s=JSON.parse(bytes(w.stdout).toString().slice(COMMON_DRIVER_RESULT_PREFIX.length));s.assertions_complete=false;w.stdout=ref("incomplete-green.log",COMMON_DRIVER_RESULT_PREFIX+JSON.stringify(s)+"\n");});
 for(const mutate of [f=>f.regression.attribution="unknown",f=>f.regression.attribution="candidate-driver-prior-implicated-source",f=>f.regression.kind="typed",f=>f.regression.after_equivalence={target:head},f=>f.regression.node_args=["--import","arbitrary"],f=>f.implicated_paths.push(driver)]){const f=structuredClone(focused);mutate(f);assert.throws(()=>verify(f));refused++;}
 assert.throws(()=>verify(focused,{...p,commission:{...p.commission,evidence_kind:"typed"}}));refused++;
 assert.throws(()=>verify(focused,p,{postPass:true}));refused++;
 inspectCurrentCommonDriverInputs(root,green);
 const changed=path.join(root,"apps/augnes_apps/node_modules/controlled/package.json");writeFileSync(changed,'{"name":"changed"}');
 assert.throws(()=>inspectCurrentCommonDriverInputs(root,green));
 assert.throws(()=>inspectCurrentCommonDriverInputs(root,{...green,prepared_dependencies:green.prepared_dependencies.slice(0,2)}));
 console.log(JSON.stringify({material_common_driver_reader:{acceptance:1,refused,live_input_acceptance:1,live_input_refusals:2,synthetic_only:true,qualification:false}}));

 // Concrete scheduler controls use real pinned Undici/HTTP, never a product
 // comparison rehearsal. Their own finite child settles before this owner.
 const child=createCanonicalTestResourceRoot("ag-resource-test-");let run;allSettled=false;
 try{run=await runCanonicalChild({suite:"common-driver-controls",label:"real scheduler controls",command:process.execPath,
  args:["--import","tsx","scripts/test-web-planning-controlled-upload.mjs"],cwd:repositoryRoot,
  env:buildCanonicalChildEnvironment({temporaryRoot:child.root}),resourceOwner:child,timeoutMs:5000,stdout:process.stdout,stderr:process.stderr,log(){}});
  allSettled=run.exit_observed&&run.streams_closed&&run.cleanup_completed&&run.remaining_owned_processes===0;
  assert.equal(canonicalChildAcceptanceFailure(run,{requireNaturalExit:true}),null);assert.equal(run.exit_code,0);
 }finally{assert(cleanupCanonicalTestResources([child]).every(v=>v.completed));}
}finally{
 if(allSettled)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
 assert(cleanupCanonicalTestResources([owner]).every(v=>v.completed));
}
