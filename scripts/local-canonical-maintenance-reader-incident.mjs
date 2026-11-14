// One selected settled-maintenance incident in the existing v2 lifecycle.
// Reads and seals evidence only; authority and reservation remain with owners.
import path from "node:path";
import {digest} from "./local-canonical-inputs.mjs";
import {CANONICAL_NODE_VERSION} from "./local-canonical-environment.mjs";
import {artifactReader,readImprovementOwnerRegistration} from "./local-canonical-improvement.mjs";
import {gitRevisionInventory} from "./local-canonical-git-observation.mjs";
import {CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST} from "./canonical-test-environment.mjs";
import {isFailedIntegrationFixture,validateSettledFixtureFailure,readFixturePreparation,validateFixtureNaturalResult,validateFixtureCleanup} from "./local-canonical-failed-integration-fixture.mjs";
import {registeredFixtureBudget,maintenanceFixtureBudgetRegistration,maintenanceCompletion,validateMaintenanceWatchdogLog,
  readMaintenanceFixtureBudgetPositive,validateFixtureNaturalLifecycle} from "./local-canonical-fixture-budget-witness.mjs";
import {maintenanceReaderRemedyPaths,maintenanceReaderRemedySource,validateMaintenanceReaderRemedyPlacement,
  maintenanceReaderProfileTargets,maintenanceReaderProfileLoader,maintenanceReaderProfileObserver,transformMaintenanceReaderProfile,
  maintenanceReaderContractRegistration,maintenanceReaderSelectedRefusals} from "./local-canonical-maintenance-reader-observer.mjs";

export const FAILED_MAINTENANCE_READER_CASE="failed-maintenance-reader-immutable-work-v1";
export const isFailedMaintenanceReader=p=>p?.schema==="augnes.local-canonical-source-correction.v2"&&p.kind==="prospective_maintenance"&&p.incident_case===FAILED_MAINTENANCE_READER_CASE;
export const MAINTENANCE_AGGREGATE_ALLOWANCE_CASE="failed-maintenance-reader-aggregate-allowance-v1";
export const isMaintenanceAggregateAllowance=p=>p?.schema==="augnes.local-canonical-source-correction.v2"&&p.kind==="prospective_maintenance"&&p.incident_case===MAINTENANCE_AGGREGATE_ALLOWANCE_CASE;
export const isSelectedMaintenanceIncident=p=>isFailedIntegrationFixture(p)||isFailedMaintenanceReader(p)||isMaintenanceAggregateAllowance(p);
const fail=code=>{throw Object.assign(new Error("maintenance_reader_"+code),{code:"maintenance_reader_"+code});};
const requireThat=(ok,code)=>{if(!ok)fail(code);};
const equal=(a,b)=>a!==undefined&&b!==undefined&&digest(a)===digest(b);
const keys=(v,s)=>requireThat(v&&typeof v==="object"&&!Array.isArray(v)&&equal(Object.keys(v).sort(),s.split(" ").sort()),"shape_invalid");
const sha=x=>typeof x==="string"&&/^[a-f0-9]{64}$/u.test(x);
const gitId=x=>typeof x==="string"&&/^[a-f0-9]{40}$/u.test(x);
const finite=x=>Number.isFinite(x)&&x>=0;
const count=x=>Number.isSafeInteger(x)&&x>=0;
const utc=x=>typeof x==="string"&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x&&Date.parse(x)<=Date.now();
const inside=(root,file)=>typeof file==="string"&&path.isAbsolute(file)&&path.resolve(file)===file&&file.startsWith(root+path.sep);
const sourceAt=(git,head,file)=>git(["show",head+":"+file]);
const changed=(git,before,after)=>git(["diff","--name-only","-z","--no-renames",before,after,"--"]).toString().split("\0").filter(Boolean).sort();
const maintenanceTest="scripts/test-local-canonical-maintenance.mjs",contractTest="scripts/test-local-canonical-verification-contract.mjs",suite="scripts/run-canonical-test-suite.mjs";
export const maintenanceAggregateBudgetPaths=[suite,contractTest].sort();
const environmentKeys=new Set([...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,...CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  "NODE_ENV","npm_config_nodedir","APPDATA","LOCALAPPDATA","AUGNES_CANONICAL_TEMP_ROOT","AUGNES_DB_PATH","AUGNES_RUNTIME_STATE_DIR"]);
const supportPaths=new Set([...maintenanceReaderRemedyPaths,suite,contractTest,"scripts/local-canonical-receipt.mjs","scripts/run-local-canonical-verification.mjs",
  "scripts/local-canonical-fixture-budget-witness.mjs","scripts/local-canonical-maintenance-reader-incident.mjs","scripts/local-canonical-maintenance-reader-observer.mjs",
  "scripts/fixtures/local-canonical-maintenance-reader.mjs","scripts/fixtures/local-canonical-material-source.mjs","scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/fixtures/local-canonical-failed-integration-maintenance.mjs","scripts/fixtures/local-canonical-maintenance-allowance.mjs",
  "scripts/fixtures/local-canonical-maintenance-budget.mjs",".github/LOCAL_CANONICAL_VERIFICATION.md"]);
function jsonLines(text){return text.split("\n").filter(line=>line.startsWith("{")&&line.endsWith("}")).map(line=>{try{return JSON.parse(line);}catch{fail("log_json_invalid");}});}
function bytes(read,ref,maximum=2*1024*1024){return read(ref,{json:false,maximum});}
function text(read,ref,maximum){const raw=bytes(read,ref,maximum),value=raw.toString("utf8");requireThat(Buffer.from(value).equals(raw),"utf8_invalid");return value;}
const original=(read,ref,maximum=512*1024)=>read(ref,{canonical:false,maximum});
function only(values,code){requireThat(values.length===1,code);return values[0];}

