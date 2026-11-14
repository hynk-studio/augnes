// Synthetic parser and physical-ledger controls only. Reuse the checked owned
// reader ancestry; no real incident, timing, authority or qualification is made.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {digest} from "../local-canonical-inputs.mjs";
import {canonicalSerialize,finalizeReceipt,inspectReceiptForDecision} from "../local-canonical-receipt.mjs";
import {beginAttempt,maintenanceMaterial,prepareMaintenanceCandidate,inspectAttemptRecords,reconstructAttemptTip,REVIEWED_REVISION_PHASES} from "../local-canonical-attempts.mjs";
import {authorizeMaintenance,maintenanceTarget,maintenanceAuthorityObservation,MAINTENANCE_ACCEPT,MAINTENANCE_GRANT} from "../local-canonical-maintenance.mjs";
import {inspectMaintenanceStock} from "../run-local-canonical-verification.mjs";
import {physicalFingerprint} from "../local-canonical-verification-context.mjs";
import {observePureContractSource,observePureContractLoader} from "../local-canonical-pure-contract-witness.mjs";
import {fixtureBudgetEnvironment,FIXTURE_BUDGET_COLLECTOR,maintenanceFixtureBudgetRegistration,registeredFixtureBudget} from "../local-canonical-fixture-budget-witness.mjs";
import {MAINTENANCE_AGGREGATE_ALLOWANCE_CASE,readMaintenanceAggregateAllowanceIncident,maintenanceAggregateBudgetSource,maintenanceSequenceBudgetSource,maintenanceSequenceAllowances,maintenanceSequenceRequiredRefusals,maintenanceAggregateBudgetPaths} from "../local-canonical-maintenance-reader-incident.mjs";
import {readImprovementOwnerRegistration} from "../local-canonical-improvement.mjs";
import {canonicalChildAcceptanceFailure} from "../canonical-child-runner.mjs";
import {artifactReader} from "../local-canonical-improvement.mjs";
import {write,completeSyntheticReceipt} from "./local-canonical-improvement.mjs";
import {maintenanceReaderFixtureWatchdog,maintenanceReaderFixtureFailure,maintenanceReaderFixtureStock,maintenanceReaderFixtureLog,
  maintenanceReaderFixtureSample,maintenanceReaderFixtureNatural,maintenanceReaderFixtureCleanup} from "./local-canonical-maintenance-reader.mjs";

const self=fileURLToPath(import.meta.url),repository=path.resolve(path.dirname(self),"../.."),clone=structuredClone;
const suite="scripts/run-canonical-test-suite.mjs",maintenanceTest="scripts/test-local-canonical-maintenance.mjs",contractTest="scripts/test-local-canonical-verification-contract.mjs";
const read=file=>JSON.parse(fs.readFileSync(file,"utf8")),now=()=>new Date().toISOString();
const transport=records=>({review:async()=>clone(records.acceptance),grant:async()=>clone(records.grant),
  permission:async login=>clone([records.acceptance_permission,records.grant_permission].find(row=>row.user.login===login)),pullRequest:async()=>clone(records.pull_request)});
