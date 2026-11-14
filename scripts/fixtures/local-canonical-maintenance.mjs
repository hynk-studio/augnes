// Synthetic protocol fixtures, never real authority, witnesses or qualification.
import fs from "node:fs";
import path from "node:path";
import { createImprovementFixture, write, natural } from "./local-canonical-improvement.mjs";
import { dependencyRecords } from "./local-canonical-browser-successor.mjs";
import { beginAttempt, finishAttempt, readSourceCorrectionProof, improvementMaterial, maintenanceMaterial } from "../local-canonical-attempts.mjs";
import { authorizeImprovement } from "../local-canonical-improvement.mjs";
import { MAINTENANCE_KIND, MAINTENANCE_ACCEPT, MAINTENANCE_GRANT, maintenanceTarget, maintenanceFaults, maintenanceAuthorityObservation, authorizeMaintenance } from "../local-canonical-maintenance.mjs";
import { canonicalSerialize, finalizeReceipt } from "../local-canonical-receipt.mjs";
import { digest } from "../local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "../local-canonical-environment.mjs";
export async function createMaintenanceFixture(root,env,prepare=null) {
  const c=createImprovementFixture(root,env);
  const terminal=await beginAttempt({...c.request(),runId:"terminal-improvement",revisionAuthorization:await authorizeImprovement(c.proof,improvementMaterial(c.checkout,c.proof),c.transport())});
  const fault={resource:"dependencies-web-planning",classification:"execution",disposition:"safety_violation",before:null,after:null};
  const receipt=finalizeReceipt({receipt_version:4,repository:{branch:c.branch,base_sha:c.base,head_sha:c.head,tree_sha:c.tree},run:{id:terminal.attempt_id},attempt:terminal,
    phases:[{id:"integration",status:"failure",failure:"synthetic pin refusal"}],inputs:{first_fault:fault,events:[fault],secondary_faults:[]},outcome:{disposition:"safety_violation"},cleanup:{completed:true}});
  write(path.join(c.checkout,`.augnes-local-verification/receipts/${terminal.attempt_id}.json`),receipt);
  finishAttempt(terminal,{receiptFingerprint:receipt.integrity.content_fingerprint,disposition:"safety_violation",cleanupComplete:true});
  c.terminal=terminal;c.terminalReceipt=receipt;c.priorRoot=path.join(c.anchor,".augnes-local-verification/families",terminal.family_id);
  // Synthetic timeline construction only, before taking the immutable originals.
  const completionFile=path.join(c.priorRoot,"completion-1.json"),completion=JSON.parse(fs.readFileSync(completionFile));
  const clock=Date.now()-30000,at=n=>new Date(clock+n).toISOString();completion.finished_at=at(0);write(completionFile,completion);
  const packages=prepare?await prepare(c):dependencyRecords(c,c.checkout);
  c.git(["add","package.json","package-lock.json","apps/augnes_apps/package.json","apps/augnes_apps/package-lock.json","apps/web_planning/package.json","apps/web_planning/package-lock.json"]);
  c.head=c.commit("export function read(validate){validate();return 2;}\n");c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.folder=path.join(c.checkout,".augnes-local-verification/maintenance");c.file=path.join(c.folder,"proof.json");
  c.ref=(name,value)=>{write(path.join(c.folder,name),value);return{artifact:name,sha256:digest(fs.readFileSync(path.join(c.folder,name)))};};
  c.p={schema:"augnes.local-canonical-source-correction.v2",kind:MAINTENANCE_KIND,branch:c.branch,base:c.base,head:c.head,tree:c.tree,pull_request:999,
    prior_family_id:terminal.family_id,prior_number:1,prior_attempt_id:terminal.attempt_id,prior_receipt_fingerprint:receipt.integrity.content_fingerprint,
    prior_receipt_path:`.augnes-local-verification/receipts/${terminal.attempt_id}.json`,evidence:null,review:null,authorization:null};
  const module="lib/work.mjs",driver=c.ref("regression.mjs","// Synthetic natural RED/GREEN fixture material\n"), input=c.ref("input.json",{value:2});
  const environment=c.ref("environment.json",{runtime:c.inputs,node_version:CANONICAL_NODE_VERSION,command:["node","regression.mjs"],bound_ms:10000,inputs:[input]});
  c.w=[terminal,c.p].map((v,i)=>{const source=digest(c.git(["show",`${v.head}:${module}`]));const binding={source_sha256:source,fixture_sha256:driver.sha256,environment_fingerprint:environment.sha256};
    return {source_head:v.head,source_tree:v.tree,source_module:module,source_sha256:source,fixture_sha256:driver.sha256,environment_fingerprint:environment.sha256,node_version:CANONICAL_NODE_VERSION,
      started_at:at(1000+i*2000),finished_at:at(2000+i*2000),start_binding:binding,end_binding:binding,result:{...natural,exit_code:i?0:1},stdout:c.ref(i?"green.log":"red.log",i?"synthetic pass\n":"synthetic assertion failure\n")};});
  const observations=[{id:"known-adverse",original:c.ref("adverse.json",{slow_pass_ms:29751,margin_ms:249,synthetic:true}),adverse:true,limitations:"Synthetic history; no actual observation or latency claim."}];
  c.history={parent_evidence_sha256:terminal.source_correction.campaign.sha256,observations,adverse:["known-adverse"],known_index:c.ref("known-index.json",observations),cumulative_cost:"Synthetic accumulated attempts and adverse samples retained.",historical_causes:"retained_without_reclassification"};
  c.e={target:maintenanceTarget(c.p),originals:{attempt:c.ref("prior-attempt.json",fs.readFileSync(path.join(c.priorRoot,"attempt-1.json"))),completion:c.ref("prior-completion.json",fs.readFileSync(completionFile)),receipt:c.ref("prior-receipt.json",receipt),stock:c.ref("prior-stock.json",{valid_deciding_evidence:false,content_fingerprint:receipt.integrity.content_fingerprint,issues:["synthetic_safety_failure"]})},
    source:{delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",terminal.head,c.head,"--"])),changed_paths:c.git(["diff","--name-only",terminal.head,c.head,"--"]).toString().trim().split("\n").sort()},
    repairs:[{id:"functional-repair",source_module:module,fixture:driver,environment,before:null,after:null,addresses:maintenanceFaults(receipt)}],inputs:{runtime:c.ref("runtime.json",c.inputs),dependencies:c.ref("dependencies.json",packages.map(x=>x.before))},history:null,
    planner:c.ref("planner.json",{...JSON.parse(fs.readFileSync(path.join(c.checkout,".augnes-local-verification/improvement/planner.json"))),head:c.head}),implementation_actor:"synthetic-implementer"};
  c.r={target:maintenanceTarget(c.p),evidence_sha256:null,delta_sha256:c.e.source.delta_sha256,reviewer:"synthetic-independent-reviewer",implementation_actor:c.e.implementation_actor,reviewed_at:at(6000),no_write:true,source_review:"complete",disposition:"accept",
    judgments:Object.fromEntries("substantive_repairs all_faults_addressed complete_delta affected_consumers no_weakened_contract complete_adverse_history safe_input_order".split(" ").map(k=>[k,true])),report:null};
  c.rebuild=(authorization=true)=>{
    c.e.repairs[0].before=c.ref("before.json",c.w[0]);c.e.repairs[0].after=c.ref("after.json",c.w[1]);c.e.history=c.ref("history.json",c.history);c.p.evidence=c.ref("evidence.json",c.e);
    c.r.evidence_sha256=digest(c.e);c.r.report=c.ref("review.md",`Synthetic review ${c.head} ${c.e.source.delta_sha256} ${digest(c.e)}\n`);c.p.review=c.ref("review.json",c.r);
    if(authorization){
      const user={login:"fixture-owner",id:11,type:"User"},url="https://api.github.com/repos/hynk-studio/augnes",common={target:maintenanceTarget(c.p),evidence_sha256:digest(c.e),review_sha256:digest(c.r)};
      c.a={id:101,user,author_association:"OWNER",state:"COMMENTED",commit_id:c.head,pull_request_url:`${url}/pulls/999`,submitted_at:at(7000),body:MAINTENANCE_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:c.r.report.sha256,scope:MAINTENANCE_KIND})};
      c.g={id:102,user,author_association:"OWNER",issue_url:`${url}/issues/999`,created_at:at(8000),updated_at:at(8000),body:MAINTENANCE_GRANT+"\n"+canonicalSerialize({...common,acceptance_sha256:digest(maintenanceAuthorityObservation(c.a,"accepted_maintenance")),planner_sha256:c.e.planner.sha256,history_sha256:c.e.history.sha256,terminal_predecessor:c.p.prior_receipt_fingerprint,
        maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_unchanged_bounds"})};
      c.p.authorization={acceptance_review_id:c.a.id,acceptance_review_sha256:digest(maintenanceAuthorityObservation(c.a,"accepted_maintenance")),grant_comment_id:c.g.id,grant_comment_sha256:digest(maintenanceAuthorityObservation(c.g,"prospective_grant"))};
      c.records={acceptance:c.a,grant:c.g,acceptance_permission:{permission:"admin",user},grant_permission:{permission:"maintain",user},pull_request:{number:999,state:"open",draft:true,auto_merge:null,base:{sha:c.base,ref:"main",repo:{full_name:"hynk-studio/augnes"}},head:{sha:c.head,ref:c.branch,repo:{full_name:"hynk-studio/augnes"}}}};
    }else c.p.authorization=null;
    write(c.file,c.p);c.proof={...c.p,local_relative_path:path.relative(c.checkout,c.file)};return c.proof;
  };
  c.syntheticDependencies=packages.map(x=>({...x,prerequisite:x.before}));c.proof=c.rebuild();
  c.material=()=>maintenanceMaterial(c.checkout,c.proof);c.authorize=()=>authorizeMaintenance(c.proof,c.material(),c.transport());
  c.reserve=async(options={})=>beginAttempt({...c.request(),runId:"maintenance",...options,revisionAuthorization:await c.authorize()});
  readSourceCorrectionProof(c.file,c.checkout);return c;
}
