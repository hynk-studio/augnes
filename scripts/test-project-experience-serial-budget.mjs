import {readFileSync} from "node:fs";
import {validProjectExperienceConnection} from "./project-experience-connection.mjs";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { performance } from "node:perf_hooks";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_ENVELOPE_MS, projectExperienceSteps, projectExperienceBudgetEvent as event,
  createProjectExperienceBudget, validProjectExperienceAccounting, runProjectExperienceChildren, runProjectExperienceParent } from "./project-experience-serial-budget.mjs";

const quiet = new PassThrough(); quiet.resume();
const root = process.cwd(), findings=[];
assert.equal(PROJECT_EXPERIENCE_ENVELOPE_MS,660000);
assert.deepEqual(PROJECT_EXPERIENCE_SERIAL.children.map(c=>c.timeoutMs),[360000,60000,180000]);
// Controlled execution durations advance only at actual fixture-process IPC.
// The real runner owns natural exit, cancellation, descendants and resources;
// no production command or individual limit accepts a runtime override.
async function scenario({ oldDeadline=false, failChild=false, timeout=false, forced=false, incomplete=false, coordinator=0 }={}) {
  const owners=[0,1,2].map(()=>createCanonicalTestResourceRoot("ag-resource-test-")), controller=new AbortController();
  let at=0, index=0, error=null, children=[], cleanup;
  const budget=createProjectExperienceBudget({now:()=>at,onFailure:()=>controller.abort()});
  budget.event(event("ready",0));
  const steps=projectExperienceSteps(root);
  try {
    await runProjectExperienceChildren({steps,root,signal:controller.signal,emit:budget.event,runChild:async opts=>{
      const owner=owners[index];
      at+=coordinator;
      const duration=[328081,14302,171428][index];
      const source=forced && index===0 ? 'import {spawn} from "node:child_process"; spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"inherit"}); process.send("ready");' :
        timeout && index===0 ? 'process.send("ready"); setInterval(()=>{},1000);' : 'process.send("ready"); setTimeout(()=>process.exitCode='+ (failChild && index===1 ? 1 : 0)+',10);';
      let result=await runCanonicalChild({...opts,command:process.execPath,args:["--input-type=module","-e",source],
        env:buildCanonicalChildEnvironment({temporaryRoot:owner.root}),resourceOwner:owner,
        timeoutMs:timeout ? 150 : 2000,termGraceMs:100,killGraceMs:1000,heartbeatMs:0,stdout:quiet,stderr:quiet,log(){},
        onMessage:()=>{ at+=duration; if(oldDeadline && at>480000) {at=480000;controller.abort();} },
        onBoundary:state=>{ if(state==="coordinator") at+=100; opts.onBoundary(state); },
      });
      children.push(result); index++;
      if(incomplete) result={...result,cleanup_completed:false};
      return result;
    }});
    budget.event(event("complete",3));
  } catch(e) { error=e; }
  finally { cleanup=cleanupCanonicalTestResources(owners); }
  const accounting=budget.stop({requireComplete:!error});
  assert(cleanup.every(c=>c.completed));
  assert(children.every(c=>c.cleanup_completed && c.remaining_owned_processes===0 && c.streams_closed));
  return {error,accounting,children};
}
const old=await scenario({oldDeadline:true}); assert(old.error); assert.equal(old.children.length,3,String(old.error)+JSON.stringify(old.children)); assert(old.children[2].cancelled);
findings.push("old aggregate interrupts an eligible third fixture child; cleanup settles");
const current=await scenario(); assert.equal(current.error,null); assert.equal(current.accounting.complete,true);
assert.deepEqual(current.accounting.execution_ms,[328081,14302,171428]); assert.equal(current.accounting.coordinator_ms,0);
assert.deepEqual(current.accounting.natural_settlement_ms,[100,100,100]);
findings.push("same shared serial owner completes all three naturally with disjoint accounting");
for(const name of ["failChild","timeout","forced","incomplete"]) { const result=await scenario({[name]:true});assert(result.error,name); }
findings.push("assertion failure, child timeout, forced descendant cleanup and incomplete cleanup remain failures");
const coordination=await scenario({coordinator:31000}); assert.equal(coordination.accounting.failure_code,"serial_coordinator_budget_exceeded");
assert(coordination.error); findings.push("independent coordinator budget refuses despite unused child allowances");
for(const mutate of [s=>s.reverse(),s=>s[0].timeoutMs++,s=>s[1].args.push("--override"),s=>s[2].requirements.pop()]) {
  const steps=projectExperienceSteps(root);mutate(steps);
  await assert.rejects(runProjectExperienceChildren({steps,root,emit(){},runChild(){throw Error("must not spawn");}}),/serial_inventory_disagreement/u);
}
findings.push("order, limits, commands and requirement overrides refuse before spawn");
let at=0;const noBorrow=createProjectExperienceBudget({now:()=>at});noBorrow.event(event("ready",0));
noBorrow.event(event("execution",0));at=1;noBorrow.event(event("settlement",0));noBorrow.event(event("coordinator",0));
noBorrow.event(event("execution",1));at+=60001;noBorrow.event(event("settlement",1));
assert.equal(noBorrow.stop({requireComplete:false}).failure_code,"serial_child_execution_budget_exceeded");
const settlement=createProjectExperienceBudget({now:()=>at});settlement.event(event("ready",0));settlement.event(event("execution",0));
settlement.event(event("settlement",0));at+=10001;assert.equal(settlement.stop({requireComplete:false}).failure_code,"serial_child_settlement_budget_exceeded");
// The parent receives actual IPC, checks completion and stops its clock on exit.
const messages=[event("ready",0),...[0,1,2].flatMap(i=>[event("execution",i),event("settlement",i),event("coordinator",i)]),event("complete",3)];
const parent=await runProjectExperienceParent({suite:"serial-parent",label:"IPC accounting",command:process.execPath,
  args:["-e",`for (const message of ${JSON.stringify(messages)}) process.send(message);`],cwd:root,
  timeoutMs:660000,stdout:quiet,stderr:quiet,log(){}});
