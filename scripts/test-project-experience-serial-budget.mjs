import {readFileSync} from "node:fs";
import {validProjectExperienceConnection} from "./project-experience-connection.mjs";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_ENVELOPE_MS, projectExperienceSteps, projectExperienceBudgetEvent as event,
  createProjectExperienceBudget, validProjectExperienceAccounting, runProjectExperienceChildren, runProjectExperienceParent } from "./project-experience-serial-budget.mjs";

const quiet = new PassThrough(); quiet.resume();
const root = process.cwd(), findings=[];
assert.equal(PROJECT_EXPERIENCE_ENVELOPE_MS,730000);
assert.deepEqual(PROJECT_EXPERIENCE_SERIAL.children.map(c=>c.timeoutMs),[360000,60000,180000,60000]);
// Controlled execution durations advance only at actual fixture-process IPC.
// The real runner owns natural exit, cancellation, descendants and resources;
// no production command or individual limit accepts a runtime override.
async function scenario({ oldDeadline=false, failChild=false, timeout=false, forced=false, incomplete=false, coordinator=0 }={}) {
  const owners=PROJECT_EXPERIENCE_SERIAL.children.map((_,i)=>i).map(()=>createCanonicalTestResourceRoot("ag-resource-test-")), controller=new AbortController();
  let at=0, index=0, error=null, children=[], cleanup;
  const budget=createProjectExperienceBudget({now:()=>at,onFailure:()=>controller.abort()});
  budget.event(event("ready",0));
  const steps=projectExperienceSteps(root);
  try {
    await runProjectExperienceChildren({steps,root,signal:controller.signal,emit:budget.event,runChild:async opts=>{
      const owner=owners[index];
      at+=coordinator;
      const duration=[328081,14302,171428,20000][index];
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
    budget.event(event("complete",PROJECT_EXPERIENCE_SERIAL.children.length));
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
assert.deepEqual(current.accounting.execution_ms,[328081,14302,171428,20000]); assert.equal(current.accounting.coordinator_ms,0);
assert.deepEqual(current.accounting.natural_settlement_ms,[100,100,100,100]);
findings.push("same shared serial owner completes all four naturally with disjoint accounting");
for(const name of ["failChild","timeout","forced","incomplete"]) { const result=await scenario({[name]:true});assert(result.error,name); }
findings.push("assertion failure, child timeout, forced descendant cleanup and incomplete cleanup remain failures");
const coordination=await scenario({coordinator:31000}); assert.equal(coordination.accounting.failure_code,"serial_coordinator_budget_exceeded");
assert(coordination.error); findings.push("independent coordinator budget refuses despite unused child allowances");
for(const mutate of [s=>s.reverse(),s=>s.pop(),s=>s.push({...s[3]}),s=>s[0].timeoutMs++,s=>s[1].args.push("--override"),s=>s[2].requirements.pop()]) {
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
const messages=[event("ready",0),...PROJECT_EXPERIENCE_SERIAL.children.flatMap((_,i)=>i).flatMap(i=>[event("execution",i),event("settlement",i),event("coordinator",i)]),event("complete",PROJECT_EXPERIENCE_SERIAL.children.length)];
const parent=await runProjectExperienceParent({suite:"serial-parent",label:"IPC accounting",command:process.execPath,
  args:["-e",`for (const message of ${JSON.stringify(messages)}) process.send(message);`],cwd:root,
  timeoutMs:730000,stdout:quiet,stderr:quiet,log(){}});
assert.equal(canonicalChildAcceptanceFailure(parent,{requireNaturalExit:true}),null);
assert.equal(parent.serial_budget.complete,true);assert.equal(parent.serial_budget.failure_code,null);
assert(parent.serial_budget.parent_post_exit_settlement_ms>=0);
findings.push("actual Node parent IPC separates execution envelope from post-exit settlement");
let fractionalAt=0;
const fractional=createProjectExperienceBudget({now:()=>fractionalAt});fractional.event(event("ready",0));
for(let i=0;i<PROJECT_EXPERIENCE_SERIAL.children.length;i++) {
  fractionalAt+=(3*71+i*137)/1e6;fractional.event(event("execution",i));
  fractionalAt+=(3*11111+i*17)/1e6;fractional.event(event("settlement",i));
  fractionalAt+=(3*307+i*13)/1e6;fractional.event(event("coordinator",i));
}
fractional.event(event("complete",PROJECT_EXPERIENCE_SERIAL.children.length));
assert(validProjectExperienceAccounting({...fractional.stop(),parent_post_exit_settlement_ms:1}));
const suiteSource=readFileSync("scripts/run-canonical-test-suite.mjs","utf8"), parentSource=readFileSync("scripts/run-local-canonical-verification.mjs","utf8");
assert(validProjectExperienceConnection(suiteSource,parentSource));
// Coherent unchanged orchestration plus comment/literal copies of new calls
// cannot stand in for an executable connection, even with matching file hashes.
const snippets='const [projectExperienceStep, projectClientBrowserStep, webPlanningBrowserStep, webPlanningDraftSafetyStep] = projectExperienceSteps(repoRoot); else if (serialBudget) { completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial }); } allowAcquire: !serialBudget';
for(const fake of ['/* '+snippets+' */', 'export const unused = '+JSON.stringify(snippets)+';', 'function unused() { '+snippets+' }'])
  assert.equal(validProjectExperienceConnection('const oldSerialLoop = true;\n'+fake,parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource,parentSource+'\n'+parentSource),false);
const liveBranch='else if (serialBudget) {\n    completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial });\n  }';
assert(suiteSource.includes(liveBranch));
const regexFake='if (false) /else if (serialBudget) { completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial }); }/;';
new Function(regexFake);
assert.equal(validProjectExperienceConnection(suiteSource.replace(liveBranch,'').replace('let completedResults;', 'let completedResults; '+regexFake),parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource.replace('"e2e-project-experience": [{ ...projectExperienceStep }, { ...projectClientBrowserStep }, { ...webPlanningBrowserStep }, { ...webPlanningDraftSafetyStep }]', '"e2e-project-experience": []'),parentSource),false);
assert.equal(validProjectExperienceConnection(suiteSource.replace(/const serialBudget = serialController \? createProjectExperienceBudget\(\{[\s\S]*?\}\) : null;/u, 'const serialBudget = null;'),parentSource),false);
console.log(JSON.stringify({contract:"serial-aggregate-budget-controls.v1",synthetic_only:true,findings,
  controls:["child_failure","child_timeout","forced_cleanup","incomplete_cleanup","coordinator_excess","inventory_mismatch","no_child_borrowing","settlement_excess","parent_ipc","caller_connection"],
  old:{result:"interrupted",cleanup_complete:true,completed_children:2,interrupted_child:"web-planning-browser",still_eligible:true},
  corrected:current.accounting,cleanup_complete:true}));
