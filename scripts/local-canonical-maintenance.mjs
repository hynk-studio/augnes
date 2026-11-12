// A separately commissioned correction in the existing v2 envelope. Reads only;
// the attempts owner alone reserves the existing physical successor edge.
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, validCanonicalRuntimeInputs, preparedDependencyIdentity, observePreparedDependencyInputs, comparePreparedDependencyInputs, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { artifactReader, parseImprovementJSON, ordinaryV2SourceModule, isImprovement, improvementAuthorityObservation } from "./local-canonical-improvement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const MAINTENANCE_KIND = "prospective_maintenance";
export const MAINTENANCE_ACCEPT = "Accept this substantively repaired maintenance candidate and its evidence.";
export const MAINTENANCE_GRANT = "Commission one prospective maintenance qualification without reopening the terminal attempt.";
export const MAINTENANCE_PHASES = ["dependencies-root", "dependencies-nested", "dependencies-web-planning"];
const capabilities = new WeakMap();
const fail = code => { throw Object.assign(new Error("maintenance_"+code),{code:"maintenance_"+code}); };
const requireThat = (ok,code) => { if(!ok)fail(code); };
const equal = (a,b) => a!==undefined && b!==undefined && digest(a)===digest(b);
const sha = x => typeof x==="string" && /^[a-f0-9]{64}$/u.test(x);
const gitId = x => typeof x==="string" && /^[a-f0-9]{40}$/u.test(x);
const id = x => Number.isSafeInteger(x)&&x>0;
const text = x => typeof x==="string"&&x.length>0&&x.length<=4096;
const utc = x => typeof x==="string"&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x&&Date.parse(x)<=Date.now();
// Authenticated GitHub records use UTC seconds or exactly three fractional
// digits. Validate the calendar by round trip without changing the raw record
// or its observation digest. Internal witnesses keep the stricter utc format.
const externalUtc = x => typeof x==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(x)&&
  Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===(x.length===20?x.slice(0,-1)+".000Z":x)&&Date.parse(x)<=Date.now();
// A seconds-only earlier record can fall anywhere within its reported second.
// It cannot prove strict ordering against a later record in that same second.
const strictlyAfter = (later,earlier) => Date.parse(later)>Date.parse(earlier)+(earlier.length===20?999:0);
const keys = (v,s) => requireThat(v&&typeof v==="object"&&!Array.isArray(v)&&equal(Object.keys(v).sort(),s.split(" ").sort()),"shape_invalid");
const unique = xs => Array.isArray(xs)&&xs.length>0&&xs.length<=200&&xs.every(text)&&equal(xs,[...new Set(xs)].sort());
export const isMaintenance = p => p?.schema==="augnes.local-canonical-source-correction.v2"&&p.kind===MAINTENANCE_KIND;
export const hasMaintenanceMarker = v => [v,v?.source_correction,v?.recovery,v?.attempt,v?.attempt?.source_correction,v?.attempt?.recovery]
  .some(x=>x&&(x.kind===MAINTENANCE_KIND||Object.hasOwn(x,"maintenance_authority")||Object.hasOwn(x,"maintenance_consumed")||x.evidence_kind===MAINTENANCE_KIND));
