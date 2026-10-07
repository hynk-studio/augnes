// Phase B only. Reuses repository process/resource owners without Canonical claims.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';
import { pilotArguments, unsandboxedPilotFlag } from './preparation.mjs';

async function readCommand(command,args) {
  let stdout='',stderr='';
  const result=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'helper read '+command,command,args,cwd:repo,env:process.env,timeoutMs:10000,
    stdout:{write(chunk){stdout+=chunk.toString();}},stderr:{write(chunk){stderr+=chunk.toString();}}});
  assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);assert.equal(stderr,'');return stdout;
}

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../..');
const options=pilotArguments(process.argv.slice(2));
const output=path.resolve(options.output);
assert(!existsSync(output),'Output already exists; preserve the original attempt.');
mkdirSync(output,{recursive:true});
const started=new Date().toISOString();
const helperFiles=[];
for(const name of ['run-consumer.mjs','consumer-child.mjs','preparation.mjs','observe-downloaded.py','consumer-oracle.py']){const bytes=await readFile(path.join(here,name));helperFiles.push({path:path.relative(repo,path.join(here,name)),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(path.join(output,'execution-helper.json'),JSON.stringify({reviewed_parent:'d3f9f0d538078b33c7db892666d50755a71337bf',
  helper_commit:(await readCommand('git',['rev-parse','HEAD'])).trim(),
  helper_tree:(await readCommand('git',['rev-parse','HEAD^{tree}'])).trim(),
  command:['node',path.relative(repo,fileURLToPath(import.meta.url)),path.relative(repo,output),...(options.unsandboxed?[unsandboxedPilotFlag]:[])],
  helper_files:helperFiles,unsandboxed_pilot_opt_in:options.unsandboxed,phase:'B'},null,2)+'\n');
const owner=createCanonicalTestResourceRoot('ag-suite-');
for(const name of ['home','runtime-state'])mkdirSync(path.join(owner.root,name));
let child,error,cleanup;
try {
  child=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'consumer',command:process.execPath,
    args:['--import','tsx',path.join(here,'consumer-child.mjs'),output,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,
    env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),
    resourceOwner:owner,timeoutMs:120000});
  error=canonicalChildAcceptanceFailure(child,{requireNaturalExit:true});
} catch(e) { error=e; }
finally {
  cleanup=cleanupCanonicalTestResources([owner]);
  await writeFile(path.join(output,'lifecycle.json'),JSON.stringify({phase:'B',started_at:started,
    finished_at:new Date().toISOString(),child:child??null,
    disposable_resources_removed:cleanup.every(r=>r.completed),
    cleanup_failures:cleanup.flatMap(r=>r.failures),deciding_canonical_evidence:false},null,2)+'\n');
}
assert(cleanup.every(r=>r.completed),'Disposable resource cleanup failed.');
if(error)throw error;
