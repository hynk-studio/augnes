import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from './canonical-test-environment.mjs';
import { develop, freeze, confirm } from './reuse-applicability-study/study.mjs';
import { execute } from './reuse-applicability-study/execute.mjs';
import { check } from './reuse-applicability-study/oracle.mjs';
import { acquire } from './reuse-applicability-study/learn.mjs';
import { read } from './reuse-applicability-study/files.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { fileURLToPath } from 'node:url';

const owner = createCanonicalTestResourceRoot('ag-c59-'), passed = [];
try {
  const dev = path.join(owner.root, 'development'); develop(dev);
  const c = path.join(dev, 'candidate/program-4.json'), r = path.join(dev, 'reference/program-4.json');
  assert.deepEqual(read(c), read(r));
  assert.equal(read(path.join(dev, 'candidate/version-4.json')).changed, false);
  assert(read(path.join(dev, 'candidate-replay-0/check.json')).raw_unsafe_reuses > 0);
  assert.equal(read(path.join(dev, 'candidate-replay-2/check.json')).raw_unsafe_reuses, 1);
  assert.equal(read(path.join(dev, 'candidate-replay-4/check.json')).raw_unsafe_reuses, 0);
  passed.push('executed counterexamples induce revisions; irrelevant feedback retains program; unsafe originals preserved');
  const allocation = path.join(owner.root, 'confirmation'); freeze(allocation, c, r);
  for (const name of ['complete', 'incomplete']) for (const arm of ['candidate', 'reference']) {
    const inputs = path.join(allocation, `${name}-inputs`), output = path.join(allocation, `${arm}-${name}`);
    execute(inputs, arm === 'candidate' ? c : r, output);
    const result = check(output, inputs);
    assert.equal(result.status, 'PASS'); assert.equal(result.complete, name === 'complete');
    assert.equal(result.raw_unsafe_reuses, 0); assert.equal(result.checker_refusals, 0);
    assert.equal(result.unnecessary_recomputations, 0); assert.equal(result.reuses, 5);
    assert.equal(result.recomputations, 6); assert.equal(result.valid_completed, 11);
    assert.equal(result.deliveries, 12); assert.equal(result.distinct_results, 11);
    const report = read(path.join(output, 'report.json'));
    assert.deepEqual(report.rollups.map(x => x.subtotal_mWh), [72, 92, 46]);
    if (name === 'incomplete') assert.equal(report.rollups[2].exceeds_budget, null);
    assert.throws(() => execute(inputs, c, output), /EEXIST/);
  }
  passed.push('real file reports, compatible/irrelevant reuse, changed-basis recomputation, missing evidence, identity and rollups');
  const child = await runCanonicalChild({ suite: 'reuse-applicability', label: 'fresh-program-and-input-reload',
    command: process.execPath, args: [fileURLToPath(new URL('./reuse-applicability-study/study.mjs', import.meta.url)),
      'confirm', allocation, 'candidate', 'complete-inputs'], cwd: path.dirname(fileURLToPath(import.meta.url)),
    env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 3000,
    resourceOwner: owner, stdout: { write() {} } });
  assert.equal(canonicalChildAcceptanceFailure(child, { suite: 'reuse-applicability', timeoutMs: 3000, requireNaturalExit: true }), null);
  assert.equal(read(path.join(allocation, 'candidate-complete-inputs/check.json')).status, 'PASS');
  assert.equal(confirm(allocation, 'recompute', 'complete-inputs').check.unnecessary_recomputations, 5);
  assert.equal(confirm(allocation, 'refuse', 'complete-inputs').check.valid_completed, 0);
  const pinned = path.join(allocation, 'candidate.json'), pinnedBytes = readFileSync(pinned);
  writeFileSync(pinned, '{}'); assert.throws(() => confirm(allocation, 'candidate', 'incomplete-inputs'), /method_changed/);
  writeFileSync(pinned, pinnedBytes);
  passed.push('fresh process executes pinned method and files; control costs and changed-artifact refusal');
  const out = path.join(allocation, 'candidate-complete'), inputs = path.join(allocation, 'complete-inputs');
  const reportFile = path.join(out, 'report.json'), original = readFileSync(reportFile);
  const report = read(reportFile); report.completed_work++; writeFileSync(reportFile, JSON.stringify(report));
  assert(check(out, inputs).errors.includes('false_completeness')); writeFileSync(reportFile, original);
  const resultFile = path.join(out, 'results/south-total.json'), originalResult = readFileSync(resultFile);
  const result = read(resultFile); result.id = read(path.join(out, 'results/stable-total.json')).id;
  writeFileSync(resultFile, JSON.stringify(result)); assert.equal(check(out, inputs).status, 'FAIL');
  writeFileSync(resultFile, originalResult);
  passed.push('independent checker rejects duplicate completion and equal-content identity collapse');
  const bad = path.join(owner.root, 'loop.cjs'); writeFileSync(bad, 'module.exports.plan = () => { while(true) {} };');
  const failed = path.join(allocation, 'timeout'); assert.throws(() => execute(inputs, bad, failed), /timed out/);
  assert(existsSync(path.join(failed, 'failure.json'))); assert(existsSync(path.join(failed, 'ledger.json')));
  assert.throws(() => execute(inputs, c, failed), /EEXIST/);
  const records = read(path.join(dev, 'experience.json'));
  assert.throws(() => acquire([records[0]]), /contrasting/);
  assert.throws(() => acquire([records[0], { ...records[0], id: 'conflict', valid: false }]), /unexpressible/);
  passed.push('bounded code, immutable failed attempts and contradictory/unlearnable evidence refusal');
  console.log(JSON.stringify({ status: 'PASS', checks: passed, model_calls: 0 }, null, 2));
} finally {
  const cleanup = cleanupCanonicalTestResources([owner]);
  assert(cleanup.every(x => x.completed)); assert.equal(existsSync(owner.root), false);
  console.log(JSON.stringify({ cleanup: 'PASS', remaining_owned_resources: 0 }));
}
