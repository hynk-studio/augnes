// One selected settled-maintenance incident in the existing v2 lifecycle.
// Reads and seals evidence only; authority and reservation remain with owners.
import path from "node:path";
import {digest} from "./local-canonical-inputs.mjs";
import {CANONICAL_NODE_VERSION} from "./local-canonical-environment.mjs";
import {artifactReader} from "./local-canonical-improvement.mjs";
import {CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST} from "./canonical-test-environment.mjs";
import {isFailedIntegrationFixture,validateSettledFixtureFailure,readFixturePreparation,validateFixtureNaturalResult,validateFixtureCleanup} from "./local-canonical-failed-integration-fixture.mjs";
import {maintenanceFixtureBudgetRegistration,maintenanceCompletion,validateMaintenanceWatchdogLog} from "./local-canonical-fixture-budget-witness.mjs";
import {maintenanceReaderRemedyPaths,maintenanceReaderRemedySource,validateMaintenanceReaderRemedyPlacement,
  maintenanceReaderProfileTargets,maintenanceReaderProfileLoader,maintenanceReaderProfileObserver,transformMaintenanceReaderProfile,
  maintenanceReaderContractRegistration,maintenanceReaderSelectedRefusals} from "./local-canonical-maintenance-reader-observer.mjs";

export const FAILED_MAINTENANCE_READER_CASE="failed-maintenance-reader-immutable-work-v1";
export const isFailedMaintenanceReader=p=>p?.schema==="augnes.local-canonical-source-correction.v2"&&p.kind==="prospective_maintenance"&&p.incident_case===FAILED_MAINTENANCE_READER_CASE;
export const isSelectedMaintenanceIncident=p=>isFailedIntegrationFixture(p)||isFailedMaintenanceReader(p);
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
const environmentKeys=new Set([...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,...CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  "NODE_ENV","npm_config_nodedir","APPDATA","LOCALAPPDATA","AUGNES_CANONICAL_TEMP_ROOT","AUGNES_DB_PATH","AUGNES_RUNTIME_STATE_DIR"]);
const supportPaths=new Set([...maintenanceReaderRemedyPaths,suite,contractTest,"scripts/local-canonical-receipt.mjs","scripts/run-local-canonical-verification.mjs",
  "scripts/local-canonical-fixture-budget-witness.mjs","scripts/local-canonical-maintenance-reader-incident.mjs","scripts/local-canonical-maintenance-reader-observer.mjs",
  "scripts/fixtures/local-canonical-maintenance-reader.mjs","scripts/fixtures/local-canonical-material-source.mjs","scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/fixtures/local-canonical-failed-integration-maintenance.mjs",".github/LOCAL_CANONICAL_VERIFICATION.md"]);
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

export function readFailedMaintenanceReaderIncident({p,e,prior,completion,receipt,stock,read,git,root,runtime,dependencies,remember}){
  requireThat(isFailedMaintenanceReader(p)&&equal(e.repairs,[])&&isFailedIntegrationFixture(prior.source_correction),"case_invalid");
  validateSettledFixtureFailure(p,prior,completion,receipt,stock,{maintenance:true});
  const incident=read(e.incident);keys(incident,"kind receipt cause interrupted_operation authority_log remedy preparation");
  requireThat(incident.kind===FAILED_MAINTENANCE_READER_CASE&&incident.receipt===p.prior_receipt_fingerprint&&incident.cause==="UNKNOWN"&&incident.interrupted_operation==="UNKNOWN","incident_invalid");
  const native=incident.authority_log,phase=receipt.phases[6];keys(native,"artifact relative_path bytes truncated");
  requireThat(native.relative_path===`.augnes-local-verification/logs/${receipt.run.id}/authority.log`&&equal(phase.log,{relative_path:native.relative_path,bytes:native.bytes,truncated:false})&&
    native.truncated===false&&phase.command==="npm run test:authority"&&phase.label==="Canonical authority suite"&&phase.cwd_scope==="root"&&phase.exclusive===true,"original_log_invalid");
  const raw=bytes(read,native.artifact),physical=artifactReader(root,remember)({artifact:native.relative_path,sha256:native.artifact.sha256},{json:false,maximum:2*1024*1024});
  requireThat(raw.length===native.bytes&&raw.equals(physical),"original_log_invalid");
  const oldRegistration=maintenanceFixtureBudgetRegistration(git,prior.head);
  requireThat(oldRegistration.bound_ms===90000&&Buffer.from(raw.toString()).equals(raw),"incident_bound_invalid");validateMaintenanceWatchdogLog(raw.toString(),oldRegistration);
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