assert.equal(canonicalChildAcceptanceFailure(parent,{requireNaturalExit:true}),null);
assert.equal(parent.serial_budget.complete,true);assert.equal(parent.serial_budget.failure_code,null);
assert(parent.serial_budget.parent_post_exit_settlement_ms>=0);
findings.push("actual Node parent IPC separates execution envelope from post-exit settlement");
// A naturally exited root can still violate the IPC contract while the real
// runner drains its descendant. Observe callbacks and the real clock only;
// never substitute lifecycle results, terminal state or acceptance.
const terminalIPC=[];
for (const [kind, lateMessage] of [["malformed", {bad:"late-message"}], ["duplicate_complete", event("complete",3)]]) {
  const owner=createCanonicalTestResourceRoot("ag-resource-test-");
  const clockReads=[], callbacks=[]; let readsAtExit, result, cleanup;
  const descendant=`setTimeout(() => require("node:fs").writeSync(3, ${JSON.stringify(JSON.stringify(lateMessage)+"\n")}), 150);`;
  const source=`const messages=${JSON.stringify(messages)};
    function sendNext() {
      const message=messages.shift();
      if (message) process.send(message, sendNext);
      else {
        require("node:child_process").spawn(process.execPath,["-e",${JSON.stringify(descendant)}],{stdio:["ignore",1,2,3]});
        process.exit(0);
      }
    }
    sendNext();`;
  try {
    result=await runProjectExperienceParent({suite:"serial-parent",label:"late "+kind,command:process.execPath,
      args:["-e",source],cwd:root,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root}),resourceOwner:owner,
      timeoutMs:660000,stdout:quiet,stderr:quiet,log(){}}, {
      clock:{now(){const value=performance.now();clockReads.push(value);return value;}},
      runChild:options=>runCanonicalChild({...options,
        onMessage:message=>{const error=options.onMessage(message);callbacks.push({after_exit:readsAtExit!==undefined,code:error?.code??null});return error;},
        onBoundary:(state,terminal)=>{options.onBoundary(state,terminal);if(state==="settlement") readsAtExit=clockReads.length;},
      }),
    });
  } finally { cleanup=cleanupCanonicalTestResources([owner]); }
  const witness={kind,callbacks,serial_budget:result.serial_budget,accounting_accepted:validProjectExperienceAccounting(result.serial_budget),
    canonical_acceptance_failure:canonicalChildAcceptanceFailure(result,{requireNaturalExit:true})?.code??null,
    exit_code:result.exit_code,cancelled:result.cancelled,timed_out:result.timed_out,termination_reason:result.termination_reason,
    remaining_owned_processes:result.remaining_owned_processes,cleanup_completed:result.cleanup_completed,
    resource_cleanup_completed:cleanup.every(c=>c.completed),clock_reads_at_exit:readsAtExit,clock_reads_after_settlement:clockReads.length};
  terminalIPC.push(witness);
  assert.deepEqual(callbacks.at(-1),{after_exit:true,code:"serial_event_after_exit"});
  assert.equal(witness.canonical_acceptance_failure,null);
  assert.equal(witness.exit_code,0);assert.equal(witness.cancelled,false);assert.equal(witness.timed_out,false);
  assert.equal(witness.termination_reason,"natural_exit");assert.equal(witness.remaining_owned_processes,0);
  assert(witness.cleanup_completed && witness.resource_cleanup_completed);
  assert.equal(clockReads.length,readsAtExit,"post-exit drain must not advance the execution clock");
  assert.equal(result.serial_budget.envelope_elapsed_ms,clockReads.at(-1)-clockReads[0]);
}
// Keep raw witnesses even when the regression fails against historical source.
console.error(JSON.stringify({terminal_ipc:terminalIPC}));
for (const witness of terminalIPC) {
  assert.equal(witness.serial_budget.failure_code,"serial_event_after_exit",witness.kind);
  assert.equal(witness.accounting_accepted,false,witness.kind);
}
findings.push("late malformed and duplicate complete IPC remain budget failures after natural exit and complete cleanup");
let fractionalAt=0;
const fractional=createProjectExperienceBudget({now:()=>fractionalAt});fractional.event(event("ready",0));
for(let i=0;i<3;i++) {
  fractionalAt+=(3*71+i*137)/1e6;fractional.event(event("execution",i));
  fractionalAt+=(3*11111+i*17)/1e6;fractional.event(event("settlement",i));
  fractionalAt+=(3*307+i*13)/1e6;fractional.event(event("coordinator",i));
}
fractional.event(event("complete",3));
assert(validProjectExperienceAccounting({...fractional.stop(),parent_post_exit_settlement_ms:1}));
const suiteSource=readFileSync("scripts/run-canonical-test-suite.mjs","utf8"), parentSource=readFileSync("scripts/run-local-canonical-verification.mjs","utf8");
assert(validProjectExperienceConnection(suiteSource,parentSource));
// Coherent unchanged orchestration plus comment/literal copies of new calls
// cannot stand in for an executable connection, even with matching file hashes.
const snippets='const [projectExperienceStep, projectClientBrowserStep, webPlanningBrowserStep] = projectExperienceSteps(repoRoot); else if (serialBudget) { completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial }); } allowAcquire: !serialBudget';
for(const fake of ['/* '+snippets+' */', 'export const unused = '+JSON.stringify(snippets)+';', 'function unused() { '+snippets+' }'])
  assert.equal(validProjectExperienceConnection('const oldSerialLoop = true;\n'+fake,parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource,parentSource+'\n'+parentSource),false);
