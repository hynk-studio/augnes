// Bounded, synthetic fault controls for the D1-local composition.
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bounded,wait,listenerClosed,runDevelopmentChild,withDevelopmentFixture,writeJson} from './web-planning-continuation.mjs';
import {createCanonicalTestResourceRoot,cleanupCanonicalTestResources} from './canonical-test-environment.mjs';
import {runCanonicalChild} from './canonical-child-runner.mjs';
const self=fileURLToPath(import.meta.url),flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function controlledClock(){
  let id=0;const timers=new Map();
  return {timers,setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(key){timers.delete(key);},fire(ms){const row=[...timers].find(([,v])=>v.ms===ms);assert(row,'expected controlled timer '+ms);timers.delete(row[0]);row[1].fn();}};
}
const injected=code=>Object.assign(new Error('synthetic injected failure'),{code});
async function deadlineControls(){
  const rows=[];
  {
    const clock=controlledClock();let calls=0,error;
    const task=wait(()=>{calls++;return false;},'no-late-polls',{ms:10,intervalMs:2,clock}).catch(e=>error=e);
    await flush();clock.fire(10);await task;const atReturn=calls;await flush();
    assert.equal(calls,1);assert.equal(calls,atReturn);assert.equal(clock.timers.size,0);assert.equal(error.code,'development_deadline');assert.equal(error.settlement,'observed-settled');
    rows.push({check:'no-post-deadline-poll',calls_at_return:atReturn,calls_after:calls,timers_remaining:clock.timers.size});
  }
  {
    const clock=controlledClock();let release,calls=0,returned=false,error;
    const task=wait(()=>{calls++;return new Promise(r=>release=r);},'awaited-predicate',{ms:10,intervalMs:2,clock}).catch(e=>{error=e;returned=true;});
    await flush();clock.fire(10);await flush();assert.equal(returned,false);release(false);await task;
    assert.equal(calls,1);assert.equal(error.settlement,'observed-settled');assert.equal(clock.timers.size,0);
    rows.push({check:'expiry-during-await',returned_before_settlement:false,predicate_calls:calls,settlement:error.settlement});
  }
  {
    const clock=controlledClock();let release,error;
    const task=bounded(()=>new Promise(r=>release=r),'unsettled',10,{settleMs:20,clock}).catch(e=>error=e);
    await flush();clock.fire(10);await flush();clock.fire(20);await task;assert.equal(error.settlement,'unresolved');release();await flush();assert.equal(clock.timers.size,0);
    rows.push({check:'unsettled-operation-reported',settlement_at_return:error.settlement,controlled_operation_later_released:true});
  }
  {
    const clock=controlledClock();let destroys=0,returned=false,error;
    class Socket extends EventEmitter{connect(){this.connected=true;}destroy(){destroys++;}}
    const socket=new Socket(),task=listenerClosed(12345,{ms:10,settleMs:20,clock,socketFactory:()=>socket}).catch(e=>{returned=true;error=e;});
    await flush();clock.fire(10);await flush();assert.equal(destroys,1);assert.equal(returned,false);
    socket.emit('close');await task;assert.equal(error.settlement,'observed-settled');assert.equal(clock.timers.size,0);
    rows.push({check:'listener-deadline-disposes-and-joins-close',destroy_calls:destroys,returned_before_close:false,settlement:error.settlement});
  }
  {
    class Socket extends EventEmitter{connect(){queueMicrotask(()=>this.emit('error',Object.assign(new Error('refused'),{code:'ECONNREFUSED'})));}destroy(){queueMicrotask(()=>this.emit('close'));}}
    assert.equal(await listenerClosed(12345,{socketFactory:()=>new Socket()}),true);rows.push({check:'listener-refused-only-after-close',pass:true});
  }
  return rows;
}
async function parentControls(output){
  const rows=[];
  for(const faultStage of ['root.allocated','prepare.runtime-state','request.prepare']){
    let owner,runs=0,error;const dest=path.join(output,faultStage.replaceAll('.','-'));
    try{await runDevelopmentChild(self,[],dest,{},false,{fault(at,o){owner=o;if(at===faultStage)throw injected('EACCES');},runChild(){runs++;throw Error('must not run');}});}catch(e){error=e;}
    assert.equal(error.code,'development_child_failed');assert.equal(error.report.primary_error.stage,faultStage);assert.equal(error.report.primary_error.code,'EACCES');assert.equal(runs,0);assert.equal(error.report.child_state,'not-created');assert.equal(error.report.disposable_root_removed,true);assert.equal(existsSync(owner.root),false);assert.equal(existsSync(path.join(dest,'result.json')),false);
    rows.push({check:faultStage,child_calls:runs,root_removed:true,primary:error.report.primary_error});
  }
  {
    let owner,error;const dest=path.join(output,'report-failure');
    try{await runDevelopmentChild(self,[],dest,{},false,{fault(at,o){owner=o;if(at==='request.prepare')throw injected('PRIMARY_INJECTED');},writeReport(){throw injected('REPORT_INJECTED');}});}catch(e){error=e;}
    assert.equal(error.cause.code,'PRIMARY_INJECTED');assert.equal(error.report.primary_error.code,'PRIMARY_INJECTED');assert(error.report.secondary_errors.some(e=>e.code==='REPORT_INJECTED'));assert.equal(existsSync(owner.root),false);
    await writeJson(path.join(dest,'returned-error.json'),error.report);rows.push({check:'primary-survives-report-failure',primary:error.cause.code,secondary:error.report.secondary_errors,root_removed:true});
  }
  {
    let owner,error;const dest=path.join(output,'before-fixture');
    try{await runDevelopmentChild(self,['--fail-before-fixture'],dest,{},false,{fault(at,o){owner=o;}});}catch(e){error=e;}
    try{
      assert.equal(error.report.child_state,'observed-settled');assert.equal(error.report.recovery.root,owner.root);assert.equal(error.report.recovery.device,owner.device);assert.equal(error.report.recovery.inode,owner.inode);assert.equal(error.report.recovery.cleanup_withheld_reason,'fixture_settlement_unproven');assert(existsSync(owner.root));assert(!existsSync(path.join(dest,'result.json')));
      rows.push({check:'child-before-fixture',root_retained_at_failure:true,recovery:error.report.recovery,primary:error.report.primary_error});
    }finally{
      // This dedicated child mode creates no Worker/browser. Its real Canonical
      // exit/stream evidence is settled; the test owner can now remove its root.
      const recovery=cleanupCanonicalTestResources([owner]);assert(recovery.every(r=>r.completed));await writeJson(path.join(dest,'test-recovery.json'),{basis:'dedicated child mode has no fixture creation; observed Canonical settlement',recovery});
    }
  }
  {
    let owner,error,completion,settled=false;const dest=path.join(output,'unsettled-child');
    try{
      try{await runDevelopmentChild(self,['--holding-child'],dest,{},false,{fault(at,o){owner=o;},async runChild(options){
        let spawned;const ready=new Promise(r=>spawned=r);
        completion=runCanonicalChild({...options,timeoutMs:5000,onSpawn:pid=>{assert(pid);options.onSpawn(pid);spawned();}}).then(result=>{settled=true;return result;});
        await ready;throw injected('INJECTED_OBSERVATION_LOST');
      }});}catch(e){error=e;}
      assert.equal(settled,false);assert.equal(error.report.child_state,'unresolved');assert.equal(error.report.disposable_root_removed,false);assert.equal(error.report.recovery.cleanup_withheld_reason,'child_settlement_unknown');assert.equal(error.report.primary_error.code,'INJECTED_OBSERVATION_LOST');assert(existsSync(owner.root));
      rows.push({check:'genuinely-in-flight-child-retained',settled_at_retention:settled,recovery:error.report.recovery,primary:error.report.primary_error});
    }finally{
      await writeFile(path.join(owner.root,'release'),'release',{flag:'wx'});const result=await completion;
      assert.equal(result.exit_code,0);assert.equal(result.termination_reason,'natural_exit');assert(result.exit_observed&&result.streams_closed&&result.cleanup_completed);
      const recovery=cleanupCanonicalTestResources([owner]);assert(recovery.every(r=>r.completed));await writeJson(path.join(dest,'test-recovery.json'),{basis:'explicit test release followed by real Canonical settlement; no forced owner release',result,recovery});
    }
  }
  return rows;
}
async function fixtureControls(output){
  const rows=[];
  for(const mode of ['partial-initialize','created-then-port-failure','fixture-report-failure']){
    const owner=createCanonicalTestResourceRoot('ag-suite-'),dest=path.join(output,mode);await mkdir(dest);let error,closed=0;
    try{
      try{await withDevelopmentFixture(dest,false,()=>{throw Error('must not reach operation');},{root:owner.root,
        startLocal:async()=>{if(mode==='partial-initialize')throw injected('INITIALIZATION_INJECTED');return {close:async()=>{closed++;}};},
        availablePort:async()=>{throw injected('PORT_INJECTED');},
        ...(mode==='fixture-report-failure'?{writeReport(){throw injected('REPORT_INJECTED');}}:{})
      });}catch(e){error=e;}
      assert(error);const report=error.fixture_report;assert.equal(report.operation_succeeded,false);assert.equal(report.resources.browser,'not-created');assert.equal(report.browser_exit_observed,null);
      if(mode==='partial-initialize'){assert.equal(report.resources.worker,'unresolved');assert.equal(report.worker_disposed,null);assert.equal(report.complete,false);assert.equal(closed,0);}
      else{assert.equal(report.resources.worker,'observed-settled');assert.equal(closed,1);assert.equal(error.code,'PORT_INJECTED');assert.equal(report.complete,mode!=='fixture-report-failure');}
      if(mode==='fixture-report-failure'){assert(report.failures.some(f=>f.code==='REPORT_INJECTED'));await writeJson(path.join(dest,'returned-error.json'),report);}
      rows.push({check:mode,resources:report.resources,cleanup_complete:report.complete,primary:report.primary_error,failures:report.failures});
    }finally{
      // Injected startLocal creates no actual process; test-owned state is known.
      const recovery=cleanupCanonicalTestResources([owner]);assert(recovery.every(r=>r.completed));await writeJson(path.join(dest,'test-recovery.json'),{basis:'injected fixture dependencies created no external resources',recovery});
    }
  }
  return rows;
}
if(process.argv[2]==='--fail-before-fixture')throw injected('BEFORE_FIXTURE_INJECTED');
else if(process.argv[2]==='--holding-child')await wait(()=>existsSync(path.join(process.env.AUGNES_CANONICAL_TEMP_ROOT,'release')),'test.release',{ms:3000,intervalMs:5});
else{
  assert.equal(process.argv.length,3);const output=path.resolve(process.argv[2]);await mkdir(output,{recursive:false});
  const result={synthetic_faults:true,R1:await deadlineControls(),R2:[...await parentControls(output),...await fixtureControls(output)],final_retained_roots:[],all_test_recoveries_observed:true,deciding_verification:false};
  await writeJson(path.join(output,'result.json'),result);console.log(JSON.stringify({R1_controls:result.R1.length,R2_controls:result.R2.length,final_retained_roots:result.final_retained_roots}));
}
