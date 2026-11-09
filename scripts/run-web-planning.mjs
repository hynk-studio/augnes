import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
const mode=process.argv[2]??'test';
if(!['test','browser','dev','participation','participation-browser','reassessment-browser','draft-safety-browser','reassessment'].includes(mode)||process.argv.length>3)throw new Error('Use test, browser, participation, participation-browser, reassessment, reassessment-browser, draft-safety-browser, or dev; no remote mode');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const owner=createCanonicalTestResourceRoot('ag-suite-');
for(const name of ['home','runtime-state'])mkdirSync(path.join(owner.root,name));
let result;
try {
 result=await runCanonicalChild({suite:'web-planning',label:mode,command:process.execPath,
   args:['--import','tsx',`scripts/${mode==='reassessment'?'test-web-planning-reassessment':mode==='participation'?'test-web-planning-participation':mode==='test'?'test-web-planning':['browser','participation-browser','reassessment-browser','draft-safety-browser'].includes(mode)?'browser-validate-web-planning':'dev-web-planning'}.mjs`,...(mode==='participation-browser'?['--participation-recovery']:mode==='reassessment-browser'?['--reassessment']:mode==='draft-safety-browser'?['--draft-safety']:[])],cwd:root,
   env:buildCanonicalChildEnvironment({ambientEnvironment:process.env,temporaryRoot:owner.root,resourceRoot:owner.root}),
   resourceOwner:owner,timeoutMs:mode==='dev'?1_800_000:mode==='draft-safety-browser'?60_000:['browser','participation-browser','reassessment-browser','draft-safety-browser'].includes(mode)?180_000:120_000});
 const failure=canonicalChildAcceptanceFailure(result,{requireNaturalExit:true});if(failure)throw new Error(failure);
} finally {const cleaned=cleanupCanonicalTestResources([owner]);if(cleaned.some(r=>!r.completed))throw new Error('web_planning_resource_cleanup_failed');}