function sample(refs,{read,git,head,runtime,root,test,bound,profile=false,after}){
  keys(refs,profile?"launch result log profile transforms":"launch result log");
  const launch=original(read,refs.launch),record=original(read,refs.result),output=text(read,refs.log);
  keys(launch,"sample kind question started_at command cwd timeout_ms resource source runtime_inputs environment_keys environment_safe_values");
  keys(record,"sample started_at finished_at duration_ms result acceptance_failure cleanup root_absent");
  keys(launch.resource,"root device inode");keys(launch.source,"source_path bytes sha256");
  const command=launch.command,source=sourceAt(git,head,test);
  requireThat(typeof launch.sample==="string"&&/^[a-z0-9-]+$/u.test(launch.sample)&&launch.sample===record.sample&&
    launch.kind==="focused diagnostic only; no deciding invocation"&&typeof launch.question==="string"&&launch.question.length>0&&
    launch.cwd===root&&launch.timeout_ms===bound&&launch.source.source_path===test&&launch.source.bytes===source.length&&launch.source.sha256===digest(source)&&
    equal(launch.runtime_inputs,runtime)&&utc(launch.started_at)&&record.started_at===launch.started_at&&utc(record.finished_at)&&
    Date.parse(launch.started_at)>after&&Date.parse(record.finished_at)>Date.parse(record.started_at)&&finite(record.duration_ms)&&
    record.duration_ms>=record.result?.duration_ms&&record.acceptance_failure===null&&record.root_absent===true&&
    Array.isArray(command)&&path.isAbsolute(command[0])&&digest(command[0])===runtime.node.location_fingerprint&&
    equal(command.slice(profile?3:1),profile?["--import","tsx",test,launch.sample]:["--import","tsx",test])&&
    (!profile||command[1]==="--import"&&path.isAbsolute(command[2]))&&
    typeof launch.resource.root==="string"&&path.isAbsolute(launch.resource.root)&&typeof launch.resource.device==="string"&&typeof launch.resource.inode==="string","sample_binding_invalid");
  validateFixtureNaturalResult(record.result,launch.sample,bound);validateFixtureCleanup(record.cleanup);
  requireThat(record.cleanup.length===1&&record.cleanup[0].root===launch.resource.root,"sample_cleanup_invalid");
  const env=launch.environment_safe_values;
  requireThat(env&&env.HOME===path.join(launch.resource.root,"home")&&env.TMPDIR===launch.resource.root&&env.AUGNES_CANONICAL_TEMP_ROOT===launch.resource.root&&
    Object.keys(env).every(key=>["NODE_ENV","PATH","HOME","TMPDIR","AUGNES_CANONICAL_TEMP_ROOT","AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT","npm_config_nodedir"].includes(key))&&
    (env.NODE_ENV===undefined||env.NODE_ENV==="test")&&
    typeof env.PATH==="string"&&env.PATH.split(path.delimiter)[0]===path.dirname(command[0])&&
    typeof env.AUGNES_CANONICAL_NODE_HEADERS==="string"&&digest(env.AUGNES_CANONICAL_NODE_HEADERS)===runtime.headers.location_fingerprint&&
    env.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT===digest(runtime.headers.observation)&&env.npm_config_nodedir===path.dirname(path.dirname(command[0]))&&
    Array.isArray(launch.environment_keys)&&launch.environment_keys.length<=100&&new Set(launch.environment_keys).size===launch.environment_keys.length&&
    ["NODE_ENV","HOME","TMPDIR","AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT"].every(key=>launch.environment_keys.includes(key))&&
    launch.environment_keys.every(key=>environmentKeys.has(key)),"sample_environment_invalid");
  const q=JSON.stringify(launch.sample),result=`[canonical:r15-maintenance-diagnosis] child_result label=${q} duration_ms=${record.result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`;
  requireThat(output.split("\n").filter(line=>line===result).length===1&&!output.split("\n").some(line=>line.startsWith("[local-canonical-browser-use] ")),"sample_lifecycle_invalid");
  return {launch,record,output,finished:Date.parse(record.finished_at)};
}

function profileOperations(refs,observed,{read,git,head,after}){
  const transform=jsonLines(text(read,refs.transforms)),targets=Object.entries(maintenanceReaderProfileTargets);
  requireThat(transform.length===targets.length,"profile_sources_invalid");
  for(const[name]of targets){
    const file="scripts/"+name,source=sourceAt(git,head,file).toString(),expected=transformMaintenanceReaderProfile(name,source);
    const row=only(transform.filter(row=>row.url==="file://"+observed.launch.cwd+"/"+file),"profile_sources_invalid");
    keys(row,"url original_sha256 transformed_sha256 functions");
    requireThat(row.original_sha256===digest(Buffer.from(source))&&row.transformed_sha256===digest(Buffer.from(expected.transformed))&&equal(row.functions,expected.functions),"profile_sources_invalid");
  }
  const rows=jsonLines(text(read,refs.profile)),starts=new Map(),complete=[];
  requireThat(rows.length>=4&&rows.length<=2000,"profile_invalid");
  const first=rows[0],last=rows.at(-1);
  requireThat(first.event==="bootstrap"&&Number.isSafeInteger(first.pid)&&first.pid>0&&first.node==="v"+CANONICAL_NODE_VERSION&&
    first.scope==="current process only; cold children remain independent and uninstrumented"&&last.event==="exit"&&last.code===0&&
    equal(last.open_frames,[])&&finite(last.elapsed_ms)&&last.elapsed_ms<=observed.record.result.duration_ms&&last.totals&&typeof last.totals==="object","profile_invalid");
  let elapsed=-1;
  for(const row of rows){
    requireThat(finite(row.elapsed_ms)&&row.elapsed_ms>=elapsed,"profile_chronology_invalid");elapsed=row.elapsed_ms;
    if(!["start","end"].includes(row.event)){requireThat(row===first||row===last,"profile_invalid");continue;}
    requireThat(Number.isSafeInteger(row.id)&&row.id>0&&typeof row.name==="string"&&finite(row.duration_ms)&&finite(row.child_ms),"profile_invalid");
    if(row.event==="start"){requireThat(!starts.has(row.id),"profile_invalid");starts.set(row.id,row);continue;}
    const start=starts.get(row.id);requireThat(start&&start.name===row.name&&row.elapsed_ms>=start.elapsed_ms,"profile_invalid");starts.delete(row.id);
    if(row.name!=="readMaintenanceEvidence")continue;
    requireThat(row.operation_id===row.id&&Array.isArray(row.git)&&row.git.length<=128&&row.metrics&&typeof row.metrics==="object","profile_operation_invalid");
    const specs=new Set(),paths=[],blob=[];let total=0;
    for(const g of row.git){
      keys(g,"cwd args count duration_ms immutable_blob");
      requireThat(inside(observed.launch.resource.root,g.cwd)&&Array.isArray(g.args)&&g.args.length>0&&g.args.length<=32&&
        g.args.every(arg=>typeof arg==="string"&&arg.length<=4096)&&count(g.count)&&g.count>0&&finite(g.duration_ms),"profile_git_invalid");
      const immutable=g.args.length===3&&g.args[0]==="--no-replace-objects"&&g.args[1]==="show"&&/^[a-f0-9]{40}:.+/u.test(g.args[2]);
      requireThat(g.immutable_blob===immutable,"profile_git_invalid");total+=g.count;
      if(immutable){requireThat(!specs.has(g.args[2])&&(!after||g.count===1),"profile_git_invalid");specs.add(g.args[2]);blob.push(g);paths.push(g.args[2].slice(41));}
    }
    for(const metric of Object.values(row.metrics))requireThat(metric&&count(metric.count)&&metric.count>0&&finite(metric.duration_ms),"profile_metrics_invalid");
    const metric=name=>row.metrics[name]?.count,blobCalls=blob.reduce((n,g)=>n+g.count,0);
    if(metric("partitionSource")===1&&metric("partitionPositives")===1&&metric("registeredFixtureBudget")===(after?2:3)&&
      metric("ast")===(after?12:18)&&metric("syntax")===(after?6:9)&&total===(after?33:51)&&blobCalls===(after?23:41)&&specs.size===23)
      complete.push({paths:paths.sort(),total,blobCalls,metrics:row.metrics});
  }
  requireThat(starts.size===0&&complete.length>0,"profile_complete_operation_missing");
  return complete;
}

