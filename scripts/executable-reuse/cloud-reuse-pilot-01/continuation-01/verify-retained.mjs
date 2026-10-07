// Read-only Phase A artifact audit. No subprocess, browser, solver or store.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFileExport } from '../../../../apps/web_planning/src/files.ts';
import { assertCommissionedInputs } from '../preparation.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../../..'),pilot=path.dirname(here);
const root=path.join(here,'attempt-3');
const bytes=name=>readFileSync(path.join(root,name));
const json=name=>JSON.parse(bytes(name));
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=json('manifest.json'),exportBytes=bytes('planning-work.json');
assert.equal(exportBytes.length,manifest.export.bytes);assert.equal(hash(exportBytes),manifest.export.sha256);
const {chain,bodies}=validateFileExport(manifest.scope,JSON.parse(exportBytes));
assert.equal(chain.length,2);assert.equal(chain[0].revision,1);assert.equal(chain[1].revision,2);
assert.equal(chain[0].fingerprint,manifest.revision_1.fingerprint);
assert.equal(chain[1].fingerprint,manifest.head_fingerprint);assert.equal(chain[1].work_id,manifest.work_id);
assert.deepEqual(chain[1].files,manifest.selected_files);assert.deepEqual(chain[1].files.slice(0,2),chain[0].files);
const stdout=bytes('producer-stdout.json'),execution=json('execution.json');assertCommissionedInputs(JSON.parse(stdout));
assert.equal(hash(stdout),execution.stdout_sha256);assert.equal(execution.observed_inputs_equal_commission,true);
assert.equal(execution.execution.exit_code,0);assert.equal(execution.oracle_execution.exit_code,0);assert.equal(execution.oracle.matches,true);
assert.equal(bodies.length,3);
for(const body of bodies){const file=chain[1].files.find(f=>f.digest===body.digest);assert(file);
  const raw=Buffer.from(body.data,'base64');let expected;
  if(file.name==='producer-stdout.json')expected=stdout;
  else {const source=manifest.source_files.find(f=>f.name===file.name);assert(source);expected=readFileSync(path.join(repo,source.repository_path));
    assert.equal(hash(expected),source.sha256);assert.equal(expected.length,source.bytes);}
  assert.deepEqual(raw,expected);assert.equal(raw.length,file.bytes);assert.equal('sha256:'+hash(raw),file.digest);
}
const helper=json('execution-helper.json');
for(const f of helper.helper_files){const data=readFileSync(path.join(repo,f.path));assert.equal(hash(data),f.sha256);assert.equal(data.length,f.bytes);}
const lifecycle=json('lifecycle.json'),fixture=json('fixture-cleanup.json'),diagnostics=json('diagnostics.json');
assert.equal(lifecycle.child.exit_code,0);assert.equal(lifecycle.child.cleanup_completed,true);assert.equal(lifecycle.child.remaining_owned_processes,0);
assert.equal(lifecycle.disposable_resources_removed,true);assert.deepEqual(lifecycle.cleanup_failures,[]);
assert.equal(fixture.worker_disposed,true);assert.equal(fixture.browser_listener_closed,true);assert.equal(fixture.owned_browser_processes_remaining,0);assert.deepEqual(fixture.failures,[]);
assert.equal(diagnostics.observed_save_requests,2);assert.equal(diagnostics.unknown_outcome_resolutions,0);assert.deepEqual(diagnostics.unexpected_failures,[]);
assert.equal(diagnostics.progress.export_validated,true);assert.equal(diagnostics.progress.readback,true);
assert.equal(diagnostics.worker_external_requests,0);assert.equal(diagnostics.intercepted_external_browser_requests,0);
const originalBinding=JSON.parse(readFileSync(path.join(here,'original-inventory-binding.json'))),originalBytes=readFileSync(path.join(pilot,'retention-manifest.json'));
assert.equal(hash(originalBytes),originalBinding.inventory_sha256);
for(const f of JSON.parse(originalBytes).files){if(['producer-child.mjs','run-producer.mjs'].includes(f.path))continue;
  const data=readFileSync(path.join(pilot,f.path));assert.equal(hash(data),f.sha256);assert.equal(data.length,f.bytes);}
console.log(JSON.stringify({kind:'read-only retained producer artifact audit; no reconstruction',result:'PASS',
  revisions:chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint,files:r.files.length})),
  exact_body_count:bodies.length,export_bytes:exportBytes.length,export_sha256:hash(exportBytes),
  executed_helper_commit:helper.helper_commit,executed_helper_files_unchanged:true,input_equality:true,
  original_inventory_binding_valid:true,original_history_files_unchanged:true,cleanup_complete:true,phase_b:'NOT RUN'},null,2));
