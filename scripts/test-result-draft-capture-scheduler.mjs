import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installResultDraftCapture, withResultDraftCapture } from "./result-draft-capture-scheduler.mjs";

const initial = () => ({owner:"operator:A",authorized:true,failPreview:true,failSave:true,version:1,posts:[],drafts:new Map(),locks:0});
function frameFor(s = initial()) {
  let removed = 0, inlineCalls = 0;
  const w = { resultFixture:s, Headers, Response, document:{querySelector:()=>null}, fetch:()=>{inlineCalls++;throw Error("unused_inline");} };
  const frame = {contentWindow:w,remove(){removed++;}}, parent={};
  return {s,w,frame,parent,removed:()=>removed,inlineCalls:()=>inlineCalls};
}
const request = (w,action,extra={}) => w.fetch("/fixture",{headers:{"Augnes-Project-Id":"project:A"},body:JSON.stringify({action,...extra})});
const body = async r => ({status:r.status,json:await r.json()});
// Compare the complete candidate transport with the accepted inline fixture's
// actual non-scheduling expressions. This is a unit fixture, not a causal run.
const source = readFileSync(new URL("./result-work-draft-browser-checks.ts",import.meta.url),"utf8");
const start=source.indexOf("    const session=()"),end=source.indexOf("    function Harness()");
assert.ok(start>0&&end>start);
const ordinary=frameFor(), scheduled=frameFor();
new Function("window","state","Headers","Response",source.slice(start,end))(ordinary.w,ordinary.s,Headers,Response);
installResultDraftCapture(scheduled.frame,scheduled.parent);
for (const [action,extra] of [["session"], ["read_result_work_preparation"], ["compare_result_work_sources",{notes:[{source:"A",text:"B"}]}],
  ["preview_result_work"], ["preview_result_work",{definition:{goal:"G"},selected_sources:{selected_source_context:[],omitted_sources:[]}}],
  ["prepare_result_work"], ["session"], ["prepare_result_work"]]) {
  const call=w=>action==="session"?w.fetch("/session",{headers:{"Augnes-Project-Id":"project:A"}}):request(w,action,extra);
  assert.deepEqual(await body(await call(scheduled.w)),await body(await call(ordinary.w)));
}
assert.deepEqual(scheduled.s.posts,ordinary.s.posts);
await assert.rejects(request(scheduled.w,"unknown"),/unexpected_fixture_action/u);
await assert.rejects(scheduled.w.fetch("/session",{}),/wrong_project_selector/u);
assert.equal(scheduled.inlineCalls(),0);
scheduled.frame.remove();assert.equal(scheduled.removed(),1);

// Actual callback assignments, retained references, receiver, arguments, return
// and thrown object survive interception. Only the shared milestone arms a hold.
const f=frameFor();installResultDraftCapture(f.frame,f.parent);
const receiver={marker:1},args=["operator:B",{arg:2}],answer={answer:true},error=new Error("original");
f.s.authenticate=function(...v){assert.equal(this,receiver);assert.deepEqual(v,args);return answer;};
const saved=f.s.authenticate;f.s.authenticate=()=>{throw error;};
assert.equal(saved.apply(receiver,args),answer);assert.throws(()=>f.s.authenticate(),e=>e===error);
f.s.authenticate=owner=>{f.s.owner=owner;return 17;};
// Near miss must not hold.
f.s.locks=1;f.s.holdPreview=true;f.s.posts=[{action:"prepare_result_work"}];f.s.authenticate("operator:A");
await request(f.w,"read_result_work_preparation");assert.equal(f.s.captureScheduler.snapshot().hold_count,0);
f.s.posts.push({action:"prepare_result_work"});f.s.drafts.delete("operator:A");assert.equal(f.s.authenticate("operator:A"),17);
const pending=request(f.w,"read_result_work_preparation");assert.equal(f.s.captureScheduler.snapshot().preparation_pending,true);
f.s.releasePreparation();assert.equal(f.s.captureScheduler.snapshot().preparation_pending,true);
f.s.editorWaitObserved=true;f.s.releasePreparation();await pending;f.s.releasePreparation();
assert.equal(f.s.captureScheduler.snapshot().boundary_releases,1);
f.s.authenticate("operator:A");await request(f.w,"read_result_work_preparation");assert.equal(f.s.captureScheduler.snapshot().hold_count,1);
const preview=request(f.w,"preview_result_work");assert.equal(f.s.captureScheduler.snapshot().preview_pending,true);f.s.releasePreview();
assert.equal((await preview).status,403);assert.equal(f.s.previewReturned,true);
f.frame.remove();assert.equal(f.parent.__resultDraftCapture.after_cleanup.preparation_pending,false);