function selectedCompletion(output,after){
  const rows=jsonLines(output),selected=only(rows.filter(row=>Object.hasOwn(row,"failed_integration_maintenance")),"selected_coverage_invalid").failed_integration_maintenance;
  keys(selected,"synthetic_only evidence_refusals refusal_count refusals input_scopes");
  const expected=maintenanceReaderSelectedRefusals(after);
  requireThat(selected.synthetic_only===true&&selected.evidence_refusals===16&&selected.refusal_count===expected.length&&equal(selected.refusals,expected),"selected_coverage_invalid");
  const scopes=selected.input_scopes;keys(scopes,"preparation_binding_keys full_binding_keys shared_inventory preparation_input_fingerprint full_input_fingerprint");
  requireThat(equal(scopes.preparation_binding_keys,[])&&equal(scopes.full_binding_keys,["environment_keys","executor_fingerprint","head","phase_environment_fingerprints","runtime_inputs","tree"])&&
    scopes.shared_inventory===true&&sha(scopes.preparation_input_fingerprint)&&sha(scopes.full_input_fingerprint)&&scopes.preparation_input_fingerprint!==scopes.full_input_fingerprint,"selected_input_scopes_invalid");
  const additional=only(rows.filter(row=>Object.hasOwn(row,"maintenance_additional_refusals")),"selected_coverage_invalid").maintenance_additional_refusals;
  requireThat(equal(additional,{synthetic_only:true,refusal_count:1,refusals:[{name:"ordinary empty repairs cannot use selected-case waiver",code:"maintenance_repairs_missing"}]}),"selected_coverage_invalid");
  return selected.refusals;
}

function retainedMaintenanceWatchdog(incident,{prior,receipt,read,git,root,remember}){
  const native=incident.authority_log,phase=receipt.phases[6];keys(native,"artifact relative_path bytes truncated");
  requireThat(native.relative_path===`.augnes-local-verification/logs/${receipt.run.id}/authority.log`&&equal(phase.log,{relative_path:native.relative_path,bytes:native.bytes,truncated:false})&&
    native.truncated===false&&phase.command==="npm run test:authority"&&phase.label==="Canonical authority suite"&&phase.cwd_scope==="root"&&phase.exclusive===true,"original_log_invalid");
  const raw=bytes(read,native.artifact),physical=artifactReader(root,remember)({artifact:native.relative_path,sha256:native.artifact.sha256},{json:false,maximum:2*1024*1024});
  requireThat(raw.length===native.bytes&&raw.equals(physical),"original_log_invalid");
  const oldRegistration=maintenanceFixtureBudgetRegistration(git,prior.head);
  requireThat(oldRegistration.bound_ms===90000&&Buffer.from(raw.toString()).equals(raw),"incident_bound_invalid");validateMaintenanceWatchdogLog(raw.toString(),oldRegistration);
  return oldRegistration;
}

