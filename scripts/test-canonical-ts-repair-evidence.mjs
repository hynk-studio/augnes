// Structural/refusal fixtures only; successful predicates are not real causal
// witnesses, current authority, preparation or deciding verification.
import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest, observeInputFile } from "./local-canonical-inputs.mjs";
import { verifyGitSourceRepair, MATERIAL_SOURCE_CORRECTION, GUIDE_REPAIR_DRIVER, GUIDE_REPAIR_MODULE,
  GUIDE_REPAIR_FIXTURES, GUIDE_REPAIR_SCOPE, validateGuideRepairOutcome, FRESHNESS_REPAIR_DRIVER, FRESHNESS_REPAIR_MODULES,
  FRESHNESS_REPAIR_FIXTURES,FRESHNESS_REPAIR_SCOPE,validateFreshnessRepairOutcome,
  STOCK_MISMATCH_REPAIR_DRIVER,STOCK_MISMATCH_REPAIR_MODULES,STOCK_MISMATCH_REPAIR_FIXTURES,STOCK_MISMATCH_REPAIR_SCOPE,
  validateStockMismatchRepairOutcome,materialStockMismatchDelegation,readMaterialStockMismatchDelegation,
  verifyMaterialStockMismatchDelegationTarget,delegatesMaterialSourceCommission } from "./local-canonical-git-observation.mjs";
