// Disposable synthetic authority and lineage; never a real execution grant.
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import path from "node:path";
import {fixtureNow} from "./local-canonical-authority-clock.mjs";
import {digest} from "../local-canonical-inputs.mjs";
import {CANONICAL_NODE_VERSION} from "../local-canonical-environment.mjs";
import {inspectGitRevisionPreparation, reconstructAttemptTip, reviewedRevisionAuthorityObservation, finishAttempt} from "../local-canonical-attempts.mjs";
import {POST_TERMINAL_GIT_SUCCESSOR, POST_TERMINAL_HISTORY_BOUNDARY, GIT_SUCCESSOR_WORKLOAD_COMMAND,
  GIT_SUCCESSOR_WORKLOAD_SOURCES, verifyPostTerminalGitSuccessorRepair, gitReviewTarget} from "../local-canonical-git-observation.mjs";
import {finalizeReceipt} from "../local-canonical-receipt.mjs";
import {createPrivateReviewExport, inspectPrivateReviewExport} from "../local-canonical-review-export.mjs";
import {baseReceipt} from "./local-canonical-receipt-v3.mjs";

const clone=structuredClone;
let previous=0;
const time=()=>new Date(previous=Math.max(fixtureNow(),previous+1)).toISOString();
const decision="Source review decision: ACCEPT / RETAIN for prospective qualification.";
const registration="scripts/test-local-canonical-review-corrections.mjs";
const gitControls=["protected Git race then effective change","unrelated fault, incomplete stock and unsettled cleanup refused",
  "actual raw/effective input identities, incomplete inventory and stale tip","exact product and regression byte witnesses","preparation cannot reserve",
  "negative review, missing scope, spoofed authority and unsafe inputs refused","exclusive successor, original ledger retained and read-only stock"];
const refusals=["stale and changed originals","reset and third ordinal","identical and whitespace-only source","wrong witness","missing and edited authority","unstable inputs","competing successor"];

