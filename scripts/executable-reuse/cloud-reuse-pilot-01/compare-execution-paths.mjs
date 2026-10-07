// Review 5437433951: six predeclared cells, each at most once. Native spawn is diagnostic only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, realpath, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';
import { registerOwnedChild, waitForOwnedProcessExit } from '../../test-harness-process-lifecycle.mjs';
import { capture, writeJson, safeError, processGroupsAbsent, sha256 } from './pilot-evidence.mjs';

const self=fileURLToPath(import.meta.url),here=path.dirname(self),repo=path.resolve(here,'../../..');
const nodeSource="process.stdout.write('child-ok')";
const pythonSource="import sys\nnegative = len(sys.argv) == 2 and sys.argv[1] == 'negative'\nsys.stdout.write('python-negative\\n' if negative else 'python-positive\\n')\nsys.stderr.write('negative-stderr\\n' if negative else 'positive-stderr\\n')\nsys.exit(17 if negative else 0)\n";
const cases=[
  {id:1,name:'Node inline / runner',runner:'canonical',form:'inline',stdout:'child-ok',stderr:'',exit:0},
  {id:2,name:'Node inline / native',runner:'native',form:'inline',stdout:'child-ok',stderr:'',exit:0},
  {id:3,name:'Node file / runner',runner:'canonical',form:'node-file',stdout:'child-ok',stderr:'',exit:0},
  {id:4,name:'Node file / native',runner:'native',form:'node-file',stdout:'child-ok',stderr:'',exit:0},
  {id:5,name:'Python positive / runner',runner:'canonical',form:'python',stdout:'python-positive\n',stderr:'positive-stderr\n',exit:0},
  {id:6,name:'Python negative / runner',runner:'canonical',form:'python-negative',stdout:'python-negative\n',stderr:'negative-stderr\n',exit:17},
];
const helperExpected='comparison-helper-ok';
function stream(){const c=capture(16384);let chunks=0;return {write(b){chunks++;c.write(b);},record(){const {utf8_escaped,chunk_types,...r}=c.record();return {...r,chunks};},buffer:()=>c.buffer()};}
function compare(test,record){return record.stdout.exact&&record.stderr.exact&&record.stdout.hex===Buffer.from(test.stdout).toString('hex')&&record.stderr.hex===Buffer.from(test.stderr).toString('hex')&&record.lifecycle.exit_code===test.exit;}
async function identity(file){const resolved=await realpath(file),b=await readFile(resolved);return {path:resolved,bytes:b.length,sha256:sha256(b)};}
async function pythonIdentity(){for(const folder of process.env.PATH.split(path.delimiter)){const p=path.join(folder,'python3');try{await access(p);return await identity(p);}catch{}}throw new Error('python3_not_resolved');}
async function native(command,args,cwd,stdout,stderr,onSpawn){
  const owned=new Set(),started=Date.now();
  const child=spawn(command,args,{cwd,env:process.env,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe'],windowsHide:true});
  const r=registerOwnedChild(owned,child,{label:'comparison-native'});onSpawn(r.pid);
  child.stdout.on('data',b=>stdout.write(b));child.stderr.on('data',b=>stderr.write(b));
  let error;try{await waitForOwnedProcessExit(r,10000);}catch(e){error=safeError(e);}
  return {label:'comparison-native',exit_code:r.exitResult?.code??null,signal:r.exitResult?.signal??null,timed_out:error?.code==='owned_process_timeout',duration_ms:Date.now()-started,spawn_error_code:r.spawnErrorCode,exit_observed:r.exited,streams_closed:r.stdoutClosed&&r.stderrClosed,cleanup_completed:r.closed,remaining_owned_processes:owned.size,termination_reason:error?'diagnostic_error':'natural_exit',error:error??null};
}
if(process.argv[2]==='--pure-check'){
  for(const test of cases){const stdout=stream(),stderr=stream();for(const b of [test.stdout.slice(0,2),test.stdout.slice(2)])if(b)stdout.write(Buffer.from(b));if(test.stderr)stderr.write(Buffer.from(test.stderr));
    const record={stdout:stdout.record(),stderr:stderr.record(),lifecycle:{exit_code:test.exit}};assert(compare(test,record));assert(!compare(test,{...record,stdout:{...record.stdout,exact:true,hex:'00'}}));}
  const accepted={exit_code:0,termination_reason:'natural_exit',streams_closed:true,exit_observed:true,cleanup_completed:true,remaining_owned_processes:0};
  assert.equal(canonicalChildAcceptanceFailure(accepted,{requireNaturalExit:true}),null);
  assert(canonicalChildAcceptanceFailure({...accepted,exit_code:17},{requireNaturalExit:true}));
  console.log(JSON.stringify({pure_controls:'PASS',declared_cells:6,exact_bytes_and_exit_required:true,negative_ordinary_success_refused:true}));
}else if(process.argv[2]==='--child'){
  const output=path.resolve(process.argv[3]),root=process.env.AUGNES_CANONICAL_TEMP_ROOT;assert(root);
  const cwd=path.join(root,'calculation');await mkdir(cwd);const nodeFile=path.join(cwd,'marker.cjs'),pythonFile=path.join(cwd,'marker.py');
  const {writeFile}=await import('node:fs/promises');await writeFile(nodeFile,nodeSource);await writeFile(pythonFile,pythonSource);
  const declaration={cases,node_source:nodeSource,python_source:pythonSource,helper_expected_stdout:helperExpected,helper_expected_stderr:'',node:await identity(process.execPath),python:await pythonIdentity(),node_file:await identity(nodeFile),python_file:await identity(pythonFile),cwd,
    profile:{parent_child_loader:['--import','tsx'],nested_node_loader:[],nested_python_flags:['-E','-s','-B'],stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',environment:'same sanitized inherited child environment for all six cells; no values retained'},
    limited_gate:'Node runner/native file cells exact; Python positive/negative exact and ordinary refusal; actual tsx helper stdout exact; source confirms B has no Node inline dependency. Legacy inline failures remain failures.'};
  await writeJson(path.join(output,'declaration.json'),declaration);
  const records=[],groups=[];let safe=true;
  for(const test of cases){
    const python=test.form.startsWith('python'),command=python?'python3':process.execPath;
    const args=test.form==='inline'?['-e',nodeSource]:python?['-E','-s','-B',pythonFile,...(test.form==='python-negative'?['negative']:[])]:[nodeFile];
    const stdout=stream(),stderr=stream(),logs=stream();let pid,lifecycle,error;
    try{lifecycle=test.runner==='native'?await native(command,args,cwd,stdout,stderr,p=>{pid=p;groups.push(p);}):await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:test.name,command,args,cwd,env:process.env,timeoutMs:10000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n')),onSpawn:p=>{pid=p;groups.push(p);}});}catch(e){error=safeError(e);}
    const cleanup=await processGroupsAbsent([pid]);
    const record={id:test.id,name:test.name,command,args,stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.buffer().toString(),lifecycle:lifecycle??null,error:error??null,independent_cleanup:cleanup};
    records.push(record);await writeJson(path.join(output,'cells.json'),records); // Actual bytes/lifecycle first.
    record.exact_expected_result=!!lifecycle&&compare(test,record);
    record.ordinary_success_accepted=!!lifecycle&&canonicalChildAcceptanceFailure(lifecycle,{requireNaturalExit:true})===null;
    record.cell_pass=record.exact_expected_result&&(test.exit===0?record.ordinary_success_accepted:!record.ordinary_success_accepted);
    await writeJson(path.join(output,'cells.json'),records);
    safe=!!lifecycle&&lifecycle.exit_observed&&lifecycle.streams_closed&&lifecycle.cleanup_completed&&cleanup.available&&cleanup.known_groups_absent;
    if(!safe)break;
  }
  const independent=await processGroupsAbsent(groups);
  await writeJson(path.join(output,'result.json'),{cells_started:records.length,safe_settlement:safe,independent_cleanup:independent,relevant_file_cells_pass:[3,4,5,6].every(id=>records.find(r=>r.id===id)?.cell_pass),legacy_inline_marker:'historical failures unchanged; current cells separately recorded'});
  if(!safe||!independent.available||!independent.known_groups_absent)process.exitCode=1;
  else process.stdout.write(helperExpected);
}else{
  const output=path.resolve(process.argv[2]);assert(!existsSync(output),'Preserve prior comparison');await mkdir(output,{recursive:true});
  const owner=createCanonicalTestResourceRoot('ag-suite-');for(const n of ['home','runtime-state'])await mkdir(path.join(owner.root,n));
  const stdout=stream(),stderr=stream(),logs=stream();let pid,child,error;
  await writeJson(path.join(output,'parent-declaration.json'),{cases,helper_expected_stdout:helperExpected,helper_expected_stderr:'',command:process.execPath,args:['--import','tsx',self,'--child',output],cwd:repo,entry:await identity(self),interpreter:await identity(process.execPath),scope:'one six-cell comparison; native controls diagnostic only'});
  const started=Date.now();
  try{child=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'comparison-helper',command:process.execPath,args:['--import','tsx',self,'--child',output],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n')),onSpawn:p=>{pid=p;}});}catch(e){error=safeError(e);}
  const independent=await processGroupsAbsent([pid]);let result;try{result=JSON.parse(await readFile(path.join(output,'result.json'),'utf8'));}catch{}
  const record={stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.buffer().toString(),child:child??null,error:error??null,independent_cleanup:independent};
  await writeJson(path.join(output,'parent-result.json'),record);
  const safe=independent.available&&independent.known_groups_absent&&result?.safe_settlement&&result?.independent_cleanup?.known_groups_absent;
  const cleanup=safe?cleanupCanonicalTestResources([owner]):[];
  record.actual_tsx_helper_output_pass=stdout.record().exact&&stderr.record().exact&&stdout.record().hex===Buffer.from(helperExpected).toString('hex')&&stderr.record().bytes===0&&child?.exit_code===0;
  record.disposable_resources_removed=safe&&cleanup.every(r=>r.completed);record.cleanup_failures=cleanup.flatMap(r=>r.failures);
  record.retained_root=safe?null:owner.root;record.elapsed_including_cleanup_ms=Date.now()-started;
  await writeJson(path.join(output,'parent-result.json'),record);
  console.log(JSON.stringify({cells:result?.cells_started??0,relevant_file_cells_pass:result?.relevant_file_cells_pass??false,actual_tsx_helper_output_pass:record.actual_tsx_helper_output_pass,disposable_resources_removed:record.disposable_resources_removed}));
  if(!record.disposable_resources_removed)process.exitCode=1;
}
