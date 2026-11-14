// Disposable synthetic incident material. No record from this fixture is real
// authority, host accounting, workload execution, or qualification evidence.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { write } from "./local-canonical-improvement.mjs";
import { digest } from "../local-canonical-inputs.mjs";
import { canonicalSerialize, finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { checkoutVerificationFingerprint } from "../local-canonical-checkout-ownership.mjs";
import { gitRevisionInventory } from "../local-canonical-git-observation.mjs";
import { maintenanceTarget, maintenanceAuthorityObservation, MAINTENANCE_KIND, MAINTENANCE_ACCEPT, MAINTENANCE_GRANT } from "../local-canonical-maintenance.mjs";
import { maintenanceMaterial, inspectAttemptRecords, REVIEWED_REVISION_PHASES } from "../local-canonical-attempts.mjs";
import { inspectIntegrationStock } from "../run-local-canonical-verification.mjs";
import { FAILED_INTEGRATION_FIXTURE_CASE } from "../local-canonical-failed-integration-fixture.mjs";
import { registeredFixtureBudget } from "../local-canonical-fixture-budget-witness.mjs";
import {maintenanceAggregateBudgetSource} from "../local-canonical-maintenance-reader-incident.mjs";
import { projectReviewChildResult, REVIEW_CHILD_RESULT_PREFIX } from "./local-canonical-review-child-result.mjs";

const repository=path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const fixturePartitionPaths=[
  "scripts/fixtures/local-canonical-material-source.mjs",
  "scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/run-canonical-test-suite.mjs",
  "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-verification-contract.mjs",
];
const fixtureSourcePaths=[...fixturePartitionPaths,"scripts/local-canonical-attempts.mjs","scripts/local-canonical-receipt.mjs",
  "scripts/run-local-canonical-verification.mjs","scripts/local-canonical-fixture-budget-witness.mjs",
  "scripts/local-canonical-closeout-budgets.mjs",".github/LOCAL_CANONICAL_VERIFICATION.md"].sort();
const groups=["acquisition","material-source","material-controls","material-successor","material-final","material-stock",
  "material-integration-preparation","material-integration-reservation","material-reservation"];
const result=(label,duration_ms=10)=>({label,exit_code:0,signal:null,timed_out:false,cancelled:false,duration_ms,spawn_error_code:null,
  exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit"});
const childResult=(group,timeout=false)=>REVIEW_CHILD_RESULT_PREFIX+JSON.stringify(projectReviewChildResult({...result(group,timeout?15001:5),
  ...(timeout?{exit_code:null,signal:"SIGTERM",timed_out:true,termination_reason:"bounded_timeout"}:{})},{controlId:"reviewed-revision-"+group}));
const cleanup=root=>[{root,completed:true,failure_count:0,failures:[]}];
const addedGroups='"material-stock", "material-integration-preparation", "material-integration-reservation", "material-reservation"';
const previousGroups='"material-stock", "material-reservation"';
const separateBranch=" if(group==='material-integration-preparation'||group==='material-integration-reservation'){\n await materialIntegrationControls(c,h,group==='material-integration-preparation'?'prepare':'admit');unchanged();return;\n }\n";
const stockOnly=" runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();return;\n";
const legacyStock=" runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();\n await materialIntegrationControls(c,h,'prepare');unchanged();return;\n";
const legacyAdmission=" await materialIntegrationControls(c,h,'admit');unchanged();\n";
const admissionMarker=" // A genuinely separate process reobserves stock, then tries the late exact\n";
const replaceOnce=(source,before,after)=>{
  assert.equal(source.split(before).length,2,"synthetic source must retain the exact partition transformation");
  return source.replace(before,after);
};
export function seedFailedIntegrationFixtureSources(c) {
  const sources=new Map(fixturePartitionPaths.map(name=>[name,fs.readFileSync(path.join(repository,name),"utf8")]));
  // These pre-existing incidents and their reader remedy retain 90 seconds.
  // Current 120-second source is not historical execution evidence.
  for(const file of ["scripts/run-canonical-test-suite.mjs","scripts/test-local-canonical-verification-contract.mjs"]){
    const source=sources.get(file);
    if(file.endsWith("run-canonical-test-suite.mjs")?/id: "local-canonical-maintenance"[\s\S]*?timeoutMs: 120_000/u.test(source):source.includes("for(const fragment of ['timeoutMs: 120_000','requireNaturalExit: true','\"scripts/test-local-canonical-maintenance.mjs\"'])"))
      sources.set(file,maintenanceAggregateBudgetSource(file,source,{reverse:true}));
  }
  // Reconstruct only the admitted finite predecessor transformation inside the
  // disposable repository. The accepted repository and retained runs stay read-only.
  for(const [name,source]of sources){
    let before=source;
    if(name===fixturePartitionPaths[0]){
      before=replaceOnce(before,separateBranch,"");
      before=replaceOnce(before,stockOnly,legacyStock);
      before=replaceOnce(before,admissionMarker,legacyAdmission+admissionMarker);
    }else before=replaceOnce(before,name.includes("fixtures/")?addedGroups.replaceAll(", ",","):addedGroups,name.includes("fixtures/")?previousGroups.replaceAll(", ",","):previousGroups);
    write(path.join(c.checkout,name),before);
  }
  const helpers=["scripts/canonical-child-runner.mjs","scripts/fixtures/local-canonical-material-stock-predecessor.mjs"];
  const budgetOwner="scripts/local-canonical-closeout-budgets.mjs";
  for(const helper of [...helpers,budgetOwner])write(path.join(c.checkout,helper),fs.readFileSync(path.join(repository,helper)));
  // These five entries are never parsed or executed by this incident reader.
  // Keep their hash-binding role small and explicit; the actual five-file
  // transformation, registration, budgets and helpers above remain byte exact.
  for(const support of fixtureSourcePaths.filter(name=>!sources.has(name)&&name!==budgetOwner))
    write(path.join(c.checkout,support),`// Disposable synthetic source-map binding only: ${support}\n// Real source SHA-256: ${digest(fs.readFileSync(path.join(repository,support)))}\n`);
  c.git(["add",...fixtureSourcePaths,...helpers]);
  return {sources,helpers};
}

function failedReceipt(successful,log) {
  const value=structuredClone(successful),stop=value.phases.findIndex(p=>p.id==="authority");
  assert.equal(stop,6,"the synthetic incident retains six passes before authority");
  value.phases=value.phases.map((p,i)=>{
    if(i<=stop)return {...p,status:i<stop?"pass":"failure",exit_status:i<stop?0:1,spawn_error_code:null,duration_ms:i<stop?1:16000,browser_use:[],
      failure_code:i<stop?null:"phase_failed",...(i===stop?{log:{relative_path:`.augnes-local-verification/logs/${value.run.id}/authority.log`,bytes:Buffer.byteLength(log),truncated:false}}:{})};
    const {environment_fingerprint,...unused}=p;
    return {...unused,status:"not_run",exit_status:null,failure_code:"phase_not_run",timed_out:false,started_at:null,finished_at:null,duration_ms:null,browser_use:[],
      log:{bytes:0,relative_path:null,truncated:false},cleanup:{completed:false,exit_observed:false,streams_closed:false,termination_reason:null,remaining_owned_processes:null,listener_residue_count:0}};
  });
  Object.assign(value.evidence,{mode:"full",deciding:false,transferable:false});
  value.final={result:"failure",exit_status:1,reason_codes:["phase_failed","selected_phases_incomplete"]};
  value.outcome={disposition:"product_failure",first_fault:null,safety:"preserved_within_observed_scope",validity:"valid_within_observed_scope",execution:"incomplete_or_failed"};
  return finalizeReceipt(value);
}

function inputInventory(c,head,tree,receipt,runtime) {
  const resources=structuredClone(receipt.inputs.resources),git=resources.find(v=>v.id==="git-config"),node=runtime.node;
  for(const [role,id]of [["node","node-executable"],["headers","node-headers"]])Object.assign(resources.find(v=>v.id===id),{location_fingerprint:runtime[role].location_fingerprint,before:structuredClone(runtime[role].observation)});
  const {executable_identity_policy,...observation}=structuredClone(node.observation);
  Object.assign(git,{classification:"execution",gitTracking:{policy:"isolated-current-branches-v1",protected_branches:[digest(c.branch)]},
    before:{...observation,git_projection:{policy:"isolated-current-branches-v1",applicable:true,effective_sha256:digest("synthetic effective Git config"),scope_fingerprint:digest(c.branch)}}});
  const executable={id:"git-executable",classification:"execution",readOnlyExecutable:true,location_fingerprint:digest("synthetic Git executable"),before:structuredClone(node.observation)};
  const existing=resources.findIndex(v=>v.id===executable.id);
  if(existing===-1)resources.push(executable);else resources[existing]=executable;
  const declaration={contract:receipt.inputs.contract,path_kind:receipt.inputs.path_kind,binding:{...structuredClone(receipt.inputs.binding),head,tree,runtime_inputs:structuredClone(runtime)},resources};
  return {...declaration,fingerprint:digest(declaration),checks:1,events:[],first_fault:null,secondary_faults:[],prepared_dependencies:structuredClone(c.syntheticDependencies)};
}

export function createFailedIntegrationMaintenanceFixture({c,successfulReceipt,context,partitionSources,preserveIntegrationInputs=false}) {
  const git=(...args)=>c.git(args).toString().trim(),old=successfulReceipt.attempt;
  const families=path.join(c.anchor,".augnes-local-verification/families"),priorRoot=path.join(families,old.family_id);
  const originalLedger=fs.readFileSync(path.join(priorRoot,"attempt-1.json")),originalCompletion=fs.readFileSync(path.join(priorRoot,"completion-1.json"));
  const priorRegistration=registeredFixtureBudget(args=>c.git(args),old.head,"serial-aggregate"),lines=[];
  for(const group of priorRegistration.groups.slice(0,priorRegistration.groups.indexOf("material-stock")+1)){
    const label=JSON.stringify("reviewed revision controls: "+group),prefix="[canonical:authority] ",duration=group==="material-stock"?15010:10;
    lines.push(`${prefix}child_start label=${label} timeout_ms=${priorRegistration.limits[group].outer}`);
    if(group==="material-stock")lines.push(`${prefix}child_spawn label=${label} pid=42 wait=process_exit`,
      JSON.stringify({material_integration_stage:"prepared",elapsed_ms:10,synthetic_only:true}),JSON.stringify({material_integration_stage:"read_only_refusals",elapsed_ms:20,synthetic_only:true}),
      childResult(group,true),`${prefix}child_exit label=${label} elapsed_ms=15005 exit_code=1 signal=null stdout_closed=true stderr_closed=true`,
      `${prefix}child_cleanup_start label=${label} elapsed_ms=15005 reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true`,
      `${prefix}child_cleanup_result label=${label} elapsed_ms=${duration} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`);
    lines.push(`${prefix}child_result label=${label} duration_ms=${duration} exit_code=${group==="material-stock"?1:0} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`);
  }
  lines.push(JSON.stringify({suite:"authority",resource_cleanup:cleanup(path.join(c.root,"synthetic-authority-owner"))}));
  const log=lines.join("\n")+"\n",runtime=structuredClone(c.inputs),executable="/synthetic/canonical/node",headers="/synthetic/canonical/headers";
  runtime.node.location_fingerprint=digest(executable);runtime.headers.location_fingerprint=digest(headers);runtime.headers.observation.location_fingerprint=digest(headers);
  // The actual material-v7 fixture already binds its integration preparation.
  // Keep that original declaration intact; the new maintenance has its own
  // independently constructed runtime and prepared-input declaration below.
  const input=preserveIntegrationInputs?structuredClone(successfulReceipt.inputs):inputInventory(c,old.head,old.tree,successfulReceipt,runtime);
  const priorAttempt={...structuredClone(old),contract_fingerprint:input.fingerprint};
  if(preserveIntegrationInputs)assert.equal(priorAttempt.contract_fingerprint,old.contract_fingerprint);
  const failed=failedReceipt({...structuredClone(successfulReceipt),attempt:priorAttempt,inputs:input},log);
  const completion={...JSON.parse(originalCompletion),receipt_fingerprint:failed.integrity.content_fingerprint,disposition:"product_failure"};
  const receiptPath=`.augnes-local-verification/receipts/${failed.run.id}.json`,nativePath=failed.phases[6].log.relative_path;
  write(path.join(priorRoot,"attempt-1.json"),priorAttempt);write(path.join(priorRoot,"completion-1.json"),completion);
  write(path.join(c.checkout,receiptPath),failed);write(path.join(c.checkout,nativePath),log);
  for(const [name,source]of partitionSources.sources)write(path.join(c.checkout,name),source);
  c.git(["add",...fixturePartitionPaths]);git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic finite material fixture partition");
  const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}"),clock=Date.now(),at=n=>new Date(clock+n).toISOString();
  assert(Date.parse(failed.run.finished_at)<clock-30,"synthetic source construction supplies ordered past observations");
  const folder=path.join(c.checkout,".augnes-local-verification/failed-integration-maintenance"),file=path.join(folder,"proof.json");
  const ref=(name,value)=>{write(path.join(folder,name),value);return{artifact:name,sha256:digest(fs.readFileSync(path.join(folder,name)))}};
  const f={...c,head,tree,base:failed.repository.base_sha,folder,file,ref,inputs:runtime,failed,priorAttempt,priorRoot,completion,nativePath,log,originalLedger,originalCompletion,
    sourceHead:old.head,sourceTree:old.tree,context,executable,headers,coldReader:fileURLToPath(import.meta.url)};
  f.p={schema:"augnes.local-canonical-source-correction.v2",kind:MAINTENANCE_KIND,incident_case:FAILED_INTEGRATION_FIXTURE_CASE,branch:c.branch,base:f.base,head,tree,pull_request:999,
    prior_family_id:old.family_id,prior_number:1,prior_attempt_id:old.attempt_id,prior_receipt_fingerprint:failed.integrity.content_fingerprint,prior_receipt_path:receiptPath,evidence:null,review:null,authorization:null};
  const source=Object.fromEntries(fixtureSourcePaths.map(name=>[name,digest(c.git(["show",head+":"+name]))]));
  const registration=registeredFixtureBudget(args=>c.git(args),head,"serial-aggregate");
  f.sourceBefore={head:old.head,tree:old.tree,status:"synthetic task-owned snapshot; five unparsed support entries are binding-only placeholders",source,node:"v24.22.1",executable};
  f.sourceAfter={source,unchanged:true};f.registration={group_count:registration.groups.length,groups:registration.groups,limits:registration.limits,old25_preserved:true};
  const owner=JSON.stringify({root:path.join(c.root,"synthetic-shared-reviewed-owner"),device:"1",inode:"1"});
  f.checks=groups.map((group,i)=>{
    const root=path.join(c.root,"synthetic-partition-owner-"+i),env={NODE_ENV:"test",PATH:path.dirname(executable)+path.delimiter+"/usr/bin",AUGNES_CANONICAL_NODE_HEADERS:headers,
      AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT:digest(runtime.headers.observation),TMPDIR:root,AUGNES_CANONICAL_TEMP_ROOT:root,TMP:root,TEMP:root,HOME:path.join(root,"home"),USERPROFILE:path.join(root,"home"),
      AUGNES_RUNTIME_STATE_DIR:path.join(root,"runtime-state"),AUGNES_DB_PATH:path.join(root,"canonical.db")};
    return {group,result:{command:[executable,"--import","tsx","scripts/test-local-canonical-review-corrections.mjs","--reviewed-revision-controls",group,owner],cwd:c.checkout,
      environment_keys:Object.keys(env).sort(),environment_safe_values:env,started_at:at(-29+i*2),finished_at:at(-28+i*2),duration_ms:10,
      registered_inner_ms:registration.limits[group].inner,registered_outer_ms:registration.limits[group].outer,result:result(group),cleanup:cleanup(root),root_absent:true},
      log:childResult(group)+"\n"+JSON.stringify({status:"pass",checks:["reviewed revision controls: "+group],cleanup_complete:true})+"\n"};
  });
  const contractSource=Object.fromEntries(fixturePartitionPaths.map(name=>[name,source[name]]));
  f.contract={kind:"synthetic-focused-contract",started_at:at(-10),finished_at:at(-9),duration_ms:10,
    command:[executable,"--import","tsx","scripts/test-local-canonical-verification-contract.mjs"],timeout_ms:30000,
    result:result("verification and lifecycle contract"),cleanup:cleanup(path.join(c.root,"synthetic-contract-owner")),root_absent:true,source_before:contractSource,source_after:contractSource,
    status:"PASS",refusal:null,new_grants:0,new_deciding_invocations:0};
  f.contractLog='{"status": "pass"}\n[canonical:contract] child_result label="verification and lifecycle contract" duration_ms=10 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n';
  f.partition={source_head:head,source_tree:tree,source_before:null,source_after:null,registration:null,checks:[],contract:null};
  f.fullInputInventory=inputInventory(c,head,tree,successfulReceipt,runtime);
  // The read-only observer freezes resources before an execution contract
  // exists. Its raw empty binding is retained separately from the Full input
  // declaration, whose source/runtime/environment binding remains complete.
  const {prepared_dependencies,...preparedInventory}=structuredClone(f.fullInputInventory);
  preparedInventory.binding={};preparedInventory.checks=0;
  preparedInventory.fingerprint=digest({contract:preparedInventory.contract,path_kind:preparedInventory.path_kind,binding:preparedInventory.binding,resources:preparedInventory.resources});
  preparedInventory.limitations=["bounded polling cannot exclude transient changes between observations","metadata timestamps are not observed write times","cooperative ownership is not hostile-user isolation"];
  f.preparation={schema:"augnes.local-canonical-failed-integration-fixture-preparation.v1",target:maintenanceTarget(f.p),source_head:head,source_tree:tree,
    checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),runtime_inputs:runtime,input_inventory:preparedInventory,inventory_sha256:gitRevisionInventory(preparedInventory),
    dependencies:c.syntheticDependencies.map(v=>v.before),prepared_at:at(-8)};
  f.live={inventory:f.preparation.inventory_sha256,inputInventory:structuredClone(preparedInventory)};
  f.incident={kind:FAILED_INTEGRATION_FIXTURE_CASE,receipt:failed.integrity.content_fingerprint,cause:"UNKNOWN",interrupted_operation:"UNKNOWN",
    authority_log:{artifact:ref("authority.log",log),relative_path:nativePath,bytes:Buffer.byteLength(log),truncated:false},partition:null,preparation:null};
  f.stock={valid_deciding_evidence:false,status:"non_deciding_or_stale",content_fingerprint:failed.integrity.content_fingerprint,
    issues:[...REVIEWED_REVISION_PHASES.slice(6).map(id=>"phase_not_passing:"+id),"receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid"].sort(),
    dimensions:{execution:"incomplete_or_failed",historical_integrity:"intact",evidence_validity:"invalid_or_incomplete",safety:"preserved_within_observed_scope",current_merge_applicability:"matches_observed_context",current_authorization:"authenticated"}};
  f.history={parent_evidence_sha256:old.source_correction.review.sha256,observations:[{id:"failed-reviewed-integration",original:ref("retained-failure.json",failed),adverse:true,limitations:"Synthetic failed6PASS/authorityFAIL/9NOT_RUN; timing and operation remain UNKNOWN."}],
    adverse:["failed-reviewed-integration"],known_index:null,cumulative_cost:"Synthetic earlier commissions, typed authority and one failed reviewed integration retained without reset.",historical_causes:"retained_without_reclassification"};
  f.e={target:maintenanceTarget(f.p),originals:{attempt:ref("prior-attempt.json",priorAttempt),completion:ref("prior-completion.json",completion),receipt:ref("prior-receipt.json",failed),stock:ref("prior-stock.json",f.stock)},
    source:{delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",old.head,head,"--"])),changed_paths:[...fixturePartitionPaths].sort()},repairs:[],inputs:{runtime:ref("runtime.json",runtime),dependencies:ref("dependencies.json",f.preparation.dependencies)},
    history:null,planner:ref("planner.json",{base:f.base,head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["local-canonical-integrity"]}),implementation_actor:"synthetic-implementer",incident:null};
  f.r={target:maintenanceTarget(f.p),evidence_sha256:null,delta_sha256:f.e.source.delta_sha256,reviewer:"synthetic-independent-reviewer",implementation_actor:f.e.implementation_actor,reviewed_at:at(-7),no_write:true,source_review:"complete",disposition:"accept",
    judgments:Object.fromEntries("substantive_repairs all_faults_addressed complete_delta affected_consumers no_weakened_contract complete_adverse_history safe_input_order".split(" ").map(k=>[k,true])),report:null};
  f.rebuild=(authorized=true)=>{
    f.partition.source_before=ref("partition-source-before.json",f.sourceBefore);f.partition.source_after=ref("partition-source-after.json",f.sourceAfter);f.partition.registration=ref("partition-registration.json",f.registration);
    f.partition.checks=f.checks.map(v=>({group:v.group,result:ref(v.group+".json",v.result),log:ref(v.group+".log",v.log)}));
    f.partition.contract={result:ref("contract.json",f.contract),log:ref("contract.log",f.contractLog)};
    f.incident.partition=ref("partition.json",f.partition);f.incident.preparation=ref("preparation.json",f.preparation);f.e.incident=ref("incident.json",f.incident);
    f.e.originals.stock=ref("prior-stock.json",f.stock);f.history.known_index=ref("known-index.json",f.history.observations);f.e.history=ref("history.json",f.history);f.p.evidence=ref("evidence.json",f.e);
    f.r.evidence_sha256=digest(f.e);f.r.report=ref("review.md",`Synthetic independent review ${head} ${f.e.source.delta_sha256} ${digest(f.e)}\n`);f.p.review=ref("review.json",f.r);
    if(authorized){
      const user={login:"synthetic-maintainer",id:33,type:"User"},url="https://api.github.com/repos/hynk-studio/augnes",common={target:maintenanceTarget(f.p),evidence_sha256:digest(f.e),review_sha256:digest(f.r)};
      const acceptance={id:4001,user,author_association:"OWNER",state:"COMMENTED",commit_id:head,pull_request_url:url+"/pulls/999",submitted_at:at(-6),body:MAINTENANCE_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:f.r.report.sha256,scope:MAINTENANCE_KIND})};
      const grant={id:4002,user,author_association:"OWNER",issue_url:url+"/issues/999",created_at:at(-5),updated_at:at(-5),body:MAINTENANCE_GRANT+"\n"+canonicalSerialize({...common,acceptance_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),planner_sha256:f.e.planner.sha256,history_sha256:f.e.history.sha256,terminal_predecessor:f.p.prior_receipt_fingerprint,
        maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_unchanged_bounds"})};
      f.p.authorization={acceptance_review_id:acceptance.id,acceptance_review_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),grant_comment_id:grant.id,grant_comment_sha256:digest(maintenanceAuthorityObservation(grant,"prospective_grant"))};
      const permission={permission:"admin",user},branch=(sha,ref)=>({sha,ref,repo:{full_name:"hynk-studio/augnes"}});
      f.records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,pull_request:{number:999,state:"open",draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(f.base,"main")}};
    }else f.p.authorization=null;
    write(file,f.p);f.proof={...f.p,local_relative_path:path.relative(c.checkout,file)};return f.proof;
  };
  const exclude=path.join(c.checkout,".git/info/exclude"),excludeBytes=fs.readFileSync(exclude);
  write(exclude,Buffer.concat([excludeBytes,Buffer.from("\n.augnes-local-verification/\nnode_modules/\nfixture.tgz\n")]));
  f.restoreExclude=()=>write(exclude,excludeBytes);
  f.transport=()=>({review:async()=>f.records.acceptance,grant:async()=>f.records.grant,permission:async()=>f.records.acceptance_permission,pullRequest:async()=>f.records.pull_request});
  f.material=()=>maintenanceMaterial(c.checkout,f.proof);f.rebuild();
  return f;
}