const targetFields="branch base head tree pull_request prior_family_id prior_number prior_attempt_id prior_receipt_fingerprint";
export const maintenanceTarget = p => Object.fromEntries(targetFields.split(" ").map(k=>[k,p[k]]));
export function validateMaintenanceProof(p,{authorizationRequired=true}={}) {
  keys(p,"schema kind "+targetFields+" prior_receipt_path evidence review authorization");
  requireThat(isMaintenance(p)&&[p.base,p.head,p.tree].every(gitId)&&[p.prior_family_id,p.prior_receipt_fingerprint].every(sha)&&
    [1,2].includes(p.prior_number)&&id(p.pull_request)&&/^[A-Za-z0-9_./-]{1,200}$/u.test(p.branch)&&!p.branch.split("/").includes("..")&&
    /^[A-Za-z0-9_-]{1,200}$/u.test(p.prior_attempt_id)&&p.prior_receipt_path===`.augnes-local-verification/receipts/${p.prior_attempt_id}.json`,"target_invalid");
  for(const ref of [p.evidence,p.review])keys(ref,"artifact sha256");
  if(p.authorization===null&&!authorizationRequired)return;
  keys(p.authorization,"acceptance_review_id acceptance_review_sha256 grant_comment_id grant_comment_sha256");
  requireThat(id(p.authorization.acceptance_review_id)&&id(p.authorization.grant_comment_id)&&p.authorization.acceptance_review_id!==p.authorization.grant_comment_id&&
    sha(p.authorization.acceptance_review_sha256)&&sha(p.authorization.grant_comment_sha256),"authorization_invalid");
}
export function maintenanceFaults(receipt) {
  return [...new Set([
    ...(receipt.phases??[]).filter(p=>p.status==="failure").map(digest),
    ...[receipt.inputs?.first_fault,...(receipt.inputs?.secondary_faults??[]),...(receipt.inputs?.events??[]).filter(event=>!nonFaultInputChange(event.disposition))].filter(Boolean).map(digest),
  ])].sort();
}
export function readMaintenanceEvidence(file,p,root,{remember,authorizationRequired=true}={}) {
  validateMaintenanceProof(p,{authorizationRequired});
  const read=artifactReader(path.dirname(file),remember), e=read(p.evidence), review=read(p.review);
  keys(e,"target originals source repairs inputs history planner implementation_actor");
  requireThat(equal(e.target,maintenanceTarget(p))&&text(e.implementation_actor),"evidence_target_invalid");
  keys(e.originals,"attempt completion receipt stock");
  const prior=read(e.originals.attempt,{canonical:false}), completion=read(e.originals.completion,{canonical:false}), receipt=read(e.originals.receipt,{canonical:false,maximum:512*1024}), stock=read(e.originals.stock,{canonical:false,maximum:512*1024});
  const original={...receipt};delete original.integrity;
  requireThat((isImprovement(prior.source_correction)||isMaintenance(prior.source_correction))&&prior.family_id===p.prior_family_id&&prior.number===p.prior_number&&prior.attempt_id===p.prior_attempt_id&&
    prior.budget?.initial===1&&prior.budget?.recovery===0&&prior.branch===p.branch&&prior.head!==p.head&&prior.tree!==p.tree&&
    completion.attempt_id===prior.attempt_id&&completion.receipt_fingerprint===p.prior_receipt_fingerprint&&completion.cleanup_complete===true&&utc(completion.finished_at)&&
    ["product_failure","input_invalidation","safety_violation"].includes(completion.disposition)&&receipt.outcome?.disposition===completion.disposition&&receipt.cleanup?.completed===true&&
    receipt.run?.id===prior.attempt_id&&receipt.repository?.head_sha===prior.head&&receipt.repository?.tree_sha===prior.tree&&
    digest(original)===p.prior_receipt_fingerprint&&receipt.integrity?.content_fingerprint===p.prior_receipt_fingerprint&&
    equal(receipt.attempt,prior)&&stock.valid_deciding_evidence===false&&stock.content_fingerprint===p.prior_receipt_fingerprint&&Array.isArray(stock.issues)&&stock.issues.length>0,"predecessor_invalid");
  const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024,stdio:["ignore","pipe","pipe"]});
  git(["merge-base","--is-ancestor",prior.head,p.head]);git(["merge-base","--is-ancestor",p.base,p.head]);
  requireThat(git(["rev-parse",p.head+"^{tree}"]).toString().trim()===p.tree,"tree_invalid");
  keys(e.source,"delta_sha256 changed_paths");
  requireThat(unique(e.source.changed_paths)&&e.source.delta_sha256===digest(git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,p.head,"--"]))&&
    equal(e.source.changed_paths,git(["diff","--name-only",prior.head,p.head,"--"]).toString().trim().split("\n").sort()),"complete_delta_invalid");
  keys(e.inputs,"runtime dependencies");
  const runtime=read(e.inputs.runtime), dependencies=read(e.inputs.dependencies);
  requireThat(validCanonicalRuntimeInputs(runtime)&&Array.isArray(dependencies)&&equal(dependencies.map(x=>preparedDependencyIdentity(x).phase_id),MAINTENANCE_PHASES),"inputs_invalid");
  for(const [i,dependency]of dependencies.entries())for(const source of dependency.sources){
    const file=path.posix.join(["","apps/augnes_apps","apps/web_planning"][i],source.name);
    const bytes=git(["show",`${p.head}:${file}`]);
    requireThat(source.sha256===digest(bytes)&&source.bytes===bytes.length,"dependency_source_unbound");
  }
  const faults=maintenanceFaults(receipt), addressed=[];
  requireThat(faults.length>0&&Array.isArray(e.repairs)&&e.repairs.length>0&&e.repairs.length<=16,"repairs_missing");
  let last="", latest=Date.parse(completion.finished_at);
  for(const repair of e.repairs){
    keys(repair,"id source_module fixture environment before after addresses");
    requireThat(text(repair.id)&&repair.id>last&&ordinaryV2SourceModule({kind:"source_revision",source_module:repair.source_module})&&e.source.changed_paths.includes(repair.source_module)&&
      unique(repair.addresses)&&repair.addresses.every(x=>faults.includes(x)),"repair_scope_invalid");last=repair.id;addressed.push(...repair.addresses);
    read(repair.fixture,{json:false});const environment=read(repair.environment);
    keys(environment,"runtime node_version command bound_ms inputs");
    requireThat(equal(environment.runtime,runtime)&&environment.node_version===CANONICAL_NODE_VERSION&&Array.isArray(environment.command)&&environment.command.length>0&&environment.command.every(text)&&
      id(environment.bound_ms)&&environment.bound_ms<=120000&&Array.isArray(environment.inputs)&&environment.inputs.length>0&&environment.inputs.length<=200,"witness_environment_invalid");
    for(const ref of environment.inputs)read(ref,{json:false,maximum:2*1024*1024});
    const witnesses=[read(repair.before),read(repair.after)];
    for(const [i,w]of witnesses.entries()){
      keys(w,"source_head source_tree source_module source_sha256 fixture_sha256 environment_fingerprint node_version started_at finished_at start_binding end_binding result stdout");
      const head=i?p.head:prior.head,tree=i?p.tree:prior.tree;
      const binding={source_sha256:w.source_sha256,fixture_sha256:repair.fixture.sha256,environment_fingerprint:repair.environment.sha256};
      requireThat(w.source_head===head&&w.source_tree===tree&&w.source_module===repair.source_module&&w.source_sha256===digest(git(["show",`${head}:${repair.source_module}`]))&&
        w.fixture_sha256===repair.fixture.sha256&&w.environment_fingerprint===repair.environment.sha256&&w.node_version===CANONICAL_NODE_VERSION&&
        utc(w.started_at)&&utc(w.finished_at)&&Date.parse(w.started_at)>Date.parse(i?witnesses[0].finished_at:completion.finished_at)&&Date.parse(w.finished_at)>=Date.parse(w.started_at)&&
        equal(w.start_binding,binding)&&equal(w.end_binding,binding),"witness_binding_invalid");
      const r=w.result;requireThat(r?.exit_code===(i?0:1)&&r.signal===null&&r.timed_out===false&&r.cancelled===false&&r.cleanup_completed===true&&r.exit_observed===true&&r.streams_closed===true&&
        r.remaining_owned_processes===0&&r.termination_reason==="natural_exit"&&Number.isSafeInteger(r.duration_ms)&&r.duration_ms>=0&&r.duration_ms<=environment.bound_ms,"natural_red_green_required");
      read(w.stdout,{json:false,maximum:2*1024*1024});latest=Math.max(latest,Date.parse(w.finished_at));
    }
    requireThat(witnesses[0].source_sha256!==witnesses[1].source_sha256,"unchanged_repair");
  }
  requireThat(equal([...new Set(addressed)].sort(),faults),"incomplete_repair");
  const history=read(e.history);keys(history,"parent_evidence_sha256 observations adverse known_index cumulative_cost historical_causes");
  requireThat(history.parent_evidence_sha256===(prior.source_correction.evidence??prior.source_correction.campaign).sha256&&history.historical_causes==="retained_without_reclassification"&&text(history.cumulative_cost)&&
    Array.isArray(history.observations)&&history.observations.length>0&&history.observations.length<=200&&unique(history.adverse),"history_invalid");
  const ids=[];for(const item of history.observations){keys(item,"id original adverse limitations");requireThat(text(item.id)&&typeof item.adverse==="boolean"&&text(item.limitations),"history_invalid");ids.push(item.id);read(item.original,{json:false,maximum:2*1024*1024});}
  requireThat(unique(ids)&&equal(history.adverse,history.observations.filter(x=>x.adverse).map(x=>x.id))&&equal(read(history.known_index),history.observations),"adverse_evidence_omitted");
  const planner=read(e.planner);requireThat(planner.base===p.base&&planner.head===p.head&&planner.selected_plan==="full-canonical"&&Array.isArray(planner.phases)&&planner.phases.length===16&&unique([...planner.phases].sort())&&unique(planner.owners),"planner_invalid");
  keys(review,"target evidence_sha256 delta_sha256 reviewer implementation_actor reviewed_at no_write source_review disposition judgments report");
  keys(review.judgments,"substantive_repairs all_faults_addressed complete_delta affected_consumers no_weakened_contract complete_adverse_history safe_input_order");
  requireThat(equal(review.target,maintenanceTarget(p))&&review.evidence_sha256===digest(e)&&review.delta_sha256===e.source.delta_sha256&&text(review.reviewer)&&review.reviewer!==e.implementation_actor&&
    review.implementation_actor===e.implementation_actor&&utc(review.reviewed_at)&&Date.parse(review.reviewed_at)>latest&&review.no_write===true&&review.source_review==="complete"&&review.disposition==="accept"&&Object.values(review.judgments).every(x=>x===true),"independent_review_required");
  const report=read(review.report,{json:false});requireThat(report.includes(p.head)&&report.includes(digest(e))&&report.includes(e.source.delta_sha256),"review_report_unbound");
  return {evidence:e,review,prior,completion,receipt,stock,runtime,dependencies,history,planner,read};
}

