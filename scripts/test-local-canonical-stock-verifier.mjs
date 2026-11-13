import assert from "node:assert/strict";
import fs, { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, INPUT_CONTRACT, observePreparedDependencyInputs } from "./local-canonical-inputs.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { revisionArtifact } from "./local-canonical-attempts.mjs";
import { commonDriverSources } from "./local-canonical-common-driver.mjs";
import { GIT_CONFIG_STOCK_VERIFIER_REPAIR, MATERIAL_COMMON_STOCK_VERIFIER, STOCK_VERIFIER_RESULT_PREFIX,
  STOCK_VERIFIER_MODULES, STOCK_VERIFIER_CORPUS, STOCK_VERIFIER_OBSERVATION, verifyMaterialStockVerifier } from "./local-canonical-stock-verifier-witness.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources, buildCanonicalChildEnvironment, createCanonicalTestResourceDirectory } from "./canonical-test-environment.mjs";
import { freezeStockVerifierCorpus, restoreStockVerifierCorpus, finishStockVerifierCorpus } from "./fixtures/local-canonical-stock-verifier.mjs";

// Controlled protocol records test the real evidence reader, not a real
// comparison, authenticated maintainer acceptance or host qualification.
const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);
const root=owner.root,clone=structuredClone,write=(name,value)=>{
  const file=path.join(root,name);mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  writeFileSync(file,typeof value==="string"?value:JSON.stringify(value),{mode:0o600});
};
const ref=(name,value)=>{write(name,value);return{artifact:name,sha256:digest(readFileSync(path.join(root,name)))};};
const bytes=(r,max)=>revisionArtifact(root,r,max),parse=r=>JSON.parse(bytes(r));
const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:8*1024*1024,stdio:["ignore","pipe","pipe"]});
let refusals=0;
try{
  git(["init","--quiet"]);write(".gitignore","node_modules/\n");
  for(const name of STOCK_VERIFIER_MODULES)write(name,"export const controlled=false;\n");
  for(const dir of ["","apps/augnes_apps","apps/web_planning"]){const prefix=dir?dir+"/":"";
    write(prefix+"package.json",{name:"controlled-stock"});write(prefix+"package-lock.json",{lockfileVersion:3});write(prefix+"node_modules/fixture/package.json",{name:"fixture"});}
  const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
  const prior={head:commit("controlled stock predecessor")};
  for(const name of STOCK_VERIFIER_MODULES)write(name,"export const controlled=true;\n");
  const driver="scripts/test-local-canonical-stock-verifier-regression.mjs";write(driver,"console.log('controlled common driver');\n");
  const head=commit("controlled stock candidate"),tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
  const sources=commonDriverSources(git,root,head,prior.head,STOCK_VERIFIER_MODULES),env=buildCanonicalChildEnvironment({temporaryRoot:root,resourceRoot:root});
  const metadata={mode:"33261",uid:"1",gid:"1",device:"1",inode:"1",links:"1",bytes:"4",mtime_ns:"1",ctime_ns:"1"};
  const executable={present:true,sha256:digest("executable"),metadata,permission_identity:digest("permissions"),executable_identity_policy:"shared-posix-v1"};
  const role=(id,before,flags={})=>({id,classification:"execution",location_fingerprint:digest(id),before:clone(before),...flags});
  const baseline={contract:INPUT_CONTRACT,path_kind:"isolated-model-free-v1",binding:{},resources:[
    role("git-config",{present:true,sha256:digest("complete bytes"),metadata:{...metadata,mode:"33188"},permission_identity:digest("Git permissions"),
      git_projection:{policy:"isolated-current-branches-v1",applicable:true,effective_sha256:digest("effective"),scope_fingerprint:digest("scope")}},
      {gitTracking:{policy:"isolated-current-branches-v1",protected_branches:[digest("branch")]}}),
    ...["node-executable","git-executable","browser-executable"].map(id=>role(id,executable,{readOnlyExecutable:true})),
    role("node-headers",{contract:"augnes.local-canonical-node-headers.v1",present:true,location_fingerprint:digest("headers"),
      inventory_sha256:digest("header inventory"),content_sha256:digest("headers"),permission_sha256:digest("header permissions"),entries:2,bytes:10},{nodeHeaders:true}),
  ]};
  const working=path.join(root,"acquisition-proposal"),context={root:working,checkout:path.join(working,"checkout"),anchor:path.join(working,"anchor"),
    branch:"codex/reviewed-revision",file:path.join(working,"checkout/.augnes-local-verification/proof.json"),
    materialFinalReceipt:{inputs:baseline,attempt:{source_correction:{commission:{source_revision:"material-source-correction-v1"},inputs:{inventory_sha256:gitRevisionInventory(baseline)}}}}};
  const content=JSON.stringify(context),contextRef=ref("stock-corpus-file-000001.log",content);
  const corpus={contract:STOCK_VERIFIER_CORPUS,working_root:working,context_path:["context.json"],entries:[
    {path:"context.json",type:"file",mode:"33152",uid:String(process.getuid?.()),gid:String(process.getgid?.()),bytes:Buffer.byteLength(content),sha256:contextRef.sha256,record:contextRef},
  ]};
  const corpusRef=ref("stock-corpus.json",corpus);
  const runtime={contract:"augnes.local-canonical-runtime-inputs.v1",node:{location_fingerprint:digest(realpathSync(process.execPath)),observation:{present:true,sha256:digest("controlled Node")}},headers:{observation:{content_sha256:digest("controlled headers")}}};
  const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",head,tree,
    commission:{source_revision:"material-source-correction-v1",evidence_kind:GIT_CONFIG_STOCK_VERIFIER_REPAIR},
    inputs:{identity_sha256:digest(runtime),current:ref("runtime.json",runtime)}};
  const deps=["dependencies-root","dependencies-nested","dependencies-web-planning"].map(phase_id=>{const o=observePreparedDependencyInputs({repositoryRoot:root,phaseId:phase_id});return{phase_id,before:o,after:o};});
  const start=Date.now(),at=n=>new Date(start+n).toISOString(),command="node --import tsx "+driver;
  const result=exit=>({exit_code:exit,signal:null,spawn_error_code:null,timed_out:false,cancelled:false,exit_observed:true,streams_closed:true,
    cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit",duration_ms:1});
  const make=(label,catalogue,tested,exit)=>{
    const cases=[];
    for(const id of ["exact_raw","changed_content","changed_permission","changed_location","changed_scope","forged_inventory","malformed_observation","metadata_only"]){
      const input=clone(baseline),g=input.resources[0];
      if(id==="changed_content")g.before.sha256=digest("stock verifier different complete content");
      if(id==="changed_permission")g.before.permission_identity=digest("stock verifier different permission");
      if(id==="changed_location")g.location_fingerprint=digest("stock verifier different location");
      if(id==="changed_scope"){g.gitTracking.protected_branches=[digest("stock verifier different branch")];g.before.git_projection.scope_fingerprint=digest("stock verifier different scope");}
      if(id==="malformed_observation")delete g.before.metadata.links;
      if(id==="metadata_only")for(const key of ["inode","mtime_ns","ctime_ns"])g.before.metadata[key]="2";
      cases.push({id,expected:["exact_raw","metadata_only"].includes(id),actual:id==="exact_raw"||id==="metadata_only"&&exit===0,
        expected_inventory_sha256:gitRevisionInventory(baseline),current_inventory_sha256:id==="forged_inventory"?digest("stock verifier forged inventory claim"):id==="malformed_observation"?digest("stock verifier malformed inventory claim"):gitRevisionInventory(input),
        input_inventory:input,synthetic_service_observed_at:at(exit?-8500:-6500),...(id==="metadata_only"?{changed_fields:["inode","mtime_ns","ctime_ns"]}:{})});
    }
    const physical={contract:"augnes.local-canonical-browser-bundle.v1",present:true,location_fingerprint:digest(working),
      inventory_sha256:digest("controlled physical inventory"),content_sha256:digest([{path:"context.json",sha256:contextRef.sha256}]),
      permission_sha256:digest("controlled security"),entries:2,bytes:Buffer.byteLength(content)};
    const summary={contract:STOCK_VERIFIER_OBSERVATION,imports_complete:true,assertions_complete:exit===0,cleanup_complete:true,cleanup_errors:[],
      primary_error_stage:exit?"metadata_only_assertion":null,primary_error:exit?{name:"AssertionError",code:"ERR_ASSERTION",actual:false,expected:true}:null,
      baseline_inventory:baseline,cases,synthetic_authority:true,remote_requests:0,physical_accounting_unchanged:true,context_sha256:contextRef.sha256,
      corpus:{manifest_sha256:corpusRef.sha256,working_root:working,before:physical,after:physical,cleanup:{completed:true,failure_count:0,failures:[]}},
      actual_imports:catalogue.map(({path,byte_size,sha256})=>({path,byte_size,sha256}))};
    const state={kind:exit?"candidate-with-predecessor-modules":"exact-final-candidate",git_head:head,git_tree:tree,untracked_read_inputs:[]};
    return ref(label+".json",{attribution:MATERIAL_COMMON_STOCK_VERIFIER,driver_source_head:head,tested_source_head:tested,
      source_state:state,source_state_after:state,source_files:ref(label+"-source.json",catalogue),source_files_after:ref(label+"-end-source.json",catalogue),
      common_source_sha256:sources.common_sha256,modules:catalogue.filter(v=>STOCK_VERIFIER_MODULES.includes(v.path)).map(({path,sha256})=>({path,sha256})),
      file_sha256:digest(git(["show",head+":"+driver])),command,runtime_before:runtime,runtime_after:runtime,runtime_inputs_sha256:p.inputs.identity_sha256,
      node_version:process.versions.node,node_executable:realpathSync(process.execPath),environment_before:env,environment_after:env,environment:digest(env),prepared_dependencies:deps,result:result(exit),
      resource_lifecycle:{owner,initial_entries:[],absent_after_cleanup:true,created_at:at(exit?-9500:-7500),cleanup_finished_at:at(exit?-8500:-6500),cleanup:{root,completed:true,failure_count:0,failures:[]}},
      started_at:at(exit?-9000:-7000),finished_at:at(exit?-8000:-6000),stdout:ref(label+".log",STOCK_VERIFIER_RESULT_PREFIX+JSON.stringify(summary)+"\n")});
  };
  const before=make("before",sources.before,prior.head,1),after=make("after",sources.after,head,0),green=parse(after);
  const focused={implicated_paths:[...STOCK_VERIFIER_MODULES],source_files:[{path:driver}],input_remedy_resources:[],finished_at:at(-5000),
    regression:{attribution:MATERIAL_COMMON_STOCK_VERIFIER,path:driver,node_args:["--import","tsx"],args:[],before,after,corpus:corpusRef},
    commands:[{command,tested_source_head:head,record:after,stdout:green.stdout,result:green.result}]};
  const verify=(f=focused,q=p)=>verifyMaterialStockVerifier(q,prior,f,{git,parse,bytes,completedAt:at(-10000),repositoryRoot:root});
  assert.equal(verify(),head);
  const mutateWitness=(which,mutate,description=mutate.toString())=>{const f=clone(focused),w=parse(f.regression[which]);mutate(w);f.regression[which]=ref("bad-witness-"+(++refusals)+".json",w);
    if(which==="after")f.commands=[{...f.commands[0],record:f.regression.after,stdout:w.stdout,result:w.result}];assert.throws(()=>verify(f),undefined,"refusal "+refusals+": "+description);};
  const mutateSummary=(which,mutate)=>mutateWitness(which,w=>{const s=JSON.parse(bytes(w.stdout).toString().slice(STOCK_VERIFIER_RESULT_PREFIX.length));
    mutate(s);w.stdout=ref("bad-summary-"+refusals+".log",STOCK_VERIFIER_RESULT_PREFIX+JSON.stringify(s)+"\n");},"summary "+mutate.toString());
  for(const mutate of [w=>w.driver_source_head=prior.head,w=>w.modules.pop(),w=>w.source_state.kind="clean-predecessor",
    w=>w.source_files_after=ref("incomplete-source.json",[]),w=>w.prepared_dependencies.pop(),w=>w.runtime_after.node.observation.sha256=digest("runtime drift"),
    w=>w.environment_after.EXTRA="drift",w=>w.result.timed_out=true,w=>w.result.termination_reason="bounded_timeout",w=>w.result.cleanup_completed=false,
    w=>w.resource_lifecycle.initial_entries.push("old-state"),w=>w.resource_lifecycle.absent_after_cleanup=false])mutateWitness("before",mutate);
  for(const mutate of [s=>s.imports_complete=false,s=>s.actual_imports=s.actual_imports.filter(v=>v.path!==driver),
    s=>s.actual_imports=s.actual_imports.filter(v=>v.path!==STOCK_VERIFIER_MODULES[0]),s=>s.primary_error_stage="imports",s=>s.primary_error.code="ERR_MODULE_NOT_FOUND",
    s=>s.primary_error.actual=true,s=>s.primary_error.expected=false,s=>s.cases.shift(),s=>s.cases.reverse(),s=>s.cases[0].actual=false,
    s=>s.cases[1].actual=true,s=>s.cases.find(v=>v.id==="malformed_observation").input_inventory.resources[0].before.metadata.links="1",s=>s.cases.at(-1).actual=true,s=>s.cases.at(-1).changed_fields.pop(),
    s=>s.cases.at(-1).input_inventory.resources[0].before.sha256=digest("hidden content difference"),s=>s.cases.at(-1).current_inventory_sha256=digest("forged observed hash"),
    s=>s.baseline_inventory.resources[0].before.sha256=digest("unbound corpus baseline"),s=>s.corpus.manifest_sha256=digest("substituted corpus"),
    s=>s.corpus.after.inventory_sha256=digest("physical drift"),s=>s.corpus.cleanup.completed=false,s=>s.context_sha256=digest("wrong context"),
    s=>s.remote_requests=1,s=>s.synthetic_authority=false,s=>s.cleanup_errors.push({code:"cleanup"}),
    s=>s.cases[0].synthetic_service_observed_at=at(-20000)])mutateSummary("before",mutate);
  mutateSummary("after",s=>s.assertions_complete=false);mutateSummary("after",s=>s.cases.at(-1).actual=false);
  for(const mutate of [f=>f.regression.attribution="material-common-candidate-driver-v1",f=>f.regression.node_args=[],f=>f.regression.args=["before"],
    f=>f.implicated_paths=[STOCK_VERIFIER_MODULES[0]],f=>delete f.regression.corpus,
    f=>f.regression.corpus={...corpusRef,artifact:"corpus/manifest.json"}]){const f=clone(focused);mutate(f);assert.throws(()=>verify(f));refusals++;}
  const nested=clone(corpus);nested.entries[0].record.artifact="corpus/context.log";
  assert.throws(()=>verify({...clone(focused),regression:{...focused.regression,corpus:ref("nested-corpus.json",nested)}}),{code:"revision_artifact_invalid"});refusals++;
  assert.throws(()=>verify(focused,{...p,commission:{...p.commission,evidence_kind:"unsupported"}}));refusals++;
  const original=readFileSync(path.join(root,contextRef.artifact));writeFileSync(path.join(root,contextRef.artifact),"changed corpus");
  try{assert.throws(()=>verify());refusals++;}finally{writeFileSync(path.join(root,contextRef.artifact),original);}
  assert.equal(verify(),head);
  // Tiny real files exercise the same capture/restore/lifetime/cleanup helpers
  // used by a role. No stock inspection or comparison role is executed here.
  const corpusControls=[],inputRoot=path.join(root,"stock-verifier-input"),workingRoot=path.join(root,"acquisition-proposal");
  const tinySource=()=>{
    const resource=createCanonicalTestResourceDirectory(workingRoot);beginCanonicalTestResourceUse(resource);let settled=false;
    mkdirSync(path.join(workingRoot,"payload"),{mode:0o700});
    writeFileSync(path.join(workingRoot,"context.json"),JSON.stringify({root:workingRoot,synthetic:true}),{mode:0o600});
    writeFileSync(path.join(workingRoot,"payload/input.txt"),"tiny declared corpus\n",{mode:0o600});
    return {resource,cleanup(){if(settled)return;settleCanonicalTestResourceUse(resource,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
      assert(cleanupCanonicalTestResources([resource])[0].completed);settled=true;}};
  };
  const source=tinySource();let frozen;
  try{frozen=freezeStockVerifierCorpus({corpusRoot:workingRoot,artifactRoot:inputRoot});}finally{source.cleanup();}
  assert(!existsSync(workingRoot));assert.throws(()=>beginCanonicalTestResourceUse(source.resource),{code:"resource_owner_invalid"});
  assert(frozen.manifest.entries.every(row=>!/(?:^|\/)\.git\/(?:commondir|objects\/info\/(?:alternates|http-alternates))$/u.test(row.path)));
  const restored=restoreStockVerifierCorpus({inputRoot,canonicalRoot:root});
  assert.notEqual(restored.owner,source.resource,"a restored copy receives a distinct one-use capability");
  assert.equal(readFileSync(path.join(workingRoot,"payload/input.txt"),"utf8"),"tiny declared corpus\n");
  const finished=finishStockVerifierCorpus(restored);assert(finished.cleanup.completed);assert.deepEqual(finished.before,finished.after);
  assert(!existsSync(workingRoot));assert(existsSync(path.join(inputRoot,"stock-corpus.json")),"shared archive survives its consumer");
  assert.throws(()=>beginCanonicalTestResourceUse(restored.owner),{code:"resource_owner_invalid"});corpusControls.push("complete freeze/restore/finish with distinct one-use ownership and retained input");
  const manifestFile=path.join(inputRoot,"stock-corpus.json"),manifestBytes=readFileSync(manifestFile);
  const dataFile=path.join(inputRoot,frozen.manifest.entries.find(row=>row.path==="payload/input.txt").record.artifact),dataBytes=readFileSync(dataFile);
  writeFileSync(dataFile,"changed archive bytes\n");
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot,canonicalRoot:root}),{code:"revision_artifact_changed"});assert(!existsSync(workingRoot));}
  finally{writeFileSync(dataFile,dataBytes);}corpusControls.push("archive content/hash drift refuses before copy");
  const wrongManifest=clone(frozen.manifest);wrongManifest.entries.find(row=>row.path==="payload/input.txt").sha256=digest("unbound content");
  writeFileSync(manifestFile,JSON.stringify(wrongManifest));
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot,canonicalRoot:root}),{code:"stock_verifier_manifest_invalid"});assert(!existsSync(workingRoot));}
  finally{writeFileSync(manifestFile,manifestBytes);}corpusControls.push("manifest/content correspondence refuses");
  const changedCopy=restoreStockVerifierCorpus({inputRoot,canonicalRoot:root});writeFileSync(path.join(changedCopy.root,"payload/input.txt"),"changed working copy\n");
  assert.throws(()=>finishStockVerifierCorpus(changedCopy),error=>error.code==="stock_verifier_physical_corpus_changed"&&error.corpus.cleanup.completed);
  assert(!existsSync(workingRoot));corpusControls.push("working-copy drift refuses and still cleans");
  const lifetime=restoreStockVerifierCorpus({inputRoot,canonicalRoot:root});renameSync(dataFile,dataFile+".held");
  try{assert.throws(()=>finishStockVerifierCorpus(lifetime),error=>error.code==="ENOENT"&&error.corpus.cleanup.completed);assert(!existsSync(workingRoot));}
  finally{renameSync(dataFile+".held",dataFile);}corpusControls.push("archive must survive through final consumer settlement");
  const sibling=createCanonicalTestResourceRoot("ag-resource-test-");
  try{
    assert.throws(()=>restoreStockVerifierCorpus({inputRoot:sibling.root,canonicalRoot:root}),{code:"stock_verifier_input_containment"});
    assert.throws(()=>restoreStockVerifierCorpus({inputRoot:path.dirname(root),canonicalRoot:root}),{code:"stock_verifier_input_containment"});
  }finally{assert(cleanupCanonicalTestResources([sibling])[0].completed);}corpusControls.push("sibling/outside input roots refuse");
  const alias=path.join(root,"input-alias");symlinkSync(inputRoot,alias,"dir");
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot:alias,canonicalRoot:root}),{code:"stock_verifier_input_containment"});}
  finally{unlinkSync(alias);}corpusControls.push("symlink input-root alias refuses");
  const external=clone(frozen.manifest);external.working_root=path.join(path.dirname(root),"outside-corpus");writeFileSync(manifestFile,JSON.stringify(external));
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot,canonicalRoot:root}),{code:"stock_verifier_working_root_invalid"});assert(!existsSync(workingRoot));}
  finally{writeFileSync(manifestFile,manifestBytes);}corpusControls.push("outside working-root declaration refuses");
  const extra=path.join(root,"archive-hardlink");linkSync(dataFile,extra);
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot,canonicalRoot:root}),{code:"revision_artifact_unsafe"});}
  finally{unlinkSync(extra);}corpusControls.push("hardlinked private input refuses");
  chmodSync(dataFile,0o666);
  try{assert.throws(()=>restoreStockVerifierCorpus({inputRoot,canonicalRoot:root}),{code:"revision_artifact_unsafe"});}
  finally{chmodSync(dataFile,0o600);}corpusControls.push("unsafe private input permissions refuse");
  for(const kind of ["symlink","internal-hardlink","external-hardlink","git-alternates","git-commondir","git-file"]){
    const tiny=tinySource(),outside=path.join(root,"controlled-link-target");
    try{
      const payload=path.join(workingRoot,"payload/input.txt");
      if(kind==="symlink")symlinkSync("input.txt",path.join(workingRoot,"payload/link"));
      if(kind==="internal-hardlink")linkSync(payload,path.join(workingRoot,"payload/link"));
      if(kind==="external-hardlink"){writeFileSync(outside,"owned external link target\n",{mode:0o600});linkSync(outside,path.join(workingRoot,"payload/link"));}
      if(kind==="git-alternates"){mkdirSync(path.join(workingRoot,".git/objects/info"),{recursive:true,mode:0o700});writeFileSync(path.join(workingRoot,".git/objects/info/alternates"),"../../../../external-object-store\n",{mode:0o600});}
      if(kind==="git-commondir"){mkdirSync(path.join(workingRoot,".git"),{mode:0o700});writeFileSync(path.join(workingRoot,".git/commondir"),"../../external-git\n",{mode:0o600});}
      if(kind==="git-file")writeFileSync(path.join(workingRoot,".git"),"gitdir: ../../external-git\n",{mode:0o600});
      assert.throws(()=>freezeStockVerifierCorpus({corpusRoot:workingRoot,artifactRoot:path.join(root,"refused-"+kind)}),error=>
        ["stock_verifier_corpus_unsafe","browser_bundle_entry_unsafe"].includes(error.code));
    }finally{tiny.cleanup();if(existsSync(outside))unlinkSync(outside);}
    corpusControls.push(kind+" corpus refuses without consuming an external store");
  }
  const drifting=tinySource(),nativeRead=fs.readFileSync;let mutated=false;
  try{
    const payload=path.join(workingRoot,"payload/input.txt");
    fs.readFileSync=function(file,...args){const data=nativeRead(file,...args);if(file===payload&&!mutated){mutated=true;writeFileSync(payload,"controlled source drift\n");}return data;};
    syncBuiltinESMExports();
    assert.throws(()=>freezeStockVerifierCorpus({corpusRoot:workingRoot,artifactRoot:path.join(root,"refused-source-drift")}),{code:"stock_verifier_corpus_changed"});
    assert(mutated);
  }finally{fs.readFileSync=nativeRead;syncBuiltinESMExports();drifting.cleanup();}corpusControls.push("source drift between complete observations refuses");
  console.log(JSON.stringify({stock_verifier_protocol_controls:{accepted:2,refused:refusals,synthetic_only:true,actual_witness_pair:false,
    unknown_kind_refused:true,source_runtime_corpus_and_natural_result_bound:true,http_case_separate:true},stock_verifier_corpus_controls:corpusControls}));
}finally{
  settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
  assert(cleanupCanonicalTestResources([owner])[0].completed);
}
