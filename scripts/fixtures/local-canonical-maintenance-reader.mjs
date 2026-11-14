// Controlled synthetic evidence and physical fixture accounting only. Nothing
// here is historical execution, provider authority, profiling or qualification.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {syncBuiltinESMExports} from "node:module";
import {setTimeout as delay} from "node:timers/promises";
import {digest} from "../local-canonical-inputs.mjs";
import {canonicalSerialize,finalizeReceipt,inspectReceiptForDecision} from "../local-canonical-receipt.mjs";
import {beginAttempt,finishAttempt,maintenanceMaterial,prepareMaintenanceCandidate,inspectAttemptRecords,reconstructAttemptTip,REVIEWED_REVISION_PHASES} from "../local-canonical-attempts.mjs";
import {authorizeMaintenance,maintenanceTarget,maintenanceAuthorityObservation,MAINTENANCE_ACCEPT,MAINTENANCE_GRANT} from "../local-canonical-maintenance.mjs";
import {inspectMaintenanceStock} from "../run-local-canonical-verification.mjs";
import {checkoutVerificationFingerprint} from "../local-canonical-checkout-ownership.mjs";
import {physicalFingerprint} from "../local-canonical-verification-context.mjs";
import {gitRevisionInventory} from "../local-canonical-git-observation.mjs";
import {maintenanceFixtureBudgetRegistration,maintenanceFixtureCompletionNames} from "../local-canonical-fixture-budget-witness.mjs";
import {maintenanceReaderRemedyPaths,maintenanceReaderRemedySource,maintenanceReaderProfileLoader,maintenanceReaderProfileObserver,maintenanceReaderProfileTargets,transformMaintenanceReaderProfile} from "../local-canonical-maintenance-reader-observer.mjs";
import {canonicalChildAcceptanceFailure} from "../canonical-child-runner.mjs";
import {artifactReader} from "../local-canonical-improvement.mjs";
import {readFailedMaintenanceReaderIncident} from "../local-canonical-maintenance-reader-incident.mjs";
import {write,completeSyntheticReceipt} from "./local-canonical-improvement.mjs";
import {createFailedIntegrationMaintenanceFixture} from "./local-canonical-failed-integration-maintenance.mjs";
import {runMaintenanceReaderIntegrationFixture} from "./local-canonical-material-source.mjs";

