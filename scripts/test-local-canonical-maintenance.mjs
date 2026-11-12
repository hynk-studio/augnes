import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { beginAttempt, finishAttempt, prepareAttemptDependencies, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof, supportsSourceCorrection, maintenanceMaterial, prepareMaintenanceCandidate } from "./local-canonical-attempts.mjs";
import { authorizeMaintenance, assertMaintenanceAuthorization, validateMaintenanceAuthorityRecords, maintenanceAuthorityObservation, MAINTENANCE_GRANT, validMaintenanceAttempt, observeMaintenanceSetup, maintenanceFaults } from "./local-canonical-maintenance.mjs";
import { readStockMachineIdentity, inspectMaintenanceStock } from "./run-local-canonical-verification.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "./local-canonical-review-export.mjs";
import { canonicalSerialize, finalizeReceipt, inspectReceiptForDecision, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { createMaintenanceFixture } from "./fixtures/local-canonical-maintenance.mjs";
import { completeSyntheticReceipt, write } from "./fixtures/local-canonical-improvement.mjs";
import { digest, observePreparedDependencyInputs, freezeInputContract } from "./local-canonical-inputs.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// This owner uses isolated synthetic authority and accounting only. It never
// obtains real GitHub authority or opens the operator's physical ledger.
const resource=createCanonicalTestResourceRoot("ag-resource-test-"),env=buildCanonicalChildEnvironment({temporaryRoot:resource.root});
const cases=[],refusals=[];
let c;
const note=name=>{cases.push({name,status:"pass"});console.log(JSON.stringify(cases.at(-1)));};
const material=()=>maintenanceMaterial(c.checkout,c.proof);
const reserve=async extra=>beginAttempt({...c.request(),runId:"maintenance",observeRevision:async()=>({authorization:await authorizeMaintenance(c.proof,material(),c.transport()),live:null}),...extra});
const dependencyLocations=[["dependencies-root",""],["dependencies-nested","apps/augnes_apps"],["dependencies-web-planning","apps/web_planning"]];
const npmCli=fs.realpathSync(path.resolve(path.dirname(process.execPath),process.platform==="win32"?"node_modules/npm/bin/npm-cli.js":"../lib/node_modules/npm/bin/npm-cli.js"));
async function child(label,command,args,cwd) {
  const scope=createCanonicalTestResourceRoot("ag-resource-test-"),env=buildCanonicalChildEnvironment({temporaryRoot:scope.root});
  let settled=false;
  try{
    const result=await runCanonicalChild({suite:"maintenance-setup",label,command,args,cwd,env,resourceOwner:scope,timeoutMs:10000,stdout:process.stdout,stderr:process.stderr,log(){}});
    settled=result.cleanup_completed&&result.streams_closed&&result.remaining_owned_processes===0;
    assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true,requireCompleteCleanup:true,timeoutMs:10000}),null);
  }finally{assert(settled,"setup child must settle before cleanup");assert(cleanupCanonicalTestResources([scope]).every(x=>x.completed));}
}
async function install(root,phase) {
  const location=dependencyLocations.find(x=>x[0]===phase)[1];
  await child(phase,process.execPath,[npmCli,"ci","--offline","--no-audit","--no-fund"],path.join(root,location));
}
async function prepareTrees(fixture) {
  // Offline fixed tarball and real npm ci. No installed repository dependencies
  // are copied, chmodded or reinstalled, and no attempt capability is needed.
  const source=path.join(resource.root,"package-source"),archive=path.join(resource.root,"fixture.tgz");
  write(path.join(source,"package/package.json"),{name:"fixture",version:"1.0.0"});write(path.join(source,"package/index.js"),"export const value=1;\n");
  await child("pack-fixed-input","tar",["-czf",archive,"-C",source,"package"],resource.root);
  const bytes=fs.readFileSync(archive),integrity="sha512-"+createHash("sha512").update(bytes).digest("base64"),records=[];
  for(const [phase,relative]of dependencyLocations){
    const root=path.join(fixture.checkout,relative),dependencies={fixture:"file:fixture.tgz"};
    write(path.join(root,"fixture.tgz"),bytes);write(path.join(root,"package.json"),{name:"consumer",version:"1.0.0",dependencies});
    write(path.join(root,"package-lock.json"),{name:"consumer",version:"1.0.0",lockfileVersion:3,requires:true,packages:{"":{name:"consumer",version:"1.0.0",dependencies},"node_modules/fixture":{version:"1.0.0",resolved:"file:fixture.tgz",integrity}}});
    await install(fixture.checkout,phase);
    const before=observePreparedDependencyInputs({repositoryRoot:fixture.checkout,phaseId:phase});
    records.push({phase_id:phase,before,after:before,unchanged:true,error:null});
  }
  return records;
}
function snapshot(folder) {
  const files=new Map();
  const walk=(p,r="")=>{for(const d of fs.readdirSync(p,{withFileTypes:true})){const n=path.join(r,d.name);if(d.isDirectory())walk(path.join(p,d.name),n);else files.set(n,fs.readFileSync(path.join(p,d.name)));}};
  walk(folder);return()=>{fs.rmSync(folder,{recursive:true,force:true});fs.mkdirSync(folder,{mode:0o700});for(const [name,bytes]of files)write(path.join(folder,name),bytes);};
}
async function isolated(fn) {
  const saved=structuredClone({p:c.p,e:c.e,r:c.r,w:c.w,history:c.history,proof:c.proof,records:c.records,a:c.a,g:c.g});
  const artifacts=snapshot(c.folder),ledger=snapshot(path.join(c.anchor,".augnes-local-verification/families"));
  try{return await fn();}finally{artifacts();ledger();Object.assign(c,saved);}
}
async function refuses(name,mutate,{rebuild=true,admit=false}={}) {
  await isolated(async()=>{
    let error;try{await mutate();if(rebuild)c.proof=c.rebuild();if(admit)await reserve();else material();}catch(e){error=e;}
    assert(error,name);refusals.push({name,code:error.code??error.message});
    assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")),name+" has no reservation");
  });
}
const linked=(a,disposition="product_failure",cleanup=true)=>finalizeReceipt({receipt_version:4,repository:{branch:c.branch,base_sha:c.base,head_sha:a.head,tree_sha:a.tree},run:{id:a.attempt_id},attempt:a,outcome:{disposition},cleanup:{completed:cleanup}});
// Rebinding below is restricted to isolated synthetic copies. Real provider
// bytes and observation hashes must never be rewritten to satisfy validation.
function rebindSyntheticRecords(proof,records) {
  const grant=JSON.parse(records.grant.body.slice(MAINTENANCE_GRANT.length+1));
  grant.acceptance_sha256=digest(maintenanceAuthorityObservation(records.acceptance,"accepted_maintenance"));
  records.grant.body=MAINTENANCE_GRANT+"\n"+canonicalSerialize(grant);
  proof.authorization.acceptance_review_sha256=grant.acceptance_sha256;
  proof.authorization.grant_comment_sha256=digest(maintenanceAuthorityObservation(records.grant,"prospective_grant"));
}
function authorityTimestampControls() {
  const evidence=material(),base=structuredClone({proof:c.proof,records:c.records});
  const second=Math.floor(Date.parse(base.records.acceptance.submitted_at)/1000)*1000;
  const at=ms=>new Date(second+ms).toISOString(),seconds=ms=>at(ms).replace(/\.000Z$/u,"Z");
  let positive=0,negative=0;
  const check=(name,acceptance,grant,pass)=>{
    const {proof,records}=structuredClone(base);
    records.acceptance.submitted_at=acceptance;records.grant.created_at=grant;records.grant.updated_at=grant;
    rebindSyntheticRecords(proof,records);
    const before=canonicalSerialize({proof,records,evidence});
    if(pass){
      const observations=validateMaintenanceAuthorityRecords(proof,evidence,records);
      assert.equal(observations.accepted_maintenance.timestamp,acceptance);
      assert.equal(observations.prospective_grant.timestamp,grant);
      assert.equal(digest(observations.accepted_maintenance),proof.authorization.acceptance_review_sha256);
      assert.equal(digest(observations.prospective_grant),proof.authorization.grant_comment_sha256);
      assert.throws(()=>assertMaintenanceAuthorization(proof,evidence,{records,observations}),/authenticated_capability_required/);
      assert(validMaintenanceAttempt({source_correction:proof,head:proof.head,number:1,budget:{initial:1,recovery:0},recovery:null,prior_attempt_id:null,prior_receipt_fingerprint:null,maintenance_authority:{records,observations}}));
      positive++;
    }else{assert.throws(()=>validateMaintenanceAuthorityRecords(proof,evidence,records),/maintenance_authenticated_record_invalid/,name);negative++;}
    assert.equal(canonicalSerialize({proof,records,evidence}),before,name+" preserves raw identity");
    assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")),name+" cannot reserve");
  };
  for(const [name,a,g]of [["seconds",seconds(0),seconds(1000)],["milliseconds",at(123),at(1456)],["seconds then later milliseconds",seconds(0),at(1001)],["milliseconds then later seconds",at(999),seconds(1000)],["precise same-second order",at(123),at(124)]])check(name,a,g,true);
  for(const [name,a,g]of [["equal seconds",seconds(0),seconds(0)],["equal instants in different forms",seconds(0),at(0)],["ambiguous same-second precision",seconds(0),at(999)],["reversed mixed precision",at(123),seconds(0)],["reversed milliseconds",at(124),at(123)],["equal milliseconds",at(123),at(123)]])check(name,a,g,false);
  const malformed=[null,42,"",at(0)+" "," "+at(0),at(0).slice(0,10),at(0).replace("T","t"),at(0).replace("Z","z"),at(0).replace("Z","+00:00"),at(0).replace(".000Z",".0Z"),at(0).replace(".000Z",".0000Z"),"2026-02-30T02:55:21Z","2025-02-29T02:55:21.000Z","2026-13-12T02:55:21Z","2026-11-12T24:00:00Z","2026-11-12T02:60:00Z","2026-11-12T02:55:60Z","2099-01-01T00:00:00Z","2099-01-01T00:00:00.001Z"];
  const stored={source_correction:base.proof,head:base.proof.head,number:1,budget:{initial:1,recovery:0},recovery:null,prior_attempt_id:null,prior_receipt_fingerprint:null,
    maintenance_authority:{records:base.records,observations:validateMaintenanceAuthorityRecords(base.proof,evidence,base.records)}};
  assert(validMaintenanceAttempt(stored));
  for(const value of malformed){
    check("invalid acceptance "+JSON.stringify(value),value,at(1000),false);check("invalid grant "+JSON.stringify(value),at(0),value,false);
    // The stored-observation consumer has no chronology comparison to mask an
    // impossible calendar or future timestamp. Exercise each role independently.
    for(const role of ["accepted_maintenance","prospective_grant"]){const bad=structuredClone(stored);bad.maintenance_authority.observations[role].timestamp=value;assert.equal(validMaintenanceAttempt(bad),false);}
  }
  for(const value of ["2024-02-29T02:55:21Z","2024-02-29T02:55:21.123Z"]){const leap=structuredClone(stored);leap.maintenance_authority.observations.accepted_maintenance.timestamp=value;assert(validMaintenanceAttempt(leap));}
  const {proof,records}=structuredClone(base),before=canonicalSerialize(records);
  records.acceptance.submitted_at=records.acceptance.submitted_at.replace(/\.\d{3}Z$/u,"Z");
  assert.throws(()=>validateMaintenanceAuthorityRecords(proof,evidence,records),/maintenance_(authority_scope|authenticated_record)_invalid/);
  assert.notEqual(canonicalSerialize(records),before,"raw formatting changes are digest-visible");
  note(`external authority UTC formats and chronology: ${positive} valid, ${negative} refusals; raw identity preserved and no capability/reservation`);
}
try {
  c=await createMaintenanceFixture(resource.root,env,prepareTrees);
  authorityTimestampControls();
  const mixed=structuredClone(c.terminalReceipt);
  mixed.inputs.events.push({disposition:"ambient_observation"},{disposition:"incidental_executable_metadata"},{disposition:"unchanged"});
  assert.deepEqual(maintenanceFaults(mixed),maintenanceFaults(c.terminalReceipt));
  note("benign retained observations impose no invented repair; actual failures and safety faults remain required");
  const terminalBytes=fs.readFileSync(path.join(c.priorRoot,"attempt-1.json"));
  await isolated(async()=>{
    c.proof=c.rebuild(false);
    const result=prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:c.proof});
    assert.equal(result.eligible_evidence,true);assert.equal(result.live_inputs_ready,true);assert.equal(result.reserved,false);
    assert.deepEqual(result.missing,["authenticated_candidate_acceptance","prospective_maintenance_commission"]);
    assert.throws(()=>readSourceCorrectionProof(c.file,c.checkout));assert.throws(()=>beginAttempt(c.request()));
  });note("non-reserving preparation accepts null future authority but cannot admit");
  await isolated(async()=>{
    const inputs=freezeInputContract({resources:[{id:"fixed-manifest",file:path.join(c.checkout,"package.json"),classification:"execution"}],pathKind:"isolated-model-free-v1",binding:{runtime_inputs:c.inputs}});
    assert.throws(()=>prepareAttemptDependencies({}, {repositoryRoot:c.checkout,inputs,phaseId:"dependencies-root"}),/owner_invalid/);
    const a=await reserve({inputContract:inputs,contractFingerprint:inputs.snapshot().fingerprint});
    for(const [phase]of dependencyLocations){await install(c.checkout,phase);prepareAttemptDependencies(a,{repositoryRoot:c.checkout,inputs,phaseId:phase});}
    assert.equal(inputs.checkPreparedDependencies(),null);
    assert(inputs.snapshot().prepared_dependencies.every(x=>x.prerequisite&&x.unchanged));
    const r=linked(a);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  });note("real offline npm ci before admission, then existing capability-owned post-install preparation and protected reread; no circular setup gate");
  await isolated(async()=>{
    const a=await reserve();assert(validMaintenanceAttempt(a));assert.deepEqual(a.budget,{initial:1,recovery:0});
    const r=linked(a);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:r.outcome.disposition,cleanupComplete:true});
    assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r}));
    assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).maintenance_consumed,true);
    assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:c.terminalReceipt}));
    assert.deepEqual(fs.readFileSync(path.join(c.priorRoot,"attempt-1.json")),terminalBytes);
    for(const proof of [c.proof,{...c.proof,kind:"source_revision"},{...c.proof,kind:"verifier_correction"},{...c.proof,schema:"augnes.local-canonical-source-correction.v1"},null])await assert.rejects(async()=>beginAttempt({...c.request(),sourceCorrection:proof}));
  });note("real evidence/admission/exclusive edge/settlement path; terminal predecessor remains immutable and readable");
  for(const proof of [{...c.p,schema:"unknown"},{...c.p,kind:"source_revision",maintenance_authority:{}},{...c.p,kind:"verifier_correction",evidence_kind:"prospective_maintenance"}])assert.equal(supportsSourceCorrection(proof),false);
  await assert.rejects(async()=>beginAttempt({...c.request(),recoveryProof:c.proof}));
  await refuses("unchanged target",()=>{c.p.head=c.terminal.head;c.p.tree=c.terminal.tree;});
  await refuses("missing substantive repair judgment",()=>c.r.judgments.substantive_repairs=false);
  await refuses("undeclared test-only repair path",()=>c.e.repairs[0].source_module="scripts/test-only.mjs");
  await refuses("incomplete repair",()=>c.e.repairs[0].addresses.pop());
  await refuses("complete delta omission",()=>c.e.source.changed_paths.pop());
  note("unchanged target, absent substantive review, unbound path, incomplete repairs and route fallback refuse");
  await refuses("adverse evidence omitted",()=>c.history.observations=[]);
  await refuses("known index mismatch",()=>c.history.observations[0].limitations="edited limitation");
  await refuses("UNKNOWN relabeled",()=>c.history.historical_causes="timeout_repaired");
  await refuses("spent history detached",()=>c.history.parent_evidence_sha256="a".repeat(64));
  note("adverse evidence, parent commitment and UNKNOWN attribution cannot be omitted or relabeled");
  await refuses("wrong source binding",()=>c.w[0].source_sha256="a".repeat(64));
  await refuses("wrong driver binding",()=>c.w[1].fixture_sha256="a".repeat(64));
  await refuses("runtime binding drift",()=>c.w[1].end_binding.environment_fingerprint="a".repeat(64));
  await refuses("retrospective witness",()=>c.w[0].started_at=JSON.parse(fs.readFileSync(path.join(c.folder,"prior-completion.json"))).finished_at);
  await refuses("internal witness still requires milliseconds",()=>c.w[0].started_at=c.w[0].started_at.replace(/\.\d{3}Z$/u,"Z"));
  await refuses("internal review still requires milliseconds",()=>c.r.reviewed_at=c.r.reviewed_at.replace(/\.\d{3}Z$/u,"Z"));
  for(const patch of [{exit_code:0},{timed_out:true},{cancelled:true},{termination_reason:"bounded_timeout"},{streams_closed:false},{cleanup_completed:false},{remaining_owned_processes:1}])await refuses("not natural RED "+JSON.stringify(patch),()=>Object.assign(c.w[0].result,patch));
  note("exact source/driver/runtime and contemporaneous natural RED/GREEN bindings are mandatory");
  await refuses("self review",()=>c.r.reviewer=c.e.implementation_actor);
  for(const [name,mutate]of [["wrong commit",()=>c.records.acceptance.commit_id=c.base],["edited grant",()=>c.records.grant.updated_at=new Date().toISOString()],["read permission",()=>c.records.acceptance_permission.permission="read"],["wrong base",()=>c.records.pull_request.base.sha=c.head],["quoted authority",()=>c.records.acceptance.body="> "+c.records.acceptance.body],["recovery allowance",()=>c.records.grant.body=c.records.grant.body.replace('"recovery":0','"recovery":1')]])await refuses(name,mutate,{rebuild:false,admit:true});
  await assert.rejects(()=>reserve({observeRevision:async()=>({authorization:{records:c.records,observations:{}},live:null})}),/capability/);
  note("separate source review, closed authenticated authority and derived one-shot budget");
  const unsafe=path.join(c.checkout,"apps/web_planning/node_modules/.vite-temp");
  fs.mkdirSync(unsafe,{mode:0o700});fs.chmodSync(unsafe,0o777);
  try{
    assert.equal(observeMaintenanceSetup(c.checkout).live_inputs_ready,false);
    await assert.rejects(()=>reserve());assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));
    await isolated(async()=>{c.proof=c.rebuild(false);const p=prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:c.proof});assert.equal(p.eligible_evidence,true);assert.equal(p.live_inputs_ready,false);assert.equal(p.reserved,false);});
  }finally{fs.rmdirSync(unsafe);}
  note("unsafe current input refuses before reservation; artifact eligibility remains separate from live setup");
  const dep=path.join(c.checkout,"apps/web_planning/node_modules/fixture/package.json"),depBytes=fs.readFileSync(dep);
  try{await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeMaintenance(c.proof,material(),c.transport());write(dep,"late changed input");return{authorization,live:null};}}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));}finally{write(dep,depBytes);}
  await isolated(async()=>{await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeMaintenance(c.proof,material(),c.transport());write(path.join(c.folder,"green.log"),"late evidence drift");return{authorization,live:null};}}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));});
  note("protected dependency observations are reread after authenticated observation");
  await refuses("stale physical tip",()=>write(path.join(c.priorRoot,"attempt-2.json"),{unsettled:true}),{admit:true});
  await isolated(async()=>{const outcomes=await Promise.allSettled([reserve(),reserve()]);assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);assert.equal(outcomes.filter(x=>x.status==="rejected").length,1);await assert.rejects(()=>reserve());});
  note("stale tip, competing async reservations and replay cannot acquire a second edge");
  await isolated(async()=>{
    const original=fs.writeFileSync;fs.writeFileSync=function(file,...args){if(String(file).endsWith("attempt-1.json")&&!String(file).includes(c.terminal.family_id))throw new Error("synthetic interruption after edge");return original(file,...args);};syncBuiltinESMExports();
    try{await assert.rejects(()=>reserve(),/synthetic interruption/);}finally{fs.writeFileSync=original;syncBuiltinESMExports();}
    assert(fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),/reserved_unsettled/);await assert.rejects(()=>reserve());
  });
  for(const state of ["orphan","truncated-attempt","truncated-completion"]){await isolated(async()=>{const a=await reserve(),root=path.join(c.anchor,".augnes-local-verification/families",a.family_id);if(state==="truncated-attempt")write(path.join(root,"attempt-1.json"),"{");if(state==="truncated-completion")write(path.join(root,"completion-1.json"),"{");assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));await assert.rejects(()=>reserve());});}
  note("edge-before-attempt interruption, orphan and truncated settlement remain consumed without recovery");
  await isolated(async()=>{const a=await reserve(),r=linked(a,"user_cancellation");finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"user_cancellation",cleanupComplete:true});assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r}));await assert.rejects(()=>reserve());});
  const machine=path.join(resource.root,"machine");fs.mkdirSync(machine);assert.throws(()=>readStockMachineIdentity({attempt:{source_correction:c.proof}},machine));assert.deepEqual(fs.readdirSync(machine),[]);
  note("interrupted attempt settlement is retained; stock never creates machine identity");
  await isolated(async()=>{
    c.records.acceptance.submitted_at=c.records.acceptance.submitted_at.replace(/\.\d{3}Z$/u,"Z");
    c.records.grant.created_at=c.records.grant.created_at.replace(/\.\d{3}Z$/u,"Z");
    c.records.grant.updated_at=c.records.grant.created_at;
    rebindSyntheticRecords(c.p,c.records);write(c.file,c.p);c.proof={...c.p,local_relative_path:path.relative(c.checkout,c.file)};
    const {receipt,context}=await completeSyntheticReceipt(c,reserve);
    assert(validMaintenanceAttempt(receipt.attempt));
    assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}));
    const observed=await inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,runtimeInputs:c.inputs,assertCurrent(){},transport:c.transport()});
    assert.equal(observed.currentAttemptRecordsValid,true);
    assert.deepEqual(inspectReceiptForDecision(receipt,{...context,...observed}).issues,[]);
  });note("seconds-precision synthetic records retain admission, physical history and fresh stock compatibility");
  await isolated(async()=>{
    const {receipt:r,context}=await completeSyntheticReceipt(c,reserve);
    const stock=()=>inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:c.transport()});
    const observed=await stock();assert.equal(observed.currentAttemptRecordsValid,true);assert.deepEqual(inspectReceiptForDecision(r,{...context,...observed}).issues,[]);
    for(const mutate of [v=>v.phases.pop(),v=>v.phases.find(p=>p.browser).browser_use.pop(),v=>v.phases[0].cleanup.streams_closed=false,v=>v.inputs.prepared_dependencies[0].prerequisite=null,v=>v.attempt.budget.recovery=1,v=>v.cleanup.completed=false]){const v=structuredClone(r);mutate(v);assert.equal(inspectReceiptForDecision(finalizeReceipt(v),{...context,...observed}).valid_deciding_evidence,false);}
    assert.throws(()=>createPrivateReviewExport(r),/requires_original/);assert.equal(inspectPrivateReviewExport({attempt:{source_correction:c.proof}}).structurally_valid,false);
    c.records.pull_request.head.sha=c.base;const drift=inspectReceiptForDecision(r,{...context,...await stock()});assert.equal(drift.valid_deciding_evidence,false);assert.equal(drift.dimensions.evidence_validity,"valid_in_recorded_context");
    c.records.pull_request.head.sha=c.head;
    const unavailable=await inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:{review:async()=>{throw new Error("unavailable");}}});assert.equal(unavailable.currentAttemptRecordsValid,true);assert.equal(inspectReceiptForDecision(r,{...context,...unavailable}).valid_deciding_evidence,false);
    write(dep,"unsafe current bytes");
    try{
      const combined=await inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:{review:async()=>{throw new Error("unavailable");}}});
      assert.equal(combined.currentAttemptRecordsValid,true);
      const result=inspectReceiptForDecision(r,{...context,...combined});
      assert.equal(result.dimensions.current_authorization,"unverified");assert.equal(result.dimensions.current_merge_applicability,"blocked");assert.equal(result.dimensions.evidence_validity,"valid_in_recorded_context");
    }finally{write(dep,depBytes);}
    const changed=c.transport(),review=changed.review;changed.review=async(...args)=>{write(path.join(c.folder,"green.log"),"tamper");return review(...args);};
    const invalid=await inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:changed});assert.equal(invalid.currentAttemptRecordsValid,false);assert(verifyReceiptIntegrity(r));
    const neverObserved=await stock();assert.equal(neverObserved.currentAttemptRecordsValid,false);
    assert.equal(inspectReceiptForDecision(r,{...context,...neverObserved}).dimensions.current_authorization,"unverified");
  });note("actual receipt and read-only stock require complete unchanged workload, prerequisites and cleanup; history and current applicability stay separate");
  console.log(JSON.stringify({status:"pass",synthetic_only:true,qualification:false,cases,refusals}));
} finally {
  if(c?.owner)releaseCheckoutVerificationOwnership(c.owner,c.checkout,{consumersSettled:true});
  assert(cleanupCanonicalTestResources([resource]).every(x=>x.completed));
}
