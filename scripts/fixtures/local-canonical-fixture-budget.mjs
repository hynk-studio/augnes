import assert from "node:assert/strict";
import { requestBoundAllowanceControls } from "./local-canonical-request-bound-allowance.mjs";
import { requestBoundAuthorityControls } from "./local-canonical-request-bound-authority.mjs";
import { AUXILIARY_EXECUTION_BUDGETS } from "../local-canonical-closeout-budgets.mjs";
import { chmodSync, cpSync, linkSync, lstatSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { gitFixtureDeclaration } from "./local-canonical-git-observation.mjs";
import { verifyGitSourceRepair, verifyGitRevisionFailure, MATERIAL_SOURCE_CORRECTION, gitRevisionInventory, gitReviewTarget,
  DIRECT_GIT_INPUT_REVISION, DIRECT_GIT_INPUT_HISTORY_BOUNDARY } from "../local-canonical-git-observation.mjs";
import { REGISTERED_FIXTURE_BUDGET, FIXTURE_BUDGET_CLAIM, FIXTURE_BUDGET_COLLECTOR, FIXTURE_BUDGET_PATHS,
  REGISTERED_IDENTITY_BUDGET, IDENTITY_BUDGET_CLAIM, identityBudgetRegistration, identityBudgetSourcePartition, identityBudgetWorkloadSource, identityBudgetWorkloadEquivalence,
  verifyRegisteredIdentityBudget, readIdentityBudgetPositive, inspectCurrentIdentityBudgetInputs,
  COMPANION_RETIREMENT_ALLOWANCE_CASE, COMPANION_RETIREMENT_MS, COMPANION_RETIREMENT_INPUT_PATHS, isCompanionRetirementFixtureBudget,
  companionRetirementBudgetRegistration, companionRetirementBudgetSourcePartition, companionRetirementCompletionNames, companionRetirementCompletion,
  readCompanionRetirementBudgetPositive, inspectCurrentCompanionRetirementInputs, registeredFixtureBudget, fixtureBudgetFailurePhase, verifyRegisteredFixtureBudget,
  fixtureBudgetSourceDelta, fixtureBudgetEnvironment, inspectCurrentFixtureBudgetInputs, inspectCurrentIntegrationBudgetInputs,
  fixtureBudgetMeasurementStages, EXISTING_DEDICATED_FIXTURE_PAIR, SELECTIVE_FIXTURE_WORKLOAD, SELECTIVE_FIXTURE_WORKLOAD_CLAIM,
  SELECTIVE_FIXTURE_PATH, SELECTIVE_FIXTURE_COMMAND, SELECTIVE_FIXTURE_OWNER, SELECTIVE_COVERAGE_OBLIGATIONS,
  selectiveFixtureWorkloadRegistration, selectiveFixtureWorkloadIncident, selectiveFixtureWorkloadSourcePartition,
  verifySelectiveFixtureWorkload, verifySelectiveFixtureWorkloadReport } from "../local-canonical-fixture-budget-witness.mjs";
import { observePureContractSource, observePureContractLoader } from "../local-canonical-pure-contract-witness.mjs";
import { inspectGeneratedStockBrowserInputs } from "../local-canonical-stock-lifecycle-witness.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { validateSelectiveFixtureHistoricalAuthority, validateSelectiveFixtureBaselineAuthority, validateReviewedRevisionAuthorityRecords, REVIEWED_REVISION_PHASES,
  reviewedRevisionAuthorityObservation } from "../local-canonical-attempts.mjs";

function immutableFixtureGit(root) {
  // Reader negatives repeatedly inspect the same disposable immutable Git
  // objects. Cache only exact full-SHA queries inside this synthetic harness;
  // HEAD, writes, current files, dependencies and live observations stay fresh.
  const immutableGit=new Map(),sha=v=>/^[a-f0-9]{40}$/u.test(v??"");let immutableBytes=0;
  return args=>{
    const immutable=args[0]==="show"&&/^[a-f0-9]{40}:[^\0]+$/u.test(args[1]??"")||
      args[0]==="rev-parse"&&/^[a-f0-9]{40}\^\{tree\}$/u.test(args[1]??"")||
      args[0]==="ls-tree"&&args.some(sha)||
      args[0]==="diff"&&args.filter(sha).length===2||
      args[0]==="merge-base"&&args.filter(sha).length===2;
    const key=JSON.stringify(args);if(immutable&&immutableGit.has(key))return Buffer.from(immutableGit.get(key));
    const output=execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024});
    if(immutable&&immutableGit.size<256&&immutableBytes+output.length<=4*1024*1024) {
      immutableGit.set(key,Buffer.from(output));immutableBytes+=output.length;
    }
    return output;
  };
}