const self=fileURLToPath(import.meta.url),repository=path.resolve(path.dirname(self),"../.."),clone=structuredClone;
const incidentCase="failed-maintenance-reader-immutable-work-v1";
const maintenanceTest="scripts/test-local-canonical-maintenance.mjs",contractTest="scripts/test-local-canonical-verification-contract.mjs";
const natural=(label,duration_ms=1000)=>({label,exit_code:0,signal:null,timed_out:false,cancelled:false,duration_ms,spawn_error_code:null,
  exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit"});
const cleanup=root=>[{root,completed:true,failure_count:0,failures:[]}];
const now=()=>new Date().toISOString();
const read=file=>JSON.parse(fs.readFileSync(file,"utf8"));
const identity=file=>({file,bytes:fs.statSync(file).size,sha256:digest(fs.readFileSync(file))});
function snapshot(folder){
  const files=new Map(),walk=p=>{for(const row of fs.readdirSync(p,{withFileTypes:true})){const file=path.join(p,row.name);if(row.isDirectory())walk(file);else files.set(file,fs.readFileSync(file));}};
  walk(folder);return()=>{fs.rmSync(folder,{recursive:true,force:true});for(const[file,bytes]of files)write(file,bytes);};
}
const transport=records=>({review:async()=>clone(records.acceptance),grant:async()=>clone(records.grant),
  permission:async login=>clone([records.acceptance_permission,records.grant_permission].find(row=>row.user.login===login)),pullRequest:async()=>clone(records.pull_request)});
function request(c,f,extra={}){
  return {anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:f.head,tree:f.tree,acceptedMain:f.base,
    runId:"synthetic-maintenance-reader",sourceCorrection:f.proof,contractFingerprint:f.fullInputInventory.fingerprint,revisionInputs:f.inputs,revisionLive:f.live,assertCurrent(){},...extra};
}
const reserve=(c,f,extra={})=>beginAttempt(request(c,f,{observeRevision:async()=>({authorization:await authorizeMaintenance(f.proof,f.material(),transport(f.records)),live:clone(f.live)}),...extra}));

function watchdog(c,head){
  const registration=maintenanceFixtureBudgetRegistration(args=>c.git(args),head),label=JSON.stringify(registration.label),bound=registration.bound_ms;
  assert.equal(bound,90000);
  return [`[canonical:authority] child_start label=${label} timeout_ms=${bound}`,
    `[canonical:authority] child_spawn label=${label} pid=42 wait=process_exit`,
    `[canonical:authority] child_active label=${label} elapsed_ms=30000 timeout_ms=${bound} exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit`,
    `[canonical:authority] child_cleanup_start label=${label} elapsed_ms=${bound} reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false`,
    `[canonical:authority] child_cleanup_result label=${label} elapsed_ms=${bound+1} reason=bounded_timeout streams_closed=true remaining_owned_processes=0`,
    `[canonical:authority] child_result label=${label} duration_ms=${bound+1} exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout`,
    JSON.stringify({suite:"authority",resource_cleanup:cleanup(path.join(c.root,"synthetic-watchdog-owner"))}),
    "AggregateError: canonical suite execution or cleanup failed",
    `  Error: canonical child timed out: suite=authority label=${registration.label} timeout_ms=${bound}`,
    "    code: 'canonical_child_timeout',",""] .join("\n");
}
function failedMaintenance(successful,log){
  const value=clone(successful),native=`.augnes-local-verification/logs/${value.run.id}/authority.log`;
  value.phases=value.phases.map((row,index)=>{
    if(index<=6)return {...row,status:index<6?"pass":"failure",exit_status:index<6?0:1,spawn_error_code:null,timed_out:false,duration_ms:index<6?1:90001,
      failure_code:index<6?null:"phase_failed",browser_use:[],...(index===6?{log:{relative_path:native,bytes:Buffer.byteLength(log),truncated:false}}:{})};
    const {environment_fingerprint,...rest}=row;
    return {...rest,status:"not_run",exit_status:null,failure_code:"phase_not_run",timed_out:false,started_at:null,finished_at:null,duration_ms:null,browser_use:[],
      log:{bytes:0,relative_path:null,truncated:false},cleanup:{completed:false,exit_observed:false,streams_closed:false,termination_reason:null,remaining_owned_processes:null,listener_residue_count:0}};
  });
  Object.assign(value.evidence,{mode:"full",deciding:false,transferable:false});
  value.final={result:"failure",exit_status:1,reason_codes:["phase_failed","selected_phases_incomplete"]};
  value.outcome={disposition:"product_failure",first_fault:null,safety:"preserved_within_observed_scope",validity:"valid_within_observed_scope",execution:"incomplete_or_failed"};
  return finalizeReceipt(value);
}
function falseStock(receipt){
  return {valid_deciding_evidence:false,status:"non_deciding_or_stale",content_fingerprint:receipt.integrity.content_fingerprint,
    issues:[...REVIEWED_REVISION_PHASES.slice(6).map(id=>"phase_not_passing:"+id),"receipt_attempt_records_unverified","receipt_classified_outcome_not_passing",
      "receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid"].sort(),
    dimensions:{execution:"incomplete_or_failed",historical_integrity:"intact",evidence_validity:"invalid_or_incomplete",safety:"preserved_within_observed_scope",current_merge_applicability:"matches_observed_context",current_authorization:"authenticated"}};
}
function successLog(label,body){
  return `${body}\n[canonical:r15-maintenance-diagnosis] child_result label=${JSON.stringify(label)} duration_ms=1000 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
}
function completeMaintenanceLog(c,head,selectedCount){
  const cases=maintenanceFixtureCompletionNames(args=>c.git(args),head).map(name=>({name,status:"pass"}));
  const refusals=Array.from({length:30},(_,i)=>({name:"controlled core refusal "+i,code:"controlled_refusal"}));
  const selected=Array.from({length:selectedCount},(_,i)=>({name:"controlled selected refusal "+i,code:"controlled_refusal"}));
  return [...cases.map(row=>JSON.stringify(row)),JSON.stringify({failed_integration_maintenance:{synthetic_only:true,evidence_refusals:16,refusal_count:selectedCount,refusals:selected}}),
    JSON.stringify({maintenance_additional_refusals:{synthetic_only:true,refusal_count:1,refusals:[{name:"ordinary empty repairs cannot use selected-case waiver",code:"maintenance_repairs_missing"}]}}),
    JSON.stringify({status:"pass",synthetic_only:true,qualification:false,cases,refusals})].join("\n");
}
function controlledProfile(c,head,before,owner){
  const sourcePaths=["package.json","package-lock.json","apps/augnes_apps/package.json","apps/augnes_apps/package-lock.json","apps/web_planning/package.json","apps/web_planning/package-lock.json",
    ...Object.keys(maintenanceReaderProfileTargets).map(name=>"scripts/"+name),
    "scripts/fixtures/local-canonical-material-source.mjs","scripts/fixtures/local-canonical-reviewed-revision.mjs","scripts/run-canonical-test-suite.mjs",
    "scripts/test-local-canonical-review-corrections.mjs",contractTest,"scripts/local-canonical-attempts.mjs","scripts/local-canonical-receipt.mjs",
    "scripts/local-canonical-closeout-budgets.mjs",".github/LOCAL_CANONICAL_VERIFICATION.md","scripts/canonical-child-runner.mjs",
    "scripts/fixtures/local-canonical-material-stock-predecessor.mjs","scripts/verifier-fixture.mjs","scripts/fixture.mjs"];
  assert.equal(new Set(sourcePaths).size,23);
  const cwd=path.join(owner,"checkout");
  const git=sourcePaths.map((name,index)=>({cwd,args:["--no-replace-objects","show",head+":"+name],count:before&&index<18?2:1,duration_ms:1,immutable_blob:true}));
  git.push({cwd,args:["--no-replace-objects","rev-parse",head+"^{tree}"],count:10,duration_ms:10,immutable_blob:false});
  const counts={ast:before?18:12,syntax:before?9:6,registeredFixtureBudget:before?3:2,partitionSource:1,partitionPositives:1,readFailedIntegrationFixtureIncident:1,readMaintenanceEvidence:1};
  const metrics=Object.fromEntries(Object.entries(counts).map(([name,count])=>[name,{count,duration_ms:count}]));
  const frame={id:2,parent_id:1,name:"readMaintenanceEvidence",operation_id:2};
  const stage={id:1,parent_id:null,name:"failedIntegrationMaintenanceControls",operation_id:null};
  const rows=[{event:"bootstrap",pid:42,node:"v24.22.1",scope:"current process only; cold children remain independent and uninstrumented",elapsed_ms:0},
    {event:"start",...stage,duration_ms:0,child_ms:0,elapsed_ms:10},{event:"start",...frame,duration_ms:0,child_ms:0,elapsed_ms:20},
    {event:"end",...frame,duration_ms:200,child_ms:100,git,metrics,elapsed_ms:220},{event:"end",...stage,duration_ms:240,child_ms:200,elapsed_ms:250},
    {event:"exit",code:0,totals:{...metrics,failedIntegrationMaintenanceControls:{count:1,duration_ms:240}},open_frames:[],elapsed_ms:260}];
  return rows.map(row=>JSON.stringify(row)).join("\n")+"\n";
}
function sample(f,{label,head,file,profile=false,before=false,body}){
  const owner=path.join(f.folder,"synthetic-owner-"+label),source=path.isAbsolute(file)?fs.readFileSync(file):f.git(["show",head+":"+file]);
  const bootstrapName="profile-bootstrap.mjs",bootstrap=path.join(f.folder,bootstrapName),clock=Date.now(),started_at=new Date(clock-11).toISOString();
  const safe={NODE_ENV:"test",PATH:path.dirname(f.executable)+path.delimiter+"/usr/bin",HOME:path.join(owner,"home"),TMPDIR:owner,
    AUGNES_CANONICAL_NODE_HEADERS:f.headers,AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT:digest(f.inputs.headers.observation),
    npm_config_nodedir:path.dirname(path.dirname(f.executable)),AUGNES_CANONICAL_TEMP_ROOT:owner};
  const launch={sample:label,kind:"focused diagnostic only; no deciding invocation",question:"controlled parser and immutable-work evidence fixture",started_at,
    command:profile?[f.executable,"--import",bootstrap,"--import","tsx",file,label]:[f.executable,"--import","tsx",file],cwd:f.checkout,
    timeout_ms:file===maintenanceTest?90000:path.isAbsolute(file)?120000:30000,resource:{root:owner,device:"1",inode:"1"},source:{source_path:file,bytes:source.length,sha256:digest(source)},
    runtime_inputs:clone(f.inputs),environment_keys:Object.keys(safe).sort(),environment_safe_values:safe};
  const result={sample:label,started_at,finished_at:new Date(clock-10).toISOString(),duration_ms:1000,result:natural(label),acceptance_failure:null,cleanup:cleanup(owner),root_absent:true};
  const record={launch:f.ref(label+".launch.json",launch),result:f.ref(label+".result.json",result),log:f.ref(label+".log",successLog(label,body))};
  if(profile){
    record.profile=f.ref(label+".profile.jsonl",controlledProfile(f,head,before,owner));
    record.transforms=f.ref(label+".profile-transform.jsonl",Object.keys(maintenanceReaderProfileTargets).map(name=>{
      const source=f.git(["show",head+":scripts/"+name]).toString(),transformed=transformMaintenanceReaderProfile(name,source);
      return JSON.stringify({url:"file://"+f.checkout+"/scripts/"+name,original_sha256:digest(source),transformed_sha256:digest(transformed.transformed),functions:transformed.functions});
    }).join("\n")+"\n");
  }
  return record;
}

function candidate(c,prior,receipt,context){
  const git=(...args)=>c.git(args).toString().trim();
  for(const file of maintenanceReaderRemedyPaths){
    const source=c.git(["show",prior.head+":"+file]).toString();write(path.join(c.checkout,file),maintenanceReaderRemedySource(file,source));
  }
  c.git(["add",...maintenanceReaderRemedyPaths]);git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","controlled immutable reader remedy");
  const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}"),folder=path.join(c.checkout,".augnes-local-verification/maintenance-reader"),file=path.join(folder,"proof.json");
  const f={...prior,head,tree,folder,file,failed:receipt,context,priorRoot:path.join(c.anchor,".augnes-local-verification/families",receipt.attempt.family_id)};
  f.ref=(name,value)=>{write(path.join(folder,name),value);return{artifact:name,sha256:digest(fs.readFileSync(path.join(folder,name)))}};
  f.p={schema:"augnes.local-canonical-source-correction.v2",kind:"prospective_maintenance",incident_case:incidentCase,branch:c.branch,base:prior.base,head,tree,pull_request:999,
    prior_family_id:receipt.attempt.family_id,prior_number:1,prior_attempt_id:receipt.attempt.attempt_id,prior_receipt_fingerprint:receipt.integrity.content_fingerprint,
    prior_receipt_path:prior.p.prior_receipt_path,evidence:null,review:null,authorization:null};
  f.p.prior_receipt_path=`.augnes-local-verification/receipts/${receipt.run.id}.json`;
  f.stock=falseStock(receipt);
  f.fullInputInventory=clone(prior.fullInputInventory);Object.assign(f.fullInputInventory.binding,{head,tree});
  f.fullInputInventory.fingerprint=digest(Object.fromEntries(["contract","path_kind","binding","resources"].map(key=>[key,f.fullInputInventory[key]])));
  const inventory=clone(prior.preparation.input_inventory);
  f.preparation={schema:"augnes.local-canonical-maintenance-reader-preparation.v1",target:maintenanceTarget(f.p),source_head:head,source_tree:tree,
    checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),runtime_inputs:clone(f.inputs),input_inventory:inventory,inventory_sha256:gitRevisionInventory(inventory),
    dependencies:clone(prior.preparation.dependencies),prepared_at:null};
  f.live={inventory:f.preparation.inventory_sha256,inputInventory:clone(inventory)};
  const loader="profile-loader.mjs",bootstrap="profile-bootstrap.mjs";
  const observer={loader:f.ref(loader,maintenanceReaderProfileLoader(c.checkout)),bootstrap:f.ref(bootstrap,maintenanceReaderProfileObserver(loader))};
  const before=sample(f,{label:"controlled-before",head:prior.head,file:maintenanceTest,profile:true,before:true,body:completeMaintenanceLog(c,prior.head,32)});
  const after=sample(f,{label:"controlled-after",head,file:maintenanceTest,profile:true,body:completeMaintenanceLog(c,head,35)});
  const originals=[path.join(folder,"prior-receipt.json"),path.join(folder,"prior-stock.json"),path.join(f.priorRoot,"attempt-1.json"),path.join(f.priorRoot,"completion-1.json")];
  f.ref("prior-receipt.json",receipt);f.ref("prior-stock.json",f.stock);
  const diagnostic=path.join(folder,"retained-attempt.diagnostic.mjs");
  const diagnosticSource=`import fs from 'node:fs';\nimport assert from 'node:assert/strict';\nimport {inspectAttemptRecords} from ${JSON.stringify(path.join(repository,"scripts/local-canonical-attempts.mjs"))};\nconst receipt=JSON.parse(fs.readFileSync(${JSON.stringify(originals[0])}));\nassert.notEqual(receipt.verification_context.checkout_fingerprint,receipt.checkout_ownership.checkout_fingerprint);\nconst valid=await inspectAttemptRecords({anchorRoot:${JSON.stringify(c.anchor)},repositoryRoot:${JSON.stringify(c.checkout)},receipt});\nassert.equal(valid,true,'failed receipt historical records should replay using checkout-ownership domain');\n`;
  const diagnosticRef=f.ref(path.basename(diagnostic),diagnosticSource);
  const correctnessRow={kind:"single historical attempt-record reader diagnostic; not fresh deciding receipt validation",source_head:head,receipt_fingerprint:receipt.integrity.content_fingerprint,
    current_attempt_records_valid:true,duration_ms:1,original_false_stock_issues:clone(f.stock.issues),originals_unchanged:true,identities:originals.map(identity)};
  const correctness=sample(f,{label:"controlled-reader-correctness",head,file:diagnostic,body:JSON.stringify(correctnessRow)});
  f.remedy={kind:"operation-scoped-immutable-reader-reuse-v1",source_head:head,source_tree:tree,
    delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,head,"--"])),changed_paths:[...maintenanceReaderRemedyPaths],
    work_reduction:{before,after,observer},reader_correctness:{kind:"checkout-ownership-domain-repair",...correctness,fixture:diagnosticRef},
    positives:{maintenance:sample(f,{label:"controlled-maintenance",head,file:maintenanceTest,body:completeMaintenanceLog(c,head,35)}),
      contract:sample(f,{label:"controlled-contract",head,file:contractTest,body:'{"status": "pass"}'})}};
  f.preparation.prepared_at=new Date(Date.now()-5).toISOString();
  f.incident={kind:incidentCase,receipt:receipt.integrity.content_fingerprint,cause:"UNKNOWN",interrupted_operation:"UNKNOWN",
    authority_log:{artifact:f.ref("authority.log",prior.failureLog),relative_path:receipt.phases[6].log.relative_path,bytes:Buffer.byteLength(prior.failureLog),truncated:false},remedy:null,preparation:null};
  const observations=[{id:"failed-selected-maintenance",original:f.ref("retained-failure.json",receipt),adverse:true,limitations:"Synthetic watchdog and operation remain UNKNOWN; no observed timing or speedup."}];
  f.history={parent_evidence_sha256:prior.p.evidence.sha256,observations,adverse:["failed-selected-maintenance"],known_index:null,
    cumulative_cost:"Synthetic six v7 attempts and distinct integration/maintenance grants retained; no count reset.",historical_causes:"retained_without_reclassification"};
  f.e={target:maintenanceTarget(f.p),originals:{attempt:f.ref("prior-attempt.json",fs.readFileSync(originals[2])),completion:f.ref("prior-completion.json",fs.readFileSync(originals[3])),
      receipt:f.ref("prior-receipt.json",receipt),stock:f.ref("prior-stock.json",f.stock)},
    source:{delta_sha256:f.remedy.delta_sha256,changed_paths:[...maintenanceReaderRemedyPaths]},repairs:[],inputs:{runtime:f.ref("runtime.json",f.inputs),dependencies:f.ref("dependencies.json",f.preparation.dependencies)},
    history:null,planner:f.ref("planner.json",{base:f.base,head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["local-canonical-integrity"]}),implementation_actor:"synthetic-implementer",incident:null};
  f.r={target:maintenanceTarget(f.p),evidence_sha256:null,delta_sha256:f.e.source.delta_sha256,reviewer:"synthetic-independent-reviewer",implementation_actor:f.e.implementation_actor,
    reviewed_at:now(),no_write:true,source_review:"complete",disposition:"accept",judgments:Object.fromEntries("substantive_repairs all_faults_addressed complete_delta affected_consumers no_weakened_contract complete_adverse_history safe_input_order".split(" ").map(key=>[key,true])),report:null};
  f.rebuild=(authorized=true)=>{
    f.incident.remedy=f.ref("remedy.json",f.remedy);f.incident.preparation=f.ref("preparation.json",f.preparation);f.e.incident=f.ref("incident.json",f.incident);
    f.e.originals.stock=f.ref("prior-stock.json",f.stock);f.history.known_index=f.ref("known-index.json",f.history.observations);f.e.history=f.ref("history.json",f.history);f.p.evidence=f.ref("evidence.json",f.e);
    f.r.evidence_sha256=digest(f.e);f.r.reviewed_at=new Date(Date.now()-3).toISOString();f.r.report=f.ref("review.md",`Synthetic independent review ${head} ${f.e.source.delta_sha256} ${digest(f.e)}\n`);f.p.review=f.ref("review.json",f.r);
    if(authorized){
      const user={login:"synthetic-maintainer",id:33,type:"User"},url="https://api.github.com/repos/hynk-studio/augnes",common={target:maintenanceTarget(f.p),evidence_sha256:digest(f.e),review_sha256:digest(f.r)};
      const at=Date.now(),acceptance={id:5001,user,author_association:"OWNER",state:"COMMENTED",commit_id:head,pull_request_url:url+"/pulls/999",submitted_at:new Date(at-2).toISOString(),
        body:MAINTENANCE_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:f.r.report.sha256,scope:"prospective_maintenance"})};
      const grant={id:5002,user,author_association:"OWNER",issue_url:url+"/issues/999",created_at:new Date(at-1).toISOString(),updated_at:new Date(at-1).toISOString(),
        body:MAINTENANCE_GRANT+"\n"+canonicalSerialize({...common,acceptance_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),planner_sha256:f.e.planner.sha256,history_sha256:f.e.history.sha256,
          terminal_predecessor:f.p.prior_receipt_fingerprint,maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_unchanged_bounds"})};
      f.p.authorization={acceptance_review_id:5001,acceptance_review_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),grant_comment_id:5002,grant_comment_sha256:digest(maintenanceAuthorityObservation(grant,"prospective_grant"))};
      const permission={permission:"admin",user},branch=(sha,ref)=>({sha,ref,repo:{full_name:"hynk-studio/augnes"}});
      f.records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,pull_request:{number:999,state:"open",draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(f.base,"main")}};
    }else f.p.authorization=null;
    write(file,f.p);f.proof={...f.p,local_relative_path:path.relative(c.checkout,file)};return f.proof;
  };
  f.material=()=>maintenanceMaterial(c.checkout,f.proof);f.rebuild();return f;
}

export async function runMaintenanceReaderControls(c,h){
  const sources=new Map(maintenanceReaderRemedyPaths.map(file=>[file,maintenanceReaderRemedySource(file,fs.readFileSync(path.join(repository,file),"utf8"),{reverse:true})]));
  await runMaintenanceReaderIntegrationFixture(c,h,async({receipt,context,partitionSources})=>{
    let prior;
    try{
      prior=createFailedIntegrationMaintenanceFixture({c:{...c,syntheticDependencies:clone(receipt.inputs.prepared_dependencies)},successfulReceipt:receipt,context,partitionSources,preserveIntegrationInputs:true});
      const {receipt:assembled,context:oldContext}=await completeSyntheticReceipt(prior,extra=>reserve(c,prior,{...extra,contractFingerprint:prior.fullInputInventory.fingerprint}));
      const completed=finalizeReceipt({...assembled,inputs:clone(prior.fullInputInventory),verification_context:{...assembled.verification_context,checkout_fingerprint:physicalFingerprint(c.checkout)},
        checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:prior.preparation.checkout_fingerprint}});
      prior.failureLog=watchdog(c,prior.head);
      const failure=failedMaintenance(completed,prior.failureLog),family=path.join(c.anchor,".augnes-local-verification/families",failure.attempt.family_id),completionFile=path.join(family,"completion-1.json");
      write(completionFile,{...read(completionFile),receipt_fingerprint:failure.integrity.content_fingerprint,disposition:"product_failure",finished_at:now()});
      const receiptFile=path.join(c.checkout,".augnes-local-verification/receipts",failure.run.id+".json");write(receiptFile,failure);write(path.join(c.checkout,failure.phases[6].log.relative_path),prior.failureLog);
      const f=candidate(c,prior,failure,{...oldContext,currentVerificationContext:completed.verification_context,currentCheckoutFingerprint:prior.preparation.checkout_fingerprint});
      const originalFiles=new Map(),capture=folder=>{for(const row of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,row.name);if(row.isDirectory())capture(file);else originalFiles.set(file,fs.readFileSync(file));}};
      capture(prior.folder);for(const file of [receiptFile,completionFile,path.join(family,"attempt-1.json"),path.join(c.checkout,failure.phases[6].log.relative_path)])originalFiles.set(file,fs.readFileSync(file));
      const preserved=()=>{for(const[file,bytes]of originalFiles)assert.deepEqual(fs.readFileSync(file),bytes,"synthetic selected predecessor remains unchanged");};
      const direct=()=>readFailedMaintenanceReaderIncident({p:f.proof,e:f.e,prior:failure.attempt,completion:read(completionFile),receipt:failure,stock:f.stock,
        read:artifactReader(f.folder),git:args=>c.git(["--no-replace-objects",...args]),root:c.checkout,runtime:f.inputs,dependencies:f.preparation.dependencies});
      assert.equal(direct().preparation_sha256,f.incident.preparation.sha256);
      const edge=path.join(f.priorRoot,"correction-successor.json"),noEdge=()=>assert(!fs.existsSync(edge));
      const refusals=[],rejected=async(name,run)=>{let error;await assert.rejects(run,value=>{error=value;return true;});refusals.push({name,code:error.code??error.message});noEdge();preserved();};
      const keys="p e r stock history preparation remedy incident records proof".split(" "),saved=clone(Object.fromEntries(keys.map(key=>[key,f[key]]))),restoreArtifacts=snapshot(f.folder);
      const reset=()=>{restoreArtifacts();for(const key of keys)f[key]=clone(saved[key]);};
      const rewrite=(ref,mutate,json=true)=>{const file=path.join(f.folder,ref.artifact),value=json?read(file):fs.readFileSync(file,"utf8"),next=mutate(value)??value;return f.ref(ref.artifact,next);};
      for(const[name,mutate]of [
        ["UNKNOWN cause preserved",()=>f.incident.cause="explained_timeout"],
        ["UNKNOWN operation preserved",()=>f.incident.interrupted_operation="stock"],
        ["all stock meanings",()=>f.stock.issues.pop()],
        ["same-count stock substitution",()=>{f.stock.issues[0]="substituted_issue";f.stock.issues.sort();}],
        ["stock dimensions preserved",()=>f.stock.dimensions.current_authorization="unverified"],
        ["unrelated incident selector",()=>f.p.incident_case="unrelated-maintenance-incident"],
        ["selected source kind",()=>f.remedy.kind="generic_performance_repair"],
        ["operation-local source target",()=>f.remedy.source_tree=failure.repository.tree_sha],
        ["retained watchdog marker",()=>{
          f.incident.authority_log.artifact=rewrite(f.incident.authority_log.artifact,value=>value.replace("canonical child timed out:","canonical child timed off:"),false);
          const file=path.join(c.checkout,f.incident.authority_log.relative_path),original=fs.readFileSync(file);write(file,fs.readFileSync(path.join(f.folder,f.incident.authority_log.artifact.artifact)));
          return()=>write(file,original);
        }],
        ["closed observer",()=>{f.remedy.work_reduction.observer.bootstrap=rewrite(f.remedy.work_reduction.observer.bootstrap,value=>value+"\nthrow Error('substituted observer');\n",false);}],
        ["complete profile operation",()=>{f.remedy.work_reduction.after.profile=rewrite(f.remedy.work_reduction.after.profile,value=>value.split("\n").filter(line=>!line.includes('"event":"end","id":2')).join("\n"),false);}],
        ["no cross-operation cache claim",()=>{f.remedy.work_reduction.after.profile=rewrite(f.remedy.work_reduction.after.profile,value=>value.replace('"count":1,"duration_ms":1,"immutable_blob":true','"count":2,"duration_ms":1,"immutable_blob":true'),false);}],
        ["source-bound transforms",()=>{f.remedy.work_reduction.after.transforms=rewrite(f.remedy.work_reduction.after.transforms,value=>value.replace(/"transformed_sha256":"[a-f0-9]{64}"/u,'"transformed_sha256":"'+"a".repeat(64)+'"'),false);}],
        ["same-count positive refusal meaning",()=>{
          f.remedy.work_reduction.after.log=rewrite(f.remedy.work_reduction.after.log,value=>value.split("\n").map(line=>{
            if(!line.startsWith("{"))return line;const row=JSON.parse(line);
            if(row.status==="pass"&&Array.isArray(row.cases)){assert.equal(row.refusals.length,30);row.refusals[0].code="substituted_refusal_meaning";}
            return JSON.stringify(row);
          }).join("\n"),false);
        }],
        ["complete plain positive notes",()=>{
          f.remedy.positives.maintenance.log=rewrite(f.remedy.positives.maintenance.log,value=>{
            const lines=value.split("\n"),index=lines.findIndex(line=>{if(!line.startsWith("{"))return false;const row=JSON.parse(line);return typeof row.name==="string"&&row.status==="pass";});
            assert(index>=0);lines.splice(index,1);return lines.join("\n");
          },false);
        }],
        ["complete plain positives",()=>{f.remedy.positives.maintenance.result=rewrite(f.remedy.positives.maintenance.result,value=>{value.result.cleanup_completed=false;});}],
        ["separate reader correctness",()=>{f.remedy.reader_correctness.kind="timeout_cause_repair";}],
        ["raw preparation binding",()=>{f.preparation.input_inventory.binding={head:f.head};f.preparation.input_inventory.fingerprint=digest(Object.fromEntries(["contract","path_kind","binding","resources"].map(key=>[key,f.preparation.input_inventory[key]])));}],
      ]){
        const restore=mutate();let error;try{f.rebuild();direct();}catch(value){error=value;}finally{if(typeof restore==="function")restore();}
        assert(error,name);refusals.push({name,code:error.code??error.message});noEdge();preserved();reset();
      }
      f.rebuild(false);
      const prepare=()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:()=>clone(f.live)});
      const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);noEdge();
      await rejected("absent prospective authority",()=>reserve(c,f));f.rebuild();await delay(3);
      const previousId=f.records.grant.id;f.records.grant.id=prior.records.grant.id;f.proof.authorization.grant_comment_id=prior.records.grant.id;
      f.proof.authorization.grant_comment_sha256=digest(maintenanceAuthorityObservation(f.records.grant,"prospective_grant"));write(f.file,Object.fromEntries(Object.entries(f.proof).filter(([key])=>key!=="local_relative_path")));
      await rejected("spent old maintenance grant",prepare);assert.notEqual(previousId,prior.records.grant.id);reset();
      await rejected("current prepared inventory drift",()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:{...f.live,inventory:"a".repeat(64)}}));
      const sealedLog=path.join(f.folder,f.remedy.work_reduction.after.profile.artifact),sealedBytes=fs.readFileSync(sealedLog);
      try{
        await rejected("evidence drift after authenticated observation",()=>reserve(c,f,{observeRevision:async()=>{
          const authorization=await authorizeMaintenance(f.proof,f.material(),transport(f.records));write(sealedLog,"changed after authority await\n");return{authorization,live:clone(f.live)};
        }}));
      }finally{write(sealedLog,sealedBytes);}
      const restoreLedger=snapshot(path.join(c.anchor,".augnes-local-verification/families"));
      try{
        const original=fs.writeFileSync;fs.writeFileSync=function(file,...args){if(String(file).endsWith("attempt-1.json")&&!originalFiles.has(String(file)))throw Error("synthetic new maintenance interruption");return original(file,...args);};syncBuiltinESMExports();
        try{await assert.rejects(()=>reserve(c,f),/synthetic new maintenance interruption/);}finally{fs.writeFileSync=original;syncBuiltinESMExports();}
        assert(fs.existsSync(edge));assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));await assert.rejects(()=>reserve(c,f));
      }finally{restoreLedger();}
      const {receipt:assembledSuccess,context:successContext}=await completeSyntheticReceipt(f,async extra=>{
        const settled=await Promise.allSettled([reserve(c,f,{...extra,contractFingerprint:f.fullInputInventory.fingerprint}),reserve(c,f,{...extra,contractFingerprint:f.fullInputInventory.fingerprint})]);
        assert.equal(settled.filter(row=>row.status==="fulfilled").length,1);assert.equal(settled.filter(row=>row.status==="rejected").length,1);
        return settled.find(row=>row.status==="fulfilled").value;
      });
      const success=finalizeReceipt({...assembledSuccess,inputs:clone(f.fullInputInventory),verification_context:{...assembledSuccess.verification_context,checkout_fingerprint:physicalFingerprint(c.checkout)},
        checkout_ownership:{...assembledSuccess.checkout_ownership,checkout_fingerprint:f.preparation.checkout_fingerprint}});
      Object.assign(successContext,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:f.preparation.checkout_fingerprint});
      const successCompletion=path.join(c.anchor,".augnes-local-verification/families",success.attempt.family_id,"completion-1.json");write(successCompletion,{...read(successCompletion),receipt_fingerprint:success.integrity.content_fingerprint});
      const packet=path.join(f.folder,"cold-packet.json");write(packet,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,receipt:success,prior:failure,context:successContext,runtime:f.inputs,live:f.live,records:f.records});
      const result=await h.run({suite:"maintenance-reader",label:"selected maintenance cold lineage and stock",command:process.execPath,args:[self,"--cold",packet],cwd:repository,env:c.env,
        timeoutMs:10000,stdout:{write(chunk){process.stdout.write(chunk);}},stderr:process.stderr,log(){}});
      assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true,requireCompleteCleanup:true,timeoutMs:10000}),null);
      await assert.rejects(()=>reserve(c,f));await assert.rejects(prepare);preserved();
      console.log(JSON.stringify({maintenance_reader_controls:{synthetic_only:true,qualification:false,reviewed_ancestry:true,prior_stock_issue_count:f.stock.issues.length,refusals,
        one_shot:true,interruption_consumes:true,competing_successors:1,cold_stock:true,originals_unchanged:true}}));
    }finally{prior?.restoreExclude();}
  },{seedSources(){
    for(const[file,source]of sources)write(path.join(c.checkout,file),source);
    const witness="scripts/local-canonical-fixture-budget-witness.mjs";write(path.join(c.checkout,witness),fs.readFileSync(path.join(repository,witness)));
    c.git(["add",...maintenanceReaderRemedyPaths,witness]);
  }});
}

if(process.argv[2]==="--cold"){
  const packet=read(process.argv[3]),api={anchorRoot:packet.anchor,repositoryRoot:packet.checkout};
  const tip=reconstructAttemptTip({...api,branch:packet.branch});
  assert.equal(tip.attempt_id,packet.receipt.run.id);assert.equal(tip.maintenance_consumed,true);assert.deepEqual(tip.revision_grants,[11,32,62,72]);
  assert.deepEqual(tip.historical_grants.map(row=>row.kind),[...Array(6).fill("reviewed_revision"),"accepted_main_integration","prospective_maintenance","prospective_maintenance"]);
  assert.deepEqual(tip.historical_grants.map(row=>row.grant.id),[11,11,32,32,62,72,3002,4002,5002]);assert(tip.historical_grants.every(row=>row.consumed===1));
  const current=await inspectMaintenanceStock({...api,receipt:packet.receipt,runtimeInputs:packet.runtime,observeCurrentInputs:()=>clone(packet.live),assertCurrent(){},transport:transport(packet.records)});
  assert.equal(current.currentAttemptRecordsValid,true);assert.deepEqual(inspectReceiptForDecision(packet.receipt,{...packet.context,...current}).issues,[]);
  let authorityReads=0;
  const historical=await inspectMaintenanceStock({...api,receipt:packet.prior,runtimeInputs:packet.runtime,assertCurrent(){},transport:{review:async()=>{authorityReads++;throw Error("historical failure gives no current authority");}}});
  assert.equal(historical.currentAttemptRecordsValid,true);assert.equal(authorityReads,0);assert(historical.maintenanceCurrentIssues.includes("receipt_historical_failed_maintenance_prefix"));
  const falseResult=inspectReceiptForDecision(packet.prior,{...packet.context,...historical});assert.equal(falseResult.valid_deciding_evidence,false);assert.equal(falseResult.dimensions.current_authorization,"unverified");
  const malformed=clone(packet.prior);malformed.phases.pop();let wronglyPromoted=false;
  assert.equal(await inspectAttemptRecords({...api,receipt:finalizeReceipt(malformed),onHistoricalPrefix(){wronglyPromoted=true;}}),false);assert.equal(wronglyPromoted,false);
  console.log(JSON.stringify({maintenance_reader_cold:{synthetic_only:true,current_stock:true,typed_history:true,failed_prefix_non_deciding:true,current_authority_reads:authorityReads,malformed_prefix_refused:true}}));
}
