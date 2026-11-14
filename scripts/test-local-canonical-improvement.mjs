import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof, supportsSourceCorrection, improvementMaterial, prepareImprovementCandidate } from "./local-canonical-attempts.mjs";
import { authorizeImprovement, observeImprovementAuthority, validImprovementAttempt, validateImprovementAuthorityRecords, parseImprovementJSON, ordinaryV2SourceModule, isImprovement } from "./local-canonical-improvement.mjs";
import { readStockMachineIdentity, inspectImprovementStock } from "./run-local-canonical-verification.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "./local-canonical-review-export.mjs";
import { finalizeReceipt, inspectReceiptForDecision, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createImprovementFixture, completeSyntheticReceipt, write, natural } from "./fixtures/local-canonical-improvement.mjs";

const resource=createCanonicalTestResourceRoot("ag-resource-test-"), env=buildCanonicalChildEnvironment({temporaryRoot:resource.root});
const findings=[], subcases=[];
let c, inFlight=false;
const note=(id,name)=>{findings.push({case:id,status:"pass",name});console.log(JSON.stringify(findings.at(-1)));};
const read=()=>readSourceCorrectionProof(c.file,c.checkout);
const material=p=>improvementMaterial(c.checkout,p??c.proof);
const inspect=receipt=>inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt});
const reserve=async(extra={})=>beginAttempt({...c.request(),observeRevision:async()=>({authorization:await authorizeImprovement(c.proof,material(),c.transport()),live:null}),...extra});
function snapshot(folder) {
  const files=new Map();
  const walk=(p,relative="")=>{for(const d of fs.readdirSync(p,{withFileTypes:true})){const r=path.join(relative,d.name);if(d.isDirectory())walk(path.join(p,d.name),r);else files.set(r,fs.readFileSync(path.join(p,d.name)));}};
  walk(folder);return()=>{fs.rmSync(folder,{recursive:true,force:true});fs.mkdirSync(folder,{mode:0o700});for(const [name,bytes]of files)write(path.join(folder,name),bytes);};
}
async function isolated(fn) {
  const saved=structuredClone({p:c.p,c:c.c,r:c.r,w:c.w,proof:c.proof,records:c.records,a:c.a,g:c.g,plan:c.plan});
  const restoreArtifacts=snapshot(c.folder),restoreLedger=snapshot(path.join(c.anchor,".augnes-local-verification/families"));
  try {return await fn();} finally {restoreArtifacts();restoreLedger();Object.assign(c,saved);}
}
async function refuses(label,mutate,{rebuild=true,admit=false}={}) {
  await isolated(async()=>{
    let refused=false;
    try {await mutate();if(rebuild)c.proof=c.rebuild();if(admit)await reserve();else read();}
    catch(error){refused=true;subcases.push({label,code:error.code??error.message});}
    assert(refused,label);assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")),label+" zero reservation");
  });
}
function linked(a,disposition="completed_success") {
  return finalizeReceipt({receipt_version:4,repository:{branch:c.branch,head_sha:a.head,tree_sha:a.tree,base_sha:c.base},run:{id:a.attempt_id},attempt:a,outcome:{disposition},cleanup:{completed:true}});
}
try {
  c=createImprovementFixture(resource.root,env);
  await isolated(async()=>{
    c.p.authorization=null;write(c.file,c.p);const p={...c.p,local_relative_path:path.relative(c.checkout,c.file)};
    assert.deepEqual(prepareImprovementCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof:p}).missing,["authenticated_candidate_acceptance","prospective_one_shot_grant"]);
    assert.throws(()=>beginAttempt({...c.request(),sourceCorrection:p}));
  });
  await isolated(async()=>{const a=await reserve();assert.equal(a.number,1);assert.deepEqual(a.budget,{initial:1,recovery:0});assert(validImprovementAttempt(a));const r=linked(a);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:r.outcome.disposition,cleanupComplete:true});assert(await inspect(r));});
  note(1,"actual reader, non-reserving preparation, authenticated synthetic admission and physical replay");
  assert.equal(c.prior.source_correction.kind,"source_revision");assert.equal(c.prior.budget.recovery,1);
  assert(supportsSourceCorrection({schema:"augnes.local-canonical-source-correction.v1"}));
  assert(supportsSourceCorrection({schema:c.p.schema,kind:"verifier_correction"}));assert(supportsSourceCorrection({schema:c.p.schema,kind:"accepted_main_integration"}));
  note(2,"ordinary RED/GREEN predecessor uses unchanged reader/begin; legacy dispatch retained (broader old-route owner runs separately)");
  for(const kind of ["source_revision","unknown","observer_repair"])await refuses("wrong kind "+kind,()=>{c.p.kind=kind;write(c.file,c.p);},{rebuild:false});
  for(const schema of ["augnes.local-canonical-source-correction.v1","augnes.local-canonical-source-correction.v7"])await refuses("downgrade "+schema,()=>{c.p.schema=schema;write(c.file,c.p);},{rebuild:false});
  await refuses("extra proof key",()=>{c.p.extra=true;write(c.file,c.p);},{rebuild:false});note(3,"PASS/PASS cannot enter RED/GREEN; unknown, retired, downgraded and extra-key proofs refuse");
  for(const [label,mutate]of [["cycle",()=>c.c.review=c.p.review],["unknown campaign",()=>c.c.extra=1],["duplicate pair",()=>c.w[1].role="before"],["overflow",()=>c.c.work.before_count=Number.MAX_SAFE_INTEGER+1]])await refuses(label,mutate);
  assert.throws(()=>parseImprovementJSON('{"a":1,"a":1}'));assert.throws(()=>parseImprovementJSON('{ "a":1}'));assert.equal(parseImprovementJSON('{"a":1}\n').a,1);
  assert.throws(()=>parseImprovementJSON(Buffer.from([123,34,97,34,58,34,255,34,125])),/utf8/);
  await refuses("invalid calendar date",()=>c.w[0].started_at="2026-02-30T00:00:00.000Z");
  note(4,"closed acyclic records, canonical byte domain, duplicate roles and safe arithmetic");
  for(const module of ["components/other.tsx","./lib/work.mjs","lib/../work.mjs","Lib/work.mjs","lib\\work.mjs"])
    await refuses("module "+module,()=>c.c.source.production[0].path=module);
  for(const module of ["next.config.ts","components/blank-state/blank-state-client.tsx","components/workbench/semantic-review/selected-work-source-editor.tsx","apps/web_planning/src/history-client.js.txt"])
    assert(ordinaryV2SourceModule({kind:"source_revision",source_module:module}));
  await refuses("test only",()=>{c.c.source.production=[];c.c.source.partitions.production=[];c.c.source.partitions.focused=["lib/work.mjs"];});note(5,"production predicate and literal exception boundaries; ancillary-only refusal");
  for(const [label,mutate]of [["blob",()=>c.c.source.production[0].before_blob="0".repeat(40)],["whole delta",()=>c.c.source.delta_sha256=digest("other")],["path list",()=>c.c.source.changed_paths=["lib/other.mjs"]],["overlay",()=>c.w[0].overlay_manifest.sha256=digest("other")],["runtime",()=>c.w[0].runtime_sha256=digest("other")],["driver",()=>c.w[0].driver_sha256=digest("other")],["corpus",()=>c.w[0].corpus_sha256=digest("other")],["dependency",()=>write(path.join(c.folder,"dependencies.json"),[])],["compiler",()=>write(path.join(c.folder,"compiler.json"),[])]])await refuses(label,mutate);
  await refuses("self-consistent fake source manifest",()=>{const rows=JSON.parse(fs.readFileSync(path.join(c.folder,"before-source.json")));rows.push({path:"lib/missing.mjs",sha256:digest("fake"),bytes:4});rows.sort((a,b)=>a.path<b.path?-1:1);c.w[0].source_manifest=c.ref("before-source.json",rows);c.w[0].start_identity=c.w[0].end_identity={...c.w[0].start_identity,source_manifest_sha256:c.w[0].source_manifest.sha256};});
  await refuses("missing retained driver helper",()=>{c.c.driver.manifest=c.ref("driver-manifest.json",[{path:"missing.mjs",sha256:digest("missing"),bytes:7}]);});
  await refuses("corpus concrete bytes changed",()=>write(path.join(c.folder,"database.txt"),"different"));
  await refuses("unbound compiler",()=>c.c.runtime.compiler=c.ref("compiler.json",[{path:"node_modules/unrelated.js",sha256:digest("other"),bytes:5}]));
  await refuses("missing contemporaneous concrete capture",()=>delete c.w[0].captures);
  await refuses("captured input tampered",()=>write(path.join(c.folder,"before-capture-config.json"),{project_id:"other"}));
  await refuses("fresh process wrong output",()=>{const capture=JSON.parse(fs.readFileSync(path.join(c.folder,"after-captures.json")));capture.fresh_reader.stdout=c.ref("after-fresh.log",JSON.stringify({fresh_process_read:"read-valid",input_sha256:digest("wrong"),config_sha256:digest("wrong"),outcome:"available",standalone:"available",writes:0,result:{synthetic:true}}));c.w[1].captures=c.ref("after-captures.json",capture);});
  for(const badPath of ["../outside", "node_modules/../outside", "node_modules\\escape", "/absolute", "node_modules//empty"])
    await refuses("unsafe manifest path "+badPath,()=>c.c.runtime.dependencies=c.ref("dependencies.json",[{path:badPath,sha256:digest("fixture"),bytes:7}]));
  await refuses("required file capture omitted",()=>{const capture=JSON.parse(fs.readFileSync(path.join(c.folder,"before-captures.json")));capture.files=[];c.w[0].captures=c.ref("before-captures.json",capture);});
  await refuses("required file read omitted",()=>{const capture=JSON.parse(fs.readFileSync(path.join(c.folder,"before-captures.json")));const rows=fs.readFileSync(path.join(c.folder,"before-files.jsonl"),"utf8").trim().split("\n").map(JSON.parse).filter(r=>r.operation==="write");capture.files[0].observations=c.ref("before-files.jsonl",rows.map(JSON.stringify).join("\n")+"\n");c.w[0].captures=c.ref("before-captures.json",capture);});
  await refuses("required file bytes changed",()=>write(path.join(c.folder,"before-input-file.json"),"changed"));
  note(6,"literal bracket source and scoped dependency accepted; source/blob/delta/path, overlay, compiler/dependency, driver and corpus tampering");
  await refuses("same source",()=>c.c.source.production[0].after_sha256=c.c.source.production[0].before_sha256);
  for(const key of ["connected_material_production_delta","complete_delta","real_work_reduction"])await refuses("unreviewed materiality "+key,()=>c.r.judgments[key]=false);
  await refuses("unexplained integration",()=>c.c.source.integration={});note(7,"no same-source eligibility; substantive scope/redundancy is explicit independent review, not a hash claim");
  for(const category of ["history_boundary","isolation","refusal","write","fresh_process","fresh_public","fresh_standalone"])
    await refuses("missing "+category,()=>c.c.coverage.assertions=c.c.coverage.assertions.filter(x=>x.category!==category));
  await refuses("loosen registered bound",()=>c.w[0].owners[0].bound_ms=90000);
  await refuses("self-consistent deadline increase",()=>{const owner=c.c.coverage.owners[0];owner.bound_ms=90000;const reg=JSON.parse(fs.readFileSync(path.join(c.folder,"registration.json")));reg.owner.bound_ms=90000;owner.registration=c.ref("registration.json",reg);c.plan.bound_ms=120000;c.plan.owners=c.c.coverage.owners;c.c.driver.plan=c.ref("plan.json",c.plan);for(const w of c.w){w.owners[0].bound_ms=90000;w.bound_ms=120000;}});
  await refuses("whole owner omitted",()=>{c.c.coverage.owners=[];c.plan.owners=[];c.c.driver.plan=c.ref("plan.json",c.plan);for(const w of c.w)w.owners=[];});
  await refuses("mandatory gap cannot be accepted",()=>c.r.gaps=[{id:"helper",kind:"mandatory_missing",detail:"missing runtime binding"}]);
  await refuses("semantic normalization",()=>c.c.coverage.equivalence.push("semantic_state"));note(8,"history, foreign isolation, refusal/writes/fresh reads, bound and normalization preserved");
  await refuses("no work reduction",()=>c.c.work.after_count=3);await refuses("negative work",()=>c.c.work.after_count=-1);
  await refuses("invented counter",()=>{const t=JSON.parse(fs.readFileSync(path.join(c.folder,"after-trace.json")));t[0].operation="invented";c.w[1].trace=c.ref("after-trace.json",t);});
  await refuses("omitted trace",()=>c.w[0].trace=c.ref("before-trace.json",[]));note(9,"real trace/case/operation correspondence and arithmetic; equal work is not RED");
  await isolated(()=>{c.w[1].result.duration_ms=29751;c.w[1].owners[0].result.duration_ms=29751;c.proof=c.rebuild();assert(read());});note(10,"slower 29751ms sample remains eligible; no latency or timeout-repair claim");
  await refuses("adverse omitted",()=>c.c.observations.adverse.pop());await refuses("historical failure omitted",()=>c.c.observations.historical.pop());
  await refuses("minimum historical row omitted from both declarations",()=>{const h=JSON.parse(fs.readFileSync(path.join(c.folder,"history.json")));h.observations.pop();h.adverse=h.observations.filter(x=>x.adverse).map(x=>x.id).sort();c.c.originals.historical_index=c.ref("history.json",h);c.c.observations.historical=h.observations;c.c.observations.adverse=h.adverse;});
  await refuses("unknown historical role",()=>{const h=JSON.parse(fs.readFileSync(path.join(c.folder,"history.json")));h.observations[0].role="qualification";c.c.originals.historical_index=c.ref("history.json",h);c.c.observations.historical=h.observations;});
  await refuses("false stock replaced",()=>c.c.originals.stock=c.ref("prior-stock.json",{valid:true,issues:[]}));note(11,"known adverse observations and original false stock retained");
  await refuses("missing original",()=>fs.unlinkSync(path.join(c.folder,"prior-completion.json")));
  await refuses("substituted original",()=>c.c.originals.receipt=c.ref("prior-receipt.json",{projection:true}));
  await refuses("start/end drift",()=>c.w[1].end_identity=digest("changed"));await refuses("predates plan",()=>c.w[0].started_at=c.plan.frozen_at);note(12,"original bytes, contemporaneous bindings and chronology");
  for(const patch of [{timed_out:true},{cancelled:true},{signal:"SIGTERM"},{termination_reason:"bounded_timeout"},{streams_closed:false},{cleanup_completed:false},{remaining_owned_processes:1}])
    await refuses("nonnatural "+JSON.stringify(patch),()=>Object.assign(c.w[0].result,patch));
  await refuses("diagnostic success only",()=>c.w[0].owners[0].result.duration_ms=30001);note(13,"natural settlement and complete registered bound required");
  await refuses("UNKNOWN relabeled",()=>c.c.originals.cause="repaired");await refuses("repair claim",()=>c.c.claims.push("timeout_repaired"));note(14,"historical UNKNOWN and disposition are immutable");
  for(const disposition of ["safety_violation","input_invalidation","unclassified_timeout"])
    await refuses(disposition,()=>{const v=JSON.parse(fs.readFileSync(path.join(c.folder,"prior-completion.json")));v.disposition=disposition;c.c.originals.completion=c.ref("prior-completion.json",v);});
  await refuses("incomplete cleanup",()=>{const v=JSON.parse(fs.readFileSync(path.join(c.folder,"prior-completion.json")));v.cleanup_complete=false;c.c.originals.completion=c.ref("prior-completion.json",v);});
  await refuses("older physical tip",()=>write(path.join(c.priorRoot,"attempt-2.json"),{unsettled:true}),{admit:true});note(15,"latest settled ordinary-v2 product failure and cleanup only");
  for(const body of ["ACCEPT","> "+c.a.body,"```\n"+c.a.body+"\n```","DECLINE\n"+c.a.body,c.a.body+"\nREVISE"])
    await refuses("nonoperative",()=>{c.records.acceptance.body=body;},{rebuild:false,admit:true});
  await refuses("oversized operative record",()=>{c.records.acceptance.body+=" ".repeat(65536);},{rebuild:false,admit:true});
  await isolated(async()=>{c.records.pull_request.body="/Users/private/unrelated/"+"x".repeat(70000);c.records.acceptance.unrelated="private";
    const a=await reserve();assert(!JSON.stringify(a).includes("/Users/private"));assert(!Object.hasOwn(a.improvement_authority.records.acceptance,"unrelated"));assert(Buffer.byteLength(JSON.stringify(a))<65536);});
  note(16,"quoted, fenced, generic, declined or competing authority refuses before edge");
  await refuses("self review",()=>c.r.reviewer=c.r.implementation_actor);
  for(const [label,mutate]of [["wrong commit",()=>c.records.acceptance.commit_id=c.base],["wrong PR",()=>c.records.pull_request.number=998],["revoked permission",()=>c.records.acceptance_permission.permission="read"],["edited grant",()=>c.records.grant.updated_at=new Date().toISOString()],["grant before review",()=>c.records.grant.created_at=c.records.grant.updated_at=c.records.acceptance.submitted_at]])
    await refuses(label,mutate,{rebuild:false,admit:true});
  await assert.rejects(()=>reserve({observeRevision:async()=>({authorization:{observations:{}},live:null})}),/capability/);note(17,"independent reviewer, authenticated record/permission/chronology and nonserializable capability");
  await assert.rejects(()=>reserve({branch:"codex/reset-synthetic"}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));
  await isolated(async()=>{const a=await reserve();const r=linked(a);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});
    for(const proof of [c.proof,{...c.proof,kind:"source_revision"},{...c.proof,schema:"augnes.local-canonical-source-correction.v1"},{...c.proof,schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision"},{...c.proof,kind:undefined},null])await assert.rejects(async()=>beginAttempt({...c.request(),sourceCorrection:proof,recoveryProof:proof?null:{schema:"augnes.local-canonical-infrastructure-repair.v1"}}));
    assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).improvement_consumed,true);
  });note(18,"spent successor is terminal across ordinary, reviewed-marker, legacy and recovery entry paths");
  await isolated(async()=>{
    // Actual concurrent children each own a different synthetic checkout. Their
    // immutable target family and physical predecessor are shared. Both await
    // the barrier after validation; exclusive append permits only one winner.
    const raceRoot=path.join(resource.root,"race");fs.mkdirSync(raceRoot);
    const runner=fileURLToPath(new URL("./fixtures/local-canonical-improvement-race.mjs",import.meta.url));
    const promises=[];
    for(let i=0;i<2;i++){
      const checkout=path.join(raceRoot,"checkout-"+i);fs.cpSync(c.checkout,checkout,{recursive:true});fs.unlinkSync(path.join(checkout,".augnes-local-verification/checkout-owner.json"));
      write(path.join(raceRoot,`request-${i}.json`),{checkout,anchor:c.anchor,barrier:raceRoot,index:i,records:c.records,inputs:c.inputs});
      inFlight=true;let output="";promises.push(runCanonicalChild({suite:"improvement",label:"race-"+i,command:process.execPath,args:[runner,path.join(raceRoot,`request-${i}.json`)],cwd:raceRoot,env,timeoutMs:15000,stdout:{write:b=>output+=b},stderr:process.stderr,log(){}}).then(result=>({result,output})));
    }
    const deadline=Date.now()+12000;while(![0,1].every(i=>fs.existsSync(path.join(raceRoot,"ready-"+i)))&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
    write(path.join(raceRoot,"release"),"release");const results=await Promise.all(promises);inFlight=results.some(x=>!x.result.cleanup_completed||!x.result.streams_closed||x.result.remaining_owned_processes);
    assert(!inFlight);assert(results.every(x=>x.result.exit_code===0));const outcomes=results.map(x=>JSON.parse(x.output.trim()));assert.equal(outcomes.filter(x=>x.reserved).length,1);assert.equal(outcomes.filter(x=>!x.reserved&&x.phases===0).length,1);
  });note(19,"two actual validated child contenders produce one exclusive edge and zero loser phases");
  await refuses("preexisting empty target family",()=>fs.mkdirSync(path.join(c.anchor,".augnes-local-verification/families",digest(["augnes.local-canonical-attempt-family.v1","hynk-studio/augnes",c.branch,"verified_source_correction",c.prior.attempt_id,c.head,c.tree]))),{admit:true});
  await isolated(async()=>{const edge=path.join(c.priorRoot,"correction-successor.json");write(edge,"{");await assert.rejects(()=>reserve());assert.equal(fs.readFileSync(edge,"utf8"),"{");});
  await isolated(async()=>{const a=await reserve();const file=path.join(c.anchor,".augnes-local-verification/families",a.family_id,"attempt-1.json");write(file,"{");assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));await assert.rejects(()=>reserve());assert.equal(fs.readFileSync(file,"utf8"),"{");});
  await isolated(async()=>{const a=await reserve();const r=linked(a);finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});const family=path.join(c.anchor,".augnes-local-verification/families",a.family_id);write(path.join(family,"attempt-2.json"),{});assert(!(await inspect(r)));assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));});note(20,"preexisting, malformed and extra physical accounting refuses without reclaim");
  await isolated(async()=>{
    const originalWrite=fs.writeFileSync;
    fs.writeFileSync=function(file,...args){if(String(file).endsWith("attempt-1.json")&&!String(file).includes(c.prior.family_id))throw new Error("synthetic interruption after exclusive edge");return originalWrite(file,...args);};syncBuiltinESMExports();
    try{await assert.rejects(()=>reserve(),/synthetic interruption/);}finally{fs.writeFileSync=originalWrite;syncBuiltinESMExports();}
    assert(fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),/reserved_unsettled/);await assert.rejects(()=>reserve());
  });
  await isolated(async()=>{const a=await reserve();assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),/reserved_unsettled/);const r=linked(a,"user_cancellation");finishAttempt(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:"user_cancellation",cleanupComplete:true});assert(await inspect(r));await assert.rejects(()=>reserve());});note(21,"before-edge refusal consumes none; actual edge-before-attempt interruption and post-attempt interruption remain terminal");
  await isolated(async()=>{await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeImprovement(c.proof,material(),c.transport());write(path.join(c.folder,"after.log"),"changed");return{authorization,live:null};}}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));});
  for(const relative of ["lib/work.mjs","node_modules/compiler/index.js"]){const file=path.join(c.checkout,relative),original=fs.readFileSync(file);try{await assert.rejects(()=>reserve({assertCurrent:()=>assert.deepEqual(fs.readFileSync(file),original),observeRevision:async()=>{const authorization=await authorizeImprovement(c.proof,material(),c.transport());write(file,"late changed source/input");return{authorization,live:null};}}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));}finally{write(file,original);}}
  await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeImprovement(c.proof,material(),c.transport());authorization.records.grant.body+=" edited";return{authorization,live:null};}}));assert(!fs.existsSync(path.join(c.priorRoot,"correction-successor.json")));
  note(22,"mutable evidence is reread after observation and before edge");
  const machine=path.join(resource.root,"machine");fs.mkdirSync(machine);assert.throws(()=>readStockMachineIdentity({attempt:{source_correction:c.proof}},machine));assert.deepEqual(fs.readdirSync(machine),[]);note(23,"missing machine identity refuses with zero stock writes");
  await isolated(async()=>{
    const {receipt:r,context}=await completeSyntheticReceipt(c,reserve);
    const stock=()=>inspectImprovementStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:c.transport()});
    const observed=await stock();assert.equal(observed.currentAttemptRecordsValid,true);
    assert.deepEqual(inspectReceiptForDecision(r,{...context,...observed}).issues,[]);
    for(const mutate of [v=>v.phases.pop(),v=>v.phases.find(p=>p.browser).browser_use.pop(),v=>v.phases[0].cleanup.streams_closed=false,v=>v.cleanup.completed=false,v=>v.cleanup.companion_service.restored=false,v=>v.repository.head_sha=c.base]){
      const v=structuredClone(r);mutate(v);assert.equal(inspectReceiptForDecision(finalizeReceipt(v),{...context,...observed}).valid_deciding_evidence,false);
    }
    assert.throws(()=>createPrivateReviewExport(r),/requires_original/);assert.equal(inspectPrivateReviewExport({attempt:{source_correction:c.proof}}).structurally_valid,false);
    const unavailable=await inspectImprovementStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:{review:async()=>{throw new Error("unavailable");}}});
    const unknown=inspectReceiptForDecision(r,{...context,...unavailable});assert.equal(unknown.dimensions.current_authorization,"unverified");assert.equal(unknown.dimensions.evidence_validity,"valid_in_recorded_context");assert.equal(unknown.valid_deciding_evidence,false);
    c.records.pull_request.head.sha=c.base;const drift=inspectReceiptForDecision(r,{...context,...await stock()});assert.equal(drift.dimensions.current_merge_applicability,"blocked");assert.equal(drift.dimensions.evidence_validity,"valid_in_recorded_context");assert.equal(drift.dimensions.execution,"complete_pass");
    c.records.pull_request.head.sha=c.head;
    for(const relative of ["lib/work.mjs","node_modules/compiler/index.js"]){const file=path.join(c.checkout,relative),bytes=fs.readFileSync(file),transport=c.transport(),first=transport.review;
      transport.review=async(...args)=>{await Promise.resolve();write(file,"late stock mutation");return first(...args);};
      try{const checked=await inspectImprovementStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent:()=>assert.deepEqual(fs.readFileSync(file),bytes),transport});assert.equal(checked.currentAttemptRecordsValid,false);}finally{write(file,bytes);}
    }
    const changedTransport=c.transport(),originalReview=changedTransport.review;changedTransport.review=async(...args)=>{await Promise.resolve();write(path.join(c.folder,"after.log"),"late tamper");return originalReview(...args);};
    const changed=await inspectImprovementStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,runtimeInputs:c.inputs,assertCurrent(){},transport:changedTransport});assert.equal(changed.currentAttemptRecordsValid,false);assert(verifyReceiptIntegrity(r));
    assert.equal(inspectReceiptForDecision(r,{...context,...changed}).dimensions.evidence_validity,"invalid_or_incomplete");
  });
  note(24,"complete synthetic full receipt passes actual stock controls; phase/Browser/cleanup/Companion/source omissions refuse; lossy export refuses");
  note(25,"actual stock separates historical integrity, live authorization and applicability; after-await evidence tampering invalidates physical replay");
  assert.equal(findings.length,25);
  console.log(JSON.stringify({status:"pass",synthetic_only:true,cases:findings,refusals:subcases,qualification:false}));
}finally{
  if(c?.owner)releaseCheckoutVerificationOwnership(c.owner,c.checkout,{consumersSettled:!inFlight});
  if(!inFlight)assert(cleanupCanonicalTestResources([resource]).every(x=>x.completed));
}
