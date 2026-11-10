import assert from 'node:assert/strict';
import { existsSync,mkdirSync,readFileSync,cpSync } from 'node:fs';
import path from 'node:path';
import {runCanonicalChild,canonicalChildAcceptanceFailure} from './canonical-child-runner.mjs';
import {createCanonicalTestResourceRoot,beginCanonicalTestResourceUse,settleCanonicalTestResourceUse,cleanupCanonicalTestResources} from './canonical-test-environment.mjs';
const destination=process.argv[2],timeoutMs=60_000;
assert(!destination||(path.isAbsolute(destination)&&!existsSync(destination)));
const owner=createCanonicalTestResourceRoot('ag-suite-',{shortSocketPaths:true});
async function main(){
 beginCanonicalTestResourceUse(owner);let settled=true;
 try{
  for(const role of ['producer','consumer','boundary']){
   settled=false;
   const result=await runCanonicalChild({suite:'operating-profile-contribution',label:role,command:process.execPath,args:['--import','tsx',role==='producer'?'scripts/operating-profile-contribution-fixture.ts':role==='consumer'?'scripts/operating-profile-contribution-followup.ts':'scripts/operating-profile-contribution-boundaries.ts',role,owner.root],cwd:process.cwd(),env:process.env,timeoutMs,heartbeatMs:5000,resourceOwner:undefined});
   settled=result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0;
   assert.equal(canonicalChildAcceptanceFailure(result,{suite:'operating-profile-contribution',timeoutMs,requireNaturalExit:true}),null);
  }
  const read=(name:string)=>JSON.parse(readFileSync(path.join(owner.root,'artifacts',name+'.json'),'utf8'));
  const fresh=read('fresh-read'),producer=read('producer-results'),m=fresh.manual_contribution;
  assert.equal(m.operating_profile.fingerprint,producer.profile_fingerprint);assert.equal(m.operating_profile.selection,'historical_not_selected');
  assert.equal(m.original.value.content,readFileSync(path.join(owner.root,'artifacts','original-return.txt'),'utf8'));
  assert.equal(m.decision_currentness,'saved_basis_retained');assert.equal(m.decision.value.disposition,'partly_used');
  const profileText=readFileSync(path.join(owner.root,'artifacts','profile-input.json'),'utf8');assert.deepEqual(JSON.parse(profileText),m.operating_profile.profile);
  assert.equal(read('fresh-followup').content,'# Follow-up for job-7\n\nSelected step: inspect — Obtain selected manifest\nManifest: backup.sh, declared owner ops.\nRetained explanations: Legitimate automation; Credential misuse.\nNext check: Verify actor identity and approval.\nReconsider: Task, alert or manifest changes.\nNo execution authorized.\n');
  const trace=read('producer-trace');
  assert(trace.some((r:any)=>r.arguments?.action==='participate'&&r.content?.some((c:any)=>c.text?.includes('step: inspect'))));
  console.log(JSON.stringify({status:'PASS',checks:producer.checks,fresh_process:true,full_profile_read:true,actual_followup:true,original_bytes_preserved:true,external_participation:'NOT_RUN',provider_calls:0}));
 }finally{
  let exportError;try{if(destination&&existsSync(path.join(owner.root,'artifacts'))){mkdirSync(destination);cpSync(path.join(owner.root,'artifacts'),destination,{recursive:true,errorOnExist:true});}}catch(e){exportError=e;}
  if(settled)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
  const cleanup=cleanupCanonicalTestResources([owner]);console.log(JSON.stringify({cleanup}));assert(cleanup.every((r:any)=>r.completed));if(exportError)throw exportError;
 }
}
void main();
