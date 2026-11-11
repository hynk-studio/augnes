import { runSerialAggregateControls } from "./local-canonical-serial-aggregate.mjs";
// Synthetic fixture only: production proof, authority, edge and fresh reader.
import { fixtureNow, withAdjacentAuthorityClock } from "./local-canonical-authority-clock.mjs";
import { createTrackedReviewChildRunner } from "./local-canonical-review-child-result.mjs";
import { behavior } from "./local-canonical-browser-successor.mjs";
import assert from "node:assert/strict";
import {chmodSync,cpSync,existsSync,lstatSync,realpathSync,mkdirSync,readFileSync,renameSync,rmSync,statSync,writeFileSync} from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {digest,inputEventIdentity,observePreparedDependencyInputs,createGitTrackingResource,freezeInputContract} from "../local-canonical-inputs.mjs";
import {REVIEWED_REVISION_PHASES,beginAttempt,finishAttempt,readSourceCorrectionProof,inspectAttemptRecords,reconstructAttemptTip,authorizeReviewedRevision,reviewedRevisionAuthorityObservation,validReviewedRevisionAttempt} from "../local-canonical-attempts.mjs";
import {acquireCheckoutVerificationOwnership,releaseCheckoutVerificationOwnership} from "../local-canonical-checkout-ownership.mjs";
import {createGitHubObserverAuthorizationTransport} from "../github-main-branch-transport.mjs";
import {createCanonicalTestResourceRoot,beginCanonicalTestResourceUse,settleCanonicalTestResourceUse,cleanupCanonicalTestResources,buildCanonicalChildEnvironment} from "../canonical-test-environment.mjs";
import {runCanonicalChild} from "../canonical-child-runner.mjs";
import {finalizeReceipt,inspectReceiptForDecision} from "../local-canonical-receipt.mjs";
import {createPrivateReviewExport,inspectPrivateReviewExport} from "../local-canonical-review-export.mjs";
import {runBrowserRevisionControls, browserFixtureReceipt} from "./local-canonical-browser-revision.mjs";
import {checkSpentCommission,completeGitRevisionControls,checkFinalDependency,checkPostPass,gitFixtureDeclaration,gitFixtureReceipt,runGitRevisionControls,runGitInputRevisionControls} from "./local-canonical-git-observation.mjs";
import {GIT_ACQUISITION_REPAIR,gitAcquisitionIncident,gitRevisionInventory} from "../local-canonical-git-observation.mjs";
import {CANONICAL_NODE_VERSION} from "../local-canonical-environment.mjs";
import {inspectGitRevisionPreparation} from "../local-canonical-attempts.mjs";
import {baseReceipt} from "./local-canonical-receipt-v3.mjs";
import {runMaterialSourceControls,seedMaterialSourceFiles,prepareMaterialSourcePredecessor} from "./local-canonical-material-source.mjs";

const self=fileURLToPath(import.meta.url), quiet={write(){}}, clone=v=>structuredClone(v);
// Fixed, value-free development diagnostics. performance.now includes this
// process's startup/import time; the outer child owner reports its full lifetime.
const browserProgress = process.argv[2] === "--run-browser-fixtures"
  ? stage => console.error("AUGNES_REVIEW_FIXTURE_STAGE " + JSON.stringify({ stage, at: performance.now() }))
  : () => {};
browserProgress("imports_complete");
const write=(f,v)=>{mkdirSync(path.dirname(f),{recursive:true,mode:0o700});writeFileSync(f,typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v),{mode:0o600});};
const read=f=>JSON.parse(readFileSync(f,"utf8")), time=n=>new Date(fixtureNow()+n).toISOString();
// A handoff retains synthetic service identity, not a reusable current observation.
// Model a new read at each consumer boundary; historical receipt bytes stay frozen.
const observeFixtureLive=c=>{
  const live=clone(c.live), observation=live?.service?.diagnostics ?? live?.diagnostics;
  if(observation) observation.finished_at=time(0);
  return live;
};
const family=(b,p)=>digest(["augnes.local-canonical-attempt-family.v1","hynk-studio/augnes",b,...(p?["verified_source_correction",p.prior_attempt_id,p.head,p.tree]:[])]);
const transport=(c,mutate=v=>v)=>createGitHubObserverAuthorizationTransport(999,{runner:async request=>{
  assert.equal(request.operation,"fetch_browser_authority");assert(request.args.includes("GET")); const e=request.args[1];
  const linked = c.authority.linked?.[e];
  return mutate(clone(linked ?? (e.includes("/reviews/")?(e.endsWith("/"+c.authority.settlementReview?.id)?c.authority.settlementReview:c.authority.review):e.includes("/comments/")?c.authority.grant:e.endsWith("/pulls/999")?c.authority.pr:{permission:"admin",user:{login:"synthetic-fixture"}})),e);
}});
async function freshReader(c, packet, run = runCanonicalChild) {
  const result=await run({command:process.execPath,args:[self,"--cold",packet],cwd:c.checkout,env:c.env,
    suite:"reviewed-revision",label:"fresh receipt reader",timeoutMs:15000,stdout:quiet,stderr:process.stderr});
  assert(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes===0);
  assert.equal(result.exit_code,0);
}
const proof=c=>readSourceCorrectionProof(c.file,c.checkout);
const auth=(c,p,mutate)=>authorizeReviewedRevision(p,{transport:transport(c,mutate),repositoryRoot:c.checkout, ...(c.authority.contractReview ? {
  reviewTransport: createGitHubObserverAuthorizationTransport(c.authority.contractPr,{runner:async req=>{
    assert(req.args[1].endsWith("/pulls/"+c.authority.contractPr+"/reviews/"+p.authorization.contract_review.id));
    return (mutate??(v=>v))(clone(c.authority.contractReview),req.args[1]);
  }})} : {})});
const begin=(c,p,a,extra={})=>beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:p.branch,head:p.head,tree:p.tree,acceptedMain:p.base,runId:"revision-"+p.commission.ordinal,contractFingerprint:digest("contract"),sourceCorrection:p,revisionAuthorization:a,revisionInputs:c.inputs,revisionLive:c.live,...extra});
const stock=(c,r,a)=>inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,revisionAuthorization:a,revisionInputs:c.inputs,revisionLive:c.live});
const natural={exit_code:0,signal:null,timed_out:false,cancelled:false,spawn_error_code:null,exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0,termination_reason:"natural_exit",duration_ms:1};
function artifact(c,name,value){const f=path.join(c.artifacts,name);write(f,value);return{artifact:name,sha256:digest(readFileSync(f))};}
function receipt(c,a,disposition="product_failure"){
  const resources=[{id:"node-executable",classification:"execution",readOnlyExecutable:true,location_fingerprint:c.inputs.node.location_fingerprint,before:clone(c.inputs.node.observation)}], events=[];
  let fault=null;
  if(disposition==="input_invalidation"){
    const event={resource:"node-executable",classification:"execution",disposition,observed_at:time(-7000),monotonic_ns:"1",after:{...clone(resources[0].before),sha256:digest("observed bad node bytes")}};
    event.identity=inputEventIdentity(event);events.push(event);fault={resource:event.resource,disposition,observed_at:event.observed_at,monotonic_ns:event.monotonic_ns};
  }
  return finalizeReceipt({receipt_version:4,repository:{branch:c.branch,head_sha:a.head,tree_sha:a.tree,base_sha:c.base},run:{id:a.attempt_id},attempt:a,
  inputs:{contract:"augnes.local-canonical-inputs.v3",binding:{runtime_inputs:c.inputs},resources,events,first_fault:fault,secondary_faults:[]},
  phases:[{id:"integration",status:disposition==="completed_success"?"pass":"failure"}],outcome:{disposition,safety:fault?"blocked":"preserved_within_observed_scope",first_fault:fault},checkout_ownership:{released:true},capacity_ownership:{released:true},
  cleanup:{completed:true,remaining_owned_processes:0,companion_service:{restored:true},isolated_resources:{completed:true}}});}
