// A frozen candidate harness for source-extracted synthetic consumer boundaries.
// This is neither complete material preparation nor a Companion/Browser probe.
import assert from "node:assert/strict";
import path from "node:path";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import ts from "typescript";
import {digest} from "./local-canonical-inputs.mjs";
import {verifyBrowserRevisionPreservation} from "./local-canonical-browser-revision.mjs";
import {fixtureNow} from "./fixtures/local-canonical-authority-clock.mjs";
import {createCanonicalTestResourceRoot,cleanupCanonicalTestResources} from "./canonical-test-environment.mjs";

const modules=["scripts/fixtures/local-canonical-reviewed-revision.mjs","scripts/fixtures/local-canonical-serial-material.mjs"];
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const parse=(name,source)=>{const ast=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);assert.equal(ast.parseDiagnostics.length,0);return ast;};
const sources=modules.map(name=>read(name)),trees=sources.map((source,i)=>parse(modules[i],source));
const collect=(node,predicate)=>{const rows=[];const visit=n=>{if(predicate(n))rows.push(n);ts.forEachChild(n,visit);};visit(node);return rows;};
const one=rows=>{assert.equal(rows.length,1,"freshness_source_boundary_ambiguous");return rows[0];};
const initializer=(ast,name)=>one(collect(ast,n=>ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)).initializer;
const observationSource=initializer(trees[0],"observeFixtureLive").getText(trees[0]);
const handoff=one(collect(trees[0],n=>ts.isCallExpression(n)&&n.expression.getText(trees[0])==="runSerialAggregateControls")).arguments[1];
assert(ts.isObjectLiteralExpression(handoff));
const inspectSource=initializer(trees[1],"inspect").getText(trees[1]);
const deferred=initializer(trees[1],"deferred");
assert(ts.isAwaitExpression(deferred)&&ts.isCallExpression(deferred.expression));
assert.equal(deferred.expression.expression.getText(trees[1]),"prepareMaterialSourceRevision");
const deferredSource=deferred.expression.getText(trees[1]);
const clone=structuredClone,time=n=>new Date(fixtureNow()+n).toISOString();
const actualObserve=Function("clone","time","return ("+observationSource+");")(clone,time);
let acquisitions=0;
const observeFixtureLive=c=>{acquisitions++;return actualObserve(c);};
const inert=()=>{throw Error("freshness_unselected_boundary");};
const names=["prepare","artifact","read","writePredecessor","proof","auth","begin","stock","receipt","storeReceipt","run","freshReader","behavior","c","observeFixtureLive"];
const values=names.map(name=>name==="observeFixtureLive"?observeFixtureLive:inert);
const h=Function(...names,"return ("+handoff.getText(trees[0])+");")(...values);
const state={status:"live",checkout_relation:"exact",service_identity:"sha256:"+digest("freshness-fixture-service"),preservation_valid:true,preservation_binding:digest("freshness-fixture-binding")};
const sample={inventory:digest("freshness-fixture-input"),service:{state,diagnostics:{contract:"augnes.companion-preservation-observation.v2",samples:1,coherent:true,live_identity_valid:true,
  before_binding:state.preservation_binding,after_binding:state.preservation_binding,repository_observation_before:"observed",repository_observation_after:"observed",
  repository_binding_before:digest("freshness-fixture-repository"),repository_binding_after:digest("freshness-fixture-repository"),finished_at:"2000-01-01T00:00:00.000Z"}}};