// Controlled reader data, explicitly not an actual historical incident or a
// qualification witness. Final real capture/preparation exercise the producer
// separately; these controls never recursively execute the registered parent.
export async function fixtureBudgetWitnessControls(parent,h,sourceRoot) {
  const root=path.join(parent,"fixture-budget-witness");mkdirSync(root);
  const write=(file,value)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),typeof value==="string"?value:JSON.stringify(value));};
  const git=immutableFixtureGit(root);
  git(["init","--quiet"]);
  for(const dir of ["app","components","lib","scripts","types","apps/augnes_apps/src","apps/augnes_apps/public"])write(dir+"/placeholder.ts","export {};\n");
  write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
  const version=JSON.parse(readFileSync(path.join(sourceRoot,"node_modules/tsx/package.json"))).version;
  write("package.json",{type:"module",dependencies:{tsx:version}});write("package-lock.json",{packages:{"node_modules/tsx":{version}}});write("tsconfig.json",{compilerOptions:{target:"ES2022"}});
  for(const name of ["browser-verification-owners.v1.json","local-canonical-change-owners.v1.json","canonical-research-tests.v1.json"])write("scripts/"+name,{});
  for(const name of ["tsx","esbuild","@esbuild"])cpSync(path.join(sourceRoot,"node_modules",name),path.join(root,"node_modules",name),{recursive:true});
  // Pin the supported legacy scenario independently of later live allowances.
  const finalSources=Object.fromEntries(Object.values(FIXTURE_BUDGET_PATHS).map(file=>[file,readFileSync(path.join(sourceRoot,file),"utf8")
    .replace(/reviewSerialAggregateFixtureMs: [0-9_]+/u,"reviewSerialAggregateFixtureMs: 20_000")
    .replace(/reviewSerialAggregateControlMs: [0-9_]+/u,"reviewSerialAggregateControlMs: 40_000")]));
  for(const [file,text]of Object.entries(finalSources))write(file,text
    .replace('name === "serial-aggregate" ? AUXILIARY_EXECUTION_BUDGETS.reviewSerialAggregateFixtureMs : ',"")
    .replace('group === "serial-aggregate" ? AUXILIARY_EXECUTION_BUDGETS.reviewSerialAggregateControlMs : ',"")
    .replace(/  reviewSerialAggregate(?:Fixture|Control)Ms: [0-9_]+,\n/gu,""));
  const workloadFile="scripts/fixtures/local-canonical-serial-aggregate.mjs",workloadSource=readFileSync(path.join(sourceRoot,workloadFile),"utf8");
  write(workloadFile,workloadSource);
  write(FIXTURE_BUDGET_COLLECTOR,readFileSync(path.join(sourceRoot,FIXTURE_BUDGET_COLLECTOR),"utf8"));
  write("scripts/local-canonical-receipt.mjs","export {};\n");
  const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
  const oldHead=commit("seed controlled registered allowance");
  for(const [file,text]of Object.entries(finalSources))write(file,text);
  const head=commit("adjust controlled registered allowance"),tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
  const completedAt=new Date(Date.now()-10000).toISOString(),inputs=observeCanonicalRuntimeInputs();
  const inventory=gitFixtureDeclaration({inputs,acceptedHead:head,branch:"codex/fixture-budget"});
  const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",head,tree,
    prior_receipt_fingerprint:digest("controlled incident"),commission:{source_revision:MATERIAL_SOURCE_CORRECTION,evidence_kind:REGISTERED_FIXTURE_BUDGET},
    inputs:{identity_sha256:digest(inputs),inventory_sha256:gitRevisionInventory(inventory)}};
  const prior={head:oldHead,tree:git(["rev-parse",oldHead+"^{tree}"]).toString().trim(),attempt_id:"controlled-budget-failure"};
  const normal={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,duration_ms:10,termination_reason:"natural_exit",
    exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0};
  const failed={...normal,control_id:"reviewed-revision-serial-aggregate",exit_code:null,signal:"SIGTERM",timed_out:true,duration_ms:15095,termination_reason:"bounded_timeout",last_progress:null};
  const lifecycle=(suite,label,timeout,duration,code=0,inner="")=>{
    const p=`[canonical:${suite}] `,l=JSON.stringify(label);
    return `${p}child_start label=${l} timeout_ms=${timeout}\n${p}child_spawn label=${l} pid=1 wait=process_exit\n${inner}`+
      `${p}child_exit label=${l} elapsed_ms=${duration-1} exit_code=${code} signal=null stdout_closed=true stderr_closed=true\n`+
      `${p}child_cleanup_start label=${l} elapsed_ms=${duration-1} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n`+
      `${p}child_cleanup_result label=${l} elapsed_ms=${duration} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n`+
      `${p}child_result label=${l} duration_ms=${duration} exit_code=${code} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
  };
  const log=lifecycle("authority","reviewed revision controls: serial-aggregate",30000,15700,1,`AUGNES_REVIEW_CHILD_RESULT ${JSON.stringify(failed)}\nassertReviewChildLifecycle\n`)+
    JSON.stringify({suite:"authority",resource_cleanup:[{completed:true,failure_count:0,failures:[]}]})+"\ncanonical child failed: suite=authority label=reviewed revision controls: serial-aggregate exit_code=1 signal=null\n";
  const relative=`.augnes-local-verification/logs/${prior.attempt_id}/authority.log`;write(relative,log);
  const original={outcome:{disposition:"product_failure"},phases:[{id:"authority",command:"npm run test:authority",status:"failure",exit_status:1,timed_out:false,
    cleanup:{termination_reason:"natural_exit"},log:{relative_path:relative,bytes:Buffer.byteLength(log),truncated:false}}]};
  const completion={disposition:"product_failure",cleanup_complete:true,infrastructure_code:null};
  const records=new Map(),ref=(name,value)=>{const b=Buffer.from(typeof value==="string"?value:JSON.stringify(value));records.set(name,b);return{artifact:name,sha256:digest(b)};};
  const bytes=r=>{const b=records.get(r.artifact);assert.equal(digest(b),r.sha256);return b;},parse=r=>JSON.parse(bytes(r));
  const prefix="CONTROL_STAGE ",marker=name=>'console.error("'+prefix+'"+JSON.stringify({stage:"'+name+'",at:performance.now()}));';
  const stageNames=fixtureBudgetMeasurementStages("serial-aggregate"),markers=stageNames.slice(1).map(marker);
  const instrumented=markers.join("\n")+"\n"+workloadSource;
  const oldLines=workloadSource.trimEnd().split("\n");
  const patch=`diff --git a/${workloadFile} b/${workloadFile}\n--- a/${workloadFile}\n+++ b/${workloadFile}\n@@ -1,${oldLines.length} +1,${oldLines.length+markers.length} @@\n`+markers.map(v=>"+"+v+"\n").join("")+oldLines.map(line=>" "+line+"\n").join("");
  const measuredOutput=stageNames.map((stage,i)=>prefix+JSON.stringify({stage,at:i/5})+"\n").join("");
  const measurement={record:ref("measurement.json",{result:normal,output_sha256:digest(measuredOutput),cleanup:[{completed:true,failure_count:0,failures:[]}],
    started_at:new Date(Date.now()-5000).toISOString(),finished_at:new Date(Date.now()-4000).toISOString(),source_instrumentation:[{path:workloadFile,original_sha256:digest(workloadSource),diagnostic_sha256:digest(instrumented)}]}),
    stdout:ref("measurement.log",measuredOutput),lifecycle:ref("measurement-lifecycle.log","termination_reason=natural_exit"),patch:ref("measurement-patch.log",patch),
    collector:ref("measurement-collector.log","scripts/fixtures/local-canonical-reviewed-revision.mjs --run-serial-aggregate-fixtures"),observer:ref("measurement-observer.log",'CONTROL_STAGE stage:"before_imports"'),prefix,source_head:oldHead};
  const delta=fixtureBudgetSourceDelta(git,oldHead,head,"serial-aggregate");
  const source=observePureContractSource(root),dependencies=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});
  const config=["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(readFileSync(path.join(root,file)))}));
  const captured=async role=>{
    const resource=path.join(parent,"already-settled-"+role),env=fixtureBudgetEnvironment(resource),loader=observePureContractLoader(root,env);
    const started_at=new Date().toISOString();
    const result=await h.run({suite:"fixture-budget-protocol",label:"controlled reader observation",command:process.execPath,args:["-e","process.stdout.write('controlled reader data\\n')"],
      cwd:root,env,timeoutMs:5000,stdout:{write(){}},stderr:{write(){}},log(){}});
    const findings=[...workloadSource.matchAll(/findings\.push\("([^"\n]+)"\)/gu)].map(v=>v[1]);
    const selected=JSON.stringify({serial_aggregate_controls:findings,synthetic_only:true,cleanup_owned_by_fixture:true})+"\n"+
      "AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify({...normal,control_id:"reviewed-revision-serial-aggregate"})+"\n";
    const output=role==="direct"?selected+JSON.stringify({status:"pass",checks:["reviewed revision controls: serial-aggregate"],cleanup_complete:true})+"\n":
      delta.groups.map(group=>lifecycle("authority","reviewed revision controls: "+group,group==="serial-aggregate"?40000:group==="serial-material"?AUXILIARY_EXECUTION_BUDGETS.reviewSerialMaterialControlMs:30000,10,0,group==="serial-aggregate"?selected:"")).join("")+
        JSON.stringify({suite:"authority",status:"pass",coverage:"focused_reviewed_revision_children_only",results:delta.groups.map(group=>({id:"local-canonical-reviewed-revision-"+group,...normal,status:0})),companion_service_maintenance:null},null,2)+"\n";
    const args=role==="direct"?["--import","tsx",FIXTURE_BUDGET_PATHS.wrapper,"--reviewed-revision-controls","serial-aggregate"]:[FIXTURE_BUDGET_PATHS.suite,"authority","--reviewed-revision-only"];
    return ref(role+".json",{contract:"augnes.registered-fixture-budget-witness.v1",basis:"actual-owned-development-invocation",role,command:["node",...args].join(" "),tested_source_head:head,tree,dirty:"",
      source_before:source,source_after:source,config,input_inventory_before:inventory,input_inventory_after:inventory,dependencies_before:dependencies,dependencies_after:dependencies,runtime_before:inputs,runtime_after:inputs,runtime_inputs_sha256:digest(inputs),
      node_version:process.versions.node,environment_before:env,environment_after:env,environment:digest(env),resource_root:resource,loader_before:loader,loader_after:loader,
      started_at,finished_at:new Date().toISOString(),result,owned_cleanup:[{root:resource,completed:true,failure_count:0,failures:[]}],
      stdout:ref(role+".log",output),lifecycle:ref(role+"-lifecycle.log",lifecycle("fixture-budget-capture",role+" registered fixture allowance",role==="direct"?40000:300000,result.duration_ms)),collector:ref(role+"-collector.log",readFileSync(path.join(root,FIXTURE_BUDGET_COLLECTOR),"utf8"))});
  };
  const after=await captured("direct"),registration=await captured("registered");
  const focused={failed_phase:"authority",input_remedy_resources:[],implicated_paths:Object.values(FIXTURE_BUDGET_PATHS),finished_at:new Date().toISOString(),
    regression:{kind:REGISTERED_FIXTURE_BUDGET,claim:FIXTURE_BUDGET_CLAIM,owner:{phase:"authority",suite:"authority",group:"serial-aggregate"},source_partition:delta,
      incident:{receipt:p.prior_receipt_fingerprint,log:ref("incident.log",log),log_identity:{relative_path:relative,bytes:Buffer.byteLength(log),sha256:digest(log)},cause:"UNKNOWN"},
      rationale:{measurement,execution_reserve_ms:5000,termination_grace_ms:13000,parent_remaining_ms:7000,judgment:"Controlled checker data tests the measured prospective allowance without claiming an original incident reproduction or product Browser execution.",
        contradictory_observations:[{record:ref("old-pass.json",{tested_source_head:oldHead,command:"node "+FIXTURE_BUDGET_PATHS.wrapper+" --reviewed-revision-controls serial-aggregate",stdout:ref("old-pass.log","controlled pass"),source_files:[{path:workloadFile,byte_size:Buffer.byteLength(workloadSource),sha256:digest(workloadSource)}],result:normal,finished_at:new Date().toISOString()}),limitations:"Controlled protocol data only; this is not an original incident or a new historical RED."}]},after,registration},
    commands:[after,registration].map(record=>{const w=parse(record);return{command:w.command,tested_source_head:head,record,stdout:w.stdout};})};
  const verify=(q=p,f=focused,r=original,c=completion,readGit=git)=>verifyGitSourceRepair(q,prior,f,{git:readGit,parse,bytes,completedAt,original:r,completion:c,repositoryRoot:root});
  // Preserve both the registration inventory and all-source read controls.
  // Every independent verification must read those immutable inputs afresh.
  const registrationReads=new Map([oldHead,head].flatMap(commit=>
    Object.values(FIXTURE_BUDGET_PATHS).map(file=>[commit+":"+file,0])));
  const sourceReads=new Map(),countedGit=args=>{
    if(args[0]==="show"){
      sourceReads.set(args[1],(sourceReads.get(args[1])??0)+1);
      if(registrationReads.has(args[1]))registrationReads.set(args[1],registrationReads.get(args[1])+1);
    }
    return git(args);
  };
  assert.equal(verify(p,focused,original,completion,countedGit),head);
  for(const count of registrationReads.values())assert.equal(count,1,"each exact registration blob is read once per verification");
  assert(sourceReads.size>0);assert([...sourceReads.values()].every(count=>count===1),"one blob read per source per verification");
  inspectCurrentFixtureBudgetInputs(root,parse(after));
  let negatives=0;
  for(const mutate of [f=>f.failed_phase="unit",f=>f.regression.owner.phase="unit",f=>f.regression.owner.group="serial-material",f=>f.regression.claim="cured",
    f=>f.regression.source_partition.after.inner++,f=>f.regression.rationale.termination_grace_ms=0,f=>f.regression.rationale.contradictory_observations=[],
    f=>f.regression.incident.receipt=digest("other"),f=>f.regression.incident.cause="known",f=>f.regression.kind="unknown",f=>delete f.regression.registration,f=>delete f.regression.rationale.measurement]) {
    const f=structuredClone(focused);mutate(f);assert.throws(()=>verify(p,f));negatives++;
  }
  for(const mutate of [w=>w.synthetic_only=true,w=>delete w.input_inventory_before,w=>delete w.lifecycle,w=>delete w.collector,w=>w.collector=ref("wrong-collector.log","changed"),w=>w.source_after.physical_matches=false,w=>w.source_before.inventory_sha256=digest("missing"),
    w=>w.config.pop(),w=>delete w.runtime_before,w=>w.runtime_after.node.observation.sha256=digest("runtime"),w=>w.environment_after.EXTRA="unbound",
    w=>w.loader_after.sha256=digest("loader"),w=>w.dependencies_after.content_sha256=digest("dependencies"),w=>w.result.cleanup_completed=false,
    w=>w.result.termination_reason="exited_with_owned_descendant_cleanup",w=>w.result.timed_out=true,w=>w.tested_source_head=oldHead,w=>w.command+=" --skip",
    w=>w.owned_cleanup=[],w=>w.stdout=ref("missing-tail.log","incomplete\n")]) {
    const f=structuredClone(focused),w=parse(after);mutate(w);f.regression.after=ref("negative-"+negatives+".json",w);
    f.commands[0]={...f.commands[0],record:f.regression.after,stdout:w.stdout};assert.throws(()=>verify(p,f));negatives++;
  }
  for(const mutate of [r=>r.outcome.disposition="unclassified_timeout",r=>r.phases[0].exit_status=0,r=>r.phases[0].timed_out=true,
    r=>r.phases[0].log.truncated=true,r=>r.phases[0].log.bytes++,r=>r.phases[0].command="other",r=>r.phases[0].cleanup.termination_reason="bounded_timeout"]) {
    const r=structuredClone(original);mutate(r);assert.throws(()=>verify(p,focused,r));negatives++;
  }
  for(const changes of [s=>s.replace('assert.equal(result.exit_code, 0, lastChildDiagnostic)','assert.equal(result.exit_code, 1, lastChildDiagnostic)'),s=>s.replace('AUXILIARY_EXECUTION_BUDGETS.reviewSerialMaterialFixtureMs',String(AUXILIARY_EXECUTION_BUDGETS.reviewSerialMaterialFixtureMs+1)),
    s=>s.replace('--reviewed-revision-controls','--substituted-controls')]) {
    const wrapperSource=finalSources[FIXTURE_BUDGET_PATHS.wrapper],changedWrapper=changes(wrapperSource);
    assert.notEqual(changedWrapper,wrapperSource,"controlled wrapper mutation must change source");
    write(FIXTURE_BUDGET_PATHS.wrapper,changedWrapper);const changed=commit("controlled incompatible workload");
    assert.throws(()=>fixtureBudgetSourceDelta(git,oldHead,changed,"serial-aggregate"));git(["reset","--hard",head]);negatives++;
  }
  assert.throws(()=>fixtureBudgetSourceDelta(git,head,head,"serial-aggregate"));negatives++;
  const bad=structuredClone(p);delete bad.commission.evidence_kind;assert.throws(()=>verify(bad));negatives++;
  write(relative,log+"changed");assert.throws(()=>verify());write(relative,log);negatives++;
  for(const mutate of [w=>w.lifecycle=ref("duplicate-lifecycle.log",bytes(w.lifecycle).toString()+bytes(w.lifecycle).toString()),
    w=>w.lifecycle=ref("forced-lifecycle.log",bytes(w.lifecycle).toString().replace("term_sent=false","term_sent=true")),
    w=>w.lifecycle=ref("conflicting-exit.log",bytes(w.lifecycle).toString().replace(/(child_exit[^\n]+)exit_code=0 signal=null/u,"$1exit_code=1 signal=SIGTERM")),
    w=>w.stdout=ref("conflicting-parent-exit.log",bytes(w.stdout).toString().replace(/(child_exit[^\n]+)exit_code=0 signal=null/u,"$1exit_code=1 signal=SIGTERM")),
    w=>w.stdout=ref("duplicate-parent.log",bytes(w.stdout).toString()+"[canonical:authority] child_start label=\"unexpected\" timeout_ms=30000\n"),
    w=>w.stdout=ref("missing-substantive-tail.log",bytes(w.stdout).toString().split("\n").filter(line=>!line.startsWith('{"serial_aggregate_controls":')).join("\n"))]) {
    const f=structuredClone(focused),w=parse(registration);mutate(w);f.regression.registration=ref("negative-"+negatives+".json",w);
    f.commands[1]={...f.commands[1],record:f.regression.registration,stdout:w.stdout};assert.throws(()=>verify(p,f));negatives++;
  }
  const budgetFile=FIXTURE_BUDGET_PATHS.budgets;
  write(budgetFile,finalSources[budgetFile].replace("ordinaryChildMs: 10_000","ordinaryChildMs: 11_000"));
  const changed=commit("controlled shared constant expansion");assert.throws(()=>fixtureBudgetSourceDelta(git,oldHead,changed,"serial-aggregate"));git(["reset","--hard",head]);negatives++;
  for(const mutate of [m=>m.source_head=head,m=>m.prefix="WRONG_STAGE ",m=>m.patch=ref("missing-patch.log","unrelated"),
    m=>m.collector=ref("wrong-measurement-collector.log","unrelated"),m=>m.observer=ref("wrong-measurement-observer.log","unrelated"),
    m=>m.stdout=ref("wrong-measurement-output.log","changed")]) {
    const f=structuredClone(focused);mutate(f.regression.rationale.measurement);assert.throws(()=>verify(p,f));negatives++;
  }
  for(const missing of ["before_imports","cleanup_complete","tail_export_complete"]) {
    const f=structuredClone(focused),m=f.regression.rationale.measurement,r=parse(m.record);
    const output=bytes(m.stdout).toString().split("\n").filter(line=>!line.includes('"stage":"'+missing+'"')).join("\n");
    m.stdout=ref("missing-stage-"+missing+".log",output);r.output_sha256=digest(output);m.record=ref("missing-stage-"+missing+".json",r);
    assert.throws(()=>verify(p,f));negatives++;
  }
  for(const mutate of [w=>w.command="node unrelated.mjs",w=>delete w.stdout,w=>w.source_files[0].sha256=digest("different original")]) {
    const f=structuredClone(focused),w=parse(f.regression.rationale.contradictory_observations[0].record);mutate(w);
    f.regression.rationale.contradictory_observations[0].record=ref("bad-old-pass-"+negatives+".json",w);assert.throws(()=>verify(p,f));negatives++;
  }
  for(const mutate of [v=>v.timed_out=false,v=>v.cleanup_completed=false,v=>v.duration_ms=10]) {
    const f=structuredClone(focused),r=structuredClone(original),v=structuredClone(failed);mutate(v);
    const altered=log.replace(JSON.stringify(failed),JSON.stringify(v));write(relative,altered);
    f.regression.incident.log=ref("bad-nested-"+negatives+".log",altered);f.regression.incident.log_identity={relative_path:relative,bytes:Buffer.byteLength(altered),sha256:digest(altered)};r.phases[0].log.bytes=Buffer.byteLength(altered);
    assert.throws(()=>verify(p,f,r));write(relative,log);negatives++;
  }
  for(const altered of [log.replace(/(child_exit[^\n]+)exit_code=1 signal=null/u,"$1exit_code=0 signal=SIGTERM"),log.replace("term_sent=false","term_sent=true")]) {
    const f=structuredClone(focused),r=structuredClone(original);write(relative,altered);
    f.regression.incident.log=ref("conflicting-incident-"+negatives+".log",altered);f.regression.incident.log_identity={relative_path:relative,bytes:Buffer.byteLength(altered),sha256:digest(altered)};r.phases[0].log.bytes=Buffer.byteLength(altered);
    assert.throws(()=>verify(p,f,r));write(relative,log);negatives++;
  }
  assert.equal(verify(p,focused,original,completion,countedGit),head);
  assert([...sourceReads.values()].every(count=>count===2),"independent verification must read each source afresh");
  for(const count of registrationReads.values())assert.equal(count,2,"independent verification must reread each registration");
  // A separate interpretation changes the existing dedicated pair, keeping
  // the legacy proof above and its source-partition shape unchanged.
  const form=EXISTING_DEDICATED_FIXTURE_PAIR,budget=FIXTURE_BUDGET_PATHS.budgets;
  write(budget,finalSources[budget].replace("reviewSerialAggregateFixtureMs: 20_000","reviewSerialAggregateFixtureMs: 25_000")
    .replace("reviewSerialAggregateControlMs: 40_000","reviewSerialAggregateControlMs: 45_000"));
  const pairHead=commit("controlled existing dedicated pair");
  const pairDelta=fixtureBudgetSourceDelta(git,head,pairHead,"serial-aggregate",form);
  assert.deepEqual(pairDelta.before,{inner:20000,outer:40000});
  assert.deepEqual(pairDelta.after,{inner:25000,outer:45000});
  assert.deepEqual(pairDelta.workload.paths,[budget]);
  // Replay the complete reader with this explicit form, not only its source
  // comparator. These remain controlled observations, never real incident data.
  const pairPrior={...prior,head,tree},pairTree=git(["rev-parse",pairHead+"^{tree}"]).toString().trim();
  const pairProof={...p,head:pairHead,tree:pairTree,inputs:{...p.inputs,inventory_sha256:gitRevisionInventory(
    gitFixtureDeclaration({inputs,acceptedHead:pairHead,branch:"codex/fixture-budget"}))}};
  const pairLog=log.replace("timeout_ms=30000","timeout_ms=40000").replace('"duration_ms":15095','"duration_ms":20095')
    .replaceAll("elapsed_ms=15699","elapsed_ms=20699").replaceAll("elapsed_ms=15700","elapsed_ms=20700")
    .replace("duration_ms=15700","duration_ms=20700");
  const pairOriginal=structuredClone(original);pairOriginal.phases[0].log.bytes=Buffer.byteLength(pairLog);write(relative,pairLog);
  const pairFocused=structuredClone(focused),pairSource=observePureContractSource(root);
  pairFocused.regression.source_form=form;pairFocused.regression.source_partition=pairDelta;
  pairFocused.regression.incident.log=ref("pair-incident.log",pairLog);
  pairFocused.regression.incident.log_identity={relative_path:relative,bytes:Buffer.byteLength(pairLog),sha256:digest(pairLog)};
  pairFocused.regression.rationale.measurement.source_head=head;
  const oldPass=parse(pairFocused.regression.rationale.contradictory_observations[0].record);oldPass.tested_source_head=head;
  pairFocused.regression.rationale.contradictory_observations[0].record=ref("pair-old-pass.json",oldPass);
  for(const [role,field]of [["direct","after"],["registered","registration"]]) {
    const w=parse(pairFocused.regression[field]);w.tested_source_head=pairHead;w.tree=pairTree;
    w.source_before=pairSource;w.source_after=pairSource;
    w.input_inventory_before=gitFixtureDeclaration({inputs,acceptedHead:pairHead,branch:"codex/fixture-budget"});
    w.input_inventory_after=w.input_inventory_before;
    w.lifecycle=ref("pair-"+role+"-lifecycle.log",bytes(w.lifecycle).toString().replace("timeout_ms=40000","timeout_ms=45000"));
    w.stdout=ref("pair-"+role+".log",bytes(w.stdout).toString().replace('label="reviewed revision controls: serial-aggregate" timeout_ms=40000',
      'label="reviewed revision controls: serial-aggregate" timeout_ms=45000'));
    pairFocused.regression[field]=ref("pair-"+role+".json",w);
  }
  pairFocused.commands=[pairFocused.regression.after,pairFocused.regression.registration].map(record=>{
    const w=parse(record);return{command:w.command,tested_source_head:pairHead,record,stdout:w.stdout};
  });
  assert.equal(verifyGitSourceRepair(pairProof,pairPrior,pairFocused,{git,parse,bytes,completedAt,original:pairOriginal,completion,repositoryRoot:root}),pairHead);
  write(relative,log);
  assert.throws(()=>fixtureBudgetSourceDelta(git,head,pairHead,"serial-aggregate"));negatives++;
  for(const selector of [null,"", "unknown"]) {
    assert.throws(()=>fixtureBudgetSourceDelta(git,head,pairHead,"serial-aggregate",selector));
    const f=structuredClone(focused);f.regression.source_form=selector;assert.throws(()=>verify(p,f));negatives+=2;
  }
  for(const kind of [undefined,"repository-typecheck-v1","registered-integration-child-budget-v1"]) {
    const f=structuredClone(focused);f.regression.kind=kind;f.regression.source_form=form;assert.throws(()=>verify(p,f));negatives++;
  }
  assert.throws(()=>fixtureBudgetSourceDelta(git,head,pairHead,"local-canonical-maintenance",form));negatives++;
  const pairSources={...finalSources,[budget]:readFileSync(path.join(root,budget),"utf8")};
  // Alter both old and new owners for consumer controls, so unchanged-byte
  // checks alone cannot catch an extra pre-existing consumer or object escape.
  for(const [file,alter]of [
    [budget,s=>s.replace("ordinaryChildMs: 10_000","ordinaryChildMs: 11_000")],
    [budget,s=>s.replace("ControlMs: 45_000","ControlMs: 40_000")],
    [budget,s=>s.replace("ordinaryChildMs: 10_000,","ordinaryChildMs: 10_000, extraMs: 1,")],
    [FIXTURE_BUDGET_PATHS.wrapper,s=>s.replace("assert.equal(result.exit_code, 0, lastChildDiagnostic)","assert.equal(result.exit_code, 1, lastChildDiagnostic)")],
    [workloadFile,s=>s+"\n// altered workload\n"],
  ]) {
    const original=file===workloadFile?workloadSource:pairSources[file],changed=alter(original);assert.notEqual(changed,original);
    write(file,changed);const altered=commit("controlled refused pair delta");
    assert.throws(()=>fixtureBudgetSourceDelta(git,head,altered,"serial-aggregate",form));negatives++;git(["reset","--hard",pairHead]);
  }
  for(const extra of [
    "console.log(AUXILIARY_EXECUTION_BUDGETS.reviewSerialAggregateFixtureMs);",
    "const alias = AUXILIARY_EXECUTION_BUDGETS;",
    "console.log(AUXILIARY_EXECUTION_BUDGETS['reviewSerialAggregateFixtureMs']);",
    "const { reviewSerialAggregateFixtureMs } = AUXILIARY_EXECUTION_BUDGETS;",
  ]) {
    git(["reset","--hard",head]);write(FIXTURE_BUDGET_PATHS.wrapper,finalSources[FIXTURE_BUDGET_PATHS.wrapper]+"\n"+extra+"\n");
    const before=commit("controlled pre-existing consumer");write(budget,pairSources[budget]);const after=commit("controlled enlarged consumer");
    assert.throws(()=>fixtureBudgetSourceDelta(git,before,after,"serial-aggregate",form));negatives++;git(["reset","--hard",pairHead]);
  }
  for(const extra of [
    "const extra = await import('../local-canonical-closeout-budgets.mjs');",
    "const extra = require('../local-canonical-closeout-budgets.mjs');",
    "export * from '../local-canonical-closeout-budgets.mjs';",
    "import * as extra from '../local-canonical-closeout-budgets.mjs';",
    "import { AUXILIARY_EXECUTION_BUDGETS as extra } from '../local-canonical-closeout-budgets.mjs';",
    "const extra = await import(process.argv[2]);",
  ]) {
    const file="scripts/local-canonical-receipt.mjs";
    write(file,extra+"\n");const altered=commit("controlled unsupported module consumer");
    assert.throws(()=>fixtureBudgetSourceDelta(git,head,altered,"serial-aggregate",form));negatives++;git(["reset","--hard",pairHead]);
  }
  git(["reset","--hard",head]);
  const generatedControls = generatedDeclarationControls(root, parent, write);
  const selectiveControls = await selectiveFixtureWorkloadControls(parent,h,sourceRoot);
  const identityControls = await identityBudgetWitnessControls(parent,h,sourceRoot);
  const requestBoundControls = requestBoundAllowanceControls(parent);
  const requestBoundAuthority = requestBoundAuthorityControls();
  rmSync(root,{recursive:true});
  return {contract:REGISTERED_FIXTURE_BUDGET,synthetic_only:true,deciding:false,negative_controls:negatives,source_read_operations:2,distinct_sources:sourceReads.size,
    existing_dedicated_pair:pairDelta,generated_stock_controls:generatedControls,selective_fixture_controls:selectiveControls,
    identity_fixture_controls:identityControls,request_bound_allowance:requestBoundControls,request_bound_authority:requestBoundAuthority,original_incident_reproduction:false,recursive_parent_execution:false};
}

// Actual reader controls over explicitly synthetic records and a tiny Git tree.
// Neither the Identity command nor its real credentials/runtime is executed.
export async function identityBudgetWitnessControls(parent,_h,sourceRoot) {
  const root=path.join(parent,"identity-budget-witness");mkdirSync(root);
  try {
    const write=(file,value)=>{const p=path.join(root,file);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,typeof value==="string"?value:JSON.stringify(value),{mode:0o600});};
    const git=immutableFixtureGit(root);
    const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
    git(["init","--quiet"]);write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
    for (const dir of ["app","components","lib","scripts","types","apps/augnes_apps/src","apps/augnes_apps/public"]) write(dir+"/placeholder.ts","export {};\n");
    const version=JSON.parse(readFileSync(path.join(sourceRoot,"node_modules/tsx/package.json"))).version;
    write("package.json",{type:"module",scripts:{"test:integration":"node scripts/run-canonical-test-suite.mjs integration"},dependencies:{tsx:version}});
    write("package-lock.json",{packages:{"node_modules/tsx":{version}}});write("tsconfig.json",{compilerOptions:{target:"ES2022"}});
    for (const name of ["browser-verification-owners.v1.json","local-canonical-change-owners.v1.json","canonical-research-tests.v1.json"]) write("scripts/"+name,{});
    for (const name of ["tsx","esbuild","@esbuild"]) cpSync(path.join(sourceRoot,"node_modules",name),path.join(root,"node_modules",name),{recursive:true});
    const test="scripts/test-codex-isolated-auth-projection.ts",owner="codex-isolated-auth-projection",label="controlled Identity contracts";
    write(test,'import { controlled_security } from "@/lib/vnext/native-host/codex-isolated-auth-projection";\nexport const controlled_identity_contracts=controlled_security;\n');
    write("scripts/fixtures/fake-codex-app-server.mjs",'import { controlled_helper } from "../bounded-file-signal.mjs";\nexport const controlled_fake=controlled_helper;\n');
    write("scripts/bounded-file-signal.mjs","export const controlled_helper=true;\n");
    write("lib/vnext/native-host/codex-isolated-auth-projection.ts",'import policy from "./controlled-identity-policy.json";\nimport { projectClientHref } from "../project-client-href";\nimport { createCodexAppServerAdapterV01 } from "./codex-app-server-adapter";\nexport const controlled_security=policy.enabled && typeof projectClientHref === "function" && typeof createCodexAppServerAdapterV01 === "function";\n');
    write("lib/vnext/native-host/controlled-identity-policy.json",{enabled:true});
    const navigationFile="lib/vnext/project-client-href.ts",adapterFile="lib/vnext/native-host/codex-app-server-adapter.ts";
    const navigation='export function projectClientHref(href, projectId) { return href; }\n'+
      'export function projectClientTargetQuery(params) { return params; }\nexport function projectClientEntryHref(pathname, params, projectId) { return pathname; }\n';
    const adapter='export function createCodexAppServerAdapterV01(options = {}) { if (options.scoped_task) {\n'+
      'if (options.candidate_canary || options.isolated_authenticated_execution || options.isolated_authenticated_external_execution_authorization || options.observe_isolated_auth)\n'+
      'throw new Error("codex_scoped_parallel_lane_refused"); options = Object.freeze({ ...options }); }\n'+
      'if (options.scoped_task) scopedAdaptersV01.set(adapter, options.scoped_task); return options; }\n';
    write(navigationFile,navigation);write(adapterFile,adapter);
    const executor='npmPhase("integration","integration",["run","test:integration"],4_200_000);\n';
    write("scripts/run-local-canonical-verification.mjs",executor+executor);
    write(FIXTURE_BUDGET_COLLECTOR,"export const controlled_collector=true;\n");
    write("README.md","controlled baseline\n");
    const suite='const rootNode=(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot,});\n'+
      'const suites={integration:[{id:"'+owner+'",group:"supporting-serial",requirements:["filesystem","process-owning","project-root","mutable-module-state"],label:'+JSON.stringify(label)+',...rootNode(\n"'+test+'",\n"--contracts",\n),timeoutMs:60_000}]};\n';
    write(FIXTURE_BUDGET_PATHS.suite,suite);const oldHead=commit("controlled original Identity allowance");
    write(FIXTURE_BUDGET_PATHS.suite,suite.replace("timeoutMs:60_000","timeoutMs:90_000"));
    const head=commit("controlled prospective Identity allowance"),tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
    const inputs=observeCanonicalRuntimeInputs(),inventory=gitFixtureDeclaration({inputs,acceptedHead:head,branch:"codex/identity-budget-controls"});
    const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",head,tree,base:oldHead,branch:"codex/identity-budget-controls",pull_request:999,
      prior_family_id:digest("controlled family"),prior_number:1,prior_attempt_id:"controlled-identity-failure",prior_receipt_fingerprint:digest("controlled receipt"),
      commission:{source_revision:MATERIAL_SOURCE_CORRECTION,evidence_kind:REGISTERED_IDENTITY_BUDGET,delegation:{id:81},root_receipt_fingerprint:digest("controlled receipt")},
      inputs:{identity_sha256:digest(inputs),inventory_sha256:gitRevisionInventory(inventory)}};
    const priorTree=git(["rev-parse",oldHead+"^{tree}"]).toString().trim();
    const prior={head:oldHead,tree:priorTree,branch:p.branch,family_id:p.prior_family_id,number:1,attempt_id:p.prior_attempt_id,
      source_correction:{schema:"augnes.local-canonical-source-correction.v2",kind:"source_revision"}};
    const normal={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,duration_ms:10,termination_reason:"natural_exit",exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0};
    const fixtureEpoch=Date.now(),at=offset=>new Date(fixtureEpoch+offset).toISOString(),completedAt=at(-10000),completion={disposition:"product_failure",cleanup_complete:true,infrastructure_code:null,finished_at:completedAt};
    const refs=new Map(),ref=(name,value)=>{const b=Buffer.from(typeof value==="string"?value:JSON.stringify(value));refs.set(name,b);return {artifact:name,sha256:digest(b)};};
    const bytes=r=>{const b=refs.get(r.artifact);assert(b);assert.equal(digest(b),r.sha256);return b;},parse=r=>JSON.parse(bytes(r));
    const prefix="[canonical:integration] ",quoted=JSON.stringify(label);
    const childLines=prefix+'child_start label='+quoted+' timeout_ms=60000\n'+prefix+'child_spawn label='+quoted+' pid=1 wait=process_exit\n'+
      prefix+'child_cleanup_start label='+quoted+' elapsed_ms=60001 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n'+
      prefix+'child_cleanup_result label='+quoted+' elapsed_ms=60100 reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n'+
      prefix+'child_result label='+quoted+' duration_ms=60100 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n';
    const inv={selected_count:1,started_count:1,settled_count:1,completed_count:1,failed_count:1,unstarted_count:0,children:[{group:"supporting-serial",label,started:true,settled:true,completed:true,outcome:"failed"}]};
    const log=childLines+prefix+"group_inventory "+JSON.stringify(inv)+"\n"+JSON.stringify({suite:"integration",resource_cleanup:[{completed:true,failure_count:0,failures:[]}]})+"\nchild_timed_out:supporting-serial:"+label+"\n";
    const relative=`.augnes-local-verification/logs/${prior.attempt_id}/integration.log`;write(relative,log);
    const original={outcome:{disposition:"product_failure"},cleanup:{completed:true},phases:[{id:"integration",command:"npm run test:integration",status:"failure",exit_status:1,timed_out:false,
      cleanup:{completed:true,exit_observed:true,streams_closed:true,remaining_owned_processes:0,termination_reason:"natural_exit"},log:{relative_path:relative,bytes:Buffer.byteLength(log),truncated:false}}]};
    const sourceHash=digest(readFileSync(path.join(root,test))),diagnostics=["full-contracts-diagnostic","selected-tail-diagnostic","representative-probe-diagnostic"];
    let fullSource;
    const observations=diagnostics.map((scope,index)=>{
      const source=ref("diagnostic-source-"+index+".txt","controlled, inert diagnostic source "+index),sourceSha=source.sha256;
      const manifest=index===0?{deciding:false,original:{path:test,sha256:sourceHash},instrumented:{sha256:sourceSha}}:
        index===1?{deciding:false,full_diagnostic_source_sha256:fullSource,tail_source_sha256:sourceSha}:
          {deciding:false,source_head:oldHead,source_sha256:sourceHash,diagnostic_sha256:sourceSha};
      if(index===0)fullSource=sourceSha;
      const child=index===0?{...normal,exit_code:null,signal:"SIGTERM",timed_out:true,duration_ms:60100,termination_reason:"bounded_timeout"}:{...normal};
      const record={deciding:false,started_at:at(-9000+index*2000),finished_at:at(-8000+index*2000),timeout_ms:index===0?60000:30000,child,
        cleanup:{settled:true,resources:[{completed:true,failure_count:0,failures:[]}],checkout_release:{released:true},capacity_release:{released:true}}};
      return {scope,manifest:ref("manifest-"+index+".json",manifest),record:ref("diagnostic-"+index+".json",record),stdout:ref("diagnostic-"+index+".log",JSON.stringify({nondeciding_result:record})+"\n"),source,
        limitations:"Controlled reader data only; no actual historical timing or workload claim. Full and selected scopes remain separate; cause is UNKNOWN."};
    });
    const summary={status:"passed",mode:"contracts",contract_suite:"codex_isolated_auth_contracts.v0.1",projection_version:"codex_isolated_authenticated_execution_projection.v0.1",
      attestation_version:"codex_isolated_auth_credential_attestation.v0.1",seal_version:"codex_isolated_auth_projection_seal.v0.1",
      projection_fingerprint:"sha256:"+digest("projection"),attestation_fingerprint:"sha256:"+digest("attestation"),seal_fingerprint:"sha256:"+digest("seal"),operational_availability:"available_exact",
      malicious_consumer_secret_access:false,unique_account_identity_non_null:true,isolated_tmpdir:true,exact_observed_security_policy:true,semantic_profile_version:"codex_isolated_auth_semantic_profile.rust-v0.152.1",
      semantic_profile_fingerprint:"sha256:"+digest("semantic"),config_tool_feature_schema_fingerprint:"sha256:"+digest("features"),config_policy_fingerprint:"sha256:"+digest("policy"),
      observed_security_policy_fingerprint:"sha256:"+digest("security"),user_agent_contract_fingerprint:"sha256:"+digest("agent"),user_agent_negative_shapes_refused:11,installed_cli_preflight:"unavailable",
      credential_free_fake_preflight:"compatible_exact",no_authorization_preflight_stop:"codex_isolated_auth_external_execution_authorization_required",unsupported_production_authority:"refused_before_turn",test_only_authorized_fake_turn:"completed_once",
      authenticated_child_binding_version:"codex_isolated_authenticated_child_binding.v0.1",arbitrary_child_wrapping_refused:true,spawn_binding_matrix_refused:true,real_keychain_accesses:0,real_provider_calls:0,successful_external_network_egress:0,cleanup_complete:true};
    const rows=["before_terminal","with_terminal","preflight"].map((kind,i)=>({runtime_policy_case:kind,status:"passed",settlement:i===0?"rejected_null_result":"failed_result",fixture_diagnostic_files:4,fixture_trace_appends:1,state_entries:0,lease_entries:0,network_attempts:0,remaining_owned_processes:0}));
    const output=[...rows,summary].map(v=>JSON.stringify(v)+"\n").join("");
    const resource=path.join(parent,"already-settled-identity"),env=fixtureBudgetEnvironment(resource),loader=observePureContractLoader(root,env),source=observePureContractSource(root),dependencies=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});
    const lp="[canonical:fixture-budget-capture] ",ll='"direct registered fixture allowance"';
    const lifecycle=lp+'child_start label='+ll+' timeout_ms=90000\n'+lp+'child_spawn label='+ll+' pid=1 wait=process_exit\n'+
      lp+'child_exit label='+ll+' elapsed_ms=9 exit_code=0 signal=null stdout_closed=true stderr_closed=true\n'+
      lp+'child_cleanup_start label='+ll+' elapsed_ms=9 reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n'+
      lp+'child_cleanup_result label='+ll+' elapsed_ms=10 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n'+
      lp+'child_result label='+ll+' duration_ms=10 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n';
    const record={contract:"augnes.registered-fixture-budget-witness.v1",basis:"actual-owned-development-invocation",role:"direct",bound_ms:90000,truncated:false,
      command:"node --import tsx "+test+" --contracts",tested_source_head:head,tree,dirty:"",source_before:source,source_after:source,
      config:["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(readFileSync(path.join(root,file)))})),
      dependencies_before:dependencies,dependencies_after:dependencies,runtime_before:inputs,runtime_after:inputs,runtime_inputs_sha256:digest(inputs),node_version:process.versions.node,
      input_inventory_before:inventory,input_inventory_after:inventory,environment_before:env,environment_after:env,environment:digest(env),resource_root:resource,loader_before:loader,loader_after:loader,
      started_at:at(-3000),finished_at:at(-2000),result:normal,owned_cleanup:[{root:resource,completed:true,failure_count:0,failures:[]}],ownership:{checkout:{released:true},capacity:{released:true}},
      stdout:ref("capture.log",output),lifecycle:ref("capture-lifecycle.log",lifecycle),collector:ref("collector.log",readFileSync(path.join(root,FIXTURE_BUDGET_COLLECTOR),"utf8"))};
    const after=ref("capture.json",record),focused={failed_phase:"integration",input_remedy_resources:[],finished_at:at(-1000),
      commands:[{command:record.command,tested_source_head:head,record:after,stdout:record.stdout}],regression:{kind:REGISTERED_IDENTITY_BUDGET,claim:IDENTITY_BUDGET_CLAIM,
        owner:{phase:"integration",suite:"integration",group:owner},incident:{receipt:p.prior_receipt_fingerprint,log:ref("incident.log",log),log_identity:{relative_path:relative,bytes:Buffer.byteLength(log),sha256:digest(log)},cause:"UNKNOWN"},
        source_partition:identityBudgetSourcePartition(git,oldHead,head,p.base),rationale:{execution_reserve_ms:30000,termination_grace_ms:13000,
          judgment:"Controlled prospective allowance judgment with fixed reserve and unchanged complete security workload; no historical cause or qualification is claimed.",observations},after}};
    const options={git,bytes,parse,completedAt,original,completion,repositoryRoot:root};
    const verify=(proof=p,f=focused,r=original,c=completion)=>verifyRegisteredIdentityBudget(proof,prior,f,{...options,original:r,completion:c});
    assert.equal(identityBudgetRegistration(git,oldHead).bound_ms,60000);assert.equal(verify(),head);
    inspectCurrentIdentityBudgetInputs(root,record);
    let negatives=0;
    const inheritance={route:"serial-aggregate-budget-v1",origin_family_id:digest("serial family"),origin_number:1,
      origin_attempt_id:"controlled-serial-origin",origin_receipt_fingerprint:digest("serial receipt"),envelope_sha256:digest("serial envelope")};
    const materialProof=structuredClone(p);Object.assign(materialProof.commission,{ordinal:1,maximum_invocations:1,inherited_serial:inheritance});
    const materialPrior={...prior,source_correction:{schema:p.schema,kind:p.kind,head:oldHead,tree:priorTree,
      commission:{source_revision:MATERIAL_SOURCE_CORRECTION,ordinal:1,maximum_invocations:1,inherited_serial:inheritance}}};
    const materialOriginal={...original,attempt:materialPrior},materialCompletion={...completion,attempt_id:prior.attempt_id,receipt_fingerprint:p.prior_receipt_fingerprint};
    const verifyMaterial=(q=materialProof,a=materialPrior,f=focused,r=materialOriginal,c=materialCompletion,at=completedAt)=>
      verifyRegisteredIdentityBudget(q,a,f,{...options,original:r,completion:c,completedAt:at});
    assert.equal(verifyMaterial(),head);
    for(const change of [q=>delete q.commission.inherited_serial,q=>q.commission.inherited_serial.envelope_sha256=digest("lost envelope"),
      q=>q.commission.input_acquisition="unadmitted",q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2]) {
      const q=structuredClone(materialProof);change(q);assert.throws(()=>verifyMaterial(q));negatives++;
    }
    for(const change of [a=>a.source_correction.commission.ordinal=2,a=>a.source_correction.commission.maximum_invocations=2,
      a=>a.source_correction.head=head,a=>a.source_correction.tree=tree,a=>a.family_id=digest("other family"),
      a=>a.source_correction.schema="augnes.local-canonical-source-correction.v2"]) {
      const a=structuredClone(materialPrior);change(a);assert.throws(()=>verifyMaterial(materialProof,a,focused,{...original,attempt:a}));negatives++;
    }
    // Two independent tiny source histories exercise honest old diagnostics:
    // the peer observations precede this task's later failed completion, while
    // the required own positive capture follows both. No workload is executed.
    git(["checkout","--detach",oldHead]);write(FIXTURE_BUDGET_COLLECTOR,"export const controlled_collector=true;\n// distinct peer source\n");
    const peerPackage=JSON.parse(readFileSync(path.join(root,"package.json"),"utf8"));
    Object.assign(peerPackage.scripts,{"augnes:connect:llama":"node scripts/prepare-llama-connection.mjs",
      "test:llama-connection-setup":"node scripts/test-prepare-llama-connection.mjs","test:llama-companion-stdio":"node scripts/test-llama-companion-stdio.mjs"});
    write("package.json",peerPackage);write(navigationFile,navigation.replace("return href;","return href + '#inactive';"));
    const peerBefore=commit("controlled distinct peer predecessor");
    write(FIXTURE_BUDGET_PATHS.suite,suite.replace("timeoutMs:60_000","timeoutMs:90_000"));const peerAfter=commit("controlled distinct peer allowance");
    git(["checkout","--detach",head]);
    let sharedSequence=0;
    const sharedMaterial=(before,after)=>{
      const suffix=sharedSequence++,a={...prior,head:before,tree:git(["rev-parse",before+"^{tree}"]).toString().trim(),attempt_id:"controlled-peer-failure-"+suffix};
      const receipt=finalizeReceipt({attempt:a,repository:{head_sha:a.head,tree_sha:a.tree,branch:a.branch},outcome:{disposition:"product_failure"},cleanup:{completed:true}});
      const fingerprint=receipt.integrity.content_fingerprint,c={...completion,attempt_id:a.attempt_id,receipt_fingerprint:fingerprint};
      const obs=structuredClone(observations),representative=parse(obs[2].manifest);representative.source_head=before;
      obs[2].manifest=ref("shared-representative-manifest-"+suffix+".json",representative);
      const f=structuredClone(focused);f.regression.rationale.observations=obs;f.regression.incident.receipt=fingerprint;
      f.regression.source_partition=identityBudgetSourcePartition(git,before,after,oldHead);
      const originals=Object.fromEntries(Object.entries({receipt,attempt:a,completion:c}).map(([role,value])=>[role,ref("shared-"+role+"-"+suffix+".json",value)]));
      const focusedRef=ref("shared-focused-"+suffix+".json",f),t=git(["rev-parse",after+"^{tree}"]).toString().trim();
      const proof={...p,head:after,tree:t,base:oldHead,accepted:{head:after,tree:t,base:oldHead},prior_attempt_id:a.attempt_id,
        prior_receipt_fingerprint:fingerprint,commission:{...p.commission,ordinal:1,maximum_invocations:1},originals,focused:focusedRef};
      return {...originals,proof:ref("shared-proof-"+suffix+".json",proof),focused:focusedRef};
    };
    const shared=sharedMaterial(peerBefore,peerAfter),sharedFocused=structuredClone(focused);
    sharedFocused.regression.rationale.observations=parse(shared.focused).regression.rationale.observations;
    sharedFocused.regression.rationale.shared_source=shared;
    const ownCompletedAt=at(-3500),ownCompletion={...materialCompletion,finished_at:ownCompletedAt};
    const verifyShared=(f=sharedFocused,q=materialProof,c=ownCompletion)=>verifyMaterial(q,materialPrior,f,materialOriginal,c,ownCompletedAt);
    assert.equal(verifyShared(),head);
    const equivalent=identityBudgetWorkloadEquivalence(git,oldHead,peerBefore);
    assert.deepEqual(equivalent.contextual_differences.map(v=>v.path),[navigationFile,"package.json"]);
    const closure=identityBudgetWorkloadSource(git,oldHead);
    for(const file of [test,"scripts/fixtures/fake-codex-app-server.mjs","scripts/bounded-file-signal.mjs",
      "lib/vnext/native-host/codex-isolated-auth-projection.ts","lib/vnext/native-host/controlled-identity-policy.json","package-lock.json","tsconfig.json"])
      assert(closure.some(v=>v.path===file),"complete Identity closure must bind "+file);
    for(const change of [f=>delete f.regression.rationale.shared_source.proof,f=>f.regression.rationale.shared_source.proof.sha256=digest("substituted proof"),
      f=>f.regression.rationale.shared_source.focused.sha256=digest("substituted focused"),
      f=>f.regression.rationale.observations[2].limitations+=" changed",f=>f.regression.rationale.observations[2].manifest=observations[2].manifest,
      f=>f.regression.rationale.shared_source.receipt=ref("substituted-shared-receipt.json",{altered:true})]) {
      const f=structuredClone(sharedFocused);change(f);assert.throws(()=>verifyShared(f));negatives++;
    }
    for(const [role,change]of [["proof",v=>v.head=head],["proof",v=>v.tree=priorTree],["proof",v=>v.prior_attempt_id=prior.attempt_id],
      ["proof",v=>v.originals.receipt.sha256=digest("other original")],["attempt",v=>v.head=oldHead],
      ["completion",v=>v.finished_at=at(-1000)],["focused",v=>v.regression.rationale.observations[0].limitations+=" changed"]]) {
      const f=structuredClone(sharedFocused),s=f.regression.rationale.shared_source,value=parse(s[role]);change(value);
      s[role]=ref("shared-refusal-"+negatives+".json",value);assert.throws(()=>verifyShared(f));negatives++;
    }
    const noShared=structuredClone(sharedFocused);delete noShared.regression.rationale.shared_source;
    assert.throws(()=>verifyShared(noShared),"old peer observations cannot become new own observations");negatives++;
    const late=structuredClone(sharedFocused),lateCapture=parse(after);lateCapture.started_at=at(-4000);
    late.regression.after=ref("early-own-capture.json",lateCapture);late.commands[0].record=late.regression.after;
    assert.throws(()=>verifyShared(late),"own capture must follow own predecessor completion");negatives++;
    for(const [file,changed]of [["scripts/bounded-file-signal.mjs","export const controlled_helper=false;\n"],
      ["lib/vnext/native-host/controlled-identity-policy.json",{enabled:false}],[test,"export const shortened_identity=true;\n"]]) {
      git(["checkout","--detach",peerBefore]);write(file,changed);const incompatibleBefore=commit("controlled different shared workload");
      write(FIXTURE_BUDGET_PATHS.suite,suite.replace("timeoutMs:60_000","timeoutMs:90_000"));const incompatibleAfter=commit("controlled incompatible peer allowance");
      const f=structuredClone(sharedFocused),s=sharedMaterial(incompatibleBefore,incompatibleAfter);
      f.regression.rationale.shared_source=s;f.regression.rationale.observations=parse(s.focused).regression.rationale.observations;
      assert.throws(()=>verifyShared(f),"shared source closure must refuse "+file);negatives++;
      git(["checkout","--detach",head]);
    }
    for(const change of [m=>m.scripts["augnes:connect:llama"]="node scripts/unreviewed.mjs",m=>m.scripts["test:integration"]="node skipped.mjs",
      m=>m.scripts["pretest:integration"]="node lifecycle.mjs",m=>m.scripts["test:other"]="node unrelated-extra.mjs",m=>m.type="commonjs"]) {
      git(["checkout","--detach",peerBefore]);const m=structuredClone(peerPackage);change(m);write("package.json",m);
      const incompatible=commit("controlled unrelated script near miss");assert.throws(()=>identityBudgetWorkloadEquivalence(git,oldHead,incompatible));negatives++;
    }
    for(const changed of [navigation+"console.log('impure initialization');\n",'import "./controlled-navigation-effect.mjs";\n'+navigation,
      navigation.replace("return params;","return null;")]) {
      git(["checkout","--detach",peerBefore]);write(navigationFile,changed);write("lib/vnext/controlled-navigation-effect.mjs","export const effect=true;\n");
      const incompatible=commit("controlled impure or changed navigation boundary");
      assert.throws(()=>identityBudgetWorkloadEquivalence(git,oldHead,incompatible));negatives++;
    }
    for(const [file,changed]of [[test,readFileSync(path.join(root,test),"utf8")+'\nconst unavailableIdentityOption={scoped_task:{}};\n'],
      [adapterFile,adapter.replace(" || options.observe_isolated_auth","")],
      [adapterFile,adapter.replace("if (options.scoped_task) scopedAdaptersV01.set","if (options.scoped_task) {} if (options.scoped_task) scopedAdaptersV01.set")]]) {
      git(["checkout","--detach",oldHead]);write(file,changed);const boundaryBefore=commit("controlled changed inactive-lane premise");
      write(navigationFile,navigation.replace("return href;","return href + '#inactive';"));const boundaryAfter=commit("controlled changed navigation body");
      assert.throws(()=>identityBudgetWorkloadEquivalence(git,boundaryBefore,boundaryAfter));negatives++;
    }
    git(["checkout","--detach",head]);
    for(const change of [f=>f.failed_phase="authority",f=>f.regression.kind=REGISTERED_FIXTURE_BUDGET,f=>f.regression.claim="historical cure",f=>f.regression.owner.group="external-response",
      f=>f.regression.incident.cause="known",f=>f.regression.incident.receipt=digest("other"),f=>f.regression.source_partition.after.bound_ms=120000,
      f=>f.regression.rationale.execution_reserve_ms=60000,f=>f.regression.rationale.termination_grace_ms=0,f=>f.regression.rationale.observations.pop()]) {
      const f=structuredClone(focused);change(f);assert.throws(()=>verify(p,f));negatives++;
    }
    for(const change of [w=>w.bound_ms=120000,w=>w.command=w.command.replace("--contracts","--rollback-lifecycle"),w=>w.command+=" --skip",w=>w.synthetic_only=true,w=>w.truncated=true,
      w=>w.result.timed_out=true,w=>w.result.termination_reason="exited_with_owned_descendant_cleanup",w=>w.ownership.checkout.released=false,w=>delete w.ownership.capacity,
      w=>w.owned_cleanup=[],w=>w.runtime_after.node.observation.sha256=digest("changed runtime"),w=>w.loader_after.sha256=digest("changed loader"),w=>w.environment_after.UNBOUND="1",
      w=>w.source_after.physical_matches=false,w=>w.config.pop(),w=>w.collector=ref("bad-collector.log","changed"),w=>w.lifecycle=ref("forced-lifecycle.log",lifecycle.replace("term_sent=false","term_sent=true")),
      w=>w.stdout=ref("missing-case.log",[...rows.slice(1),summary].map(v=>JSON.stringify(v)+"\n").join("")),w=>w.stdout=ref("bad-egress.log",[...rows,{...summary,successful_external_network_egress:1}].map(v=>JSON.stringify(v)+"\n").join("")),
      w=>w.stdout=ref("missing-summary.log",rows.map(v=>JSON.stringify(v)+"\n").join(""))]) {
      const w=parse(after),f=structuredClone(focused);change(w);f.regression.after=ref("bad-capture-"+negatives+".json",w);f.commands[0].record=f.regression.after;f.commands[0].stdout=w.stdout;
      assert.throws(()=>verify(p,f),"Identity refusal control "+negatives+": "+change.toString());negatives++;
    }
    for(const change of [r=>r.outcome.disposition="unclassified_timeout",r=>r.phases[0].timed_out=true,r=>r.phases[0].exit_status=0,r=>r.phases[0].log.truncated=true,r=>r.cleanup.completed=false]) {
      const r=structuredClone(original);change(r);assert.throws(()=>verify(p,focused,r));negatives++;
    }
    for(const altered of [log.replace("timeout_ms=60000","timeout_ms=90000"),
      log.replace('"outcome":"failed"','"outcome":"passed"'),
      log+prefix+'child_start label="unadmitted after failure" timeout_ms=60000\n',
      log.replace("remaining_owned_processes=0 termination_reason=bounded_timeout","remaining_owned_processes=1 termination_reason=bounded_timeout")]) {
      const f=structuredClone(focused),r=structuredClone(original);write(relative,altered);
      f.regression.incident.log=ref("invalid-failure-prefix-"+negatives+".log",altered);
      f.regression.incident.log_identity={relative_path:relative,bytes:Buffer.byteLength(altered),sha256:digest(altered)};
      r.phases[0].log.bytes=Buffer.byteLength(altered);
      assert.throws(()=>verify(p,f,r),"Identity malformed retained failure must refuse");negatives++;
    }
    write(relative,log);
    for(const [field,value]of [["projection_version",null],["attestation_version","unrecognized"],["seal_version",{}],["semantic_profile_version","unrecognized"],
      ["authenticated_child_binding_version",null],["installed_cli_preflight","compatible_exact"],["credential_free_fake_preflight","failed"],
      ["no_authorization_preflight_stop","allowed_without_authority"],["unsupported_production_authority","permitted"],["test_only_authorized_fake_turn","NOT_RUN"],
      ["user_agent_negative_shapes_refused",1]]) {
      const w=parse(after),f=structuredClone(focused);
      w.stdout=ref("wrong-summary-"+field+".log",[...rows,{...summary,[field]:value}].map(v=>JSON.stringify(v)+"\n").join(""));
      f.regression.after=ref("wrong-summary-"+field+".json",w);f.commands[0].record=f.regression.after;f.commands[0].stdout=w.stdout;
      assert.throws(()=>verify(p,f),"Identity summary must refuse substituted "+field);negatives++;
    }
    const badProof=structuredClone(p);badProof.commission.evidence_kind=REGISTERED_FIXTURE_BUDGET;assert.throws(()=>verify(badProof));negatives++;
    for(const [file,value,registrationOnly]of [[test,"changed assertions\n"],["scripts/fixtures/fake-codex-app-server.mjs","changed fake\n"],["lib/vnext/native-host/codex-isolated-auth-projection.ts","changed security\n"],
      ["scripts/run-local-canonical-verification.mjs",(executor+executor).replaceAll("4_200_000","4_300_000")],[FIXTURE_BUDGET_PATHS.suite,suite.replace("timeoutMs:60_000","timeoutMs:120_000")],
      [FIXTURE_BUDGET_PATHS.suite,suite.replace('"--contracts",','"--contracts","--extra",'),true],
      [FIXTURE_BUDGET_PATHS.suite,suite.replace('"--contracts",','"--rollback-lifecycle",'),true],
      [FIXTURE_BUDGET_PATHS.suite,suite.replace('"--contracts",','...["--contracts"],'),true]]) {
      write(file,value);const changed=commit("controlled incompatible Identity source");
      assert.throws(registrationOnly?()=>identityBudgetRegistration(git,changed):()=>identityBudgetSourcePartition(git,oldHead,changed,p.base));
      git(["reset","--hard",head]);negatives++;
    }
    write("README.md","unadopted prose\n");const unadopted=commit("controlled unadopted prose");assert.throws(()=>identityBudgetSourcePartition(git,oldHead,unadopted));git(["reset","--hard",head]);negatives++;
    git(["checkout","--detach",oldHead]);write("README.md","adopted prose\n");write("apps/web_planning/README.md","adopted app README\n");const base=commit("controlled adopted prose");
    git(["checkout","--detach",head]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","merge","--no-edit",base]);const merged=git(["rev-parse","HEAD"]).toString().trim();
    assert.equal(identityBudgetSourcePartition(git,oldHead,merged,base).adopted_base,base);
    assert(identityBudgetSourcePartition(git,oldHead,merged,base).adopted_prose.paths.includes("apps/web_planning/README.md"));
    assert.throws(()=>identityBudgetSourcePartition(git,oldHead,merged));negatives++;
    write("README.md","adopted prose plus unreviewed change\n");const wrong=commit("controlled altered adopted prose");assert.throws(()=>identityBudgetSourcePartition(git,oldHead,wrong,base));negatives++;
    git(["checkout","--detach",base]);write("apps/web_planning/README-copy.md","unregistered app README near miss\n");const nearBase=commit("controlled app README near miss");
    git(["checkout","--detach",head]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","merge","--no-edit",nearBase]);
    const nearCandidate=git(["rev-parse","HEAD"]).toString().trim();assert.throws(()=>identityBudgetSourcePartition(git,oldHead,nearCandidate,nearBase));negatives++;
    git(["reset","--hard",head]);
    const {identityBudgetAuthorityBindings,identityBudgetAuthorityScope,identityBudgetDelegation,delegatesMaterialSourceCommission,IDENTITY_BUDGET_GRANT,MATERIAL_HISTORY_BOUNDARY,INTEGRATION_BUDGET_LIMIT}=await import("../local-canonical-git-observation.mjs");
    const authorityProof={...p,accepted:{review:{id:82}}},bindings=identityBudgetAuthorityBindings(authorityProof),delegation=identityBudgetDelegation(authorityProof);
    const review={body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",bindings,MATERIAL_HISTORY_BOUNDARY].join("\n\n")};
    const grant={body:[IDENTITY_BUDGET_GRANT,bindings,"Accepted review: https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-82",MATERIAL_HISTORY_BOUNDARY,INTEGRATION_BUDGET_LIMIT].join("\n\n")};
    assert(delegatesMaterialSourceCommission(delegation,authorityProof));assert(identityBudgetAuthorityScope(authorityProof,review,grant));
    for(const substitute of [body=>body.replace("90000","120000"),body=>body.replace("4200000","4300000"),body=>body.replace(p.prior_receipt_fingerprint,digest("other predecessor")),body=>body.replace(REGISTERED_IDENTITY_BUDGET,REGISTERED_FIXTURE_BUDGET)]) {
      const body=substitute(bindings);assert.notEqual(body,bindings);assert.equal(identityBudgetAuthorityScope(authorityProof,{body:review.body.replace(bindings,body)},grant),false);negatives++;
    }
    assert.equal(identityBudgetAuthorityScope(authorityProof,review,{body:grant.body.replace(IDENTITY_BUDGET_GRANT,"Authorize maintenance")}),false);negatives++;
    assert.equal(delegatesMaterialSourceCommission("Example only\n\n"+delegation,authorityProof),false);negatives++;
    assert.equal(readIdentityBudgetPositive(after,p,options).record.bound_ms,90000);assert.equal(verify(),head);
    return {contract:REGISTERED_IDENTITY_BUDGET,synthetic_only:true,negative_controls:negatives,
      ordinary_and_material_predecessors:true,immutable_shared_source_reuse:true,closed_workload_files:closure.map(v=>v.path),
      registered_identity_executed:false,original_incident_reproduction:false};
  } finally {rmSync(root,{recursive:true,force:true});}
}

// Exact reader controls over a disposable source tree. No retirement workload,
// real Companion service, listener or historical source is executed here.
export async function companionRetirementBudgetWitnessControls(parent,_h,sourceRoot) {
  const root=path.join(parent,"companion-retirement-budget-witness");mkdirSync(root);
  try {
    const write=(file,value)=>{const target=path.join(root,file);mkdirSync(path.dirname(target),{recursive:true});
      writeFileSync(target,typeof value==="string"?value:JSON.stringify(value),{mode:0o600});};
    const git=immutableFixtureGit(root),commit=message=>{git(["add","."]);
      git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
    git(["init","--quiet"]);write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
    for(const dir of ["app","components","lib","scripts","types","apps/augnes_apps/src","apps/augnes_apps/public"])write(dir+"/placeholder.ts","export {};\n");
    const test="scripts/test-companion-ownership-retirement.mjs",owner="companion-ownership-retirement",
      label="Companion lost-ownership retirement and reconciliation regressions",command="node --import tsx "+test;
    const version=JSON.parse(readFileSync(path.join(sourceRoot,"node_modules/tsx/package.json"),"utf8")).version;
    write("package.json",{type:"module",scripts:{test:"node scripts/run-canonical-test-suite.mjs unit"},dependencies:{tsx:version}});
    write("package-lock.json",{packages:{"node_modules/tsx":{version}}});write("tsconfig.json",{compilerOptions:{target:"ES2022"}});
    for(const name of ["browser-verification-owners.v1.json","local-canonical-change-owners.v1.json","canonical-research-tests.v1.json"])write("scripts/"+name,{});
    for(const name of ["tsx","esbuild","@esbuild"])cpSync(path.join(sourceRoot,"node_modules",name),path.join(root,"node_modules",name),{recursive:true});
    for(const file of COMPANION_RETIREMENT_INPUT_PATHS.filter(v=>![test,"package.json","package-lock.json","scripts/canonical-child-runner.mjs"].includes(v)))
      write(file,"// Inert synthetic source; never imported or executed.\n");
    const scenarioCases=[
      {name:"lost-state-retirement-and-replay",effects:1},{name:"lost-state-later-attempt-exit-diagnostic",effects:1},
      {name:"settled-history-after-device-renumbering",effects:1},{name:"stale-decision-and-maintenance-refusal",effects:0},
      {name:"foreign-runtime-and-configuration-refusal",effects:0},{name:"unknown-bootout-reconciled-before-resume",effects:1},
      {name:"unavailable-and-reused-process-witness-refusal",effects:0},{name:"interrupted-runtime-retirement",effects:1},
      {name:"changed-generation-at-effect-boundary",effects:0},
    ],terminal="PASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue";
    const inertFixture="// Explicit synthetic reader grammar; never executed.\nconst sources="+JSON.stringify(COMPANION_RETIREMENT_INPUT_PATHS.slice(1,6))+";\n"+
      scenarioCases.map(v=>"await run("+JSON.stringify(v.name)+",async f=>{assert.equal(f.effects(),"+v.effects+");});\n").join("")+
      'for(const fault of ["ui","bridge","manager-conflict"]) {}\nconsole.log('+JSON.stringify(terminal)+");\n";
    write(test,inertFixture);
    write("scripts/canonical-child-runner.mjs","export const DEFAULT_CANONICAL_TERM_GRACE_MS=8_000;\nexport const DEFAULT_CANONICAL_KILL_GRACE_MS=5_000;\n");
    const executor='npmPhase("unit","Canonical unit suite",["test"],3_600_000);\n';write("scripts/run-local-canonical-verification.mjs",executor+executor);
    write(FIXTURE_BUDGET_COLLECTOR,"export const controlled_retirement_collector=true;\n");
    const suite='const rootNode=(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot,});\n'+
      'const suites={unit:[{label:"unchanged unit owner",...rootNode("scripts/unrelated.mjs"),timeoutMs:10_000},...(process.platform === "darwin" ? [{label:'+JSON.stringify(label)+
      ',...rootNode("'+test+'"),timeoutMs:60_000,requireNaturalExit:true}] : [])],authority:[]};\n';
    const controlStep='{label:"Companion ownership-retirement allowance evidence controls",...rootNode("scripts/fixtures/local-canonical-reviewed-revision.mjs","--run-companion-retirement-budget-fixtures"),timeoutMs:30_000,requireNaturalExit:true}';
    const candidateSuite=suite.replace("timeoutMs:60_000","timeoutMs:75_000").replace("authority:[]","authority:["+controlStep+"]");
    write("scripts/unrelated.mjs","export const untouched=true;\n");write(FIXTURE_BUDGET_PATHS.suite,suite);
    const baselineHead=commit("controlled historical retirement source"),baselineTree=git(["rev-parse",baselineHead+"^{tree}"]).toString().trim();
    write(FIXTURE_BUDGET_COLLECTOR,"export const controlled_retirement_collector=true;\n// separate retained predecessor\n");
    const priorHead=commit("controlled immediate retirement predecessor"),priorTree=git(["rev-parse",priorHead+"^{tree}"]).toString().trim();
    write(FIXTURE_BUDGET_PATHS.suite,candidateSuite);
    const head=commit("controlled finite retirement allowance"),tree=git(["rev-parse",head+"^{tree}"]).toString().trim();
    const fixtureEpoch=Date.now(),at=offset=>new Date(fixtureEpoch+offset).toISOString(),branch="codex/retirement-budget-controls";
    const refs=new Map(),ref=(name,value)=>{const raw=Buffer.from(typeof value==="string"?value:JSON.stringify(value));refs.set(name,raw);return {artifact:name,sha256:digest(raw)};};
    const bytes=r=>{const raw=refs.get(r.artifact);assert(raw);assert.equal(digest(raw),r.sha256);return raw;},parse=r=>JSON.parse(bytes(r));
    const names=companionRetirementCompletionNames(git,head),output=(complete,elapsed)=>names.scenarios.flatMap(v=>[
      {scenario:v.name,stage:"scenario_start",elapsed_ms:0},{scenario:v.name,stage:"fixture_ready",elapsed_ms:0},
      {scenario:v.name,stage:"action_pass",elapsed_ms:Math.min(1,elapsed)},
      {scenario:v.name,pass:true,effects:v.effects,cleanup_complete:true,elapsed_ms:elapsed},
    ]).concat((complete?names.adverse:names.adverse.slice(0,2)).map(adverse=>({adverse,pass:true,cleanup_complete:true})))
      .map(v=>JSON.stringify(v)+"\n").join("")+(complete?names.terminal+"\n":"");
    const lifecycle=(suiteName,childLabel,bound,duration,body="",failed=false)=>{
      const prefix=`[canonical:${suiteName}] `,q=JSON.stringify(childLabel);
      return prefix+"child_start label="+q+" timeout_ms="+bound+"\n"+prefix+"child_spawn label="+q+" pid=1 wait=process_exit\n"+body+
        (failed?prefix+"child_cleanup_start label="+q+" elapsed_ms=60002 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n":
          prefix+"child_exit label="+q+" elapsed_ms="+(duration-1)+" exit_code=0 signal=null stdout_closed=true stderr_closed=true\n"+
          prefix+"child_cleanup_start label="+q+" elapsed_ms="+(duration-1)+" reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n")+
        prefix+"child_cleanup_result label="+q+" elapsed_ms="+duration+" reason="+(failed?"bounded_timeout":"post_exit_settlement term_sent=false kill_sent=false")+" streams_closed=true remaining_owned_processes=0\n"+
        prefix+"child_result label="+q+" duration_ms="+duration+" exit_code="+(failed?"null signal=SIGTERM timed_out=true":"0 signal=null timed_out=false")+
        " exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason="+(failed?"bounded_timeout":"natural_exit")+"\n";
    };
    const phase=(attempt,log,pass,start,finish)=>({id:"unit",command:"npm test",status:pass?"pass":"failure",exit_status:pass?0:1,timed_out:false,
      started_at:at(start),finished_at:at(finish),duration_ms:finish-start,
      cleanup:{completed:true,exit_observed:true,streams_closed:true,remaining_owned_processes:0,termination_reason:"natural_exit"},
      log:{relative_path:`.augnes-local-verification/logs/${attempt}/unit.log`,bytes:Buffer.byteLength(log),truncated:false}});
    const inherited={route:"serial-aggregate-budget-v1",origin_family_id:digest("synthetic serial family"),origin_number:1,
      origin_attempt_id:"synthetic-serial-origin",origin_receipt_fingerprint:digest("synthetic serial receipt"),envelope_sha256:digest("synthetic serial envelope")};
    const baselineAttempt={family_id:digest("synthetic historical family"),number:1,attempt_id:"synthetic-retirement-historical",branch,head:baselineHead,tree:baselineTree,started_at:at(-300000)};
    const historicalLog=lifecycle("unit",label,60000,55540,output(true,6000)),historicalPhase=phase(baselineAttempt.attempt_id,historicalLog,true,-290000,-230000);
    write(historicalPhase.log.relative_path,historicalLog);
    const historicalReceipt=finalizeReceipt({attempt:baselineAttempt,repository:{head_sha:baselineHead,tree_sha:baselineTree,branch},outcome:{disposition:"product_failure"},cleanup:{completed:true},phases:[historicalPhase]});
    const historicalCompletion={attempt_id:baselineAttempt.attempt_id,receipt_fingerprint:historicalReceipt.integrity.content_fingerprint,
      disposition:"product_failure",cleanup_complete:true,infrastructure_code:null,finished_at:at(-220000)};
    const historical=Object.fromEntries(Object.entries({receipt:historicalReceipt,attempt:baselineAttempt,completion:historicalCompletion}).map(([role,value])=>[role,ref("historical-"+role+".json",value)]));
    const prior={family_id:digest("synthetic immediate family"),number:1,attempt_id:"synthetic-retirement-failure",branch,head:priorHead,tree:priorTree,started_at:at(-200000),
      source_correction:{schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",head:priorHead,tree:priorTree,
        prior_family_id:baselineAttempt.family_id,prior_number:1,prior_attempt_id:baselineAttempt.attempt_id,prior_receipt_fingerprint:historicalCompletion.receipt_fingerprint,
        originals:historical,authorization:{grant_comment_id:101},commission:{source_revision:MATERIAL_SOURCE_CORRECTION,ordinal:1,maximum_invocations:1,inherited_serial:inherited}}};
    const incidentLog=lifecycle("unit",label,60000,60152,output(false,6500),true),incidentPhase=phase(prior.attempt_id,incidentLog,false,-190000,-110000);
    write(incidentPhase.log.relative_path,incidentLog);
    const original=finalizeReceipt({attempt:prior,repository:{head_sha:priorHead,tree_sha:priorTree,branch},outcome:{disposition:"product_failure"},cleanup:{completed:true},phases:[incidentPhase]});
    const completedAt=at(-100000),completion={attempt_id:prior.attempt_id,receipt_fingerprint:original.integrity.content_fingerprint,
      disposition:"product_failure",cleanup_complete:true,infrastructure_code:null,finished_at:completedAt};
    const inputs=observeCanonicalRuntimeInputs(),inventory=gitFixtureDeclaration({inputs,acceptedHead:head,branch});
    const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",branch,head,tree,base:priorHead,
      prior_family_id:prior.family_id,prior_number:1,prior_attempt_id:prior.attempt_id,prior_receipt_fingerprint:completion.receipt_fingerprint,
      commission:{source_revision:MATERIAL_SOURCE_CORRECTION,evidence_kind:REGISTERED_FIXTURE_BUDGET,allowance_case:COMPANION_RETIREMENT_ALLOWANCE_CASE,
        ordinal:1,maximum_invocations:1,inherited_serial:inherited},inputs:{identity_sha256:digest(inputs),inventory_sha256:gitRevisionInventory(inventory)}};
    const resource=path.join(parent,"already-settled-retirement"),env=fixtureBudgetEnvironment(resource),source=observePureContractSource(root),loader=observePureContractLoader(root,env),
      dependencies=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});
    const normal={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,duration_ms:12,termination_reason:"natural_exit",
      exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0};
    const stdout=ref("capture.log",output(true,1)),capture={contract:"augnes.registered-fixture-budget-witness.v1",basis:"actual-owned-development-invocation",role:"direct",
      bound_ms:COMPANION_RETIREMENT_MS,truncated:false,command,tested_source_head:head,tree,dirty:"",source_before:source,source_after:source,
      config:["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(readFileSync(path.join(root,file)))})),
      dependencies_before:dependencies,dependencies_after:dependencies,runtime_before:inputs,runtime_after:inputs,runtime_inputs_sha256:digest(inputs),node_version:process.versions.node,
      input_inventory_before:inventory,input_inventory_after:inventory,environment_before:env,environment_after:env,environment:digest(env),resource_root:resource,
      loader_before:loader,loader_after:loader,started_at:at(-10000),finished_at:at(-5000),result:normal,
      owned_cleanup:[{root:resource,completed:true,failure_count:0,failures:[]}],ownership:{checkout:{released:true},capacity:{released:true}},stdout,
      lifecycle:ref("capture-lifecycle.log",lifecycle("fixture-budget-capture","direct registered fixture allowance",COMPANION_RETIREMENT_MS,12)),
      collector:ref("collector.log",readFileSync(path.join(root,FIXTURE_BUDGET_COLLECTOR),"utf8"))};
    const after=ref("capture.json",capture),focused={failed_phase:"unit",input_remedy_resources:[],finished_at:at(-1000),
      commands:[{command,tested_source_head:head,record:after,stdout}],regression:{kind:REGISTERED_FIXTURE_BUDGET,claim:FIXTURE_BUDGET_CLAIM,
        owner:{phase:"unit",suite:"unit",group:owner},incident:{receipt:p.prior_receipt_fingerprint,log:ref("incident.log",incidentLog),
          log_identity:{relative_path:incidentPhase.log.relative_path,bytes:Buffer.byteLength(incidentLog),sha256:digest(incidentLog)},cause:"UNKNOWN"},
        source_partition:companionRetirementBudgetSourcePartition(git,priorHead,head),rationale:{execution_reserve_ms:15000,termination_grace_ms:13000,resource_ceiling_ms:90000,
          judgment:"Synthetic reader control for a finite prospective operating envelope. Historical observations remain independent, with UNKNOWN cause, no stitched completion and no reliable latency or qualification claim.",
          historical_complete:{...historical,log:ref("historical-unit.log",historicalLog),log_identity:{relative_path:historicalPhase.log.relative_path,bytes:Buffer.byteLength(historicalLog),sha256:digest(historicalLog)},
            limitations:"Retained complete historical invocation only. Different samples are not combined into completion, required latency, a causal comparison or qualification evidence."}},after}};
    const options={git,bytes,parse,original,completion,completedAt,repositoryRoot:root};
    const verify=(q=p,f=focused,a=prior,r=original,c=completion)=>verifyRegisteredFixtureBudget(q,a,f,{...options,original:r,completion:c,completedAt:c.finished_at});
    const actualGit=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:sourceRoot,timeout:10000,maxBuffer:16*1024*1024});
    const actualHead=actualGit(["rev-parse","HEAD"]).toString().trim(),actualRegistration=companionRetirementBudgetRegistration(actualGit,actualHead);
    assert.deepEqual(companionRetirementCompletionNames(actualGit,actualHead),{scenarios:scenarioCases,adverse:["ui","bridge","manager-conflict"],terminal});
    assert(isCompanionRetirementFixtureBudget(p));assert.equal(fixtureBudgetFailurePhase(REGISTERED_FIXTURE_BUDGET,COMPANION_RETIREMENT_ALLOWANCE_CASE),"unit");
    assert.equal(fixtureBudgetFailurePhase(REGISTERED_FIXTURE_BUDGET),"authority");assert.equal(registeredFixtureBudget(git,head,owner).bound_ms,75000);
    assert.equal(companionRetirementBudgetRegistration(git,priorHead).evidence_controls_registered,false);
    assert.equal(companionRetirementBudgetRegistration(git,head).evidence_controls_registered,true);
    assert.equal(verify(),head);assert.equal(readCompanionRetirementBudgetPositive(after,p,options).summary.complete,true);inspectCurrentCompanionRetirementInputs(root,capture);
    let negatives=0;
    for(const change of [f=>f.failed_phase="authority",f=>f.regression.owner.group="local-canonical-maintenance",f=>f.regression.kind=REGISTERED_IDENTITY_BUDGET,
      f=>f.regression.incident.cause="KNOWN",f=>f.regression.incident.receipt=digest("other receipt"),f=>f.regression.source_partition.after.bound_ms=90000,
      f=>f.regression.rationale.execution_reserve_ms=30000,f=>f.regression.rationale.termination_grace_ms=0,f=>f.regression.rationale.resource_ceiling_ms=105000,
      f=>f.regression.rationale.historical_complete.receipt.sha256=digest("unrelated PASS"),f=>f.regression.rationale.historical_complete.log_identity.bytes++,
      f=>f.regression.rationale.historical_complete.limitations="PASS"]) {
      const f=structuredClone(focused);change(f);assert.throws(()=>verify(p,f));negatives++;
    }
    for(const change of [q=>q.commission.allowance_case="registered-maintenance-direct-v1",q=>q.commission.evidence_kind=REGISTERED_IDENTITY_BUDGET,
      q=>delete q.commission.inherited_serial,q=>q.commission.inherited_serial.envelope_sha256=digest("lost history"),q=>q.commission.input_acquisition="unadmitted",
      q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2]) {
      const q=structuredClone(p);change(q);assert.throws(()=>verify(q));negatives++;
    }
    for(const change of [w=>w.bound_ms=90000,w=>w.bound_ms=60000,w=>w.command+=" --skip",w=>w.synthetic_only=true,w=>w.truncated=true,w=>w.dirty="M target",
      w=>w.result.timed_out=true,w=>w.result.termination_reason="exited_with_owned_descendant_cleanup",w=>w.ownership.capacity.released=false,w=>w.owned_cleanup=[],
      w=>w.runtime_after.node.observation.sha256=digest("changed runtime"),w=>w.loader_after.sha256=digest("changed loader"),w=>w.environment_after.UNBOUND="1",w=>w.config.pop(),
      w=>w.source_after.physical_matches=false,w=>w.collector=ref("wrong-collector.log","wrong collector"),w=>w.started_at=at(-200000),
      w=>w.lifecycle=ref("forced-lifecycle.log",bytes(w.lifecycle).toString().replace("term_sent=false","term_sent=true"))]) {
      const w=parse(after),f=structuredClone(focused);change(w);f.regression.after=ref("bad-capture-"+negatives+".json",w);f.commands[0].record=f.regression.after;f.commands[0].stdout=w.stdout;
      assert.throws(()=>readCompanionRetirementBudgetPositive(f.regression.after,p,{...options,finishedAt:f.finished_at}));negatives++;
    }
    const completeOutput=output(true,1);
    for(const changed of [output(false,1),completeOutput.replace(names.terminal,""),completeOutput+names.terminal+"\n",
      completeOutput.replace('"stage":"action_pass"','"stage":"fixture_ready"'),completeOutput.replace('"effects":1','"effects":0'),
      completeOutput.replace('"cleanup_complete":true','"cleanup_complete":false'),completeOutput.replace('"elapsed_ms":1','"elapsed_ms":-1'),
      completeOutput.replace(names.scenarios[0].name,names.scenarios[1].name),completeOutput.replace('"adverse":"manager-conflict"','"adverse":"unknown"')]) {
      const w=parse(after),f=structuredClone(focused);w.stdout=ref("incomplete-output-"+negatives+".log",changed);
      f.regression.after=ref("incomplete-output-"+negatives+".json",w);f.commands[0].record=f.regression.after;f.commands[0].stdout=w.stdout;
      assert.throws(()=>readCompanionRetirementBudgetPositive(f.regression.after,p,{...options,finishedAt:f.finished_at}));negatives++;
    }
    const missingCommand=structuredClone(focused);missingCommand.commands=[];assert.throws(()=>verify(p,missingCommand));negatives++;
    for(const changed of [incidentLog+names.terminal+"\n",incidentLog.replace('"adverse":"bridge"','"adverse":"manager-conflict"'),
      incidentLog.replace('"stage":"action_pass"','"stage":"fixture_ready"'),incidentLog.replace("timeout_ms=60000","timeout_ms=75000"),
      incidentLog+'[canonical:unit] child_start label="unadmitted after failure" timeout_ms=1000\n']) {
      const f=structuredClone(focused),r=structuredClone(original);write(incidentPhase.log.relative_path,changed);
      f.regression.incident.log=ref("bad-incident-"+negatives+".log",changed);f.regression.incident.log_identity.bytes=Buffer.byteLength(changed);f.regression.incident.log_identity.sha256=digest(changed);
      r.phases[0].log.bytes=Buffer.byteLength(changed);assert.throws(()=>verify(p,f,prior,r));negatives++;
    }
    write(incidentPhase.log.relative_path,incidentLog);
    for(const [file,changed]of [[test,readFileSync(path.join(root,test),"utf8")+"\n// changed fixed workload\n"],
      ...COMPANION_RETIREMENT_INPUT_PATHS.filter(v=>v!==test).map(file=>[file,"changed immutable workload\n"]),
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace("timeoutMs:75_000","timeoutMs:90_000")],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace("timeoutMs:10_000","timeoutMs:11_000")],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace('rootNode("'+test+'")','rootNode("'+test+'","--skip")')],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace('process.platform === "darwin"','process.platform !== "darwin"')],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace(controlStep,"")],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace("timeoutMs:30_000","timeoutMs:31_000")],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace(controlStep,controlStep.replace("requireNaturalExit:true","requireNaturalExit:false"))],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace(controlStep,controlStep.replace("requireNaturalExit:true","requireNaturalExit:true,env:{}"))],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace("--run-companion-retirement-budget-fixtures","--run-companion-retirement-budget-fixtures-extra")],
      [FIXTURE_BUDGET_PATHS.suite,candidateSuite.replace(controlStep,controlStep+","+controlStep)],
      ["scripts/run-local-canonical-verification.mjs",(executor+executor).replaceAll("3_600_000","3_700_000")]]) {
      write(file,changed);const incompatible=commit("controlled refused retirement source");
      assert.throws(()=>companionRetirementBudgetSourcePartition(git,priorHead,incompatible));negatives++;git(["reset","--hard",head]);
    }
    assert.equal(verify(),head);
    return {contract:REGISTERED_FIXTURE_BUDGET,allowance_case:COMPANION_RETIREMENT_ALLOWANCE_CASE,synthetic_only:true,negative_controls:negatives,
      retained_historical_invocation_bound:true,complete_invocations_never_stitched:true,fixed_workload_files:COMPANION_RETIREMENT_INPUT_PATHS.length,
      actual_registration:{head:actualHead,bound_ms:actualRegistration.bound_ms},
      registered_retirement_executed:false,original_incident_reproduction:false};
  } finally {rmSync(root,{recursive:true,force:true});}
}

// These are small synthetic reader controls, not either real selective witness.
// They exercise the actual fixed-owner reader without running the 90s workload.
export async function selectiveFixtureWorkloadControls(parent,h,sourceRoot) {
  const root=path.join(parent,"selective-fixture-witness");mkdirSync(root);
  const write=(file,value)=>{const target=path.join(root,file);mkdirSync(path.dirname(target),{recursive:true});
    writeFileSync(target,typeof value==="string"||Buffer.isBuffer(value)?value:JSON.stringify(value),{mode:0o600});};
  const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024});
  const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
  git(["init","--quiet"]);write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
  for(const dir of ["app","components","lib","scripts","types","apps/augnes_apps/src","apps/augnes_apps/public"])write(dir+"/placeholder.ts","export {};\n");
  const version=JSON.parse(readFileSync(path.join(sourceRoot,"node_modules/tsx/package.json"))).version;
  write("package.json",{type:"module",dependencies:{tsx:version}});write("package-lock.json",{packages:{"node_modules/tsx":{version}}});write("tsconfig.json",{compilerOptions:{target:"ES2022"}});
  for(const name of ["tsx","esbuild","@esbuild"])cpSync(path.join(sourceRoot,"node_modules",name),path.join(root,"node_modules",name),{recursive:true});
  write("scripts/external-response-report.mjs","export {};\n");write("scripts/external-response-selective-report.mjs","export {};\n");
  write("scripts/fixtures/experience-use/selective-expectations.json",{frozen_before_implementation:true});
  const processor='assert(["success", "capacity"].includes(mode) && ["v1", "v2"].includes(version));\nconst moduleName = `normalize-${version}.mjs`, moduleUrl = new URL(moduleName, import.meta.url);\nconst normalizer = await import(moduleUrl.href);\n';
  write("scripts/fixtures/experience-use/process-events.mjs",processor);
  for(const version of ["v1","v2"])write("scripts/fixtures/experience-use/normalize-"+version+".mjs","export const controlled=true;\n");
  const label="declared upstream correction changes a fresh downstream report while independent support survives";
  const suite='const rootNode=(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot,});\n'+
    'const suites={integration:[{id:"external-response-selective",group:"supporting-serial",requirements:["database"],label:'+JSON.stringify(label)+',...rootNode("'+SELECTIVE_FIXTURE_PATH+'"),timeoutMs:90_000,requireNaturalExit:true}]};\n';
  write(FIXTURE_BUDGET_PATHS.suite,suite);
  write("scripts/run-local-canonical-verification.mjs",'npmPhase("integration","integration",["run","test:integration"],4_200_000);\nnpmPhase("integration","integration",["run","test:integration"],4_200_000);\n');
  write("scripts/canonical-child-runner.mjs","export const DEFAULT_CANONICAL_TERM_GRACE_MS=8_000;\nexport const DEFAULT_CANONICAL_KILL_GRACE_MS=5_000;\n");
  write(FIXTURE_BUDGET_COLLECTOR,readFileSync(path.join(sourceRoot,FIXTURE_BUDGET_COLLECTOR)));
  const source=value=>'async function consumer(){const result=await runCanonicalChild({timeoutMs:20000});canonicalChildAcceptanceFailure(result,{timeoutMs:20000,requireNaturalExit:true});return '+value+';}\n';
  write(SELECTIVE_FIXTURE_PATH,source(1));const beforeHead=commit("controlled original selective fixture");
  const runtime=observeCanonicalRuntimeInputs(),normal={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,duration_ms:10,
    termination_reason:"natural_exit",exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0};
  const times=offset=>new Date(Date.now()+offset).toISOString(),completedAt=times(-10000),branch="codex/controlled-selective";
  const records=new Map(),ref=(name,value)=>{const b=Buffer.from(typeof value==="string"?value:JSON.stringify(value));records.set(name,b);return{artifact:name,sha256:digest(b)};};
  const bytes=r=>{const b=records.get(r.artifact);assert(b);assert.equal(digest(b),r.sha256);return b;},parse=r=>JSON.parse(bytes(r));
  const lifecycle=()=>`[canonical:fixture-budget-capture] child_start label="selective fixture workload" timeout_ms=90000\n`+
    `[canonical:fixture-budget-capture] child_spawn label="selective fixture workload" pid=1 wait=process_exit\n`+
    `[canonical:fixture-budget-capture] child_exit label="selective fixture workload" elapsed_ms=9 exit_code=0 signal=null stdout_closed=true stderr_closed=true\n`+
    `[canonical:fixture-budget-capture] child_cleanup_start label="selective fixture workload" elapsed_ms=9 reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n`+
    `[canonical:fixture-budget-capture] child_cleanup_result label="selective fixture workload" elapsed_ms=10 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n`+
    `[canonical:fixture-budget-capture] child_result label="selective fixture workload" duration_ms=10 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
  const phases=["ordinary_A_delivery_and_real_B_output","new_output_write_rollback","explicit_fresh_recovery_of_unadvertised_material","fresh_original_and_exact_replay",
    "fresh_two_step_correction_changes_actual_output_D_retained","metadata_changes_current_judgment_not_valid_output","access_version_race_and_withdrawal_refusal",
    "original_history_immutable_and_no_inherited_authority","event_profile_refusal_no_writes_and_valid_duplicate_bounds"];
  const names=["missing-event-id","missing-job-id","zero-attempt","unsupported-event-field","empty-event-id","numeric-job-id","fractional-attempt","unsafe-attempt",
    "unsupported-status","numeric-duration","duration-width","duration-precision","null-row","invalid-late-duplicate","conflicting-duplicate","valid-boundaries"];
  const first=["b-original","c-write-fault","c-publication-fault","c-original","c-replay","c-corrected","c-metadata","c-inaccessible","c-race","c-basis-race","c-previous-review","c-wrong-version","c-withdrawn"];
  const stopped={"c-write-fault":"external_inspection_or_storage_unavailable","c-publication-fault":"external_inspection_or_storage_unavailable","c-inaccessible":"external_access_refused",
    "c-race":"selective_dependencies_changed_during_read","c-basis-race":"selective_work_basis_changed","c-previous-review":"selective_previous_judgment_requires_review",
    "c-wrong-version":"selective_replacement_binding_invalid","c-withdrawn":"external_access_refused"};
  const report=corrected=>({version:"selective-correction-development.v1",passed:true,failure:null,phases,errors:[],cleanup:[{completed:true,failure_count:0,failures:[]}],
    children:[...first,...names.map(v=>"c-"+v)].map((label,index)=>({label,process:index+1,duration_ms:1,cleanup:true,remaining_owned_processes:0,
      ...(stopped[label]?{status:"stopped",reason:stopped[label],plan_created:false}:label.startsWith("c-")&&names.includes(label.slice(2))&&label!=="c-valid-boundaries"?
        {status:"stopped",reason:"selective_event_invalid",plan_created:false}:{status:"completed",plan_created:label!=="b-original"}),
      decision:label==="c-original"?"use_original":label==="c-corrected"?"revise":"retain",
      output_ref:["c-corrected","c-metadata"].includes(label)?"sha256:"+digest("corrected"):"sha256:"+digest("original"),
      content:{total_worker_ms:7500,projected_worker_ms:label==="c-valid-boundaries"?3000000020997:["c-corrected","c-metadata"].includes(label)?25500:22500,reservation_fee_cents:12000}})),
    event_cases:names.map((name,index)=>({name,status:index===15?"completed":"stopped",reason:index===15?undefined:"selective_event_invalid",plan_created:index===15,
      shared_material_readback:true,replacement_sha256:"sha256:"+digest(name),before_sha256:"sha256:"+digest("state"),after_sha256:"sha256:"+digest("state"),unchanged:true,actions:["read","material"],
      seeded_cache_ref:name==="unsupported-event-field"?"sha256:"+digest("cache"):undefined,projected_worker_ms:index===15?3000000020997:undefined,
      ...(corrected?{consumer_material_readback:true,consumer_correction_readback:true,correction_edges:index%8+1}:{})}))});
  const capture=(head,role,corrected)=>{
    const snapshot=observePureContractSource(root),dependencies=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),loader=observePureContractLoader(root);
    const declaration=gitFixtureDeclaration({inputs:runtime,acceptedHead:head,branch}),inventory={...declaration,fingerprint:digest(declaration),first_fault:null,secondary_faults:[],events:[]};
    const target={inventory:gitRevisionInventory(inventory),inputInventory:inventory,service:{state:{status:"live",preservation_valid:true},diagnostics:{coherent:true}}};
    const resource=path.join(parent,"settled-selective-"+role),environment=fixtureBudgetEnvironment(resource,{...process.env,
      AUGNES_CANONICAL_NODE_HEADERS:path.join(path.dirname(path.dirname(process.execPath)),"include","node"),
      AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT:digest(runtime.headers.observation)});delete environment.NODE_ENV;
    Object.assign(environment,{npm_config_cache:path.join(resource,"npm-cache"),npm_config_devdir:path.join(resource,"node-gyp")});
    const state={source:snapshot,dependencies,loader,runtime,target};return {contract:"augnes.selective-fixture-workload-witness.v1",basis:"actual-owned-development-invocation",group:SELECTIVE_FIXTURE_OWNER.group,
      command:SELECTIVE_FIXTURE_COMMAND,tested_source_head:head,tree:snapshot.tree,before:state,after:state,tool_source_before:snapshot,tool_source_after:snapshot,environment,result:normal,cleanup:{completed:true,failure_count:0,failures:[]},
      ownership:{checkout:{released:true},capacity:{released:true}},truncated:false,started_at:times(role==="before"?-8000:-4000),finished_at:times(role==="before"?-6000:-2000),
      stdout:ref(role+".log",JSON.stringify(report(corrected))+"\n"),lifecycle:ref(role+"-lifecycle.log",lifecycle()),collector:ref(role+"-collector.log",readFileSync(path.join(root,FIXTURE_BUDGET_COLLECTOR),"utf8"))};
  };
  const before=capture(beforeHead,"before",false);write(SELECTIVE_FIXTURE_PATH,source(2));const head=commit("controlled fixture work reduction"),tree=git(["rev-parse","HEAD^{tree}"]).toString().trim();
  const after=capture(head,"after",true),partition=selectiveFixtureWorkloadSourcePartition(git,beforeHead,head,beforeHead);
  // Synthetic old-target capture is driven by the final collector checkout;
  // preserve both independently observed identities instead of relabelling it.
  before.tool_source_before=after.tool_source_before;before.tool_source_after=after.tool_source_after;
  const prior={head:beforeHead,tree:git(["rev-parse",beforeHead+"^{tree}"]).toString().trim(),attempt_id:"controlled-selective-failure",number:1,recovery:null,budget:{initial:1,recovery:0},
    source_correction:{schema:"augnes.local-canonical-source-correction.v10",kind:"reviewed_revision",commission:{input_revision:DIRECT_GIT_INPUT_REVISION,ordinal:1,maximum_invocations:1}}};
  const p={head,tree,base:beforeHead,prior_receipt_fingerprint:digest("controlled-selective-receipt"),commission:{evidence_kind:SELECTIVE_FIXTURE_WORKLOAD},inputs:{identity_sha256:digest(runtime),inventory_sha256:after.after.target.inventory}};
  const incidentLog=`[canonical:integration] child_start label=${JSON.stringify(label)} timeout_ms=90000\n`+
    `[canonical:integration] child_spawn label=${JSON.stringify(label)} pid=1 wait=process_exit\n`+
    `[canonical:integration] child_cleanup_start label=${JSON.stringify(label)} elapsed_ms=90004 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n`+
    `[canonical:integration] child_cleanup_result label=${JSON.stringify(label)} elapsed_ms=90114 reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n`+
    `[canonical:integration] child_result label=${JSON.stringify(label)} duration_ms=90114 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n`+
    '[canonical:integration] group_inventory '+JSON.stringify({started_count:1,settled_count:1,completed_count:1,failed_count:1,children:[{group:"supporting-serial",label,started:true,settled:true,completed:true,outcome:"failed"}]})+'\n'+
    JSON.stringify({suite:"integration",resource_cleanup:[{completed:true,failure_count:0,failures:[]}]})+'\nchild_timed_out:supporting-serial:'+label+'\n';
  const relative=`.augnes-local-verification/logs/${prior.attempt_id}/integration.log`,original={attempt:prior,integrity:{content_fingerprint:p.prior_receipt_fingerprint},outcome:{disposition:"product_failure"},inputs:{first_fault:null,secondary_faults:[]},
    phases:[{id:"integration",command:"npm run test:integration",status:"failure",exit_status:1,timed_out:false,duration_ms:100000,cleanup:{termination_reason:"natural_exit"},log:{relative_path:relative,bytes:Buffer.byteLength(incidentLog),truncated:false}}]},completion={disposition:"product_failure",cleanup_complete:true,infrastructure_code:null};
  const focused={failed_phase:"integration",input_remedy_resources:[],implicated_paths:[SELECTIVE_FIXTURE_PATH],finished_at:times(0),regression:{kind:SELECTIVE_FIXTURE_WORKLOAD,claim:SELECTIVE_FIXTURE_WORKLOAD_CLAIM,owner:SELECTIVE_FIXTURE_OWNER,
    incident:{receipt:p.prior_receipt_fingerprint,log:ref("incident.log",incidentLog),log_identity:{relative_path:relative,bytes:Buffer.byteLength(incidentLog),sha256:digest(incidentLog)},cause:"UNKNOWN"},
    accepted_baseline:{head,tree,receiving_review:{id:1,sha256:digest("controlled accepted source")}},before:ref("before.json",before),after:ref("after.json",after),
    coverage_review:ref("coverage-review.json",{schema:"augnes.selective-fixture-coverage-review.v1",basis:"independent-source-and-coverage-review",reviewer:"controlled separate reviewer",verdict:"ACCEPT / RETAIN",
      ...partition,obligations:SELECTIVE_COVERAGE_OBLIGATIONS,reviewed_at:times(-1000)})},commands:[]};
  focused.commands=[{command:SELECTIVE_FIXTURE_COMMAND,tested_source_head:head,record:focused.regression.after,stdout:after.stdout}];
  const options={git,parse,bytes,completedAt,original,completion,repositoryRoot:root};
  assert.equal(verifySelectiveFixtureWorkload(p,prior,focused,options),head);let refusals=0;
  for(const mutate of [r=>r.children.pop(),r=>r.children[1].process=r.children[0].process,r=>r.children[8].reason="accepted",r=>r.children[0].cleanup=false,
    r=>r.phases.pop(),r=>r.event_cases.pop(),r=>r.event_cases[0].before_sha256="sha256:"+digest("write"),r=>r.event_cases[3].seeded_cache_ref=null,
    r=>r.event_cases[0].replacement_sha256=digest("wrong hash representation"),
    r=>{r.event_cases[13].seeded_cache_ref=r.event_cases[3].seeded_cache_ref;delete r.event_cases[3].seeded_cache_ref;},
    r=>r.event_cases[0].actions.push("publish"),r=>r.event_cases[15].projected_worker_ms=1,r=>r.event_cases[8].correction_edges=8,
    r=>r.event_cases[0].consumer_material_readback=false,r=>r.children[6].output_ref="changed",r=>r.errors.push("network")]) {
    const bad=report(true);mutate(bad);assert.throws(()=>verifySelectiveFixtureWorkloadReport(bad,true));refusals++;
  }
  for(const mutate of [f=>f.regression.kind="other",f=>f.regression.owner.group="external-response",f=>f.regression.claim="cured",f=>f.input_remedy_resources=["git-config"],
    f=>f.regression.incident.cause="KNOWN",f=>f.regression.incident.log_identity.bytes++,f=>delete f.regression.coverage_review]) {
    const bad=structuredClone(focused);mutate(bad);assert.throws(()=>verifySelectiveFixtureWorkload(p,prior,bad,options));refusals++;
  }
  for(const mutate of [w=>w.synthetic_only=true,w=>w.command+=" --cpu-prof",w=>w.result={...normal,timed_out:true},w=>w.result={...normal,exit_code:1},
    w=>w.ownership.checkout.released=false,w=>w.before.dependencies={...w.before.dependencies,content_sha256:digest("changed")},w=>w.after.source={...w.after.source,physical_matches:false},
    w=>delete w.tool_source_before,w=>w.tool_source_after={...w.tool_source_after,inventory_sha256:digest("changed tool")},
    w=>{w.tool_source_before={...w.tool_source_before,physical_matches:false};w.tool_source_after=w.tool_source_before;},
    w=>w.collector=ref("changed-collector.log","changed"),w=>w.lifecycle=ref("forced-lifecycle.log",lifecycle().replace("term_sent=false","term_sent=true"))]) {
    const bad=structuredClone(focused),w=structuredClone(after);mutate(w);bad.regression.after=ref("negative-after-"+refusals+".json",w);bad.commands[0]={...bad.commands[0],record:bad.regression.after,stdout:w.stdout};
    assert.throws(()=>verifySelectiveFixtureWorkload(p,prior,bad,options));refusals++;
  }
  // Different physical roots retain their actual raw security identities. This
  // is content/layout/package equality, never claimed ACL/xattr equivalence.
  const dependencyBefore=(differentRoot,changePermission=true,changeLayout=false,withinRun=false)=>{
    const witness=parse(focused.regression.before),copy=structuredClone(focused);
    for(const side of ["before","after"])witness[side].dependencies={...witness[side].dependencies,
      ...(differentRoot?{location_fingerprint:digest("different physical dependency root")} : {}),
      ...(changePermission&&(!withinRun||side==="after")?{permission_sha256:digest("separately observed raw security")}:{}),
      ...(changeLayout?{layout_sha256:digest("changed dependency topology")}:{} )};
    copy.regression.before=ref("dependency-before-"+differentRoot+"-"+changePermission+"-"+changeLayout+"-"+withinRun+".json",witness);
    return copy;
  };
  assert.equal(verifySelectiveFixtureWorkload(p,prior,dependencyBefore(true),options),head);
  for(const [differentRoot,changeLayout,withinRun]of [[false,false,false],[true,true,false],[true,false,true]]){
    assert.throws(()=>verifySelectiveFixtureWorkload(p,prior,dependencyBefore(differentRoot,true,changeLayout,withinRun),options));refusals++;
  }
  for(const mutate of [v=>v.source_correction.commission.maximum_invocations=2,v=>v.source_correction.commission.input_revision="stable-protected-git-input-v1",v=>v.budget.recovery=1]) {
    const bad=structuredClone(prior),r=structuredClone(original);mutate(bad);r.attempt=bad;assert.throws(()=>selectiveFixtureWorkloadIncident(p,bad,focused.regression,{...options,original:r}));refusals++;
  }
  for(const [file,changed] of [[FIXTURE_BUDGET_PATHS.suite,suite.replace("90_000","91_000")],[SELECTIVE_FIXTURE_PATH,source(2).replace("timeoutMs:20000,requireNaturalExit","timeoutMs:21000,requireNaturalExit")]]) {
    const previous=readFileSync(path.join(root,file));write(file,changed);const bad=commit("controlled changed bound");assert.throws(()=>selectiveFixtureWorkloadRegistration(git,bad));
    git(["reset","--hard",head]);assert.deepEqual(readFileSync(path.join(root,file)),previous);refusals++;
  }
  write("scripts/external-response-report.mjs","export const changedProduct=true;\n");const changed=commit("controlled changed consumed source");
  assert.throws(()=>selectiveFixtureWorkloadSourcePartition(git,beforeHead,changed,beforeHead));git(["reset","--hard",head]);refusals++;
  for(const changed of [processor.replace('"v1", "v2"','"v1", "v2", "v3"'),processor.replace("moduleUrl.href","moduleUrl.pathname"),
    processor.replace("normalize-${version}.mjs","other-${version}.mjs"),processor.replace("new URL(moduleName, import.meta.url)","new URL(moduleName, otherBase)")]) {
    write("scripts/fixtures/experience-use/process-events.mjs",changed);const bad=commit("controlled unsupported computed fixture import");
    assert.throws(()=>selectiveFixtureWorkloadSourcePartition(git,beforeHead,bad,beforeHead));git(["reset","--hard",head]);refusals++;
  }
  const authority=selectiveHistoricalAuthorityControls();rmSync(root,{recursive:true});
  return {synthetic_only:true,kind:SELECTIVE_FIXTURE_WORKLOAD,natural_before_and_after_pass:true,refusal_controls:refusals,historical_authority:authority,
    real_selective_workload_executed:false,deciding:false};
}

