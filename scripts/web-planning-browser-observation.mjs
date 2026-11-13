import { publicTimingLabel } from './browser-e2e-timing.mjs';

// Diagnostic observations for this Browser owner; no timing verdict or retry.
export function createWebPlanningBrowserObservation({
  now=()=>performance.now(), cpu=previous=>process.cpuUsage(previous),
  report=value=>console.log(JSON.stringify(value)), maximumStages=512,
}={}) {
  if(!Number.isSafeInteger(maximumStages)||maximumStages<1||maximumStages>512)
    throw new Error('web_planning_observation_bound_invalid');
  const started=now(),initialCpu=cpu();let sequence=0,completed=0,failed=0;
  const errorIdentity=error=>({name:publicTimingLabel(String(error?.name||'Error')),code:typeof error?.code==='string'&&/^[a-z0-9_-]{1,80}$/i.test(error.code)?error.code:null,message:publicTimingLabel(String(error?.message||'Browser operation failed').split('\n')[0]||'Browser operation failed')});
  return Object.freeze({
    async stage(label,run) {
      if(sequence>=maximumStages)throw new Error('web_planning_observation_bound_exceeded');
      const id=++sequence,name=publicTimingLabel(label),start=now(),beforeCpu=cpu();
      report({web_planning_stage:{id,name,event:'start',elapsed_ms:start-started,cpu_us:beforeCpu}});
      try {
        const result=await run();completed++;
        report({web_planning_stage:{id,name,event:'complete',elapsed_ms:now()-started,duration_ms:now()-start,cpu_us:cpu(beforeCpu)}});
        return result;
      } catch(error) {
        failed++;
        report({web_planning_stage:{id,name,event:'failure',elapsed_ms:now()-started,duration_ms:now()-start,cpu_us:cpu(beforeCpu),error:errorIdentity(error)}});
        throw error;
      }
    },
    failure(label,error) {report({web_planning_primary_failure:{name:publicTimingLabel(label),error:errorIdentity(error),elapsed_ms:now()-started}});},
    summary() {return {started:sequence,completed,failed,elapsed_ms:now()-started,cpu_us:cpu(initialCpu)};},
  });
}

// Attempt every owned cleanup step. An earlier body failure is first in any
// aggregate, and remains the caller's thrown error when cleanup succeeds.
export async function settleWebPlanningBrowser({primary,steps,observe=async(_name,run)=>run()}) {
  const errors=[],observationErrors=[],cleanupErrors=[];
  for(const {name,run} of steps) {
    let started=false,running,observationError,observationFailed=false,cleanupError,cleanupFailed=false;
    const runOnce=()=>{
      if(!started){started=true;running=Promise.resolve().then(()=>run());}
      return running;
    };
    try {
      await observe('cleanup.'+name,runOnce);
      if(!started)throw new Error('web_planning_cleanup_observation_skipped_callback');
    } catch(error) {observationFailed=true;observationError=error;}
    // An exhausted/failed reporter cannot decide whether cleanup runs. Await
    // the same promise if observation already invoked it, including late errors.
    try {await runOnce();} catch(error) {cleanupFailed=true;cleanupError=error;}
    if(observationFailed&&(!cleanupFailed||observationError!==cleanupError)){
      observationErrors.push(observationError);errors.push(observationError);
    }
    if(cleanupFailed){cleanupErrors.push(cleanupError);errors.push(cleanupError);}
  }
  if(errors.length){
    const failure=new AggregateError([...(primary!==undefined?[primary]:[]),...errors],'Web Planning Browser settlement failed');
    failure.cleanup_completed=cleanupErrors.length===0;
    failure.observation_errors=observationErrors;failure.cleanup_errors=cleanupErrors;
    throw failure;
  }
}
