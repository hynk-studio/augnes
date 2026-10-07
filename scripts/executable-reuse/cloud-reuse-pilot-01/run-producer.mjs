// Phase A only. Reuses repository process/resource owners without Canonical claims.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../..');
assert.equal(process.argv.length,3,'Supply one new output directory; never overwrite an attempt.');
const output=path.resolve(process.argv[2]);
assert(!existsSync(output),'Output already exists; preserve the original attempt.');
mkdirSync(output,{recursive:true});
const owner=createCanonicalTestResourceRoot('ag-suite-');
for(const name of ['home','runtime-state'])mkdirSync(path.join(owner.root,name));
const started=new Date().toISOString();
let child,error,cleanup;
try {
  child=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'producer',command:process.execPath,
    args:['--import','tsx',path.join(here,'producer-child.mjs'),output],cwd:repo,
    env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),
    resourceOwner:owner,timeoutMs:120000});
  error=canonicalChildAcceptanceFailure(child,{requireNaturalExit:true});
} catch(e) { error=e; }
finally {
  cleanup=cleanupCanonicalTestResources([owner]);
  await writeFile(path.join(output,'lifecycle.json'),JSON.stringify({phase:'A',started_at:started,
    finished_at:new Date().toISOString(),child:child??null,
    disposable_resources_removed:cleanup.every(r=>r.completed),
    cleanup_failures:cleanup.flatMap(r=>r.failures),
    phase_b:'NOT RUN',deciding_canonical_evidence:false},null,2)+'\n');
}
assert(cleanup.every(r=>r.completed),'Disposable resource cleanup failed.');
if(error)throw error;