export function readFailedMaintenanceReaderIncident({p,e,prior,completion,receipt,stock,read,git,root,runtime,dependencies,remember}){
  requireThat(isFailedMaintenanceReader(p)&&equal(e.repairs,[])&&isFailedIntegrationFixture(prior.source_correction),"case_invalid");
  validateSettledFixtureFailure(p,prior,completion,receipt,stock,{maintenance:true});
  const incident=read(e.incident);keys(incident,"kind receipt cause interrupted_operation authority_log remedy preparation");
  requireThat(incident.kind===FAILED_MAINTENANCE_READER_CASE&&incident.receipt===p.prior_receipt_fingerprint&&incident.cause==="UNKNOWN"&&incident.interrupted_operation==="UNKNOWN","incident_invalid");
  const oldRegistration=retainedMaintenanceWatchdog(incident,{prior,receipt,read,git,root,remember});
  const remedy=read(incident.remedy);keys(remedy,"kind source_head source_tree delta_sha256 changed_paths work_reduction reader_correctness positives");
  requireThat(remedy.kind==="operation-scoped-immutable-reader-reuse-v1"&&gitId(remedy.source_head)&&gitId(remedy.source_tree)&&
    git(["rev-parse",remedy.source_head+"^{tree}"]).toString().trim()===remedy.source_tree&&
    equal(git(["rev-list","--parents","-n","1",remedy.source_head]).toString().trim().split(" "),[remedy.source_head,prior.head])&&
    equal(remedy.changed_paths,maintenanceReaderRemedyPaths)&&equal(changed(git,prior.head,remedy.source_head),maintenanceReaderRemedyPaths)&&
    remedy.delta_sha256===digest(git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,remedy.source_head,"--"]))&&
    changed(git,remedy.source_head,p.head).every(file=>supportPaths.has(file)),"source_delta_invalid");
  git(["merge-base","--is-ancestor",remedy.source_head,p.head]);
  const before={},after={};for(const file of maintenanceReaderRemedyPaths){before[file]=sourceAt(git,prior.head,file).toString();after[file]=sourceAt(git,remedy.source_head,file).toString();requireThat(maintenanceReaderRemedySource(file,before[file])===after[file],"source_remedy_invalid");}
  validateMaintenanceReaderRemedyPlacement(before,after);
  requireThat(equal(maintenanceFixtureBudgetRegistration(git,remedy.source_head).command,oldRegistration.command)&&
    maintenanceFixtureBudgetRegistration(git,remedy.source_head).bound_ms===oldRegistration.bound_ms&&
    maintenanceFixtureBudgetRegistration(git,p.head).bound_ms===oldRegistration.bound_ms,"registration_changed");
  const work=remedy.work_reduction;keys(work,"before after observer");keys(work.observer,"loader bootstrap");
  const loader=text(read,work.observer.loader,128*1024),bootstrap=text(read,work.observer.bootstrap,128*1024);
  requireThat(loader===maintenanceReaderProfileLoader(root)&&bootstrap===maintenanceReaderProfileObserver(path.basename(work.observer.loader.artifact)),"observer_changed");
  const a=sample(work.before,{read,git,head:prior.head,runtime,root,test:maintenanceTest,bound:oldRegistration.bound_ms,profile:true,after:Date.parse(completion.finished_at)});
  const b=sample(work.after,{read,git,head:remedy.source_head,runtime,root,test:maintenanceTest,bound:oldRegistration.bound_ms,profile:true,after:a.finished});
  requireThat(path.basename(a.launch.command[2])===path.basename(work.observer.bootstrap.artifact)&&b.launch.command[2]===a.launch.command[2],"observer_unbound");
  const old=profileOperations(work.before,a,{read,git,head:prior.head,after:false}),fresh=profileOperations(work.after,b,{read,git,head:remedy.source_head,after:true});
  requireThat(fresh.some(row=>old.some(before=>equal(before.paths,row.paths))),"immutable_work_unmatched");
  const baseline=maintenanceCompletion(a.output,git,prior.head),corrected=maintenanceCompletion(b.output,git,remedy.source_head);
  requireThat(equal(baseline.cases,corrected.cases)&&equal(baseline.refusals,corrected.refusals),"coverage_changed");
  selectedCompletion(a.output,false);const selected=selectedCompletion(b.output,true);
  keys(remedy.positives,"maintenance contract");
  const positive=sample(remedy.positives.maintenance,{read,git,head:remedy.source_head,runtime,root,test:maintenanceTest,bound:oldRegistration.bound_ms,after:b.finished});
  const contract=maintenanceReaderContractRegistration(sourceAt(git,remedy.source_head,suite).toString());
  const verified=sample(remedy.positives.contract,{read,git,head:remedy.source_head,runtime,root,test:contractTest,bound:contract.bound_ms,after:positive.finished});
  requireThat(equal(maintenanceCompletion(positive.output,git,remedy.source_head).refusals,baseline.refusals)&&verified.output.includes('"status": "pass"'),"positive_invalid");
  requireThat(equal(selectedCompletion(positive.output,true),selected),"selected_coverage_invalid");
  let latest=verified.finished;
  // Correctness evidence is separately attributed and cannot stand in for a
  // natural RED or a causal explanation of the retained watchdog failure.
  const repair=remedy.reader_correctness;keys(repair,"kind launch result log fixture");
  requireThat(repair.kind==="checkout-ownership-domain-repair","reader_repair_invalid");
  const launch=original(read,repair.launch),result=original(read,repair.result),fixture=bytes(read,repair.fixture,128*1024),output=text(read,repair.log);
  requireThat(launch.source?.sha256===digest(fixture)&&launch.source.bytes===fixture.length&&launch.source.source_path===launch.command?.at(-1)&&
    launch.cwd===root&&equal(launch.runtime_inputs,runtime)&&launch.timeout_ms===120000&&launch.sample===result.sample&&
    utc(result.started_at)&&utc(result.finished_at)&&Date.parse(result.started_at)>b.finished&&Date.parse(result.finished_at)>Date.parse(result.started_at)&&
    result.acceptance_failure===null&&result.root_absent===true&&result.cleanup?.length===1&&result.cleanup[0].root===launch.resource?.root,"reader_repair_invalid");
  validateFixtureNaturalResult(result.result,launch.sample,launch.timeout_ms);validateFixtureCleanup(result.cleanup);
  const observation=only(jsonLines(output).filter(row=>row.kind==="single historical attempt-record reader diagnostic; not fresh deciding receipt validation"),"reader_repair_invalid");
  keys(observation,"kind source_head receipt_fingerprint current_attempt_records_valid duration_ms original_false_stock_issues originals_unchanged identities");
  requireThat(observation.source_head===remedy.source_head&&observation.receipt_fingerprint===p.prior_receipt_fingerprint&&observation.current_attempt_records_valid===true&&
    observation.originals_unchanged===true&&finite(observation.duration_ms)&&equal(observation.original_false_stock_issues,stock.issues)&&Array.isArray(observation.identities)&&observation.identities.length===4,"reader_repair_invalid");
  for(const ref of Object.values(e.originals)){const raw=bytes(read,ref,512*1024);requireThat(observation.identities.some(row=>row.sha256===ref.sha256&&row.bytes===raw.length),"reader_originals_invalid");}
  const oldPath=prior.source_correction.local_relative_path;
  requireThat(typeof oldPath==="string"&&oldPath.startsWith(".augnes-local-verification/")&&!oldPath.split("/").includes(".."),"original_proof_invalid");
  const priorRead=artifactReader(path.dirname(path.join(root,oldPath)),remember);
  const oldProof=priorRead(prior.source_correction.evidence),oldIncident=priorRead(oldProof.incident),prepared=priorRead(oldIncident.preparation,{maximum:512*1024});
  requireThat(receipt.checkout_ownership?.checkout_fingerprint===prepared.checkout_fingerprint&&receipt.verification_context?.checkout_fingerprint!==prepared.checkout_fingerprint&&
    receipt.capacity_ownership?.checkout_fingerprint!==prepared.checkout_fingerprint,"reader_domains_invalid");
  latest=Math.max(latest,Date.parse(result.finished_at));
  return readFixturePreparation({p,ref:incident.preparation,read,runtime,dependencies,latest,completion,schema:"augnes.local-canonical-maintenance-reader-preparation.v1"});
}

// The finite source transform also reconstructs historical 90-second protocol
// fixtures when the current registration is 120 seconds. No old record changes.
export function maintenanceAggregateBudgetSource(file,source,{reverse=false}={}){
  const old=reverse?"120_000":"90_000",next=reverse?"90_000":"120_000";
  if(file===suite){
    const pattern=new RegExp('(id: "local-canonical-maintenance"[\\s\\S]*?timeoutMs:) '+old,'gu');
    requireThat([...source.matchAll(pattern)].length===1,"source_remedy_invalid");
    return source.replace(pattern,"$1 "+next);
  }
  requireThat(file===contractTest,"source_remedy_invalid");
  const from="for(const fragment of ['timeoutMs: "+old+"','requireNaturalExit: true','\""+maintenanceTest+"\"'])";
  const to=from.replace("timeoutMs: "+old,"timeoutMs: "+next);
  requireThat(source.split(from).length===2,"source_remedy_invalid");
  return source.replace(from,to);
}