const liveBranch='else if (serialBudget) {\n    completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial });\n  }';
assert(suiteSource.includes(liveBranch));
const regexFake='if (false) /else if (serialBudget) { completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial }); }/;';
new Function(regexFake);
assert.equal(validProjectExperienceConnection(suiteSource.replace(liveBranch,'').replace('let completedResults;', 'let completedResults; '+regexFake),parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource.replace('"e2e-project-experience": [{ ...projectExperienceStep }, { ...projectClientBrowserStep }, { ...webPlanningBrowserStep }]', '"e2e-project-experience": []'),parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource.replace(/const serialBudget = serialController \? createProjectExperienceBudget\(\{[\s\S]*?\}\) : null;/u, 'const serialBudget = null;'),parentSource),false);
console.log(JSON.stringify({contract:"serial-aggregate-budget-controls.v1",synthetic_only:true,findings,
  controls:["child_failure","child_timeout","forced_cleanup","incomplete_cleanup","coordinator_excess","inventory_mismatch","no_child_borrowing","settlement_excess","parent_ipc","caller_connection"],
  old:{result:"interrupted",cleanup_complete:true,completed_children:2,interrupted_child:"web-planning-browser",still_eligible:true},
  corrected:current.accounting,terminal_ipc:terminalIPC,cleanup_complete:true}));
