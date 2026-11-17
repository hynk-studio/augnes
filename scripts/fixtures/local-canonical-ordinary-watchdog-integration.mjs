// Disposable ordinary predecessor and authenticated-looking synthetic records.
// Only the existing ledger/readers and one owned fresh stock child are used.
// None of these records is host qualification or real execution authority.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { digest } from "../local-canonical-inputs.mjs";
import { ORDINARY_WATCHDOG_INTEGRATION } from "../local-canonical-ordinary-watchdog-integration.mjs";
import { beginAttempt, finishAttempt, readSourceCorrectionProof, reconstructAttemptTip, inspectAttemptRecords,
  REVIEWED_REVISION_PHASES, observeReviewedIntegrationSource, prepareAcceptedMainIntegrationCandidate,
  integrationTarget, integrationMaterial, authorizeIntegration, INTEGRATION_ACCEPT, INTEGRATION_GRANT } from "../local-canonical-attempts.mjs";
import { gitRevisionInventory } from "../local-canonical-git-observation.mjs";
import { checkoutVerificationFingerprint } from "../local-canonical-checkout-ownership.mjs";
import { buildPhasePlan, inspectIntegrationStock } from "../run-local-canonical-verification.mjs";
import { finalizeReceipt, inspectReceiptForDecision, canonicalSerialize } from "../local-canonical-receipt.mjs";
import { browserConsumersForPhase } from "../local-canonical-browser-identity.mjs";
import { dependencyRecords } from "./local-canonical-browser-successor.mjs";
import { gitFixtureDeclaration } from "./local-canonical-git-observation.mjs";
import { baseReceipt, validContext } from "./local-canonical-receipt-v3.mjs";

const clone=structuredClone,now=()=>new Date().toISOString(),utc=n=>new Date(n).toISOString();
const read=file=>JSON.parse(readFileSync(file,"utf8"));
const product="apps/web_planning/src/exchange-client.js.txt";
const registrationPaths=["scripts/test-local-canonical-review-corrections.mjs","scripts/run-canonical-test-suite.mjs","scripts/local-canonical-closeout-budgets.mjs"];
const transport=records=>({review:async()=>clone(records.acceptance),grant:async()=>clone(records.grant),
  permission:async login=>clone([records.acceptance_permission,records.grant_permission].find(v=>v.user.login===login)),pullRequest:async()=>clone(records.pull_request)});

function service(start,finish) {
  const state={status:"live",checkout_relation:"exact",service_identity:"sha256:"+digest("synthetic retained C1"),
    preservation_valid:true,preservation_binding:digest("synthetic C1 preservation")};
  const observation={contract:"augnes.companion-preservation-observation.v2",samples:1,coherent:true,live_identity_valid:true,
    before_binding:state.preservation_binding,after_binding:state.preservation_binding,repository_observation_before:"observed",repository_observation_after:"observed",
    repository_binding_before:digest("synthetic repository"),repository_binding_after:digest("synthetic repository"),started_at:start,finished_at:finish};
  return {scope:"accepted_checkout_read_only",before:clone(state),after:clone(state),restored:true,maintenance_acquired:false,maintenance_released:true,
    observations:{before:clone(observation),after:clone(observation)}};
}

