import assert from 'node:assert/strict';
import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWebPlanning, webRoot } from './build-web-planning.mjs';

async function configCacheObservation() {
  const file=path.join(webRoot,'node_modules/.vite-temp');
  let stat;
  try { stat=await lstat(file,{bigint:true}); }
  catch(error) { if(error.code==='ENOENT')return null;throw error; }
  assert(stat.isDirectory()&&!stat.isSymbolicLink(),'config cache must be a physical directory');
  assert.equal(await realpath(file),file);
  assert.deepEqual(await readdir(file),[],'config cache must contain no executable output');
  return Object.fromEntries(['mode','uid','gid','dev','ino','nlink','size','mtimeNs','ctimeNs'].map(key=>[key,String(stat[key])]));
}

// This checks that the build does not write config output into dependencies.
// An existing empty directory is observed, never repaired or adopted as safe:
// the separate prepared-dependency owner retains its permission/security checks.
export async function checkWebPlanningBuildInputs(artifact) {
  const before=await configCacheObservation();
  let result, buildFailure, inputFailure;
  try { result=await buildWebPlanning(artifact); }
  catch(error) { buildFailure=error; }
  try { assert.deepEqual(await configCacheObservation(),before,'build must not create or mutate dependency config cache'); }
  catch(error) { inputFailure=error; }
  if(buildFailure&&inputFailure)throw new AggregateError([buildFailure,inputFailure],'build and dependency preservation failed');
  if(buildFailure)throw buildFailure;
  if(inputFailure)throw inputFailure;
  return result;
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;
  if(!root||await realpath(root)!==root)throw new Error('owned_test_root_required');
  const artifact=path.join(root,'artifact');
  const result=await checkWebPlanningBuildInputs(artifact);
  const {checkSitesArtifact}=await import('./web-planning-sites-checks.mjs');
  await checkSitesArtifact(artifact,await readFile(path.join(artifact,'server/index.js'),'utf8'));
  console.log(JSON.stringify({web_planning_build_inputs:'passed',dependency_config_cache_unchanged:true,artifact_contract:'passed',entrypoint:result.entrypoint}));
}