function lifecycle(owner,label,bound,duration){
  const p="[canonical:"+owner+"] ",q=JSON.stringify(label),elapsed=duration-1;
  return `${p}child_start label=${q} timeout_ms=${bound}\n${p}child_spawn label=${q} pid=42 wait=process_exit\n`+
    `${p}child_exit label=${q} elapsed_ms=${elapsed} exit_code=0 signal=null stdout_closed=true stderr_closed=true\n`+
    `${p}child_cleanup_start label=${q} elapsed_ms=${elapsed} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true\n`+
    `${p}child_cleanup_result label=${q} elapsed_ms=${duration} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n`+
    `${p}child_result label=${q} duration_ms=${duration} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
}
const reserve=async(c,f,extra={})=>beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:f.head,tree:f.tree,acceptedMain:f.base,
  runId:f.runId??"synthetic-maintenance-budget",sourceCorrection:f.proof,contractFingerprint:f.fullInputInventory.fingerprint,revisionInputs:f.inputs,revisionLive:f.live,assertCurrent(){},
  observeRevision:async()=>({authorization:await authorizeMaintenance(f.proof,f.material(),transport(f.records)),live:clone(f.live)}),...extra});

function controlledSequence(f,c,head,tree,refusals,{final=false}={}){
  const ids=[...['acquisition','material-source','material-successor','material-final'].map(group=>'local-canonical-reviewed-revision-'+group),'local-canonical-maintenance-reader','local-canonical-maintenance-budget'];
  const source=c.git(['show',head+':'+suite]).toString(),groups=fixtureRegistration(c,head),shared={root:path.join(f.folder,final?'synthetic-final-sequence':'synthetic-retained-sequence'),device:'1',inode:'1'},prefix=final?'sequence-positive':'sequence-measured',clock=Date.now();
  const at=n=>new Date(clock+n).toISOString(),steps=[],results=[],logs={},readerRefusals=Array.from({length:24},(_,i)=>({name:'controlled retained reader refusal '+i,code:'controlled_refusal'}));
  const reader={synthetic_only:true,qualification:false,reviewed_ancestry:true,prior_stock_issue_count:15,refusals:readerRefusals,one_shot:true,interruption_consumes:true,competing_successors:1,cold_stock:true,originals_unchanged:true};
  const budget={synthetic_only:true,qualification:false,reused_checked_reader_ancestry:true,prior_stock_issue_count:14,refusals:clone(refusals),separate_grant:true,one_shot:true,cold_stock:true,failed_prefix_non_deciding:true,originals_unchanged:true,
    ...(final?{continuation:{synthetic_only:true,qualification:false,prepared:true,separate_grant:true,one_shot:true,typed_history:true,failed_aggregate_prefix:true,retained_failed_reader_prefix:true,no_current_authority_promotion:true,originals_unchanged:true,refusals:clone(maintenanceSequenceRequiredRefusals)}}:{})};
  const cold=(key,kinds,label)=>kinds.map(kind=>JSON.stringify({[key]:{kind,...maintenanceReaderFixtureNatural(label+kind)}})).join('\n');
  for(const [i,id]of ids.entries()){
    const owner=i<4?null:readImprovementOwnerRegistration(source,id),group=i<4?id.slice('local-canonical-reviewed-revision-'.length):null;
    const label=i<4?'reviewed revision controls: '+group:owner.label,bound=i<4?groups.limits[group].outer:owner.bound_ms;
    const args=i<4?['--import','tsx','scripts/test-local-canonical-review-corrections.mjs','--reviewed-revision-controls',group,JSON.stringify(shared)]:[...owner.command.slice(1),JSON.stringify(shared)];
    const duration=final||i<4?1000:i===4?72482:85838;
    const body=i<4?JSON.stringify({status:'pass',checks:[label],cleanup_complete:true}):i===4?cold('maintenance_reader_cold_result',['lineage','current','history','malformed'],'selected maintenance cold ')+'\n'+JSON.stringify({maintenance_reader_controls:reader}):
      cold('maintenance_budget_cold_result',['current','history'],'maintenance allowance cold ')+'\n'+JSON.stringify({maintenance_budget_cold_history:{synthetic_only:true,malformed_refused:true,failed_prefix_non_deciding:true,current_authority_reads:0,...(final?{retained_failed_reader_prefix:true}:{})}})+'\n'+JSON.stringify({maintenance_budget_controls:budget});
    const output=body+'\n'+lifecycle('authority',label,bound,duration),file=prefix+'.'+id+'.log';logs[id]=f.ref(file,output);
    steps.push({id,label,command:f.executable,args,timeoutMs:bound,shared:true,...(i<4?{registered_inner_ms:groups.limits[group].inner}:{})});
    results.push({id,source_head:head,command:[f.executable,...args],registered_bound_ms:bound,result:maintenanceReaderFixtureNatural(label,duration),log:{file:path.join(f.folder,file),bytes:Buffer.byteLength(output),sha256:digest(output)}});
  }
  const started_at=at(final?-30:-500000),record={sample:prefix,mode:'reader',head,started_at,finished_at:at(final?-25:-300000),duration_ms:results.reduce((n,row)=>n+row.result.duration_ms,1),results,error:null,cleanup:maintenanceReaderFixtureCleanup(shared.root),all_owned_roots_absent:true,new_real_deciding_invocations:0,
    ...(final?{source_after:{head,tree,dirty:'',suite_source_sha256:digest(source)},runtime_after:clone(f.inputs),input_inventory_before:clone(f.preparation.input_inventory),input_inventory_after:clone(f.preparation.input_inventory),dependencies_before:clone(f.preparation.dependencies),dependencies_after:clone(f.preparation.dependencies),parent_clock_observations:[{id:ids[0],elapsed_ms:0}]}:{})};
  return {refs:{launch:f.ref(prefix+'.launch.json',{kind:'actual registered focused workload only; no real preparation/admission/qualification',sample:prefix,mode:'reader',head,tree,started_at,shared,runtime_inputs:clone(f.inputs),suite_source_sha256:digest(source),steps}),result:f.ref(prefix+'.result.json',record),logs},record};
}
function fixtureRegistration(c,head){return registeredFixtureBudget(c.git,head,'serial-aggregate');}
function candidate(c,saved,packet,failure,completion,{sequence=false,refusals=[]}={}){
  const old=packet.receipt.attempt,oldHead=old.head,git=(...args)=>c.git(args).toString().trim();
  for(const file of maintenanceAggregateBudgetPaths)write(path.join(c.checkout,file),(sequence?maintenanceSequenceBudgetSource:maintenanceAggregateBudgetSource)(file,c.git(["show",oldHead+":"+file]).toString()));
  c.git(["add",...maintenanceAggregateBudgetPaths]);git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","controlled direct maintenance aggregate allowance");
  const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}"),folder=path.join(c.checkout,".augnes-local-verification",sequence?"maintenance-budget-sequence":"maintenance-budget"),file=path.join(folder,"proof.json");
  c.git(["update-ref","refs/remotes/origin/"+c.branch,head]);
  const f={...saved.fixture,checkout:c.checkout,branch:c.branch,head,tree,folder,file,inputs:clone(packet.runtime),git:c.git,...(sequence?{runId:"synthetic-maintenance-sequence"}:{}),
    priorRoot:path.join(c.anchor,".augnes-local-verification/families",old.family_id),syntheticDependencies:clone(packet.receipt.inputs.prepared_dependencies)};
  f.ref=(name,value)=>{write(path.join(folder,name),value);return{artifact:name,sha256:digest(fs.readFileSync(path.join(folder,name)))}};
  f.p={schema:"augnes.local-canonical-source-correction.v2",kind:"prospective_maintenance",incident_case:MAINTENANCE_AGGREGATE_ALLOWANCE_CASE,
    branch:c.branch,base:f.base,head,tree,pull_request:999,prior_family_id:old.family_id,prior_number:1,prior_attempt_id:old.attempt_id,
    prior_receipt_fingerprint:failure.integrity.content_fingerprint,prior_receipt_path:`.augnes-local-verification/receipts/${failure.run.id}.json`,evidence:null,review:null,authorization:null};
  f.stock=maintenanceReaderFixtureStock(failure);f.stock.issues=f.stock.issues.filter(issue=>issue!=="receipt_attempt_records_unverified");assert.equal(f.stock.issues.length,14);
  f.fullInputInventory=clone(saved.fixture.fullInputInventory);Object.assign(f.fullInputInventory.binding,{head,tree});
  f.fullInputInventory.fingerprint=digest(Object.fromEntries(["contract","path_kind","binding","resources"].map(key=>[key,f.fullInputInventory[key]])));
  f.preparation=clone(saved.fixture.preparation);Object.assign(f.preparation,{target:maintenanceTarget(f.p),source_head:head,source_tree:tree,prepared_at:null});
  f.live={inventory:f.preparation.inventory_sha256,inputInventory:clone(f.preparation.input_inventory)};
  f.remedy={source_head:head,source_tree:tree,delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",oldHead,head,"--"])),changed_paths:[...maintenanceAggregateBudgetPaths]};
  if(!sequence){
  const registration=maintenanceFixtureBudgetRegistration(c.git,oldHead),label=registration.label,clock=Date.now(),at=n=>new Date(clock+n).toISOString();
  const measuredOutput=maintenanceReaderFixtureLog(c,oldHead,35)+"\n"+lifecycle("authority",label,90000,89406),measurementLabel="controlled-retained-maintenance";
  const shared={root:path.join(folder,"synthetic-retained-suite"),device:"1",inode:"1"};
  const measurement={launch:f.ref("measurement.launch.json",{kind:"actual registered focused workload only; no real preparation/admission/qualification",sample:measurementLabel,mode:"maintenance",head:oldHead,tree:old.tree,
    started_at:at(-300000),shared,runtime_inputs:clone(f.inputs),suite_source_sha256:digest(c.git(["show",oldHead+":"+suite])),
    steps:[{id:registration.id,label,command:f.executable,args:registration.command.slice(1),timeoutMs:90000,shared:false}]}),
    result:f.ref("measurement.result.json",{sample:measurementLabel,mode:"maintenance",head:oldHead,started_at:at(-300000),finished_at:at(-210580),duration_ms:89420,
      results:[{id:registration.id,source_head:oldHead,command:[f.executable,...registration.command.slice(1)],registered_bound_ms:90000,
        result:maintenanceReaderFixtureNatural(label,89406),log:{file:path.join(folder,"measurement.log"),bytes:Buffer.byteLength(measuredOutput),sha256:digest(measuredOutput)}}],
      error:null,cleanup:maintenanceReaderFixtureCleanup(shared.root),all_owned_roots_absent:true,new_real_deciding_invocations:0}),log:f.ref("measurement.log",measuredOutput)};
  const source=observePureContractSource(c.checkout),resource=path.join(folder,"synthetic-positive-owner"),environment=fixtureBudgetEnvironment(resource,c.env),loader=observePureContractLoader(c.checkout,environment);
  const positiveOutput=maintenanceReaderFixtureLog(c,head,35),positiveLabel="direct registered fixture allowance",result=maintenanceReaderFixtureNatural(positiveLabel);
  f.positive={contract:"augnes.registered-fixture-budget-witness.v1",basis:"actual-owned-development-invocation",role:"direct",command:"node --import tsx "+maintenanceTest,tested_source_head:head,tree,dirty:"",
    source_before:source,source_after:source,environment_before:environment,environment_after:environment,environment:digest(environment),resource_root:resource,result,
    runtime_before:f.inputs,runtime_after:f.inputs,runtime_inputs_sha256:digest(f.inputs),node_version:process.versions.node,input_inventory_before:f.preparation.input_inventory,input_inventory_after:f.preparation.input_inventory,
    dependencies_before:f.preparation.dependencies[0],dependencies_after:f.preparation.dependencies[0],loader_before:loader,loader_after:loader,
    config:["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(c.git(["show",head+":"+file]))})),
    owned_cleanup:maintenanceReaderFixtureCleanup(resource),collector:f.ref("positive-collector.log",c.git(["show",head+":"+FIXTURE_BUDGET_COLLECTOR])),
    lifecycle:f.ref("positive-lifecycle.log",lifecycle("fixture-budget-capture",positiveLabel,120000,result.duration_ms)),stdout:f.ref("positive.log",positiveOutput),started_at:at(-30),finished_at:at(-25)};
  Object.assign(f.remedy,{kind:"registered-maintenance-direct-v1",
    rationale:{measurement,execution_reserve_ms:30000,rounding_ms:10000,judgment:"Controlled retained natural completion plus finite orchestration reserve; historical cause and interrupted operation remain UNKNOWN. No speedup, natural RED or qualification PASS is inferred."},
    positives:{maintenance:null,contract:maintenanceReaderFixtureSample(f,{label:"controlled-budget-contract",head,file:contractTest,body:'{"status": "pass"}'})}});
  }
  if(sequence){
    const measured=controlledSequence(f,c,oldHead,old.tree,refusals),positive=controlledSequence(f,c,head,tree,refusals,{final:true});
    f.positive=positive.record;f.positiveRefs=positive.refs;
    Object.assign(f.remedy,{kind:"registered-maintenance-sequence-v1",rationale:{measurement:measured.refs,execution_reserve_ms:30000,rounding_ms:10000,additional_control_allowance_ms:{reader:maintenanceSequenceAllowances.reader-110000,budget:maintenanceSequenceAllowances.budget-120000},judgment:"Controlled retained complete native owner durations plus the existing finite thirty-second reserve and the explicit additional-control allowance; added seed and deeper reader work require final complete positives. No pure tail, speedup, functional RED or historical cause is inferred."},
      positives:{sequence:positive.refs,contract:maintenanceReaderFixtureSample(f,{label:"controlled-sequence-contract",head,file:contractTest,body:'{"status": "pass"}'})}});
  }
  f.preparation.prepared_at=new Date(Date.now()-5).toISOString();
  f.incident={kind:MAINTENANCE_AGGREGATE_ALLOWANCE_CASE,receipt:failure.integrity.content_fingerprint,cause:"UNKNOWN",interrupted_operation:"UNKNOWN",
    authority_log:{artifact:f.ref("authority.log",fs.readFileSync(path.join(c.checkout,failure.phases[6].log.relative_path))),relative_path:failure.phases[6].log.relative_path,bytes:failure.phases[6].log.bytes,truncated:false},remedy:null,preparation:null};
  const failedId=sequence?"failed-maintenance-allowance":"failed-maintenance-reader";
  const observations=[{id:failedId,original:f.ref("retained-failure.json",failure),adverse:true,limitations:"Synthetic complete settled failure retains all fourteen false-stock meanings; timeout cause and operation stay UNKNOWN."},
    {id:"retained-registered-completion",original:f.remedy.rationale.measurement.result,adverse:false,limitations:"Synthetic parser data represents an earlier registered natural completion, never a causal explanation or a new deciding witness."}];
  f.history={parent_evidence_sha256:old.source_correction.evidence.sha256,observations,adverse:[failedId],known_index:null,cumulative_cost:"All earlier typed grants and consumed attempts remain retained; this separate synthetic grant does not reset them.",historical_causes:"retained_without_reclassification"};
  f.e={target:maintenanceTarget(f.p),originals:{attempt:f.ref("prior-attempt.json",fs.readFileSync(path.join(f.priorRoot,"attempt-1.json"))),
      completion:f.ref("prior-completion.json",fs.readFileSync(path.join(f.priorRoot,"completion-1.json"))),
      receipt:f.ref("prior-receipt.json",fs.readFileSync(path.join(c.checkout,f.p.prior_receipt_path))),stock:null},
    source:{delta_sha256:f.remedy.delta_sha256,changed_paths:[...maintenanceAggregateBudgetPaths]},repairs:[],inputs:{runtime:f.ref("runtime.json",f.inputs),dependencies:f.ref("dependencies.json",f.preparation.dependencies)},history:null,
    planner:f.ref("planner.json",{base:f.base,head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["local-canonical-integrity"]}),implementation_actor:"synthetic-implementer",incident:null};
  f.r={target:maintenanceTarget(f.p),evidence_sha256:null,delta_sha256:f.e.source.delta_sha256,reviewer:"synthetic-independent-reviewer",implementation_actor:f.e.implementation_actor,reviewed_at:null,no_write:true,source_review:"complete",disposition:"accept",
    judgments:Object.fromEntries("substantive_repairs all_faults_addressed complete_delta affected_consumers no_weakened_contract complete_adverse_history safe_input_order".split(" ").map(key=>[key,true])),report:null};
  f.rebuild=(authorized=true)=>{
    if(sequence)f.remedy.positives.sequence={...f.positiveRefs,result:f.ref("sequence-positive.result.json",f.positive)};else f.remedy.positives.maintenance=f.ref("positive.json",f.positive);
    f.incident.remedy=f.ref("remedy.json",f.remedy);f.incident.preparation=f.ref("preparation.json",f.preparation);f.e.incident=f.ref("incident.json",f.incident);
    f.e.originals.stock=f.ref("prior-stock.json",f.stock);f.history.known_index=f.ref("known-index.json",f.history.observations);f.e.history=f.ref("history.json",f.history);f.p.evidence=f.ref("evidence.json",f.e);
    f.r.evidence_sha256=digest(f.e);f.r.reviewed_at=new Date(Date.now()-3).toISOString();f.r.report=f.ref("review.md",`Synthetic independent review ${head} ${f.e.source.delta_sha256} ${digest(f.e)}\n`);f.p.review=f.ref("review.json",f.r);
    if(authorized){
      const user={login:"synthetic-maintainer",id:33,type:"User"},url="https://api.github.com/repos/hynk-studio/augnes",common={target:maintenanceTarget(f.p),evidence_sha256:digest(f.e),review_sha256:digest(f.r)},time=Date.now();
      const acceptance={id:sequence?7001:6001,user,author_association:"OWNER",state:"COMMENTED",commit_id:head,pull_request_url:url+"/pulls/999",submitted_at:new Date(time-2).toISOString(),body:MAINTENANCE_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:f.r.report.sha256,scope:"prospective_maintenance"})};
      const grant={id:sequence?7002:6002,user,author_association:"OWNER",issue_url:url+"/issues/999",created_at:new Date(time-1).toISOString(),updated_at:new Date(time-1).toISOString(),body:MAINTENANCE_GRANT+"\n"+canonicalSerialize({...common,
        acceptance_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),planner_sha256:f.e.planner.sha256,history_sha256:f.e.history.sha256,terminal_predecessor:f.p.prior_receipt_fingerprint,
        maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_reviewed_aggregate_allowance"})};
      f.p.authorization={acceptance_review_id:acceptance.id,acceptance_review_sha256:digest(maintenanceAuthorityObservation(acceptance,"accepted_maintenance")),grant_comment_id:grant.id,grant_comment_sha256:digest(maintenanceAuthorityObservation(grant,"prospective_grant"))};
      const permission={permission:"admin",user},branch=(sha,ref)=>({sha,ref,repo:{full_name:"hynk-studio/augnes"}});
      f.records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,pull_request:{number:999,state:"open",draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(f.base,"main")}};
    }else f.p.authorization=null;
    write(file,f.p);f.proof={...f.p,local_relative_path:path.relative(c.checkout,file)};return f.proof;
  };
  f.material=()=>maintenanceMaterial(c.checkout,f.proof);f.rebuild();return f;
}

function controlledSelectedWatchdog(c,head){
  const source=c.git(['show',head+':'+suite]).toString(),direct=maintenanceFixtureBudgetRegistration(c.git,head),reader=readImprovementOwnerRegistration(source,'local-canonical-maintenance-reader');
  assert.equal(direct.bound_ms,120000);assert.equal(reader.bound_ms,75000);const q=JSON.stringify(reader.label),bound=reader.bound_ms;
  const cold=['lineage','current','history','malformed'].map(kind=>JSON.stringify({maintenance_reader_cold_result:{kind,...maintenanceReaderFixtureNatural('selected maintenance cold '+kind)}}));
  return lifecycle('authority',direct.label,120000,100000)+`[canonical:authority] child_start label=${q} timeout_ms=${bound}\n[canonical:authority] child_spawn label=${q} pid=43 wait=process_exit\n`+cold.join('\n')+'\n'+
    JSON.stringify({maintenance_reader_stage:'cold_validation_complete',elapsed_ms:70000,synthetic_only:true})+'\n'+
    `[canonical:authority] child_cleanup_start label=${q} elapsed_ms=${bound} reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n`+
    `[canonical:authority] child_cleanup_result label=${q} elapsed_ms=${bound+1} reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n`+
    `[canonical:authority] child_result label=${q} duration_ms=${bound+1} exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n`+
    JSON.stringify({suite:'authority',resource_cleanup:maintenanceReaderFixtureCleanup(path.join(c.root,'synthetic-selected-watchdog-owner'))})+'\nAggregateError: canonical suite execution or cleanup failed\n'+
    `  Error: canonical child timed out: suite=authority label=${reader.label} timeout_ms=${bound}\n    code: 'canonical_child_timeout',\n`;
}
function coherentSuccess(c,f,assembled,packet,context){
  const success=finalizeReceipt({...assembled,inputs:clone(f.fullInputInventory),phases:assembled.phases.map(row=>({...row,browser_use:clone(packet.receipt.phases.find(old=>old.id===row.id).browser_use)})),
    verification_context:{...assembled.verification_context,checkout_fingerprint:physicalFingerprint(c.checkout)},checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:f.preparation.checkout_fingerprint}});
  Object.assign(context,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:f.preparation.checkout_fingerprint});
  const file=path.join(c.anchor,'.augnes-local-verification/families',success.attempt.family_id,'completion-1.json');write(file,{...read(file),receipt_fingerprint:success.integrity.content_fingerprint});return success;
}
async function runSequenceControls(c,h,b,packet,originalFailure,preserved,legacyRefusals,stage){
  // B is controlled setup through the accepted receipt/reservation helper, not a
  // second B-current qualification. Its parser refusals above stay verbatim.
  // Common lifecycle assertions below exercise C; historical traversal replays
  // B and A physically. The separate legacy B variant remains callable below.
  const seeded=await completeSyntheticReceipt(b,extra=>reserve(c,b,{...extra,contractFingerprint:b.fullInputInventory.fingerprint}));
  const seededSuccess=coherentSuccess(c,b,seeded.receipt,packet,seeded.context);assert.equal(seededSuccess.attempt.maintenance_authority.observations.prospective_grant.id,6002);
  const log=controlledSelectedWatchdog(c,b.head),failure=maintenanceReaderFixtureFailure(seededSuccess,log);failure.phases[6].duration_ms=200000;
  const failed=finalizeReceipt(failure),family=path.join(c.anchor,'.augnes-local-verification/families',failed.attempt.family_id),completionFile=path.join(family,'completion-1.json'),receiptFile=path.join(c.checkout,'.augnes-local-verification/receipts',failed.run.id+'.json');
  const completion={...read(completionFile),receipt_fingerprint:failed.integrity.content_fingerprint,disposition:'product_failure',finished_at:now()};
  write(completionFile,completion);write(receiptFile,failed);write(path.join(c.checkout,failed.phases[6].log.relative_path),log);
  const originals=[completionFile,receiptFile,path.join(family,'attempt-1.json'),path.join(c.checkout,failed.phases[6].log.relative_path)].map(file=>({file,bytes:fs.readFileSync(file)}));
  const preserveAll=()=>{preserved();for(const row of originals)assert.deepEqual(fs.readFileSync(row.file),row.bytes,'controlled failed B originals stay immutable');};
  const oldPacket={receipt:failed,runtime:b.inputs,records:b.records},saved={fixture:{...b,preparation:clone(b.preparation),fullInputInventory:clone(b.fullInputInventory)}};
  const f=candidate(c,saved,oldPacket,failed,completion,{sequence:true,refusals:legacyRefusals}),edge=path.join(f.priorRoot,'correction-successor.json'),noEdge=()=>assert(!fs.existsSync(edge));
  const options=()=>({p:f.proof,e:f.e,prior:failed.attempt,completion,receipt:failed,stock:f.stock,read:artifactReader(f.folder),git:args=>c.git(['--no-replace-objects',...args]),root:c.checkout,runtime:f.inputs,dependencies:f.preparation.dependencies});
  const direct=()=>readMaintenanceAggregateAllowanceIncident(options());assert.equal(direct().preparation_sha256,f.incident.preparation.sha256);noEdge();stage('sequence_evidence_constructed');
  const savedKeys='p e r stock history preparation remedy incident positive records proof positiveRefs'.split(' '),baseline=clone(Object.fromEntries(savedKeys.map(key=>[key,f[key]]))),reset=()=>{for(const key of savedKeys)f[key]=clone(baseline[key]);f.rebuild();};
  const refusals=[];
  for(const[name,mutate]of [
    ['sequence UNKNOWN cause retained',()=>f.incident.cause='explained_timeout'],
    ['sequence exact false fourteen meanings',()=>{f.stock.issues[0]='substituted_issue';f.stock.issues.sort();}],
    ['sequence selected remedy kind',()=>f.remedy.kind='registered-maintenance-direct-v1'],
    ['sequence immediate exact source tree',()=>f.remedy.source_tree=failed.repository.tree_sha],
    ['sequence both budget paths',()=>f.remedy.changed_paths.pop()],
    ['sequence complete final following owner',()=>f.positive.results.pop()],
    ['sequence complete final cleanup',()=>f.positive.results.at(-1).result.cleanup_completed=false],
    ['sequence unchanged final source',()=>f.positive.source_after.suite_source_sha256='a'.repeat(64)],
    ['sequence final live inventory',()=>f.positive.input_inventory_after.fingerprint='a'.repeat(64)],
    ['sequence raw preparation binding',()=>{f.preparation.input_inventory.binding={head:f.head};f.preparation.input_inventory.fingerprint=digest(Object.fromEntries(['contract','path_kind','binding','resources'].map(key=>[key,f.preparation.input_inventory[key]])));}],
  ]){mutate();f.rebuild();assert.throws(direct,error=>{refusals.push({name,code:error.code??error.message});return true;},name);noEdge();preserveAll();reset();}
  // A corrected predecessor or an incomplete one-owner remedy must refuse the
  // same evidence reader before authority, preparation or reservation.
  for(const[name,head,transform]of [
    ['already corrected predecessor cannot renew',b.head,source=>maintenanceSequenceBudgetSource(suite,source)],
    ['one-owner correction is incomplete',f.head,source=>source.replace('timeoutMs: 110_000','timeoutMs: 75_000')],
  ]){const value=options(),git=value.git;value.git=args=>{const bytes=git(args);return args[0]==='show'&&args[1]===head+':'+suite?Buffer.from(transform(bytes.toString())):bytes;};assert.throws(()=>readMaintenanceAggregateAllowanceIncident(value),error=>{refusals.push({name,code:error.code??error.message});return true;});noEdge();}
  for(const[name,mutate]of [
    ['sequence required refusal omitted',rows=>rows.pop()],
    ['sequence same-count refusal meaning',rows=>rows[0].code='substituted_refusal_meaning'],
  ]){
    const id='local-canonical-maintenance-budget',old=f.positiveRefs.logs[id],output=fs.readFileSync(path.join(f.folder,old.artifact),'utf8').split('\n').map(line=>{
      if(!line.startsWith('{'))return line;const row=JSON.parse(line);if(row.maintenance_budget_controls)mutate(row.maintenance_budget_controls.continuation.refusals);return JSON.stringify(row);
    }).join('\n'),file=name.replaceAll(' ','-')+'.log';
    f.positiveRefs.logs[id]=f.ref(file,output);Object.assign(f.positive.results.at(-1).log,{file:path.join(f.folder,file),bytes:Buffer.byteLength(output),sha256:digest(output)});f.rebuild();
    assert.throws(direct,error=>{refusals.push({name,code:error.code??error.message});return true;},name);noEdge();preserveAll();reset();
  }
  assert.deepEqual(refusals,maintenanceSequenceRequiredRefusals,'all required C refusal meanings are observed exactly');
  stage('sequence_evidence_refusals_complete');
  f.rebuild(false);const prepare=()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:()=>clone(f.live)});
  const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);noEdge();
  await assert.rejects(()=>reserve(c,f));noEdge();reset();
  await assert.rejects(()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:{...f.live,inventory:'a'.repeat(64)}}));noEdge();
  f.records.grant.id=b.records.grant.id;f.p.authorization.grant_comment_id=b.records.grant.id;f.p.authorization.grant_comment_sha256=digest(maintenanceAuthorityObservation(f.records.grant,'prospective_grant'));
  write(f.file,f.p);f.proof={...f.p,local_relative_path:path.relative(c.checkout,f.file)};await assert.rejects(prepare,error=>error.code==='maintenance_grant_reused');noEdge();reset();
  stage('sequence_preparation_and_authority_refusals_complete');
  const settled=await completeSyntheticReceipt(f,extra=>reserve(c,f,{...extra,contractFingerprint:f.fullInputInventory.fingerprint})),success=coherentSuccess(c,f,settled.receipt,packet,settled.context);
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});assert.equal(tip.attempt_id,success.run.id);assert.equal(tip.maintenance_consumed,true);
  assert.deepEqual(tip.historical_grants.slice(-4).map(row=>row.grant.id),[4002,5002,6002,7002]);assert(tip.historical_grants.every(row=>row.consumed===1));stage('sequence_typed_lineage_complete');
  const aFiles=[path.join(b.priorRoot,'attempt-1.json'),path.join(b.priorRoot,'completion-1.json'),path.join(c.checkout,b.p.prior_receipt_path),path.join(c.checkout,originalFailure.phases[6].log.relative_path)];
  const older={receipt:originalFailure,stock:b.stock,originals:aFiles.map(file=>({file,bytes:fs.statSync(file).size,sha256:digest(fs.readFileSync(file))}))};
  const cold=path.join(f.folder,'cold-packet.json');write(cold,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,receipt:success,prior:failed,context:settled.context,runtime:f.inputs,live:f.live,records:f.records,older});
  for(const kind of ['current','history']){stage('cold_'+kind+'_start');const result=await h.run({suite:'maintenance-budget',label:'maintenance allowance cold '+kind,command:process.execPath,args:[self,'--cold-maintenance-budget',cold,kind],cwd:repository,env:c.env,timeoutMs:20000,stdout:{write(chunk){process.stdout.write(chunk);}},stderr:process.stderr,log(){}});
    console.log(JSON.stringify({maintenance_budget_cold_result:{kind,...result}}));assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true,requireCompleteCleanup:true,timeoutMs:20000}),null);stage('cold_'+kind+'_complete');}
  await assert.rejects(()=>reserve(c,f));preserveAll();
  console.log(JSON.stringify({maintenance_budget_controls:{synthetic_only:true,qualification:false,reused_checked_reader_ancestry:true,prior_stock_issue_count:14,refusals:legacyRefusals,separate_grant:true,one_shot:true,cold_stock:true,failed_prefix_non_deciding:true,originals_unchanged:true,
    continuation:{synthetic_only:true,qualification:false,prepared:true,separate_grant:true,one_shot:true,typed_history:true,failed_aggregate_prefix:true,retained_failed_reader_prefix:true,no_current_authority_promotion:true,originals_unchanged:true,refusals}}}));
}

export async function runMaintenanceBudgetControls(c,h,saved){
  const started=performance.now(),stage=name=>console.log(JSON.stringify({maintenance_budget_stage:name,elapsed_ms:Math.round(performance.now()-started),synthetic_only:true}));
  assert(path.isAbsolute(saved.packet)&&saved.packet.startsWith(c.checkout+path.sep));
  assert.equal(saved.snapshot.root,path.join(h.sharedRoot,"maintenance-reader-retained"));
  // The previous owner has completed its original cleanup. Restore only this
  // retained synthetic state at the same checkout path/root, using its existing
  // immutable Git objects. No ancestry setup or deciding work is repeated.
  c.git(["reset","--hard",saved.fixture.head]);c.git(["update-ref","refs/remotes/origin/main",saved.fixture.base]);
  fs.cpSync(path.join(saved.snapshot.root,"families"),path.join(c.anchor,".augnes-local-verification/families"),{recursive:true,preserveTimestamps:true});
  fs.cpSync(path.join(saved.snapshot.root,"proofs"),path.join(c.checkout,".augnes-local-verification"),{recursive:true,preserveTimestamps:true});
  write(path.join(c.checkout,".git/info/exclude"),saved.snapshot.exclude);
  for(const[index,dir]of ["","apps/augnes_apps","apps/web_planning"].entries()){
    const target=path.join(c.checkout,dir,"node_modules");assert(!fs.existsSync(target));fs.renameSync(path.join(saved.snapshot.root,"dependencies-"+index),target);
  }
  const packet=read(saved.packet);assert.equal(packet.receipt.repository.head_sha,saved.fixture.head);assert.equal(c.git(["rev-parse","HEAD"]).toString().trim(),saved.fixture.head);
  stage("ancestry_restored");
  const log=maintenanceReaderFixtureWatchdog(c,saved.fixture.head),failure=maintenanceReaderFixtureFailure(packet.receipt,log);
  const family=path.join(c.anchor,".augnes-local-verification/families",failure.attempt.family_id),completionFile=path.join(family,"completion-1.json"),receiptFile=path.join(c.checkout,".augnes-local-verification/receipts",failure.run.id+".json");
  assert.notEqual(receiptFile,path.join(c.checkout,failure.attempt.source_correction.prior_receipt_path),"synthetic invocations retain distinct original receipt paths");
  const completion={...read(completionFile),receipt_fingerprint:failure.integrity.content_fingerprint,disposition:"product_failure",finished_at:now()};
  write(completionFile,completion);write(receiptFile,failure);write(path.join(c.checkout,failure.phases[6].log.relative_path),log);
  const originals=new Map([completionFile,receiptFile,path.join(family,"attempt-1.json"),path.join(c.checkout,failure.phases[6].log.relative_path)].map(file=>[file,fs.readFileSync(file)]));
  const preserved=()=>{for(const[file,bytes]of originals)assert.deepEqual(fs.readFileSync(file),bytes,"synthetic failed reader originals stay immutable");};
  const f=candidate(c,saved,packet,failure,completion),edge=path.join(f.priorRoot,"correction-successor.json"),noEdge=()=>assert(!fs.existsSync(edge));
  const direct=()=>readMaintenanceAggregateAllowanceIncident({p:f.proof,e:f.e,prior:failure.attempt,completion,receipt:failure,stock:f.stock,read:artifactReader(f.folder),
    git:args=>c.git(["--no-replace-objects",...args]),root:c.checkout,runtime:f.inputs,dependencies:f.preparation.dependencies});
  assert.equal(direct().preparation_sha256,f.incident.preparation.sha256);noEdge();
  const keys="p e r stock history preparation remedy incident positive records proof".split(" "),baseline=clone(Object.fromEntries(keys.map(key=>[key,f[key]]))),reset=()=>{for(const key of keys)f[key]=clone(baseline[key]);f.rebuild();};
  const refusals=[];
  for(const[name,mutate]of [
    ["UNKNOWN cause retained",()=>f.incident.cause="explained_timeout"],
    ["UNKNOWN operation retained",()=>f.incident.interrupted_operation="maintenance"],
    ["exact fourteen stock meanings",()=>{f.stock.issues[0]="substituted_issue";f.stock.issues.sort();}],
    ["old fifteen-issue defect is not carried forward",()=>f.stock.issues.push("receipt_attempt_records_unverified")],
    ["selected allowance kind",()=>f.remedy.kind="operation-scoped-immutable-reader-reuse-v1"],
    ["exact budget-only source tree",()=>f.remedy.source_tree=failure.repository.tree_sha],
    ["complete budget-only paths",()=>f.remedy.changed_paths.pop()],
    ["measured reserve",()=>f.remedy.rationale.execution_reserve_ms=0],
    ["retained sample source",()=>f.remedy.rationale.measurement.launch=f.ref("wrong-measurement.launch.json",{...read(path.join(f.folder,f.remedy.rationale.measurement.launch.artifact)),head:f.head})],
    ["complete final natural result",()=>f.positive.result.cleanup_completed=false],
    ["final registered deadline",()=>f.positive.lifecycle=f.ref("wrong-positive-lifecycle.log",lifecycle("fixture-budget-capture","direct registered fixture allowance",90000,f.positive.result.duration_ms))],
    ["raw preparation binding",()=>{f.preparation.input_inventory.binding={head:f.head};f.preparation.input_inventory.fingerprint=digest(Object.fromEntries(["contract","path_kind","binding","resources"].map(key=>[key,f.preparation.input_inventory[key]])));}],
  ]){
    mutate();f.rebuild();let error;try{direct();}catch(value){error=value;}assert(error,name);refusals.push({name,code:error.code??error.message});noEdge();preserved();reset();
  }
  stage("evidence_refusals_complete");
  if(!h.legacyBudget){await runSequenceControls(c,h,f,packet,failure,preserved,refusals,stage);return;}
  f.rebuild(false);const prepare=async()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:()=>clone(f.live)});
  const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);noEdge();
  stage("non_reserving_preparation_complete");
  await assert.rejects(()=>reserve(c,f));noEdge();reset();
  await assert.rejects(async()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:{...f.live,inventory:"a".repeat(64)}}));noEdge();
  f.records.grant.id=packet.records.grant.id;f.p.authorization.grant_comment_id=packet.records.grant.id;f.p.authorization.grant_comment_sha256=digest(maintenanceAuthorityObservation(f.records.grant,"prospective_grant"));
  write(f.file,f.p);f.proof={...f.p,local_relative_path:path.relative(c.checkout,f.file)};await assert.rejects(prepare,error=>error.code==="maintenance_grant_reused");noEdge();reset();
  stage("authority_and_input_refusals_complete");
  const {receipt:assembled,context}=await completeSyntheticReceipt(f,extra=>reserve(c,f,{...extra,contractFingerprint:f.fullInputInventory.fingerprint}));
  const success=finalizeReceipt({...assembled,inputs:clone(f.fullInputInventory),phases:assembled.phases.map(row=>({...row,browser_use:clone(packet.receipt.phases.find(old=>old.id===row.id).browser_use)})),
    verification_context:{...assembled.verification_context,checkout_fingerprint:physicalFingerprint(c.checkout)},checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:f.preparation.checkout_fingerprint}});
  Object.assign(context,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:f.preparation.checkout_fingerprint});
  const successCompletion=path.join(c.anchor,".augnes-local-verification/families",success.attempt.family_id,"completion-1.json");write(successCompletion,{...read(successCompletion),receipt_fingerprint:success.integrity.content_fingerprint});
  stage("successor_settled");
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});assert.equal(tip.attempt_id,success.run.id);assert.equal(tip.maintenance_consumed,true);
  assert.deepEqual(tip.historical_grants.slice(-3).map(row=>row.grant.id),[4002,5002,6002]);assert(tip.historical_grants.every(row=>row.consumed===1));
  stage("typed_lineage_complete");
  const cold=path.join(f.folder,"cold-packet.json");write(cold,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,receipt:success,prior:failure,context,runtime:f.inputs,live:f.live,records:f.records});
  for(const kind of ["current","history"]){
    stage("cold_"+kind+"_start");
    const result=await h.run({suite:"maintenance-budget",label:"maintenance allowance cold "+kind,command:process.execPath,args:[self,"--cold-maintenance-budget",cold,kind],cwd:repository,env:c.env,timeoutMs:20000,
      stdout:{write(chunk){process.stdout.write(chunk);}},stderr:process.stderr,log(){}});
    console.log(JSON.stringify({maintenance_budget_cold_result:{kind,...result}}));assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true,requireCompleteCleanup:true,timeoutMs:20000}),null);
    stage("cold_"+kind+"_complete");
  }
  await assert.rejects(()=>reserve(c,f));preserved();
  console.log(JSON.stringify({maintenance_budget_controls:{synthetic_only:true,qualification:false,reused_checked_reader_ancestry:true,prior_stock_issue_count:14,refusals,
    separate_grant:true,one_shot:true,cold_stock:true,failed_prefix_non_deciding:true,originals_unchanged:true}}));
}

// The imported reader fixture owns --cold. This distinct entry invokes only
// this case's independent reader, rather than also executing the imported CLI.
if(process.argv[2]==="--cold-maintenance-budget"){
  const packet=read(process.argv[3]),api={anchorRoot:packet.anchor,repositoryRoot:packet.checkout},kind=process.argv[4];assert(["current","history"].includes(kind));
  if(kind==="current"){
    // One fresh physical/current inspection; no duplicate lineage traversal.
    const current=await inspectMaintenanceStock({...api,receipt:packet.receipt,runtimeInputs:packet.runtime,observeCurrentInputs:()=>clone(packet.live),assertCurrent(){},transport:transport(packet.records)});
    assert.equal(current.currentAttemptRecordsValid,true);assert.deepEqual(inspectReceiptForDecision(packet.receipt,{...packet.context,...current}).issues,[]);
    console.log(JSON.stringify({maintenance_budget_cold_current:{synthetic_only:true,current_stock:true}}));
  }else{
    const malformed=clone(packet.prior);malformed.attempt.source_correction.incident_case="unrelated-maintenance-incident";let promoted=false;
    assert.equal(await inspectAttemptRecords({...api,receipt:finalizeReceipt(malformed),onHistoricalPrefix(){promoted=true;}}),false);assert.equal(promoted,false);
    if(packet.older){
      const older=packet.older;
      // inspectMaintenanceStock(B) below traverses the original B proof and A
      // through the physical lineage. Check A's exact retained bytes and false
      // meanings here, without claiming a separate fresh B-current PASS or
      // repeating a second complete historical stock traversal.
      for(const row of older.originals){const bytes=fs.readFileSync(row.file);assert.equal(bytes.length,row.bytes);assert.equal(digest(bytes),row.sha256);}
      assert.equal(older.receipt.attempt.source_correction.incident_case,'failed-maintenance-reader-immutable-work-v1');
      assert.equal(older.stock.valid_deciding_evidence,false);assert.equal(older.stock.content_fingerprint,older.receipt.integrity.content_fingerprint);
      assert.deepEqual(older.stock.issues,[...REVIEWED_REVISION_PHASES.slice(6).map(id=>'phase_not_passing:'+id),'receipt_classified_outcome_not_passing','receipt_final_result_not_pass','receipt_non_deciding','receipt_phase_environment_binding_invalid'].sort());
      const invalid=clone(older.receipt);invalid.attempt.source_correction.incident_case='unrelated-maintenance-incident';let oldPromoted=false;
      assert.equal(await inspectAttemptRecords({...api,receipt:finalizeReceipt(invalid),onHistoricalPrefix(){oldPromoted=true;}}),false);assert.equal(oldPromoted,false);
    }
    let authorityReads=0;
    const historical=await inspectMaintenanceStock({...api,receipt:packet.prior,runtimeInputs:packet.runtime,assertCurrent(){},transport:{review:async()=>{authorityReads++;throw Error("failed prefix grants no current authority");}}});
    assert.equal(historical.currentAttemptRecordsValid,true);assert.equal(authorityReads,0);assert(historical.maintenanceCurrentIssues.includes("receipt_historical_failed_maintenance_prefix"));
    const result=inspectReceiptForDecision(packet.prior,{...packet.context,...historical});assert.equal(result.valid_deciding_evidence,false);assert.equal(result.dimensions.current_authorization,"unverified");
    console.log(JSON.stringify({maintenance_budget_cold_history:{synthetic_only:true,malformed_refused:true,failed_prefix_non_deciding:true,current_authority_reads:authorityReads,...(packet.older?{retained_failed_reader_prefix:true}:{})}}));
  }
}
