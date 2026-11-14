// Disposable structural controls through the real admission/preparation/stock
// owners. Service/authority records are synthetic, never actual qualification.
import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest } from "../local-canonical-inputs.mjs";
import { inspectAttemptRecords } from "../local-canonical-attempts.mjs";

const clone = value => structuredClone(value);
const delay = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export async function runRevisionLifecycleControls(c, h, p, authority, prepare) {
  const edge = path.join(c.legacyRoot, "correction-successor.json");
  const fresh = () => {
    const live = clone(c.live);
    live.service.diagnostics.finished_at = new Date(Date.now()).toISOString();
    return live;
  };
  const current = () => ({authorization:authority,live:fresh()});
  const untouched = () => assert(!existsSync(edge), "a refused control must not reserve");
  const invoke = (observeRevision = current, assertCurrent = () => {}) =>
    h.begin(c,p,authority,{observeRevision,assertCurrent});
  const findings = [];

  // Delay a real Git read inside immutable material validation. The old-order
  // fixture starts 250ms before the real 60s deadline; it then crosses that
  // deadline under native Date.now. No production clock or bound is replaced.
  const shim = path.join(c.root,"delayed-material-git"), armed = path.join(shim,"armed"), trace = path.join(shim,"trace.json");
  mkdirSync(shim,{mode:0o700});
  const git = execFileSync("which",["git"],{encoding:"utf8"}).trim();
  writeFileSync(path.join(shim,"git"),`#!${process.execPath}\nimport {existsSync,unlinkSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(existsSync(${JSON.stringify(armed)})){unlinkSync(${JSON.stringify(armed)});const started=Date.now();Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,400);writeFileSync(${JSON.stringify(trace)},JSON.stringify({started,finished:Date.now()}));}
const r=spawnSync(${JSON.stringify(git)},process.argv.slice(2),{stdio:'inherit'});process.exit(r.status??1);\n`,{mode:0o700});
  const oldPath = process.env.PATH;
  const arm = () => writeFileSync(armed,"delay",{mode:0o600});
  const elapsed = () => {const t=JSON.parse(readFileSync(trace));assert(t.finished-t.started>=390);return t;};
  let oldRefusal;
  try {
    process.env.PATH=shim+path.delimiter+oldPath;
    const old=fresh();old.service.diagnostics.finished_at=new Date(Date.now()-59_750).toISOString();arm();
    assert.throws(()=>h.begin(c,p,authority,{revisionLive:old}),error=>{
      oldRefusal=error.revisionPreservation;
      return error.code==="revision_current_preservation_unsafe" && oldRefusal.failed_conditions.includes("observation_stale");
    });untouched();elapsed();
    // Throw at the final boundary to prove arrival without spending this fixture
    // family's one successor. The observed timestamp follows actual validation.
    arm();let acquired;
    await assert.rejects(invoke(()=>{acquired=Date.now();assert(acquired>=elapsed().finished);return current();},()=>{
      throw Object.assign(new Error("boundary reached"),{code:"fixture_boundary_reached"});
    }),{code:"fixture_boundary_reached"});untouched();
    findings.push({control:"delayed immutable validation",old_refusal:oldRefusal,corrected_observed_at:new Date(acquired).toISOString(),delay:elapsed()});
  } finally {process.env.PATH=oldPath;rmSync(shim,{recursive:true});}

  for (const [name,mutate] of [
    ["stale",v=>v.service.diagnostics.finished_at=new Date(Date.now()-60_001).toISOString()],
    ["future",v=>v.service.diagnostics.finished_at=new Date(Date.now()+60_000).toISOString()],
    ["unavailable",v=>delete v.service.diagnostics.finished_at],
    ["incoherent",v=>v.service.diagnostics.coherent=false],
    ["identity",v=>v.service.state.service_identity="sha256:"+digest("other")],
    ["inventory",v=>v.inventory=digest("other")],
  ]) {
    await assert.rejects(invoke(()=>{const v=current();mutate(v.live);return v;}));untouched();findings.push(name);
  }
  await assert.rejects(invoke(()=>{throw new Error("observer unavailable");}));untouched();
  await assert.rejects(invoke(()=>({authorization:null,live:fresh()})),{code:"revision_authenticated_authority_required"});untouched();
  await assert.rejects(invoke(()=>({authorization:{observations:authority.observations},live:fresh()})),{code:"revision_authenticated_authority_required"});untouched();
  const grant=c.authority.grant, body=grant.body;
  try {
    grant.body="HOLD\n"+body;
    await assert.rejects(invoke(async()=>({authorization:await h.auth(c,p),live:fresh()})));untouched();
  } finally {grant.body=body;}

  for (const file of [c.file,path.join(c.artifacts,p.focused.artifact),path.join(c.legacyRoot,"completion-1.json")]) {
    const bytes=readFileSync(file);
    try {await assert.rejects(invoke(()=>{writeFileSync(file,Buffer.concat([bytes,Buffer.from(" ")]));return current();}),{code:"revision_validated_material_changed"});untouched();}
    finally {writeFileSync(file,bytes);}
  }
  const mode=statSync(c.file).mode;
  try {await assert.rejects(invoke(()=>{chmodSync(c.file,0o666);return current();}),{code:"revision_validated_material_changed"});untouched();}
  finally {chmodSync(c.file,mode);}
  try {await assert.rejects(invoke(()=>{h.releaseOwner();return current();}));untouched();}
  finally {h.acquireOwner();}
  await assert.rejects(invoke(current,()=>{throw Object.assign(new Error(),{code:"input_admission_refused"});}),{code:"input_admission_refused"});untouched();
  const originalHead=p.head;
  try {await assert.rejects(invoke(()=>{p.head="0".repeat(40);return current();}),{code:"source_correction_identity_invalid"});untouched();}
  finally {p.head=originalHead;}
  const inputs=clone(c.inputs);
  try {await assert.rejects(invoke(()=>{c.inputs.node.location_fingerprint=digest("changed");return current();}));untouched();}
  finally {Object.assign(c.inputs,inputs);}
  const observations=clone(authority.observations);
  try {await assert.rejects(invoke(current,()=>{authority.observations.execution_commission.timestamp=new Date().toISOString();}),{code:"revision_authenticated_authority_required"});untouched();}
  finally {Object.assign(authority.observations,observations);}

  const candidate=path.join(c.anchor,".augnes-local-verification/families",digest(["augnes.local-canonical-attempt-family.v1","hynk-studio/augnes",p.branch,"verified_source_correction",p.prior_attempt_id,p.head,p.tree]));
  for (const create of [()=>symlinkSync(path.join(c.root,"missing"),candidate),()=>{mkdirSync(candidate);chmodSync(candidate,0o777);}]) {
    try {create();assert.throws(()=>h.begin(c,p,authority));untouched();}finally{rmSync(candidate,{recursive:true});}
    try {await assert.rejects(invoke(()=>{create();return current();}),{code:"revision_validated_lineage_changed"});untouched();}finally{rmSync(candidate,{recursive:true});}
  }
  await assert.rejects(invoke(()=>{const v=current();v.live.service.diagnostics.finished_at=new Date(Date.now()-59_750).toISOString();return v;},()=>delay(400)),error=>error.revisionPreservation?.failed_conditions.includes("observation_stale"));untouched();
  findings.push("proof/material/permissions/tip/owner/source/runtime/authority/cancellation/candidate-directory changes refuse before append; later blocking work is included in freshness");

  const prepared=await prepare(p,()=>fresh());assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);untouched();
  await assert.rejects(prepare(p,()=>{const v=fresh();v.service.diagnostics.coherent=false;return v;}));untouched();
  // A separate disposable physical anchor proves actual exclusive reservation,
  // completion and stock. Never consume the parent's fixture or real ordinal.
  const fork={...c,anchor:path.join(c.root,"lifecycle-anchor")};cpSync(c.anchor,fork.anchor,{recursive:true});
  let observationsCount=0;
  const observeRevision=()=>{observationsCount++;return current();};
  const a=await h.begin(fork,p,authority,{observeRevision,assertCurrent:()=>{}});
  assert.equal(observationsCount,1);
  const r=h.receipt(c,a);h.storeReceipt(c,r);h.finish(a,{receiptFingerprint:r.integrity.content_fingerprint,disposition:r.outcome.disposition,cleanupComplete:true});
  const inspect=extra=>inspectAttemptRecords({anchorRoot:fork.anchor,repositoryRoot:c.checkout,receipt:r,revisionInputs:c.inputs,observeRevision:current,assertCurrent:()=>{},...extra});
  assert.equal(await inspect({}),true);
  assert.equal(await inspect({assertCurrent:()=>{throw new Error("changed current dependencies/source");}}),false);
  assert.equal(await inspect({observeRevision:()=>{const v=current();v.live.service.diagnostics.finished_at=new Date(Date.now()-59_750).toISOString();return v;},assertCurrent:()=>delay(400)}),false);
  assert.throws(()=>h.begin(fork,p,authority,{observeRevision,assertCurrent:()=>{}}));assert.equal(observationsCount,1);
  untouched();rmSync(fork.anchor,{recursive:true});
  findings.push("fresh callback preparation and stock; exclusive reservation; replay cannot reacquire; stock refuses changed inputs and post-observation delay");
  console.log(JSON.stringify({synthetic_only:true,native_clock:true,admission_lifecycle:findings}));
}