function selectiveHistoricalAuthorityControls() {
  const stamp=offset=>new Date(Date.now()+offset).toISOString(),hash=v=>digest("controlled "+v),commit=value=>value.repeat(40);
  const p={schema:"augnes.local-canonical-source-correction.v10",kind:"reviewed_revision",pull_request:999,branch:"codex/controlled-selective",base:commit("a"),head:commit("b"),tree:commit("c"),
    prior_family_id:hash("root"),prior_number:1,prior_attempt_id:"controlled-ordinary",prior_receipt_fingerprint:hash("receipt"),
    commission:{root_family_id:hash("root"),root_number:1,root_attempt_id:"controlled-ordinary",root_receipt_fingerprint:hash("receipt"),ordinal:1,maximum_invocations:1,input_revision:DIRECT_GIT_INPUT_REVISION},
    accepted:{base:commit("a"),head:commit("b"),tree:commit("c"),review:{id:10,sha256:hash("review")}},authorization:{grant_comment_id:20,grant_sha256:hash("grant")},
    originals:Object.fromEntries(["receipt","attempt","completion","stock"].map(name=>[name,{artifact:name+".json",sha256:hash(name)}])),source:{artifact:"source.json",sha256:hash("source")},focused:{artifact:"focused.json",sha256:hash("focus")},
    inputs:{predecessor_sha256:hash("prior inputs"),identity_sha256:hash("runtime"),inventory_sha256:hash("inventory"),current:{artifact:"runtime.json",sha256:hash("current")}}};
  const runtime=observeCanonicalRuntimeInputs(),declaration=gitFixtureDeclaration({inputs:runtime,acceptedHead:p.head,branch:p.branch}),environment=hash("phase environment");
  declaration.binding={head:p.head,tree:p.tree,executor_fingerprint:hash("executor"),runtime_inputs:runtime,
    phase_environment_fingerprints:REVIEWED_REVISION_PHASES.map(id=>({id,fingerprint:environment}))};
  const inputs={...declaration,fingerprint:digest(declaration),first_fault:null,secondary_faults:[],events:[]};
  p.inputs.identity_sha256=digest(runtime);p.inputs.inventory_sha256=gitRevisionInventory(inputs);
  const user={login:"fixture-maintainer",id:2,type:"User"},permission={user:{login:user.login},permission:"maintain"},permissions={accepted_revision:permission,execution_commission:permission};
  const review={id:10,user,author_association:"COLLABORATOR",state:"COMMENTED",commit_id:p.head,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:stamp(-5000),
    body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,gitReviewTarget(p),DIRECT_GIT_INPUT_REVISION,DIRECT_GIT_INPUT_HISTORY_BOUNDARY].join("\n")};
  const grant={id:20,user,author_association:"COLLABORATOR",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999",created_at:stamp(-4000),updated_at:stamp(-4000),
    body:["Authorize one prospective Mac qualification of this direct Git-input target.",p.schema,p.branch,p.base,p.head,p.tree,p.prior_receipt_fingerprint,gitReviewTarget(p),DIRECT_GIT_INPUT_REVISION,DIRECT_GIT_INPUT_HISTORY_BOUNDARY,
      "https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10","Exactly one admitted deciding invocation total. Reservation/interruption consumes it. Zero unchanged-target retry; zero extra recovery. Separate fresh-process stock and independent audit."].join("\n")};
  const observations={accepted_revision:reviewedRevisionAuthorityObservation(review,"accepted_revision"),execution_commission:reviewedRevisionAuthorityObservation(grant,"execution_commission")};
  p.accepted.review.sha256=digest(observations.accepted_revision);p.authorization.grant_sha256=digest(observations.execution_commission);
  const prior={number:1,recovery:null,budget:{initial:1,recovery:0},branch:p.branch,head:p.head,tree:p.tree,source_correction:p,revision_authority:observations,
    attempt_id:"controlled-selective-review",contract_fingerprint:inputs.fingerprint};
  assert.deepEqual(validateSelectiveFixtureHistoricalAuthority(prior,review,grant,permissions),observations);let refused=0;
  for(const mutate of [v=>v.review.body+="changed",v=>v.review.commit_id=commit("d"),v=>v.review.user={...user,login:"imposter"},v=>v.grant.id++,
    v=>v.grant.created_at=stamp(-6000),v=>v.permissions.execution_commission={user:{login:user.login},permission:"read"},v=>v.prior.source_correction.commission.maximum_invocations=2]) {
    const v=structuredClone({prior,review,grant,permissions});mutate(v);assert.throws(()=>validateSelectiveFixtureHistoricalAuthority(v.prior,v.review,v.grant,v.permissions));refused++;
  }
  const pr={number:999,state:"open",draft:true,merged:false,auto_merge:null,head:{sha:commit("d"),ref:p.branch,repo:{full_name:"hynk-studio/augnes"}},base:{sha:commit("e"),ref:"main",repo:{full_name:"hynk-studio/augnes"}}};
  assert.throws(()=>validateReviewedRevisionAuthorityRecords(p,review,grant,permissions,pr),/revision_published_source_invalid/u);refused++;
  const received={...review,id:30,commit_id:commit("d"),submitted_at:stamp(-3000),body:"Independent fixture-correction review: ACCEPT / RETAIN. Qualification remains HOLD.\n"+commit("d")+"\n"+commit("e")};
  const baseline={head:commit("d"),tree:commit("e"),receiving_review:{id:30,sha256:digest(reviewedRevisionAuthorityObservation(received,"accepted_revision"))}};
  validateSelectiveFixtureBaselineAuthority(p,baseline,received,permission,stamp(-8000),stamp(-1000));
  for(const mutate of [v=>v.received.body+="changed",v=>v.received.commit_id=commit("a"),v=>v.baseline.receiving_review.sha256=hash("wrong"),v=>v.received.submitted_at=stamp(1000),
    v=>v.permission.permission="read",v=>v.received.user={...user,login:"imposter"}]) {
    const v=structuredClone({baseline,received,permission});mutate(v);assert.throws(()=>validateSelectiveFixtureBaselineAuthority(p,v.baseline,v.received,v.permission,stamp(-8000),stamp(-1000)));refused++;
  }
  const stock=selectiveHistoricalStockControls(prior,runtime,inputs);
  return {immutable_authority_accepted:true,baseline_review_accepted:true,current_stale_publication_refused:true,refusals:refused,stock};
}