export async function runPostTerminalControls(c,h,group) {
  const inspect=(p,live=c.live)=>{
    const material=clone(p);delete material.authorization;delete material.accepted.review;delete material.local_relative_path;
    const file=path.join(c.artifacts,"material.json");h.write(file,material);
    return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});
  };
  if(group==="post-terminal") {
    const historical=clone(c.prior), priorHead=c.head, authority=clone(c.terminalAuthority);
    const preserved=[];
    let family=historical.attempt.family_id;
    while(family) {
      const dir=path.join(c.anchor,".augnes-local-verification/families",family);
      for(const name of ["attempt-1.json","completion-1.json","correction-successor.json"])
        if(existsSync(path.join(dir,name)))preserved.push([path.join(dir,name),digest(readFileSync(path.join(dir,name)))]);
      family=h.read(path.join(dir,"attempt-1.json")).source_correction?.prior_family_id;
    }
    // Witness records are constructed fixture inputs. Actual production reader,
    // descriptor-safe artifacts, Git sources and process/ownership boundaries
    // are exercised here; real development evidence is produced separately.
    const driver="console.log('synthetic sequence witness');\n", driverHash=digest(driver);
    const processResult=await h.run({command:process.execPath,args:["-e",driver],cwd:c.checkout,env:c.env,
      suite:"post-terminal",label:"owned synthetic witness process",timeoutMs:5000,stdout:{write(){}},stderr:process.stderr});
    assert.equal(processResult.exit_code,0);assert(processResult.cleanup_completed && processResult.remaining_owned_processes===0);
    const started=time();
    const output=[...['git','git-successor'].flatMap(g=>[
      "AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify({...processResult,control_id:"reviewed-revision-"+g}),
      JSON.stringify({status:"pass",checks:["reviewed revision controls: "+g],cleanup_complete:true})]),
      JSON.stringify({synthetic_only:true,git_revision_controls:gitControls}),
      JSON.stringify({synthetic_only:true,material_successor:{first_stock:false,second_stock:true,consumed:2,same_commission:true,refused:refusals}})].join("\n")+"\n";
    const raw=head=>({revision:head,mode:"plain",groups:["git","git-successor"],driver:{sha256:driverHash,byte_size:Buffer.byteLength(driver)},
      started_at:started,finished_at:time(),runtime_identity:digest(c.inputs),node:CANONICAL_NODE_VERSION,archive_sha256:digest(c.git(["archive","--format=tar",head])),
      source_files:GIT_SUCCESSOR_WORKLOAD_SOURCES.map(file=>{const b=c.git(["show",head+":"+file]);return{file,byte_size:b.length,sha256:digest(b)};}),
      instrumentation:null,results:["git","git-successor"].map((g,i)=>({group:g,command:GIT_SUCCESSOR_WORKLOAD_COMMAND.split(" && ")[i],result:processResult})),
      cleanup:{records:[1,2,3].map(()=>({completed:true,failure_count:0,failures:[]}))},error:null,output:{name:"synthetic.log",sha256:digest(output)}});
    const beforeRaw=raw(priorHead);
    for(const name of [registration,"scripts/fixtures/local-canonical-authority-clock.mjs","scripts/fixtures/local-canonical-review-child-result.mjs","scripts/fixtures/local-canonical-reviewed-revision.mjs"])
      h.write(path.join(c.checkout,name),readFileSync(path.join(c.checkout,name),"utf8")+"export const materialCorrection=true;\n");
    c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic post-terminal workload correction"]);
    c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.grantId=52;
    h.prepare(c);let p=c.proof;
    Object.assign(p.commission,{input_acquisition:historical.attempt.source_correction.commission.input_acquisition,
      reviewed_workload:POST_TERMINAL_GIT_SUCCESSOR,maximum_invocations:1});
    p.inputs.inventory_sha256=historical.attempt.source_correction.inputs.inventory_sha256;
    const delegation={...authority.grant,id:50,created_at:time(),body:[
      "Authorize one post-terminal Git-successor workload correction assignment on "+p.branch+" in Draft PR #999. Explicitly adopt the exceptional old terminal ordinal one to new terminal ordinal one policy edge.",
      "Predecessor: "+p.prior_family_id+" / "+p.prior_attempt_id+" / "+p.prior_receipt_fingerprint+".",POST_TERMINAL_HISTORY_BOUNDARY,
      "After independent acceptance of the implemented controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish one separate new prospective post-terminal Git-successor commission through the authenticated maintainer identity. Exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery, unchanged-target retry, successor or replacement commission. Complete planner-selected Full, separate fresh-process stock, owned cleanup and independent result audit remain required."
    ].join("\n\n")};delegation.updated_at=delegation.created_at;
    p.commission.delegation={id:50,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};
    p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(c.terminalStock));
    const afterRaw=raw(p.head);
    const witness=(name,record)=>{
      const rawRef=h.artifact(c,name+"-raw.json",record), stdout=h.artifact(c,name+".log",output), driverRef=h.artifact(c,name+"-driver.log",driver);
      return {tested_source_head:record.revision,command:GIT_SUCCESSOR_WORKLOAD_COMMAND,finished_at:record.finished_at,node_version:CANONICAL_NODE_VERSION,
        runtime_inputs_sha256:digest(c.inputs),environment:digest({runtime_inputs_sha256:digest(c.inputs),driver_sha256:driverHash,
          environment_owner_sha256:record.source_files.find(v=>v.file==="scripts/canonical-test-environment.mjs").sha256}),result:processResult,record:rawRef,stdout,driver:driverRef};
    };
    const before=witness("before",beforeRaw),after=witness("after",afterRaw), bw=h.artifact(c,"before.json",before),aw=h.artifact(c,"after.json",after);
    const current=c.git(["ls-tree","-r","--name-only",p.head]).toString().trim().split("\n");
    const f={...h.read(path.join(c.artifacts,p.focused.artifact)),finished_at:time(),failed_phase:"authority",
      remedy:"Complete Git producer/successor workload retains all assertions with measured bounded aggregate headroom.",
      diagnosis:"The sole settled authority failure is the nested Git-successor aggregate; historical final statement and complete delay cause remain unknown.",
      implicated_paths:[registration,"scripts/fixtures/local-canonical-authority-clock.mjs","scripts/fixtures/local-canonical-review-child-result.mjs","scripts/fixtures/local-canonical-reviewed-revision.mjs"],
      source_files:current.map(name=>{const b=c.git(["show",p.head+":"+name]);return{path:name,byte_size:b.length,sha256:digest(b)};}),input_remedy_resources:[],
      workload:{historical_log:h.artifact(c,"historical-authority.log",c.terminalLog),before:bw,after:aw},
      commands:[{command:GIT_SUCCESSOR_WORKLOAD_COMMAND,tested_source_head:p.head,result:processResult,record:aw,stdout:after.stdout}]};
    p.focused=h.artifact(c,"focused.json",f);p.source=h.artifact(c,"source.json",{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:time()});
    // A real documentation-only commit can reuse identical executable inputs;
    // preserve the original tested head and bind every intervening Git path.
    const tested=p.head;
    h.write(path.join(c.checkout,"docs/focused-evidence.md"),"Synthetic documentation-only evidence addendum.\n");
    c.git(["add","docs"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic evidence addendum"]);
    c.head=p.head=c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();
    c.tree=p.tree=c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
    p.accepted.head=p.head;p.accepted.tree=p.tree;
    const delta=(a,b)=>{const patch=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",a,b,"--"]);return{bytes:patch.length,sha256:digest(patch),paths:c.git(["diff","--name-only",a,b,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
    after.equivalence={target:p.head,classification:"documentation-only",delta:delta(tested,p.head)};
    f.workload.after=h.artifact(c,"after.json",after);f.commands[0].record=f.workload.after;
    const doc=c.git(["show",p.head+":docs/focused-evidence.md"]);f.source_files.push({path:"docs/focused-evidence.md",byte_size:doc.length,sha256:digest(doc)});
    f.finished_at=time();p.focused=h.artifact(c,"focused.json",f);
    p.source=h.artifact(c,"source.json",{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:time(),accepted_to_final:delta(p.head,p.head),predecessor_to_final:delta(priorHead,p.head),main_to_final:delta(p.base,p.head)});
    const prepared=inspect(p);assert.equal(prepared.consumed,1);assert.equal(prepared.reserved,false);
    const review={...authority.review,id:51,commit_id:p.head,submitted_at:time(),body:[decision,p.base,p.head,p.tree,p.prior_receipt_fingerprint,prepared.target,POST_TERMINAL_HISTORY_BOUNDARY].join("\n")};
    const grant={...authority.grant,id:52,created_at:time(),body:[
      "Authorize one NEW prospective v7 reviewed_revision commission for the post-terminal Git-successor workload correction.",
      p.schema,p.branch,p.base,p.head,p.tree,p.prior_receipt_fingerprint,prepared.target,
      "https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-51 https://github.com/hynk-studio/augnes/pull/999#issuecomment-50",
      "old commission remains spent; exactly one admitted deciding invocation total; demonstrated material correction and focused support; zero extra recovery; Reservation/interruption consumes; zero unchanged-target retry; separate fresh-process stock; independent result audit. No ordinal two, recovery, successor or replacement commission.",POST_TERMINAL_HISTORY_BOUNDARY].join("\n")};grant.updated_at=grant.created_at;
    p.accepted.review={id:51,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};
    p.authorization={grant_comment_id:52,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
    c.authority={review,grant,pr:{...authority.pr,head:{...authority.pr.head,sha:p.head}},linked:{["repos/hynk-studio/augnes/issues/comments/50"]:delegation}};
    h.write(c.file,p);assert.equal(h.proof(c).commission.ordinal,1);
    c.postTerminal={p,f,before,after,beforeRaw,afterRaw,preserved,prepared};
    console.log(JSON.stringify({post_terminal_preparation_controls:["real consumed-one preparation over five physical historical invocations","complete source/runtime/archive/command witnesses bound","non-reserving commitment and fresh synthetic authority recorded"],synthetic_only:true,real_authority:false}));
    return;
  }
  const {p,f,before,after,afterRaw,preserved}=c.postTerminal;
  const check=(focus=f,prior=c.prior.attempt,original=c.prior)=>verifyPostTerminalGitSuccessorRepair(p,prior,original,focus,{
    git:c.git,parse:ref=>h.read(path.join(c.artifacts,ref.artifact)),bytes:ref=>{const b=readFileSync(path.join(c.artifacts,ref.artifact));assert.equal(digest(b),ref.sha256);return b;},
    completedAt:h.read(path.join(c.artifacts,p.originals.completion.artifact)).finished_at});
  if(group==="post-terminal-controls") {
  check();let n=0;
  const rejectWitness=mutate=>{
    const witness=clone(after), raw=clone(afterRaw);mutate(witness,raw);
    witness.record=h.artifact(c,"negative-raw-"+(++n)+".json",raw);
    const ref=h.artifact(c,"negative-witness-"+n+".json",witness), focused=clone(f);focused.workload.after=ref;
    focused.commands[0]={...focused.commands[0],record:ref,stdout:witness.stdout};
    assert.throws(()=>check(focused));
  };
  for(const mutate of [w=>w.tested_source_head=p.prior_attempt_id,w=>w.environment=digest("wrong environment"),w=>w.runtime_inputs_sha256=digest("wrong runtime"),
    w=>delete w.equivalence,w=>w.equivalence.delta.sha256=digest("unclassified delta"),
    (w,r)=>r.groups.pop(),(w,r)=>r.results[1].result.cleanup_completed=false,(w,r)=>r.cleanup.records.pop(),(w,r)=>r.source_files.pop(),
    (w,r)=>r.archive_sha256=digest("wrong source archive"),(w,r)=>r.driver.sha256=digest("changed driver"),
    (w,r)=>{r.output.sha256=digest("reduced assertions");w.stdout=h.artifact(c,"reduced.log","reduced assertions");}])rejectWitness(mutate);
  assert.throws(()=>check({...f,source_files:f.source_files.filter(v=>v.path!==registration)}));
  for(const mutate of [text=>text.replace('"signal":"SIGTERM"','"signal":"SIGKILL"'),
    text=>text.replace('"control_id":"reviewed-revision-git-successor"','"control_id":"unrelated-timeout"'),
    text=>text.replace('timeout_ms=30000','timeout_ms=40000'),text=>text.replace('exit_code=1 signal=null','exit_code=1 signal=SIGTERM')]) {
    const text=mutate(c.terminalLog), focus=clone(f), original=clone(c.prior);
    focus.workload.historical_log=h.artifact(c,"wrong-incident-"+(++n)+".log",text);
    original.phases.find(v=>v.id==="authority").log.bytes=Buffer.byteLength(text);
    assert.throws(()=>check(focus,original.attempt,original),/revision_git_workload_log_invalid/);
  }
  for(const mutate of [r=>r.inputs.first_fault={resource:"git-config",disposition:"observer_failure"},
    r=>r.outcome.safety="blocked",r=>r.cleanup.completed=false,r=>r.capacity_ownership.released=false]) {
    const original=clone(c.prior);mutate(original);
    const q={...p,originals:{...p.originals,receipt:h.artifact(c,"unsafe-original-"+(++n)+".json",finalizeReceipt(original))}};
    assert.throws(()=>inspect(q),/revision_browser_failure_invalid/);
  }
  for(const mutate of [q=>q.phases.find(v=>v.id==="authority").log.truncated=true,q=>q.attempt.source_correction.commission.ordinal=2]) {
    const original=clone(c.prior);mutate(original);assert.throws(()=>check(f,original.attempt,original));
  }
  for(const mutate of [q=>delete q.commission.reviewed_workload,q=>q.commission.reviewed_workload="spent-acquisition-reviewed-workload-v1",
    q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>delete q.commission.input_acquisition,
    q=>q.inputs.inventory_sha256=digest("incomplete inventory"),q=>q.prior_attempt_id="stale"]){const q=clone(p);mutate(q);assert.throws(()=>inspect(q));}
  for(const ref of Object.values(p.originals)) {
    const file=path.join(c.artifacts,ref.artifact), bytes=readFileSync(file);h.write(file,"{}");assert.throws(()=>inspect(p));h.write(file,bytes);
  }
  const physicalLog=path.join(c.checkout,c.prior.phases.find(v=>v.id==="authority").log.relative_path);
  const physicalBytes=readFileSync(physicalLog);
  try {h.write(physicalLog,Buffer.concat([physicalBytes,Buffer.from("changed physical original\n")]));
    assert.throws(()=>inspect(p),/revision_artifact_changed/);
  } finally {h.write(physicalLog,physicalBytes);}
  assert.equal(digest(readFileSync(physicalLog)),digest(physicalBytes));
  const ordinary=clone(c.prior.attempt);delete ordinary.source_correction.commission.reviewed_workload;
  ordinary.source_correction.commission.maximum_invocations=2;
  assert.throws(()=>inspect({...p,originals:{...p.originals,attempt:h.artifact(c,"ordinary-acquisition-one.json",ordinary)}}),/revision_git_lineage_invalid/);
  const bind=()=>h.write(c.file,p);
  for(const [record,role,key]of [[c.authority.grant,"execution_commission","grant_sha256"],[c.authority.linked["repos/hynk-studio/augnes/issues/comments/50"],"task_delegation","sha256"]]) {
    const original=clone(record),ref=role==="execution_commission"?p.authorization:p.commission.delegation;
    for(const mutate of [r=>r.body="generic approval",r=>r.created_at=new Date(Date.parse(r.updated_at)-1).toISOString()]) {
      mutate(record);ref[key]=digest(reviewedRevisionAuthorityObservation(record,role));bind();await assert.rejects(h.auth(c,h.proof(c)));
      Object.assign(record,clone(original));
    }
    ref[key]=digest(reviewedRevisionAuthorityObservation(record,role));
  }
  bind();
  console.log(JSON.stringify({post_terminal_refusals:["wrong source/runtime/archive/driver and reduced workload refuse","changed originals, absent markers, wrong ordinal and incomplete inventories refuse","generic or edited authority refuses"],synthetic_only:true,real_authority:false}));
  return;
  }
  h.write(c.file,p);const parsed=h.proof(c),cap=await h.auth(c,parsed),attempt=h.begin(c,parsed,cap,{runId:"post-terminal-sole"});
  assert.throws(()=>h.begin(c,parsed,cap));
  const interrupted=finalizeReceipt({...clone(baseReceipt),...h.receipt(c,attempt),final:{result:"failure",exit_status:1,reason_codes:["interrupted"]}});
  const exported=createPrivateReviewExport(interrupted);assert(inspectPrivateReviewExport(exported).structurally_valid);
  assert.equal(exported.attempt.source_correction.commission.reviewed_workload,POST_TERMINAL_GIT_SUCCESSOR);
  assert.equal(exported.attempt.source_correction.inputs.current.artifact,undefined);
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  assert.equal(tip.reviewed_revision_consumed,1);assert.deepEqual(tip.revision_grants,[11,32,42,52]);
  const packet=path.join(c.artifacts,"cold-terminal.json");h.write(packet,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,file:c.file,inputs:c.inputs,live:c.live,authority:c.authority,receipt:interrupted,lateContender:true});
  h.releaseOwner();let fresh;try {fresh=await h.freshInterrupted(packet);} finally {h.acquireOwner();}assert.equal(fresh.exit_code,0);assert(fresh.cleanup_completed && fresh.remaining_owned_processes===0);
  h.storeReceipt(c,interrupted);finishAttempt(attempt,{receiptFingerprint:interrupted.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  for(const [file,hash]of preserved)assert.equal(digest(readFileSync(file)),hash);
  c.prior=interrupted;c.grantId=53;h.prepare(c);const next=c.proof;
  for(const marker of [undefined,"spent-acquisition-reviewed-workload-v1",POST_TERMINAL_GIT_SUCCESSOR]) {
    const q=clone(next);Object.assign(q.commission,{input_acquisition:p.commission.input_acquisition,maximum_invocations:marker?1:2,delegation:p.commission.delegation});
    if(marker)q.commission.reviewed_workload=marker;q.inputs.inventory_sha256=p.inputs.inventory_sha256;h.write(c.file,q);assert.throws(()=>h.proof(c),/revision_git_lineage_invalid/);
  }
  assert(!existsSync(path.join(c.anchor,".augnes-local-verification/families",attempt.family_id,"correction-successor.json")));
  console.log(JSON.stringify({post_terminal_controls:["wrong source/runtime/archive/driver and reduced workload refuse","changed originals, absent markers, wrong ordinal and incomplete inventories refuse",
    "generic or edited authority refuses","one reservation consumes; late exact replay refuses","fresh stock remains false; export and reconstruction retain all four grants and six invocations",
    "new marker refuses removed marker, prior marker and new grant before alternate routes","all five prior invocations and their originals remain byte-identical"],synthetic_only:true,real_authority:false}));
}