function fixtureReceipt(c,attempt,declaration,packages,{failure=false,log=null}={}) {
  const r=clone(baseReceipt),finish=now(),start=failure?utc(Date.parse(attempt.started_at)-300000):attempt.started_at;
  const fp=checkoutVerificationFingerprint(c.checkout),invocation=digest(attempt.attempt_id).slice(0,32);
  Object.assign(r.repository,{branch:c.branch,base_sha:c.base,head_sha:attempt.head,tree_sha:attempt.tree});
  Object.assign(r.integration_base,{requested_base_sha:c.base,tested_head_sha:attempt.head,checked_at:start});
  Object.assign(r.integration_base.observation,{sha:c.base,observed_at:start});
  Object.assign(r.evidence,{mode:"full",selected_plan:"full-canonical",planner_plan:"full-canonical",deciding:!failure,transferable:!failure,
    planner_reason:"one_or_more_changes_require_full_canonical",planner_changed_paths:["scripts/fixture.mjs"],planner_change_count:1,
    planner_owner_ids:["local-canonical-integrity"],planner_full_reasons:["fixture_source_change"],planner_targeted_phase_ids:[],
    planner_browser_phase_ids:REVIEWED_REVISION_PHASES.filter(id=>id.startsWith("e2e-"))});
  r.receipt_version=4;r.attempt=attempt;r.run={id:attempt.attempt_id,invocation_id:invocation,started_at:start,finished_at:finish,duration_ms:Date.parse(finish)-Date.parse(start)};
  Object.assign(r.verification_context,{kind:"isolated-worktree",admission:"registered_worktree_of_authorized_mac",checkout_fingerprint:fp});
  const ownership={required:true,acquired:true,released:true,checkout_fingerprint:fp,ownership_id:digest("synthetic owner").slice(0,32),
    acquired_at:start,released_at:finish,failure_code:null};
  r.checkout_ownership=clone(ownership);r.capacity_ownership={...ownership,contract:"augnes.local-canonical-capacity.v1",limit:2,slot:1,invocation_id:invocation};
  r.cleanup={...r.cleanup,completed:true,remaining_owned_processes:0,failure_codes:[],companion_service:service(start,finish),
    isolated_resources:{required:true,prepared:true,completed:true,failure_count:0,failures:[],invocation_id:invocation,
      policy:"private_outer_home_temp_cache_database_runtime",fingerprint:digest("synthetic private resources")}};
  r.historical_inputs={...r.cleanup.isolated_resources,contract:"augnes.local-canonical-historical-inputs.v1",anchor_fingerprint:r.verification_context.anchor_fingerprint,
    source_fingerprint:digest("synthetic historical source"),content_fingerprint:digest("synthetic historical bytes"),unchanged:true,file_count:1,byte_count:1};
  r.inputs={...clone(declaration),fingerprint:digest(declaration),checks:1,events:[],first_fault:null,secondary_faults:[],
    ...(attempt.source_correction?{prepared_dependencies:clone(packages)}:{})};
  Object.assign(r.dependencies,{policy:"clean_npm_ci_root_and_nested",download_cache:"invocation_private_cache_not_authoritative",installed_trees:"replaced_from_lockfiles_by_npm_ci"});
  for(const [i,key]of ["root_lock_sha256","nested_lock_sha256","web_planning_lock_sha256"].entries())r.dependencies[key]=packages[i].before.sources.find(v=>v.name==="package-lock.json").sha256;
  const executable=declaration.resources.find(v=>v.id==="browser-executable"),browser={contract:"augnes.local-canonical-browser-use.v2",executable_name:"Fixture",
    location_fingerprint:executable.location_fingerprint,before:executable.before,after:executable.before,actual_version:"Chrome/1",
    runtime_versions:{http:"Chrome/1",cdp:"Chrome/1"},disposition:"unchanged",unchanged:true};
  r.phases=buildPhasePlan({mode:"full",selectedPlan:"full-canonical",baseSha:c.base,headSha:attempt.head}).map((phase,i)=>{
    const unused=failure&&i>6,failed=failure&&i===6;
    return {...clone(baseReceipt.phases[0]),id:phase.id,label:phase.label,command:phase.display,cwd_scope:phase.cwdScope,exclusive:phase.exclusive,
      browser:phase.browser,base_sha:phase.browser?c.base:null,head_sha:phase.browser?attempt.head:null,
      status:unused?"not_run":failed?"failure":"pass",exit_status:unused?null:failed?1:0,timed_out:false,spawn_error_code:null,
      started_at:unused?null:start,finished_at:unused?null:finish,duration_ms:unused?null:failed?21175:0,
      failure_code:unused?"phase_not_run":failed?"phase_failed":null,invocation_id:invocation,environment_fingerprint:unused?null:digest(phase.id),
      cleanup:unused?{completed:false,remaining_owned_processes:null,exit_observed:false,streams_closed:false,termination_reason:null,listener_residue_count:null}:
        {completed:true,remaining_owned_processes:0,exit_observed:true,streams_closed:true,termination_reason:"natural_exit",listener_residue_count:0},
      log:failed?{relative_path:`.augnes-local-verification/logs/${attempt.attempt_id}/authority.log`,bytes:Buffer.byteLength(log),truncated:false}:
        {relative_path:null,bytes:0,truncated:false},
      browser_use:unused?[]:Object.entries(browserConsumersForPhase(phase.id)).flatMap(([consumer,count])=>Array.from({length:count},()=>({...browser,consumer}))) };
  });
  r.outcome={disposition:failure?"product_failure":"completed_success",first_fault:null,safety:"preserved_within_observed_scope",validity:"valid_within_observed_scope",execution:failure?"incomplete_or_failed":"complete_pass"};
  r.final={...r.final,result:failure?"failure":"pass",exit_status:failure?1:0,reason_codes:failure?["phase_failed","selected_phases_incomplete"]:[]};
  return finalizeReceipt(r);
}

