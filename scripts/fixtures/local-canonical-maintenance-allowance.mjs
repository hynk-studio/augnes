// Disposable protocol data and authority only. These controls exercise the
// real preparation/admission/history/receipt owners, never host qualification.
import assert from "node:assert/strict";
import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { observePureContractSource, observePureContractLoader } from "../local-canonical-pure-contract-witness.mjs";
import { beginAttempt, inspectAttemptRecords, inspectGitRevisionPreparation, prepareMaterialSourceRevision, reconstructAttemptTip,
  readSourceCorrectionProof, reviewedRevisionAuthorityObservation } from "../local-canonical-attempts.mjs";
import { inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { verifySettledPhaseFailure } from "../local-canonical-browser-revision.mjs";
import { REVIEWED_REVISION_PHASES } from "../local-canonical-attempts.mjs";
import { MATERIAL_SOURCE_CORRECTION, MATERIAL_HISTORY_BOUNDARY, gitRevisionInventory, maintenanceFixtureAuthorityBindings,
  maintenanceFixtureDelegation, INTEGRATION_BUDGET_LIMIT } from "../local-canonical-git-observation.mjs";
import { REGISTERED_FIXTURE_BUDGET, FIXTURE_BUDGET_CLAIM, MAINTENANCE_FIXTURE_CASE, MAINTENANCE_FIXTURE_GRANT,
  FIXTURE_BUDGET_PATHS, FIXTURE_BUDGET_COLLECTOR, fixtureBudgetSourceDelta, fixtureBudgetEnvironment, maintenanceFixtureBudgetRegistration,
  maintenanceFixtureCompletionNames, registeredFixtureBudget } from "../local-canonical-fixture-budget-witness.mjs";
import * as budgetWitness from "../local-canonical-fixture-budget-witness.mjs";
import { gitFixtureDeclaration } from "./local-canonical-git-observation.mjs";
import { executeFixture, dependencyRecords } from "./local-canonical-browser-successor.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";

const ownerId="local-canonical-maintenance", test="scripts/test-local-canonical-maintenance.mjs", suite=FIXTURE_BUDGET_PATHS.suite;
const clone=structuredClone,now=()=>new Date().toISOString(),decision="Source review decision: ACCEPT / RETAIN for prospective qualification.";
const normal={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,duration_ms:10,termination_reason:"natural_exit",exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0};
function lifecycle(label,duration,timeout=90000) {
  const p="[canonical:fixture-budget-capture] ",l=JSON.stringify(label);
  return `${p}child_start label=${l} timeout_ms=${timeout}\n${p}child_spawn label=${l} pid=1 wait=process_exit\n`+
    `${p}child_exit label=${l} elapsed_ms=${duration-1} exit_code=0 signal=null stdout_closed=true stderr_closed=true\n`+
    `${p}child_cleanup_start label=${l} elapsed_ms=${duration-1} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n`+
    `${p}child_cleanup_result label=${l} elapsed_ms=${duration} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n`+
    `${p}child_result label=${l} duration_ms=${duration} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
}

export async function runMaintenanceAllowanceControls(c,h,sourceRoot) {
  const write=(file,value)=>h.write(path.join(c.checkout,file),value);
  for(const dir of ["app","components","lib","types","apps/augnes_apps/src","apps/augnes_apps/public"])write(dir+"/placeholder.ts","export {};\n");
  for(const file of [test,FIXTURE_BUDGET_COLLECTOR,FIXTURE_BUDGET_PATHS.wrapper,FIXTURE_BUDGET_PATHS.budgets,"scripts/fixtures/local-canonical-improvement.mjs","package.json","package-lock.json","tsconfig.json",
    "scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"])write(file,readFileSync(path.join(sourceRoot,file)));
  const finalSuite=readFileSync(path.join(sourceRoot,suite),"utf8"),oldSuite=finalSuite.replace(/(id: "local-canonical-maintenance"[\s\S]*?timeoutMs:) 90_000/u,"$1 60_000");
  assert.notEqual(oldSuite,finalSuite);write(suite,oldSuite);
  write(".gitignore","node_modules/\n.augnes-local-verification/\nnext-env.d.ts\n");
  for(const name of ["tsx","esbuild","@esbuild"])cpSync(path.join(sourceRoot,"node_modules",name),path.join(c.checkout,"node_modules",name),{recursive:true});
  c.inputs=observeCanonicalRuntimeInputs();c.gitDeclaration=gitFixtureDeclaration(c);
  const packages=dependencyRecords(c,c.checkout);
  for(const file of ["package.json","package-lock.json"])write(file,readFileSync(path.join(sourceRoot,file)));
  const rootDependencies=observePreparedDependencyInputs({repositoryRoot:c.checkout,phaseId:"dependencies-root"});
  packages[0]={phase_id:"dependencies-root",before:rootDependencies,after:rootDependencies,unchanged:true,error:null};
  c.git(["add","."]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","seed direct maintenance protocol data"]);
  c.head=c.git(["rev-parse","HEAD"]).toString().trim();c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.git(["remote","add","origin","https://github.com/hynk-studio/augnes.git"]);c.git(["config",`branch.${c.branch}.remote`,"origin"]);c.git(["config",`branch.${c.branch}.merge`,`refs/heads/${c.branch}`]);
  c.artifacts=path.join(c.checkout,".augnes-local-verification/allowance-controls");c.file=path.join(c.artifacts,"proof.json");
  const ref=(name,value)=>h.artifact(c,name,value),read=reference=>h.read(path.join(c.artifacts,reference.artifact));
  const root=c.prior,prior=root.attempt,baseTime=Date.now()-1000,at=n=>new Date(baseTime+n).toISOString();
  // The ordinary source-revision producer retains genuinely absent commission
  // and delegation roles. The separate controlled receipt below is complete.
  const ordinary={schema:"augnes.local-canonical-source-correction.v2",kind:"source_revision",branch:c.branch,
    prior_family_id:prior.family_id,prior_number:1,prior_attempt_id:prior.attempt_id,prior_receipt_fingerprint:root.integrity.content_fingerprint,
    prior_receipt_path:`.augnes-local-verification/receipts/${prior.attempt_id}.json`,head:c.head,tree:c.tree,defect:"synthetic-value",source_module:"scripts/fixture.mjs",
    fixture_artifact:"ordinary-driver.mjs",fixture_sha256:digest("// Synthetic fixed ordinary regression\n"),environment_fingerprint:digest(c.env)};
  // Ordinary fixture artifact names use their existing finite .mjs grammar.
  ordinary.fixture_artifact="ordinary-driver.mjs";h.write(path.join(c.artifacts,ordinary.fixture_artifact),"// Synthetic fixed ordinary regression\n");ordinary.fixture_sha256=digest(readFileSync(path.join(c.artifacts,ordinary.fixture_artifact)));
  for(const [side,head,exit,i]of [["before",prior.head,1,0],["after",c.head,0,1]]) {
    const source_sha256=digest(c.git(["show",head+":scripts/fixture.mjs"]));
    ordinary[side]={...ref("ordinary-"+side+".json",{fixture_sha256:ordinary.fixture_sha256,environment_fingerprint:ordinary.environment_fingerprint,
      source_sha256,result:{...normal,exit_code:exit},node_version:process.versions.node,finished_at:at(i+1)}),source_sha256};
  }
  ordinary.review=ref("ordinary-review.json",{schema:"augnes.local-canonical-candidate-review.v1",kind:"source_revision",head:c.head,tree:c.tree,
    predecessor_head:prior.head,predecessor_tree:prior.tree,source_review:"complete",reviewed_at:at(3),authority_reference:"https://github.com/hynk-studio/augnes/pull/999",
    delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,c.head,"--"])),changed_paths:c.git(["diff","--name-only",prior.head,c.head,"--"]).toString().trim().split("\n").sort()});
  h.write(c.file,ordinary);const old=readSourceCorrectionProof(c.file,c.checkout);
  const service={status:"installed_stopped",checkout_relation:"exact",service_identity:"sha256:"+digest("controlled service identity"),preservation_valid:true,preservation_binding:digest("controlled service")};
  c.live={inventory:gitRevisionInventory(c.gitDeclaration),service:{state:service,diagnostics:{contract:"augnes.companion-preservation-observation.v2",samples:1,coherent:true,live_identity_valid:true,finished_at:now(),before_binding:service.preservation_binding,after_binding:service.preservation_binding,
    repository_observation_before:"observed",repository_observation_after:"observed",repository_binding_before:digest("controlled repository"),repository_binding_after:digest("controlled repository"),loaded_job:null,material_states:{maintenance_lease_path:"missing",runtime_manifest_path:"missing",runtime_token_path:"missing",runtime_access_path:"missing",runtime_lock_path:"missing"}}}};
  const label=maintenanceFixtureBudgetRegistration(c.git,c.head).label,quoted=JSON.stringify(label);
  const incident=`[canonical:authority] child_start label=${quoted} timeout_ms=60000\n`+
    `[canonical:authority] child_spawn label=${quoted} pid=1 wait=process_exit\n`+
    `[canonical:authority] child_active label=${quoted} elapsed_ms=30000 timeout_ms=60000 exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit\n`+
    `[canonical:authority] child_cleanup_start label=${quoted} elapsed_ms=60000 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n`+
    `[canonical:authority] child_cleanup_result label=${quoted} elapsed_ms=60009 reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n`+
    `[canonical:authority] child_result label=${quoted} duration_ms=60010 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n`+
    JSON.stringify({suite:"authority",resource_cleanup:[{completed:true,failure_count:0,failures:[]}]})+"\ncanonical child failed: suite=authority label="+label+" exit_code=null signal=SIGTERM\n";
  const oldRun="ordinary-maintenance-failure",relative=`.augnes-local-verification/logs/${oldRun}/authority.log`;write(relative,incident);
  const failing={...h,begin:(_subject,_proof,_cap,extra)=>beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:c.head,tree:c.tree,
    runId:oldRun,sourceCorrection:old,...extra}),behavior:async()=>{
      const result=await h.run({suite:"maintenance-allowance-controls",label:"controlled natural predecessor failure",command:process.execPath,args:["-e","process.exitCode=1"],cwd:c.checkout,env:c.env,timeoutMs:5000,stdout:{write(){}},stderr:{write(){}},log(){}});
      return{result,output:"controlled natural failure\n"};},
    prepareInput:input=>{delete input.binding.runtime_inputs;input.resources=input.resources.filter(v=>v.id!=="node-headers");},
    decorateReceipt:r=>{r.integration_base.contract="augnes.local-canonical-integration-base.v2";r.integration_base.base_matches_current_main=false;r.integration_base.observation.sha="f".repeat(40);r.evidence.mode="changed";delete r.inputs.prepared_dependencies;
      r.phases.find(v=>v.id==="authority").log={relative_path:relative,bytes:Buffer.byteLength(incident),truncated:false};},
    fresh:async packet=>{const v=h.read(packet),r=h.read(path.join(c.checkout,".augnes-local-verification/receipts",oldRun+".json"));
      const records=inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r});assert(records);
      h.write(v.stockOutput,inspectReceiptForDecision(r,{...v.stockContext,currentAttemptRecordsValid:records,currentInputStateValid:true}));}};
  const failed=await executeFixture(c,failing,old,null,null,packages);assert.equal(failed.child.result.exit_code,1);assert.equal(failed.stock.valid_deciding_evidence,false);
  console.log(JSON.stringify({maintenance_allowance_predecessor_stock:failed.stock,synthetic_only:true}));
  assert(!Object.hasOwn(failed.receipt.inputs.binding,"runtime_inputs"));assert(!failed.receipt.inputs.resources.some(v=>v.id==="node-headers"));
  const explicitNull=clone(failed.receipt);explicitNull.inputs.binding.runtime_inputs=null;
  verifySettledPhaseFailure(explicitNull,failed.stock,c.inputs,REVIEWED_REVISION_PHASES,explicitNull.inputs.resources.find(v=>v.id==="browser-executable"),false,1,false,true);
  const changedNode=clone(failed.receipt);changedNode.inputs.resources.find(v=>v.id==="node-executable").before.sha256=digest("changed historical node");
  assert.throws(()=>verifySettledPhaseFailure(changedNode,failed.stock,c.inputs,REVIEWED_REVISION_PHASES,changedNode.inputs.resources.find(v=>v.id==="browser-executable"),false,1,false,true));
  c.prior=failed.receipt;const predecessor=c.prior.attempt,priorFolder=path.join(c.anchor,".augnes-local-verification/families",predecessor.family_id);
  assert.equal(predecessor.source_correction.commission,undefined);assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,undefined);
  const retained=["attempt-1.json","completion-1.json"].map(name=>[path.join(priorFolder,name),digest(readFileSync(path.join(priorFolder,name)))]);
  write(suite,finalSuite);c.git(["add",suite]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","controlled measured direct allowance"]);
  c.head=c.git(["rev-parse","HEAD"]).toString().trim();c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.acceptedHead=c.head;c.acceptedTree=c.tree;
  c.git(["update-ref","refs/remotes/origin/main",c.base]);c.git(["update-ref","refs/remotes/origin/"+c.branch,c.head]);
  h.prepare(c);let p=c.proof;Object.assign(p.commission,{source_revision:MATERIAL_SOURCE_CORRECTION,evidence_kind:REGISTERED_FIXTURE_BUDGET,allowance_case:MAINTENANCE_FIXTURE_CASE,maximum_invocations:1});
  p.inputs.predecessor_sha256=digest(c.prior.inputs.resources.filter(v=>["node-executable","node-headers"].includes(v.id)));p.inputs.inventory_sha256=gitRevisionInventory(c.gitDeclaration);p.originals.stock=ref("prior-stock.log",JSON.stringify(failed.stock));
  const oldHead=predecessor.head,registration=maintenanceFixtureBudgetRegistration(c.git,c.head),source=observePureContractSource(c.checkout);
  const names=maintenanceFixtureCompletionNames(c.git,c.head);
  const cases=names.map(name=>({name,status:"pass"})),refusalRows=Array.from({length:30},(_,i)=>({name:"controlled refusal "+i,code:"controlled_refusal"}));
  const output=cases.map(v=>JSON.stringify(v)+"\n").join("")+JSON.stringify({status:"pass",synthetic_only:true,qualification:false,cases,refusals:refusalRows})+"\n";
  await delay(3);const diagnosticStart=now();await delay(3);const diagnosticEnd=now();
  const observer=budgetWitness.MAINTENANCE_TIMING_OBSERVER;
  const collector="// Synthetic parser-control collector: runCanonicalChild\n",stages=["import-start","imports-complete","fixture-start","fixture-complete",...names.map(name=>"case:"+name),"cleanup-start","cleanup-complete"];
  const diagnosticOutput=stages.map((r30_timing,i)=>JSON.stringify({r30_timing,elapsed_ms:i/10})+"\n").join("")+[test,"scripts/fixtures/local-canonical-improvement.mjs"].map(file=>JSON.stringify({r30_source:"file:///synthetic/"+file,sha256:digest(c.git(["show",oldHead+":"+file]))})+"\n").join("")+output;
  const measurement={record:ref("measurement.json",{result:{...normal,duration_ms:100},diagnostic:true,development_only:true,qualification:false,reservation:false,registered_limit_ms:60000,diagnostic_limit_ms:120000,
    collector_sha256:digest(collector),observer_sha256:digest(observer),source_sha256:digest(c.git(["show",oldHead+":"+test])),source_after_sha256:digest(c.git(["show",oldHead+":"+test])),command:[process.execPath,"--import","/synthetic/observer.mjs",test],
    cleanup:[{completed:true,failure_count:0,failures:[]}],log:{bytes:Buffer.byteLength(diagnosticOutput),sha256:digest(diagnosticOutput)},started_at:diagnosticStart,finished_at:diagnosticEnd}),stdout:ref("measurement.log",diagnosticOutput),collector:ref("measurement-collector.log",collector),observer:ref("measurement-observer.log",observer),source_head:oldHead};
  await delay(3);const adverseStart=now();await delay(3);const adverseEnd=now(),stdout=ref("adverse.log",output);
  const adverse=ref("adverse.json",{result:normal,before:{source},after:{source},log:{bytes:Buffer.byteLength(output),sha256:digest(output)},registration,cleanup:[{completed:true,failure_count:0,failures:[]}],started_at:adverseStart,finished_at:adverseEnd});
  const resource=path.join(c.root,"already-settled-direct"),environment=fixtureBudgetEnvironment(resource),loader=observePureContractLoader(c.checkout,environment),dependencies=observePreparedDependencyInputs({repositoryRoot:c.checkout,phaseId:"dependencies-root"});
  await delay(3);const started_at=now(),result=await h.run({suite:"maintenance-allowance-controls",label:"controlled final witness process",command:process.execPath,args:["-e","process.stdout.write('controlled parser data\\n')"],cwd:c.checkout,env:environment,timeoutMs:5000,stdout:{write(){}},stderr:{write(){}},log(){}});await delay(3);
  const after=ref("after.json",{contract:"augnes.registered-fixture-budget-witness.v1",role:"direct",basis:"actual-owned-development-invocation",tested_source_head:c.head,tree:c.tree,dirty:"",command:"node --import tsx "+test,
    source_before:source,source_after:source,environment_before:environment,environment_after:environment,environment:digest(environment),resource_root:resource,result,
    runtime_before:c.inputs,runtime_after:c.inputs,runtime_inputs_sha256:digest(c.inputs),node_version:process.versions.node,input_inventory_before:c.gitDeclaration,input_inventory_after:c.gitDeclaration,
    dependencies_before:dependencies,dependencies_after:dependencies,loader_before:loader,loader_after:loader,
    config:["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(c.git(["show",c.head+":"+file]))})),
    owned_cleanup:[{root:resource,completed:true,failure_count:0,failures:[]}],collector:ref("after-collector.log",readFileSync(path.join(c.checkout,FIXTURE_BUDGET_COLLECTOR),"utf8")),
    lifecycle:ref("after-lifecycle.log",lifecycle("direct registered fixture allowance",result.duration_ms)),stdout:ref("after.log",output),started_at,finished_at:now()});
  const focused={...read(p.focused),finished_at:now(),failed_phase:"authority",diagnosis:"Controlled direct aggregate timeout retains UNKNOWN cause and original complete settlement.",remedy:"Prospective measured allowance preserves all substantive work, assertions, setup bounds and natural settlement without claiming a historical repair.",
    implicated_paths:[suite],source_files:[{path:suite,byte_size:c.git(["show",c.head+":"+suite]).length,sha256:digest(c.git(["show",c.head+":"+suite]))}],input_remedy_resources:[],
    regression:{kind:REGISTERED_FIXTURE_BUDGET,claim:FIXTURE_BUDGET_CLAIM,owner:{phase:"authority",suite:"authority",group:ownerId},incident:{receipt:p.prior_receipt_fingerprint,log:ref("incident.log",incident),log_identity:{relative_path:relative,bytes:Buffer.byteLength(incident),sha256:digest(incident)},cause:"UNKNOWN"},source_partition:fixtureBudgetSourceDelta(c.git,oldHead,c.head,ownerId),
      rationale:{execution_reserve_ms:30000,termination_grace_ms:13000,judgment:"Controlled protocol data tests prospective aggregate evidence without fabricating natural RED, a historical cause or production performance guarantee.",measurement,contradictory_observations:[{record:adverse,stdout,limitations:"Controlled synthetic reader data only; no actual historical execution or performance claim."}]},after},
    commands:[{command:read(after).command,tested_source_head:c.head,result,record:after,stdout:read(after).stdout}]};
  p.focused=ref("focused.json",focused);p.source=ref("source.json",{...read(p.source),reviewed_at:now()});
  const user={login:"synthetic-fixture",id:1,type:"User"},baseAuthority={user,author_association:"OWNER",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999"};await delay(3);
  const delegation={...baseAuthority,id:80,created_at:now(),body:maintenanceFixtureDelegation(p)};delegation.updated_at=delegation.created_at;
  p.commission.delegation={id:80,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};
  const preparation=()=>{const material=clone(p);delete material.authorization;delete material.accepted.review;delete material.local_relative_path;const file=path.join(c.artifacts,"preparation.json");h.write(file,material);return{file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:()=>({...c.live,service:{...c.live.service,diagnostics:{...c.live.service.diagnostics,finished_at:now()}}})};};
  const api={pullRequest:async()=>c.authority.pr,grant:async()=>delegation,permission:async()=>({permission:"admin",user})};
  const args=preparation(),prepared=await prepareMaterialSourceRevision(args,{transport:api});assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);
  const edge=path.join(priorFolder,"correction-successor.json");assert(!existsSync(edge));
  let refusals=0;
  for(const mutate of [q=>q.commission.allowance_case="unknown",q=>q.prior_attempt_id="wrong",q=>q.commission.maximum_invocations=2,q=>q.inputs.inventory_sha256=digest("substituted"),q=>delete q.commission.delegation]) {
    const previous=clone(p);mutate(p);try{assert.throws(()=>inspectGitRevisionPreparation(preparation()));refusals++;}finally{p=previous;}
  }
  for(const mutate of [q=>q.regression.owner.group="serial-aggregate",q=>q.regression.incident.cause="repaired",q=>q.regression.source_partition.after.bound_ms=100000,
    q=>delete q.regression.after,q=>q.regression.rationale.contradictory_observations=[],q=>q.regression.after=ref("incomplete.json",{result})]) {
    const previous=p.focused,bad=clone(focused);mutate(bad);p.focused=ref("negative-focused.json",bad);try{assert.throws(()=>inspectGitRevisionPreparation(preparation()));refusals++;}finally{p.focused=previous;}
  }
  for(const variant of ["substituted-observer","incomplete-completion"]) {
    const previous=p.focused,bad=clone(focused);
    if(variant==="substituted-observer") {
      const record=read(measurement.record),substituted=observer+"\nthrow new Error('changed workload');\n";
      record.observer_sha256=digest(substituted);bad.regression.rationale.measurement={...measurement,record:ref("substituted-measurement.json",record),observer:ref("substituted-observer.log",substituted)};
    } else {
      const record=read(after);record.stdout=ref("incomplete-completion.log",output.split("\n").slice(1).join("\n"));
      bad.regression.after=ref("incomplete-after.json",record);bad.commands[0]={...bad.commands[0],record:bad.regression.after,stdout:record.stdout};
    }
    p.focused=ref("negative-focused.json",bad);try{assert.throws(()=>inspectGitRevisionPreparation(preparation()));refusals++;}finally{p.focused=previous;}
  }
  const savedSuite=readFileSync(path.join(c.checkout,suite),"utf8");
  for(const [file,value]of [[test,readFileSync(path.join(c.checkout,test),"utf8").replace("timeoutMs:10000","timeoutMs:11000")],[suite,savedSuite.replace(/(id: "local-canonical-maintenance"[\s\S]*?timeoutMs:) 90_000/u,"$1 100_000")]]) {
    h.write(path.join(c.checkout,file),value);c.git(["add",file]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","controlled refused scope"]);const changed=c.git(["rev-parse","HEAD"]).toString().trim();assert.throws(()=>fixtureBudgetSourceDelta(c.git,oldHead,changed,ownerId));refusals++;c.git(["reset","--hard",c.head]);
  }
  await delay(3);const bindings=maintenanceFixtureAuthorityBindings(p),review={...c.authority.review,id:81,commit_id:p.head,submitted_at:now(),body:[decision,bindings,MATERIAL_HISTORY_BOUNDARY].join("\n\n")};
  p.accepted.review={id:81,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};await delay(3);
  const grant={...baseAuthority,id:82,created_at:now(),body:[MAINTENANCE_FIXTURE_GRANT,bindings,"Accepted review: https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-81",MATERIAL_HISTORY_BOUNDARY,INTEGRATION_BUDGET_LIMIT].join("\n\n")};grant.updated_at=grant.created_at;
  p.authorization={grant_comment_id:82,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};c.proof=p;c.authority={...c.authority,review,grant,linked:{"repos/hynk-studio/augnes/issues/comments/80":delegation}};
  h.write(c.file,p);const parsed=h.proof(c);assert.throws(()=>h.begin(c,parsed,{observations:{}}),/revision_authenticated_authority_required/);refusals++;
  await assert.rejects(h.auth(c,parsed,v=>({...v,body:v.body+" edited"})));refusals++;
  const capability=await h.auth(c,parsed);c.live.service.diagnostics.finished_at=now();
  let release;const gate=new Promise(resolve=>release=resolve),observeRevision=async()=>{await gate;return{authorization:capability,live:c.live};};
  const assertCurrent=()=>{assert.equal(c.git(["rev-parse","HEAD"]).toString().trim(),p.head);assert.equal(c.git(["status","--porcelain=v1"]).length,0);};
  const raceInput={...c.gitDeclaration,binding:{head:c.head,tree:c.tree,executor_fingerprint:baseReceipt.executor.source_fingerprint,runtime_inputs:c.inputs,
    environment_keys:["AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT","npm_config_nodedir","AUGNES_BROWSER_EXECUTABLE_PATH"],
    phase_environment_fingerprints:REVIEWED_REVISION_PHASES.map(id=>({id,fingerprint:digest(id)}))}};
  const racers=["controlled-first","controlled-contender"].map(runId=>Promise.resolve(h.begin(c,parsed,capability,{runId,observeRevision,assertCurrent,contractFingerprint:digest(raceInput)})));
  release();const settled=await Promise.allSettled(racers),winners=settled.filter(v=>v.status==="fulfilled"),losers=settled.filter(v=>v.status==="rejected");
  assert.equal(winners.length,1);assert.equal(losers.length,1);assert.match(losers[0].reason.code??losers[0].reason.message,/attempt_latest_tip_required|attempt_candidate_superseded|attempt_record_exists|attempt_predecessor_already_corrected|revision_validated_lineage_changed/u);refusals++;
  const full=await executeFixture(c,{...h,begin:()=>winners[0].value,behavior:async()=>({result:await h.run({suite:"maintenance-allowance-controls",label:"controlled complete phase projection",command:process.execPath,args:["-e","process.stdout.write('controlled success\\n')"],cwd:c.checkout,env:c.env,timeoutMs:5000,stdout:{write(){}},stderr:{write(){}},log(){}}),output:"controlled success\n"})},parsed,capability,
    {contract:"augnes.local-canonical-browser-use.v2",executable_name:"synthetic-browser",location_fingerprint:digest("browser-executable"),before:c.inputs.node.observation,after:c.inputs.node.observation,actual_version:"Chrome/1.2.3.4",runtime_versions:{http:"Chrome/1.2.3.4",cdp:"Chrome/1.2.3.4"},disposition:"unchanged",unchanged:true},packages);
  assert.equal(full.stock.valid_deciding_evidence,true);assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,1);
  await assert.rejects(Promise.resolve().then(()=>h.begin(c,parsed,capability,{runId:"replayed"})),/attempt_latest_tip_required|attempt_candidate_superseded/);refusals++;
  for(const [file,sha]of retained)assert.equal(digest(readFileSync(file)),sha);
  const legacyBefore=registeredFixtureBudget(c.git,oldHead,"serial-aggregate"),legacyAfter=registeredFixtureBudget(c.git,c.head,"serial-aggregate");
  assert.deepEqual(legacyAfter.groups,legacyBefore.groups);assert.deepEqual(legacyAfter.limits,legacyBefore.limits);
  console.log(JSON.stringify({maintenance_allowance_controls:{synthetic_only:true,deciding:false,prepared_without_reservation:true,ordinary_predecessor_roles_absent:true,admitted:1,remaining:0,refusals,concurrent_successors:1,fresh_stock:true,predecessor_preserved:true,legacy_serial_registration_unchanged:true}}));
}