import { OPERATOR_REQUEST_LIFECYCLE_PHASES_V1 } from "./operator-execution-result-contract-v1.mjs";
import { revisionArtifact } from "./local-canonical-attempts.mjs";
import { validateResultDraftCaptureOutcome, validateCaptureBrowserUses, replaceCaptureModule, finalizeFocusedCapture, checkCaptureSource, verifyCaptureDependencyProvenance, TS_REPAIR_DRIVER as driver, TS_REPAIR_MODULE as module } from "./capture-canonical-ts-repair.mjs";
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
 const schedule={hold_count:1,cleanup_releases:0,rejected_releases:0,preparation_pending:true,preview_pending:false,editor_present:false,boundary_releases:0};
 const native='Error: browser_evaluation_failed:{"class":"TypeError","message":"Cannot read properties of null (reading \'tagName\')"}';
 const redOutput="result_draft_capture_failure "+JSON.stringify(schedule)+"\nresult_draft_capture_schedule "+JSON.stringify({before_cleanup:schedule,after_cleanup:{...schedule,preparation_pending:false,cleanup_releases:1}})+"\n"+native;
 validateResultDraftCaptureOutcome(redOutput,1);
 refuse(()=>validateResultDraftCaptureOutcome(redOutput.replace(native,"unrelated failure"),1));
 refuse(()=>validateResultDraftCaptureOutcome("result_draft_capture_schedule null",1));
 const greenState={...schedule,preparation_pending:false,boundary_releases:1};
 const ready=[{preparation_held:true,editor_present:false,write_waiting:true},{preparation_released:true,held_preview_returned:true,locks:1,replacement_editor_usable:true,original_draft_retained:true}];
 const greenOutput="result_draft_capture_schedule "+JSON.stringify({before_cleanup:greenState,after_cleanup:greenState})+"\n"+ready.map(v=>"result_draft_readiness "+JSON.stringify(v)).join("\n");
 refuse(()=>validateResultDraftCaptureOutcome(greenOutput.split("\n").reverse().join("\n"),0));
 validateResultDraftCaptureOutcome(greenOutput,0);refuse(()=>validateResultDraftCaptureOutcome(greenOutput.replace('"original_draft_retained":true','"original_draft_retained":false'),0));
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
 // The mjs seam is a candidate-driver overlay, never a historical clean run.
 const nativeFiles=new Map([...GUIDE_REPAIR_FIXTURES,GUIDE_REPAIR_MODULE,"package.json","package-lock.json"].map(name=>[name,Buffer.from(name.startsWith("package")?"{}":"candidate "+name)]));
 const nativeCatalogue=[...nativeFiles.keys()].sort().map(name=>({path:name,mode:"100644"}));
 const nativeContent=(ref,name)=>ref===old&&name===GUIDE_REPAIR_MODULE?Buffer.from("prior native readiness"):nativeFiles.get(name);
 const nativeSource=ref=>nativeCatalogue.map(e=>({...e,byte_size:nativeContent(ref,e.path).length,sha256:digest(nativeContent(ref,e.path))}));
 const nativeCommand="node "+GUIDE_REPAIR_DRIVER+" --operator-scope";
 const nativeProof={...p,schema:"augnes.local-canonical-source-correction.v7",commission:{ordinal:1,maximum_invocations:1,source_revision:MATERIAL_SOURCE_CORRECTION},inputs:{...p.inputs,inventory_sha256:"f".repeat(64)}};
 const nativeReport={test:"project-experience-guide-lifecycle-v1",status:"pass",adversarial_controls:73,supersession_adversarial_controls:59,delayed_canceled_result_controls:4,supersession_phases:18,
  replay_phases:OPERATOR_REQUEST_LIFECYCLE_PHASES_V1,operator_scope:true,actual_hook_guard:true,observer_parity:true,exact_fetch_promise:true,production_attempt:false,
  native_followup_boundary:[{replacement:"adopted",held_until_settlement:true,strict_verdict:true},{replacement:"invalid",held_until_settlement:true,strict_verdict:false},{replacement:"failed",held_until_settlement:true,strict_verdict:false}]};
 const nativeRed="AssertionError [ERR_ASSERTION]: native follow-up must retain its context while the actual hook replacement Fetch is held\n\ntrue !== false\n\n    at nativeFollowupBoundary (file:///synthetic/driver.mjs:211:12)\n";
 const nativeWitness=(ref,baseWitness)=>({...structuredClone(baseWitness),scope:GUIDE_REPAIR_SCOPE,checkout_head:head,
  source_state:ref===old?"candidate-with-prior-implicated-overlay":"clean-candidate",worktree_before:ref===old?" M "+GUIDE_REPAIR_MODULE+"\n":"",worktree_after:ref===old?" M "+GUIDE_REPAIR_MODULE+"\n":"",
  input_inventory_sha256:nativeProof.inputs.inventory_sha256,browser_uses:[],source_files:save("native-source-"+ref+".json",nativeSource(ref)),
  file_sha256:digest(nativeFiles.get(GUIDE_REPAIR_DRIVER)),fixture_sha256:digest(nativeSource(head).filter(v=>GUIDE_REPAIR_FIXTURES.includes(v.path))),
  modules:[{path:GUIDE_REPAIR_MODULE,sha256:digest(nativeContent(ref,GUIDE_REPAIR_MODULE))}],command:nativeCommand,
  stdout:save("native-output-"+ref+".log",Buffer.from(ref===old?nativeRed:JSON.stringify(nativeReport)))});
 const nb=nativeWitness(old,before),na=nativeWitness(head,after);
 const nf={...focused,failed_phase:"e2e-operator-native-host-execution",implicated_paths:[GUIDE_REPAIR_MODULE],source_files:nativeSource(head),
  regression:{path:GUIDE_REPAIR_DRIVER,node_args:[],args:["--operator-scope"],fixture_paths:GUIDE_REPAIR_FIXTURES,attribution:"candidate-driver-prior-implicated-source",before:"native-before",after:"native-after"},
  commands:[{command:nativeCommand,tested_source_head:head,record:"native-after",stdout:na.stdout}]};
 const nativeCheck=(b=nb,a=na,proof=nativeProof,f=nf)=>verifyGitSourceRepair(proof,prior,f,{repositoryRoot:root,completedAt:"2026-01-01T00:00:00.000Z",
  git:args=>{if(args[0]==="ls-tree")return Buffer.from(nativeCatalogue.map(e=>`${e.mode} blob ${"c".repeat(40)}\t${e.path}\0`).join(""));
   if(args[0]==="show"){const colon=args[1].indexOf(":");return nativeContent(args[1].slice(0,colon),args[1].slice(colon+1));}
   if(args[0]==="rev-parse")return Buffer.from(args[2].startsWith(old)?"0".repeat(40):"1".repeat(40));
   if(args[0]==="diff")return Buffer.from("@@ -1 +1 @@\n-old\n+new\n");throw Error("unexpected native Git operation");},
  parse:ref=>ref==="native-before"?b:a,bytes:(ref,max)=>revisionArtifact(root,ref,max)});
 assert.equal(nativeCheck(),head);
 for(const change of [q=>q.schema="augnes.local-canonical-source-correction.v10",q=>delete q.commission.source_revision,q=>q.commission.evidence_kind="selective-fixture-workload-v1",q=>delete q.inputs.inventory_sha256]){const q=structuredClone(nativeProof);change(q);refuse(()=>nativeCheck(nb,na,q));}
 for(const change of [f=>f.regression.path=driver,f=>f.regression.args=[],f=>f.regression.args.push("--skip-assertions"),f=>f.regression.node_args=["--import","tsx"],f=>f.implicated_paths=[module],f=>f.regression.fixture_paths.pop(),f=>f.failed_phase="integration",f=>f.regression.kind="unregistered",f=>f.regression.attribution="historical-clean-driver"]){const f=structuredClone(nf);change(f);refuse(()=>nativeCheck(nb,na,nativeProof,f));}
 for(const change of [w=>w.driver_source_head=old,w=>w.checkout_head=old,w=>w.source_state="clean-predecessor",w=>w.worktree_before="",w=>w.worktree_after="",w=>w.input_inventory_sha256="0".repeat(64),w=>w.browser_uses=[{}],w=>w.command+=" --other",w=>w.scope="real Browser",w=>w.file_sha256="0".repeat(64),w=>w.environment="0".repeat(64),w=>w.node_version="22.23.4",w=>w.result.cleanup_completed=false,w=>w.prepared_dependencies.after.content_sha256="0".repeat(64)]){const b=structuredClone(nb);change(b);refuse(()=>nativeCheck(b));}
 for(const change of [s=>s.slice(1),s=>s.map(e=>e.path===GUIDE_REPAIR_DRIVER?{...e,sha256:digest("prior driver")}:e),s=>s.map(e=>e.path===GUIDE_REPAIR_MODULE?{...e,sha256:digest(nativeFiles.get(GUIDE_REPAIR_MODULE))}:e)]){const b=structuredClone(nb);b.source_files=save("native-substituted-source.json",change(nativeSource(old)));refuse(()=>nativeCheck(b));}
 const unrelated=structuredClone(nb);unrelated.stdout=save("native-unrelated-red.log",Buffer.from("Error: module import failed"));refuse(()=>nativeCheck(unrelated));
 for(const change of [r=>r.native_followup_boundary.pop(),r=>r.native_followup_boundary[1].strict_verdict=true,r=>r.native_followup_boundary[2].held_until_settlement=false,r=>r.replay_phases.pop(),r=>r.adversarial_controls--,r=>r.supersession_adversarial_controls--,r=>r.delayed_canceled_result_controls=0,r=>r.actual_hook_guard=false,r=>r.observer_parity=false,r=>r.exact_fetch_promise=false,r=>r.operator_scope=false,r=>r.production_attempt=true]){const r=structuredClone(nativeReport);change(r);refuse(()=>validateGuideRepairOutcome(JSON.stringify(r),0));}
 const wrongGreen=structuredClone(na);wrongGreen.stdout=save("native-wrong-green.log",Buffer.from(JSON.stringify({...nativeReport,operator_scope:false})));refuse(()=>nativeCheck(nb,wrongGreen));
 // The physical collector accepts only the disclosed singleton overlay.
 const nativeFile=path.join(root,GUIDE_REPAIR_MODULE);writeFileSync(nativeFile,nativeFiles.get(GUIDE_REPAIR_MODULE),{mode:0o600});
 const physicalNative=nativeSource(head).filter(e=>e.path===GUIDE_REPAIR_MODULE),nativeGit=args=>Buffer.from(args[0]==="rev-parse"?head:args[0]==="diff"&&args[1]==="--name-only"?GUIDE_REPAIR_MODULE:"");
 assert.equal(checkCaptureSource(root,physicalNative,nativeGit,head,GUIDE_REPAIR_MODULE).entries,1);
 refuse(()=>checkCaptureSource(root,physicalNative,nativeGit,head));
 // One additional fixed candidate-driver recipe. Every source and dependency
 // remains bound; these fabricated outcomes test predicates, not causality.
 const freshnessFiles=new Map([...FRESHNESS_REPAIR_FIXTURES,...FRESHNESS_REPAIR_MODULES,
   ...["","apps/augnes_apps/","apps/web_planning/"].flatMap(prefix=>[prefix+"package.json",prefix+"package-lock.json"])].map(name=>[name,Buffer.from(name.endsWith(".json")?"{}":"candidate "+name)]));
 const freshnessCatalogue=[...freshnessFiles.keys()].sort().map(name=>({path:name,mode:"100644"}));
 const freshnessContent=(ref,name)=>ref===old&&FRESHNESS_REPAIR_MODULES.includes(name)?Buffer.from("prior "+name):freshnessFiles.get(name);
 const freshnessSource=ref=>freshnessCatalogue.map(e=>({...e,byte_size:freshnessContent(ref,e.path).length,sha256:digest(freshnessContent(ref,e.path))}));
 const freshnessDependencies=["dependencies-root","dependencies-nested","dependencies-web-planning"].map((phase_id,i)=>{
   const dir=["","apps/augnes_apps","apps/web_planning"][i],observation={...structuredClone(dep),phase_id,location_fingerprint:digest(path.join(root,dir,"node_modules"))};
   return {phase_id,before:observation,after:structuredClone(observation)};
 });
 const freshnessReport=(ref,exit)=>({contract:"augnes.serial-material-freshness-boundary.v1",scope:FRESHNESS_REPAIR_SCOPE,
   input_sha256:"a".repeat(64),historical_sha256:"b".repeat(64),implicated_sources:FRESHNESS_REPAIR_MODULES.map(name=>({path:name,byte_size:freshnessContent(ref,name).length,sha256:digest(freshnessContent(ref,name))})),
   source_boundaries:Object.fromEntries(["observation","handoff","inspect","deferred"].map(k=>[k,"c".repeat(64)])),
   explicit_stale_guard:true,explicit_old_inspect:true,explicit_old_deferred:true,identity_refusals:4,callback_invocations:1,
   boundaries:Object.fromEntries(["inspect","deferred"].map(k=>[k,exit?{status:"failure",acquisitions:0,error_code:"revision_current_preservation_unsafe",failed_conditions:["observation_stale"]}:{status:"pass",acquisitions:1}])),
   positive_admission:exit?{not_reached:true}:{fresh:true,explicit_override_rejected:true,acquisitions:2,source_sha256:"d".repeat(64)},supplied_history_unchanged:true,synthetic_only:true,deciding:false,cleanup_complete:true});
 const freshnessOutput=(ref,exit)=>"AUGNES_SERIAL_MATERIAL_FRESHNESS "+JSON.stringify(freshnessReport(ref,exit))+"\n"+(exit?"Error: revision_current_preservation_unsafe\n":"");
 const freshnessCommand="node "+FRESHNESS_REPAIR_DRIVER;
 const freshnessWitness=(ref,baseWitness)=>({...structuredClone(baseWitness),scope:FRESHNESS_REPAIR_SCOPE,source_files:save("freshness-source-"+ref+".json",freshnessSource(ref)),
   worktree_before:ref===old?FRESHNESS_REPAIR_MODULES.map(name=>" M "+name+"\n").join(""):"",worktree_after:ref===old?FRESHNESS_REPAIR_MODULES.map(name=>" M "+name+"\n").join(""):"",
   file_sha256:digest(freshnessFiles.get(FRESHNESS_REPAIR_DRIVER)),fixture_sha256:digest(freshnessSource(head).filter(v=>FRESHNESS_REPAIR_FIXTURES.includes(v.path))),
   modules:FRESHNESS_REPAIR_MODULES.map(name=>({path:name,sha256:digest(freshnessContent(ref,name))})),command:freshnessCommand,prepared_dependencies:structuredClone(freshnessDependencies),
   stdout:save("freshness-output-"+ref+".log",Buffer.from(freshnessOutput(ref,ref===old?1:0)))});
 const fb=freshnessWitness(old,nb),fa=freshnessWitness(head,na);
 for(const [ref,w,exit]of [[old,fb,1],[head,fa,0]]){
   w.started_at=new Date(Date.parse(w.finished_at)-1).toISOString();Object.assign(w.result,{signal:null,spawn_error_code:null,duration_ms:1});
   const output=freshnessOutput(ref,exit),stdout=output.split("\n")[0]+"\n",stderr=exit?"Error: revision_current_preservation_unsafe\n":"";
   w.raw_streams={stdout:{ref:save("freshness-stdout-"+ref+".log",Buffer.from(stdout)),bytes:Buffer.byteLength(stdout)},stderr:{ref:save("freshness-stderr-"+ref+".log",Buffer.from(stderr)),bytes:Buffer.byteLength(stderr)}};
   w.settlement=save("freshness-settlement-"+ref+".json",{started_at:w.started_at,finished_at:w.finished_at,result:w.result});
   w.environment_cleanup=save("freshness-cleanup-"+ref+".json",{lexical_root:root+"/recreated-environment",completed:true,absent:true,cleanup:[{completed:true}]});
 }
 const ff={...nf,failed_phase:"authority",implicated_paths:FRESHNESS_REPAIR_MODULES,source_files:freshnessSource(head),
   regression:{path:FRESHNESS_REPAIR_DRIVER,node_args:[],args:[],fixture_paths:FRESHNESS_REPAIR_FIXTURES,attribution:"candidate-driver-prior-implicated-source",before:"freshness-before",after:"freshness-after"},
   commands:[{command:freshnessCommand,tested_source_head:head,record:"freshness-after",stdout:fa.stdout}]};
 const freshnessCheck=(b=fb,a=fa,proof=nativeProof,f=ff)=>verifyGitSourceRepair(proof,prior,f,{repositoryRoot:root,completedAt:"2026-01-01T00:00:00.000Z",
   git:args=>{if(args[0]==="ls-tree")return Buffer.from(freshnessCatalogue.map(e=>`${e.mode} blob ${"c".repeat(40)}\t${e.path}\0`).join(""));
     if(args[0]==="show"){const colon=args[1].indexOf(":");return freshnessContent(args[1].slice(0,colon),args[1].slice(colon+1));}
     if(args[0]==="rev-parse")return Buffer.from(args[2].startsWith(old)?"0".repeat(40):"1".repeat(40));if(args[0]==="diff")return Buffer.from("@@ -1 +1 @@\n-old\n+new\n");throw Error("unexpected freshness Git operation");},
   parse:ref=>typeof ref==="object"?JSON.parse(revisionArtifact(root,ref)):ref==="freshness-before"?b:a,bytes:(ref,max)=>revisionArtifact(root,ref,max)});
 assert.equal(freshnessCheck(),head);
 for(const change of [f=>f.regression.args=["--other"],f=>f.regression.node_args=["--import","tsx"],f=>f.regression.path=GUIDE_REPAIR_DRIVER,f=>f.regression.fixture_paths.pop(),
   f=>f.implicated_paths.reverse(),f=>f.implicated_paths.pop(),f=>f.failed_phase="integration",f=>f.regression.kind="fixture-freshness",f=>f.regression.attribution="historical-clean-driver"]){const f=structuredClone(ff);change(f);refuse(()=>freshnessCheck(fb,fa,nativeProof,f));}
 for(const change of [w=>w.prepared_dependencies.pop(),w=>w.prepared_dependencies[1].after.content_sha256="0".repeat(64),w=>w.prepared_dependencies[2].before.location_fingerprint=digest("other"),
   w=>w.worktree_before="",w=>w.worktree_after="",w=>w.modules.pop(),w=>w.source_state="clean-predecessor",w=>w.result.timed_out=true,w=>w.result.cleanup_completed=false,w=>w.environment="0".repeat(64),w=>delete w.raw_streams,w=>w.raw_streams.stderr.bytes=0,w=>delete w.environment_cleanup,w=>delete w.settlement]){const b=structuredClone(fb);change(b);refuse(()=>freshnessCheck(b));}
 for(const change of [r=>r.explicit_old_inspect=false,r=>r.explicit_old_deferred=false,r=>r.explicit_stale_guard=false,r=>r.callback_invocations=0,r=>r.identity_refusals=0,
   r=>r.supplied_history_unchanged=false,r=>r.cleanup_complete=false,r=>r.synthetic_only=false,r=>r.deciding=true,r=>r.boundaries.inspect.acquisitions=0,
   r=>r.boundaries.deferred.status="failure",r=>r.positive_admission.explicit_override_rejected=false]){const r=freshnessReport(head,0);change(r);refuse(()=>validateFreshnessRepairOutcome("AUGNES_SERIAL_MATERIAL_FRESHNESS "+JSON.stringify(r)+"\n",0));}
 for(const output of ["Error: import failed\n",freshnessOutput(old,1).replace("Error: revision_current_preservation_unsafe","Error: unrelated"),freshnessOutput(old,1).replace('"observation_stale"','"same_service"'),freshnessOutput(head,0).trim(),freshnessOutput(head,0)+freshnessOutput(head,0)])refuse(()=>validateFreshnessRepairOutcome(output,output.includes("revision_current_preservation_unsafe")?1:0));
 const swapped=structuredClone(fb);swapped.source_files=save("freshness-substituted-source.json",freshnessSource(head));refuse(()=>freshnessCheck(swapped));
 const changedInput=structuredClone(fa),changedReport=freshnessReport(head,0);changedReport.input_sha256="f".repeat(64);changedInput.stdout=save("freshness-input-substituted.log",Buffer.from("AUGNES_SERIAL_MATERIAL_FRESHNESS "+JSON.stringify(changedReport)+"\n"));refuse(()=>freshnessCheck(fb,changedInput));
 for(const name of FRESHNESS_REPAIR_MODULES){mkdirSync(path.dirname(path.join(root,name)),{recursive:true});writeFileSync(path.join(root,name),freshnessFiles.get(name),{mode:0o600});}
 const overlayCatalogue=freshnessSource(head).filter(e=>FRESHNESS_REPAIR_MODULES.includes(e.path)),overlayGit=args=>Buffer.from(args[0]==="rev-parse"?head:args[0]==="diff"&&args[1]==="--name-only"?FRESHNESS_REPAIR_MODULES.join("\n"):"");
 assert.equal(checkCaptureSource(root,overlayCatalogue,overlayGit,head,FRESHNESS_REPAIR_MODULES).entries,2);refuse(()=>checkCaptureSource(root,overlayCatalogue,overlayGit,head,[FRESHNESS_REPAIR_MODULES[0]]));
 // Retained failed-evidence admission uses the same candidate driver/input on
 // both sides. These fabricated records exercise seals/refusals, not causality.
 const mismatchFiles=new Map([...STOCK_MISMATCH_REPAIR_FIXTURES,...STOCK_MISMATCH_REPAIR_MODULES,
   ...["","apps/augnes_apps/","apps/web_planning/"].flatMap(prefix=>[prefix+"package.json",prefix+"package-lock.json"])].map(name=>[name,Buffer.from(name.endsWith(".json")?"{}":"candidate "+name)]));
 const mismatchCatalogue=[...mismatchFiles.keys()].sort().map(name=>({path:name,mode:"100644"}));
 const mismatchContent=(ref,name)=>ref===old&&STOCK_MISMATCH_REPAIR_MODULES.includes(name)?Buffer.from("prior "+name):mismatchFiles.get(name);
 const mismatchSource=ref=>mismatchCatalogue.map(e=>({...e,byte_size:mismatchContent(ref,e.path).length,sha256:digest(mismatchContent(ref,e.path))}));
 const controlled={contract:"augnes.material-stock-mismatch-input.v1",originals:{receipt:"synthetic original receipt\n",attempt:"synthetic original attempt\n",stock:"synthetic false stock\n",observation:"synthetic complete observation\n"}};
 const controlledRef=save("mismatch-controlled-input.json",controlled),originalHashes=Object.fromEntries(Object.entries(controlled.originals).map(([key,value])=>[key,digest(Buffer.from(value))]));
 const mismatchProof={...nativeProof,branch:"codex/synthetic",pull_request:999,
   originals:Object.fromEntries(["receipt","attempt","stock"].map(key=>[key,{artifact:key+".json",sha256:originalHashes[key]}]))};
 const mismatchReport=(ref,exit)=>({contract:"augnes.material-stock-mismatch-boundary.v1",scope:STOCK_MISMATCH_REPAIR_SCOPE,
   input_sha256:controlledRef.sha256,historical_sha256:digest(controlled.originals),originals:originalHashes,
   implicated_sources:STOCK_MISMATCH_REPAIR_MODULES.map(name=>({path:name,byte_size:mismatchContent(ref,name).length,sha256:digest(mismatchContent(ref,name))})),
   decision:exit?{status:"failure",error_code:"revision_browser_stock_unaccounted"}:{status:"pass"},refusal_controls:exit?0:35,
   historical_stock_preserved:true,complete_git_still_inequivalent:true,lineage_unverified_preserved:true,deciding:false,cleanup_complete:true});
 const mismatchOutput=(ref,exit)=>"AUGNES_MATERIAL_STOCK_MISMATCH "+JSON.stringify(mismatchReport(ref,exit))+"\n"+(exit?"Error: revision_browser_stock_unaccounted\n":"");
 const mismatchCommand="node "+STOCK_MISMATCH_REPAIR_DRIVER;
 const mismatchWitness=(ref,baseWitness)=>{
   const exit=ref===old?1:0,stdout="AUGNES_MATERIAL_STOCK_MISMATCH "+JSON.stringify(mismatchReport(ref,exit))+"\n",stderr=exit?"Error: revision_browser_stock_unaccounted\n":"";
   const w={...structuredClone(baseWitness),scope:STOCK_MISMATCH_REPAIR_SCOPE,source_files:save("mismatch-source-"+ref+".json",mismatchSource(ref)),
     worktree_before:exit?STOCK_MISMATCH_REPAIR_MODULES.map(name=>" M "+name+"\n").join(""):"",worktree_after:exit?STOCK_MISMATCH_REPAIR_MODULES.map(name=>" M "+name+"\n").join(""):"",
     file_sha256:digest(mismatchFiles.get(STOCK_MISMATCH_REPAIR_DRIVER)),fixture_sha256:digest(mismatchSource(head).filter(v=>STOCK_MISMATCH_REPAIR_FIXTURES.includes(v.path))),
     modules:STOCK_MISMATCH_REPAIR_MODULES.map(name=>({path:name,sha256:digest(mismatchContent(ref,name))})),command:mismatchCommand,controlled_input:controlledRef,
     stdout:save("mismatch-output-"+ref+".log",Buffer.from(stdout+stderr)),raw_streams:{stdout:{ref:save("mismatch-stdout-"+ref+".log",Buffer.from(stdout)),bytes:Buffer.byteLength(stdout)},stderr:{ref:save("mismatch-stderr-"+ref+".log",Buffer.from(stderr)),bytes:Buffer.byteLength(stderr)}}};
   w.settlement=save("mismatch-settlement-"+ref+".json",{started_at:w.started_at,finished_at:w.finished_at,result:w.result});return w;
 };
 const mb=mismatchWitness(old,fb),ma=mismatchWitness(head,fa);
 const mf={...ff,failed_phase:"integration",implicated_paths:STOCK_MISMATCH_REPAIR_MODULES,source_files:mismatchSource(head),
   predecessor_stock:{contract:"settled-material-current-stock-git-mismatch-v1",observation:{artifact:"retained-observation.json",sha256:originalHashes.observation}},
   regression:{path:STOCK_MISMATCH_REPAIR_DRIVER,node_args:[],args:[],fixture_paths:STOCK_MISMATCH_REPAIR_FIXTURES,attribution:"candidate-driver-prior-implicated-source",before:"mismatch-before",after:"mismatch-after"},
   commands:[{command:mismatchCommand,tested_source_head:head,record:"mismatch-after",stdout:ma.stdout}]};
 const mismatchCheck=(b=mb,a=ma,proof=mismatchProof,f=mf,changed=STOCK_MISMATCH_REPAIR_MODULES)=>verifyGitSourceRepair(proof,prior,f,{repositoryRoot:root,completedAt:"2026-01-01T00:00:00.000Z",
   git:args=>{if(args[0]==="ls-tree")return Buffer.from(mismatchCatalogue.map(e=>`${e.mode} blob ${"c".repeat(40)}\t${e.path}\0`).join(""));
     if(args[0]==="show"){const colon=args[1].indexOf(":");return mismatchContent(args[1].slice(0,colon),args[1].slice(colon+1));}
     if(args[0]==="rev-parse")return Buffer.from(args[2].startsWith(old)?"0".repeat(40):"1".repeat(40));if(args[0]==="diff")return Buffer.from(args[1]==="--name-only"?changed.join("\n"):"@@ -1 +1 @@\n-old\n+new\n");throw Error("unexpected mismatch Git operation");},
   parse:ref=>typeof ref==="object"?JSON.parse(revisionArtifact(root,ref)):ref==="mismatch-before"?b:a,bytes:(ref,max)=>revisionArtifact(root,ref,max)});
 assert.equal(mismatchCheck(),head);
 refuse(()=>mismatchCheck(mb,ma,mismatchProof,mf,[...STOCK_MISMATCH_REPAIR_MODULES,"lib/unrelated-product.ts"]));
 refuse(()=>mismatchCheck(mb,ma,mismatchProof,mf,[]));
 for(const change of [f=>f.regression.path=FRESHNESS_REPAIR_DRIVER,f=>f.failed_phase="authority",f=>f.implicated_paths.reverse(),
   f=>f.regression.fixture_paths.pop(),f=>f.regression.args=["--skip"],f=>f.predecessor_stock.observation.sha256=digest("other observation")]){
   const f=structuredClone(mf);change(f);refuse(()=>mismatchCheck(mb,ma,mismatchProof,f));
 }
 for(const change of [w=>delete w.controlled_input,w=>w.controlled_input=save("mismatch-other-input.json",{...controlled,extra:true}),
   w=>w.source_files=save("mismatch-wrong-catalogue.json",mismatchSource(head)),w=>w.prepared_dependencies.pop(),
   w=>w.prepared_dependencies[2].after.content_sha256=digest("changed installed loader"),w=>delete w.settlement,
   w=>delete w.environment_cleanup,w=>w.raw_streams.stderr.bytes=0,w=>w.source_state="untouched-predecessor"]){
   const b=structuredClone(mb);change(b);refuse(()=>mismatchCheck(b));
 }
 for(const name of ["receipt","attempt","stock"]){const proof=structuredClone(mismatchProof);proof.originals[name].sha256=digest("substituted original");refuse(()=>mismatchCheck(mb,ma,proof));}
 for(const change of [r=>r.input_sha256="invalid",r=>r.historical_sha256="invalid",r=>r.scope="historical clean checkout",r=>delete r.originals.stock,
   r=>r.implicated_sources.reverse(),r=>r.decision.status="failure",r=>r.historical_stock_preserved=false,r=>r.complete_git_still_inequivalent=false,
   r=>r.lineage_unverified_preserved=false,r=>r.deciding=true,r=>r.cleanup_complete=false,r=>r.refusal_controls=0]){
   const r=structuredClone(mismatchReport(head,0));change(r);refuse(()=>validateStockMismatchRepairOutcome("AUGNES_MATERIAL_STOCK_MISMATCH "+JSON.stringify(r)+"\n",0));
 }
 for(const output of [mismatchOutput(old,1).replace("Error: revision_browser_stock_unaccounted","Error: import failed"),mismatchOutput(head,0).trim(),mismatchOutput(head,0)+mismatchOutput(head,0)])refuse(()=>validateStockMismatchRepairOutcome(output,output.includes('Error:')?1:0));
 const anchor={revision:17,review_id:1234,head:old,task_page:"page_"+"c".repeat(32)},assignment=materialStockMismatchDelegation(mismatchProof,anchor);
 assert.deepEqual(readMaterialStockMismatchDelegation(assignment,mismatchProof),anchor);assert(delegatesMaterialSourceCommission(assignment,mismatchProof));
 const delegationEvidence={prior:{head:old,source_correction:structuredClone(nativeProof)},focused:mf};
 assert.deepEqual(verifyMaterialStockMismatchDelegationTarget(mismatchProof,assignment,delegationEvidence),anchor);
 for(const body of [assignment.replace("distinct authenticated one-use commission","two commissions"),assignment.replace("creates no current deciding entitlement","creates current deciding entitlement"),
   assignment.replace("lineage UNVERIFIED","lineage VERIFIED"),assignment.replace("120,000ms","180,000ms"),assignment.replace("No Ready, merge","Ready, merge"),
   assignment.replace("pull/999#","pull/998#"),"```\n"+assignment+"\n```",assignment+"\n\n<!-- hidden -->"]){assert.equal(readMaterialStockMismatchDelegation(body,mismatchProof),null);refusals++;}
 for(const change of [e=>e.prior.head=head,e=>e.prior.source_correction.commission.maximum_invocations=2,
   e=>e.focused.regression.path=FRESHNESS_REPAIR_DRIVER,e=>e.focused.implicated_paths.pop(),e=>e.focused.predecessor_stock.contract="unsupported"]){
   const e=structuredClone(delegationEvidence);change(e);refuse(()=>verifyMaterialStockMismatchDelegationTarget(mismatchProof,assignment,e));
 }
 console.log(JSON.stringify({scope:"structural-only",positive:true,refusals,freshness_recipe:true,material_stock_mismatch_recipe:true}));
} finally {assert.ok(cleanupCanonicalTestResources([owner]).every(v=>v.completed));assert.equal(existsSync(root),false);}