// Preparation is ordinary task-owned setup before admission. These observations
// are current physical inputs, not a promise that later npm ci will repair them.
export function inspectMaintenanceInputs(root,e) {
  for(const expected of e.dependencies){
    const current=observePreparedDependencyInputs({repositoryRoot:root,phaseId:expected.phase_id});
    requireThat(comparePreparedDependencyInputs(expected,current)==="unchanged","current_inputs_unsafe_or_changed");
  }
}
export function observeMaintenanceSetup(root) {
  const observations=[],issues=[];
  for(const phaseId of MAINTENANCE_PHASES)try{const value=observePreparedDependencyInputs({repositoryRoot:root,phaseId});preparedDependencyIdentity(value);observations.push(value);}
  catch(error){issues.push({phase_id:phaseId,code:error.code??error.message});}
  return {live_inputs_ready:issues.length===0,observations,issues,admission:false,reserved:false};
}
function operative(body,prefix,shape){requireThat(typeof body==="string"&&body.startsWith(prefix+"\n"),"operative_authority_required");const v=parseImprovementJSON(body.slice(prefix.length+1));keys(v,shape);return v;}
export const maintenanceAuthorityObservation = (record,role) => improvementAuthorityObservation(record,role);
export function validateMaintenanceAuthorityRecords(p,e,records,{current=true}={}) {
  keys(records,"acceptance grant acceptance_permission grant_permission pull_request");
  const {acceptance:a,grant:g}=records, common="target evidence_sha256 review_sha256";
  const av=operative(a.body,MAINTENANCE_ACCEPT,common+" independent_report_sha256 scope");
  const gv=operative(g.body,MAINTENANCE_GRANT,common+" acceptance_sha256 planner_sha256 history_sha256 terminal_predecessor maximum_invocations recovery unchanged_retry stop_on_failure_or_interruption fresh_validation independent_result_audit owned_cleanup cumulative_cost_and_timing_risk");
  for(const v of [av,gv])requireThat(equal(v.target,maintenanceTarget(p))&&v.evidence_sha256===digest(e.evidence)&&v.review_sha256===digest(e.review),"authority_binding_invalid");
  const observations={accepted_maintenance:maintenanceAuthorityObservation(a,"accepted_maintenance"),prospective_grant:maintenanceAuthorityObservation(g,"prospective_grant")};
  requireThat(av.scope===MAINTENANCE_KIND&&av.independent_report_sha256===e.review.report.sha256&&gv.acceptance_sha256===digest(observations.accepted_maintenance)&&gv.planner_sha256===digest(e.planner)&&
    gv.history_sha256===e.evidence.history.sha256&&gv.terminal_predecessor===p.prior_receipt_fingerprint&&gv.maximum_invocations===1&&gv.recovery===0&&gv.unchanged_retry===0&&
    gv.stop_on_failure_or_interruption===true&&gv.fresh_validation===true&&gv.independent_result_audit===true&&gv.owned_cleanup===true&&gv.cumulative_cost_and_timing_risk==="accept_once_under_unchanged_bounds","authority_scope_invalid");
  const url="https://api.github.com/repos/hynk-studio/augnes";
  requireThat(a.id===p.authorization.acceptance_review_id&&g.id===p.authorization.grant_comment_id&&a.id!==g.id&&a.commit_id===p.head&&a.pull_request_url===`${url}/pulls/${p.pull_request}`&&
    ["COMMENTED","APPROVED"].includes(a.state)&&g.issue_url===`${url}/issues/${p.pull_request}`&&g.created_at===g.updated_at&&
    [a,g].every(x=>x.user?.type==="User"&&id(x.user.id)&&/^[A-Za-z0-9-]{1,39}$/u.test(x.user.login)&&["OWNER","MEMBER","COLLABORATOR"].includes(x.author_association))&&
    externalUtc(a.submitted_at)&&externalUtc(g.created_at)&&strictlyAfter(a.submitted_at,e.review.reviewed_at)&&strictlyAfter(g.created_at,a.submitted_at)&&strictlyAfter(g.created_at,e.completion.finished_at)&&
    digest(observations.accepted_maintenance)===p.authorization.acceptance_review_sha256&&digest(observations.prospective_grant)===p.authorization.grant_comment_sha256,"authenticated_record_invalid");
  for(const [record,permission]of [[a,records.acceptance_permission],[g,records.grant_permission]])requireThat(permission.user?.login===record.user.login&&permission.user?.id===record.user.id&&["admin","maintain"].includes(permission.permission),current?"current_authorization_refused":"historical_permission_invalid");
  const pr=records.pull_request;
  requireThat(pr.number===p.pull_request&&pr.base?.repo?.full_name==="hynk-studio/augnes"&&pr.head?.repo?.full_name==="hynk-studio/augnes"&&pr.state==="open"&&pr.draft===true&&pr.auto_merge===null&&
    pr.head.sha===p.head&&pr.head.ref===p.branch&&pr.base.sha===p.base&&pr.base.ref==="main",current?"current_applicability_refused":"historical_target_invalid");
  return observations;
}
export async function observeMaintenanceAuthority(p,e,transport=createGitHubObserverAuthorizationTransport(p.pull_request)) {
  validateMaintenanceProof(Object.fromEntries(Object.entries(p).filter(([k])=>k!=="local_relative_path")));
  const a=await transport.review(p.authorization.acceptance_review_id),g=await transport.grant(p.authorization.grant_comment_id);
  const records={acceptance:a,grant:g,acceptance_permission:await transport.permission(a.user?.login),grant_permission:await transport.permission(g.user?.login),pull_request:await transport.pullRequest()};
  const observations=validateMaintenanceAuthorityRecords(p,e,records);
  const user=u=>({login:u.login,id:u.id,type:u.type});
  const project=(v,grant)=>({id:v.id,user:user(v.user),body:v.body,author_association:v.author_association,...(grant?{issue_url:v.issue_url,created_at:v.created_at,updated_at:v.updated_at}:{state:v.state,commit_id:v.commit_id,pull_request_url:v.pull_request_url,submitted_at:v.submitted_at})});
  records.acceptance=project(a,false);records.grant=project(g,true);
  for(const k of ["acceptance_permission","grant_permission"])records[k]={permission:records[k].permission,user:user(records[k].user)};
  const pr=records.pull_request, branch=v=>({sha:v.sha,ref:v.ref,repo:{full_name:v.repo.full_name}});
  records.pull_request={number:pr.number,state:pr.state,draft:pr.draft,auto_merge:pr.auto_merge,base:branch(pr.base),head:branch(pr.head)};
  requireThat(Buffer.byteLength(JSON.stringify(records))<=16*1024,"authority_unbounded");return Object.freeze({records,observations});
}
export async function authorizeMaintenance(p,e,transport){const value=await observeMaintenanceAuthority(p,e,transport);capabilities.set(value,{proof:digest(p),value:digest(value)});return value;}
export function assertMaintenanceAuthorization(p,e,value){const state=capabilities.get(value);requireThat(state&&state.proof===digest(p)&&state.value===digest(value)&&equal(validateMaintenanceAuthorityRecords(p,e,value.records),value.observations),"authenticated_capability_required");}
export function validMaintenanceAttempt(a){
  try{requireThat(isMaintenance(a?.source_correction)&&a.number===1&&equal(a.budget,{initial:1,recovery:0})&&a.recovery===null&&a.prior_attempt_id===null&&a.prior_receipt_fingerprint===null&&
    !Object.hasOwn(a,"improvement_authority")&&!Object.hasOwn(a,"revision_authority"),"attempt_invalid");
    keys(a.maintenance_authority,"records observations");keys(a.maintenance_authority.observations,"accepted_maintenance prospective_grant");
    for(const [role,o]of Object.entries(a.maintenance_authority.observations)){keys(o,"id author author_id body_sha256 timestamp role commit_id");requireThat(o.role===role&&id(o.id)&&id(o.author_id)&&sha(o.body_sha256)&&externalUtc(o.timestamp)&&text(o.author)&&(role==="prospective_grant"?o.commit_id===null:o.commit_id===a.head),"attempt_invalid");}return true;
  }catch{return false;}
}
