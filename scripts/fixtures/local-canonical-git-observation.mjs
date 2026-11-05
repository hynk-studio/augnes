// Synthetic Git, ledger and authenticated read transport. No production admission.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { digest, INPUT_CONTRACT, inputEventIdentity } from "../local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "../local-canonical-environment.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { REVIEWED_REVISION_PHASES, inspectGitRevisionPreparation, readSourceCorrectionProof, reviewedRevisionAuthorityObservation } from "../local-canonical-attempts.mjs";
import { gitObservationIncident, gitRevisionInventory, gitReviewTarget } from "../local-canonical-git-observation.mjs";

const time = offset => new Date(Date.now() + offset).toISOString();
const product = "apps/web_planning/src/client.js.txt", fixture = "scripts/fixture.mjs";
const phaseIds = REVIEWED_REVISION_PHASES;

export function gitFixtureDeclaration(c) {
  const node = c.inputs.node;
  const config = { ...structuredClone(node.observation), git_projection:{policy:"isolated-current-branches-v1", applicable:true,
    effective_sha256:digest("original effective config"), scope_fingerprint:digest("branches")} };
  const resource = (id, before) => ({id, classification:"execution", location_fingerprint:digest(id), before});
  return {contract:INPUT_CONTRACT, path_kind:"isolated-model-free-v1", binding:{head:c.acceptedHead},
    resources:[{...resource("git-config",config),gitTracking:{policy:"isolated-current-branches-v1",protected_branches:[digest(c.branch)]}},
      ...["node-executable","git-executable","browser-executable"].map(id=>resource(id,node.observation)),
      {...resource("node-headers",c.inputs.headers.observation),nodeHeaders:true}]};
}

