// Disposable synthetic lineage only. Never consumes a real commission.
import assert from "node:assert/strict";
import {readFileSync,existsSync,writeFileSync} from "node:fs";
import path from "node:path";
import {digest} from "../local-canonical-inputs.mjs";
import {REVIEWED_REVISION_PHASES,finishAttempt,reviewedRevisionAuthorityObservation,reconstructAttemptTip,inspectGitRevisionPreparation} from "../local-canonical-attempts.mjs";
import {REVIEWED_WORKLOAD_CONTINUATION,WORKLOAD_HISTORY_BOUNDARY,gitReviewTarget} from "../local-canonical-git-observation.mjs";
import {CANONICAL_NODE_VERSION} from "../local-canonical-environment.mjs";
import {finalizeReceipt} from "../local-canonical-receipt.mjs";
import {createPrivateReviewExport,inspectPrivateReviewExport} from "../local-canonical-review-export.mjs";
import {baseReceipt} from "./local-canonical-receipt-v3.mjs";
import {executeFixture,dependencyRecords,behavior} from "./local-canonical-browser-successor.mjs";

let previous=0;
const clone=structuredClone, time=()=>new Date(previous=Math.max(Date.now(),previous+1)).toISOString();
const registration="scripts/test-local-canonical-review-corrections.mjs",budgets="scripts/local-canonical-closeout-budgets.mjs";
const command="node "+registration+" --reviewed-revision-controls revision";
const decisions=Array.from({length:14},(_,i)=>"synthetic required control "+i);
export const workloadFixtureInput=c=>({...c.gitDeclaration,binding:{head:c.head,tree:c.tree,executor_fingerprint:baseReceipt.executor.source_fingerprint,runtime_inputs:c.inputs,
  environment_keys:["AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT","npm_config_nodedir","AUGNES_BROWSER_EXECUTABLE_PATH"],
  phase_environment_fingerprints:REVIEWED_REVISION_PHASES.map(id=>({id,fingerprint:digest(id)}))}});