function stockContext(c,receipt,packages) {
  const at=now();
  return {...clone(validContext),currentVerificationContext:receipt.verification_context,expectedRunId:receipt.run.id,currentCheckoutFingerprint:receipt.verification_context.checkout_fingerprint,
    currentIdentity:{...validContext.currentIdentity,head_sha:receipt.repository.head_sha,branch:c.branch},currentExecutorFingerprint:receipt.executor.source_fingerprint,
    expectedPhaseIds:REVIEWED_REVISION_PHASES,expectedSelectedPlan:"full-canonical",expectedOwnerIds:receipt.evidence.planner_owner_ids,currentInputStateValid:true,
    currentIntegrationBase:{...receipt.integration_base,checked_at:at,observation:{...receipt.integration_base.observation,observed_at:at}},
    currentLocks:Object.fromEntries(["root","nested","webPlanning"].map((name,i)=>[name,packages[i].before.sources.find(v=>v.name==="package-lock.json").sha256]))};
}

async function cold(packet) {
  const c=read(packet),receipt=read(c.receipt),proof=readSourceCorrectionProof(c.file,c.checkout);
  const observed=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){},transport:transport(c.records)});
  assert.equal(observed.currentAttemptRecordsValid,true);
  const stock=inspectReceiptForDecision(receipt,{...c.context,...observed});
  assert.equal(stock.valid_deciding_evidence,true,JSON.stringify(stock.issues));
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:proof.branch});
  assert.equal(tip.attempt_id,receipt.run.id);
  assert(tip.historical_grants.some(v=>v.kind==="ordinary_initial"&&v.grant.id===c.originalCommission));
  assert(tip.historical_grants.some(v=>v.kind==="accepted_main_integration"&&v.grant.id===c.records.grant.id));
  assert.equal(tip.historical_grants.filter(v=>v.kind==="ordinary_initial").length,1);
  writeFileSync(c.output,canonicalSerialize(stock),{mode:0o600});
}

