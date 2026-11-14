// Synthetic parser/phase/authority controls. No real history or execution authority.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { digest,inputEventIdentity } from "../local-canonical-inputs.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { gitRevisionInventory,gitRevisionStockComparison,GIT_CURRENT_STOCK_COMPARISON,verifyGitRevisionFailure,
  stockVerifierDelegation,delegatesMaterialSourceCommission,stockVerifierAuthorityBindings,stockVerifierAuthorityScope,
  STOCK_VERIFIER_GRANT,INTEGRATION_BUDGET_LIMIT,MATERIAL_HISTORY_BOUNDARY,verifyGitSourceRepair,MATERIAL_COMMON_DRIVER } from "../local-canonical-git-observation.mjs";
import { MATERIAL_STOCK_PREDECESSOR,verifyStockVerifierPredecessor } from "../local-canonical-material-stock-predecessor.mjs";
import { PROJECT_EXPERIENCE_SERIAL,PROJECT_EXPERIENCE_COMMITMENT,projectExperienceElapsed } from "../project-experience-serial-budget.mjs";
import { BROWSER_IDENTITY_PREFIX } from "../local-canonical-browser-identity.mjs";

export function runMaterialStockPredecessorControls(c,baseReceipt) {
  const r=structuredClone(baseReceipt),failed=r.phases.findIndex(v=>v.id==="e2e-project-experience"),artifacts=new Map();
  const art=(name,data)=>{const value=Buffer.isBuffer(data)?data:Buffer.from(data);artifacts.set(name,value);return{artifact:name,sha256:digest(value)};};
  const bytes=(ref,maximum=512*1024)=>{const b=artifacts.get(ref.artifact);assert(b&&b.length<=maximum&&digest(b)===ref.sha256);return b;};
  const start=Date.parse(r.run.started_at)-500000;
  r.run.started_at=new Date(start).toISOString();r.run.finished_at=new Date(start+190000).toISOString();r.run.duration_ms=190000;
  r.integration_base.contract="augnes.local-canonical-integration-base.v2";r.integration_base.checked_at=new Date(start+1).toISOString();
  if(r.integration_base.observation)r.integration_base.observation.observed_at=r.integration_base.checked_at;
  const cleanup=structuredClone(r.phases[0].cleanup),exe=r.inputs.resources.find(v=>v.id==="browser-executable");
  for(const [i,phase]of r.phases.entries())Object.assign(phase,{status:i<failed?"pass":i===failed?"failure":"not_run",
    exit_status:i<failed?0:i===failed?1:null,failure_code:i<failed?null:i===failed?"serial_execution_incomplete":"phase_not_run",
    started_at:i>failed?null:new Date(start+i*10).toISOString(),finished_at:i>failed?null:new Date(start+(i===failed?183090:i*10+10)).toISOString(),
    duration_ms:i>failed?0:i===failed?183000:10,cleanup:i>failed?null:structuredClone(cleanup),
    environment_fingerprint:i>failed?null:r.inputs.binding.phase_environment_fingerprints[i].fingerprint,
    browser_use:i===failed?phase.browser_use.slice(0,3):i>failed?[]:phase.browser_use});
  const phase=r.phases[failed];Object.assign(phase,{label:"Canonical project experience Browser owner",browser:true,exclusive:true,cwd_scope:"root",
    command:"node scripts/run-canonical-test-suite.mjs e2e-project-experience",head_sha:r.repository.head_sha,base_sha:r.repository.base_sha,invocation_id:r.run.invocation_id});
  Object.assign(r.evidence,{deciding:false,mode:"full",selected_plan:"full-canonical"});
  Object.assign(r.outcome,{disposition:"product_failure",validity:"valid_within_observed_scope",safety:"preserved_within_observed_scope",execution:"incomplete_or_failed",first_fault:null});
  Object.assign(r.final,{result:"failure",exit_status:1,reason_codes:["selected_phases_incomplete","serial_execution_incomplete"]});
  const old=r.inputs.resources.find(v=>v.id==="git-config"),after=structuredClone(old.before);
  for(const key of ["inode","mtime_ns","ctime_ns"])after.metadata[key]=String(BigInt(after.metadata[key])+1n);
  const event={resource:"git-config",classification:"execution",disposition:"ambient_observation",observed_at:new Date(start+100).toISOString(),monotonic_ns:"1",after};
  event.identity=inputEventIdentity(event);r.inputs.events=[event];r.inputs.first_fault=null;r.inputs.secondary_faults=[];
  const budget={contract:PROJECT_EXPERIENCE_SERIAL.contract,commitment:PROJECT_EXPERIENCE_COMMITMENT,
    execution_ms:[950,950,179950,0],natural_settlement_ms:[50,50,350,0],coordinator_ms:500,completed_children:3,complete:false,
    failure_code:"serial_execution_incomplete",parent_forced_terminal_cleanup_ms:null,parent_post_exit_settlement_ms:40};
  budget.envelope_elapsed_ms=projectExperienceElapsed(budget);phase.serial_budget=budget;
  phase.log={relative_path:`.augnes-local-verification/logs/${r.run.id}/e2e-project-experience.log`,bytes:2*1024*1024,truncated:true};
  const original=finalizeReceipt(r),prior=original.attempt;
  const stock={valid_deciding_evidence:false,status:"non_deciding_or_stale",content_fingerprint:original.integrity.content_fingerprint,
    dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"preserved_within_observed_scope",current_merge_applicability:"different_current_main"},
    issues:["receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding","receipt_attempt_records_unverified",
      "receipt_browser_identity_invalid:e2e-project-experience","receipt_phase_environment_binding_invalid",...original.phases.filter(v=>v.status!=="pass").map(v=>"phase_not_passing:"+v.id)].sort()};
  const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",branch:c.branch,pull_request:999,
    base:original.repository.base_sha,head:c.head,tree:c.tree,prior_family_id:prior.family_id,prior_attempt_id:prior.attempt_id,
    prior_receipt_fingerprint:original.integrity.content_fingerprint,accepted:{review:{id:100}},inputs:{inventory_sha256:digest("current fixture"),identity_sha256:digest(c.inputs)},
    commission:{source_revision:"material-source-correction-v1",evidence_kind:"git-config-stock-verifier-repair-v1",delegation:{id:101},root_receipt_fingerprint:original.integrity.content_fingerprint}};
  const prefix="[canonical:e2e-project-experience] ",owner="[canonical:local-full] ",label=JSON.stringify(phase.label),body=[];
  body.push(`${owner}child_start label=${label} timeout_ms=730000`,`${owner}child_spawn label=${label} pid=42 wait=process_exit`);
  const roots=PROJECT_EXPERIENCE_SERIAL.children.map((child,i)=>({child_resource_owned:child.id,root:"/synthetic/owned/ag-c0"+(i+1)+"-test",device:"1",inode:String(i+2)}));
  const suiteOwned={suite_resource_owned:"e2e-project-experience",root:"/synthetic/owned/ag-suite-test",device:"1",inode:"1"};
  body.push(JSON.stringify(suiteOwned),...roots.map(v=>JSON.stringify(v)));
  for(let i=0;i<3;i++){
    const child=PROJECT_EXPERIENCE_SERIAL.children[i],q=JSON.stringify(child.label),duration=i<2?1000:180300;
    body.push(`${prefix}child_start label=${q} timeout_ms=${child.timeoutMs}`);
    if(i<2)for(const use of original.phases[failed].browser_use.filter(v=>v.consumer===(i===0?"project-experience":"project-client")))
      body.push(BROWSER_IDENTITY_PREFIX+JSON.stringify(use));
    if(i===2)body.push("synthetic observation ".repeat(110000));
    body.push(`${prefix}child_cleanup_start label=${q} elapsed_ms=${i<2?950:179999} reason=${i<2?"post_exit_settlement":"bounded_timeout"} exit_observed=${i<2} stdout_closed=${i<2} stderr_closed=${i<2}`,
      `${prefix}child_cleanup_result label=${q} elapsed_ms=${duration-1} reason=${i<2?"post_exit_settlement":"bounded_timeout"} ${i<2?"term_sent=false kill_sent=false ":""}streams_closed=true remaining_owned_processes=0`,
      `${prefix}child_result label=${q} duration_ms=${duration} exit_code=${i<2?0:143} signal=null timed_out=${i===2} exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=${i<2?"natural_exit":"bounded_timeout"}`);
  }
  body.push(JSON.stringify({suite:"e2e-project-experience",resource_cleanup:[...roots,suiteOwned].map(v=>({root:v.root,completed:true,failure_count:0,failures:[]}))}));
  const childBudget={...budget,execution_ms:[950,950,180001,0],natural_settlement_ms:[50,50,300,0],failure_code:"serial_child_execution_budget_exceeded"};childBudget.envelope_elapsed_ms=projectExperienceElapsed(childBudget);
  delete childBudget.parent_forced_terminal_cleanup_ms;delete childBudget.parent_post_exit_settlement_ms;
  body.push(JSON.stringify({serial_budget:childBudget}),`${owner}child_exit label=${label} elapsed_ms=182960 exit_code=1 signal=null stdout_closed=true stderr_closed=true`,
    `${owner}child_cleanup_start label=${label} elapsed_ms=182960 reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true`,
    `${owner}child_cleanup_result label=${label} elapsed_ms=183000 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`,
    `${owner}child_result label=${label} duration_ms=183000 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`);
  const lines=["[local-canonical] start mode=full selected_plan=full-canonical",`[local-canonical] base=${p.base}`,`[local-canonical] head=${original.repository.head_sha}`];
  for(const value of original.phases.slice(0,failed))lines.push(`[local-canonical] phase_start id=${value.id} timeout_ms=1000`,`[local-canonical] phase_result id=${value.id} status=pass duration_ms=10`);
  lines.push("[local-canonical] phase_start id=e2e-project-experience timeout_ms=730000",...body,
    "[local-canonical] phase_result id=e2e-project-experience status=failure duration_ms=183000",
    "[local-canonical] failure phase=e2e-project-experience code=serial_execution_incomplete","[local-canonical] cleanup_start",
    "[local-canonical] cleanup_result completed=true remaining_owned_processes=0 generated_next_present_after_execution_cleanup=false generated_next_present_after_service_restore=false generated_windows_helper_present=false",
    `[local-canonical] receipt=.augnes-local-verification/receipts/${original.run.id}.json fingerprint=${original.integrity.content_fingerprint}`,
    "[local-canonical] final result=failure deciding=false duration_ms=190000");
  const capture=Buffer.from(lines.join("\n")+"\n"),native=Buffer.from(body.filter(v=>!v.startsWith(owner)).join("\n")+"\n").subarray(0,2*1024*1024);
  const tailAt=capture.indexOf(Buffer.from(prefix+'child_cleanup_start label="durable web planning'));
  const current=structuredClone(original.inputs);current.resources.find(v=>v.id==="git-config").before=after;
  const incident={contract:MATERIAL_STOCK_PREDECESSOR,receipt:p.prior_receipt_fingerprint,cause:"UNKNOWN",interrupted_operation:"UNKNOWN",
    native_log:{artifact:art("native.log",native),...phase.log},outer_capture:{artifact:art("outer.log",capture),original_path:"/synthetic/original/outer.log",bytes:capture.length},
    terminal_slice:{artifact:art("terminal.log",capture.subarray(tailAt)),offset:tailAt,bytes:capture.length-tailAt},
    git_metadata:{resource:"git-config",event_identity:event.identity,before_inventory_sha256:gitRevisionInventory(original.inputs),observed_inventory_sha256:gitRevisionInventory(current)}};
  const git=args=>readFileSync(new URL("../"+args[1].slice(args[1].indexOf(":")+1).replace(/^scripts\//u,""),import.meta.url));
  const check=(o=original,s=stock,f={predecessor:incident},proof=p)=>{
    const profile=verifyStockVerifierPredecessor(proof,o.attempt,f,{original:o,stock:s,bytes,git,inventory:gitRevisionInventory,stockComparison:gitRevisionStockComparison,stockContract:GIT_CURRENT_STOCK_COMPARISON});
    verifyGitRevisionFailure(o,s,c.inputs,o.phases.map(v=>v.id),1,false,false,false,true,profile);return profile;
  };
  assert.doesNotThrow(()=>check());
  assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,original.phases.map(v=>v.id),1,false,false,false,true));
  assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,original.phases.map(v=>v.id),1,false,false,false,true,{contract:MATERIAL_STOCK_PREDECESSOR}));
  let refusals=2;
  for(const mutate of [o=>o.phases[failed].browser_use.reverse(),o=>o.phases[failed].browser_use.pop(),o=>o.phases[failed+1].browser_use=[o.phases[failed].browser_use[0]],
    o=>o.phases[failed].cleanup.remaining_owned_processes=1,o=>o.phases[failed].timed_out=true,o=>o.cleanup.completed=false,
    o=>o.inputs.events[0].after.sha256=digest("other bytes"),o=>o.inputs.events[0].after.metadata.links="2",
    o=>o.inputs.events[0].after.git_projection.scope_fingerprint=digest("other scope"),o=>o.integration_base.contract="unsupported",
    o=>o.phases[failed].serial_budget.completed_children=2,o=>o.phases[failed].log.truncated=false]){
    const changed=structuredClone(original);mutate(changed);assert.throws(()=>check(changed));refusals++;
  }
  for(const mutate of [i=>i.cause="diagnosed",i=>i.interrupted_operation="assumed",i=>i.terminal_slice.offset++,i=>i.native_log.bytes--,
    i=>i.outer_capture.bytes++,i=>i.contract="unknown",i=>i.git_metadata.observed_inventory_sha256=digest("unbound"),i=>i.unexpected=true]){
    const changed=structuredClone(incident);mutate(changed);assert.throws(()=>check(original,stock,{predecessor:changed}));refusals++;
  }
  const badStock=structuredClone(stock);badStock.issues.push("unexplained");assert.throws(()=>check(original,badStock));refusals++;
  for(const change of [text=>text.replace('"root":"/synthetic/owned/ag-c01-test","completed"','"root":"/foreign/root","completed"'),
    text=>{const rows=text.split("\n"),i=rows.findIndex(row=>row.startsWith('{"serial_budget":')),j=rows.findIndex(row=>row.startsWith('{"suite":"e2e-project-experience","resource_cleanup":'));[rows[i],rows[j]]=[rows[j],rows[i]];return rows.join("\n");},
    text=>text.replace("deciding=false duration_ms=190000","deciding=false duration_ms=190001"),
    text=>text.replace(`${owner}child_exit label=${label} elapsed_ms=182960`,`${owner}child_exit label=${label} elapsed_ms=NaN`)]){
    const altered=Buffer.from(change(capture.toString())),changed=structuredClone(incident);
    const at=altered.indexOf(Buffer.from(prefix+'child_cleanup_start label="durable web planning'));
    changed.outer_capture={...changed.outer_capture,artifact:art("altered-outer.log",altered),bytes:altered.length};
    changed.terminal_slice={artifact:art("altered-tail.log",altered.subarray(at)),offset:at,bytes:altered.length-at};
    assert.throws(()=>check(original,stock,{predecessor:changed}));refusals++;
  }
  const delegation=stockVerifierDelegation(p),bindings=stockVerifierAuthorityBindings(p),review={body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",bindings,MATERIAL_HISTORY_BOUNDARY].join("\n\n")};
  const grant={body:[STOCK_VERIFIER_GRANT,bindings,"Accepted review: https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-100",MATERIAL_HISTORY_BOUNDARY,INTEGRATION_BUDGET_LIMIT].join("\n\n")};
  assert(delegatesMaterialSourceCommission(delegation,p));assert(stockVerifierAuthorityScope(p,review,grant));
  assert(!delegatesMaterialSourceCommission(delegation.replace("stock-verifier defect","product defect"),{...p,commission:{...p.commission,evidence_kind:undefined}}));
  assert(!stockVerifierAuthorityScope(p,review,{body:grant.body.replace("remain UNKNOWN","are repaired")}));
  assert(!stockVerifierAuthorityScope(p,review,{body:grant.body.replace("Exactly one admitted","Two admitted")}));
  const noGit=()=>{throw Error("unexpected source read before attribution dispatch");};
  assert.throws(()=>verifyGitSourceRepair(p,prior,{regression:{attribution:MATERIAL_COMMON_DRIVER}},{git:noGit}),/revision_git_regression_invalid/);
  assert.throws(()=>verifyGitSourceRepair({...p,commission:{...p.commission,evidence_kind:undefined}},prior,
    {regression:{attribution:"material-common-stock-verifier-driver-v1"}},{git:noGit}),/revision_git_regression_invalid/);
  console.log(JSON.stringify({material_stock_predecessor:{synthetic_only:true,accepted:1,refused:refusals,authority_controls:5,legacy_strict:true,raw_history_unchanged:true}}));
}
