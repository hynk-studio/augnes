// Synthetic controls; no host browser, production family or GitHub write.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest, inputEventIdentity, BROWSER_RUNTIME_INPUTS, observeBrowserInstallation, freezeInputContract } from "../local-canonical-inputs.mjs";
import { BROWSER_REVISION_SCHEMA, browserReviewTarget, browserPredecessorEvidence, verifyBrowserRemedy, verifyBrowserRevisionPreservation } from "../local-canonical-browser-revision.mjs";
import { reviewedRevisionAuthorityObservation, hasRetiredQualificationMarker, inspectBrowserRevisionPreparation, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { checkBrowserSourceSuccessor } from "./local-canonical-browser-successor.mjs";
import { BROWSER_IDENTITY_PREFIX } from "../local-canonical-browser-identity.mjs";

const time = offset => new Date(Date.now() + offset).toISOString();
const stockOf = r => ({ content_fingerprint:r.integrity.content_fingerprint, status:"non_deciding_or_stale", valid_deciding_evidence:false,
  dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"},
  issues:["receipt_input_observation_blocked","phase_not_passing:integration","phase_not_passing:operability"] });

export function browserFixtureReceipt(c, a) {
  const prior = {id:"browser-executable",classification:"execution",readOnlyExecutable:true,
    location_fingerprint:digest("previous installation"),before:structuredClone(c.inputs.node.observation)};
  const after = structuredClone(prior.before); after.metadata.inode="9"; after.sha256=digest("replacement");
  const event={resource:prior.id,classification:"execution",disposition:"safety_violation",after,observed_at:time(-84000),monotonic_ns:"12"};
  event.identity=inputEventIdentity(event);
  const fault={resource:prior.id,disposition:event.disposition,observed_at:event.observed_at,monotonic_ns:event.monotonic_ns};
  const state={status:"live",checkout_relation:"exact",service_identity:"sha256:"+digest("fixture service"),preservation_valid:true,preservation_binding:digest("binding")};
  const observed={contract:"augnes.companion-preservation-observation.v2",samples:1,coherent:true,live_identity_valid:true,
    before_binding:state.preservation_binding,after_binding:state.preservation_binding,repository_observation_before:"observed",repository_observation_after:"observed",
    repository_binding_before:digest("repo"),repository_binding_after:digest("repo"),finished_at:time(-80000)};
  const owned={released:true,acquired:true,required:true,failure_code:null};
  const settled={completed:true,remaining_owned_processes:0,exit_observed:true,streams_closed:true,listener_residue_count:null};
  return finalizeReceipt({receipt_version:4,repository:{branch:c.branch,head_sha:a.head,base_sha:c.base,tree_sha:a.tree,worktree_before:"clean",worktree_after:"clean"},
    verification_context:{kind:"isolated-worktree"},evidence:{selected_plan:"full-canonical",deciding:false},
    attempt:a,run:{id:a.attempt_id,invocation_id:"synthetic-invocation",finished_at:time(-78000)},
    inputs:{contract:"augnes.local-canonical-inputs.v3",fingerprint:a.contract_fingerprint,resources:[{...prior,id:"node-executable"},prior],events:[event],first_fault:fault,secondary_faults:[]},
    phases:[{id:"unit",status:"pass",exit_status:0,timed_out:false,failure_code:null,cleanup:{...settled,termination_reason:"natural_exit"}},
      {id:"integration",status:"failure",exit_status:null,timed_out:false,failure_code:"phase_cancelled",started_at:time(-90000),finished_at:time(-82000),cleanup:{...settled,termination_reason:"operator_cancelled"}},
      {id:"operability",status:"not_run",exit_status:null,failure_code:"phase_not_run"}],
    outcome:{disposition:"safety_violation",safety:"blocked",validity:"invalid_or_unknown",execution:"incomplete_or_failed",first_fault:fault},
    final:{result:"failure",exit_status:1,reason_codes:["phase_cancelled","selected_phases_incomplete","verification_cancelled"]},
    checkout_ownership:owned,capacity_ownership:owned,cleanup:{completed:true,remaining_owned_processes:0,failure_codes:[],isolated_resources:{prepared:true,completed:true,failures:[],failure_count:0,invocation_id:"synthetic-invocation"},
      companion_service:{scope:"accepted_checkout_read_only",restored:true,maintenance_acquired:false,maintenance_released:true,before:state,after:state,observations:{before:observed,after:observed}}}});
}

function checkPreservationDiagnostics(previous, live) {
  verifyBrowserRevisionPreservation(previous, live);
  const cases = [
    ["coherent", sample => { sample.diagnostics.coherent = false; }],
    ["live_identity_valid", sample => { sample.diagnostics.live_identity_valid = false; }],
    ["same_service", sample => { sample.state.service_identity = "sha256:" + "e".repeat(64); }],
    ["same_state", sample => { sample.state.status = "installed_stopped"; }],
    ["repository_binding_unchanged", sample => { sample.diagnostics.repository_binding_after = "e".repeat(64); }],
    ["observation_stale", sample => { sample.diagnostics.finished_at = time(-70_000); }],
    ["observation_in_future", sample => { sample.diagnostics.finished_at = time(70_000); }],
    ["observation_time_unavailable", sample => { sample.diagnostics.finished_at = "invalid"; }],
  ];
  for (const [reason, mutate] of cases) {
    const sample = structuredClone(live);
    mutate(sample);
    sample.diagnostics.runtime = { probe_available: { ui_health: false, injected: "PRIVATE" }, hidden: "PRIVATE" };
    assert.throws(() => verifyBrowserRevisionPreservation(previous, sample), error => {
      const detail = error.revisionPreservation;
      assert.equal(error.code, "revision_current_preservation_unsafe");
      assert.deepEqual(detail.failed_conditions, [reason]);
      assert.equal(detail.probe_available.ui_health, false);
      assert.equal(detail.probe_available.bridge_health, null);
      assert(!JSON.stringify(detail).includes("PRIVATE"));
      assert.equal(detail.age_ms, detail.observed_at ? Date.parse(detail.evaluated_at) - Date.parse(detail.observed_at) : null);
      return true;
    });
  }
  assert.throws(() => verifyBrowserRevisionPreservation(previous, null), error =>
    error.revisionPreservation?.observation_available === false && error.revisionPreservation.age_ms === null);
}

function physicalInstallationFixture(root) {
  if (process.platform !== "darwin") return; // The guarded app reader is Mac-only.
  const version=path.join(root,"version"), app=path.join(version,"Test.app"), contents=path.join(app,"Contents"),
    exe=path.join(contents,"MacOS","Test"), data=path.join(contents,"Frameworks","module");
  mkdirSync(path.dirname(exe),{recursive:true});mkdirSync(path.dirname(data));writeFileSync(data,"framework one");
  writeFileSync(exe,"fixture, never launched");chmodSync(exe,0o700);
  writeFileSync(path.join(contents,"Info.plist"),'<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Test</string><key>CFBundleShortVersionString</key><string>1.2.3.4</string></dict></plist>');
  const flags=(op,...files)=>execFileSync("/usr/bin/chflags",["-R",op,...files]);
  assert.throws(()=>observeBrowserInstallation(exe),/unprotected/);
  const alias=path.join(root,"launcher");symlinkSync(exe,alias);assert.throws(()=>observeBrowserInstallation(alias),/selection_invalid/);
  try {
    flags("uchg",version);
    const target=observeBrowserInstallation(exe);assert.equal(target.actual_version,"Chrome/1.2.3.4");
    const monitor=freezeInputContract({resources:[{id:"browser-installation",file:app,classification:"execution",protectedInstallation:true}],
      pathKind:"isolated-model-free-v1",binding:{}});
    assert.equal(monitor.check(),null);
    flags("nouchg",data);writeFileSync(data,"framework two");flags("uchg",data);
    assert(monitor.check(),"a changed framework must interrupt even if the launcher is untouched");
    const modified=observeBrowserInstallation(exe);
    assert.equal(modified.executable.observation.sha256,target.executable.observation.sha256);
    assert.notEqual(modified.installation.content_sha256,target.installation.content_sha256);
    flags("nouchg",version);assert.throws(()=>observeBrowserInstallation(exe),/unprotected/);
  } finally { flags("nouchg",version); }
}

export async function runBrowserRevisionControls(c, h) {
  physicalInstallationFixture(c.root);
  const old=c.prior, ledger=path.join(c.legacyRoot,"completion-1.json"), edge=path.join(c.legacyRoot,"correction-successor.json");
  const completion=h.read(ledger), stock=stockOf(old), incident=browserPredecessorEvidence(old,old.attempt,completion,stock);
  for(const mutate of [
    r=>r.inputs.secondary_faults.push(r.inputs.first_fault), r=>r.inputs.events[0].after.metadata.gid="9",
    r=>r.inputs.events[0].identity=digest("changed"), r=>r.inputs.events[0].after.sha256=r.inputs.resources[1].before.sha256,
    r=>r.phases[1].cleanup.exit_observed=false, r=>r.phases[1].timed_out=true, r=>r.checkout_ownership.released=false,
    r=>r.cleanup.isolated_resources.failures.push("foreign"), r=>r.cleanup.companion_service.observations.after.coherent=false,
    r=>r.cleanup.companion_service.after={...r.cleanup.companion_service.after,status:"installed_stopped"},
    r=>r.phases[1].browser_use=[{consumer:"wrong"}], r=>r.phases[0].status="failure", r=>r.outcome.first_fault={...r.outcome.first_fault,monotonic_ns:"1"}]) {
    const m=structuredClone(old);mutate(m);const r=finalizeReceipt(m), result=stockOf(r);
    assert.throws(()=>browserPredecessorEvidence(r,r.attempt,{...completion,receipt_fingerprint:r.integrity.content_fingerprint},result));
  }
  assert.throws(()=>browserPredecessorEvidence(old,old.attempt,{...completion,cleanup_complete:false},stock));
  assert.throws(()=>browserPredecessorEvidence(old,old.attempt,completion,{...stock,issues:[...stock.issues,"receipt_unrelated_failure"]}));
  c.inputs.contract=BROWSER_RUNTIME_INPUTS;
  const browser={actual_version:"Chrome/100.10.1.2",executable:{location_fingerprint:digest("protected launcher"),observation:{...c.inputs.node.observation,sha256:digest("protected launcher bytes")}},
    installation:{...c.inputs.headers.observation,contract:"augnes.local-canonical-browser-bundle.v1",location_fingerprint:digest("complete protected installation"),manifest_sha256:digest("portable content manifest")}};
  c.inputs.browser=browser;
  const records=["durable-work-surface","durable-work-surface","durable-work-surface","cumulative-work-surface","cumulative-work-surface"].map(consumer=>({
    contract:"augnes.local-canonical-browser-use.v2",consumer,executable_name:"Fixture",location_fingerprint:browser.executable.location_fingerprint,
    before:browser.executable.observation,after:browser.executable.observation,actual_version:browser.actual_version,runtime_versions:{http:browser.actual_version,cdp:browser.actual_version},
    disposition:"unchanged",unchanged:true}));
  const witness={full_bundle_sha256:browser.installation.manifest_sha256,entries:browser.installation.entries,bytes:browser.installation.bytes};
  const render=rows=>rows.map(r=>BROWSER_IDENTITY_PREFIX+JSON.stringify(r)).join("\n")+"\n";
  assert.equal(verifyBrowserRemedy(incident,browser,"integration",[render(records)],witness),5);
  assert.throws(()=>verifyBrowserRemedy(incident,{...browser,executable:{...browser.executable,location_fingerprint:incident.resource.location_fingerprint}},"integration",[render(records)],witness));
  for(const change of [r=>r.consumer="project-client",r=>r.runtime_versions.cdp="Chrome/1",r=>r.before.sha256=digest("wrong"),r=>r.location_fingerprint=digest("alias")]){
    const rows=structuredClone(records);change(rows[0]);assert.throws(()=>verifyBrowserRemedy(incident,browser,"integration",[render(rows)],witness));
  }
  assert.throws(()=>verifyBrowserRemedy(incident,browser,"integration",[render(records.slice(1))],witness));
  assert.throws(()=>verifyBrowserRemedy(incident,browser,"integration",[render(records)],{...witness,full_bundle_sha256:digest("different contents")}),/focused_installation_mismatch/);
  h.prepare(c);const p=c.proof; p.schema=BROWSER_REVISION_SCHEMA;p.inputs.predecessor_sha256=digest(incident);
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(stock));
  const source=h.read(path.join(c.artifacts,p.source.artifact));source.reviewed_at=time(-15000);p.source=h.artifact(c,p.source.artifact,source);
  const focus=h.read(path.join(c.artifacts,p.focused.artifact));focus.finished_at=time(-13000);focus.input_remedy_resources=["browser-executable"];
  focus.consumers={phase:"integration",installation:{record:h.artifact(c,"focused-installation.json",witness),field:[]},logs:[h.artifact(c,"consumers.log",render(records))]};p.focused=h.artifact(c,p.focused.artifact,focus);
  c.authority.contractPr=998;
  const review={...c.authority.review,id:21,commit_id:p.head,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/998",submitted_at:time(-8000),
    body:"ACCEPT / RETAIN browser execution-input "+[p.base,p.head,p.tree,browserReviewTarget(p)].join(" ")};
  c.authority.contractReview=review;
  p.authorization.contract_review={pull_request:998,id:review.id,head:p.head,sha256:digest(reviewedRevisionAuthorityObservation(review,"contract_review"))};
  const grant=c.authority.grant;
  grant.created_at=grant.updated_at=time(-4000);grant.body+=" "+[p.schema,p.head,p.tree,p.base,browserReviewTarget(p),"https://github.com/hynk-studio/augnes/pull/998#pullrequestreview-21"].join(" ");
  p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));
  const preservation=old.cleanup.companion_service;c.live={state:preservation.after,diagnostics:{...preservation.observations.after,finished_at:time(-50)}};
  checkPreservationDiagnostics(preservation.after, c.live);
  const materials=structuredClone(p);delete materials.authorization;
  const preparation=path.join(c.artifacts,"preparation.json");h.write(preparation,materials);
  const prepared=inspectBrowserRevisionPreparation({file:preparation,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live});
  assert.equal(prepared.target,browserReviewTarget(p));assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);
  assert.throws(()=>readSourceCorrectionProof(preparation,c.checkout));assert(!existsSync(edge));
  h.write(c.file,p);const proof=h.proof(c);
  const cap=await h.auth(c,proof);
  for(const mutate of [(r,e)=>{if(e.includes("/reviews/21"))r.commit_id=p.accepted.head;},(r,e)=>{if(e.includes("/comments/"))r.created_at=time(-65000);},
    (r,e)=>{if(e.includes("/reviews/21"))r.body="ordinary approval";}])
    await assert.rejects(h.auth(c,proof,(r,e)=>{mutate(r,e);return r;}));
  assert.throws(()=>h.begin(c,proof,{observations:cap.observations}));
  const changed=structuredClone(c.inputs);changed.browser.installation.content_sha256=digest("different framework, identical launcher");
  assert.throws(()=>h.begin(c,proof,cap,{revisionInputs:changed}));
  assert.throws(()=>h.begin(c,proof,cap,{revisionLive:null}));
  const raw=h.read(ledger);const ledgerBytes=readFileSync(ledger);h.write(ledger,JSON.stringify(raw,null,2)); // same JSON, altered original bytes
  try{assert.throws(()=>h.begin(c,proof,cap),/revision_original_ledger_changed/);}finally{h.write(ledger,ledgerBytes);}
  const wrong={...p,schema:"augnes.local-canonical-source-correction.v7"};h.write(c.file,wrong);assert.throws(()=>h.proof(c));h.write(c.file,p);
  assert(hasRetiredQualificationMarker({attempt:{source_correction:{...p,kind:"browser_input_replacement"}}}));
  assert(!existsSync(edge));
  await checkBrowserSourceSuccessor(c, h, proof, cap, records[0]);
  assert.equal(h.read(ledger).disposition,"safety_violation");
  console.log(JSON.stringify({browser_revision_controls:["ordinary interrupted receipt and separate stock","exclusive admission and fresh reconstruction","changed browser contents, identities and actual consumers","unsettled cleanup, unrelated faults and changed historical bytes","separate exact contract review and prospective grant","v7/retired refusal; bounded non-deciding review export"],synthetic_only:true}));
}