export async function runReviewedWorkloadControls(c,h,initial,firstAttempt,initialAuthority) {
  const originalAuthority=clone(c.authority), required=[], files=[];
  const completeHooks={...h,begin:()=>firstAttempt,fresh:packet=>h.fresh(packet)};
  c.behaviorPath="scripts/workload-behavior.mjs";
  const dependencies=dependencyRecords(c);
  const first=await executeFixture(c,completeHooks,initial,initialAuthority,null,dependencies);
  assert.equal(first.stock.valid_deciding_evidence,false);
  const priorHead=c.head, red=await behavior(c);
  h.write(path.join(c.checkout,c.behaviorPath),'console.log("corrected synthetic workload input");\n');
  c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic workload input repair"]);
  c.prior=first.receipt;h.prepare(c,2);let p=c.proof;
  p.commission=clone({...initial.commission,ordinal:2});p.accepted=clone(initial.accepted);
  p.inputs.inventory_sha256=initial.inputs.inventory_sha256;
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(first.stock));
  const green=await behavior(c), source=name=>c.git(["show",p.head+":"+name]);
  const witness=(label,run,head)=>h.artifact(c,label+".json",{...run,node_version:CANONICAL_NODE_VERSION,runtime_inputs_sha256:p.inputs.identity_sha256,
    file_sha256:digest(c.git(["show",head+":"+c.behaviorPath])),stdout:h.artifact(c,label+".log",run.output)});
  const before=witness("red",red,priorHead),after=witness("green",green,p.head);
  let f=h.read(path.join(c.artifacts,p.focused.artifact));
  Object.assign(f,{finished_at:time(),failed_phase:"authority",diagnosis:"Synthetic natural authority failure followed by a directly implicated behavioral correction.",
    implicated_paths:[c.behaviorPath],source_files:[{path:c.behaviorPath,byte_size:source(c.behaviorPath).length,sha256:digest(source(c.behaviorPath))}],input_remedy_resources:[],
    regression:{path:c.behaviorPath,args:[],before,after},commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:h.read(path.join(c.artifacts,after.artifact)).stdout}]});
  p.focused=h.artifact(c,"focused.json",f);p.source=h.artifact(c,"source.json",{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:time()});
  c.authority=originalAuthority;c.authority.pr.head.sha=p.head;
  const preparation=clone(p);delete preparation.authorization; // Ordinal two retains its original acceptance.
  h.write(path.join(c.artifacts,"preparation.json"),preparation);
  const target=gitReviewTarget(p);
  const review={...c.authority.review,id:33,commit_id:p.head,submitted_at:time(),body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,target].join("\n")};
  c.authority.contractReview=review;c.authority.contractPr=999;
  p.authorization={...clone(initial.authorization),contract_review:{pull_request:999,id:33,head:p.head,sha256:digest(reviewedRevisionAuthorityObservation(review,"contract_review"))}};
  h.write(c.file,p);p=h.proof(c);const a=await h.auth(c,p);
  // The second attempt is a synthetic natural outer failure carrying a bounded
  // child timeout observation; never pretend this is a real 15-second replay.
  c.behaviorPath="scripts/workload-other-failure.mjs";
  const second=await executeFixture(c,{...h,begin:(c,p,a,extra)=>h.begin(c,p,a,{...extra,runId:"acquisition-workload-second"}),fresh:h.fresh},p,a,null,dependencies);
  c.behaviorPath="scripts/workload-behavior.mjs";
  reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  const child={control_id:"reviewed-revision",exit_code:null,signal:"SIGTERM",timed_out:true,cancelled:false,spawn_error_code:null,duration_ms:15071,
    termination_reason:"bounded_timeout",exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0,last_progress:null};
  const log="AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(child)+"\n";
  const historical=clone(second.receipt), phase=historical.phases.find(v=>v.id==="authority");
  phase.log={bytes:Buffer.byteLength(log),relative_path:".augnes-local-verification/logs/"+historical.run.id+"/authority.log",truncated:false};
  c.prior=finalizeReceipt(historical);
  // Only disposable fixture originals are constructed. Real receipts are never rewritten.
  h.storeReceipt(c,c.prior);
  const completion=path.join(c.anchor,".augnes-local-verification/families",c.prior.attempt.family_id,"completion-1.json");
  h.write(completion,{...h.read(completion),receipt_fingerprint:c.prior.integrity.content_fingerprint,finished_at:time()});
  h.write(path.join(c.checkout,phase.log.relative_path),log);
  const stock={...second.stock,content_fingerprint:c.prior.integrity.content_fingerprint};
  assert(!stock.issues.includes("receipt_attempt_records_unverified"));
  const spent=[firstAttempt,c.prior.attempt].flatMap(v=>["attempt","completion"].map(kind=>path.join(c.anchor,".augnes-local-verification/families",v.family_id,kind+"-1.json")));
  for(const file of spent)files.push([file,digest(readFileSync(file))]);
  const oldHead=c.head;
  h.write(path.join(c.checkout,registration),'console.log(JSON.stringify({reviewed_revision_controls:'+JSON.stringify(decisions)+',synthetic_only:true}));\n');
  h.write(path.join(c.checkout,budgets),'export const revised = false;\n');
  // The witness source must exist on the predecessor; these are disposable Git
  // fixture inputs established before its bounded result in the test setup.
  assert(c.git(["show",oldHead+":"+registration]).length);
  const baseline={command,tested_source_head:oldHead,finished_at:time(),node_version:CANONICAL_NODE_VERSION,runtime_inputs_sha256:p.inputs.identity_sha256,
    environment:digest("synthetic unchanged controlled environment"),fixture_sha256:digest(c.git(["show",oldHead+":scripts/fixtures/local-canonical-reviewed-revision.mjs"])),
    registration_sha256:digest(c.git(["show",oldHead+":"+registration])),budgets_sha256:digest(c.git(["show",oldHead+":"+budgets])),result:green.result};
  h.write(path.join(c.checkout,budgets),'export const revised = true;\n');
  h.write(path.join(c.checkout,registration),'// Material aggregate registration correction.\n'+readFileSync(path.join(c.checkout,registration),"utf8"));
  c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic aggregate correction"]);
  c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.grantId=42;
  h.prepare(c);p=c.proof;
  Object.assign(p.commission,{input_acquisition:initial.commission.input_acquisition,reviewed_workload:REVIEWED_WORKLOAD_CONTINUATION,maximum_invocations:1});
  const delegation={...originalAuthority.grant,id:40,created_at:time(),body:[
    "Authorize one terminal reviewed-revision workload correction assignment on "+p.branch+" in Draft PR #999.",
    "Predecessor: "+p.prior_family_id+" / "+p.prior_attempt_id+" / "+p.prior_receipt_fingerprint+".",WORKLOAD_HISTORY_BOUNDARY,
    "After independent acceptance of the exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish one separate new prospective workload commission through the authenticated maintainer identity. Exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery, unchanged-target retry, successor or replacement commission. Complete planner-selected Full, separate fresh-process stock, owned cleanup and independent result audit remain required."
  ].join("\n\n")};delegation.updated_at=delegation.created_at;
  p.commission.delegation={id:40,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};p.inputs.inventory_sha256=initial.inputs.inventory_sha256;
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(stock));
  const summary=JSON.stringify({reviewed_revision_controls:decisions,synthetic_only:true})+"\n";
  baseline.stdout=h.artifact(c,"baseline.log",summary);
  const bw=h.artifact(c,"baseline.json",baseline);
  const candidate={...baseline,tested_source_head:p.head,finished_at:time(),registration_sha256:digest(source(registration)),budgets_sha256:digest(source(budgets)),stdout:h.artifact(c,"candidate.log",summary)};
  const aw=h.artifact(c,"candidate.json",candidate);
  f=h.read(path.join(c.artifacts,p.focused.artifact));Object.assign(f,{finished_at:time(),failed_phase:"authority",diagnosis:"Measured complete workload exceeded its old aggregate headroom; preserve the historical timeout and all checks.",
    implicated_paths:[budgets,registration],source_files:[budgets,registration].map(name=>({path:name,byte_size:source(name).length,sha256:digest(source(name))})),input_remedy_resources:[],
    workload:{historical_log:h.artifact(c,"historical-authority.log",log),before:bw,after:aw},commands:[{command,tested_source_head:p.head,result:candidate.result,record:aw,stdout:candidate.stdout}]});
  p.focused=h.artifact(c,"focused.json",f);p.source=h.artifact(c,"source.json",{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:time()});
  const inspect=(q,live=c.live)=>{const m=clone(q);delete m.authorization;delete m.accepted.review;const file=path.join(c.artifacts,"material.json");h.write(file,m);return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
  const prep=inspect(p);assert.equal(prep.consumed,2);assert.equal(prep.reserved,false);
  required.push("complete physical spent acquisition lineage prepares read-only; original false stock and both older commissions retained");
  const acceptance={...originalAuthority.review,id:41,commit_id:p.head,submitted_at:time(),body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,prep.target,WORKLOAD_HISTORY_BOUNDARY].join("\n")};
  const grant={...originalAuthority.grant,id:42,created_at:time(),body:["Authorize one NEW prospective v7 reviewed_revision commission for the terminal reviewed-revision workload correction.",
    p.schema,p.base,p.head,p.tree,p.branch,p.prior_receipt_fingerprint,prep.target,
    "https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-41 https://github.com/hynk-studio/augnes/pull/999#issuecomment-40",
    "old commission remains spent; exactly one admitted deciding invocation total; demonstrated material correction and focused support; zero extra recovery; Reservation/interruption consumes; zero unchanged-target retry; separate fresh-process stock; independent audit. No ordinal two, recovery, successor or replacement commission.",WORKLOAD_HISTORY_BOUNDARY].join("\n")};grant.updated_at=grant.created_at;
  p.accepted.review={id:41,sha256:digest(reviewedRevisionAuthorityObservation(acceptance,"accepted_revision"))};p.authorization={grant_comment_id:42,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  c.authority={...c.authority,review:acceptance,grant,linked:{["repos/hynk-studio/augnes/issues/comments/40"]:delegation}};delete c.authority.contractReview;
  const bind=()=>h.write(c.file,p);bind();
  for(const mutate of [q=>delete q.commission.reviewed_workload,q=>q.commission.maximum_invocations=2,q=>q.commission.ordinal=2,q=>delete q.commission.input_acquisition,q=>q.prior_attempt_id="wrong"]){const q=clone(p);mutate(q);assert.throws(()=>inspect(q));}
  for(const [ref,mutate]of [[bw,q=>q.tested_source_head=p.head],[aw,q=>q.result.timed_out=true],[aw,q=>q.result.cleanup_completed=false]]){const file=path.join(c.artifacts,ref.artifact),b=readFileSync(file),q=JSON.parse(b);mutate(q);h.write(file,q);assert.throws(()=>inspect(p));h.write(file,b);}
  // Correctly rehashed semantic negatives, in addition to byte-tamper controls.
  let negative=0;
  for(const [key,mutate]of [["before",q=>q.tested_source_head=p.head],["after",q=>q.environment=digest("different environment")],
    ["after",q=>q.fixture_sha256=digest("different fixture")],["after",q=>q.result.cleanup_completed=false]]) {
    const value=clone(key==="before"?baseline:candidate);mutate(value);const badFocus=clone(f);
    badFocus.workload[key]=h.artifact(c,"negative-witness-"+(++negative)+".json",value);
    const q={...p,focused:h.artifact(c,"negative-focus-"+negative+".json",badFocus)};
    assert.throws(()=>inspect(q));
  }
  const badChild={...child,signal:"SIGKILL"},badLog="AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(badChild)+"\n";
  assert.equal(Buffer.byteLength(badLog),Buffer.byteLength(log));
  const badFocus={...f,workload:{...f.workload,historical_log:h.artifact(c,"wrong-signal.log",badLog)}};
  assert.throws(()=>inspect({...p,focused:h.artifact(c,"wrong-signal-focus.json",badFocus)}),/revision_workload_log_invalid/);
  assert.throws(()=>inspect(p,{inventory:digest("wrong")}));
  const original=grant.body;grant.body="ordinary approval";p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));bind();await assert.rejects(h.auth(c,h.proof(c)));grant.body=original;p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));bind();
  const delegated=delegation.body;delegation.body=originalAuthority.linked["repos/hynk-studio/augnes/issues/comments/30"].body;
  p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"));bind();await assert.rejects(h.auth(c,h.proof(c)));delegation.body=delegated;p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"));bind();
  required.push("missing markers, max-two, wrong tip/source, incomplete witness, generic grant and prior delegation refuse");
  const parsed=h.proof(c),cap=await h.auth(c,parsed),attempt=h.begin(c,parsed,cap,{runId:"terminal-workload"});
  assert.throws(()=>h.begin(c,parsed,cap));
  const interrupted=finalizeReceipt({...clone(baseReceipt),...h.receipt(c,attempt),final:{result:"failure",exit_status:1,reason_codes:["interrupted"]}});
  const exported=createPrivateReviewExport(interrupted);assert(inspectPrivateReviewExport(exported).structurally_valid);assert.equal(exported.attempt.source_correction.commission.reviewed_workload,REVIEWED_WORKLOAD_CONTINUATION);assert.equal(exported.attempt.source_correction.commission.maximum_invocations,1);
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});assert.equal(tip.reviewed_revision_consumed,1);assert.deepEqual(tip.revision_grants,[11,32,42]);
  const packet=path.join(c.artifacts,"terminal-stock.json");
  h.write(packet,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,file:c.file,inputs:c.inputs,live:c.live,authority:c.authority,receipt:interrupted});
  const fresh=await h.freshInterrupted(packet);assert.equal(fresh.exit_code,0);assert(fresh.cleanup_completed&&fresh.remaining_owned_processes===0);
  h.storeReceipt(c,interrupted);finishAttempt(attempt,{receiptFingerprint:interrupted.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  c.prior=interrupted;c.grantId=43;h.prepare(c);assert.throws(()=>h.proof(c),/revision_git_lineage_invalid/);
  const next=c.proof;Object.assign(next.commission,{input_acquisition:p.commission.input_acquisition,reviewed_workload:REVIEWED_WORKLOAD_CONTINUATION,maximum_invocations:1,delegation:p.commission.delegation});next.inputs.inventory_sha256=p.inputs.inventory_sha256;h.write(c.file,next);
  assert.throws(()=>h.proof(c),/revision_git_lineage_invalid/);
  next.commission.ordinal=2;h.write(c.file,next);assert.throws(()=>h.proof(c));
  assert(!existsSync(path.join(c.anchor,".augnes-local-verification/families",attempt.family_id,"correction-successor.json")));
  required.push("fresh-process interrupted stock stays false; unmarked replacement, another marked grant and ordinal two all refuse without a successor edge");
  for(const [file,hash]of files)assert.equal(digest(readFileSync(file)),hash);
  required.push("one new reservation consumes; exact replay refuses; fresh reconstruction and export preserve terminal marker and all grant IDs");
  console.log(JSON.stringify({reviewed_workload_controls:required,synthetic_only:true,real_authority:false}));
}
