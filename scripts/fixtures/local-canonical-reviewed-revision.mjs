// Synthetic fixture only: production proof, authority, edge and fresh reader.
import assert from "node:assert/strict";
import {chmodSync,cpSync,existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {digest,inputEventIdentity,observePreparedDependencyInputs} from "../local-canonical-inputs.mjs";
import {beginAttempt,finishAttempt,readSourceCorrectionProof,inspectAttemptRecords,reconstructAttemptTip,authorizeReviewedRevision,reviewedRevisionAuthorityObservation,validReviewedRevisionAttempt} from "../local-canonical-attempts.mjs";
import {acquireCheckoutVerificationOwnership,releaseCheckoutVerificationOwnership} from "../local-canonical-checkout-ownership.mjs";
import {createGitHubObserverAuthorizationTransport} from "../github-main-branch-transport.mjs";
import {createCanonicalTestResourceRoot,beginCanonicalTestResourceUse,settleCanonicalTestResourceUse,cleanupCanonicalTestResources,buildCanonicalChildEnvironment} from "../canonical-test-environment.mjs";
import {runCanonicalChild} from "../canonical-child-runner.mjs";
import {finalizeReceipt,inspectReceiptForDecision} from "../local-canonical-receipt.mjs";
import {createPrivateReviewExport,inspectPrivateReviewExport} from "../local-canonical-review-export.mjs";
import {baseReceipt} from "./local-canonical-receipt-v3.mjs";

const self=fileURLToPath(import.meta.url), quiet={write(){}}, clone=v=>structuredClone(v);
const write=(f,v)=>{mkdirSync(path.dirname(f),{recursive:true,mode:0o700});writeFileSync(f,typeof v==="string"||Buffer.isBuffer(v)?v:JSON.stringify(v),{mode:0o600});};
const read=f=>JSON.parse(readFileSync(f,"utf8")), time=n=>new Date(Date.now()+n).toISOString();
const family=(b,p)=>digest(["augnes.local-canonical-attempt-family.v1","hynk-studio/augnes",b,...(p?["verified_source_correction",p.prior_attempt_id,p.head,p.tree]:[])]);
const transport=(c,mutate=v=>v)=>createGitHubObserverAuthorizationTransport(999,{runner:async request=>{
  assert.equal(request.operation,"fetch_browser_authority");assert(request.args.includes("GET")); const e=request.args[1];
  return mutate(clone(e.includes("/reviews/")?c.authority.review:e.includes("/comments/")?c.authority.grant:e.endsWith("/pulls/999")?c.authority.pr:{permission:"admin",user:{login:"synthetic-fixture"}}),e);
}});
const proof=c=>readSourceCorrectionProof(c.file,c.checkout);
const auth=(c,p,mutate)=>authorizeReviewedRevision(p,{transport:transport(c,mutate)});
const begin=(c,p,a,extra={})=>beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:p.branch,head:p.head,tree:p.tree,acceptedMain:p.base,runId:"revision-"+p.commission.ordinal,contractFingerprint:digest("contract"),sourceCorrection:p,revisionAuthorization:a,revisionInputs:c.inputs,...extra});
const stock=(c,r,a)=>inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,revisionAuthorization:a,revisionInputs:c.inputs});
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
function setup(root){
  const c={checkout:path.join(root,"checkout"),anchor:path.join(root,"anchor"),branch:"codex/reviewed-revision",root};
  mkdirSync(c.checkout);mkdirSync(c.anchor);c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});c.env=buildCanonicalChildEnvironment({temporaryRoot:root});
  c.git=args=>execFileSync("git",args,{cwd:c.checkout,env:c.env,timeout:5000,maxBuffer:1024*1024,stdio:["ignore","pipe","pipe"]});
  c.commit=value=>{write(path.join(c.checkout,"scripts/fixture.mjs"),"export const value="+value+";\n");c.git(["add","scripts"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","value "+value]);return c.git(["rev-parse","HEAD"]).toString().trim();};
  c.git(["init","--quiet","-b",c.branch]);c.base=c.commit(1);c.baseTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.inputs={contract:"augnes.local-canonical-runtime-inputs.v1",node:{location_fingerprint:digest("current-node"),observation:{present:true,sha256:digest("node"),metadata:{mode:"33261",uid:"1",gid:"1",device:"1",inode:"1",links:"1",bytes:"4",mtime_ns:"1",ctime_ns:"1"},permission_identity:digest("node permissions"),executable_identity_policy:"shared-posix-v1"}},
    headers:{location_fingerprint:digest("headers"),observation:{contract:"augnes.local-canonical-node-headers.v1",present:true,location_fingerprint:digest("headers"),inventory_sha256:digest("inventory"),content_sha256:digest("content"),permission_sha256:digest("permissions"),entries:2,bytes:10}}};
  const a=beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:c.base,tree:c.baseTree,runId:"root-failure",contractFingerprint:digest("root")});
  const r=receipt(c,a);storeReceipt(c,r);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  const p={schema:"augnes.local-canonical-source-correction.v3",kind:"observer_repair",head:c.base,tree:c.baseTree,prior_family_id:a.family_id,prior_number:1,prior_attempt_id:a.attempt_id,prior_receipt_fingerprint:r.integrity.content_fingerprint,repair:{},authorization:{}}, observations={};
  for(const [i,role] of ["accepted_repair","independent_review","execution_grant"].entries()){
    const o={id:i+1,author:"synthetic-fixture",author_id:1,body_sha256:digest(role),timestamp:time(-90000),role};observations[role]=o;
    if(i===0)p.repair.review={id:o.id,sha256:digest(o)};else if(i===1)Object.assign(p.authorization,{review_id:o.id,review_sha256:digest(o)});else Object.assign(p.authorization,{grant_comment_id:o.id,grant_sha256:digest(o)});
  }
  const terminal={...a,family_id:family(c.branch,p),attempt_id:"terminal-legacy",number:1,source_correction:p,observer_authority:observations,recovery:null,budget:{initial:1,recovery:0}};
  c.legacyRoot=path.join(c.anchor,".augnes-local-verification/families",terminal.family_id);
  write(path.join(c.anchor,".augnes-local-verification/families",a.family_id,"correction-successor.json"),{contract:"augnes.local-canonical-successor.v2",kind:"observer_repair",family_id:terminal.family_id,head:terminal.head,tree:terminal.tree,proof_fingerprint:digest(p)});
  write(path.join(c.legacyRoot,"attempt-1.json"),terminal);c.prior=receipt(c,terminal);storeReceipt(c,c.prior);
  write(path.join(c.legacyRoot,"completion-1.json"),{contract:a.contract,attempt_id:terminal.attempt_id,receipt_fingerprint:c.prior.integrity.content_fingerprint,disposition:"product_failure",cleanup_complete:true,finished_at:time(-60000)});
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).observer_repair_consumed,true);
  c.acceptedHead=c.commit(2);c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();c.commit(3);
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
    inputs:{predecessor_sha256:prior.source_correction.schema.endsWith(".v7")?prior.source_correction.inputs.identity_sha256:digest(c.prior.inputs.resources),identity_sha256:digest(c.inputs),current:artifact(c,"runtime-inputs.json",c.inputs)},
    source:artifact(c,"source.json",{schema:"augnes.local-canonical-reviewed-revision-source.v1",basis:"implementation_owner_not_independent_review",reviewed_at:time(-1000),accepted_to_final:delta(c.acceptedHead,c.head),predecessor_to_final:delta(prior.head,c.head),main_to_final:delta(c.base,c.head)})};
  const bytes=c.git(["show",c.head+":scripts/fixture.mjs"]);
  p.focused=artifact(c,"focused.json",{schema:"augnes.local-canonical-reviewed-revision-focused.v1",basis:"implementation_owner_not_independent_review",predecessor_receipt_fingerprint:p.prior_receipt_fingerprint,runtime_inputs_sha256:p.inputs.identity_sha256,finished_at:time(-1000),
    remedy:"Synthetic behavioral correction with exact retained command evidence",implicated_paths:["scripts/fixture.mjs"],source_files:[{path:"scripts/fixture.mjs",byte_size:bytes.length,sha256:digest(bytes)}],
    commands:[{command:"synthetic behavior control",result:natural,record:artifact(c,"command-result.json",natural),stdout:artifact(c,"command-stdout.log","synthetic PASS\n")}],
    ...(prior.source_correction.schema.endsWith(".v7")?{failed_phase:"integration",diagnosis:"Synthetic predecessor fixture returned demonstrated incorrect value"}:{})});
  const user={login:"synthetic-fixture",id:1,type:"User"},review={id:10,user,author_association:"OWNER",state:"COMMENTED",commit_id:c.acceptedHead,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:c.reviewTime??=time(-45000),body:"ACCEPT / RETAIN "+c.acceptedHead+" "+c.acceptedTree+" "+c.base};
  const grant={id:c.grantId??11,user,author_association:"OWNER",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999",updated_at:c.grantTime??=time(-30000),body:c.newCommission?c.branch+" historical acceptance "+review.id+" "+p.commission.root_receipt_fingerprint+" NEW commission; existing v7 reviewed_revision; old commission remains spent; at most two admitted deciding invocations total; demonstrated material correction with relevant focused support; zero unchanged-target retry and zero extra recovery; Reservation/interruption consumes; separate fresh-process stock; independent audit. Preserve the original safety_violation / blocked receipt; clean prospective dependency preparation and current safety checks.":c.acceptedHead+" "+c.acceptedTree+" "+c.branch+" https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10 reviewed source/execution-input revision; two admitted deciding invocations for this entire commission; materially corrected after focused checks; zero unchanged-target retry; no additional recovery allowance; Interrupted reservations consume; separate fresh-process stock; independent audit."};
  p.accepted.review={id:10,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  c.proof=p;c.authority={review,grant,pr:{number:999,state:"open",draft:true,merged:false,auto_merge:null,head:{sha:c.head,ref:c.branch,repo:{full_name:"hynk-studio/augnes"}},base:{sha:c.base,ref:"main",repo:{full_name:"hynk-studio/augnes"}}}};write(c.file,p);
}
if(process.argv[2]==="--cold"){
  const c=read(process.argv[3]),p=proof(c),a=await auth(c,p);assert(stock(c,c.receipt,a));console.log("fresh reader PASS");
}else if(process.argv[2]==="--race"){
  const c=read(process.argv[3]);c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
  try{const p=proof(c),a=await auth(c,p);write(c.ready,"ready");while(!existsSync(c.go))await new Promise(r=>setTimeout(r,5));
    try{begin(c,p,a);console.log("admitted");}catch(e){assert(["EEXIST","ENOENT","attempt_latest_tip_required"].includes(e.code),e.message);console.log("refused");}
  }finally{releaseCheckoutVerificationOwnership(c.owner,c.checkout);}
}else if(process.argv[2]==="--run-revision-fixtures"){
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");beginCanonicalTestResourceUse(owner);const c=setup(owner.root), findings=[];let liveChildren=0;
  const child=async(args,options={})=>{liveChildren++;const r=await runCanonicalChild({command:process.execPath,args:[self,...args],cwd:c.checkout,env:c.env,suite:"reviewed-revision",label:"fresh synthetic consumer",timeoutMs:10000,stdout:quiet,stderr:process.stderr,...options});assert(r.exit_observed&&r.streams_closed&&r.cleanup_completed&&r.remaining_owned_processes===0);liveChildren--;assert.equal(r.exit_code,0);return r;};
  try{
    prepare(c);let p=proof(c),a=await auth(c,p);
    assert.throws(()=>begin(c,p,{observations:a.observations}),/revision_authenticated_authority_required/);
    assert.throws(()=>begin(c,p,a,{revisionInputs:{...c.inputs,unknown:true}}),/revision_authenticated_authority_required/);
    for(const mutate of [r=>r.body="generic approval",r=>r.user.id=2,r=>r.author_association="NONE",r=>r.commit_id=c.base])await assert.rejects(auth(c,p,(r,e)=>{if(e.includes("/reviews/"))mutate(r);return r;}));
    const original=readFileSync(c.file);
    for(const mutate of [q=>q.prior_attempt_id="older",q=>q.tree="0".repeat(40),q=>q.inputs.identity_sha256="0".repeat(64),q=>q.commission.ordinal=2]){
      const q=clone(c.proof);mutate(q);write(c.file,q);assert.throws(()=>proof(c));write(c.file,original);
    }
    findings.push("wrong authority/source/input/predecessor/ordinal and forged-capability refusals");
    p=proof(c);a=await auth(c,p);const first=begin(c,p,a),r=receipt(c,first);assert(validReviewedRevisionAttempt(first));storeReceipt(c,r);finishAttempt(first,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
    const exportable=finalizeReceipt({...clone(baseReceipt),...r,inputs:{...r.inputs,events:[],limitations:[],first_fault:null},final:{result:"failure",exit_status:1,reason_codes:["phase_failed"]}});
    const exported=createPrivateReviewExport(exportable);assert(inspectPrivateReviewExport(exported).structurally_valid);assert(validReviewedRevisionAttempt(exported.attempt));
    assert.equal(JSON.stringify(exported).includes(c.artifacts),false);assert.equal(exported.attempt.source_correction.inputs.current.artifact,undefined);
    const malformed=clone(exportable);malformed.attempt.source_correction.commission.ordinal=3;
    assert.throws(()=>createPrivateReviewExport(finalizeReceipt(malformed)),/review_export_revision_invalid/);
    const dep={contract:"augnes.local-canonical-prepared-dependencies.v1",phase_id:"dependencies-root",location_fingerprint:digest("deps"),sources:[{name:"package.json",sha256:digest("package"),bytes:2},{name:"package-lock.json",sha256:baseReceipt.dependencies.root_lock_sha256,bytes:2}],entries:1,bytes:4,layout_sha256:digest("layout"),content_sha256:digest("contents"),permission_sha256:digest("permissions"),generated_cache:"proven_empty"};
    const checked=clone(exportable);checked.phases=[{...baseReceipt.phases[0],id:"dependencies-root",status:"pass"}];checked.inputs.prepared_dependencies=[{phase_id:"dependencies-root",before:dep,after:{...dep,generated_cache:"absent_or_binding"},unchanged:true,error:null}];
    const depIssues=value=>inspectReceiptForDecision(finalizeReceipt(value)).issues;
    assert(!depIssues(checked).includes("receipt_prepared_dependency_inputs_invalid"));
    for(const mutate of [v=>v.inputs.prepared_dependencies=[],v=>v.inputs.prepared_dependencies.push(clone(v.inputs.prepared_dependencies[0])),v=>v.inputs.prepared_dependencies[0].after=null,v=>v.inputs.prepared_dependencies[0].error="observer_failure",v=>v.inputs.prepared_dependencies[0].after.content_sha256=digest("different"),v=>v.phases[0].status="not_run"]){const v=clone(checked);mutate(v);assert(depIssues(v).includes("receipt_prepared_dependency_inputs_invalid"));}
    const event={resource:"dependencies-root",classification:"execution",disposition:"input_invalidation",observed_at:time(-1000),monotonic_ns:"1",after:{...dep,content_sha256:digest("mutated contents")}};event.identity=inputEventIdentity(event);
    checked.inputs.events=[event];assert(!depIssues(checked).includes("receipt_input_event_invalid"));checked.inputs.events[0].identity=digest("wrong event");assert(depIssues(checked).includes("receipt_input_event_invalid"));
    const unsafeEvent={...event,disposition:"safety_violation",after:null};unsafeEvent.identity=inputEventIdentity(unsafeEvent);checked.inputs.events=[unsafeEvent];checked.inputs.prepared_dependencies[0].error="dependency_input_link_escape";
    assert(!depIssues(checked).includes("receipt_input_event_invalid"));checked.inputs.prepared_dependencies[0].error="unknown_scan_error";assert(depIssues(checked).includes("receipt_input_event_invalid"));
    assert(stock(c,r,a));assert.throws(()=>begin(c,p,a),/attempt_latest_tip_required/);assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,branch:c.branch}).reviewed_revision_consumed,1);
    const packet=path.join(owner.root,"cold.json");write(packet,{anchor:c.anchor,checkout:c.checkout,file:c.file,inputs:c.inputs,authority:c.authority,receipt:r});await child(["--cold",packet]);
    findings.push("real admission after terminal legacy, immutable replay refusal and fresh-process stock");
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
      chmodSync(installed,0o777);assert.throws(()=>begin(dependencyCase,q3,auth3),/dependency_input_entry_unsafe/);chmodSync(installed,0o755);assert(!existsSync(edge));
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
  }finally{if(c.owner)releaseCheckoutVerificationOwnership(c.owner,c.checkout);settleCanonicalTestResourceUse(owner,{exit_observed:liveChildren===0,streams_closed:liveChildren===0,cleanup_completed:liveChildren===0,remaining_owned_processes:liveChildren});assert(cleanupCanonicalTestResources([owner])[0].completed);}
}
