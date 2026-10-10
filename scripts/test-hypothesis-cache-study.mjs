import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { prepare, packet, record, revisions, run } from './hypothesis-cache-study/study.mjs';
import { scripted, corrected } from './hypothesis-cache-study/scripted.mjs';
import { check, checkBatch } from './hypothesis-cache-study/check.mjs';
import { executeBatch } from './hypothesis-cache-study/environment.mjs';
import { read, sha } from './hypothesis-cache-study/io.mjs';

const owner = createCanonicalTestResourceRoot('ag-c28-');
const passed = [];
try {
  const root = path.join(owner.root, 'comparison'); prepare(root);
  const results = scripted(root);
  for (const arm of ['candidate', 'reference']) {
    const result = check(root, arm);
    assert.equal(result.success, true); assert.equal(result.correct_jobs, 8);
    assert.equal(result.computations, 3); assert.equal(result.reuses, 5);
    assert.equal(result.unnecessary_recomputations, 0); assert.equal(result.simulated_units, 43);
    assert.equal(result.telemetry_correct, true); assert.equal(result.unnecessary_causal_revisions_on_delivery, 0);
    assert.deepEqual(result.revisions.map(item => item.causal_changed), [false, true, true, false, false]);
    assert.deepEqual(result.revisions.map(item => item.telemetry_changed), [false, false, false, false, true]);
    assert.deepEqual(result.diagnoses.map(item => item.isolated_mean), [4, 4, 6, 6, 6, 6]);
    assert.deepEqual(result.diagnoses.map(item => item.history_left_action), ['reuse', 'reuse', 'reuse', 'compute', 'compute', 'compute']);
    assert(result.diagnoses.every(item => item.history_right_action === 'reuse'));
    assert.equal(result.evidence_kind, 'scripted'); assert.equal(result.live_model_comparison, 'NOT_RUN');
    const history = revisions(root, arm);
    assert.equal(history[1].notes.unresolved.length > 0, true);
    assert.equal(history.at(-1).received[0].output, 4, 'rejected explanation must not erase original failure');
  }
  assert.equal(results.candidate.results_sha256, results.reference.results_sha256);
  assert.equal(results.candidate.ledger_sha256, results.reference.ledger_sha256);
  passed.push('two actual file-producing paths, fixed observation parity, version lineage and justified retention');
  assert.equal(results.controls.reset.success, true); assert.equal(results.controls.reset.computations, 8);
  assert.equal(results.controls.reset.simulated_units, 112); assert.equal(results.controls.reset.excess_computations, 5);
  assert.equal(results.controls.refuse.success, false); assert.equal(results.controls.refuse.completed, false);
  assert.equal(results.controls.unchanged.success, false); assert(results.controls.unchanged.unsafe_reuses > 0);
  passed.push('unchanged, reset-all and refusal controls distinguish correctness, work and completion');
  const fixture = read(path.join(root, 'frozen/fixtures.json'));
  const ledger = read(path.join(root, 'candidate/B/ledger.json'));
  const files = fixture.b_jobs.map(job => read(path.join(root, 'candidate/B/results', `${job.id}.json`)));
  for (const mutation of ['cost', 'producer', 'history', 'missing-execution', 'result-lineage']) {
    const altered = structuredClone(ledger), outputs = structuredClone(files);
    if (mutation === 'cost') altered.actions[0].units = 0;
    if (mutation === 'producer') altered.actions[1].entry.job.toolchain = 'v1';
    if (mutation === 'history') altered.actions[0].view.executions = [];
    if (mutation === 'missing-execution') altered.final.executions.pop();
    if (mutation === 'result-lineage') outputs[0].execution_id = 'invented';
    assert.throws(() => checkBatch(fixture, altered, outputs), undefined, mutation);
  }
  const wrong = structuredClone(files); wrong[0].value = 999;
  assert.equal(checkBatch(fixture, ledger, wrong).outputs_correct, false, 'baseline agreement is not the oracle');
  const resultPath = path.join(root, 'candidate/B/results/b1.json');
  writeFileSync(resultPath, JSON.stringify(wrong[0]));
  assert.throws(() => check(root, 'candidate'), /AssertionError/);
  writeFileSync(resultPath, JSON.stringify(files[0]));
  assert.equal(check(root, 'candidate').success, true);
  const observationsPath = path.join(root, 'observations.json');
  const observationBytes = readFileSync(observationsPath);
  const changedObservations = JSON.parse(observationBytes); changedObservations[0].output = 6;
  writeFileSync(observationsPath, JSON.stringify(changedObservations));
  assert.throws(() => check(root, 'candidate'), /observations_changed/);
  writeFileSync(observationsPath, observationBytes);
  passed.push('independent checker rejects fabricated costs, provenance, history, output lineage and tampered files');
  assert.throws(() => prepare(root), { code: 'EEXIST' });
  assert.throws(() => run(root, 'candidate'), { code: 'EEXIST' });
  assert.throws(() => packet(root, '../candidate'), /arm_invalid/);
  assert.throws(() => record(root, 'reference'), /A_already_complete/);
  passed.push('completed attempts cannot be overwritten or silently retried');

  const failureRoot = path.join(owner.root, 'failed-attempt'); prepare(failureRoot);
  const seed = readFileSync(path.join(failureRoot, 'frozen/seed.cjs'), 'utf8');
  const adapter = corrected(seed, 5) + '\nmodule.exports.plan = () => { while (true) {} };\n';
  for (let round = 0; round < 5; round++) {
    const next = packet(failureRoot, 'candidate');
    writeFileSync(path.join(failureRoot, 'candidate/working/adapter.cjs'), adapter);
    if (round === 0) {
      writeFileSync(path.join(failureRoot, 'candidate/working/notes.json'), JSON.stringify({
        mode: 'scripted', author: 'schedule regression', summary: 'Invalid missing observation.', evidence: [], unresolved: [],
      }));
      assert.throws(() => record(failureRoot, 'candidate'), /observation_schedule_mismatch/);
      assert.equal(revisions(failureRoot, 'candidate').length, 1);
    }
    writeFileSync(path.join(failureRoot, 'candidate/working/notes.json'), JSON.stringify({
      mode: 'scripted', author: 'timeout regression', summary: 'Intentional bounded failure, not study evidence.',
      evidence: next.observations.map(item => item.id), unresolved: [],
    }));
    record(failureRoot, 'candidate');
  }
  assert.throws(() => run(failureRoot, 'candidate'), /Script execution timed out/);
  const failureFile = path.join(failureRoot, 'candidate/B/failure.json');
  const before = sha(readFileSync(failureFile));
  assert.equal(read(failureFile).partial.actions.length, 1, 'preserve actual partial inspect before failure');
  assert.throws(() => run(failureRoot, 'candidate'), { code: 'EEXIST' });
  assert.equal(sha(readFileSync(failureFile)), before);
  assert.throws(() => executeBatch(fixture, corrected(seed, 5) + '\nmodule.exports.project = () => Infinity;'), /result_not_finite/);
  passed.push('bounded adapter timeout preserves failed attempt and partial actions without retry');
  console.log(JSON.stringify({ status: 'PASS', checks: passed, model_calls: 0, live_model_comparison: 'NOT_RUN' }, null, 2));
} finally {
  const cleanup = cleanupCanonicalTestResources([owner]);
  assert(cleanup.every(item => item.completed), 'test resource cleanup failed');
  assert.equal(existsSync(owner.root), false);
  console.log(JSON.stringify({ cleanup: 'PASS', owned_processes_started: 0, remaining_owned_resources: 0 }));
}