const readerOwner="local-canonical-maintenance-reader",budgetOwner="local-canonical-maintenance-budget";
export const maintenanceSequenceAllowances=Object.freeze({reader:110000,budget:210000});
export const maintenanceSequenceColdAllowanceMs=30000;
export const maintenanceSequenceRequiredRefusals=Object.freeze([
  ["sequence UNKNOWN cause retained","maintenance_reader_incident_invalid"],
  ["sequence exact false fourteen meanings","maintenance_fixture_stock_invalid"],
  ["sequence selected remedy kind","maintenance_reader_source_delta_invalid"],
  ["sequence exact source tree","maintenance_reader_source_delta_invalid"],
  ["sequence both budget paths","maintenance_reader_source_delta_invalid"],
  ["sequence complete final following owner","maintenance_reader_sequence_binding_invalid"],
  ["sequence complete final cleanup","maintenance_fixture_positive_not_natural"],
  ["sequence unchanged final source","maintenance_reader_sequence_binding_invalid"],
  ["sequence final live inventory","maintenance_reader_sequence_inputs_invalid"],
  ["sequence raw preparation binding","maintenance_fixture_preparation_invalid"],
  ["already corrected predecessor cannot renew","maintenance_reader_incident_bound_invalid"],
  ["one-owner correction is incomplete","maintenance_reader_source_remedy_invalid"],
  ["sequence required refusal omitted","maintenance_reader_sequence_coverage_invalid"],
  ["sequence same-count refusal meaning","maintenance_reader_sequence_coverage_invalid"],
  ["measured legacy cold reader deadline","maintenance_fixture_positive_not_natural"],
  ["final continuation cold reader deadline","maintenance_fixture_positive_not_natural"],
].map(([name,code])=>Object.freeze({name,code})));
const sequenceGroups=["acquisition","material-source","material-successor","material-final"];
const sequenceIds=[...sequenceGroups.map(group=>"local-canonical-reviewed-revision-"+group),readerOwner,budgetOwner];
function replaceAllowance(source,id,before,after){
  const pattern=new RegExp('(id: "'+id+'"[\\s\\S]*?timeoutMs:) ([0-9_]+)','gu'),matches=[...source.matchAll(pattern)];
  requireThat(matches.length===1&&Number(matches[0][2].replaceAll("_",""))===before,"source_remedy_invalid");
  return source.replace(pattern,"$1 "+String(after).replace(/000$/u,"_000"));
}
// The historical direct transform above is unchanged. This second, closed
// transform applies once to the actual 120/75/90 source, never a corrected pair.
export function maintenanceSequenceBudgetSource(file,source,{reverse=false}={}){
  const {reader,budget}=maintenanceSequenceAllowances;
  if(file===suite)return replaceAllowance(replaceAllowance(source,readerOwner,reverse?reader:75000,reverse?75000:reader),budgetOwner,reverse?budget:90000,reverse?90000:budget);
  requireThat(file===contractTest,"source_remedy_invalid");
  const budgetText=String(budget).replace(/000$/u,"_000"),old=reverse?budgetText:"90_000",next=reverse?"90_000":budgetText;
  const marker="for(const fragment of ['timeoutMs: "+old+"','sharedFixture: true','requireNaturalExit: true','\"--run-maintenance-budget-fixtures\"'])";
  requireThat(source.split(marker).length===2,"source_remedy_invalid");return source.replace(marker,marker.replace("timeoutMs: "+old,"timeoutMs: "+next));
}
function sequenceRegistration(git,head){
  const source=sourceAt(git,head,suite).toString(),direct=maintenanceFixtureBudgetRegistration(git,head);
  const owners=[readerOwner,budgetOwner].map(id=>readImprovementOwnerRegistration(source,id));
  for(const [i,owner]of owners.entries())requireThat(owner.suite==="authority"&&owner.require_natural_exit&&
    equal(owner.command,["node","--import","tsx","scripts/fixtures/local-canonical-reviewed-revision.mjs",i?"--run-maintenance-budget-fixtures":"--run-maintenance-reader-fixtures"]),"registration_changed");
  return {direct,reader:owners[0],budget:owners[1],normalized:replaceAllowance(replaceAllowance(direct.normalized,readerOwner,owners[0].bound_ms,0),budgetOwner,owners[1].bound_ms,0)};
}
function sequenceCoverage(output,{final=false}={}){
  const rows=jsonLines(output),reader=only(rows.filter(row=>row.maintenance_reader_controls),"sequence_coverage_invalid").maintenance_reader_controls;
  requireThat(reader.synthetic_only===true&&reader.qualification===false&&reader.reviewed_ancestry===true&&reader.prior_stock_issue_count===15&&
    reader.one_shot===true&&reader.interruption_consumes===true&&reader.competing_successors===1&&reader.cold_stock===true&&reader.originals_unchanged===true&&
    Array.isArray(reader.refusals)&&reader.refusals.length===24,"sequence_coverage_invalid");
  const cold=rows.filter(row=>row.maintenance_reader_cold_result).map(row=>row.maintenance_reader_cold_result);
  requireThat(equal(cold.map(row=>row.kind),["lineage","current","history","malformed"]),"sequence_coverage_invalid");
  for(const {kind,...result}of cold)validateFixtureNaturalResult(result,"selected maintenance cold "+kind,10000);
  const budget=only(rows.filter(row=>row.maintenance_budget_controls),"sequence_coverage_invalid").maintenance_budget_controls;
  requireThat(budget.synthetic_only===true&&budget.qualification===false&&budget.reused_checked_reader_ancestry===true&&budget.prior_stock_issue_count===14&&
    budget.separate_grant===true&&budget.one_shot===true&&budget.cold_stock===true&&budget.failed_prefix_non_deciding===true&&budget.originals_unchanged===true&&
    Array.isArray(budget.refusals)&&budget.refusals.length===12,"sequence_coverage_invalid");
  const fresh=rows.filter(row=>row.maintenance_budget_cold_result).map(row=>row.maintenance_budget_cold_result);
  requireThat(equal(fresh.map(row=>row.kind),["current","history"]),"sequence_coverage_invalid");
  for(const {kind,...result}of fresh)validateFixtureNaturalResult(result,"maintenance allowance cold "+kind,final?maintenanceSequenceColdAllowanceMs:20000);
  const historical=only(rows.filter(row=>row.maintenance_budget_cold_history),"sequence_coverage_invalid").maintenance_budget_cold_history;
  requireThat(historical.synthetic_only===true&&historical.malformed_refused===true&&historical.failed_prefix_non_deciding===true&&historical.current_authority_reads===0,"sequence_coverage_invalid");
  for(const list of [reader.refusals,budget.refusals])requireThat(list.every(row=>row&&typeof row.name==="string"&&typeof row.code==="string")&&new Set(list.map(row=>row.name)).size===list.length,"sequence_coverage_invalid");
  if(final){
    const continuation=budget.continuation;keys(continuation,"synthetic_only qualification prepared separate_grant one_shot typed_history failed_aggregate_prefix retained_failed_reader_prefix no_current_authority_promotion originals_unchanged refusals");
    requireThat(continuation.qualification===false&&Object.entries(continuation).filter(([key])=>!["qualification","refusals"].includes(key)).every(([,value])=>value===true)&&
      equal(continuation.refusals,maintenanceSequenceRequiredRefusals)&&historical.retained_failed_reader_prefix===true,"sequence_coverage_invalid");
  }
  return {reader:reader.refusals,budget:budget.refusals};
}
function registeredSequence(refs,{read,git,head,tree,runtime,completion,final=false,preparation=null}){
  keys(refs,"launch result logs");keys(refs.logs,sequenceIds.join(" "));
  const launch=original(read,refs.launch),record=original(read,refs.result);
  keys(launch,"kind sample mode head tree started_at shared runtime_inputs suite_source_sha256 steps");
  keys(record,"sample mode head started_at finished_at duration_ms results error cleanup all_owned_roots_absent new_real_deciding_invocations"+(final?" source_after runtime_after input_inventory_before input_inventory_after dependencies_before dependencies_after parent_clock_observations":""));
  keys(launch.shared,"root device inode");
  requireThat(launch.kind==="actual registered focused workload only; no real preparation/admission/qualification"&&typeof launch.sample==="string"&&/^[a-z0-9-]+$/u.test(launch.sample)&&
    launch.mode==="reader"&&record.mode==="reader"&&launch.sample===record.sample&&launch.head===head&&record.head===head&&launch.tree===tree&&equal(launch.runtime_inputs,runtime)&&
    launch.suite_source_sha256===digest(sourceAt(git,head,suite))&&utc(launch.started_at)&&record.started_at===launch.started_at&&utc(record.finished_at)&&
    Date.parse(launch.started_at)<Date.parse(record.finished_at)&&(final?Date.parse(launch.started_at)>Date.parse(completion.finished_at):Date.parse(record.finished_at)<Date.parse(completion.finished_at))&&
    finite(record.duration_ms)&&record.error===null&&record.all_owned_roots_absent===true&&record.new_real_deciding_invocations===0&&
    path.isAbsolute(launch.shared.root)&&typeof launch.shared.device==="string"&&typeof launch.shared.inode==="string"&&
    equal(launch.steps?.map(row=>row.id),sequenceIds)&&equal(record.results?.map(row=>row.id),sequenceIds),"sequence_binding_invalid");
  if(final){
    keys(record.source_after,"head tree dirty suite_source_sha256");requireThat(equal(record.source_after,{head,tree,dirty:"",suite_source_sha256:launch.suite_source_sha256})&&equal(record.runtime_after,runtime)&&
      equal(record.dependencies_before,preparation?.dependencies)&&equal(record.dependencies_after,preparation.dependencies),"sequence_binding_invalid");
    for(const input of [record.input_inventory_before,record.input_inventory_after])requireThat(equal(input?.binding,{})&&input.fingerprint===digest({contract:input.contract,path_kind:input.path_kind,binding:input.binding,resources:input.resources})&&
      input.first_fault===null&&equal(input.secondary_faults,[])&&equal(input.events,[])&&gitRevisionInventory(input)===preparation.inventory_sha256,"sequence_inputs_invalid");
    requireThat(Array.isArray(record.parent_clock_observations)&&record.parent_clock_observations.length>0&&record.parent_clock_observations.length<=5000,"sequence_clock_invalid");
    let elapsed=0;for(const row of record.parent_clock_observations){requireThat(row&&sequenceIds.includes(row.id)&&finite(row.elapsed_ms)&&row.elapsed_ms>=elapsed&&row.elapsed_ms<=record.duration_ms,"sequence_clock_invalid");elapsed=row.elapsed_ms;}
  }
  const registration=sequenceRegistration(git,head),groups=registeredFixtureBudget(git,head,"serial-aggregate"),outputs=[],durations={};
  let total=0;
  for(const [i,id]of sequenceIds.entries()){
    const step=launch.steps[i],observed=record.results[i],owner=i<4?null:i===4?registration.reader:registration.budget;
    keys(step,"id label command args timeoutMs shared"+(i<4?" registered_inner_ms":""));keys(observed,"id source_head command registered_bound_ms result log");keys(observed.log,"file bytes sha256");
    const group=sequenceGroups[i],label=i<4?"reviewed revision controls: "+group:owner.label,bound=i<4?groups.limits[group].outer:owner.bound_ms;
    const args=i<4?["--import","tsx","scripts/test-local-canonical-review-corrections.mjs","--reviewed-revision-controls",group,JSON.stringify(launch.shared)]:[...owner.command.slice(1),JSON.stringify(launch.shared)];
    requireThat(step.label===label&&path.isAbsolute(step.command)&&digest(step.command)===runtime.node.location_fingerprint&&equal(step.args,args)&&step.timeoutMs===bound&&step.shared===true&&
      (i>=4||step.registered_inner_ms===groups.limits[group].inner)&&observed.source_head===head&&equal(observed.command,[step.command,...args])&&observed.registered_bound_ms===bound,"sequence_binding_invalid");
    const output=text(read,refs.logs[id]);requireThat(path.isAbsolute(observed.log.file)&&observed.log.bytes===Buffer.byteLength(output)&&observed.log.sha256===digest(Buffer.from(output))&&
      !output.split("\n").some(line=>line.startsWith("[local-canonical-browser-use] ")),"sequence_log_invalid");
    validateFixtureNaturalResult(observed.result,label,bound);validateFixtureNaturalLifecycle(output,{suite:"authority",label,timeout:bound,duration:observed.result.duration_ms});
    if(i<4)requireThat(equal(only(jsonLines(output).filter(row=>row.status==="pass"&&Array.isArray(row.checks)),"sequence_coverage_invalid"),
      {status:"pass",checks:[label],cleanup_complete:true}),"sequence_coverage_invalid");
    total+=observed.result.duration_ms;durations[id]=observed.result.duration_ms;outputs.push(output);
  }
  validateFixtureCleanup(record.cleanup);requireThat(record.duration_ms>=total&&record.cleanup.some(row=>row.root===launch.shared.root),"sequence_cleanup_invalid");
  return {record,durations,coverage:sequenceCoverage(outputs.slice(4).join("\n"),{final}),finished:Date.parse(record.finished_at)};
}
function retainedSequenceFailure(incident,{prior,receipt,read,git,root,remember}){
  const native=incident.authority_log,phase=receipt.phases[6];keys(native,"artifact relative_path bytes truncated");
  requireThat(native.relative_path===`.augnes-local-verification/logs/${receipt.run.id}/authority.log`&&equal(phase.log,{relative_path:native.relative_path,bytes:native.bytes,truncated:false})&&native.truncated===false&&
    phase.command==="npm run test:authority"&&phase.label==="Canonical authority suite"&&phase.cwd_scope==="root"&&phase.exclusive===true,"original_log_invalid");
  const raw=bytes(read,native.artifact),physical=artifactReader(root,remember)({artifact:native.relative_path,sha256:native.artifact.sha256},{json:false,maximum:2*1024*1024}),output=raw.toString();
  requireThat(raw.length===native.bytes&&raw.equals(physical)&&Buffer.from(output).equals(raw),"original_log_invalid");
  const before=sequenceRegistration(git,prior.head);
  requireThat(before.direct.bound_ms===120000&&before.reader.bound_ms===75000&&before.budget.bound_ms===90000,"incident_bound_invalid");
  validateMaintenanceWatchdogLog(output,before.reader);
  const result=only(output.split("\n").filter(line=>line.startsWith('[canonical:authority] child_result label='+JSON.stringify(before.direct.label)+' ')),"incident_sequence_invalid");
  const duration=Number(result.match(/ duration_ms=([0-9]+) /u)?.[1]);requireThat(Number.isSafeInteger(duration)&&duration>0&&duration<=before.direct.bound_ms,"incident_sequence_invalid");
  const natural=validateFixtureNaturalLifecycle(output,{suite:"authority",label:before.direct.label,timeout:120000,duration});
  const readerStart='[canonical:authority] child_start label='+JSON.stringify(before.reader.label)+' timeout_ms=75000';
  requireThat(output.indexOf(natural.result)<output.indexOf(readerStart)&&!output.includes(' label='+JSON.stringify(before.budget.label)+' '),"incident_sequence_invalid");
  const rows=jsonLines(output),cold=rows.filter(row=>row.maintenance_reader_cold_result).map(row=>row.maintenance_reader_cold_result);
  requireThat(equal(cold.map(row=>row.kind),["lineage","current","history","malformed"])&&!rows.some(row=>row.maintenance_reader_controls),"incident_progress_invalid");
  for(const {kind,...r}of cold)validateFixtureNaturalResult(r,"selected maintenance cold "+kind,10000);
  const last=only(rows.filter(row=>row.maintenance_reader_stage==="cold_validation_complete"),"incident_progress_invalid");
  requireThat(last.synthetic_only===true&&count(last.elapsed_ms)&&last.elapsed_ms>0,"incident_progress_invalid");
  return before;
}

