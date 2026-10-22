import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, cpSync } from "node:fs";
import path from "node:path";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
const destination=process.argv[2], reproduction=process.argv.includes("--reproduce");
assert(!destination||(path.isAbsolute(destination)&&!existsSync(destination)));
const owner=createCanonicalTestResourceRoot("ag-suite-",{shortSocketPaths:true});
async function main(){
  beginCanonicalTestResourceUse(owner);let settled=true;
  try{
    for(const role of reproduction?["successor"]:["successor","consumer"]){
      settled=false;
      // Only the disposable runtime's scope/config is passed to the fresh reader;
      // no request, return, decision, expected result or producer memory is input.
      const env=role==="consumer"?{...process.env,...JSON.parse(readFileSync(path.join(owner.root,"artifacts","fixture-operator-environment.json"),"utf8"))}:process.env;
      const result=await runCanonicalChild({suite:"manual-contribution-successor",label:role,command:process.execPath,
        args:["--import","tsx",role==="successor"?"scripts/manual-contribution-successor.ts":"scripts/manual-contribution-followup.ts",role,owner.root,...(reproduction?["--reproduce"]:[])],
        cwd:process.cwd(),env,timeoutMs:60_000,heartbeatMs:5000,resourceOwner:undefined});
      settled=result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0;
      assert.equal(canonicalChildAcceptanceFailure(result,{suite:"manual-contribution-successor",timeoutMs:60_000,requireNaturalExit:true}),null);
    }
    const read=(name:string)=>JSON.parse(readFileSync(path.join(owner.root,"artifacts",name+".json"),"utf8"));
    if(!reproduction){
      const fresh=read("fresh-read"),m=fresh.manual_contribution,original=read("original-return"),creation=read("successor-creation");
      assert.equal(m.task_identity,creation.origin);assert.notEqual(m.task_identity,creation.initialIdentity);
      assert.equal(m.decision_currentness,"saved_basis_retained");assert.equal(m.original.selection,"historical_not_selected");
      assert.equal(m.original.value.content,original.content);
      assert.deepEqual(m.feedback.delivery,read("manual-feedback-relay"));
      const inventory=JSON.parse(m.request.value.material[0].text),card=JSON.parse(m.downstream[0].text);
      assert.equal(card.available,inventory.counted-inventory.reserved);assert.equal(card.top_up,inventory.target-card.available);
      assert.equal(card.order_authorized,false);
      assert.equal(read("fresh-card").text,"Available: 12\nTop up: 8\nBefore ordering: Confirm shelf stock before ordering\n");
      const trace=read("successor-trace");
      for(const action of ["participate","receive","assess","feedback"]){
        const row=trace.find((r:any)=>r.arguments?.action===action&&r.result?.status==="prepared");assert(row);
        assert.equal(row.result.prepared_stage,action);
        const text=row.content.map((c:any)=>c.text??"").join("\n");
        assert(text.includes(`Work: ${row.result.work.goal}`));assert(text.includes("Arrangement: Manual contribution"));
        assert.match(text,/nothing has been saved or dispatched/u);assert(!/unavailable|No arrangement has been selected/u.test(text));
      }
      assert(read("successor-identities").length>=8);
    }
    console.log(JSON.stringify({test:"manual-contribution-successor",status:"PASS",reproduction,actual_supported_writers:true,fresh_process:!reproduction,provider_observations:0}));
  }finally{
    let exportError;try{if(destination&&existsSync(path.join(owner.root,"artifacts"))){mkdirSync(destination);cpSync(path.join(owner.root,"artifacts"),destination,{recursive:true,errorOnExist:true});}}catch(e){exportError=e;}
    if(settled)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
    const cleanup=cleanupCanonicalTestResources([owner]);console.log(JSON.stringify({test:"manual-contribution-successor-cleanup",cleanup}));
    assert(cleanup.every((r:any)=>r.completed));if(exportError)throw exportError;
  }
}
void main();