function selectiveHistoricalStockControls(prior,runtime,inputs) {
  const hash=value=>digest("controlled stock "+value),invocation="a".repeat(32),binding=hash("service binding");
  const state={status:"live",checkout_relation:"exact",preservation_valid:true,service_identity:"sha256:"+hash("service"),preservation_binding:binding};
  const observation={contract:"augnes.companion-preservation-observation.v2",samples:1,coherent:true,live_identity_valid:true,
    before_binding:binding,after_binding:binding,repository_observation_before:"observed",repository_observation_after:"observed",
    repository_binding_before:hash("repository"),repository_binding_after:hash("repository")};
  const owned={required:true,acquired:true,released:true,failure_code:null};
  const cleanup={completed:true,remaining_owned_processes:0,failure_codes:[],isolated_resources:{prepared:true,completed:true,failure_count:0,failures:[],invocation_id:invocation},
    companion_service:{restored:true,maintenance_acquired:false,maintenance_released:true,scope:"accepted_checkout_read_only",before:state,after:state,observations:{before:observation,after:observation}}};
  const phases=REVIEWED_REVISION_PHASES.map((id,index)=>index>7?{id,status:"not_run",failure_code:"phase_not_run",exit_status:null,started_at:null,finished_at:null,browser_use:[],cleanup:{remaining_owned_processes:null}}:
    {id,status:index===7?"failure":"pass",failure_code:index===7?"phase_failed":null,exit_status:index===7?1:0,timed_out:false,spawn_error_code:null,
      environment_fingerprint:inputs.binding.phase_environment_fingerprints[index].fingerprint,browser_use:[],cleanup:{completed:true,remaining_owned_processes:0,exit_observed:true,streams_closed:true,listener_residue_count:null,termination_reason:"natural_exit"}});
  const browser=inputs.resources.find(r=>r.id==="browser-executable");
  phases[7].browser_use=["durable-work-surface","durable-work-surface","durable-work-surface","cumulative-work-surface","cumulative-work-surface"].map(consumer=>({
    contract:"augnes.local-canonical-browser-use.v2",consumer,executable_name:"ControlledFixture",location_fingerprint:browser.location_fingerprint,
    before:browser.before,after:browser.before,actual_version:"Chrome/1",runtime_versions:{http:"Chrome/1",cdp:"Chrome/1"},disposition:"unchanged",unchanged:true}));
  const receipt={attempt:prior,run:{id:prior.attempt_id,invocation_id:invocation},inputs,phases,cleanup,checkout_ownership:owned,capacity_ownership:owned,
    historical_inputs:{required:true,unchanged:true,completed:true,failures:[]},repository:{worktree_before:"clean",worktree_after:"clean"},verification_context:{kind:"isolated-worktree"},
    evidence:{mode:"full",selected_plan:"full-canonical",deciding:false},outcome:{disposition:"product_failure",validity:"valid_within_observed_scope",safety:"preserved_within_observed_scope",execution:"incomplete_or_failed",first_fault:null},
    final:{result:"failure",exit_status:1,reason_codes:["phase_failed","selected_phases_incomplete"]}};
  const stock={status:"non_deciding_or_stale",valid_deciding_evidence:false,dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",
    safety:"preserved_within_observed_scope",current_merge_applicability:"blocked"},issues:[...phases.slice(7).map(p=>"phase_not_passing:"+p.id),"receipt_attempt_records_unverified",
      "receipt_stale_integration_base","receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid"].sort()};
  const verify=(r=receipt,s=stock,kind=SELECTIVE_FIXTURE_WORKLOAD)=>verifyGitRevisionFailure(r,s,runtime,REVIEWED_REVISION_PHASES,1,false,false,false,false,null,kind);
  verify();assert.equal(stock.issues.length,15);assert.throws(()=>verify(receipt,stock,null));let refusals=1;
  for(const mutate of [s=>s.issues.pop(),s=>s.issues.push("unexplained_issue"),s=>s.issues=s.issues.filter(v=>v!=="receipt_attempt_records_unverified"),
    s=>s.issues=s.issues.filter(v=>v!=="receipt_stale_integration_base"),s=>s.dimensions.current_merge_applicability="matches_observed_context",s=>s.dimensions.safety="blocked"]) {
    const bad=structuredClone(stock);mutate(bad);assert.throws(()=>verify(receipt,bad));refusals++;
  }
  for(const mutate of [r=>r.attempt.source_correction.commission.maximum_invocations=2,r=>r.attempt.source_correction.commission.input_revision="stable-protected-git-input-v1",
    r=>r.attempt.source_correction.commission.ordinal=0,r=>r.inputs.first_fault={resource:"git-config",disposition:"input_invalidation"},r=>r.outcome.safety="blocked",
    r=>r.phases[7].id="unit",r=>r.phases[7].browser_use[0].consumer="unrelated",r=>r.cleanup.completed=false,r=>r.checkout_ownership.released=false]) {
    const bad=structuredClone(receipt);mutate(bad);assert.throws(()=>verify(bad));refusals++;
  }
  assert.throws(()=>verify(receipt,stock,"unknown-workload-kind"));refusals++;
  return {exact_false_15_accepted:true,ordinary_reader_refused:true,original_stock_unchanged:true,refusals};
}

