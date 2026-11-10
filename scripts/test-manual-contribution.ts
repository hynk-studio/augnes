import assert from "node:assert/strict";
import { existsSync,mkdirSync,readFileSync,cpSync } from "node:fs";
import path from "node:path";
import {runCanonicalChild,canonicalChildAcceptanceFailure} from "./canonical-child-runner.mjs";
import {createCanonicalTestResourceRoot,beginCanonicalTestResourceUse,settleCanonicalTestResourceUse,cleanupCanonicalTestResources} from "./canonical-test-environment.mjs";
const destination=process.argv[2];
// The longest production-route process measured about 42s in development.
// Keep the existing 60s per-process and 150s Canonical child bounds unchanged.
const childTimeoutMs=60_000;
assert(!destination||(path.isAbsolute(destination)&&!existsSync(destination)));
const owner=createCanonicalTestResourceRoot("ag-suite-",{shortSocketPaths:true});
async function main(){
  beginCanonicalTestResourceUse(owner);let settled=true;
  try{
    for(const role of ["producer","consumer","task-boundary","history"]){
      settled=false;
      const result=await runCanonicalChild({suite:"manual-contribution",label:role,command:process.execPath,
        args:["--import","tsx",role==="producer"?"scripts/manual-contribution-fixture.ts":role==="consumer"?"scripts/manual-contribution-followup.ts":role==="task-boundary"?"scripts/manual-contribution-task-boundary.ts":"scripts/manual-contribution-history.ts",role,owner.root],
        cwd:process.cwd(),env:process.env,timeoutMs:childTimeoutMs,heartbeatMs:5000,resourceOwner:undefined});
      settled=result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0;
      assert.equal(canonicalChildAcceptanceFailure(result,{suite:"manual-contribution",timeoutMs:childTimeoutMs,requireNaturalExit:true}),null);
    }
    const read=(name:string)=>JSON.parse(readFileSync(path.join(owner.root,"artifacts",name+".json"),"utf8"));
    const card=read("fresh-card"),relay=read("manual-feedback-relay"),original=read("original-return");
    assert.equal(card.text,"Available: 12\nTop up: 8\nBefore ordering: Confirm shelf stock before ordering\n");
    assert.equal(card.order_authorized,false);assert.equal(card.original_selection,"historical_not_selected");
    assert.deepEqual(card.feedback,relay);
    assert.equal(read("fresh-read").manual_contribution.original.value.content,original.content);
    // Actual MCP content from the public proxy, not a separately invoked formatter.
    const trace = read("producer-trace");
    for (const [action, stage, kind] of [["participate", "manual request", "request"], ["receive", "original manual return", "return"], ["assess", "separate manual check/use decision", "decision"], ["feedback", "manual feedback", "feedback"]]) {
      const rows = trace.filter((r:any)=>r.arguments?.action===action && r.result?.status==="prepared");
      assert(rows.length>0,action);
      for (const row of rows) {
        const value=row.result, text=row.content.filter((c:any)=>c.type==="text").map((c:any)=>c.text).join("\n");
        assert.equal(value.prepared_stage,action);
        assert(value.work.goal);assert(value.choice.judgment.chosen);assert(value.manual_contribution);
        assert(text.includes(`Work: ${value.work.goal}`));assert(text.includes(`Arrangement: ${value.choice.judgment.chosen}`));
        assert(text.includes(`Prepared: ${stage}`));
        assert(!/unavailable|No arrangement has been selected|No contribution outcome is established/u.test(text));
        assert.match(text,/nothing has been saved or dispatched/u);
        assert.match(text,/manual relay and observed readback are separate/u);
        assert.match(text,/not semantic acceptance or execution authority/u);
        const draft=JSON.parse(value.revision_arguments.changes.sources.add[0].text);
        assert.equal(draft.kind,kind);
        if(action==="assess")assert(text.includes(`Prepared authored disposition: ${draft.disposition}`));
      }
    }
    const savedRows=trace.filter((r:any)=>r.arguments?.action==="read" && r.result?.manual_contribution?.decision);
    assert(savedRows.length>0);
    for(const row of savedRows){
      const text=row.content.map((c:any)=>c.text??"").join("\n"),decision=row.result.manual_contribution.decision.value;
      assert(text.includes(`Saved authored disposition: ${decision.disposition}`));
      assert(text.includes(decision.reason));assert(!text.includes("No contribution outcome is established"));
    }
    const freshTask=read("fresh-different-task");
    assert.equal(freshTask.manual_contribution.decision_currentness,"saved_basis_retained");
    assert.equal(freshTask.manual_contribution.original.value.content,original.content);
    assert.equal(JSON.parse(freshTask.manual_contribution.downstream[0].text).available,12);
    console.log(JSON.stringify({test:"manual-contribution",status:"PASS",checked_downstream_bytes:true,producer_exited_before_reader:true,manual_relay:"local files",public_preparation_stages:4,saved_manual_guidance:true,different_task_reassessment:true,legacy_history:true,external_participation:"NOT_RUN",provider_observations:0}));
  }finally{
    let exportError;try{if(destination&&existsSync(path.join(owner.root,"artifacts"))){mkdirSync(destination);cpSync(path.join(owner.root,"artifacts"),destination,{recursive:true,errorOnExist:true});}}catch(e){exportError=e;}
    if(settled)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
    const cleanup=cleanupCanonicalTestResources([owner]);console.log(JSON.stringify({test:"manual-contribution-cleanup",cleanup}));
    assert(cleanup.every((r:any)=>r.completed));if(exportError)throw exportError;
  }
}
void main();
