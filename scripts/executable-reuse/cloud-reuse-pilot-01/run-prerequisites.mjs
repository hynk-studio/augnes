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
import { capture, writeJson, safeError, processGroupsAbsent } from './pilot-evidence.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const [mode,...args]=process.argv.slice(2);assert(['marker','loopback','readiness'].includes(mode),'Explicit diagnostic mode required.');
const options=pilotArguments(args),output=path.resolve(options.output);
assert(!existsSync(output),'Preserve prior prerequisite evidence.');mkdirSync(output,{recursive:true});
let identityReads=0;
async function git(args){const stdout=capture(),stderr=capture(),logs=capture(16384);const r=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'prerequisite identity',command:'git',args,cwd:repo,env:process.env,timeoutMs:10000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n'))});await writeJson(path.join(output,'identity-read-'+(++identityReads)+'.json'),{command:'git',args,stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),lifecycle:r});assert.equal(canonicalChildAcceptanceFailure(r,{requireNaturalExit:true}),null);assert.equal(stderr.record().bytes,0);return stdout.buffer().toString().trim();}
const helpers=[];
for(const name of ['run-prerequisites.mjs','prerequisite-child.mjs','preparation.mjs','pilot-evidence.mjs']){const b=await readFile(path.join(here,name));helpers.push({path:path.relative(repo,path.join(here,name)),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(path.join(output,'execution.json'),JSON.stringify({kind:'prerequisite qualification',reviewed_head:'1a1032a104fc15f55b122046b57f7139a7af5f4c',mode,commit:await git(['rev-parse','HEAD']),tree:await git(['rev-parse','HEAD^{tree}']),helpers,command:['node',path.relative(repo,fileURLToPath(import.meta.url)),mode,path.relative(repo,output),...(options.unsandboxed?[unsandboxedPilotFlag]:[])],child_profile:'buildCanonicalChildEnvironment; same owner/profile as run-consumer',synthetic_browser_sandbox_opt_in:options.unsandboxed},null,2)+'\n');
const owner=createCanonicalTestResourceRoot('ag-suite-');
for(const name of ['home','runtime-state'])mkdirSync(path.join(owner.root,name));
const started=Date.now(),stdout=capture(16384),stderr=capture(16384),logs=capture(16384);let child,error,cleanup,pid,independent;
try{child=await runCanonicalChild({suite:'cloud-reuse-pilot-01',label:'prerequisite '+mode,command:process.execPath,args:['--import','tsx',path.join(here,'prerequisite-child.mjs'),mode,output,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:120000,stdout,stderr,log:line=>logs.write(Buffer.from(line+'\n')),onSpawn:value=>{pid=value;}});error=canonicalChildAcceptanceFailure(child,{requireNaturalExit:true});}
catch(e){error=e;}
finally{
  independent=await processGroupsAbsent([pid]);
  await writeJson(path.join(output,'parent-output.json'),{stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),child:child??null,error:error instanceof Error?safeError(error):error??null,independent_cleanup:independent});
  let childCleanup;
  try{childCleanup=JSON.parse(await readFile(path.join(output,'result.json'),'utf8')).independent_cleanup;}catch{}
  const safe=independent.available&&independent.known_groups_absent&&childCleanup?.available&&childCleanup?.known_groups_absent;
  cleanup=safe?cleanupCanonicalTestResources([owner]):[];
  await writeJson(path.join(output,'lifecycle.json'),{mode,child:child??null,elapsed_ms:Date.now()-started,independent_cleanup:independent,child_independent_cleanup:childCleanup??null,disposable_resources_removed:safe&&cleanup.every(r=>r.completed),cleanup_withheld:!safe,retained_root:!safe?owner.root:null,cleanup_failures:cleanup.flatMap(r=>r.failures),deciding_canonical_evidence:false});
}
const clean=cleanup.length>0&&cleanup.every(r=>r.completed);
console.log(JSON.stringify({mode,child_exit:child?.exit_code??null,disposable_resources_removed:clean,independent_known_groups_absent:independent.known_groups_absent}));
if(error||!clean)process.exitCode=1;