if(process.argv[2]==="--cold-failed-integration"){
  const packet=JSON.parse(fs.readFileSync(process.argv[3],"utf8")),receipt=packet.receipt;
  let currentAuthorityReads=0;
  const stock=await inspectIntegrationStock({anchorRoot:packet.anchorRoot,repositoryRoot:packet.repositoryRoot,receipt,assertCurrent(){},
    transport:{review:async()=>{currentAuthorityReads++;throw Error("historical failure supplies no current authority");}}});
  assert.equal(stock.currentAttemptRecordsValid,true);assert.equal(currentAuthorityReads,0);
  assert(stock.integrationCurrentIssues.includes("receipt_historical_failed_integration_prefix"));
  assert(stock.integrationCurrentIssues.includes("receipt_integration_current_authorization_unverified"));
  const result=inspectReceiptForDecision(receipt,{...packet.context,...stock});
  assert.equal(result.valid_deciding_evidence,false);assert.equal(result.dimensions.execution,"incomplete_or_failed");
  assert.equal(result.dimensions.evidence_validity,"invalid_or_incomplete");assert.equal(result.dimensions.current_authorization,"unverified");
  const invalid=structuredClone(receipt);invalid.phases.pop();let prefix=false;
  assert.equal(await inspectAttemptRecords({anchorRoot:packet.anchorRoot,repositoryRoot:packet.repositoryRoot,receipt:finalizeReceipt(invalid),onHistoricalPrefix(){prefix=true;}}),false);
  assert.equal(prefix,false);
  assert.equal(inspectReceiptForDecision(finalizeReceipt(invalid),{...packet.context,currentAttemptRecordsValid:false}).valid_deciding_evidence,false);
  console.log(JSON.stringify({failed_integration_cold_prefix:true,current_authority_reads:currentAuthorityReads,malformed_prefix_refused:true,synthetic_only:true}));
}