function readMaintenanceSequenceIncident(options,incident){
  const {p,e,prior,completion,receipt,stock,read,git,runtime,dependencies}=options;
  validateSettledFixtureFailure(p,prior,completion,receipt,stock,{maintenance:true,maintenanceAllowance:true});
  const before=retainedSequenceFailure(incident,options),remedy=read(incident.remedy);
  keys(remedy,"kind source_head source_tree delta_sha256 changed_paths rationale positives");
  requireThat(remedy.kind==="registered-maintenance-sequence-v1"&&gitId(remedy.source_head)&&gitId(remedy.source_tree)&&
    git(["rev-parse",remedy.source_head+"^{tree}"]).toString().trim()===remedy.source_tree&&
    equal(remedy.changed_paths,maintenanceAggregateBudgetPaths)&&equal(changed(git,prior.head,remedy.source_head),maintenanceAggregateBudgetPaths)&&
    remedy.delta_sha256===digest(git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,remedy.source_head,"--"]))&&
    changed(git,remedy.source_head,p.head).every(file=>supportPaths.has(file)),"source_delta_invalid");
  git(["merge-base","--is-ancestor",prior.head,remedy.source_head]);
  requireThat(git(["rev-list","--merges",prior.head+".."+remedy.source_head]).toString().trim()==="","source_delta_invalid");
  git(["merge-base","--is-ancestor",remedy.source_head,p.head]);
  const after=sequenceRegistration(git,remedy.source_head),final=sequenceRegistration(git,p.head);
  requireThat(after.direct.bound_ms===120000&&after.reader.bound_ms===maintenanceSequenceAllowances.reader&&after.budget.bound_ms===maintenanceSequenceAllowances.budget&&before.normalized===after.normalized&&
    final.direct.bound_ms===120000&&final.reader.bound_ms===maintenanceSequenceAllowances.reader&&final.budget.bound_ms===maintenanceSequenceAllowances.budget&&
    equal(final.reader.command,before.reader.command)&&equal(final.budget.command,before.budget.command)&&
    sourceAt(git,prior.head,maintenanceTest).equals(sourceAt(git,p.head,maintenanceTest))&&
    maintenanceSequenceBudgetSource(contractTest,sourceAt(git,prior.head,contractTest).toString())===sourceAt(git,remedy.source_head,contractTest).toString(),"source_remedy_invalid");
  for(const head of [prior.head,remedy.source_head]){const entries=git(["ls-tree","-z",head,"--",...maintenanceAggregateBudgetPaths]).toString().split("\0").filter(Boolean);requireThat(entries.length===2&&entries.every(line=>line.startsWith("100644 blob ")),"source_remedy_invalid");}
  const rationale=remedy.rationale;keys(rationale,"measurement execution_reserve_ms rounding_ms additional_control_allowance_ms judgment");keys(rationale.additional_control_allowance_ms,"reader budget");
  const measured=registeredSequence(rationale.measurement,{read,git,head:prior.head,tree:prior.tree,runtime,completion});
  requireThat(rationale.execution_reserve_ms===30000&&rationale.rounding_ms===10000&&typeof rationale.judgment==="string"&&rationale.judgment.length>=80&&rationale.judgment.length<=4000&&
    [after.reader,after.budget].every((owner,i)=>{const extra=rationale.additional_control_allowance_ms[i?"budget":"reader"];return count(extra)&&extra<=120000&&extra%10000===0&&Math.ceil((measured.durations[owner.id]+30000)/10000)*10000+extra===owner.bound_ms;}),"allowance_rationale_invalid");
  keys(remedy.positives,"sequence contract");
  const preparation=read(incident.preparation,{maximum:512*1024});
  const positive=registeredSequence(remedy.positives.sequence,{read,git,head:p.head,tree:p.tree,runtime,completion,final:true,preparation});
  requireThat(equal(positive.coverage,measured.coverage),"coverage_changed");
  const contract=maintenanceReaderContractRegistration(sourceAt(git,p.head,suite).toString());
  const verified=sample(remedy.positives.contract,{read,git,head:p.head,runtime,root:options.root,test:contractTest,bound:contract.bound_ms,after:positive.finished});
  requireThat(verified.output.includes('"status": "pass"'),"positive_invalid");
  return readFixturePreparation({p,ref:incident.preparation,read,runtime,dependencies,latest:verified.finished,completion,schema:"augnes.local-canonical-maintenance-reader-preparation.v1"});
}