const storeReceipt=(c,r)=>write(path.join(c.checkout,".augnes-local-verification/receipts",r.run.id+".json"),r);
const gitFor = c => args => execFileSync("git", args, {cwd:c.checkout, env:c.env, timeout:5000, maxBuffer:1024*1024, stdio:["ignore","pipe","pipe"]});
function attachGit(c,gitIncident) {
  c.git = gitFor(c);
  c.commit=value=>{write(path.join(c.checkout,"scripts/fixture.mjs"),"export const value="+value+";\n"+(gitIncident?'import assert from "node:assert/strict";\nassert.equal(value,4);\nconsole.log("corrected behavior");\n':""));c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","value "+value]);return c.git(["rev-parse","HEAD"]).toString().trim();};
}
function setup(root,browser=false){
  const inputSourceSuccessor=browser==="git-input-successor", inputRevision=browser==="git-input" || inputSourceSuccessor, gitIncident=browser==="git" || inputRevision, product="apps/web_planning/src/client.js.txt";
  const c={checkout:path.join(root,"checkout"),anchor:path.join(root,"anchor"),branch:"codex/reviewed-revision",root};
  mkdirSync(c.checkout);mkdirSync(c.anchor);c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});c.env=buildCanonicalChildEnvironment({temporaryRoot:root});
  attachGit(c,gitIncident && (!inputRevision || inputSourceSuccessor));
  if (gitIncident && !inputRevision) {
    const module = new URL("../local-canonical-inputs.mjs",import.meta.url).href;
    // A synthetic exact-mode reader for the fork. Real predecessor behavior is
    // separately witnessed on its own published Git blob and retained tree.
    write(path.join(c.checkout,"scripts/local-canonical-inputs.mjs"), 'export * from '+JSON.stringify(module)+';\nimport {observePreparedDependencyInputs as observe} from '+JSON.stringify(module)+';\nexport function observePreparedDependencyInputs(args){const v=observe(args); if(v.generated_directories.some(d=>d.state==="proven_empty" && d.metadata.mode!==d.parent_metadata.mode)) throw Object.assign(new Error("mode differs"),{code:"dependency_input_cache_unsafe"}); return v;}\n');
  }
  if (gitIncident && !inputRevision) for (const scenario of ["registration", "final-check"]) write(path.join(c.checkout, "scripts/" + scenario + ".mjs"), 'import assert from "node:assert/strict";\nassert.equal(false, true);\nconsole.log("fixture assertion passed");\n');
  if (gitIncident && !inputRevision) {
    write(path.join(c.checkout,"scripts/audit-subject.mjs"),"export const permitted = true;\n");
    write(path.join(c.checkout,"scripts/audit-driver.mjs"),'import assert from "node:assert/strict";\nimport {permitted} from "./audit-subject.mjs";\nconsole.log(JSON.stringify({permitted,expected:false}));\nassert.equal(permitted,false);\n');
  }
  c.git(["init","--quiet","-b",c.branch]);c.base=c.commit(1);c.baseTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.inputs={contract:"augnes.local-canonical-runtime-inputs.v1",node:{location_fingerprint:digest("current-node"),observation:{present:true,sha256:digest("node"),metadata:{mode:"33261",uid:"1",gid:"1",device:"1",inode:"1",links:"1",bytes:"4",mtime_ns:"1",ctime_ns:"1"},permission_identity:digest("node permissions"),executable_identity_policy:"shared-posix-v1"}},
    headers:{location_fingerprint:digest("headers"),observation:{contract:"augnes.local-canonical-node-headers.v1",present:true,location_fingerprint:digest("headers"),inventory_sha256:digest("inventory"),content_sha256:digest("content"),permission_sha256:digest("permissions"),entries:2,bytes:10}}};
  if(gitIncident){write(path.join(c.checkout,product),"let decision = null;\n");c.git(["add",product]);c.git(["update-ref","refs/remotes/origin/main",c.base]);write(path.join(c.checkout,".git/info/exclude"),".augnes-local-verification/\n");}
  if(browser){c.acceptedHead=c.commit(inputSourceSuccessor?3:2);c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();}
  if(gitIncident)c.gitDeclaration=gitFixtureDeclaration(c);
  if(inputRevision){
    c.git(["remote","add","origin","https://github.com/hynk-studio/augnes.git"]);
    c.git(["config",`branch.${c.branch}.remote`,"origin"]);
    c.git(["config",`branch.${c.branch}.merge`,"refs/heads/main"]);
    const observe=()=>freezeInputContract({resources:[createGitTrackingResource(path.join(c.checkout,".git/config"),[c.checkout])],pathKind:"isolated-model-free-v1",binding:{}}).snapshot().resources[0];
    c.gitDeclaration.resources[0]=observe();
    c.git(["config",`branch.${c.branch}.merge`,`refs/heads/${c.branch}`]);
    c.gitChangedObservation=observe().before;
    c.git(["update-ref","refs/remotes/origin/"+c.branch,c.acceptedHead]);
  }
  const a=beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:c.acceptedHead??c.base,tree:c.acceptedTree??c.baseTree,runId:"root-failure",contractFingerprint:gitIncident?digest(c.gitDeclaration):digest("root")});
  const raw=browser?browserFixtureReceipt(c,a):receipt(c,a);
  if(inputRevision)raw.repository.origin=c.git(["remote","get-url","origin"]).toString().trim();
  const r=gitIncident?gitFixtureReceipt(c,raw):raw;storeReceipt(c,r);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:r.outcome.disposition,cleanupComplete:true});
  c.legacyRoot=path.join(c.anchor,".augnes-local-verification/families",a.family_id);
  c.prior=r;
  const completion=path.join(c.legacyRoot,"completion-1.json");
  write(completion,{...read(completion),finished_at:time(-60000)});
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).attempt_id,a.attempt_id);
  if(gitIncident && !inputRevision){write(path.join(c.checkout,product),"let decision = preserveDraft();\n");c.git(["add",product]);}
  if(!browser){c.acceptedHead=c.commit(2);c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();}
  if(!inputRevision)c.commit(3);
  return c;
}
function prepare(c,ordinal=1){
  c.head=c.git(["rev-parse","HEAD"]).toString().trim();c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.artifacts=path.join(c.checkout,".augnes-local-verification/revision-"+(c.grantId??11)+"-"+ordinal);c.file=path.join(c.artifacts,"proof.json");
  const prior=c.prior.attempt, priorRoot=path.join(c.anchor,".augnes-local-verification/families",prior.family_id);
  const delta=(a,b)=>{const d=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",a,b,"--"]);return{bytes:d.length,sha256:digest(d),paths:c.git(["diff","--name-only",a,b,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
  const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",branch:c.branch,base:c.base,head:c.head,tree:c.tree,prior_family_id:prior.family_id,prior_number:1,prior_attempt_id:prior.attempt_id,prior_receipt_fingerprint:c.prior.integrity.content_fingerprint,pull_request:999,
    commission:ordinal===1?{root_family_id:prior.family_id,root_number:1,root_attempt_id:prior.attempt_id,root_receipt_fingerprint:c.prior.integrity.content_fingerprint,ordinal,maximum_invocations:2}:{...prior.source_correction.commission,ordinal},
    accepted:{head:c.acceptedHead,tree:c.acceptedTree,base:c.base,review:{}},authorization:{},
    originals:{receipt:artifact(c,"prior-receipt.json",c.prior),attempt:artifact(c,"prior-attempt.json",readFileSync(path.join(priorRoot,"attempt-1.json"))),completion:artifact(c,"prior-completion.json",readFileSync(path.join(priorRoot,"completion-1.json"))),
      stock:artifact(c,"prior-stock.log",JSON.stringify({content_fingerprint:c.prior.integrity.content_fingerprint,valid_deciding_evidence:false,dimensions:{historical_integrity:"intact",safety:c.prior.outcome.safety}}))},
    inputs:{predecessor_sha256:prior.source_correction?.schema.endsWith(".v7")?prior.source_correction.inputs.identity_sha256:digest(c.prior.inputs.resources),identity_sha256:digest(c.inputs),current:artifact(c,"runtime-inputs.json",c.inputs)},
    source:artifact(c,"source.json",{schema:"augnes.local-canonical-reviewed-revision-source.v1",basis:"implementation_owner_not_independent_review",reviewed_at:time(-1000),accepted_to_final:delta(c.acceptedHead,c.head),predecessor_to_final:delta(prior.head,c.head),main_to_final:delta(c.base,c.head)})};
  const bytes=c.git(["show",c.head+":scripts/fixture.mjs"]);
  p.focused=artifact(c,"focused.json",{schema:"augnes.local-canonical-reviewed-revision-focused.v1",basis:"implementation_owner_not_independent_review",predecessor_receipt_fingerprint:p.prior_receipt_fingerprint,runtime_inputs_sha256:p.inputs.identity_sha256,finished_at:time(-1000),
    remedy:"Synthetic behavioral correction with exact retained command evidence",implicated_paths:["scripts/fixture.mjs"],source_files:[{path:"scripts/fixture.mjs",byte_size:bytes.length,sha256:digest(bytes)}],
    commands:[{command:"synthetic behavior control",result:natural,record:artifact(c,"command-result.json",natural),stdout:artifact(c,"command-stdout.log","synthetic PASS\n")}],
    ...(prior.source_correction?.schema.endsWith(".v7")?{failed_phase:"integration",diagnosis:"Synthetic predecessor fixture returned demonstrated incorrect value"}:{})});
  const user={login:"synthetic-fixture",id:1,type:"User"},review={id:10,user,author_association:"OWNER",state:"COMMENTED",commit_id:c.acceptedHead,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:c.reviewTime??=time(-45000),body:"ACCEPT / RETAIN "+c.acceptedHead+" "+c.acceptedTree+" "+c.base};
  const grant={id:c.grantId??11,user,author_association:"OWNER",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999",updated_at:c.grantTime??=time(-30000),body:c.newCommission?c.branch+" historical acceptance "+review.id+" "+p.commission.root_receipt_fingerprint+" NEW commission; existing v7 reviewed_revision; old commission remains spent; at most two admitted deciding invocations total; demonstrated material correction with relevant focused support; zero unchanged-target retry and zero extra recovery; Reservation/interruption consumes; separate fresh-process stock; independent audit. Preserve the original safety_violation / blocked receipt; clean prospective dependency preparation and current safety checks.":c.acceptedHead+" "+c.acceptedTree+" "+c.branch+" https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10 reviewed source/execution-input revision; two admitted deciding invocations for this entire commission; materially corrected after focused checks; zero unchanged-target retry; no additional recovery allowance; Interrupted reservations consume; separate fresh-process stock; independent audit."};
  p.accepted.review={id:10,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  c.proof=p;c.authority={review,grant,pr:{number:999,state:"open",draft:true,merged:false,auto_merge:null,head:{sha:c.head,ref:c.branch,repo:{full_name:"hynk-studio/augnes"}},base:{sha:c.base,ref:"main",repo:{full_name:"hynk-studio/augnes"}}}};write(c.file,p);
}

// A synthetic spent commission and separately settled external service event.
// Fixture clocks/records are constructed here; production originals are immutable.
async function prepareSettlement(c) {
  prepare(c); let p=proof(c), a=await auth(c,p), first=begin(c,p,a);
  c.prior=receipt(c,first);storeReceipt(c,c.prior);
  finishAttempt(first,{receiptFingerprint:c.prior.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  const completionFile=attempt=>path.join(c.anchor,".augnes-local-verification/families",attempt.family_id,"completion-1.json");
  write(completionFile(first),{...read(completionFile(first)),finished_at:time(-45000)});
  c.commit(4);prepare(c,2);p=proof(c);a=await auth(c,p);const second=begin(c,p,a);
  const identity="sha256:"+digest("installed service"), stopped={status:"installed_stopped",checkout_relation:"exact",preservation_valid:true,service_identity:identity,preservation_binding:digest("stopped binding")};
  const running={...stopped,status:"live",preservation_binding:digest("live binding")};
  const observation=offset=>({state:clone(stopped),diagnostics:{contract:"augnes.companion-preservation-observation.v2",coherent:true,live_identity_valid:true,loaded_job:null,finished_at:time(offset),before_binding:stopped.preservation_binding,after_binding:stopped.preservation_binding,
    material_states:Object.fromEntries(["maintenance_lease_path","runtime_manifest_path","runtime_token_path","runtime_access_path","runtime_lock_path"].map(k=>[k,"missing"]))}});
  const old=receipt(c,second), event={resource:"installed_service_change",classification:"safety",disposition:"safety_violation",observed_at:time(-27000),monotonic_ns:"2",after:null};event.identity=digest(event);
  const fault={resource:event.resource,disposition:event.disposition,observed_at:event.observed_at,monotonic_ns:event.monotonic_ns};
  old.run.started_at=time(-42000);old.run.finished_at=time(-25000);
  old.inputs.events=[event];old.inputs.first_fault=fault;
  old.phases=[{id:"integration",status:"pass",cleanup:{completed:true,remaining_owned_processes:0}}];
  old.outcome={disposition:"safety_violation",safety:"blocked",first_fault:fault};old.final={result:"failure",exit_status:8,reason_codes:["companion_service_not_restored"]};
  old.cleanup={...old.cleanup,completed:false,failure_codes:["companion_service_not_restored"],companion_service:{before:stopped,after:running,restored:false,maintenance_acquired:false,maintenance_released:true,scope:"accepted_checkout_read_only",observations:{before:observation(-42000).diagnostics,after:observation(-25000).diagnostics}}};
  c.prior=finalizeReceipt(old);storeReceipt(c,c.prior);
  finishAttempt(second,{receiptFingerprint:c.prior.integrity.content_fingerprint,disposition:"safety_violation",cleanupComplete:false});
  write(completionFile(second),{...read(completionFile(second)),finished_at:time(-24000)});
  c.spent=[first,second].flatMap(attempt=>["attempt","completion"].map(kind=>path.join(c.anchor,".augnes-local-verification/families",attempt.family_id,kind+"-1.json")));
  c.spentHashes=c.spent.map(f=>digest(readFileSync(f)));
  c.commit(5);c.newCommission=true;c.grantId=12;c.grantTime=time(-7000);prepare(c);
  const audit={...c.authority.review,id:13,commit_id:second.head,submitted_at:time(-8000),body:"ACCEPT coordination/restoration; not blanket approval; original "+c.prior.integrity.content_fingerprint};
  c.authority.settlementReview=audit;
  c.authority.grant.body=c.branch+" "+audit.id+" "+audit.commit_id+" "+c.prior.integrity.content_fingerprint+" new prospective authority; active v7 reviewed_revision; fully accounted-for external shared-state incident with later verified restoration; Preserve the original false/blocked/invalid; fresh safe admission observations; at most two admitted deciding invocations for this entire new commission; actual material in-scope defect/input problem is corrected and relevant focused evidence supports it; No unchanged-target retry or extra recovery; Interrupted reservations consume; Old commissions remain spent; separate fresh-process stock; independent judgment.";
  c.proof.authorization={grant_comment_id:12,grant_sha256:digest(reviewedRevisionAuthorityObservation(c.authority.grant,"execution_commission")),settlement_review:{id:13,head:audit.commit_id,sha256:digest(reviewedRevisionAuthorityObservation(audit,"settlement_review"))}};
  const stop=artifact(c,"stop.json",{command:"stop",result:"changed",service:stopped}),restored=observation(-10000);
  const owner={service_identity:identity,recorded_at:time(-9500),start:{enclosing_cell_started_at:time(-35000),enclosing_cell_completed_at:time(-34000)},restoration:{command:{started_at:time(-15000),finished_at:time(-12000),exit_code:0,result_sha256:stop.sha256},before:running,after:stopped,loaded_job_after:null,supported_stop_only:true}};
  c.settlement={prior_receipt_fingerprint:c.prior.integrity.content_fingerprint,authority:c.proof.authorization,target:{base:c.proof.base,head:c.proof.head,tree:c.proof.tree,runtime_inputs_sha256:c.proof.inputs.identity_sha256},recorded_at:time(-500),responsible_owner:artifact(c,"responsible-owner.json",owner),stop,
    consumers:artifact(c,"consumers.json",{observed_at:time(-18000),registered_checkout_owners:[],verification_processes:[]}),managed_consumers:artifact(c,"managed-consumers.json",{generated_at:time(-19000),managed_execution:{stage:"no_run",attention_required:false,reconciliation_required:false}}),
    restored_observation:artifact(c,"restored-observation.json",restored),start_original:artifact(c,"start-original.log","synthetic responsible owner original\n")};
  c.proof.settlement=artifact(c,"settlement.json",c.settlement);
  const focused=read(path.join(c.artifacts,"focused.json"));focused.failed_phase=null;focused.diagnosis="All functional phases passed; the external service event remains blocked, with separately bound restoration and fresh admission.";
  c.proof.focused=artifact(c,"focused.json",focused);write(c.file,c.proof);
  c.live={observed_at:time(0),service:observation(0),foreign_checkout_owners:[]};
  c.edge=path.join(path.dirname(completionFile(second)),"correction-successor.json");
}

// Acquisition edge controls are synthetic, use the existing fixture/ledger/transport,
// and never touch the actual commission or retained receipt.
async function acquisitionProposalControls(parentRoot, lifecycle, retainMaterialPredecessor = false) {
  return withAdjacentAuthorityClock(async () => {
  const runOwned = createTrackedReviewChildRunner(lifecycle, runCanonicalChild);
  const root=path.join(parentRoot,"acquisition-proposal");mkdirSync(root);
  const c=setup(root), findings=[];
  const input="scripts/local-canonical-inputs.mjs", driver="scripts/acquisition-driver.mjs";
  const commit=()=>{c.git(["add","scripts",...(retainMaterialPredecessor?["apps"]:[])]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic acquisition correction"]);};
  const declaration=()=>({...gitFixtureDeclaration(c),binding:{head:c.head,tree:c.tree,runtime_inputs:c.inputs}});
  const complete=(a,r)=>{storeReceipt(c,r);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:r.outcome.disposition,cleanupComplete:true});
    const file=path.join(c.anchor,".augnes-local-verification/families",a.family_id,"completion-1.json");write(file,{...read(file),finished_at:time(-60000)});return file;};
  const acquisitionBehavior=async()=>{
    const result=await runOwned({command:process.execPath,args:[driver],cwd:c.checkout,env:c.env,suite:"git-acquisition-proposal",label:"owned behavioral control",timeoutMs:5000,stdout:quiet,stderr:quiet,log(){}});
    assert(result.cleanup_completed&&result.remaining_owned_processes===0&&result.exit_observed&&result.streams_closed);
    return {command:"node "+driver,tested_source_head:c.git(["rev-parse","HEAD"]).toString().trim(),finished_at:time(0),result,environment:digest("synthetic controlled runtime")};
  };
  try {
    if(retainMaterialPredecessor) seedMaterialSourceFiles(c,write);
    write(path.join(c.checkout,input),"export const coherent = false;\n");
    write(path.join(c.checkout,driver),'import assert from "node:assert/strict"; import {coherent} from "./local-canonical-inputs.mjs"; console.log({coherent}); assert.equal(coherent,true);\n');commit();
    write(path.join(c.checkout,".git/info/exclude"),".augnes-local-verification/\n");c.git(["update-ref","refs/remotes/origin/main",c.base]);
    prepare(c);let p=proof(c),authorization=await auth(c,p),a=begin(c,p,authorization);
    c.prior=receipt(c,a);complete(a,c.prior);
    c.commit(4);prepare(c,2);p=proof(c);authorization=await auth(c,p);
    c.gitDeclaration=declaration();a=begin(c,p,authorization,{contractFingerprint:digest(c.gitDeclaration)});
    let historical=gitFixtureReceipt(c,browserFixtureReceipt(c,a));
    const passed=historical.phases[0],cancelled=historical.phases[3],notRun=historical.phases[4];
    historical.phases=historical.phases.map((phase,index)=>({...clone(index<7?passed:index===7?{...cancelled,browser_use:[]}:notRun),id:phase.id}));
    const later=historical.inputs.events[1];later.disposition="ambient_observation";
    later.after.git_projection.effective_sha256=historical.inputs.resources[0].before.git_projection.effective_sha256;
    later.identity=inputEventIdentity(later);historical.inputs.secondary_faults=[];
    historical=finalizeReceipt(historical);const completionFile=complete(a,historical);c.prior=historical;
    const historicalStock={content_fingerprint:historical.integrity.content_fingerprint,status:"non_deciding_or_stale",valid_deciding_evidence:false,
      dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"matches_observed_context"},
      issues:["receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_input_observation_blocked","receipt_non_deciding","receipt_phase_environment_binding_invalid","receipt_browser_identity_invalid:integration",
        ...historical.phases.filter(v=>v.status!=="pass").map(v=>"phase_not_passing:"+v.id)].sort()};
    const completion=read(completionFile), phases=historical.phases.map(v=>v.id);
    const incident=()=>gitAcquisitionIncident(historical,historical.attempt,completion,historicalStock,phases);
    assert.equal(incident().race.after,null);
    for(const mutate of [
      r=>r.attempt.source_correction.commission.ordinal=1,
      r=>r.inputs.events[1].after.git_projection.effective_sha256=digest("protected change"),
      r=>r.inputs.events[1].after.permission_identity=digest("unsafe permissions"),
      r=>r.inputs.events[0].diagnostic.stage="permission_acl",
      r=>r.inputs.events[0].after={},r=>r.inputs.secondary_faults.push({...r.inputs.first_fault}),
      r=>r.cleanup.completed=false,r=>r.phases[7].timed_out=true,
      r=>r.phases[7].browser_use=[{consumer:"cumulative-work-surface",unchanged:false}],
    ]) {const v=clone(historical);mutate(v);assert.throws(()=>gitAcquisitionIncident(v,v.attempt,completion,historicalStock,phases));}
    findings.push("unknown historical window requires exact spent basic-v7 lineage, sole diagnostic, later ambient equality and complete cleanup; unsafe/incomplete alternatives refuse");
    const originalHashes=[completionFile,path.join(c.checkout,".augnes-local-verification/receipts",historical.run.id+".json"),c.file].map(file=>[file,digest(readFileSync(file))]);
    const red=await acquisitionBehavior();assert.equal(red.result.exit_code,1);
    const priorHead=c.head;
    write(path.join(c.checkout,input),"export const coherent = true;\n");commit();
    c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
    c.newCommission=true;c.grantId=32;prepare(c);p=c.proof;
    p.commission.input_acquisition=GIT_ACQUISITION_REPAIR;
    // A single unedited record has one timestamp even across a clock tick.
    const delegationTime=time(-10000);
    const delegation={...c.authority.grant,id:30,created_at:delegationTime,updated_at:delegationTime,body:[
      "## Ongoing task delegation",
      "This authorizes one cohesive correction and qualification assignment on "+c.branch+" in Draft PR #999, following the receiving audit.",
      "### 4. Delegated public recording after independent source review",
      "After a separate read-only reviewer accepts the actual final published registration, continuation, policy and control changes, the implementation operator is authorized to publish the independent decision faithfully and the subsequent required prospective commission/execution authority through the existing authenticated maintainer identity under this task delegation.",
    ].join("\n\n")};
    p.commission.delegation={id:30,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};
    p.inputs.inventory_sha256=gitRevisionInventory(historical.inputs);
    p.originals.stock=artifact(c,"prior-stock.log",JSON.stringify(historicalStock));
    const green=await acquisitionBehavior();assert.equal(green.result.exit_code,0);
    const source=name=>c.git(["show",p.head+":"+name]);
    const witness=(name,result,head)=>artifact(c,name+".json",{...result,node_version:CANONICAL_NODE_VERSION,runtime_inputs_sha256:p.inputs.identity_sha256,
      file_sha256:digest(source(driver)),fixture_sha256:digest(source(driver)),modules:[{path:input,sha256:digest(c.git(["show",head+":"+input]))}],
      stdout:artifact(c,name+".log",result.result.exit_code?"synthetic acquisition assertion failed\n":"synthetic acquisition assertion passed\n")});
    const before=witness("red",red,priorHead),after=witness("green",green,p.head),afterRecord=read(path.join(c.artifacts,after.artifact));
    const focused=read(path.join(c.artifacts,p.focused.artifact));
    Object.assign(focused,{finished_at:time(0),failed_phase:historical.phases[7].id,diagnosis:"Synthetic acquisition correction with a preserved unknown failed observation; the old receipt is never repaired.",
      implicated_paths:[input],source_files:[input,driver].map(file=>({path:file,sha256:digest(source(file)),byte_size:source(file).length})),input_remedy_resources:[],
      regression:{path:driver,args:[],attribution:"final-driver-prior-input-owner",before,after},
      commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:afterRecord.stdout}]});
    p.focused=artifact(c,"focused.json",focused);p.source=artifact(c,"source.json",{...read(path.join(c.artifacts,p.source.artifact)),reviewed_at:time(0)});
    const service=historical.cleanup.companion_service;
    c.live={inventory:p.inputs.inventory_sha256,service:{state:service.after,diagnostics:{...service.observations.after,finished_at:time(0)}}};
    const prep=path.join(c.artifacts,"preparation.json");
    const inspect=q=>{q=clone(q);delete q.authorization;delete q.accepted.review;write(prep,q);return inspectGitRevisionPreparation({file:prep,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live});};
    const prepared=inspect(p);assert.equal(prepared.reserved,false);assert.equal(prepared.consumed,2);
    const decision="Historical window remains UNKNOWN; old false stock and both spent ordinals remain unchanged.";
    const review={...c.authority.review,id:31,commit_id:p.head,submitted_at:time(1),body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,prepared.target,decision].join("\n")};
    const grantTime=time(2);
    const grant={...c.authority.grant,id:32,created_at:grantTime,updated_at:grantTime,body:[
      "Authorize a NEW prospective v7 reviewed_revision commission for a Git acquisition correction.",
      p.schema,p.base,p.head,p.tree,p.branch,p.prior_receipt_fingerprint,prepared.target,
      "https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-31 https://github.com/hynk-studio/augnes/pull/999#issuecomment-30",
      "old commission remains spent; at most two admitted deciding invocations total; demonstrated material correction and focused support; zero extra recovery; Reservation/interruption consumes; zero unchanged-target retry; separate fresh-process stock; independent audit.",decision].join("\n")};
    p.accepted.review={id:31,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};
    p.authorization={grant_comment_id:32,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
    c.authority={...c.authority,review,grant,linked:{["repos/hynk-studio/augnes/issues/comments/30"]:delegation}};
    const bind=()=>write(c.file,p);bind();
    const parsed=proof(c);const edge=path.join(path.dirname(completionFile),"correction-successor.json");
    assert.throws(()=>begin(c,parsed,{observations:{}}),/revision_authenticated_authority_required/);assert(!existsSync(edge));
    const originalGrant=grant.body;grant.body=grant.body.replace(decision,"");p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));bind();
    await assert.rejects(auth(c,proof(c)),/revision_authority_scope_invalid/);grant.body=originalGrant;p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));bind();
    for(const record of [grant,delegation]) {
      const created=record.created_at;
      record.created_at=new Date(Date.parse(created)-1).toISOString();
      try {await assert.rejects(auth(c,proof(c)),/revision_authority_scope_invalid/);}
      finally {record.created_at=created;}
    }
    for(const mutate of [q=>delete q.commission.input_acquisition,q=>q.commission.input_acquisition="unknown",q=>q.commission.ordinal=2,q=>q.prior_attempt_id="older",q=>q.inputs.inventory_sha256=digest("other")]) {
      const q=clone(p);mutate(q);assert.throws(()=>inspect(q));assert(!existsSync(edge));
    }
    findings.push("read-only preparation never reserves; missing marker, altered scope/input/tip, wrong ordinal and absent or generic authority refuse");
    bind();const admitted=proof(c),capability=await auth(c,admitted),attempt=begin(c,admitted,capability,retainMaterialPredecessor?{contractFingerprint:digest({...c.gitDeclaration,binding:{head:c.head,tree:c.tree,executor_fingerprint:baseReceipt.executor.source_fingerprint,runtime_inputs:c.inputs,
      environment_keys:["AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT","npm_config_nodedir","AUGNES_BROWSER_EXECUTABLE_PATH"],
      phase_environment_fingerprints:REVIEWED_REVISION_PHASES.map(id=>({id,fingerprint:digest(id)}))}}),runId:"acquisition-first"}:{});
    assert.equal(attempt.source_correction.commission.ordinal,1);
    const current=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
    assert.equal(current.reviewed_revision_consumed,1);assert.equal(current.revision_grants.length,2);assert(current.revision_grants.includes(11));assert(current.revision_grants.includes(32));
    assert.throws(()=>begin(c,admitted,capability));
    const coldPacket=path.join(c.artifacts,"interrupted-stock-packet.json");
    write(coldPacket,{anchor:c.anchor,checkout:c.checkout,branch:c.branch,file:c.file,inputs:c.inputs,live:c.live,authority:c.authority,receipt:receipt(c,attempt)});
    const cold=await runOwned({command:process.execPath,args:[self,"--cold-acquisition",coldPacket],cwd:c.checkout,env:c.env,
      suite:"reviewed-revision",label:"fresh interrupted acquisition stock",timeoutMs:15000,stdout:quiet,stderr:process.stderr,log(){}});
    assert(cold.exit_code===0&&cold.exit_observed&&cold.streams_closed&&cold.cleanup_completed&&cold.remaining_owned_processes===0);
    const exportable=finalizeReceipt({...clone(baseReceipt),...receipt(c,attempt),final:{result:"failure",exit_status:1,reason_codes:["interrupted"]}});
    const exported=createPrivateReviewExport(exportable);
    assert(inspectPrivateReviewExport(exported).structurally_valid);
    assert.equal(exported.attempt.source_correction.commission.input_acquisition,GIT_ACQUISITION_REPAIR);
    assert.deepEqual(exported.attempt.source_correction.commission.delegation,p.commission.delegation);
    assert.equal(exported.attempt.source_correction.inputs.inventory_sha256,p.inputs.inventory_sha256);
    assert.equal(exported.attempt.source_correction.inputs.current.artifact,undefined);
    findings.push("fresh-process stock remains false for the interrupted new reservation; reconstructed consumption is one and old grants remain spent");
    for(const [file,hash] of originalHashes)assert.equal(digest(readFileSync(file)),hash);
    findings.push("synthetic exclusive new edge retains old two spent ordinals and grant IDs; interrupted reservation consumes and exact replay cannot reserve again");
    console.log(JSON.stringify({git_acquisition_proposal_controls:findings,synthetic_only:true,real_authority:false}));
    if (retainMaterialPredecessor) {
      await prepareMaterialSourcePredecessor(c,{prepare,proof,auth,begin,receipt,artifact,write,read,storeReceipt,run:runOwned,
        behavior:subject=>behavior(subject,false,runOwned),fresh:packet=>freshReader(c,packet,runOwned)},admitted,attempt,capability);
      const {env,owner,git,commit,...state}=c;
      write(path.join(root,"context.json"),{...state,proofPath:path.relative(c.checkout,c.file)});
    }
    return findings;
  } finally {if(lifecycle.pendingChildren===0)releaseCheckoutVerificationOwnership(c.owner,c.checkout);}
  });
}