export async function runOrdinaryWatchdogIntegrationControls(c,h) {
  let refusals=0;const git=(...args)=>c.git(args).toString().trim(),commit=()=>git("-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic ordinary integration support");
  const sourceRoot=new URL("../",import.meta.url),originalBranch=c.branch;
  c.branch="codex/ordinary-watchdog-integration";git("checkout","-b",c.branch,c.base);
  h.write(path.join(c.checkout,".git/info/exclude"),".augnes-local-verification/\nnode_modules/\n");
  git("remote","add","origin","https://github.com/hynk-studio/augnes.git");
  const sources=Object.fromEntries(registrationPaths.map(file=>[file,readFileSync(new URL(file.slice("scripts/".length),sourceRoot),"utf8")]));
  for(const [file,source]of Object.entries(sources))h.write(path.join(c.checkout,file),file.endsWith("closeout-budgets.mjs")?source.replaceAll("3_600_000","20_000").replaceAll("3_900_000","30_000"):source);
  h.write(path.join(c.checkout,product),"export const productBehavior = 'preserved';\n");
  dependencyRecords(c,c.checkout);git("add","scripts","apps","package.json","package-lock.json");commit();
  const predecessorHead=git("rev-parse","HEAD"),predecessorTree=git("rev-parse","HEAD^{tree}");
  c.acceptedHead=predecessorHead;c.acceptedTree=predecessorTree;c.gitDeclaration=gitFixtureDeclaration(c);
  const declaration=(head,tree)=>({...clone(c.gitDeclaration),binding:{head,tree,executor_fingerprint:baseReceipt.executor.source_fingerprint,runtime_inputs:clone(c.inputs),
    environment_keys:["AUGNES_CANONICAL_NODE_HEADERS","AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT","npm_config_nodedir","AUGNES_BROWSER_EXECUTABLE_PATH"],
    phase_environment_fingerprints:REVIEWED_REVISION_PHASES.map(id=>({id,fingerprint:digest(id)}))}});
  const beforeDeclaration=declaration(predecessorHead,predecessorTree),beforePackages=dependencyRecords(c,c.checkout);
  const predecessor=beginAttempt({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:predecessorHead,tree:predecessorTree,
    runId:"synthetic-ordinary-watchdog",contractFingerprint:digest(beforeDeclaration)});
  const log='Synthetic retained child result; no historical child is executed.\n[canonical:authority] child_start label="reviewed revision controls: revision" timeout_ms=30000\nAUGNES_REVIEW_CHILD_RESULT '+JSON.stringify({control_id:"reviewed-revision",exit_code:null,signal:"SIGTERM",timed_out:true,
    cancelled:false,spawn_error_code:null,duration_ms:20102,termination_reason:"bounded_timeout",exit_observed:true,streams_closed:true,cleanup_started:true,cleanup_completed:true,remaining_owned_processes:0,last_progress:null})+
    '\n[canonical:authority] child_result label="reviewed revision controls: revision" duration_ms=21175 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n';
  const originalLog=path.join(c.checkout,".augnes-local-verification/logs",predecessor.attempt_id,"authority.log");h.write(originalLog,log);
  const prior=fixtureReceipt(c,predecessor,beforeDeclaration,beforePackages,{failure:true,log});h.storeReceipt(c,prior);
  finishAttempt(predecessor,{receiptFingerprint:prior.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  const ledger=path.join(c.anchor,".augnes-local-verification/families",predecessor.family_id),completionFile=path.join(ledger,"completion-1.json"),edge=path.join(ledger,"correction-successor.json");
  const completion=read(completionFile),priorFile=path.join(c.checkout,".augnes-local-verification/receipts",prior.run.id+".json"),originalFiles=new Map();
  const capture=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())capture(file);else originalFiles.set(file,readFileSync(file));}};
  capture(ledger);originalFiles.set(priorFile,readFileSync(priorFile));originalFiles.set(originalLog,readFileSync(originalLog));
  const beforeStock=inspectReceiptForDecision(prior,{...stockContext(c,prior,beforePackages),currentAttemptRecordsValid:true});
  assert.equal(beforeStock.valid_deciding_evidence,false);assert.equal(beforeStock.issues.length,14,JSON.stringify(beforeStock.issues));
  const baseline=c.base;
  git("checkout","-b","synthetic-adopted-main",baseline);
  for(const [file,source]of Object.entries(sources))h.write(path.join(c.checkout,file),source);
  git("add",...registrationPaths);commit();const main=git("rev-parse","HEAD");
  git("checkout",c.branch);try{git("merge","--no-ff","--no-commit",main);}catch{/* Both sides intentionally add the same bounded registrations. */}
  for(const [file,source]of Object.entries(sources))h.write(path.join(c.checkout,file),source);
  git("add",...registrationPaths);commit();const merge=git("rev-parse","HEAD");
  const support="scripts/local-canonical-ordinary-support-fixture.mjs";
  h.write(path.join(c.checkout,support),"export const successorSupport = 'first';\n");git("add",support);commit();
  h.write(path.join(c.checkout,support),"export const successorSupport = 'complete';\n");git("add",support);commit();
  const head=git("rev-parse","HEAD"),tree=git("rev-parse","HEAD^{tree}");c.base=main;c.head=head;c.tree=tree;
  git("update-ref","refs/remotes/origin/main",main);git("update-ref","refs/remotes/origin/"+c.branch,head);
  const folder=path.join(c.checkout,".augnes-local-verification/ordinary-integration"),file=path.join(folder,"proof.json");
  const ref=(name,value)=>{const target=path.join(folder,name);h.write(target,typeof value==="string"||Buffer.isBuffer(value)?value:canonicalSerialize(value));return{artifact:name,sha256:digest(readFileSync(target))};};
  const packages=dependencyRecords(c,c.checkout).map(v=>({...v,prerequisite:clone(v.before)})),currentDeclaration=declaration(head,tree);
  const inventory={...currentDeclaration,fingerprint:digest(currentDeclaration),checks:1,events:[],first_fault:null,secondary_faults:[],prepared_dependencies:packages};
  const svc=prior.cleanup.companion_service,live={inventory:gitRevisionInventory(inventory),inputInventory:inventory,service:{state:clone(svc.after),diagnostics:{...clone(svc.observations.after),finished_at:now()}}};
  const refresh=()=>{live.service.diagnostics.finished_at=now();return live;};
  const user={login:"synthetic-owner",id:1,type:"User"},permission={permission:"admin",user},url="https://api.github.com/repos/hynk-studio/augnes";
  const mapping={target:{repository:"hynk-studio/augnes",origin:"https://github.com/hynk-studio/augnes.git",pull_request:999,branch:c.branch,base:prior.repository.base_sha,head:predecessorHead,tree:predecessorTree},
    replacement_family:{family_id:predecessor.family_id},mapping_semantics:{physical_successor_edge:null,physical_historical_records_modified:false,cross_family_lineage_machine_acceptance:false},
    history:{all_old_grants_carry_over_to_new_family:false},old_family_tip:{revision_grants:[1001]},old_tip_identity:{commission:1001,consumed:1,maximum:1,remaining:0}};
  const mappingRef=ref("manual-mapping.json",mapping),created=utc(Date.now()-600000);
  const original={id:2001,user,author_association:"OWNER",issue_url:url+"/issues/999",created_at:created,updated_at:created,
    body:["Synthetic retained ordinary initial commission.",...Object.values(mapping.target),predecessor.family_id,mappingRef.sha256,
      "Maximum: one admitted deciding invocation. No recovery, second initial invocation, automatic renewal or branch-family reset."].join("\n")};
  const amendmentTime=utc(Date.now()-500000),amendment={...original,id:2002,created_at:amendmentTime,updated_at:amendmentTime,
    body:["Synthetic prospective preparation amendment.",...Object.values(mapping.target),String(original.id),digest(original.body),mappingRef.sha256,
      "This amendment adds no invocation. Combined invocation maximum under the original commission and this amendment: 1"].join("\n")};
  const oldRows=[{id:1000,current_body_sha256:digest("superseded original"),consumed_in_physical_branch_lineage:0,superseded_by:1001,combined_maximum_invocations:1,combined_consumed:1,current_remaining:0},
    {id:1001,current_body_sha256:digest("spent old grant"),consumed_in_physical_branch_lineage:1,maximum_invocations:1,current_remaining:0}];
  const settlement={accepted_mapping:{sha256:mappingRef.sha256},old_grants:oldRows,old_grants_issued:2,old_grants_physically_consumed:1,old_superseded_grants:1,
    new_commission:{id:original.id,amendment:amendment.id,amendment_adds_allowance:false,combined_maximum_invocations:1,consumed:1,remaining:0,attempt_id:predecessor.attempt_id,
      physical_completion_file_sha256:digest(readFileSync(completionFile))},cross_family_physical_edge:null,no_old_records_modified:true};
  const permissionRef=ref("original-permission.json",permission),accounting={schema:"augnes.local-canonical-ordinary-watchdog-accounting.v1",
    commission:ref("original-commission.json",original),permission:permissionRef,amendments:[{record:ref("original-amendment.json",amendment),permission:permissionRef}],
    mapping:mappingRef,settlement:ref("original-settlement.json",settlement)};
  const predecessorRefs={stock:ref("original-false-stock.json",beforeStock),log:ref("original-authority.log",log),accounting:ref("original-accounting.json",accounting)};
  let p={schema:"augnes.local-canonical-source-correction.v2",kind:"accepted_main_integration",integration_case:"reviewed",branch:c.branch,base:main,accepted_main:main,head,tree,pull_request:999,
    prior_family_id:predecessor.family_id,prior_number:1,prior_attempt_id:predecessor.attempt_id,prior_receipt_fingerprint:prior.integrity.content_fingerprint,prior_receipt_path:path.relative(c.checkout,priorFile),
    integration:{...observeReviewedIntegrationSource(c.checkout,{predecessor:predecessorHead,acceptedMain:main,commit:merge,head}),predecessor_basis:ORDINARY_WATCHDOG_INTEGRATION},
    planner:ref("planner.json",{base:main,head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["local-canonical-integrity"]}),review:null,budget:{initial:1,recovery:0},authorization:null};
  const preparation={schema:"augnes.local-canonical-integration-preparation.v1",target:integrationTarget(p),checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),runtime_inputs:clone(c.inputs),
    input_inventory:inventory,inventory_sha256:live.inventory,dependencies:packages.map(v=>v.before)};
  await delay(2);
  let review={schema:"augnes.local-canonical-candidate-review.v1",kind:p.kind,head,tree,predecessor_head:predecessorHead,predecessor_tree:predecessorTree,source_review:"complete",
    delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",predecessorHead,head,"--"])),changed_paths:git("diff","--name-only",predecessorHead,head,"--").split("\n").sort(),
    authority_reference:"https://github.com/hynk-studio/augnes/pull/999",reviewed_at:now(),integration_sha256:digest(p.integration),planner_sha256:p.planner.sha256,
    reviewer:"synthetic-separate-reviewer",implementation_actor:"synthetic-implementer",no_write:true,disposition:"accept",judgments:Object.fromEntries(
      "complete_integration complete_overlaps complete_corrections verifier_policy_adjustments_only affected_consumers authority_and_lineage no_weakened_contract complete_nonoverlap_adjustments complete_correction_chain settled_watchdog_evidence adopted_watchdog_conditions".split(" ").map(key=>[key,true])),
    ordinary_watchdog_predecessor:predecessorRefs,preparation:ref("preparation.json",preparation),report:null};
  let proof;
  const rebuild=()=>{review.integration_sha256=digest(p.integration);review.report=ref("review.md",`Synthetic independent source review ${p.head} ${p.tree} ${digest(p.integration)} ${review.delta_sha256}\n`);p.review=ref("review.json",review);h.write(file,canonicalSerialize(p));proof=readSourceCorrectionProof(file,c.checkout);};
  const prepare=()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main,runtimeInputs:c.inputs,live:refresh()});
  const request=extra=>({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head,tree,acceptedMain:main,runId:"synthetic-reviewed-ordinary-integration",
    contractFingerprint:digest(currentDeclaration),sourceCorrection:proof,revisionInputs:c.inputs,revisionLive:refresh(),assertCurrent(){},...extra});
  const noEdge=()=>assert(!existsSync(edge));rebuild();
  const prepared=prepare();assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.equal(prepared.eligible_evidence,true);noEdge();
  const goodP=clone(p),goodReview=clone(review),restore=()=>{p=clone(goodP);review=clone(goodReview);rebuild();};
  const reject=mutate=>{try{mutate();assert.throws(()=>{rebuild();prepare();});noEdge();refusals++;}finally{restore();}};
  for(const mutate of [()=>delete p.integration.predecessor_basis,()=>p.integration.predecessor_basis="unknown",()=>p.kind="verifier_correction",()=>p.integration_case="unknown",
    ()=>p.prior_attempt_id="older-tip",()=>p.integration.correction_chain.pop(),()=>p.integration.correction_chain[0].parent=main,
    ()=>review.judgments.settled_watchdog_evidence=false,()=>review.judgments.adopted_watchdog_conditions=false,()=>delete review.ordinary_watchdog_predecessor,
    ()=>review.ordinary_watchdog_predecessor.stock=ref("wrong-stock.json",{...beforeStock,valid_deciding_evidence:true}),
    ()=>review.ordinary_watchdog_predecessor.log=ref("natural-red.log",log.replace('"timed_out":true','"timed_out":false')),
    ()=>review.preparation=ref("stale-preparation.json",{...preparation,inventory_sha256:digest("stale inventory")})])reject(mutate);
  // Rehash each deliberately wrong authority/history artifact through its full
  // envelope. These exercise semantic refusals, rather than stale-ref failures.
  for(const change of [
    value=>value.permission=ref("wrong-original-permission.json",{...permission,permission:"read"}),
    value=>value.commission=ref("wrong-original-commission.json",{...original,body:"unrelated authority"}),
    value=>value.amendments[0].record=ref("wrong-original-amendment.json",{...amendment,created_at:utc(Date.parse(predecessor.started_at)+1000),updated_at:utc(Date.parse(predecessor.started_at)+1000)}),
    value=>value.settlement=ref("wrong-original-consumption.json",{...settlement,new_commission:{...settlement.new_commission,remaining:1}}),
    value=>value.settlement=ref("wrong-original-completion-hash.json",{...settlement,new_commission:{...settlement.new_commission,physical_completion_file_sha256:digest("other completion bytes")}}),
  ])reject(()=>{const value=clone(accounting);change(value);review.ordinary_watchdog_predecessor.accounting=ref("wrong-accounting.json",value);});
  for(const patch of [{cleanup_complete:false},{disposition:"completed_success"},{infrastructure_code:"external"}]) {
    const saved=readFileSync(completionFile);try{h.write(completionFile,{...completion,...patch});assert.throws(prepare);noEdge();refusals++;}finally{h.write(completionFile,saved);}
  }
  for(const [target,bytes]of [[originalLog,Buffer.from(log.replace('"SIGTERM"','"SIGKILL"'))],
    [completionFile,Buffer.concat([readFileSync(completionFile),Buffer.from("\n")])]]) {
    const saved=readFileSync(target);try{h.write(target,bytes);assert.throws(prepare);noEdge();refusals++;}finally{h.write(target,saved);}
  }
  const settledBytes=readFileSync(completionFile);rmSync(completionFile);
  try{assert.throws(prepare);noEdge();refusals++;}finally{h.write(completionFile,settledBytes);}
  const competing=path.join(ledger,"attempt-2.json");h.write(competing,{...predecessor,number:2});try{assert.throws(prepare);noEdge();refusals++;}finally{rmSync(competing);}
  assert.throws(()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main,runtimeInputs:c.inputs,live:{...refresh(),inventory:digest("changed current inputs")}}));refusals++;
  h.write(path.join(c.checkout,product),"export const unrelatedProductChange=true;\n");git("add",product);commit();
  const outside=git("rev-parse","HEAD");assert.throws(()=>observeReviewedIntegrationSource(c.checkout,{predecessor:predecessorHead,acceptedMain:main,commit:merge,head:outside}),{code:"integration_verifier_scope_invalid"});refusals++;
  git("reset","--hard",head);
  await delay(2);const acceptedAt=now();await delay(2);const grantedAt=now(),common={target:integrationTarget(p),review_sha256:p.review.sha256};
  const acceptance={id:3001,user,author_association:"OWNER",state:"COMMENTED",commit_id:head,pull_request_url:url+"/pulls/999",submitted_at:acceptedAt,
    body:INTEGRATION_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:review.report.sha256,scope:"reviewed_integration"})};
  const acceptanceObservation={id:acceptance.id,author:user.login,author_id:user.id,body_sha256:digest(acceptance.body),timestamp:acceptedAt,role:"accepted_integration",commit_id:head};
  const grantValue={...common,acceptance_sha256:digest(acceptanceObservation),planner_sha256:p.planner.sha256,maximum_invocations:1,recovery:0,unchanged_retry:0,
    stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:"accept_once_under_unchanged_bounds",
    starts_at:grantedAt,expires_at:utc(Date.parse(grantedAt)+3600000)};
  const grant={id:3002,user,author_association:"OWNER",issue_url:url+"/issues/999",created_at:grantedAt,updated_at:grantedAt,body:INTEGRATION_GRANT+"\n"+canonicalSerialize(grantValue)};
  const branch=(sha,ref)=>({sha,ref,repo:{full_name:"hynk-studio/augnes"}}),records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,
    pull_request:{number:999,state:"open",draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(main,"main")}};
  const bind=()=>{p.authorization={acceptance_review_id:acceptance.id,acceptance_review_sha256:digest(acceptanceObservation),grant_comment_id:grant.id,
    grant_comment_sha256:digest({id:grant.id,author:user.login,author_id:user.id,body_sha256:digest(grant.body),timestamp:grantedAt,role:"prospective_grant",commit_id:null})};rebuild();};
  bind();await delay(2);
  const reserve=async extra=>beginAttempt(request({observeRevision:async()=>({authorization:await authorizeIntegration(proof,integrationMaterial(c.checkout,proof,c.anchor),transport(records)),live:refresh()}),...extra}));
  for(const id of [1000,1001,original.id,amendment.id]){grant.id=id;bind();await assert.rejects(()=>reserve());noEdge();refusals++;}grant.id=3002;bind();
  for(const mutate of [()=>records.grant_permission={...permission,permission:"read"},()=>records.acceptance.commit_id=main,
    ()=>grant.body=INTEGRATION_GRANT+"\n"+canonicalSerialize({...grantValue,expires_at:grantedAt}),
    ()=>grant.body=INTEGRATION_GRANT+"\n"+canonicalSerialize({...grantValue,starts_at:utc(Date.parse(grantedAt)+3600000),expires_at:utc(Date.parse(grantedAt)+7200000)})]) {
    const saved=clone(records);try{mutate();bind();await assert.rejects(()=>reserve());noEdge();refusals++;}finally{Object.assign(records,saved);Object.assign(grant,saved.grant);Object.assign(acceptance,saved.acceptance);records.grant=grant;records.acceptance=acceptance;bind();}
  }
  const outcomes=await Promise.allSettled([reserve(),reserve()]);assert.equal(outcomes.filter(v=>v.status==="fulfilled").length,1);assert.equal(outcomes.filter(v=>v.status==="rejected").length,1);
  const admitted=outcomes.find(v=>v.status==="fulfilled").value;assert.deepEqual(admitted.budget,{initial:1,recovery:0});
  const receipt=fixtureReceipt(c,admitted,currentDeclaration,packages);h.storeReceipt(c,receipt);finishAttempt(admitted,{receiptFingerprint:receipt.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});
  assert.equal(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}),true);
  const packet=path.join(folder,"cold-packet.json"),output=path.join(folder,"fresh-stock.json");
  h.write(packet,{checkout:c.checkout,anchor:c.anchor,file,receipt:path.join(c.checkout,".augnes-local-verification/receipts",receipt.run.id+".json"),records,context:stockContext(c,receipt,packages),originalCommission:original.id,output});
  const child=await h.run({command:process.execPath,args:[fileURLToPath(import.meta.url),"--cold",packet],cwd:c.checkout,env:c.env,suite:"reviewed-revision",label:"ordinary watchdog integration fresh stock",timeoutMs:120000,stdout:{write(){}},stderr:process.stderr});
  assert.equal(child.exit_code,0);assert(child.cleanup_completed&&child.exit_observed&&child.streams_closed&&child.remaining_owned_processes===0);assert.equal(read(output).valid_deciding_evidence,true);
  await assert.rejects(()=>reserve());assert.throws(prepare);refusals+=2;
  const changed=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){throw Error("synthetic stale current inputs");},transport:transport(records)});
  assert.equal(changed.currentAttemptRecordsValid,true);assert.equal(inspectReceiptForDecision(receipt,{...stockContext(c,receipt,packages),...changed}).valid_deciding_evidence,false);
  for(const [originalFile,bytes]of originalFiles)assert(readFileSync(originalFile).equals(bytes),"synthetic predecessor originals remain unchanged");
  console.log(JSON.stringify({ordinary_watchdog_integration:{synthetic_only:true,predecessor_basis:ORDINARY_WATCHDOG_INTEGRATION,positive_preparation:true,authorized_reservation:true,
    support_descendants:p.integration.correction_chain.length,original_stock_issues:beforeStock.issues.length,historical_cause:"UNKNOWN",original_commission_consumed:1,original_commission_remaining:0,
    refusals,competing_exclusive_reservations:true,cold_lineage:true,fresh_stock:true,originals_unchanged:true,budget:{initial:1,recovery:0}}}));
  // The common harness owns checkout/resource cleanup. Synthetic failed history,
  // successful receipt and its exclusive edge stay intact until that cleanup.
  assert.notEqual(c.branch,originalBranch);
}

if(process.argv[1]===fileURLToPath(import.meta.url)&&process.argv[2]==="--cold")await cold(process.argv[3]);
