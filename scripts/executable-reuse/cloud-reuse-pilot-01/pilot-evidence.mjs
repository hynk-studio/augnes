// Bounded observability for this synthetic pilot only; no shared owner changes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';

export const sha256=b=>createHash('sha256').update(b).digest('hex');
export function capture(limit=4096){
  const chunks=[],types=[];let bytes=0,retained=0;const hash=createHash('sha256');
  return {write(chunk){const b=Buffer.from(chunk);bytes+=b.length;hash.update(b);if(types.length<32)types.push(Buffer.isBuffer(chunk)?'Buffer':typeof chunk);const part=b.subarray(0,Math.max(0,limit-retained));chunks.push(part);retained+=part.length;},
    record(){const b=Buffer.concat(chunks);return {bytes,sha256:hash.copy().digest('hex'),retained_bytes:b.length,hex:b.toString('hex'),utf8_escaped:JSON.stringify(b.toString('utf8')),truncated:bytes>b.length,redacted:false,exact:bytes===b.length,chunk_types:types};},
    buffer(){assert(bytes<=limit,'Captured output truncated');return Buffer.concat(chunks);}};
}
export const writeJson=(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n');
export async function persistMarker(file,evidence,write=writeJson){
  await write(file,evidence); // Always preserve lifecycle and actual bytes first.
  assert.equal(evidence.lifecycle.exit_code,0);assert.equal(evidence.lifecycle.termination_reason,'natural_exit');
  assert.equal(evidence.lifecycle.streams_closed,true);assert.equal(evidence.stdout.exact,true);assert.equal(evidence.stderr.exact,true);
  assert.equal(evidence.stdout.hex,Buffer.from('child-ok').toString('hex'));
  assert.equal(evidence.stderr.bytes,0);
}
export function safeError(e,depth=0){return {name:['Error','AssertionError','ReferenceError','TypeError','SyntaxError','RangeError'].includes(e?.name)?e.name:'unclassified',
  code:typeof e?.code==='string'&&/^[A-Za-z0-9_.-]{1,64}$/.test(e.code)?e.code:null,
  syscall:typeof e?.syscall==='string'&&/^(listen|bind|connect|spawn(?:Sync)?(?: [a-z0-9/_-]+)?)$/.test(e.syscall)?e.syscall:null,
  errno:Number.isInteger(e?.errno)?e.errno:null,
  assertion_operator:typeof e?.operator==='string'&&/^[A-Za-z]+$/.test(e.operator)?e.operator:null,
  evaluation:e?.pilot_diagnostic??null,cause:depth<2&&e?.cause?safeError(e.cause,depth+1):null};}
export async function portClosed(port,connect=net.connect){
  return new Promise((resolve,reject)=>{let done=false;const c=connect(port,'127.0.0.1');
    const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);c.destroy();error?reject(error):resolve(value);};
    const timer=setTimeout(()=>finish(Object.assign(new Error('listener_check_timeout'),{code:'PILOT_LISTENER_TIMEOUT'})),3000);
    c.once('connect',()=>finish(null,false));c.once('error',e=>e.code==='ECONNREFUSED'?finish(null,true):finish(e));
  });
}
export async function cleanupReport({clients=[],browser,local,debug,owned},deps){
  const failures=[],diagnostics=[];
  const attempt=async(label,fn)=>{try{return await fn();}catch(e){failures.push(label);diagnostics.push({stage:label,error:safeError(e)});return null;}};
  for(const c of clients)await attempt('cdp_close_failed',()=>c.close());
  if(browser)await attempt('browser_process_cleanup_failed',()=>deps.terminate(browser));
  if(local)await attempt('worker_cleanup_failed',()=>local.close());
  const closed=debug?await attempt('browser_listener_check_failed',()=>deps.portClosed(debug)):true;
  if(closed===false)failures.push('browser_listener_residue');
  return {tracked_browser_processes_remaining:owned.size,worker_returned:!!local,worker_disposed:!!local&&!failures.includes('worker_cleanup_failed'),browser_listener_closed:closed,failures,diagnostics};
}
export async function processGroupsAbsent(groups){
  // Linux metadata only: no command lines, environment or broad ps output.
  // This verifies known owned groups, not arbitrary escaped/reparented children.
  const wanted=[...new Set(groups.filter(x=>Number.isInteger(x)&&x>0))];
  try{
    assert.equal(process.platform,'linux');const rows=[];
    for(const name of await readdir('/proc')){if(!/^\d+$/.test(name))continue;let s;
      try{s=await readFile('/proc/'+name+'/stat','utf8');}catch(e){if(e.code==='ENOENT'||e.code==='ESRCH')continue;throw e;}
      const fields=s.slice(s.lastIndexOf(')')+2).split(' ');rows.push({pid:Number(name),ppid:Number(fields[1]),pgid:Number(fields[2]),state:fields[0]});}
    assert(rows.some(r=>r.pid===process.pid),'Snapshot must include observer');
    const remaining=rows.filter(r=>wanted.includes(r.pgid)&&r.state!=='Z');
    return {available:true,method:'read-only /proc numeric process metadata',groups:wanted,live_group_members:remaining,known_groups_absent:remaining.length===0,scope:'known owned process groups; no arbitrary escaped-descendant claim',shared_owner_snapshot_status:'not exposed by shared owner'};
  }catch(e){return {available:false,groups:wanted,known_groups_absent:null,error:safeError(e),shared_owner_snapshot_status:'not exposed by shared owner'};}
}
export function verifiedNumericalSummary(cases){
  return cases.map(({case:label,observed,expected_comparison:c})=>{
    assert.equal(c.matches,true);assert.equal(c.input_equality,true);assert.deepEqual(observed.inputs,c.expected_inputs);
    assert.equal(observed.workflows.direct.expected_work,c.direct);assert.equal(observed.workflows.inspected.expected_work,c.inspected);
    assert.equal(observed.inspection_minus_direct,c.inspection_minus_direct);assert.equal(observed.comparison,c.comparison);
    return `${label} downloaded-byte execution: direct ${observed.workflows.direct.expected_work}, inspected ${observed.workflows.inspected.expected_work}, difference ${observed.inspection_minus_direct}; ${observed.comparison}. Mandatory verification ${observed.inputs.verification} every attempt.`;
  }).join(' ');
}