const red=frameFor();installResultDraftCapture(red.frame,red.parent);
red.s.authenticate=()=>{};red.s.locks=1;red.s.holdPreview=true;red.s.posts=[{action:"prepare_result_work"},{action:"prepare_result_work"}];
red.s.authenticate("operator:A");const held=request(red.w,"read_result_work_preparation");red.frame.remove();await held;
assert.equal(red.parent.__resultDraftCapture.before_cleanup.preparation_pending,true);
assert.equal(red.parent.__resultDraftCapture.after_cleanup.cleanup_releases,1);
assert.equal(red.parent.__resultDraftCapture.after_cleanup.boundary_releases,0);
for (const edit of [s=>s.posts.push({}),s=>s.locks=1,s=>s.holdPreview=true]) {
 const q=frameFor();edit(q.s);assert.throws(()=>installResultDraftCapture(q.frame,q.parent),/mount_boundary_invalid/u);
}
const q=frameFor();Object.defineProperty(q.s,"authenticate",{get:()=>()=>{},configurable:true});
assert.throws(()=>installResultDraftCapture(q.frame,q.parent),/descriptor_invalid/u);
// Adapter passes the exact expression and error object through. Diagnostics and
// cleanup do not replace native rejection, even when their own reads fail.
const native=new Error("native_browser_error"),expressions=[];
const tab={async eval(expression){expressions.push(expression);throw native;}};
await assert.rejects(withResultDraftCapture(tab,t=>t.eval("original expression")),e=>e===native);
assert.equal(expressions[0],"original expression");
console.log("result draft scheduler: transport equivalence, callback fidelity, one-shot hold, release/cleanup and native rejection PASS");

// Exercise the actual TS/CommonJS loader used by the entry driver. The browser
// program must be the same literal bytes and executable without loader globals.
const { runCanonicalChild } = await import("./canonical-child-runner.mjs");
const { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } = await import("./canonical-test-environment.mjs");
const { runInNewContext } = await import("node:vm");
const { resultDraftCaptureSource } = await import("./result-draft-capture-scheduler.mjs");
const resource=createCanonicalTestResourceRoot("ag-resource-test-");let loaded="",child;
try {
 child=await runCanonicalChild({suite:"scheduler-loader",label:"actual TS require serialization",command:process.execPath,
  args:["--import","tsx","-e","process.stdout.write(require('./scripts/result-draft-capture-scheduler.mjs').resultDraftCaptureSource)"],cwd:process.cwd(),
  env:buildCanonicalChildEnvironment({temporaryRoot:resource.root}),timeoutMs:5000,resourceOwner:resource,
  stdout:{write(v){loaded+=v;}},stderr:process.stderr,log(){}});
 assert.equal(child.exit_code,0);assert.equal(child.termination_reason,"natural_exit");assert.equal(loaded,resultDraftCaptureSource);
 const f=frameFor();runInNewContext("("+loaded+")(frame,parent)",{frame:f.frame,parent:f.parent});assert.equal(f.s.captureScheduler.snapshot().hold_count,0);f.frame.remove();
} finally {if(child?.cleanup_completed&&child.remaining_owned_processes===0)assert.ok(cleanupCanonicalTestResources([resource]).every(v=>v.completed));}
for(const mountFails of [false,true]) {
 const original=new Error("original_install_or_mount"),seen=[];
 const tab={async eval(expression){seen.push(expression);if(expression==="mount"&&mountFails||expression.startsWith("("+resultDraftCaptureSource))throw original;return null;}};
 await assert.rejects(withResultDraftCapture(tab,async t=>{try{await t.eval("mount");}finally{await t.eval("helper finally");}}),e=>e===original);
 assert.equal(seen.filter(e=>e.startsWith("("+resultDraftCaptureSource)).length,mountFails?0:1);
 assert.ok(seen.includes("helper finally"));
}
console.log("actual TS/CommonJS literal transfer and one-attempt installation failure preservation PASS");
