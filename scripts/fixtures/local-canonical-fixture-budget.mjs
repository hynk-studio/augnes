import assert from "node:assert/strict";
import { AUXILIARY_EXECUTION_BUDGETS } from "../local-canonical-closeout-budgets.mjs";
import { chmodSync, cpSync, linkSync, lstatSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { gitFixtureDeclaration } from "./local-canonical-git-observation.mjs";
import { verifyGitSourceRepair, verifyGitRevisionFailure, MATERIAL_SOURCE_CORRECTION, gitRevisionInventory, gitReviewTarget,
  DIRECT_GIT_INPUT_REVISION, DIRECT_GIT_INPUT_HISTORY_BOUNDARY } from "../local-canonical-git-observation.mjs";
import { REGISTERED_FIXTURE_BUDGET, FIXTURE_BUDGET_CLAIM, FIXTURE_BUDGET_COLLECTOR, FIXTURE_BUDGET_PATHS,
  fixtureBudgetSourceDelta, fixtureBudgetEnvironment, inspectCurrentFixtureBudgetInputs, inspectCurrentIntegrationBudgetInputs,
  fixtureBudgetMeasurementStages, SELECTIVE_FIXTURE_WORKLOAD, SELECTIVE_FIXTURE_WORKLOAD_CLAIM,
  SELECTIVE_FIXTURE_PATH, SELECTIVE_FIXTURE_COMMAND, SELECTIVE_FIXTURE_OWNER, SELECTIVE_COVERAGE_OBLIGATIONS,
  selectiveFixtureWorkloadRegistration, selectiveFixtureWorkloadIncident, selectiveFixtureWorkloadSourcePartition,
  verifySelectiveFixtureWorkload, verifySelectiveFixtureWorkloadReport } from "../local-canonical-fixture-budget-witness.mjs";
import { observePureContractSource, observePureContractLoader } from "../local-canonical-pure-contract-witness.mjs";
import { inspectGeneratedStockBrowserInputs } from "../local-canonical-stock-lifecycle-witness.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { validateSelectiveFixtureHistoricalAuthority, validateSelectiveFixtureBaselineAuthority, validateReviewedRevisionAuthorityRecords, REVIEWED_REVISION_PHASES,
  reviewedRevisionAuthorityObservation } from "../local-canonical-attempts.mjs";

// Controlled reader data, explicitly not an actual historical incident or a
// qualification witness. Final real capture/preparation exercise the producer
// separately; these controls never recursively execute the registered parent.
export async function fixtureBudgetWitnessControls(parent,h,sourceRoot) {
  const root=path.join(parent,"fixture-budget-witness");mkdirSync(root);
  const write=(file,value)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),typeof value==="string"?value:JSON.stringify(value));};
  const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024});
  git(["init","--quiet"]);
  for(const dir of ["app","components","lib","scripts","types","apps/augnes_apps/src","apps/augnes_apps/public"])write(dir+"/placeholder.ts","export {};\n");
  write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
  const version=JSON.parse(readFileSync(path.join(sourceRoot,"node_modules/tsx/package.json"))).version;
  write("package.json",{type:"module",dependencies:{tsx:version}});write("package-lock.json",{packages:{"node_modules/tsx":{version}}});write("tsconfig.json",{compilerOptions:{target:"ES2022"}});
  for(const name of ["browser-verification-owners.v1.json","local-canonical-change-owners.v1.json","canonical-research-tests.v1.json"])write("scripts/"+name,{});
  for(const name of ["tsx","esbuild","@esbuild"])cpSync(path.join(sourceRoot,"node_modules",name),path.join(root,"node_modules",name),{recursive:true});
  const finalSources=Object.fromEntries(Object.values(FIXTURE_BUDGET_PATHS).map(file=>[file,readFileSync(path.join(sourceRoot,file),"utf8")]));
  for(const [file,text]of Object.entries(finalSources))write(file,text
    .replace('name === "serial-aggregate" ? AUXILIARY_EXECUTION_BUDGETS.reviewSerialAggregateFixtureMs : ',"")
    .replace('group === "serial-aggregate" ? AUXILIARY_EXECUTION_BUDGETS.reviewSerialAggregateControlMs : ',"")
    .replace(/  reviewSerialAggregate(?:Fixture|Control)Ms: [0-9_]+,\n/gu,""));
  const workloadFile="scripts/fixtures/local-canonical-serial-aggregate.mjs",workloadSource=readFileSync(path.join(sourceRoot,workloadFile),"utf8");
  write(workloadFile,workloadSource);
  write(FIXTURE_BUDGET_COLLECTOR,readFileSync(path.join(sourceRoot,FIXTURE_BUDGET_COLLECTOR),"utf8"));
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
  const generatedControls = generatedDeclarationControls(root, parent, write);
  const selectiveControls = await selectiveFixtureWorkloadControls(parent,h,sourceRoot);
  rmSync(root,{recursive:true});
  return {contract:REGISTERED_FIXTURE_BUDGET,synthetic_only:true,deciding:false,negative_controls:negatives,source_read_operations:2,distinct_sources:sourceReads.size,
    generated_stock_controls:generatedControls,selective_fixture_controls:selectiveControls,original_incident_reproduction:false,recursive_parent_execution:false};
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