// Disposable Git/loader/dependency fixture. The actual historical attempt and
// stock replays are separate evidence and their originals are immutable.
function generatedDeclarationControls(root, parent, write) {
  const file = "next-env.d.ts", absolute = path.join(root, file);
  const nextDeclaration = directory => [
    '/// <reference types="next" />',
    '/// <reference types="next/image-types/global" />',
    'import "./' + directory + '/types/routes.d.ts";',
    'import "./' + directory + '/types/root-params.d.ts";',
    "",
    "// NOTE: This file should not be edited",
    "// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.",
    "",
  ].join("\n");
  const build = nextDeclaration(".next"), dev = nextDeclaration(".next/dev");
  write(file, build);
  const witness = { after: { source: observePureContractSource(root), loader: observePureContractLoader(root),
    dependencies: observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" }) },
    environment: { AUGNES_CANONICAL_TEMP_ROOT: path.join(parent, "already-settled-generated-source") } };
  inspectCurrentIntegrationBudgetInputs(root, witness);
  write(file, dev);
  // Complete registered fields in explicitly synthetic records. Checksums
  // provide integrity, never physical attempt authority for this fixture.
  // Author the positive interval from this file's observed timestamps: the
  // filesystem clock need not share Date.now()'s granularity. This models
  // containment only; production writer attribution and its bounds are unchanged.
  const written = lstatSync(absolute, { bigint: true });
  const first = written.mtimeNs < written.ctimeNs ? written.mtimeNs : written.ctimeNs;
  const last = written.mtimeNs > written.ctimeNs ? written.mtimeNs : written.ctimeNs;
  const started_at = new Date(Number(first / 1_000_000n)).toISOString();
  const finished_at = new Date(Number(last / 1_000_000n)).toISOString();
  const invocation = "a".repeat(32), environment = digest("synthetic generated declaration environment"), source = witness.after.source;
  const phase = { id: "e2e-project-experience", command: "node scripts/run-canonical-test-suite.mjs e2e-project-experience",
    cwd_scope: "root", exclusive: true, browser: true, base_sha: source.head, head_sha: source.head,
    invocation_id: invocation, environment_fingerprint: environment, status: "pass", exit_status: 0,
    timed_out: false, spawn_error_code: null, failure_code: null, started_at, finished_at,
    cleanup: { completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0, listener_residue_count: null, termination_reason: "natural_exit" } };
  const receipt = { verification_context: { kind: "isolated-worktree" }, cleanup: { completed: true },
    repository: { head_sha: source.head, tree_sha: source.tree, base_sha: source.head },
    run: { invocation_id: invocation, started_at, finished_at: phase.finished_at },
    inputs: { binding: { head: source.head, tree: source.tree, phase_environment_fingerprints: [{ id: phase.id, fingerprint: environment }] } }, phases: [phase] };
  const stock = (copy = receipt, focused = witness) => inspectCurrentIntegrationBudgetInputs(root, focused, finalizeReceipt(copy));
  assert.throws(() => inspectCurrentIntegrationBudgetInputs(root, witness), /revision_fixture_budget_invalid/u);
  stock();
  const refused = [];
  const reject = (name, action) => { assert.throws(action); refused.push(name); };
  const later = new Date(Number(last / 1_000_000n + 1n)).toISOString();
  reject("outside_writer_window", () => stock({ ...receipt,
    run: { ...receipt.run, started_at: later, finished_at: later },
    phases: [{ ...phase, started_at: later, finished_at: later }] }));
  reject("other_phase", () => stock({ ...receipt, phases: [{ ...phase, id: "typecheck", browser: false }] }));
  reject("other_browser_phase", () => stock({ ...receipt, phases: [{ ...phase, id: "e2e-golden" }] }));
  reject("unsettled_owner", () => stock({ ...receipt, cleanup: { completed: false } }));
  const changed = structuredClone(witness);
  changed.after.source.root_generated[0].sha256 = digest("substituted historical source");
  reject("substituted_frozen_form", () => stock(receipt, changed));
  write(file, build);
  chmodSync(absolute, 0o666);
  reject("unsafe_declaration_mode", stock);
  chmodSync(absolute, 0o644);
  const link = path.join(parent, "declaration-link");
  linkSync(absolute, link);
  reject("linked_declaration", stock);
  rmSync(link);
  for (const [name, relative] of [["tracked_source", "lib/placeholder.ts"], ["loader", "node_modules/tsx/dist/loader.mjs"],
    ["prepared_dependency", "node_modules/esbuild/package.json"]]) {
    const original = readFileSync(path.join(root, relative));
    writeFileSync(path.join(root, relative), Buffer.concat([original, Buffer.from("\n// changed control input\n")]));
    // Use the unchanged generated form for these controls so the content
    // mutation is the independent reason to refuse.
    reject(name, stock);
    writeFileSync(path.join(root, relative), original);
  }
  write(file, dev + "declare const unexpected: string;\n");
  reject("unexpected_declaration", stock);
  rmSync(absolute);
  reject("missing_declaration", stock);
  write("apps/web_planning/package.json", { name: "controlled-web-planning" });
  write("apps/web_planning/package-lock.json", { lockfileVersion: 3 });
  const webDependency = "apps/web_planning/node_modules/fixture/package.json";
  write(webDependency, { version: "1.0.0" });
  const web = observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-web-planning" });
  inspectGeneratedStockBrowserInputs(root, web);
  write(webDependency, { version: "2.0.0" });
  reject("prepared_web_dependency", () => inspectGeneratedStockBrowserInputs(root, web));
  return { legitimate_owned_output: true, admission_refused_change: true, refusals: refused };
}