const history=Buffer.from(JSON.stringify({scope:"fixed-disposable-synthetic-history",sample})+"\n"),historyHash=digest(history);
const stale=error=>error?.code==="revision_current_preservation_unsafe"&&JSON.stringify(error.revisionPreservation?.failed_conditions)===JSON.stringify(["observation_stale"]);
const boundary=async operation=>{const before=acquisitions;try{await operation();return{status:"pass",acquisitions:acquisitions-before};}catch(error){return{status:"failure",acquisitions:acquisitions-before,error_code:error.code??error.name,failed_conditions:error.revisionPreservation?.failed_conditions??[],error};}};
const owner=createCanonicalTestResourceRoot("ag-resource-test-",{shortSocketPaths:true});
let summary,primary;
try {
  const c={checkout:owner.root,anchor:owner.root,artifacts:owner.root,inputs:{},live:clone(sample)};
  const sampleHash=digest(c.live),historyFile=path.join(owner.root,"historical-sample.json");writeFileSync(historyFile,history,{mode:0o600});
  h.write=(file,value)=>{assert.equal(path.dirname(file),owner.root);writeFileSync(file,JSON.stringify(value),{mode:0o600});};
  const validate=live=>{verifyBrowserRevisionPreservation(state,live?.service,{requireSameBinding:true});return{target:"fixed-disposable-target",authorized:false,reserved:false};};
  const inspect=Function("clone","c","h","path","inspectGitRevisionPreparation","return ("+inspectSource+");")(clone,c,h,path,args=>validate(args.live));
  const material={accepted:{review:{id:1}},authorization:{id:2},local_relative_path:"ignored"};
  // The unchanged production guard refuses the same explicit old sample in
  // both roles. A positive boundary must choose its own new sample instead.
  assert.throws(()=>validate(clone(sample)),stale);
  const explicit=await boundary(()=>inspect(material,clone(sample)));
  assert.equal(explicit.status,"failure");assert(stale(explicit.error));assert.equal(explicit.acquisitions,0);
  const positiveInspect=await boundary(()=>inspect(material));
  const invokeDeferred=Function("args","c","h","transport","prepareMaterialSourceRevision",
    "let observed=0;return (async()=>{const result=await ("+deferredSource+");return {result,observed};})();");
  let callbackCalls=0;
  const positiveDeferred=await boundary(async()=>{
    const prepared=await invokeDeferred({file:path.join(owner.root,"material.json")},c,h,{},async args=>{
      assert.equal(acquisitions,positiveInspect.acquisitions,"freshness_callback_acquired_eagerly");
      await Promise.resolve();callbackCalls++;return validate(await args.live());
    });
    assert.equal(prepared.observed,1);assert.equal(prepared.result.authorized,false);assert.equal(prepared.result.reserved,false);
  });
  assert.equal(callbackCalls,1);
  const causalFailures=[positiveInspect,positiveDeferred].filter(v=>v.status==="failure");
  let admission={not_reached:true};
  if(!causalFailures.length){
    // The predecessor has no local positive-admission wrapper. Do not mistake
    // that absence for causal RED; the two existing stale consumers decide it.
    const beginSource=initializer(trees[1],"begin").getText(trees[1]);
    h.begin=(subject,proof,authority,extra)=>validate(extra.revisionLive);
    const begin=Function("h","return ("+beginSource+");")(h),before=acquisitions;
    assert.equal(begin(c,{},{}).authorized,false);
    assert.throws(()=>begin(c,{},{},{revisionLive:clone(sample)}),stale);
    assert.equal(acquisitions-before,2);
    admission={fresh:true,explicit_override_rejected:true,acquisitions:2,source_sha256:digest(beginSource)};
  }
  const supplied=clone(sample);await assert.rejects(async()=>validate(await (async()=>supplied)()),stale);
  // These source-boundary controls do not replace the complete focused owner's
  // real preparation/dependency/generated-input mutation and lineage controls.
  let identityRefusals=0;
  for(const change of [v=>v.service.state.service_identity="sha256:"+"e".repeat(64),v=>v.service.state.status="installed_stopped",
    v=>v.service.diagnostics.after_binding=digest("changed"),v=>v.service.diagnostics.coherent=false]){
    const changed=actualObserve({live:clone(sample)});change(changed);
    assert.throws(()=>validate(changed),error=>error.code==="revision_current_preservation_unsafe"&&!error.revisionPreservation.failed_conditions.includes("observation_stale"));identityRefusals++;
  }
  assert.equal(digest(c.live),sampleHash);assert(readFileSync(historyFile).equals(history));assert.equal(digest(readFileSync(historyFile)),historyHash);
  const trim=({error,...record})=>record;
  summary={contract:"augnes.serial-material-freshness-boundary.v1",scope:"source-extracted-synthetic-consumers-with-real-preservation-guard; not complete preparation or installed probes",
    input_sha256:digest(sample),historical_sha256:historyHash,implicated_sources:modules.map((name,i)=>({path:name,byte_size:Buffer.byteLength(sources[i]),sha256:digest(sources[i])})),
    source_boundaries:{observation:digest(observationSource),handoff:digest(handoff.getText(trees[0])),inspect:digest(inspectSource),deferred:digest(deferredSource)},
    explicit_stale_guard:true,explicit_old_inspect:true,explicit_old_deferred:true,identity_refusals:identityRefusals,callback_invocations:callbackCalls,
    boundaries:{inspect:trim(positiveInspect),deferred:trim(positiveDeferred)},positive_admission:admission,supplied_history_unchanged:true,synthetic_only:true,deciding:false};
  if(causalFailures.length){assert.equal(causalFailures.length,2);for(const outcome of causalFailures)assert(stale(outcome.error));primary=causalFailures[0].error;}
  else {assert.equal(positiveInspect.acquisitions,1);assert.equal(positiveDeferred.acquisitions,1);}
} finally {
  const cleanup=cleanupCanonicalTestResources([owner]);assert(cleanup.every(v=>v.completed));assert.equal(existsSync(owner.root),false);
  if(summary){summary.cleanup_complete=true;console.log("AUGNES_SERIAL_MATERIAL_FRESHNESS "+JSON.stringify(summary));}
}
if(primary)throw primary;