// Retain the original registered-step observation verbatim. It predates the
// failed Full and is rationale, not a new witness or a causal timeout diagnosis.
function retainedRegisteredMaintenance(refs,{read,git,prior,runtime,completion}){
  keys(refs,"launch result log");
  const launch=original(read,refs.launch),record=original(read,refs.result),output=text(read,refs.log);
  keys(launch,"kind sample mode head tree started_at shared runtime_inputs suite_source_sha256 steps");
  keys(launch.shared,"root device inode");
  keys(record,"sample mode head started_at finished_at duration_ms results error cleanup all_owned_roots_absent new_real_deciding_invocations");
  requireThat(launch.kind==="actual registered focused workload only; no real preparation/admission/qualification"&&
    typeof launch.sample==="string"&&/^[a-z0-9-]+$/u.test(launch.sample)&&launch.sample===record.sample&&launch.mode==="maintenance"&&record.mode===launch.mode&&
    launch.head===prior.head&&record.head===prior.head&&launch.tree===prior.tree&&equal(launch.runtime_inputs,runtime)&&
    launch.suite_source_sha256===digest(sourceAt(git,prior.head,suite))&&utc(launch.started_at)&&record.started_at===launch.started_at&&utc(record.finished_at)&&
    Date.parse(launch.started_at)<Date.parse(record.finished_at)&&Date.parse(record.finished_at)<Date.parse(completion.finished_at)&&
    finite(record.duration_ms)&&record.error===null&&record.all_owned_roots_absent===true&&record.new_real_deciding_invocations===0&&
    typeof launch.shared.root==="string"&&path.isAbsolute(launch.shared.root)&&typeof launch.shared.device==="string"&&typeof launch.shared.inode==="string"&&
    Array.isArray(launch.steps)&&launch.steps.length===1&&Array.isArray(record.results)&&record.results.length===1,"retained_measurement_invalid");
  const step=launch.steps[0],observed=record.results[0],registration=maintenanceFixtureBudgetRegistration(git,prior.head);
  keys(step,"id label command args timeoutMs shared");keys(observed,"id source_head command registered_bound_ms result log");keys(observed.log,"file bytes sha256");
  requireThat(step.id===registration.id&&step.label===registration.label&&path.isAbsolute(step.command)&&digest(step.command)===runtime.node.location_fingerprint&&
    equal(["node",...step.args],registration.command)&&step.timeoutMs===90000&&step.shared===false&&
    observed.id===step.id&&observed.source_head===prior.head&&equal(observed.command,[step.command,...step.args])&&observed.registered_bound_ms===step.timeoutMs&&
    record.duration_ms>=observed.result?.duration_ms&&typeof observed.log.file==="string"&&path.isAbsolute(observed.log.file)&&
    observed.log.bytes===Buffer.byteLength(output)&&observed.log.sha256===digest(Buffer.from(output)),"retained_measurement_invalid");
  validateFixtureNaturalResult(observed.result,registration.label,registration.bound_ms);validateFixtureCleanup(record.cleanup);
  requireThat(record.cleanup.some(row=>row.root===launch.shared.root),"retained_measurement_cleanup_invalid");
  validateFixtureNaturalLifecycle(output,{suite:"authority",label:registration.label,timeout:registration.bound_ms,duration:observed.result.duration_ms});
  return {record,summary:maintenanceCompletion(output,git,prior.head),selected:selectedCompletion(output,true),duration_ms:observed.result.duration_ms};
}

