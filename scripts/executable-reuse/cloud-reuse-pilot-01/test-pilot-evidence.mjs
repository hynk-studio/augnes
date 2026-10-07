// Pure controls: no child process, socket, browser, Worker, store or solver.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { capture, persistMarker, cleanupReport, portClosed, verifiedNumericalSummary } from './pilot-evidence.mjs';
const lifecycle={exit_code:0,termination_reason:'natural_exit',streams_closed:true};
const controls=[];
for(const [name,chunks,pass] of [['single',['child-ok'],true],['split',['chi','ld','-ok'],true],['empty',[],false],['wrong',['child-no'],false],['extra newline',['child-ok\n'],false],['extra prefix',['logchild-ok'],false]]){
  const stdout=capture(),stderr=capture();for(const c of chunks)stdout.write(Buffer.from(c));
  let persisted=false,observed=false;
  try{await persistMarker('unused',{stdout:stdout.record(),stderr:stderr.record(),lifecycle},async(_,record)=>{assert.equal(record.stdout.bytes,Buffer.byteLength(chunks.join('')));persisted=true;});observed=true;}catch(e){assert.equal(e.code,'ERR_ASSERTION');assert(persisted,'Failure evidence must precede assertion');}
  assert.equal(observed,pass);assert(persisted);controls.push(name);
}
const over=capture(2);over.write(Buffer.from('child-ok'));assert.equal(over.record().exact,false);assert.equal(over.record().truncated,true);assert.equal(over.record().bytes,8);assert.throws(()=>over.buffer());
let assertedBeforePersistence=false;
await assert.rejects(()=>persistMarker('unused',{stdout:{hex:''},stderr:{},lifecycle},async()=>{assertedBeforePersistence=true;throw new Error('persistence unavailable');}),/persistence unavailable/);assert(assertedBeforePersistence);
const fakeConnect=code=>()=>{const c=new EventEmitter();c.destroy=()=>{};queueMicrotask(()=>c.emit('error',Object.assign(new Error('synthetic'),{code})));return c;};
assert.equal(await portClosed(12345,fakeConnect('ECONNREFUSED')),true);
await assert.rejects(()=>portClosed(12345,fakeConnect('EPERM')),e=>e.code==='EPERM');
let checked=false;
const report=await cleanupReport({clients:[{close:async()=>{throw Object.assign(new Error('synthetic'),{code:'TEST_CLOSE'});}}],browser:{},local:{close:async()=>{}},debug:12345,owned:new Set()},
  {terminate:async()=>{},portClosed:async port=>{assert.equal(port,12345);checked=true;throw Object.assign(new Error('synthetic'),{code:'EPERM',syscall:'connect',errno:-1});}});
assert(checked);assert.deepEqual(report.failures,['cdp_close_failed','browser_listener_check_failed']);assert.equal(report.browser_listener_closed,null);assert.equal(report.diagnostics[1].error.syscall,'connect');assert.equal(report.worker_disposed,true);
const observed={inputs:{verification:'v'},workflows:{direct:{expected_work:'101/7'},inspected:{expected_work:'103/7'}},inspection_minus_direct:'2/7',comparison:'synthetic comparison'};
const expected_comparison={matches:true,input_equality:true,expected_inputs:observed.inputs,direct:'101/7',inspected:'103/7',inspection_minus_direct:'2/7',comparison:observed.comparison};
const summary=verifiedNumericalSummary([{case:'control',observed,expected_comparison}]);assert(summary.includes('direct 101/7, inspected 103/7, difference 2/7'));assert(summary.includes('verification v'));
assert.throws(()=>verifiedNumericalSummary([{case:'control',observed,expected_comparison:{...expected_comparison,matches:false}}]));
console.log(JSON.stringify({result:'PASS',pure:true,marker_controls:controls,persistence_before_assertion:true,truncation_disclosed:true,cleanup_with_debug_port_exercised:true,listener_permission_error_not_reported_closed:true,cleanup_reporting_survives_failure:true,summary_derived_from_verified_supplied_values:true}));
