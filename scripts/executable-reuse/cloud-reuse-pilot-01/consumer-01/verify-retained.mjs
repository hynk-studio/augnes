// Read-only blocked consumer audit. No subprocess, listener, browser, store or solver.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateFileExport } from '../../../../apps/web_planning/src/files.ts';
const here=path.dirname(fileURLToPath(import.meta.url)),pilot=path.dirname(here),repo=path.resolve(here,'../../../..');
const json=file=>JSON.parse(readFileSync(path.join(here,file)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=readFileSync(path.join(pilot,'continuation-01/attempt-3/planning-work.json'));
assert.equal(original.length,25632);assert.equal(hash(original),'2634ccd6ec63ae50b4f05a8ff89e9fd8e723242f75f5cdeb512c81af4cc7d219');
const manifest=JSON.parse(readFileSync(path.join(pilot,'continuation-01/attempt-3/manifest.json')));
const {chain,bodies}=validateFileExport(manifest.scope,JSON.parse(original));
assert.deepEqual(chain.map(r=>r.revision),[1,2]);assert.equal(bodies.length,3);
assert.equal(chain[1].fingerprint,manifest.head_fingerprint);assert.deepEqual(chain[1].files,manifest.selected_files);
for(const r of chain)assert(r.definition.non_goals.includes('Phase B or reconstruction'));
assert(chain[1].sources.some(s=>s.bounded_summary.includes('Phase B NOT RUN')));
for(const f of manifest.source_files){const body=bodies.find(b=>b.digest==='sha256:'+f.sha256);assert(body);assert.equal(body.bytes,f.bytes);assert.equal(hash(Buffer.from(body.data,'base64')),f.sha256);}
const primary=json('attempt-1/failed-attempt.json');assert.equal(primary.diagnostic.code,'EPERM');assert.equal(primary.resource_root_created,false);assert.equal(primary.save_requests,0);assert.equal(primary.reconstruction_requests,0);
const retry=json('attempt-2/failed-attempt.json'),diagnostics=json('attempt-2/diagnostics.json'),cleanup=json('attempt-2/fixture-cleanup.json'),lifecycle=json('attempt-2/lifecycle.json');
assert.equal(retry.stage,'worker-initialization');assert.equal(retry.diagnostic.code,'EPERM');assert.equal(retry.observed_save_requests,0);assert.equal(retry.unknown_outcome_resolutions,0);
assert.equal(retry.progress.work_id,null);assert.deepEqual(retry.progress.revisions,[]);
for(const key of ['reconstructed','transition','calculation','readback','export_downloaded','export_validated','corruption_control'])assert.equal(retry.progress[key],false);
assert.equal(lifecycle.child.exit_code,1);assert.equal(lifecycle.child.timed_out,false);assert.equal(lifecycle.child.cleanup_completed,true);assert.equal(lifecycle.child.remaining_owned_processes,0);assert.equal(lifecycle.disposable_resources_removed,true);assert.deepEqual(lifecycle.cleanup_failures,[]);
assert.equal(cleanup.owned_browser_processes_remaining,0);assert.equal(cleanup.browser_listener_closed,true);assert.deepEqual(cleanup.failures,[]);assert.equal(diagnostics.intercepted_external_browser_requests,0);
const helper=json('attempt-2/execution-helper.json');assert.equal(helper.helper_commit,'439e7d0bfe7b370bb00c33b2fa9459ad724e6af7');
for(const f of helper.helper_files){const bytes=readFileSync(path.join(repo,f.path));assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}
for(const file of ['planning-work.json','manifest.json','calculations.json','B1-stdout.txt','B2-stdout.txt','corruption-control.json'])assert.equal(existsSync(path.join(here,'attempt-2',file)),false);
const prep=json('preparation.json');assert.equal(prep.intake_external_and_internal_integrity,true);assert.equal(prep.source_context_not_dropped,true);assert(prep.successor_draft_capacities.every(c=>c.selection.used<=c.selection.limit));
console.log(JSON.stringify({result:'PASS',campaign:'BLOCKED before reconstruction',original_export:{bytes:original.length,sha256:hash(original)},original_chain_and_bodies_unchanged:true,failed_invocations:2,accepted_reconstructions:0,saves:0,calculations:0,corruption_submissions:0,executed_retry_helper:helper.helper_commit,helper_bytes_unchanged:true,disposable_cleanup:true,remaining_owned_processes:0,deciding_canonical_evidence:false},null,2));
