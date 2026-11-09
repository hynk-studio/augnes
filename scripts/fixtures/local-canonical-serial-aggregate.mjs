// Synthetic repositories, physical ledgers and authenticated read transport.
// No production family, reservation, service, browser or GitHub write is used.
import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { digest } from "../local-canonical-inputs.mjs";
import { beginAttempt, finishAttempt, readSourceCorrectionProof, reconstructAttemptTip, inspectSerialAggregatePreparation, prepareSerialAggregateRevision,
  reviewedRevisionAuthorityObservation, REVIEWED_REVISION_PHASES } from "../local-canonical-attempts.mjs";
import { finalizeReceipt, inspectClassifiedEvidence } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { SERIAL_AGGREGATE_ROUTE, SERIAL_HISTORY, serialReviewTarget, readSerialAggregateIncident } from "../local-canonical-serial-aggregate.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT } from "../project-experience-serial-budget.mjs";
import { gitFixtureDeclaration, } from "./local-canonical-git-observation.mjs";
import { browserFixtureReceipt } from "./local-canonical-browser-revision.mjs";
import { browserConsumersForPhase } from "../local-canonical-browser-identity.mjs";
import { behavior, dependencyRecords, executeFixture } from "./local-canonical-browser-successor.mjs";

const clone=v=>structuredClone(v), time=n=>new Date(Date.now()+n).toISOString();
const names=["projectExperienceStep","projectClientBrowserStep","webPlanningBrowserStep"];
export async function runSerialAggregateControls(c,h) {
  const {write,read,artifact}=h, findings=[], phases=REVIEWED_REVISION_PHASES;
  const commit=message=>{c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m",message]);return c.git(["rev-parse","HEAD"]).toString().trim();};
  const suite="scripts/run-canonical-test-suite.mjs", parent="scripts/run-local-canonical-verification.mjs", budget="scripts/project-experience-serial-budget.mjs";
  const legacy=PROJECT_EXPERIENCE_SERIAL.children.map((v,i)=>`const ${names[i]} = {\n  id: ${JSON.stringify(v.id)}, group: ${JSON.stringify(v.group)}, requirements: ${JSON.stringify(v.requirements)}, label: ${JSON.stringify(v.label)},\n  ...rootNode(${JSON.stringify(v.args[2])}), timeoutMs: ${v.timeoutMs}, requireNaturalExit: true,\n};`).join("\n");
  write(path.join(c.checkout,suite),legacy+'\nconst suites = { "e2e-project-experience": [{ ...projectExperienceStep }, { ...projectClientBrowserStep }, { ...webPlanningBrowserStep }] };\n');
  write(path.join(c.checkout,parent),'const definitions = { "e2e-project-experience": { label: "fixture", suite: "e2e-project-experience", timeoutMs: 480000, } };\n');
  for(const child of PROJECT_EXPERIENCE_SERIAL.children) write(path.join(c.checkout,child.args[2]),'console.log("unchanged useful assertions");\n');
  c.head=commit("synthetic v2 source correction");c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  // Admit the actual ordinary v2 edge first, including natural RED/GREEN.
  c.artifacts=path.join(c.checkout,".augnes-local-verification/v2");
  const a=c.prior.attempt, old=c.prior, fixture='import assert from "node:assert/strict"; const m=await import(process.argv[2]);assert.equal(m.value,3);\n';
  write(path.join(c.artifacts,"regression.mjs"),fixture);
  const witnesses={};
  for(const [key,head,code] of [["before",a.head,1],["after",c.head,0]]) {
    const blob=c.git(["show",head+":scripts/fixture.mjs"]);write(path.join(c.artifacts,"subject.mjs"),blob);
    const result=await h.run({command:process.execPath,args:[path.join(c.artifacts,"regression.mjs"),new URL("file://"+path.join(c.artifacts,"subject.mjs")).href],
      cwd:c.checkout,env:c.env,timeoutMs:5000,stdout:{write(){}},stderr:{write(){}},log(){}});
    assert.equal(result.exit_code,code);
    const witness={fixture_sha256:digest(fixture),environment_fingerprint:digest(c.env),source_sha256:digest(blob),result,node_version:process.versions.node,finished_at:time(key==="before"?-5000:-4000)};
    witnesses[key]={...artifact(c,key+".json",witness),source_sha256:digest(blob)};
  }
  const review={schema:"augnes.local-canonical-candidate-review.v1",kind:"source_revision",head:c.head,tree:c.tree,
    predecessor_head:a.head,predecessor_tree:a.tree,source_review:"complete",addresses_disposition:"product_failure",addresses_resource:null,
    prior_fault_fingerprint:digest(null),authority_reference:"https://github.com/hynk-studio/augnes/issues/999",reviewed_at:time(-3000),
    delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",a.head,c.head,"--"])),changed_paths:c.git(["diff","--name-only",a.head,c.head,"--"]).toString().trim().split("\n").sort()};
  const v2={schema:"augnes.local-canonical-source-correction.v2",kind:"source_revision",branch:c.branch,head:c.head,tree:c.tree,
    prior_family_id:a.family_id,prior_number:a.number,prior_attempt_id:a.attempt_id,prior_receipt_fingerprint:old.integrity.content_fingerprint,
    prior_receipt_path:".augnes-local-verification/receipts/"+a.attempt_id+".json",defect:"wrong_export",source_module:"scripts/fixture.mjs",
    fixture_artifact:"regression.mjs",fixture_sha256:digest(fixture),environment_fingerprint:digest(c.env),...witnesses,review:artifact(c,"review.json",review)};
  c.file=path.join(c.artifacts,"proof.json");write(c.file,v2);
  const declared=gitFixtureDeclaration(c), plan=phases.map(id=>({id,timeoutMs:id==="e2e-project-experience"?480000:1000000,display:"node "+suite+" "+id,args:[suite,id]}));
  declared.binding={head:c.head,tree:c.tree,executor_fingerprint:digest("executor"),phase_inventory:digest(plan),phase_environment_fingerprints:phases.map(id=>({id,fingerprint:digest(id)}))};
  const second=beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:c.head,tree:c.tree,
    runId:"synthetic-v2-timeout",contractFingerprint:digest(declared),sourceCorrection:readSourceCorrectionProof(c.file,c.checkout)});
  const raw=browserFixtureReceipt(c,second), browser=declared.resources.find(r=>r.id==="browser-executable");
  const use={contract:"augnes.local-canonical-browser-use.v2",consumer:"project-experience",executable_name:"Fixture",location_fingerprint:browser.location_fingerprint,
    before:browser.before,after:browser.before,actual_version:"Chrome/1",runtime_versions:{http:"Chrome/1",cdp:"Chrome/1"},disposition:"unchanged",unchanged:true};
  const log=Array.from(["project-experience","project-client","project-client"],consumer=>"[local-canonical-browser-use] "+JSON.stringify({...use,consumer})+"\n").join("")+PROJECT_EXPERIENCE_SERIAL.children.map((v,i)=>`[canonical:e2e-project-experience] child_start label=${JSON.stringify(v.label)} timeout_ms=${v.timeoutMs}\n`+
    (i<2?`[canonical:e2e-project-experience] child_result label=${JSON.stringify(v.label)} duration_ms=${[328081,14302][i]} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`:"last observable ordinary-files checkpoint\n")).join("");
  const logPath=".augnes-local-verification/logs/synthetic-v2-timeout/e2e-project-experience.log";write(path.join(c.checkout,logPath),log);
  raw.executor={source_fingerprint:declared.binding.executor_fingerprint};
  raw.inputs={...declared,fingerprint:digest(declared),checks:1,events:[],first_fault:null,secondary_faults:[]};
  raw.phases=phases.map((id,i)=>({id,base_sha:c.base,head_sha:c.head,command:plan[i].display,browser:id.startsWith("e2e-"),
    status:i<9?"pass":i===9?"failure":"not_run",exit_status:i<9?0:null,timed_out:i===9,failure_code:i<9?null:i===9?"phase_timed_out":"phase_not_run",
    started_at:i<=9?time(-5000):null,finished_at:i<=9?time(-4000):null,duration_ms:i===9?480656:i<9?1:null,
    ...(i<=9?{environment_fingerprint:digest(id)}:{}),spawn_error_code:null,
    cleanup:i<=9?{completed:true,remaining_owned_processes:0,exit_observed:true,streams_closed:true,termination_reason:i===9?"bounded_timeout":"natural_exit"}:null,
    browser_use:i>9?[]:Object.entries(i===9?{"project-experience":1,"project-client":2}:browserConsumersForPhase(id)).flatMap(([consumer,n])=>Array.from({length:n},()=>({...use,consumer}))),
    ...(i===9?{log:{bytes:Buffer.byteLength(log),relative_path:logPath,truncated:false}}:{})}));
  for (const phase of raw.phases.slice(10)) {
    phase.cleanup={completed:false,remaining_owned_processes:null,termination_reason:null,exit_observed:false,streams_closed:false,listener_residue_count:null};
    phase.log={relative_path:null,bytes:0,truncated:false};
  }
  raw.historical_inputs={required:true,unchanged:true,completed:true,failures:[]};
  raw.evidence={mode:"changed",selected_plan:"full-canonical",deciding:false};
  raw.final={result:"failure",exit_status:1,reason_codes:["phase_timed_out","selected_phases_incomplete"]};
  raw.outcome={disposition:"unclassified_timeout",first_fault:null,safety:"preserved_within_observed_scope",validity:"valid_within_observed_scope"};
  c.prior=finalizeReceipt(raw);h.storeReceipt(c,c.prior);finishAttempt(second,{receiptFingerprint:c.prior.integrity.content_fingerprint,disposition:"unclassified_timeout",cleanupComplete:true});
  const priorRoot=path.join(c.anchor,".augnes-local-verification/families",second.family_id);
  const completion=path.join(priorRoot,"completion-1.json");write(completion,{...read(completion),finished_at:time(-3000)});
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,undefined);
  // Copy the actual reusable serial owner and driver into this synthetic source.
  const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
  const driver="scripts/test-project-experience-serial-budget.mjs";
  const ownerPaths=[budget,"scripts/canonical-child-runner.mjs",suite,parent,"scripts/canonical-test-environment.mjs","scripts/test-harness-process-lifecycle.mjs","scripts/project-experience-connection.mjs"];
  for(const name of [...ownerPaths,driver]) write(path.join(c.checkout,name),readFileSync(path.join(sourceRoot,name)));
  c.head=c.commit(4);c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.acceptedHead=c.head;c.acceptedTree=c.tree;
  c.git(["update-ref","refs/remotes/origin/main",c.base]);write(path.join(c.checkout,".git/info/exclude"),".augnes-local-verification/\n");
  h.prepare(c);let p=c.proof;
  p.commission={...p.commission,maximum_invocations:1,route:SERIAL_AGGREGATE_ROUTE,envelope_sha256:PROJECT_EXPERIENCE_COMMITMENT};
  p.inputs.inventory_sha256=digest("fresh fixture inventory");
  const incident={contract:SERIAL_AGGREGATE_ROUTE,predecessor:p.prior_receipt_fingerprint,interrupted_outcome:"UNKNOWN",envelope_sha256:PROJECT_EXPERIENCE_COMMITMENT,
    original_plan:artifact(c,"original-plan.json",plan),log:artifact(c,"original-log.log",log),log_identity:{relative_path:logPath,bytes:Buffer.byteLength(log),sha256:digest(log)},
    source:{head:second.head,tree:second.tree,suite_sha256:digest(c.git(["show",second.head+":"+suite])),parent_sha256:digest(c.git(["show",second.head+":"+parent]))}};
  p.incident=artifact(c,"incident.json",incident);
  const originalStock={content_fingerprint:p.prior_receipt_fingerprint,valid_deciding_evidence:false,dimensions:{historical_integrity:"intact",safety:"preserved_within_observed_scope"},
    issues:["receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid","receipt_browser_identity_invalid:e2e-project-experience",
      ...phases.slice(9).map(id=>"phase_not_passing:"+id)]};
  p.originals.stock=artifact(c,"prior-stock.log",JSON.stringify(originalStock));
  const bytes=(ref)=>readFileSync(path.join(c.artifacts,ref.artifact)),parse=ref=>JSON.parse(bytes(ref));
  const incidentRead=()=>readSerialAggregateIncident(p,c.prior,second,read(completion),{parse,bytes,git:c.git,phases,stock:originalStock});
  p.inputs.predecessor_sha256=digest(incidentRead());
  let output="";
  const result=await h.run({command:process.execPath,args:[driver],cwd:c.checkout,env:c.env,timeoutMs:15000,
    stdout:{write(chunk){output+=chunk;}},stderr:process.stderr,log(){}});
  assert.equal(result.exit_code,0);
  const owners=ownerPaths.map(name=>({path:name,sha256:digest(c.git(["show",p.head+":"+name]))}));
  const driverHash=digest(c.git(["show",p.head+":"+driver]));
  const record={command:"node "+driver,tested_source_head:p.head,finished_at:time(-2000),result,output,node_version:process.versions.node,
    runtime_inputs_sha256:p.inputs.identity_sha256,driver_sha256:driverHash,owners};
  const commandRecord=artifact(c,"focused-command.json",record),commandOutput=artifact(c,"focused-command.log",output);
  const focus={...parse(p.focused),finished_at:time(-1000),input_remedy_resources:[],failed_phase:"e2e-project-experience",serial_envelope_sha256:PROJECT_EXPERIENCE_COMMITMENT,
    implicated_paths:[suite,parent,budget],source_files:[suite,parent,budget].map(name=>{const b=c.git(["show",p.head+":"+name]);return{path:name,byte_size:b.length,sha256:digest(b)};}),
    commands:[{command:record.command,tested_source_head:p.head,result:record.result,record:commandRecord,stdout:commandOutput}],
    serial_control:{driver:{path:driver,sha256:driverHash},owners,record:commandRecord,stdout:commandOutput}};
  p.focused=artifact(c,"focused.json",focus);p.source=artifact(c,"source.json",{...parse(p.source),reviewed_at:time(-1000)});
  const state=c.prior.cleanup.companion_service.after;
  c.live={inventory:p.inputs.inventory_sha256,service:{state,diagnostics:{...c.prior.cleanup.companion_service.observations.after,finished_at:time(0)}}};
  const reviewRecord=c.authority.review, grant=c.authority.grant;
  reviewRecord.submitted_at=time(-500);reviewRecord.commit_id=p.head;
  reviewRecord.body=["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.head,p.tree,p.base,SERIAL_AGGREGATE_ROUTE,
    serialReviewTarget(p),p.prior_receipt_fingerprint,p.commission.envelope_sha256,p.inputs.inventory_sha256,SERIAL_HISTORY].join("\n");
  p.accepted.review={id:reviewRecord.id,sha256:digest(reviewedRevisionAuthorityObservation(reviewRecord,"accepted_revision"))};
  grant.created_at=grant.updated_at=time(-100);grant.body=["Authorize one prospective serial-aggregate-budget-v1 invocation.",p.branch,p.head,p.tree,p.base,
    p.prior_family_id,p.prior_attempt_id,String(p.prior_number),p.prior_receipt_fingerprint,serialReviewTarget(p),p.commission.envelope_sha256,p.inputs.inventory_sha256,SERIAL_HISTORY,
    "https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10","Exactly one admitted deciding invocation total; no ordinal two, recovery or unchanged-target retry.",
    "Reservation/interruption consumes the single grant.","Separate fresh-process stock and independent decision remain required."].join("\n");
  p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  c.proof=p;write(c.file,p);
  const prepFile=path.join(c.artifacts,"preparation.json"), edge=path.join(priorRoot,"correction-successor.json");
  const prep=(q=p,live=c.live)=>{q=clone(q);delete q.authorization;delete q.accepted.review;write(prepFile,q);return inspectSerialAggregatePreparation({file:prepFile,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
  const preparation=prep();assert.equal(preparation.consumed,0);assert.equal(preparation.reserved,false);assert(!existsSync(edge));
  const originalHashes=[completion,path.join(priorRoot,"attempt-1.json")].map(f=>digest(readFileSync(f)));
  for(const mutate of [q=>q.prior_attempt_id="wrong-tip",q=>q.commission.envelope_sha256=digest("changed inventory"),q=>q.head=c.base,q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2]) {
    const q=clone(p);mutate(q);assert.throws(()=>prep(q));assert(!existsSync(edge));
  }
  assert.throws(()=>prep(p,{...c.live,inventory:digest("drift")}));
  const retained=c.prior;
  for(const mutate of [r=>r.phases[0].environment_fingerprint=digest("wrong"),r=>r.phases[9].browser_use[0].runtime_versions.cdp="Chrome/2",
    r=>r.phases[10].environment_fingerprint=digest("invented"),r=>r.phases[1].cleanup.completed=false,r=>r.cleanup.failure_codes.push("unsettled"),r=>r.cleanup.isolated_resources.failure_count=1,r=>r.cleanup.companion_service.before={...r.cleanup.companion_service.before,preservation_binding:digest("changed")},r=>r.cleanup.companion_service.observations.before.coherent=false,r=>r.phases[10].failure_code="unknown",r=>r.phases[9].browser_use.push({...use,consumer:"web-planning"})]) {
    c.prior=clone(retained);mutate(c.prior);assert.throws(incidentRead);
  }
  c.prior=retained;
  const originalIncidentRef=p.incident;
  for(const tail of [
    `[canonical:e2e-project-experience] child_exit label=${JSON.stringify(PROJECT_EXPERIENCE_SERIAL.children[2].label)} elapsed_ms=42 exit_code=1 signal=null stdout_closed=false stderr_closed=false\n`,
    `[canonical:e2e-project-experience] child_cleanup_start label=${JSON.stringify(PROJECT_EXPERIENCE_SERIAL.children[2].label)} elapsed_ms=42 reason=post_exit_settlement\n`]) {
    const altered=log+tail, candidate=clone(incident);c.prior=clone(retained);
    c.prior.phases[9].log.bytes=Buffer.byteLength(altered);
    candidate.log=artifact(c,"altered-log.log",altered);candidate.log_identity={...candidate.log_identity,bytes:Buffer.byteLength(altered),sha256:digest(altered)};
    p.incident=artifact(c,"altered-incident.json",candidate);assert.throws(incidentRead,/serial_interrupted_child_already_settling/u);
  }
  p.incident=originalIncidentRef;c.prior=retained;
  const material={...clone(p)};delete material.authorization;delete material.accepted.review;write(prepFile,material);
  const prepArgs={file:prepFile,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live};
  assert.equal((await prepareSerialAggregateRevision(prepArgs,{transport:{pullRequest:async()=>clone(c.authority.pr)}})).published_head_checked,true);
  for(const mutate of [v=>v.head.sha=c.base,v=>v.draft=false,v=>v.auto_merge={}]) {
    const published=clone(c.authority.pr);mutate(published);
    await assert.rejects(prepareSerialAggregateRevision(prepArgs,{transport:{pullRequest:async()=>published}}),/revision_published_source_invalid/u);
  }
  const originalFile=path.join(c.checkout,logPath), originalBytes=readFileSync(originalFile);
  try {write(originalFile,originalBytes.toString().replace("checkpoint","checkpoinX"));assert.throws(()=>prep(),/serial_original_log_changed/u);}
  finally {write(originalFile,originalBytes);}
  const focusRef=p.focused;
  for(const mutate of [f=>f.serial_control.driver.path="scripts/fixture.mjs",f=>f.serial_control.owners[0].sha256=digest("unused export")]) {
    const f=clone(focus);mutate(f);p.focused=artifact(c,"unrelated-focus.json",f);write(c.file,p);assert.throws(()=>h.proof(c),/serial_control_source_invalid/u);
  }
  p.focused=focusRef;write(c.file,p);
  findings.push("real v2 source_revision edge has zero consumed reviewed slots; exact non-reserving preparation and incident evidence pass; drift and unexplained evidence refuse");
  const proof=h.proof(c), authority=await h.auth(c,proof);
  for(const mutate of [v=>v.body="ordinary approval",v=>v.user.type="Bot",v=>v.updated_at=time(-60000)])
    await assert.rejects(h.auth(c,proof,(v,e)=>{if(e.includes("/comments/")) mutate(v);return v;}));
  assert.throws(()=>h.begin(c,proof,{}));assert(!existsSync(edge));
  // Existing complete receipt/stock fixture uses the actual reservation owner.
  c.gitDeclaration=declared;
  const execution=await executeFixture(c,h,proof,authority,use,dependencyRecords(c));
  assert.equal(execution.stock.valid_deciding_evidence,true);
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,1);
  assert.throws(()=>h.begin(c,proof,authority),/attempt_latest_tip_required/u);
  const exported=createPrivateReviewExport(execution.receipt), inspected=inspectPrivateReviewExport(exported);
  assert(inspected.structurally_valid);assert.equal(inspected.deciding,false);assert.equal(inspected.independent_attestation,false);
  assert.equal(exported.attempt.source_correction.incident.sha256,p.incident.sha256);
  const issues=[];inspectClassifiedEvidence(retained,issues);assert(issues.includes("receipt_phase_environment_binding_invalid"));
  assert.deepEqual([completion,path.join(priorRoot,"attempt-1.json")].map(f=>digest(readFileSync(f))),originalHashes);
  const newRoot=path.join(c.anchor,".augnes-local-verification/families",execution.receipt.attempt.family_id);
  rmSync(path.join(newRoot,"attempt-1.json"));
  assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));assert(existsSync(edge));
  assert.throws(()=>h.begin(c,proof,authority));
  findings.push("authenticated capability, exclusive reservation, fresh receipt stock and structural non-deciding export pass; borrowed, stale, duplicate and interrupted reservations refuse; original timeout remains false");
  console.log(JSON.stringify({serial_aggregate_controls:findings,synthetic_only:true,cleanup_owned_by_fixture:true}));
}
