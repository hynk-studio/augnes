import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { ATTEMPT_CONTRACT, beginAttempt, finishAttempt, prepareAttemptDependencies, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof, supportsSourceCorrection, maintenanceMaterial, prepareMaintenanceCandidate, prepareAcceptedMainIntegrationCandidate, integrationMaterial, integrationTarget, authorizeIntegration, validateIntegrationAuthorityRecords, validReviewedIntegrationAttempt, INTEGRATION_ACCEPT, INTEGRATION_GRANT, REVIEWED_REVISION_PHASES } from "./local-canonical-attempts.mjs";
import { authorizeMaintenance, assertMaintenanceAuthorization, validateMaintenanceAuthorityRecords, maintenanceAuthorityObservation, MAINTENANCE_GRANT, validMaintenanceAttempt, observeMaintenanceSetup, maintenanceFaults } from "./local-canonical-maintenance.mjs";
import { readStockMachineIdentity, inspectMaintenanceStock, inspectIntegrationStock } from "./run-local-canonical-verification.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "./local-canonical-review-export.mjs";
import { canonicalSerialize, finalizeReceipt, inspectReceiptForDecision, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { createMaintenanceFixture } from "./fixtures/local-canonical-maintenance.mjs";
import { seedFailedIntegrationFixtureSources, createFailedIntegrationMaintenanceFixture } from "./fixtures/local-canonical-failed-integration-maintenance.mjs";
import { completeSyntheticReceipt, write } from "./fixtures/local-canonical-improvement.mjs";
import { digest, observePreparedDependencyInputs, freezeInputContract } from "./local-canonical-inputs.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// This owner uses isolated synthetic authority and accounting only. It never
// obtains real GitHub authority or opens the operator's physical ledger.
const resource=createCanonicalTestResourceRoot("ag-resource-test-"),env=buildCanonicalChildEnvironment({temporaryRoot:resource.root});
const cases=[],refusals=[];
const additionalRefusals=[];
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
async function successfulMaintenanceIntegrationControls() {
  await isolated(async()=>{
    const {receipt:prior}=await completeSyntheticReceipt(c,reserve);
    const a=prior.attempt, priorRoot=path.join(c.anchor,".augnes-local-verification/families",a.family_id);
    const completionFile=path.join(priorRoot,"completion-1.json"), completion=fs.readFileSync(completionFile);
    const attemptBytes=fs.readFileSync(path.join(priorRoot,"attempt-1.json"));
    const receiptPath=".augnes-local-verification/receipts/successful-maintenance.json";
    write(path.join(c.checkout,receiptPath),prior);
    const git=(...args)=>c.git(args).toString().trim();
    const commit=()=>git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","accepted main fixture");
    git("checkout","-b","accepted-main",c.base);
    write(path.join(c.checkout,"scripts/incoming.mjs"),"export const accepted=true;\n");git("add","scripts/incoming.mjs");commit();
    const main=git("rev-parse","HEAD");git("checkout",c.branch);
    git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","merge","--no-ff","--no-edit",main);
    const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}");
    const folder=path.join(c.checkout,".augnes-local-verification/success-integration"),file=path.join(folder,"proof.json");
    const review={schema:"augnes.local-canonical-candidate-review.v1",kind:"accepted_main_integration",head,tree,
      predecessor_head:a.head,predecessor_tree:a.tree,source_review:"complete",authority_reference:"https://github.com/hynk-studio/augnes/pull/999",
      reviewed_at:new Date().toISOString(),delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",a.head,head,"--"])),
      changed_paths:git("diff","--name-only",a.head,head,"--").split("\n").sort()};
    const rebuild=()=>{
      write(path.join(folder,"review.json"),review);
      write(file,{schema:"augnes.local-canonical-source-correction.v2",kind:"accepted_main_integration",branch:c.branch,
        head:review.head,tree:review.tree,accepted_main:main,prior_family_id:a.family_id,prior_number:1,prior_attempt_id:a.attempt_id,
        prior_receipt_fingerprint:prior.integrity.content_fingerprint,prior_receipt_path:receiptPath,
        review:{artifact:"review.json",sha256:digest(fs.readFileSync(path.join(folder,"review.json")))}});
      return readSourceCorrectionProof(file,c.checkout);
    };
    let proof=rebuild();
    const prepare=()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main});
    const admit=extra=>beginAttempt({...c.request(),head:proof.head,tree:proof.tree,sourceCorrection:proof,acceptedMain:main,runId:"success-integration",...extra});
    const noEdge=()=>assert(!fs.existsSync(path.join(priorRoot,"correction-successor.json")));
    try {
      assert.deepEqual(prepare(),{eligible_evidence:true,authorized:false,reserved:false,head,tree,accepted_main:main,
        predecessor:prior.integrity.content_fingerprint,budget:{initial:1,recovery:1}});noEdge();
      for(const disposition of ["product_failure","input_invalidation","safety_violation","user_cancellation","unclassified_timeout"]){
        write(completionFile,{...JSON.parse(completion),disposition});assert.throws(prepare,/maintenance_terminal/);assert.throws(()=>admit(),/maintenance_terminal/);noEdge();
      }
      write(completionFile,{...JSON.parse(completion),cleanup_complete:false});assert.throws(prepare,/maintenance_terminal/);noEdge();write(completionFile,completion);
      assert.throws(()=>admit({acceptedMain:c.base}),/candidate_integration_unproven/);noEdge();
      assert.throws(()=>admit({assertCurrent(){throw Error("synthetic unsafe inputs");}}),/unsafe inputs/);noEdge();
      const oldReview=structuredClone(review);review.reviewed_at=JSON.parse(completion).finished_at;proof=rebuild();assert.throws(prepare,/candidate_review_binding_invalid/);noEdge();
      Object.assign(review,oldReview);proof=rebuild();
      write(path.join(folder,"review.json"),{...review,tree:c.baseTree});assert.throws(prepare);noEdge();proof=rebuild();
      // A validator amendment after the merge is not a pure merge candidate.
      write(path.join(c.checkout,"scripts/incoming.mjs"),"export const arbitraryAmendment=true;\n");git("add","scripts/incoming.mjs");commit();
      review.head=git("rev-parse","HEAD");review.tree=git("rev-parse","HEAD^{tree}");review.delta_sha256=digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",a.head,review.head,"--"]));proof=rebuild();
      assert.throws(prepare,/candidate_integration_unproven/);noEdge();
      review.head=git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit-tree",review.tree,"-p",a.head,"-p",main,"-m","synthetic amended two-parent tree");proof=rebuild();
      assert.throws(prepare,/candidate_integration_unproven/);noEdge();
      Object.assign(review,oldReview);proof=rebuild();
      write(path.join(priorRoot,"correction-successor.json"),{family_id:"a".repeat(64),head,tree,proof_fingerprint:digest(proof)});
      assert.throws(prepare);assert.throws(()=>admit());fs.unlinkSync(path.join(priorRoot,"correction-successor.json"));
      const target={...c,base:main,head,tree};
      const {receipt,context}=await completeSyntheticReceipt(target,extra=>admit(extra),{preparedDependencies:false});
      assert.deepEqual(receipt.attempt.budget,{initial:1,recovery:1});assert(!receipt.attempt.maintenance_authority);
      assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}));
      assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).attempt_id,receipt.run.id);
      assert.deepEqual(inspectReceiptForDecision(receipt,context).issues,[]);
      assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:prior}));
      assert.throws(prepare);assert.throws(()=>admit());
      write(path.join(folder,"review.json"),{});assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));
      assert.equal(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}),false);
      assert.deepEqual(fs.readFileSync(path.join(priorRoot,"attempt-1.json")),attemptBytes);
      assert.deepEqual(fs.readFileSync(completionFile),completion);
    } finally {git("reset","--hard",c.head);}
  });
  note("successful maintenance admits only a reviewed pure accepted-main integration; non-reserving preparation, cold lineage and receipt validation agree; spent predecessor and ordinary budget preserved");
}
async function failedIntegrationMaintenanceControls({receipt,context,partitionSources}) {
  const families=path.join(c.anchor,".augnes-local-verification/families"),restoreLedger=snapshot(families),integrationHead=receipt.repository.head_sha;
  const selectedRefusals=[];
  const recordRefusal=(name,error)=>selectedRefusals.push({name,code:error?.code??error?.message??String(error)});
  const rejected=async(name,run,match)=>{let refusal;await assert.rejects(run,error=>{refusal=error;return match===undefined||match.test(String(error));});recordRefusal(name,refusal);};
  const thrown=(name,run,match)=>{let refusal;assert.throws(run,error=>{refusal=error;return match===undefined||match.test(String(error));});recordRefusal(name,refusal);};
  let f;
  try {
    f=createFailedIntegrationMaintenanceFixture({c,successfulReceipt:receipt,context,partitionSources});
    const edge=path.join(f.priorRoot,"correction-successor.json"),noEdge=()=>assert(!fs.existsSync(edge));
    const material=()=>f.material(),prepare=async()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:async()=>structuredClone(f.live)});
    const request=extra=>({...c.request(),head:f.head,tree:f.tree,acceptedMain:f.base,runId:"failed-integration-maintenance",sourceCorrection:f.proof,revisionInputs:f.inputs,revisionLive:f.live,...extra});
    const reserve=async extra=>beginAttempt(request({observeRevision:async()=>({authorization:await authorizeMaintenance(f.proof,material(),f.transport()),live:structuredClone(f.live)}),...extra}));
    const originalFiles=new Map(["attempt","completion"].map(kind=>{const file=path.join(f.priorRoot,kind+"-1.json");return[file,fs.readFileSync(file)];}));
    for(const relative of [f.p.prior_receipt_path,f.nativePath]){const file=path.join(c.checkout,relative);originalFiles.set(file,fs.readFileSync(file));}
    const preserve=()=>{for(const[file,bytes]of originalFiles)assert.deepEqual(fs.readFileSync(file),bytes,"retained failed integration remains immutable");};
    const retainedStock=inspectReceiptForDecision(f.failed,{...context,integrationCurrentIssues:[]});
    assert.deepEqual(retainedStock,f.stock);assert.equal(f.stock.issues.length,14);
    assert.deepEqual(f.failed.phases.map(p=>p.status),[...Array(6).fill("pass"),"failure",...Array(9).fill("not_run")]);
    assert.deepEqual(f.preparation.input_inventory.binding,{});assert(!Object.hasOwn(f.preparation.input_inventory,"prepared_dependencies"));
    assert.deepEqual(f.fullInputInventory.resources,f.preparation.input_inventory.resources);assert.notEqual(f.fullInputInventory.fingerprint,f.preparation.input_inventory.fingerprint);
    const original=material();assert.equal(original.fixture.preparation_sha256,f.incident.preparation.sha256);noEdge();
    f.rebuild(false);
    const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.live_inputs_ready,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);
    assert.deepEqual(prepared.missing,["authenticated_candidate_acceptance","prospective_maintenance_commission"]);noEdge();
    await rejected("unauthorized admission",()=>reserve());f.rebuild();
    const keys="p e r stock history partition preparation checks contract sourceBefore sourceAfter incident".split(" "),saved=structuredClone(Object.fromEntries(keys.map(key=>[key,f[key]])));
    const reset=()=>{for(const key of keys)f[key]=structuredClone(saved[key]);f.rebuild();};
    let refused=0;
    for(const [name,mutate]of [
      ["UNKNOWN cause retained",()=>f.incident.cause="repaired_timeout"],
      ["UNKNOWN operation retained",()=>f.incident.interrupted_operation="stock"],
      ["whole stock issue set",()=>f.stock.issues.pop()],
      ["same-count stock meanings",()=>{f.stock.issues[0]="unexplained_stock_issue";f.stock.issues.sort();assert.equal(f.stock.issues.length,14);}],
      ["stock dimensions retained",()=>f.stock.dimensions.current_authorization="unverified"],
      ["complete ordered positive groups",()=>f.checks.pop()],
      ["positive swap refused",()=>[f.checks[5],f.checks[6]]=[f.checks[6],f.checks[5]]],
      ["existing inner deadline retained",()=>f.checks[5].result.registered_inner_ms=30000],
      ["positive cleanup required",()=>f.checks[5].result.result.cleanup_completed=false],
      ["full source inventory",()=>delete f.sourceBefore.source[Object.keys(f.sourceBefore.source)[0]]],
      ["actual partition parent",()=>f.partition.source_head=f.sourceHead],
      ["prepared source bound",()=>f.preparation.source_head=f.sourceHead],
      ["prepared inventory bound",()=>f.preparation.inventory_sha256="a".repeat(64)],
      ["caller-invented preparation binding",()=>{const input=f.preparation.input_inventory;input.binding={head:f.head};input.fingerprint=digest({contract:input.contract,path_kind:input.path_kind,binding:input.binding,resources:input.resources});}],
      ["contract creates no grant",()=>f.contract.new_grants=1],
    ]){
      mutate();let error;try{f.rebuild();material();}catch(value){error=value;}assert(error,name);noEdge();preserve();recordRefusal(name,error);refused++;reset();
    }
    const physicalLog=path.join(c.checkout,f.nativePath),nativeBytes=fs.readFileSync(physicalLog);
    try{write(physicalLog,"substituted physical incident log\n");thrown("physical incident log substitution",material,/artifact_changed|original_log/);noEdge();refused++;}finally{write(physicalLog,nativeBytes);}
    await rejected("live prepared inventory drift",async()=>prepareMaintenanceCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:f.proof,runtimeInputs:f.inputs,live:{...f.live,inventory:"a".repeat(64)}}),/prepared_inputs_changed/);noEdge();
    await rejected("live runtime drift",()=>reserve({revisionInputs:c.inputs}),/maintenance_current_runtime_invalid/);noEdge();
    const unsafe=path.join(c.checkout,"apps/web_planning/node_modules/.vite-temp");fs.mkdirSync(unsafe,{mode:0o700});fs.chmodSync(unsafe,0o777);
    try{await rejected("unsafe input preparation",prepare);await rejected("unsafe input admission",()=>reserve());noEdge();}finally{fs.rmdirSync(unsafe);}
    // An old ID remains spent even when all bytes are freshly rebound to this
    // selected target. This is synthetic authority, never a rewritten provider record.
    for(const oldId of [receipt.attempt.source_correction.authorization.grant_comment_id,c.proof.authorization.grant_comment_id]){
      f.records.grant.id=oldId;f.proof.authorization.grant_comment_id=oldId;f.proof.authorization.grant_comment_sha256=digest(maintenanceAuthorityObservation(f.records.grant,"prospective_grant"));
      write(f.file,Object.fromEntries(Object.entries(f.proof).filter(([key])=>key!=="local_relative_path")));
      await rejected("old grant reuse "+oldId,prepare,/grant_reused/);noEdge();reset();
    }
    const noCurrentReads={...f.transport(),pullRequest:async()=>{throw Error("wrong synthetic current PR");}};
    await rejected("current PR authority unavailable",()=>authorizeMaintenance(f.proof,material(),noCurrentReads));noEdge();
    // Evidence drift during the authority await cannot reach the exclusive edge.
    const observation=path.join(f.folder,"material-stock.log"),observationBytes=fs.readFileSync(observation);
    try{await rejected("evidence drift during authority observation",()=>reserve({observeRevision:async()=>{const authorization=await authorizeMaintenance(f.proof,material(),f.transport());write(observation,"late positive evidence drift\n");return{authorization,live:f.live};}}),/changed/);noEdge();}
    finally{write(observation,observationBytes);}
    const restoreBeforeAdmission=snapshot(families);
    try{
      const original=fs.writeFileSync;fs.writeFileSync=function(file,...args){if(String(file).endsWith("attempt-1.json")&&!String(file).includes(f.priorAttempt.family_id))throw Error("synthetic selected-case interruption");return original(file,...args);};syncBuiltinESMExports();
      try{await rejected("interruption after exclusive edge",()=>reserve(),/selected-case interruption/);}finally{fs.writeFileSync=original;syncBuiltinESMExports();}
      assert(fs.existsSync(edge));thrown("interrupted cold lineage",()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),/reserved_unsettled/);await rejected("interrupted commission replay",()=>reserve());
    }finally{restoreBeforeAdmission();}
    const {receipt:assembled,context:successContext}=await completeSyntheticReceipt(f,async extra=>{
      const admission={...extra,contractFingerprint:f.fullInputInventory.fingerprint};
      const outcomes=await Promise.allSettled([reserve(admission),reserve(admission)]);
      assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);assert.equal(outcomes.filter(x=>x.status==="rejected").length,1);
      recordRefusal("competing reservation",outcomes.find(x=>x.status==="rejected").reason);
      return outcomes.find(x=>x.status==="fulfilled").value;
    });
    // Finish constructing only this new synthetic success with its full,
    // admitted declaration. No retained failed or provider record is rewritten.
    const checkout=f.preparation.checkout_fingerprint;
    const success=finalizeReceipt({...assembled,inputs:structuredClone(f.fullInputInventory),
      verification_context:{...assembled.verification_context,checkout_fingerprint:checkout},
      checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:checkout},capacity_ownership:{...assembled.capacity_ownership,checkout_fingerprint:checkout}});
    Object.assign(successContext,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:checkout});
    assert.equal(success.inputs.binding.head,f.head);assert.equal(success.inputs.binding.tree,f.tree);assert.deepEqual(success.inputs.binding.runtime_inputs,f.inputs);
    assert.equal(success.inputs.binding.executor_fingerprint,success.executor.source_fingerprint);assert(success.inputs.binding.phase_environment_fingerprints.length===16);
    assert.deepEqual(success.inputs.resources,f.preparation.input_inventory.resources);assert.deepEqual(f.live.inputInventory.binding,{});
    const completionFile=path.join(families,success.attempt.family_id,"completion-1.json"),completion=JSON.parse(fs.readFileSync(completionFile));
    write(completionFile,{...completion,receipt_fingerprint:success.integrity.content_fingerprint});
    assert(validMaintenanceAttempt(success.attempt));assert.deepEqual(success.attempt.budget,{initial:1,recovery:0});
    const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
    assert.equal(tip.attempt_id,success.run.id);assert.equal(tip.maintenance_consumed,true);
    assert.deepEqual(tip.historical_grants.map(row=>row.kind),["behavior_preserving_improvement","prospective_maintenance","accepted_main_integration","prospective_maintenance"]);
    assert.deepEqual(tip.historical_grants.map(row=>row.grant.id),[c.terminal.source_correction.authorization.grant_comment_id,c.proof.authorization.grant_comment_id,receipt.attempt.source_correction.authorization.grant_comment_id,success.attempt.source_correction.authorization.grant_comment_id]);
    assert(tip.historical_grants.every(row=>row.consumed===1&&row.budget.initial===1&&row.budget.recovery===0));
    assert.deepEqual(tip.historical_grants[0].grant,c.terminal.improvement_authority.observations.prospective_grant);
    assert.deepEqual(tip.historical_grants[2].grant,receipt.attempt.integration_authority.observations.prospective_grant);
    assert.deepEqual(tip.historical_grants[3].acceptance,success.attempt.maintenance_authority.observations.accepted_maintenance);
    const packet=path.join(f.folder,"cold-packet.json");write(packet,{anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:f.failed,context});
    await child("failed-integration-cold-prefix",process.execPath,["--import","tsx",f.coldReader,"--cold-failed-integration",packet],path.resolve(path.dirname(f.coldReader),"../.."));
    recordRefusal("cold malformed failure prefix",{code:"attempt_records_refused"});
    const observed=await inspectMaintenanceStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:success,runtimeInputs:f.inputs,observeCurrentInputs:async()=>structuredClone(f.live),assertCurrent(){},transport:f.transport()});
    assert.equal(observed.currentAttemptRecordsValid,true);assert.deepEqual(inspectReceiptForDecision(success,{...successContext,...observed}).issues,[]);
    await rejected("spent commission admission",()=>reserve());await rejected("spent commission preparation",prepare);preserve();
    console.log(JSON.stringify({failed_integration_maintenance:{synthetic_only:true,evidence_refusals:refused,refusal_count:selectedRefusals.length,refusals:selectedRefusals,
      input_scopes:{preparation_binding_keys:Object.keys(f.preparation.input_inventory.binding),full_binding_keys:Object.keys(success.inputs.binding).sort(),shared_inventory:true,
        preparation_input_fingerprint:f.preparation.input_inventory.fingerprint,full_input_fingerprint:success.inputs.fingerprint}}}));
    note("selected failed reviewed-integration fixture partition: retained6PASS/authorityFAIL/9NOT_RUN and stock14, evidence refusals, safe preparation, distinct one-shot grant, interruption and exclusive cold lineage; failed prefix grants no current permission");
  } finally {
    f?.restoreExclude();restoreLedger();c.git(["reset","--hard",integrationHead]);
  }
}
async function reviewedIntegrationControls() {
  await isolated(async()=>{
    const {receipt:prior}=await completeSyntheticReceipt(c,reserve),a=prior.attempt;
    const ledger=path.join(c.anchor,".augnes-local-verification/families",a.family_id),edge=path.join(ledger,"correction-successor.json");
    const original=fs.readFileSync(path.join(ledger,"attempt-1.json")),completionFile=path.join(ledger,"completion-1.json"),completion=fs.readFileSync(completionFile);
    const git=(...args)=>c.git(args).toString().trim(), commit=()=>git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","reviewed integration fixture");
    const folder=path.join(c.checkout,".augnes-local-verification/reviewed-integration"),file=path.join(folder,"proof.json");
    const ref=(name,v)=>{write(path.join(folder,name),v);return{artifact:name,sha256:digest(fs.readFileSync(path.join(folder,name)))}};
    const delta=(before,after,files=[])=>digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv","--no-renames",before,after,"--",...files]));
    try {
      git("checkout","-b","reviewed-accepted-main",c.base);write(path.join(c.checkout,"lib/work.mjs"),"export const incoming=true;\n");
      const partitionSources=seedFailedIntegrationFixtureSources(c);
      git("add","lib/work.mjs");commit();
      const main=git("rev-parse","HEAD");git("checkout",c.branch);
      try{git("merge","--no-ff","--no-commit",main);}catch{/* Deliberately differing overlap; resolve both behaviors in this isolated repository. */}
      write(path.join(c.checkout,"lib/work.mjs"),"export function read(validate){validate();return 2;}\nexport const incoming=true;\n");git("add","lib/work.mjs");commit();
      const merge=git("rev-parse","HEAD"),mergeTree=git("rev-parse","HEAD^{tree}"),mergeBase=git("merge-base",a.head,main);
      write(path.join(c.checkout,"scripts/verifier-fixture.mjs"),"export const reviewedCompatibility=true;\n");git("add","scripts/verifier-fixture.mjs");commit();
      const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}");
      const entry=rev=>{const row=git("ls-tree",rev,"--","lib/work.mjs");return row.slice(0,row.indexOf("\t"));};
      const receiptPath=".augnes-local-verification/receipts/reviewed-predecessor.json";write(path.join(c.checkout,receiptPath),prior);
      let p={schema:"augnes.local-canonical-source-correction.v2",kind:"accepted_main_integration",integration_case:"reviewed",branch:c.branch,base:main,accepted_main:main,head,tree,pull_request:999,
        prior_family_id:a.family_id,prior_number:1,prior_attempt_id:a.attempt_id,prior_receipt_fingerprint:prior.integrity.content_fingerprint,prior_receipt_path:receiptPath,
        integration:{commit:merge,tree:mergeTree,merge_base:mergeBase,overlaps:[{path:"lib/work.mjs",base:entry(mergeBase),predecessor:entry(a.head),main:entry(main),result:entry(merge)}],
          delta_sha256:delta(a.head,merge),resolution_delta_sha256:delta(a.head,merge,["lib/work.mjs"]),correction_delta_sha256:delta(merge,head),correction_paths:["scripts/verifier-fixture.mjs"]},
        planner:ref("planner.json",{base:main,head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["local-canonical-integrity"]}),review:null,budget:{initial:1,recovery:0},authorization:null};
      let review={schema:"augnes.local-canonical-candidate-review.v1",kind:p.kind,head,tree,predecessor_head:a.head,predecessor_tree:a.tree,source_review:"complete",delta_sha256:delta(a.head,head),
        changed_paths:git("diff","--name-only",a.head,head,"--").split("\n").sort(),authority_reference:"https://github.com/hynk-studio/augnes/pull/999",reviewed_at:new Date().toISOString(),
        integration_sha256:digest(p.integration),planner_sha256:p.planner.sha256,reviewer:"synthetic-separate-reviewer",implementation_actor:"synthetic-implementer",no_write:true,disposition:"accept",
        judgments:Object.fromEntries("complete_integration complete_overlaps complete_corrections verifier_policy_adjustments_only affected_consumers authority_and_lineage no_weakened_contract".split(" ").map(k=>[k,true])),report:null};
      let proof;
      const rebuild=()=>{review.head=p.head;review.tree=p.tree;review.integration_sha256=digest(p.integration);review.report=ref("review.md",`Synthetic independent complete review ${p.head} ${p.tree} ${digest(p.integration)} ${review.delta_sha256}\n`);p.review=ref("review.json",review);write(file,p);proof=readSourceCorrectionProof(file,c.checkout);};
      rebuild();const prepare=()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main});
      assert.equal(prepare().eligible_evidence,true);assert(!fs.existsSync(edge));
      for(const integration_case of ["unknown",null]){write(file,{...p,integration_case});assert.throws(()=>readSourceCorrectionProof(file,c.checkout),/mixed_route/);}rebuild();
      const objects=git("count-objects","-v");prepare();assert.equal(git("count-objects","-v"),objects,"preparation must not create Git objects");
      const saved=structuredClone(p),savedReview=structuredClone(review);
      for(const mutate of [()=>p.integration.overlaps.pop(),()=>p.integration.overlaps[0].result=p.integration.overlaps[0].main,()=>p.integration.correction_paths=[],()=>p.integration.correction_paths=["lib/work.mjs"],()=>p.integration.correction_delta_sha256="a".repeat(64),()=>p.tree=a.tree,()=>p.prior_attempt_id="wrong",()=>p.accepted_main=c.base,()=>p.integration.commit=main,()=>review.predecessor_head=main,()=>review.reviewer=review.implementation_actor]){
        mutate();rebuild();assert.throws(prepare);assert(!fs.existsSync(edge));p=structuredClone(saved);review=structuredClone(savedReview);rebuild();
      }
      for(const disposition of ["product_failure","safety_violation","input_invalidation","user_cancellation"]){write(completionFile,{...JSON.parse(completion),disposition});assert.throws(prepare);write(completionFile,completion);}
      write(completionFile,{...JSON.parse(completion),cleanup_complete:false});assert.throws(prepare);write(completionFile,completion);
      const admit=extra=>beginAttempt({...c.request(),head,tree,acceptedMain:main,sourceCorrection:proof,runId:"reviewed-integration",...extra});
      assert.throws(()=>admit(),/authority/);assert(!fs.existsSync(edge));
      await assert.rejects(()=>authorizeIntegration(proof,integrationMaterial(c.checkout,proof,c.anchor),c.transport()),/authority/);
      await new Promise(resolve=>setTimeout(resolve,5));
      const user={login:"synthetic-owner",id:1,type:"User"},at=new Date().toISOString(),later=new Date(Date.now()+2).toISOString(),url="https://api.github.com/repos/hynk-studio/augnes";
      const common={target:integrationTarget(p),review_sha256:p.review.sha256};
      const acceptance={id:3001,user,body:INTEGRATION_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:review.report.sha256,scope:"reviewed_integration"}),state:"COMMENTED",commit_id:head,pull_request_url:url+"/pulls/999",author_association:"OWNER",submitted_at:at};
      const acceptanceObservation={id:3001,author:user.login,author_id:1,body_sha256:digest(acceptance.body),timestamp:at,role:"accepted_integration",commit_id:head};
      const grant={id:3002,user,body:INTEGRATION_GRANT+"\n"+canonicalSerialize({...common,acceptance_sha256:digest(acceptanceObservation),planner_sha256:p.planner.sha256,maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_unchanged_bounds"}),issue_url:url+"/issues/999",author_association:"OWNER",created_at:later,updated_at:later};
      const permission={permission:"admin",user},branch=(sha,ref)=>({sha,ref,repo:{full_name:"hynk-studio/augnes"}});
      const records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,pull_request:{number:999,state:"open",draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(main,"main")}};
      p.authorization={acceptance_review_id:3001,acceptance_review_sha256:digest(acceptanceObservation),grant_comment_id:3002,grant_comment_sha256:digest({id:3002,author:user.login,author_id:1,body_sha256:digest(grant.body),timestamp:later,role:"prospective_grant",commit_id:null})};rebuild();
      await new Promise(resolve=>setTimeout(resolve,5));
      const material=()=>integrationMaterial(c.checkout,proof,c.anchor),transport=()=>({review:async()=>records.acceptance,grant:async()=>records.grant,permission:async()=>permission,pullRequest:async()=>records.pull_request});
      const reserveIntegration=async extra=>admit({observeRevision:async()=>({authorization:await authorizeIntegration(proof,material(),transport()),live:null}),...extra});
      for(const mutate of [v=>v.acceptance.commit_id=main,v=>v.grant.updated_at=at,v=>v.grant.body=v.grant.body.replace('"recovery":0','"recovery":1'),v=>v.acceptance_permission={permission:"read",user},v=>v.pull_request.head.sha=main]){const bad=structuredClone(records);mutate(bad);assert.throws(()=>validateIntegrationAuthorityRecords(proof,material(),bad));}
      await assert.rejects(()=>reserveIntegration({assertCurrent(){throw Error("synthetic unsafe inputs");}}),/unsafe/);assert(!fs.existsSync(edge));
      await assert.rejects(()=>reserveIntegration({observeRevision:async()=>({authorization:{records,observations:{}},live:null})}),/capability/);assert(!fs.existsSync(edge));
      const occupied=path.join(c.anchor,".augnes-local-verification/families",digest([ATTEMPT_CONTRACT,"hynk-studio/augnes",c.branch,"verified_source_correction",p.prior_attempt_id,p.head,p.tree]));
      fs.mkdirSync(occupied,{mode:0o700});try{await assert.rejects(()=>reserveIntegration(),/candidate_superseded/);assert(!fs.existsSync(edge));}finally{fs.rmdirSync(occupied);}
      await assert.rejects(()=>reserveIntegration({runId:"x".repeat(64*1024)}),/attempt_unbounded/);assert(!fs.existsSync(edge));
      for(const name of ["review.md","planner.json"]){
        const location=path.join(folder,name),bytes=fs.readFileSync(location);
        try{await assert.rejects(()=>reserveIntegration({assertCurrent(){write(location,name==="review.md"?"late mutation":{changed:true});}}),/changed/);assert(!fs.existsSync(edge));}
        finally{write(location,bytes);}
      }
      const target={...c,base:main,head,tree};
      const beforeAdmission=snapshot(path.join(c.anchor,".augnes-local-verification/families"));
      const {receipt,context}=await completeSyntheticReceipt(target,async extra=>{
        const outcomes=await Promise.allSettled([reserveIntegration(extra),reserveIntegration(extra)]);
        assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);assert.equal(outcomes.filter(x=>x.status==="rejected").length,1);
        return outcomes.find(x=>x.status==="fulfilled").value;
      });
      assert.deepEqual(receipt.attempt.budget,{initial:1,recovery:0});assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}));
      assert.throws(()=>createPrivateReviewExport(receipt),/integration_requires_original/);assert.equal(inspectPrivateReviewExport({attempt:{source_correction:proof}}).structurally_valid,false);
      const stock=()=>inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){},transport:transport()});
      assert.deepEqual(inspectReceiptForDecision(receipt,{...context,...await stock()}).issues,[]);
      const sameTime=structuredClone(receipt.attempt);sameTime.started_at=sameTime.integration_authority.observations.prospective_grant.timestamp;assert.equal(validReviewedIntegrationAttempt(sameTime),false);
      const badObservation=structuredClone(receipt.attempt);badObservation.integration_authority.observations.prospective_grant.extra=true;assert.equal(validReviewedIntegrationAttempt(badObservation),false);
      for(const mutate of [v=>v.inputs.binding.runtime_inputs={},v=>v.phases.find(p=>p.id==="unit").cleanup.streams_closed=false,v=>v.phases.find(p=>p.id==="typecheck").cleanup.termination_reason="cancelled"]){const v=structuredClone(receipt);mutate(v);assert(inspectReceiptForDecision(finalizeReceipt(v),{...context,integrationCurrentIssues:[]}).issues.includes("receipt_integration_lane_invalid"));}
      assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).attempt_id,receipt.run.id);
      await assert.rejects(()=>reserveIntegration());assert.throws(prepare);
      assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:prior}));
      records.pull_request.head.sha=main;const drift=inspectReceiptForDecision(receipt,{...context,...await stock()});assert.equal(drift.dimensions.evidence_validity,"valid_in_recorded_context");assert.equal(drift.valid_deciding_evidence,false);records.pull_request.head.sha=head;
      const unavailable=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){throw Error("unsafe inputs");},transport:{review:async()=>{throw Error("unavailable");}}});
      const unavailableResult=inspectReceiptForDecision(receipt,{...context,...unavailable});assert.equal(unavailableResult.dimensions.evidence_validity,"valid_in_recorded_context");assert.equal(unavailableResult.dimensions.current_authorization,"unverified");
      const objectCount=git("count-objects","-v");await stock();assert.equal(git("count-objects","-v"),objectCount,"stock must not create Git objects");
      const afterAdmission=snapshot(path.join(c.anchor,".augnes-local-verification/families"));
      try{
        beforeAdmission();
        const exactLimitRunId="x".repeat(64*1024-Buffer.byteLength(JSON.stringify({...receipt.attempt,attempt_id:""})));
        assert.equal(Buffer.byteLength(JSON.stringify({...receipt.attempt,attempt_id:exactLimitRunId})),64*1024);
        await assert.rejects(()=>reserveIntegration({runId:exactLimitRunId}),/attempt_unbounded/);assert(!fs.existsSync(edge));
      }finally{afterAdmission();}
      await failedIntegrationMaintenanceControls({receipt,context,partitionSources});
      write(path.join(folder,"review.md"),"tampered");assert.equal(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}),false);
      let authorityReads=0;
      const refusedStock=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){},transport:{review:async()=>{authorityReads++;throw Error("must not observe authority after historical refusal");}}});
      assert.equal(authorityReads,0);assert.equal(refusedStock.currentAttemptRecordsValid,false);
      assert.equal(inspectReceiptForDecision(receipt,{...context,...refusedStock}).dimensions.current_authorization,"unverified");
      assert.deepEqual(fs.readFileSync(path.join(ledger,"attempt-1.json")),original);assert.deepEqual(fs.readFileSync(completionFile),completion);
    } finally {git("reset","--hard",c.head);}
  });
  note("reviewed overlapping integration plus declared verifier correction: exact read-only preparation, authenticated one-shot admission, exclusive cold lineage and full synthetic receipt; omissions, drift, unsafe inputs, replay and passive authority refuse");
}
try {
  c=await createMaintenanceFixture(resource.root,env,prepareTrees);
  authorityTimestampControls();
  await successfulMaintenanceIntegrationControls();
  await reviewedIntegrationControls();
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
  await isolated(async()=>{const evidence={...c.e,repairs:[]};c.p.evidence=c.ref("evidence.json",evidence);write(c.file,c.p);c.proof={...c.p,local_relative_path:path.relative(c.checkout,c.file)};
    assert.throws(material,error=>{if(error.code!=="maintenance_repairs_missing")return false;additionalRefusals.push({name:"ordinary empty repairs cannot use selected-case waiver",code:error.code});return true;});
    assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));});
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
  console.log(JSON.stringify({maintenance_additional_refusals:{synthetic_only:true,refusal_count:additionalRefusals.length,refusals:additionalRefusals}}));
  console.log(JSON.stringify({status:"pass",synthetic_only:true,qualification:false,cases,refusals}));
} finally {
  if(c?.owner)releaseCheckoutVerificationOwnership(c.owner,c.checkout,{consumersSettled:true});
  assert(cleanupCanonicalTestResources([resource]).every(x=>x.completed));
}
