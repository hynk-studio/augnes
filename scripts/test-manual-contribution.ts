import assert from "node:assert/strict";
import { existsSync,mkdirSync,readFileSync,cpSync } from "node:fs";
import path from "node:path";
import {runCanonicalChild,canonicalChildAcceptanceFailure} from "./canonical-child-runner.mjs";
import {createCanonicalTestResourceRoot,beginCanonicalTestResourceUse,settleCanonicalTestResourceUse,cleanupCanonicalTestResources} from "./canonical-test-environment.mjs";
const destination=process.argv[2];
// Each production-route process took about 25s or less in development. Give
// the serial qualification run bounded headroom without changing other tests.
const childTimeoutMs=60_000;
assert(!destination||(path.isAbsolute(destination)&&!existsSync(destination)));
const owner=createCanonicalTestResourceRoot("ag-suite-",{shortSocketPaths:true});
async function main(){
  beginCanonicalTestResourceUse(owner);let settled=true;
  try{
    for(const role of ["producer","consumer"]){
      settled=false;
      const result=await runCanonicalChild({suite:"manual-contribution",label:role,command:process.execPath,
        args:["--import","tsx",role==="producer"?"scripts/manual-contribution-fixture.ts":"scripts/manual-contribution-followup.ts",role,owner.root],
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
    console.log(JSON.stringify({test:"manual-contribution",status:"PASS",checked_downstream_bytes:true,producer_exited_before_reader:true,manual_relay:"local files",external_participation:"NOT_RUN",provider_observations:0}));
  }finally{
    let exportError;try{if(destination&&existsSync(path.join(owner.root,"artifacts"))){mkdirSync(destination);cpSync(path.join(owner.root,"artifacts"),destination,{recursive:true,errorOnExist:true});}}catch(e){exportError=e;}
    if(settled)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
    const cleanup=cleanupCanonicalTestResources([owner]);console.log(JSON.stringify({test:"manual-contribution-cleanup",cleanup}));
    assert(cleanup.every((r:any)=>r.completed));if(exportError)throw exportError;
  }
}
void main();
