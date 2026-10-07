// One bounded prerequisite fixture; no Phase B work operations.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';
import { pilotArguments, unsandboxedPilotFlag } from './preparation.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const options=pilotArguments(process.argv.slice(2)),output=path.resolve(options.output);
assert(!existsSync(output),'Preserve prior prerequisite evidence.');mkdirSync(output,{recursive:true});
async function git(args){let text='';const r=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'prerequisite identity',command:'git',args,cwd:repo,env:process.env,timeoutMs:10000,stdout:{write(c){text+=c;}},stderr:{write(){}},log:()=>{}});assert.equal(canonicalChildAcceptanceFailure(r,{requireNaturalExit:true}),null);return text.trim();}
const helpers=[];
for(const name of ['run-prerequisites.mjs','prerequisite-child.mjs','preparation.mjs']){const b=await readFile(path.join(here,name));helpers.push({path:path.relative(repo,path.join(here,name)),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(path.join(output,'execution.json'),JSON.stringify({kind:'prerequisite qualification',reviewed_head:'0f2269016a412942ea615f54cc761a36d3106be2',commit:await git(['rev-parse','HEAD']),tree:await git(['rev-parse','HEAD^{tree}']),helpers,command:['node',path.relative(repo,fileURLToPath(import.meta.url)),path.relative(repo,output),...(options.unsandboxed?[unsandboxedPilotFlag]:[])],child_profile:'buildCanonicalChildEnvironment; same owner/profile as run-consumer',synthetic_browser_sandbox_opt_in:options.unsandboxed},null,2)+'\n');
const owner=createCanonicalTestResourceRoot('ag-suite-');
for(const name of ['home','runtime-state'])mkdirSync(path.join(owner.root,name));
const started=Date.now();let child,error,cleanup;
try{child=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'prerequisites',command:process.execPath,args:['--import','tsx',path.join(here,'prerequisite-child.mjs'),output,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stderr:{write(){} }});error=canonicalChildAcceptanceFailure(child,{requireNaturalExit:true});}
catch(e){error=e;}
finally{cleanup=cleanupCanonicalTestResources([owner]);await writeFile(path.join(output,'lifecycle.json'),JSON.stringify({child:child??null,elapsed_ms:Date.now()-started,disposable_resources_removed:cleanup.every(r=>r.completed),cleanup_failures:cleanup.flatMap(r=>r.failures),deciding_canonical_evidence:false},null,2)+'\n');}
assert(cleanup.every(r=>r.completed),'Prerequisite cleanup failed.');
if(error){console.error('prerequisite qualification failed; inspect allowlisted retained evidence');process.exitCode=1;}
