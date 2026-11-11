import assert from "node:assert/strict";
import { chmodSync, cpSync, linkSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { gitFixtureDeclaration } from "./local-canonical-git-observation.mjs";
import { verifyGitSourceRepair, MATERIAL_SOURCE_CORRECTION, gitRevisionInventory } from "../local-canonical-git-observation.mjs";
import { REGISTERED_FIXTURE_BUDGET, FIXTURE_BUDGET_CLAIM, FIXTURE_BUDGET_COLLECTOR, FIXTURE_BUDGET_PATHS,
  fixtureBudgetSourceDelta, fixtureBudgetEnvironment, inspectCurrentFixtureBudgetInputs, inspectCurrentIntegrationBudgetInputs,
  fixtureBudgetMeasurementStages } from "../local-canonical-fixture-budget-witness.mjs";
import { observePureContractSource, observePureContractLoader } from "../local-canonical-pure-contract-witness.mjs";
import { inspectGeneratedStockBrowserInputs } from "../local-canonical-stock-lifecycle-witness.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";

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
      delta.groups.map(group=>lifecycle("authority","reviewed revision controls: "+group,group==="serial-aggregate"?40000:group==="serial-material"?75000:30000,10,0,group==="serial-aggregate"?selected:"")).join("")+
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
  for(const changes of [s=>s.replace('assert.equal(result.exit_code, 0, lastChildDiagnostic)','assert.equal(result.exit_code, 1, lastChildDiagnostic)'),s=>s.replace('60000 :','60001 :'),
    s=>s.replace('--reviewed-revision-controls','--substituted-controls')]) {
    write(FIXTURE_BUDGET_PATHS.wrapper,changes(finalSources[FIXTURE_BUDGET_PATHS.wrapper]));const changed=commit("controlled incompatible workload");
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
  rmSync(root,{recursive:true});
  return {contract:REGISTERED_FIXTURE_BUDGET,synthetic_only:true,deciding:false,negative_controls:negatives,source_read_operations:2,distinct_sources:sourceReads.size,
    generated_stock_controls:generatedControls,original_incident_reproduction:false,recursive_parent_execution:false};
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
  const started_at = new Date().toISOString();
  write(file, dev);
  // Complete registered fields in explicitly synthetic records. Checksums
  // provide integrity, never physical attempt authority for this fixture.
  const invocation = "a".repeat(32), environment = digest("synthetic generated declaration environment"), source = witness.after.source;
  const phase = { id: "e2e-project-experience", command: "node scripts/run-canonical-test-suite.mjs e2e-project-experience",
    cwd_scope: "root", exclusive: true, browser: true, base_sha: source.head, head_sha: source.head,
    invocation_id: invocation, environment_fingerprint: environment, status: "pass", exit_status: 0,
    timed_out: false, spawn_error_code: null, failure_code: null, started_at, finished_at: new Date().toISOString(),
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
  reject("outside_writer_window", () => stock({ ...receipt, phases: [{ ...phase, finished_at: new Date(Date.parse(started_at) - 1).toISOString() }] }));
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