export function gitFixtureReceipt(c, raw) {
  const declared = c.gitDeclaration, config = structuredClone(declared.resources[0].before);
  config.sha256 = digest("changed file"); config.git_projection.effective_sha256 = digest("changed protected projection");
  const diagnostic = {contract:"augnes.input-observation-failure.v1",stage:"metadata_consistency",code:"input_observation_race"};
  const event = (disposition, offset, ns, after, extra) => {
    const v = {resource:"git-config",classification:"execution",disposition,observed_at:time(offset),monotonic_ns:ns,after,...extra};
    return {...v,identity:inputEventIdentity(v)};
  };
  const race = event("observer_failure",-84000,"11",null,{diagnostic}), change = event("input_invalidation",-83000,"12",config);
  const fault = ({resource,disposition,observed_at,monotonic_ns,diagnostic}) => ({resource,disposition,observed_at,monotonic_ns,...(diagnostic?{diagnostic}:{})});
  const [pass,stop,unused] = raw.phases;
  return finalizeReceipt({...raw,run:{...raw.run,started_at:time(-100000)},phases:phaseIds.map((id,i)=>({...(i < 3 ? pass : i === 3 ? stop : unused),id})),
    inputs:{...declared,fingerprint:digest(declared),events:[race,change],first_fault:fault(race),secondary_faults:[fault(change)]},
    outcome:{...raw.outcome,disposition:"unknown_relevance",first_fault:fault(race)}});
}
export async function runGitRevisionControls(c,h) {
  const original=c.prior, ledger=path.join(c.legacyRoot,"completion-1.json"), edge=path.join(c.legacyRoot,"correction-successor.json");
  const completion=h.read(ledger), issues=["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding","receipt_phase_environment_binding_invalid",
    ...phaseIds.slice(3).map(id=>"phase_not_passing:"+id)];
  const stock={content_fingerprint:original.integrity.content_fingerprint,status:"non_deciding_or_stale",valid_deciding_evidence:false,issues,
    dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"}};
  const incident = (r=original,s=stock) => gitObservationIncident(r,r.attempt,completion,s,phaseIds);
  for(const mutate of [r=>r.inputs.events[0].diagnostic.stage="metadata_open",r=>r.inputs.events[0].resource="unrelated",
    r=>r.inputs.events.pop(),r=>r.inputs.events[1].after.git_projection.effective_sha256=r.inputs.resources[0].before.git_projection.effective_sha256,
    r=>r.inputs.secondary_faults=[],r=>r.checkout_ownership.released=false,r=>r.cleanup.companion_service.observations.after.coherent=false,
    r=>r.phases[4].browser_use=[{}],r=>r.phases[3].cleanup.remaining_owned_processes=1]){
    const r=structuredClone(original);mutate(r);for(const e of r.inputs.events)e.identity=inputEventIdentity(e);assert.throws(()=>incident(r));
  }
  assert.throws(()=>incident(original,{...stock,issues:issues.slice(1)}));
  const declaration=c.gitDeclaration, inventory=gitRevisionInventory(declaration);
  const changed=structuredClone(declaration);changed.resources[0].before.sha256=digest("raw edit");
  assert.notEqual(gitRevisionInventory(changed),inventory);
  for(const resources of [declaration.resources.slice(1),[...declaration.resources,declaration.resources[0]]])
    assert.throws(()=>gitRevisionInventory({...declaration,resources}));
  c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  h.prepare(c);const p=c.proof;
  p.schema="augnes.local-canonical-source-correction.v10";
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(stock));
  p.inputs.predecessor_sha256=digest(incident());p.inputs.inventory_sha256=inventory;
  const get=ref=>h.read(path.join(c.artifacts,ref.artifact)), blob=(head,name)=>c.git(["show",head+":"+name]);
  const source=get(p.source);source.reviewed_at=time(-16000);p.source=h.artifact(c,p.source.artifact,source);
  const focus=get(p.focused), command=focus.commands[0], previous=original.attempt.head;
  focus.input_remedy_resources=[];focus.finished_at=time(-10000);focus.implicated_paths.push(product);
  const bytes=blob(c.head,product);focus.source_files.push({path:product,byte_size:bytes.length,sha256:digest(bytes)});
  const witness=(head,exit,offset)=>({head,tested_source_head:head,finished_at:time(offset),environment:digest("fixture host"),
    fixture_sha256:digest(blob(c.head,fixture)),modules:[{path:product,sha256:digest(blob(head,product))}],command:command.command,
    node_version:CANONICAL_NODE_VERSION,result:{...command.result,exit_code:exit},stdout:h.artifact(c,"stdout-"+exit+".log",exit?"synthetic assertion failed\n":"synthetic assertion passed\n")});
  const red=witness(previous,1,-15000),green=witness(c.head,0,-11000);
  const retain=(name,value)=>h.artifact(c,name+".json",value);
  focus.regression={path:fixture,before:retain("red",red),after:retain("green",green)};
  Object.assign(command,{record:focus.regression.after,stdout:green.stdout,tested_source_head:c.head});
  p.focused=retain("focused",focus);
  const svc=original.cleanup.companion_service;
  c.live={inventory,service:{state:svc.after,diagnostics:{...svc.observations.after,finished_at:time(-50)}}};
  const material=structuredClone(p);delete material.accepted.review;delete material.authorization;
  const prep=path.join(c.artifacts,"preparation.json");h.write(prep,material);
  const args={file:prep,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live};
  assert.deepEqual(inspectGitRevisionPreparation(args).target,gitReviewTarget(p));assert.throws(()=>readSourceCorrectionProof(prep,c.checkout));
  assert.throws(()=>inspectGitRevisionPreparation({...args,live:{...c.live,inventory:digest("changed")}}));
  h.write(prep,{...material,prior_attempt_id:"stale-tip"});assert.throws(()=>inspectGitRevisionPreparation(args));h.write(prep,material);
  for(const mutate of [w=>w.tested_source_head=c.head,w=>delete w.tested_source_head,w=>w.modules[0].sha256=digest("different source"),w=>w.fixture_sha256=digest("wrong regression"),w=>w.result.exit_code=0]){
    const bad=structuredClone(red);mutate(bad);
    h.write(prep,{...material,focused:retain("bad-focus",{...focus,regression:{...focus.regression,before:retain("bad-red",bad)}})});
    assert.throws(()=>inspectGitRevisionPreparation(args),/revision_git_regression_invalid/);
  }
  h.write(prep,material);
  const {review,grant}=c.authority;
  const target=gitReviewTarget(p);
  review.body=["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,target].join("\n");
  review.submitted_at=time(-8000);grant.created_at=grant.updated_at=time(-5000);
  grant.body=["Authorize prospective Mac qualification of this reviewed Git-observation successor.",p.schema,p.branch,p.base,p.head,p.tree,p.prior_receipt_fingerprint,target,"https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10",
    "Separate fresh-process stock and independent audit."].join("\n");
  const bind=()=>{p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"));
    p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));h.write(c.file,p);};
  const reviewBody=review.body,grantBody=grant.body;
  for (const bad of ["Source review decision: HOLD. Example for a later review:\n~~~text\n"+reviewBody+"\n~~~","> "+reviewBody,reviewBody.replace(p.head,"a".repeat(40))]){
    review.body=bad;bind();await assert.rejects(h.auth(c,h.proof(c)),/revision_authority_scope_invalid/);
  }
  review.body=reviewBody;
  for(const bad of ["Execution denied. A future commission might read:\n~~~text\n"+grantBody+"\n~~~","> "+grantBody,grantBody.replace(target,"")]){
    grant.body=bad;bind();await assert.rejects(h.auth(c,h.proof(c)),/revision_authority_scope_invalid/);
  }
  grant.body=grantBody;bind();const proof=h.proof(c),cap=await h.auth(c,proof);
  assert.throws(()=>h.begin(c,proof,{observations:cap.observations}));
  assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("unstable")}}),/revision_git_target_unverified/);
  const ledgerBytes=readFileSync(ledger);h.write(ledger,JSON.stringify(completion,null,2));
  try{assert.throws(()=>h.begin(c,proof,cap),/revision_original_ledger_changed/);}finally{h.write(ledger,ledgerBytes);}
  assert(!existsSync(edge));const a=h.begin(c,proof,cap);
  assert.throws(()=>h.begin(c,proof,cap));const result=h.receipt(c,a,"completed_success");h.storeReceipt(c,result);
  h.finish(a,{receiptFingerprint:result.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});
  assert(h.stock(c,result,cap));assert(!h.stock({...c,live:{...c.live,inventory:digest("stock change")}},result,cap));
  assert.equal(h.read(ledger).disposition,"unknown_relevance");assert.deepEqual(readFileSync(ledger),ledgerBytes);
  console.log(JSON.stringify({synthetic_only:true,git_revision_controls:["protected Git race then effective change","unrelated fault, incomplete stock and unsettled cleanup refused",
    "actual raw/effective input identities, incomplete inventory and stale tip","exact product and regression byte witnesses","preparation cannot reserve",
    "negative review, missing scope, spoofed authority and unsafe inputs refused","exclusive successor, original ledger retained and read-only stock"]}));
}