if(process.argv[2]==="--cold"){
  const c=read(process.argv[3]),p=proof(c),a=await auth(c,p);
  if (c.stockContext) {
    const r=read(path.join(c.checkout,".augnes-local-verification/receipts",c.stockContext.expectedRunId+".json"));
    const stale=observeFixtureLive(c), observation=stale?.service?.diagnostics ?? stale?.diagnostics;
    if(observation){
      observation.finished_at=time(-61000);
      assert.equal(stock({...c,live:stale},r,a),false,"stale current observation must refuse stock");
    }
    c.live=observeFixtureLive(c);
    const git=args=>execFileSync("git",args,{cwd:c.checkout,encoding:"utf8",timeout:5000}).trim();
    const currentIdentity={...c.stockContext.currentIdentity,head_sha:git(["rev-parse","HEAD"]),branch:git(["symbolic-ref","--short","HEAD"])};
    const result=inspectReceiptForDecision(r,{...c.stockContext,currentIdentity,currentAttemptRecordsValid:stock(c,r,a),
      currentInputStateValid:digest(c.inputs)===p.inputs.identity_sha256 && !r.inputs.prepared_dependencies?.some(v=>v.after===null)});
    write(c.stockOutput,result);
    assert.equal(result.valid_deciding_evidence,c.expectedPass,JSON.stringify(result.issues));
  } else assert(stock(c,c.receipt,a));
  if(c.lateContender){c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
    try{assert.throws(()=>begin(c,p,a,{runId:"late-material-contender"}),/attempt_latest_tip_required/);}
    finally{releaseCheckoutVerificationOwnership(c.owner,c.checkout);}}
  console.log("fresh reader PASS");
}else if(process.argv[2]==="--race"){
  const c=read(process.argv[3]);c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
  try{const p=proof(c),a=await auth(c,p);write(c.ready,"ready");while(!existsSync(c.go))await new Promise(r=>setTimeout(r,5));
    try{begin(c,p,a);console.log("admitted");}catch(e){assert(["EEXIST","ENOENT","attempt_latest_tip_required","revision_validated_lineage_changed","revision_material_changed_during_validation"].includes(e.code),e.message);console.log("refused");}
  }finally{releaseCheckoutVerificationOwnership(c.owner,c.checkout);}
}else if (["git","git-input","git-input-lifecycle","git-input-successor","git-successor","commission","successor","final-input","final-successor","post-pass","post-pass-controls","post-pass-successor","material-source","material-controls","material-successor","material-final","material-reservation"].some(g => process.argv[2] === "--run-"+g+"-fixtures")) {
  const group = process.argv[2].slice(6,-9), handoff = JSON.parse(process.argv[3]);
  const outer = process.env.AUGNES_CANONICAL_TEMP_ROOT, physical = lstatSync(handoff.root);
  assert(handoff.root === outer || path.dirname(handoff.root) === path.dirname(path.dirname(outer)) &&
    /^ag-suite-[A-Za-z0-9]{6}$/u.test(path.basename(handoff.root)));
  assert(physical.isDirectory() && realpathSync(handoff.root) === handoff.root && physical.uid === process.getuid() &&
    (physical.mode & 0o777) === 0o700 && String(physical.dev) === handoff.device && String(physical.ino) === handoff.inode);
  const dir = path.join(handoff.root,group.startsWith("material-") ? "acquisition-proposal" : group.startsWith("git-input") ? group+"-case" : group.startsWith("git") ? "git-case" : group.startsWith("final") ? "final-case" : group.startsWith("post-pass") ? "post-pass-case" : "prospective-fixture");
  const owner=createCanonicalTestResourceRoot("ag-resource-test-"), lifecycle={pendingChildren:0};beginCanonicalTestResourceUse(owner);
  const runOwned=createTrackedReviewChildRunner(lifecycle,runCanonicalChild);
  let c;
  try {
    if (["git","git-input","git-input-lifecycle","git-input-successor"].includes(group)) {mkdirSync(dir,{mode:0o700}); c=setup(dir,group === "git-input-lifecycle" ? "git-input" : group);}
    else {
      assert.equal(realpathSync(dir),dir);
      c = read(path.join(dir,"context.json")); c.root=dir;
      c.checkout=path.join(dir,"checkout"); c.anchor=path.join(dir,"anchor");
      c.file=path.join(c.checkout,c.proofPath); c.artifacts=path.dirname(c.file);
      c.env=buildCanonicalChildEnvironment({temporaryRoot:owner.root}); attachGit(c,true);
      c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
      c.live=observeFixtureLive(c);
    }
    const helpers={prepare,artifact,read,write,proof,auth,begin,stock,receipt,storeReceipt,finish:finishAttempt,
      releaseOwner:()=>releaseCheckoutVerificationOwnership(c.owner,c.checkout), acquireOwner:()=>c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout}),
      run:runOwned,behavior:(subject,syntaxOnly=false)=>behavior(subject,syntaxOnly,runOwned),fresh:packet=>freshReader(c,packet,runOwned),
      snapshot:path.join(handoff.root,"prospective-fixture"),fork:path.join(handoff.root,"final-case"),positive:path.join(handoff.root,"post-pass-case")};
    if (group==="git") await runGitRevisionControls(c,helpers);
    else if (group.startsWith("git-input")) await runGitInputRevisionControls(c,helpers,group==="git-input-successor",group==="git-input-lifecycle");
    else if (group==="git-successor") await completeGitRevisionControls(c,helpers);
    else if (group.startsWith("material-")) await runMaterialSourceControls(c,helpers,group);
    else if (group.startsWith("final")) await checkFinalDependency(c,helpers,group);
    else if (group.startsWith("post-pass")) await checkPostPass(c,helpers,group);
    else await checkSpentCommission(c,helpers,group);
    if (["git","commission","final-input","post-pass","post-pass-controls","material-source","material-controls","material-successor","material-final"].includes(group)) {
      const {env,owner,git,commit,...state}=c;
      write(path.join(dir,"context.json"),{...state,proofPath:path.relative(c.checkout,c.file)});
    }
  } finally {
    if (lifecycle.pendingChildren===0 && c?.owner) releaseCheckoutVerificationOwnership(c.owner,c.checkout);
    settleCanonicalTestResourceUse(owner,{exit_observed:lifecycle.pendingChildren===0,streams_closed:lifecycle.pendingChildren===0,
      cleanup_completed:lifecycle.pendingChildren===0,remaining_owned_processes:lifecycle.pendingChildren});
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
}else if(["--run-serial-aggregate-fixtures","--run-serial-material-fixtures"].includes(process.argv[2])){
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);
  const lifecycle={pendingChildren:0}, run=createTrackedReviewChildRunner(lifecycle,runCanonicalChild);
  const c=setup(owner.root);
  try { await runSerialAggregateControls(c,{prepare,artifact,read,write,proof,auth,begin,stock,receipt,storeReceipt,run,
    fresh:packet=>freshReader(c,packet,run),behavior:(subject)=>behavior(subject,false,run)},process.argv[2]==="--run-serial-material-fixtures"); }
  finally {releaseCheckoutVerificationOwnership(c.owner,c.checkout);settleCanonicalTestResourceUse(owner,{exit_observed:lifecycle.pendingChildren===0,streams_closed:lifecycle.pendingChildren===0,cleanup_completed:lifecycle.pendingChildren===0,remaining_owned_processes:lifecycle.pendingChildren});assert(cleanupCanonicalTestResources([owner])[0].completed);}
}else if(process.argv[2]==="--run-browser-fixtures"){
  browserProgress("setup_start");
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);
  const c=setup(owner.root,true);
  browserProgress("setup_complete");
  try {
    await runBrowserRevisionControls(c,{prepare,artifact,read,write,proof,auth,begin,stock,receipt,storeReceipt,baseReceipt,
      fresh:packet=>freshReader(c,packet),progress:browserProgress});
    browserProgress("controls_complete");
  }finally{browserProgress("cleanup_start");releaseCheckoutVerificationOwnership(c.owner,c.checkout);settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});assert(cleanupCanonicalTestResources([owner])[0].completed);browserProgress("cleanup_complete");}
}else if(process.argv[2]==="--run-settlement-fixtures"){
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);
  const c=setup(owner.root);let children=0;
  try {
    await prepareSettlement(c);let p=proof(c),a=await auth(c,p);
    const proofBytes=readFileSync(c.file),settlementBytes=readFileSync(path.join(c.artifacts,"settlement.json"));
    const unchanged=()=>{assert(!existsSync(c.edge));assert.deepEqual(c.spent.map(f=>digest(readFileSync(f))),c.spentHashes);};
    for(const mutate of [q=>delete q.settlement,q=>q.settlement.sha256=digest("tampered"),q=>q.authorization.grant_comment_id=11,q=>q.authorization.settlement_review.head=c.base,q=>q.prior_attempt_id="older-tip",q=>q.inputs.identity_sha256=digest("other inputs")]){
      const q=clone(c.proof);mutate(q);write(c.file,q);assert.throws(()=>proof(c));write(c.file,proofBytes);unchanged();
    }
    for(const mutate of [s=>s.target.head=c.base,s=>s.authority.grant_comment_id=11,s=>delete s.stop,s=>s.responsible_owner.sha256=digest("bad owner"),s=>s.recorded_at=time(-90000)]){
      const s=clone(c.settlement);mutate(s);const q=clone(c.proof);q.settlement=artifact(c,"settlement.json",s);write(c.file,q);assert.throws(()=>proof(c));write(path.join(c.artifacts,"settlement.json"),settlementBytes);write(c.file,proofBytes);unchanged();
    }
    for(const [key,mutate] of [["responsible_owner",v=>v.service_identity="sha256:"+digest("foreign")],["responsible_owner",v=>v.restoration.supported_stop_only=false],["consumers",v=>v.registered_checkout_owners=[{active:true}]],["managed_consumers",v=>v.managed_execution.stage="running"],["restored_observation",v=>v.diagnostics.material_states.maintenance_lease_path="present"]]){
      const ref=c.settlement[key],file=path.join(c.artifacts,ref.artifact),saved=readFileSync(file),value=read(file);mutate(value);
      const s=clone(c.settlement);s[key]=artifact(c,ref.artifact,value);const q=clone(c.proof);q.settlement=artifact(c,"settlement.json",s);write(c.file,q);assert.throws(()=>proof(c));
      write(file,saved);write(path.join(c.artifacts,"settlement.json"),settlementBytes);write(c.file,proofBytes);unchanged();
    }
    for(const mutate of [v=>v.foreign_checkout_owners=[{owner_pid:42}],v=>v.observed_at=time(-61000),v=>v.service.state.status="live",v=>v.service.state.service_identity="sha256:"+digest("wrong"),v=>v.service.diagnostics.coherent=false,v=>v.service.diagnostics.loaded_job={pid:42}]){
      const live=clone(c.live);mutate(live);assert.throws(()=>begin(c,p,a,{revisionLive:live}),/revision_current_settlement_unsafe/);unchanged();
    }
    assert.throws(()=>begin(c,p,a,{revisionLive:null}),/revision_current_settlement_unsafe/);unchanged();
    for(const endpoint of ["/reviews/13","/comments/12"])await assert.rejects(auth(c,p,(record,e)=>{if(e.endsWith(endpoint))record.body="ordinary approval";return record;}));
    // An additional fault or unfinished owned cleanup cannot be hidden behind
    // a correctly rehashed local settlement. The authenticated receipt also pins it.
    for(const mutate of [v=>v.inputs.secondary_faults=[{resource:"unknown",disposition:"safety_violation"}],v=>v.cleanup.remaining_owned_processes=1,v=>v.phases[0].cleanup.completed=false]){
      const file=path.join(c.artifacts,c.proof.originals.receipt.artifact),saved=readFileSync(file),value=read(file);mutate(value);
      const q=clone(c.proof);q.originals.receipt=artifact(c,q.originals.receipt.artifact,finalizeReceipt(value));write(c.file,q);assert.throws(()=>proof(c));write(file,saved);write(c.file,proofBytes);unchanged();
    }
    const raceAnchor=path.join(owner.root,"race-anchor"),go=path.join(owner.root,"race-go"),ready=[],packets=[];
    cpSync(c.anchor,raceAnchor,{recursive:true});
    for(let i=0;i<2;i++){
      const checkout=path.join(owner.root,"racing-checkout-"+i),file=path.join(owner.root,"race-packet-"+i+".json"),readyFile=path.join(owner.root,"race-ready-"+i);
      cpSync(c.checkout,checkout,{recursive:true,filter:source=>source!==path.join(c.checkout,".augnes-local-verification/checkout-owner.json")});
      write(file,{anchor:raceAnchor,checkout,file:path.join(checkout,path.relative(c.checkout,c.file)),inputs:c.inputs,authority:c.authority,live:c.live,ready:readyFile,go});ready.push(readyFile);packets.push(file);
    }
    let raceOutput="";const racing=packets.map(async file=>{
      children++;const result=await runCanonicalChild({command:process.execPath,args:[self,"--race",file],cwd:c.checkout,env:c.env,suite:"reviewed-revision",label:"settlement competing reservation",timeoutMs:10000,stdout:{write(chunk){raceOutput+=chunk;}},stderr:process.stderr});
      assert(result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0);children--;assert.equal(result.exit_code,0);
    });
    const deadline=Date.now()+8000;while(!ready.every(existsSync)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));assert(ready.every(existsSync));write(go,"go");await Promise.all(racing);
    assert.equal(raceOutput.split("\n").filter(line=>line==="admitted").length,1);assert.equal(raceOutput.split("\n").filter(line=>line==="refused").length,1);unchanged();
    p=proof(c);a=await auth(c,p);const attempt=begin(c,p,a),r=receipt(c,attempt,"completed_success");storeReceipt(c,r);
    finishAttempt(attempt,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});assert(stock(c,r,a));
    assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,1);
    assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}),/attempt_lineage_edge_invalid/);
    assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/);
    const exportable=finalizeReceipt({...clone(baseReceipt),...r,final:{result:"success",exit_status:0,reason_codes:[]}}),exported=createPrivateReviewExport(exportable);
    assert(inspectPrivateReviewExport(exported).structurally_valid);assert(validReviewedRevisionAttempt(exported.attempt));
    assert.equal(exported.attempt.source_correction.settlement.artifact,undefined);assert.equal(exported.attempt.source_correction.authorization.settlement_review.id,13);
    const packet=path.join(owner.root,"cold-settlement.json");write(packet,{anchor:c.anchor,checkout:c.checkout,file:c.file,inputs:c.inputs,authority:c.authority,receipt:r,live:c.live});
    children++;const cold=await runCanonicalChild({command:process.execPath,args:[self,"--cold",packet],cwd:c.checkout,env:c.env,suite:"reviewed-revision",label:"settlement fresh reader",timeoutMs:10000,stdout:quiet,stderr:process.stderr});
    assert(cold.exit_observed&&cold.streams_closed&&cold.cleanup_completed&&cold.remaining_owned_processes===0);children--;assert.equal(cold.exit_code,0);
    const savedSettlement=readFileSync(path.join(c.artifacts,"settlement.json"));write(path.join(c.artifacts,"settlement.json"),"{}");assert.equal(stock(c,r,a),false);write(path.join(c.artifacts,"settlement.json"),savedSettlement);
    assert.deepEqual(c.spent.map(f=>digest(readFileSync(f))),c.spentHashes);assert.equal(c.prior.cleanup.completed,false);assert.equal(c.prior.outcome.safety,"blocked");
    // A reservation without its appended attempt is consumed, not a new slot.
    rmSync(path.join(c.anchor,".augnes-local-verification/families",attempt.family_id,"attempt-1.json"));
    assert.throws(()=>begin(c,p,a),{code:"ENOENT"});assert(existsSync(c.edge));
    console.log(JSON.stringify({settlement_controls:["fully settled external event admitted through production v7","missing/tampered/wrong authority-source-input-predecessor refused","unknown fault, unfinished cleanup and unsafe/foreign current state refused","immutable blocked predecessor, bounded export and fresh-process stock","concurrent exclusive admission, replay and interrupted reservation remain consumed"],synthetic_only:true}));
  } finally {releaseCheckoutVerificationOwnership(c.owner,c.checkout);settleCanonicalTestResourceUse(owner,{exit_observed:children===0,streams_closed:children===0,cleanup_completed:children===0,remaining_owned_processes:children});assert(cleanupCanonicalTestResources([owner])[0].completed);}
}else if(process.argv[2]==="--cold-acquisition"){
  const c=read(process.argv[3]),p=proof(c),a=await auth(c,p);
  assert.equal(stock(c,c.receipt,a),false);
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,1);
  console.log("fresh interrupted marked stock remains false");
}else if(process.argv[2]==="--run-acquisition-fixtures"){
  const owner=createCanonicalTestResourceRoot("ag-resource-test-"), lifecycle={pendingChildren:0};beginCanonicalTestResourceUse(owner);
  try {
    const shared=process.argv[3] ? JSON.parse(process.argv[3]) : null;
    if(shared) {
      const st=lstatSync(shared.root);assert.equal(realpathSync(shared.root),shared.root);
      assert(st.isDirectory() && st.uid===process.getuid() && (st.mode&0o777)===0o700 && String(st.dev)===shared.device && String(st.ino)===shared.inode);
      assert(shared.root===process.env.AUGNES_CANONICAL_TEMP_ROOT || path.dirname(shared.root)===path.dirname(path.dirname(process.env.AUGNES_CANONICAL_TEMP_ROOT)) && /^ag-suite-[A-Za-z0-9]{6}$/u.test(path.basename(shared.root)));
    }
    await acquisitionProposalControls(shared?.root??owner.root,lifecycle,!!shared);
  } finally {
    if(lifecycle.pendingChildren===0)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
}else if(process.argv[2]==="--run-revision-fixtures"){
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);const c=setup(owner.root), findings=[], lifecycle={pendingChildren:0};let liveChildren=0;
  const child=async(args,options={})=>{liveChildren++;const r=await runCanonicalChild({command:process.execPath,args:[self,...args],cwd:c.checkout,env:c.env,suite:"reviewed-revision",label:"fresh synthetic consumer",timeoutMs:10000,stdout:quiet,stderr:process.stderr,...options});assert(r.exit_observed&&r.streams_closed&&r.cleanup_completed&&r.remaining_owned_processes===0);liveChildren--;assert.equal(r.exit_code,0);return r;};
  try{
    findings.push(...await acquisitionProposalControls(owner.root,lifecycle));
    prepare(c);let p=proof(c),a=await auth(c,p);
    // The shared v7 schema must reach this complete validator. Renaming the
    // retired kind or stripping its markers cannot manufacture a valid proof.
    const liveProofBytes=readFileSync(c.file);
    const legacyAttemptFile=path.join(c.legacyRoot,"attempt-1.json"), legacyAttemptBytes=readFileSync(legacyAttemptFile);
    for(const mutate of [
      q=>q.kind="companion_readiness_timeout",q=>q.companion_timeout_authority={},
      q=>q.kind="operating_profile_efficiency",q=>q.kind="settled_successor_budget",
      q=>q.profile_authority=false,q=>q.operating_profile_consumed=false,q=>q.budget_authority=null,q=>q.successor_budget_consumed=false,
      q=>q.schema="augnes.local-canonical-closeout.v1",q=>q.kind="unknown",
      q=>delete q.kind,q=>delete q.commission,q=>q.accepted={},q=>q.unknown=true,
      q=>{for(const key of Object.keys(q))if(!["schema","kind"].includes(key))delete q[key];},
    ]){
      const q=clone(c.proof);mutate(q);write(c.file,q);
      assert.throws(()=>proof(c));
      assert.throws(()=>begin(c,{...q,local_relative_path:p.local_relative_path},a));
      assert(readFileSync(legacyAttemptFile).equals(legacyAttemptBytes));
      assert(!existsSync(path.join(c.legacyRoot,"correction-successor.json")));
      write(c.file,liveProofBytes);
    }
    findings.push("shared v7 active proof validated; retired, disguised, unknown and malformed proofs refuse without reservation");
    assert.throws(()=>begin(c,p,{observations:a.observations}),/revision_authenticated_authority_required/);
    assert.throws(()=>begin(c,p,a,{revisionInputs:{...c.inputs,unknown:true}}),/revision_authenticated_authority_required/);
    for(const mutate of [r=>r.body="generic approval",r=>r.user.id=2,r=>r.author_association="NONE",r=>r.commit_id=c.base])await assert.rejects(auth(c,p,(r,e)=>{if(e.includes("/reviews/"))mutate(r);return r;}));
    const original=readFileSync(c.file);
    for(const mutate of [q=>q.prior_attempt_id="older",q=>q.tree="0".repeat(40),q=>q.inputs.identity_sha256="0".repeat(64),q=>q.commission.ordinal=2]){
      const q=clone(c.proof);mutate(q);write(c.file,q);assert.throws(()=>proof(c));write(c.file,original);
    }
    findings.push("wrong authority/source/input/predecessor/ordinal and forged-capability refusals");
    p=proof(c);a=await auth(c,p);const first=begin(c,p,a),r=receipt(c,first);assert(validReviewedRevisionAttempt(first));storeReceipt(c,r);finishAttempt(first,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
    // A live tip cannot bypass a retired predecessor in the same mixed chain.
    // Only small disposable markers change; no retired proof tree is rebuilt.
    for(const marker of [
      ...["operating_profile_efficiency","settled_successor_budget","observer_repair","corrected_timeout","condition_requalification","guide_cancellation_correction"].map(kind=>({schema:"augnes.local-canonical-source-correction.v2",kind})),
      ...["spent-acquisition-reviewed-workload-v1","spent-terminal-git-successor-workload-v1",false,null].map(reviewed_workload=>({schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",commission:{reviewed_workload}})),
    ]){
      const prior=JSON.parse(legacyAttemptBytes);prior.source_correction=marker;write(legacyAttemptFile,prior);
      try{
        assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}),{code:"qualification_route_retired"});
        assert.throws(()=>begin(c,p,a),{code:"qualification_route_retired"});assert.equal(stock(c,r,a),false);
      }finally{write(legacyAttemptFile,legacyAttemptBytes);}
    }
    assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).attempt_id,first.attempt_id);
    assert(stock(c,r,a));findings.push("mixed retired predecessor refuses despite live v7 tip; unchanged live history reads again after disposable control restoration");
    const exportable=finalizeReceipt({...clone(baseReceipt),...r,inputs:{...r.inputs,events:[],limitations:[],first_fault:null},final:{result:"failure",exit_status:1,reason_codes:["phase_failed"]}});
    const exported=createPrivateReviewExport(exportable);assert(inspectPrivateReviewExport(exported).structurally_valid);assert(validReviewedRevisionAttempt(exported.attempt));
    assert.equal(JSON.stringify(exported).includes(c.artifacts),false);assert.equal(exported.attempt.source_correction.inputs.current.artifact,undefined);
    const malformed=clone(exportable);malformed.attempt.source_correction.commission.ordinal=3;
    assert.throws(()=>createPrivateReviewExport(finalizeReceipt(malformed)),/review_export_revision_invalid/);
    const dep={contract:"augnes.local-canonical-prepared-dependencies.v1",phase_id:"dependencies-root",location_fingerprint:digest("deps"),sources:[{name:"package.json",sha256:digest("package"),bytes:2},{name:"package-lock.json",sha256:baseReceipt.dependencies.root_lock_sha256,bytes:2}],entries:1,bytes:4,layout_sha256:digest("layout"),content_sha256:digest("contents"),permission_sha256:digest("permissions"),generated_cache:"proven_empty"};
    const checked=clone(exportable);checked.phases=[{...baseReceipt.phases[0],id:"dependencies-root",status:"pass"}];checked.inputs.prepared_dependencies=[{phase_id:"dependencies-root",before:dep,after:{...dep,generated_cache:"absent_or_binding"},unchanged:true,error:null}];
    const depIssues=value=>inspectReceiptForDecision(finalizeReceipt(value)).issues;
    assert(!depIssues(checked).includes("receipt_companion_timeout_succession_invalid"), "reviewed revision must not dispatch to the other v7 kind");
    const mixed=clone(checked);mixed.attempt.companion_timeout_authority={};
    assert(depIssues(mixed).includes("receipt_qualification_route_retired"), "a foreign authority marker still refuses");
    assert(!depIssues(checked).includes("receipt_prepared_dependency_inputs_invalid"));
    for(const mutate of [v=>v.inputs.prepared_dependencies=[],v=>v.inputs.prepared_dependencies.push(clone(v.inputs.prepared_dependencies[0])),v=>v.inputs.prepared_dependencies[0].after=null,v=>v.inputs.prepared_dependencies[0].error="observer_failure",v=>v.inputs.prepared_dependencies[0].after.content_sha256=digest("different"),v=>v.phases[0].status="not_run"]){const v=clone(checked);mutate(v);assert(depIssues(v).includes("receipt_prepared_dependency_inputs_invalid"));}
    const event={resource:"dependencies-root",classification:"execution",disposition:"input_invalidation",observed_at:time(-1000),monotonic_ns:"1",after:{...dep,content_sha256:digest("mutated contents")}};event.identity=inputEventIdentity(event);
    checked.inputs.events=[event];assert(!depIssues(checked).includes("receipt_input_event_invalid"));checked.inputs.events[0].identity=digest("wrong event");assert(depIssues(checked).includes("receipt_input_event_invalid"));
    const unsafeEvent={...event,disposition:"safety_violation",after:null};unsafeEvent.identity=inputEventIdentity(unsafeEvent);checked.inputs.events=[unsafeEvent];checked.inputs.prepared_dependencies[0].error="dependency_input_link_escape";
    assert(!depIssues(checked).includes("receipt_input_event_invalid"));checked.inputs.prepared_dependencies[0].error="unknown_scan_error";assert(depIssues(checked).includes("receipt_input_event_invalid"));
    assert(stock(c,r,a));assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/);assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).reviewed_revision_consumed,1);
    const packet=path.join(owner.root,"cold.json");write(packet,{anchor:c.anchor,checkout:c.checkout,file:c.file,inputs:c.inputs,authority:c.authority,receipt:r});await child(["--cold",packet]);
    findings.push("real admission after settled ordinary failure, immutable replay refusal and fresh-process stock");
    c.prior=r;const completion=path.join(c.anchor,".augnes-local-verification/families",first.family_id,"completion-1.json");write(completion,{...read(completion),finished_at:time(-5000)});
    prepare(c,2);assert.throws(()=>proof(c),/revision_material_remedy_required/);
    const oldMetadata=clone(c.inputs.node.observation.metadata);c.inputs.node.observation.metadata.mtime_ns="2";prepare(c,2);assert.throws(()=>proof(c),/revision_material_remedy_required/);c.inputs.node.observation.metadata=oldMetadata;
    c.commit(4);prepare(c,2);
    for(const mutate of [q=>q.commission.ordinal=1,q=>q.authorization.grant_comment_id=12,q=>q.commission.root_family_id="0".repeat(64)]){const old=readFileSync(c.file),q=clone(c.proof);mutate(q);write(c.file,q);assert.throws(()=>proof(c),/revision_commission_lineage_invalid|revision_proof_invalid/);write(c.file,old);}
    p=proof(c);a=await auth(c,p);const second=begin(c,p,a),r2=receipt(c,second);storeReceipt(c,r2);finishAttempt(second,{receiptFingerprint:r2.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
    assert(stock(c,r2,a));assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).reviewed_revision_consumed,2);assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/);
    findings.push("materially corrected second admission; metadata-only/reset/changed-grant refusal; total two terminal");
    const spentFiles=[first,second].flatMap(a=>["attempt","completion"].map(kind=>path.join(c.anchor,".augnes-local-verification/families",a.family_id,kind+"-1.json")));
    // Synthetic fixture clock only; production never rewrites a completion.
    const spentCompletion=spentFiles[3];write(spentCompletion,{...read(spentCompletion),finished_at:time(-5000)});
    const spentHashes=spentFiles.map(f=>digest(readFileSync(f)));
    c.prior=r2;c.commit(5);c.newCommission=true;c.grantId=12;c.grantTime=time(-2000);prepare(c);
    p=proof(c);a=await auth(c,p);
    const savedNew=readFileSync(c.file);
    for(const mutate of [q=>q.authorization.grant_comment_id=11,q=>q.prior_attempt_id=first.attempt_id,q=>q.commission.ordinal=2]){
      const q=clone(c.proof);mutate(q);write(c.file,q);assert.throws(()=>proof(c));write(c.file,savedNew);
    }
    await assert.rejects(auth(c,p,(record,endpoint)=>{if(endpoint.includes("/comments/"))record.body="ordinary approval";return record;}));
    const third=begin(c,p,a),r3=receipt(c,third);storeReceipt(c,r3);finishAttempt(third,{receiptFingerprint:r3.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
    assert(stock(c,r3,a));assert.deepEqual(spentFiles.map(f=>digest(readFileSync(f))),spentHashes);
    const renewedTip=reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch});assert.equal(renewedTip.reviewed_revision_consumed,1);assert.deepEqual(renewedTip.revision_grants,[11,12]);
    const coldNew=path.join(owner.root,"cold-new.json");write(coldNew,{anchor:c.anchor,checkout:c.checkout,file:c.file,inputs:c.inputs,authority:c.authority,receipt:r3});await child(["--cold",coldNew]);
    assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/);
    const thirdCompletion=path.join(c.anchor,".augnes-local-verification/families",third.family_id,"completion-1.json");write(thirdCompletion,{...read(thirdCompletion),finished_at:time(-5000)});
    c.prior=r3;c.commit(6);prepare(c);assert.throws(()=>proof(c),/revision_commission_lineage_invalid/);
    prepare(c,2);p=proof(c);a=await auth(c,p);const fourth=begin(c,p,a),r4=receipt(c,fourth);storeReceipt(c,r4);finishAttempt(fourth,{receiptFingerprint:r4.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});assert(stock(c,r4,a));
    const fourthCompletion=path.join(c.anchor,".augnes-local-verification/families",fourth.family_id,"completion-1.json");write(fourthCompletion,{...read(fourthCompletion),finished_at:time(-5000)});
    c.prior=r4;c.commit(7);c.grantId=11;c.grantTime=time(-2000);prepare(c);p=proof(c);a=await auth(c,p);
    assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/,"an older consumed grant cannot be renewed after another commission");
    assert(!existsSync(path.join(path.dirname(fourthCompletion),"correction-successor.json")));
    findings.push("new authenticated commission follows spent latest tip; old consumption unchanged; fresh reconstruction, replay and in-commission reset refused");
    const inputRoot=path.join(owner.root,"input-only");mkdirSync(inputRoot);const inputCase=setup(inputRoot);
    try {
      prepare(inputCase);const q1=proof(inputCase),auth1=await auth(inputCase,q1),a1=begin(inputCase,q1,auth1),r1=receipt(inputCase,a1,"input_invalidation");storeReceipt(inputCase,r1);
      finishAttempt(a1,{receiptFingerprint:r1.integrity.content_fingerprint,disposition:"input_invalidation",cleanupComplete:true});assert(stock(inputCase,r1,auth1));
      const completed=path.join(inputCase.anchor,".augnes-local-verification/families",a1.family_id,"completion-1.json");write(completed,{...read(completed),finished_at:time(-5000)});
      inputCase.prior=r1;inputCase.inputs=clone(inputCase.inputs);inputCase.inputs.node.observation.sha256=digest("materially corrected node content");prepare(inputCase,2);
      const f=read(path.join(inputCase.artifacts,"focused.json"));f.implicated_paths=[];f.failed_phase=null;f.input_remedy_resources=["node-executable"];inputCase.proof.focused=artifact(inputCase,"focused.json",f);write(inputCase.file,inputCase.proof);
      const q2=proof(inputCase),auth2=await auth(inputCase,q2),a2=begin(inputCase,q2,auth2);assert.equal(a2.head,a1.head);assert.equal(a2.tree,a1.tree);
      const final=receipt(inputCase,a2,"completed_success");storeReceipt(inputCase,final);finishAttempt(a2,{receiptFingerprint:final.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});assert(stock(inputCase,final,auth2));
      findings.push("blocked known input invalidation preserves safety meaning and admits only materially corrected second runtime");
    } finally {releaseCheckoutVerificationOwnership(inputCase.owner,inputCase.checkout);}
    const dependencyRoot=path.join(owner.root,"dependency-remedy");mkdirSync(dependencyRoot);const dependencyCase=setup(dependencyRoot);
    try {
      prepare(dependencyCase);const q1=proof(dependencyCase),auth1=await auth(dependencyCase,q1),a1=begin(dependencyCase,q1,auth1),raw=receipt(dependencyCase,a1);
      const changed={...dep,content_sha256:digest("unexpected dependency mutation")},event={resource:"dependencies-root",classification:"execution",disposition:"input_invalidation",observed_at:time(-7000),monotonic_ns:"1",after:changed};event.identity=inputEventIdentity(event);
      const fault={resource:event.resource,disposition:event.disposition,observed_at:event.observed_at,monotonic_ns:event.monotonic_ns};
      raw.inputs.prepared_dependencies=[{phase_id:"dependencies-root",before:dep,after:clone(changed),unchanged:false,error:"dependency_input_input_invalidation"}];raw.inputs.events=[event];raw.inputs.first_fault=fault;raw.outcome={disposition:"input_invalidation",safety:"blocked",first_fault:fault};raw.phases.unshift({id:"dependencies-root",status:"pass"});
      const r1=finalizeReceipt(raw);storeReceipt(dependencyCase,r1);finishAttempt(a1,{receiptFingerprint:r1.integrity.content_fingerprint,disposition:"input_invalidation",cleanupComplete:true});assert(stock(dependencyCase,r1,auth1));
      const completed=path.join(dependencyCase.anchor,".augnes-local-verification/families",a1.family_id,"completion-1.json");write(completed,{...read(completed),finished_at:time(-5000)});dependencyCase.prior=r1;
      prepare(dependencyCase,2);assert.throws(()=>proof(dependencyCase),/revision_material_remedy_required/);dependencyCase.commit(4);
      const originalCompletion=read(completed);
      for(const mutate of [v=>v.inputs.prepared_dependencies[0].error=null,v=>v.inputs.prepared_dependencies[0].unchanged=true,v=>v.inputs.prepared_dependencies[0].after.content_sha256=digest("mismatched dependency result"),v=>v.inputs.events[0].after.permission_sha256=digest("unsafe permissions"),v=>v.inputs.events[0].disposition="unknown_relevance",v=>v.inputs.secondary_faults.push({...v.inputs.first_fault,disposition:"observer_failure"})]){
        const bad=clone(r1);mutate(bad);bad.inputs.events[0].identity=inputEventIdentity(bad.inputs.events[0]);dependencyCase.prior=finalizeReceipt(bad);write(completed,{...originalCompletion,receipt_fingerprint:dependencyCase.prior.integrity.content_fingerprint});prepare(dependencyCase,2);assert.throws(()=>proof(dependencyCase),/revision_predecessor_invalid/);
      }
      dependencyCase.prior=r1;write(completed,originalCompletion);prepare(dependencyCase,2);
      const f=read(path.join(dependencyCase.artifacts,"focused.json"));f.failed_phase=null;f.input_remedy_resources=["dependencies-root"];dependencyCase.proof.focused=artifact(dependencyCase,"focused.json",f);write(dependencyCase.file,dependencyCase.proof);
      const q2=proof(dependencyCase),auth2=await auth(dependencyCase,q2),a2=begin(dependencyCase,q2,auth2);assert.notEqual(a2.head,a1.head);assert.equal(a2.source_correction.inputs.identity_sha256,a1.source_correction.inputs.identity_sha256);
      const final=receipt(dependencyCase,a2,"completed_success");storeReceipt(dependencyCase,final);finishAttempt(a2,{receiptFingerprint:final.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});assert(stock(dependencyCase,final,auth2));
      findings.push("known dependency-content failure requires supported source correction; unsafe, unknown and observer faults refused");
      // A second, completed but blocked legacy-layout observation remains
      // safety_violation. Only fresh safe v2 preparation can support a NEW grant.
      const blocked=receipt(dependencyCase,a2),after={...dep,entries:dep.entries+1,layout_sha256:digest("added generated path"),permission_sha256:digest("path membership changed")};
      const blockedEvent={resource:"dependencies-root",classification:"execution",disposition:"safety_violation",observed_at:time(-7000),monotonic_ns:"2",after};blockedEvent.identity=inputEventIdentity(blockedEvent);
      const blockedFault={resource:blockedEvent.resource,disposition:blockedEvent.disposition,observed_at:blockedEvent.observed_at,monotonic_ns:blockedEvent.monotonic_ns};
      blocked.inputs.prepared_dependencies=[{phase_id:"dependencies-root",before:dep,after,unchanged:false,error:"dependency_input_safety_violation"}];
      blocked.inputs.events=[blockedEvent];blocked.inputs.first_fault=blockedFault;blocked.outcome={disposition:"safety_violation",safety:"blocked",first_fault:blockedFault};blocked.phases.unshift({id:"dependencies-root",status:"pass"});
      const historical=finalizeReceipt(blocked);storeReceipt(dependencyCase,historical);
      // Replace only this synthetic scenario's previously settled fixture record.
      const settled=path.join(dependencyCase.anchor,".augnes-local-verification/families",a2.family_id,"completion-1.json");
      write(settled,{...read(settled),receipt_fingerprint:historical.integrity.content_fingerprint,disposition:"safety_violation",finished_at:time(-5000)});
      dependencyCase.prior=historical;dependencyCase.newCommission=true;dependencyCase.grantId=12;dependencyCase.grantTime=time(-2000);
      write(path.join(dependencyCase.checkout,"scripts/local-canonical-inputs.mjs"),"export const correctedInputOwner = true;\n");dependencyCase.commit(5);
      write(path.join(dependencyCase.checkout,"package.json"),"{}\n");write(path.join(dependencyCase.checkout,"package-lock.json"),"{}\n");
      const installed=path.join(dependencyCase.checkout,"node_modules");mkdirSync(installed,{mode:0o755});write(path.join(installed,"fixture"),"installed output\n");
      prepare(dependencyCase);const focused=read(path.join(dependencyCase.artifacts,"focused.json"));focused.input_remedy_resources=["dependencies-root"];
      focused.implicated_paths.push("scripts/local-canonical-inputs.mjs");const inputBytes=readFileSync(path.join(dependencyCase.checkout,"scripts/local-canonical-inputs.mjs"));focused.source_files.push({path:"scripts/local-canonical-inputs.mjs",byte_size:inputBytes.length,sha256:digest(inputBytes)});
      dependencyCase.proof.focused=artifact(dependencyCase,"focused.json",focused);write(dependencyCase.file,dependencyCase.proof);
      assert.throws(()=>proof(dependencyCase),/revision_prospective_dependencies_required/);
      focused.prospective_dependencies=[observePreparedDependencyInputs({repositoryRoot:dependencyCase.checkout,phaseId:"dependencies-root"})];
      dependencyCase.proof.focused=artifact(dependencyCase,"focused.json",focused);write(dependencyCase.file,dependencyCase.proof);
      const q3=proof(dependencyCase),auth3=await auth(dependencyCase,q3),edge=path.join(path.dirname(settled),"correction-successor.json");
      const originalMode=statSync(installed).mode & 0o7777;
      chmodSync(installed,0o777);
      try { assert.throws(()=>begin(dependencyCase,q3,auth3),/dependency_input_entry_unsafe/); }
      finally { chmodSync(installed,originalMode); }
      assert(!existsSync(edge));
      renameSync(installed,installed+"-unavailable");assert.throws(()=>begin(dependencyCase,q3,auth3),{code:"ENOENT"});renameSync(installed+"-unavailable",installed);assert(!existsSync(edge));
      const newAttempt=begin(dependencyCase,q3,auth3),newReceipt=receipt(dependencyCase,newAttempt,"completed_success");storeReceipt(dependencyCase,newReceipt);finishAttempt(newAttempt,{receiptFingerprint:newReceipt.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});assert(stock(dependencyCase,newReceipt,auth3));
      assert.equal(historical.outcome.safety,"blocked");assert.equal(read(settled).receipt_fingerprint,historical.integrity.content_fingerprint);
      findings.push("blocked historical layout/security remains blocked; new commission requires corrected owner and live safe preparation; unavailable/current unsafe inputs refuse before reservation");

    } finally {releaseCheckoutVerificationOwnership(dependencyCase.owner,dependencyCase.checkout);}
    releaseCheckoutVerificationOwnership(c.owner,c.checkout);c.owner=null;
    const raceRoot=path.join(owner.root,"race");mkdirSync(raceRoot);const race=setup(raceRoot);prepare(race);releaseCheckoutVerificationOwnership(race.owner,race.checkout);race.owner=null;
    const go=path.join(raceRoot,"go"),packets=[],ready=[];
    for(let i=0;i<2;i++){const checkout=path.join(raceRoot,"consumer-"+i);cpSync(race.checkout,checkout,{recursive:true});const file=path.join(raceRoot,"packet-"+i+".json"),readyFile=path.join(raceRoot,"ready-"+i);ready.push(readyFile);write(file,{anchor:race.anchor,checkout,file:path.join(checkout,path.relative(race.checkout,race.file)),inputs:race.inputs,authority:race.authority,ready:readyFile,go});packets.push(file);}
    let output="";const jobs=packets.map(file=>child(["--race",file],{stdout:{write(chunk){output+=chunk;}}}));const until=Date.now()+8000;while(!ready.every(existsSync)&&Date.now()<until)await new Promise(r=>setTimeout(r,5));assert(ready.every(existsSync));write(go,"go");await Promise.all(jobs);
    assert.equal(output.split("\n").filter(l=>l==="admitted").length,1);assert.equal(output.split("\n").filter(l=>l==="refused").length,1);
    const tip=reconstructAttemptTip({anchorRoot:race.anchor,branch:race.branch});rmSync(path.join(race.anchor,".augnes-local-verification/families",tip.family_id,"attempt-1.json"));
    assert.throws(()=>reconstructAttemptTip({anchorRoot:race.anchor,branch:race.branch}),{code:"ENOENT"});assert(existsSync(path.join(race.legacyRoot,"correction-successor.json")));
    findings.push("actual concurrent exclusive admission; orphaned interrupted edge remains consumed");
    console.log(JSON.stringify({reviewed_revision_controls:findings,synthetic_only:true}));
  }finally{if(c.owner)releaseCheckoutVerificationOwnership(c.owner,c.checkout);settleCanonicalTestResourceUse(owner,{exit_observed:liveChildren+lifecycle.pendingChildren===0,streams_closed:liveChildren+lifecycle.pendingChildren===0,cleanup_completed:liveChildren+lifecycle.pendingChildren===0,remaining_owned_processes:liveChildren+lifecycle.pendingChildren});assert(cleanupCanonicalTestResources([owner])[0].completed);}
} else {
  throw new Error("unsupported reviewed revision fixture selector");
}