export function readMaintenanceAggregateAllowanceIncident({p,e,prior,completion,receipt,stock,read,git,root,runtime,dependencies,remember}){
  requireThat(isMaintenanceAggregateAllowance(p)&&(isFailedMaintenanceReader(prior.source_correction)||isMaintenanceAggregateAllowance(prior.source_correction))&&equal(e.repairs,[]),"case_invalid");
  const incident=read(e.incident);keys(incident,"kind receipt cause interrupted_operation authority_log remedy preparation");
  requireThat(incident.kind===MAINTENANCE_AGGREGATE_ALLOWANCE_CASE&&incident.receipt===p.prior_receipt_fingerprint&&
    incident.cause==="UNKNOWN"&&incident.interrupted_operation==="UNKNOWN","incident_invalid");
  if(isMaintenanceAggregateAllowance(prior.source_correction))return readMaintenanceSequenceIncident({p,e,prior,completion,receipt,stock,read,git,root,runtime,dependencies,remember},incident);
  validateSettledFixtureFailure(p,prior,completion,receipt,stock,{maintenance:true,maintenanceReader:true});
  const before=retainedMaintenanceWatchdog(incident,{prior,receipt,read,git,root,remember});
  const remedy=read(incident.remedy);keys(remedy,"kind source_head source_tree delta_sha256 changed_paths rationale positives");
  requireThat(remedy.kind==="registered-maintenance-direct-v1"&&gitId(remedy.source_head)&&gitId(remedy.source_tree)&&
    git(["rev-parse",remedy.source_head+"^{tree}"]).toString().trim()===remedy.source_tree&&
    equal(git(["rev-list","--parents","-n","1",remedy.source_head]).toString().trim().split(" "),[remedy.source_head,prior.head])&&
    equal(remedy.changed_paths,maintenanceAggregateBudgetPaths)&&equal(changed(git,prior.head,remedy.source_head),maintenanceAggregateBudgetPaths)&&
    remedy.delta_sha256===digest(git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,remedy.source_head,"--"]))&&
    changed(git,remedy.source_head,p.head).every(file=>supportPaths.has(file)),"source_delta_invalid");
  git(["merge-base","--is-ancestor",remedy.source_head,p.head]);
  const after=maintenanceFixtureBudgetRegistration(git,remedy.source_head),final=maintenanceFixtureBudgetRegistration(git,p.head);
  requireThat(before.bound_ms===90000&&after.bound_ms===120000&&before.normalized===after.normalized&&final.bound_ms===120000&&
    equal(final.command,before.command)&&sourceAt(git,prior.head,maintenanceTest).equals(sourceAt(git,p.head,maintenanceTest))&&
    maintenanceAggregateBudgetSource(contractTest,sourceAt(git,prior.head,contractTest).toString())===sourceAt(git,remedy.source_head,contractTest).toString(),"source_remedy_invalid");
  for(const head of [prior.head,remedy.source_head]){
    const entries=git(["ls-tree","-z",head,"--",...maintenanceAggregateBudgetPaths]).toString().split("\0").filter(Boolean);
    requireThat(entries.length===2&&entries.every(line=>line.startsWith("100644 blob ")),"source_remedy_invalid");
  }
  const rationale=remedy.rationale;keys(rationale,"measurement execution_reserve_ms rounding_ms judgment");
  const measured=retainedRegisteredMaintenance(rationale.measurement,{read,git,prior,runtime,completion});
  requireThat(rationale.execution_reserve_ms===30000&&rationale.rounding_ms===10000&&
    Math.ceil((measured.duration_ms+rationale.execution_reserve_ms)/rationale.rounding_ms)*rationale.rounding_ms===after.bound_ms&&
    typeof rationale.judgment==="string"&&rationale.judgment.length>=80&&rationale.judgment.length<=4000,"allowance_rationale_invalid");
  keys(remedy.positives,"maintenance contract");
  const preparation=read(incident.preparation,{maximum:512*1024});
  const positive=readMaintenanceFixtureBudgetPositive(remedy.positives.maintenance,{head:p.head,tree:p.tree,inputs:{identity_sha256:digest(runtime),inventory_sha256:preparation.inventory_sha256}},
    {git,parse:ref=>original(read,ref,2*1024*1024),bytes:(ref,maximum)=>bytes(read,ref,maximum),completedAt:completion.finished_at,after:completion.finished_at,boundMs:120000});
  requireThat(equal(positive.summary.cases,measured.summary.cases)&&equal(positive.summary.refusals,measured.summary.refusals),"coverage_changed");
  requireThat(equal(selectedCompletion(text(read,positive.record.stdout),true),measured.selected),"selected_coverage_invalid");
  const contract=maintenanceReaderContractRegistration(sourceAt(git,p.head,suite).toString());
  const verified=sample(remedy.positives.contract,{read,git,head:p.head,runtime,root,test:contractTest,bound:contract.bound_ms,after:Date.parse(positive.finished_at)});
  requireThat(verified.output.includes('"status": "pass"'),"positive_invalid");
  return readFixturePreparation({p,ref:incident.preparation,read,runtime,dependencies,latest:verified.finished,completion,schema:"augnes.local-canonical-maintenance-reader-preparation.v1"});
}
