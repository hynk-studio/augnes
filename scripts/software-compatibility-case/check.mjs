import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadSnapshot, runOperations } from './runner.mjs';
import { verifyPreparation } from './inventory.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const read = p => JSON.parse(fs.readFileSync(p));
const publicKeys = new Set(['summary', 'reason', 'observed_actions', 'uncertainty', 'gaps', 'proposed_next_steps', 'notes']);
function facts(value, key = '') {
  if (typeof value === 'string' && publicKeys.has(key)) return value.replace(/[\s:;|\-]/gu, '');
  if (Array.isArray(value)) return value.map(v => facts(v, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, facts(v,k)]));
  return value;
}
export function checkA(output) {
  verifyPreparation(root);
  const basis = path.join(root, 'materials/a/facts.json');
  const original = read(basis), packet = read(output);
  // Fact equality is independent of admission; no output supplies its own facts.
  const expected = structuredClone(original.draft);
  expected.changed_files[0].repository_relative_path = 'src/status.ts';
  expected.artifacts[0].artifact_ref.external_id = 'reports/status.json';
  const result = runOperations(loadSnapshot(path.join(root, 'snapshots/a')),
    [{ id: 'A', op: 'result', request: original.request, value: packet }])[0];
  assert.equal(result.accepted, true, 'A must actually be admitted by the original revision');
  assert.deepEqual(facts(result.value), facts(expected), 'A fact/uncertainty/skipped-check preservation');
  return { status: 'PASS', scope: 'ARTIFACT_ONLY', fact_preservation: true, source_admission: true };
}
export function checkB(output) {
  verifyPreparation(root);
  const oracle = path.join(root, 'evaluator/b-oracle.json');
  const expected = read(oracle), actual = read(output);
  assert.deepEqual(Object.keys(actual).sort(), ['results','revision']);
  assert.equal(actual.revision, 'b');
  assert(Array.isArray(actual.results));
  assert.equal(actual.results.length, Object.keys(expected).length, 'B complete batch coverage');
  const seen = new Set();
  for (const row of actual.results) {
    assert(!seen.has(row.id), 'B duplicate result'); seen.add(row.id);
    assert(Object.hasOwn(expected, row.id), 'B unknown result');
    assert.deepEqual(row, { id: row.id, ...expected[row.id] }, 'B independent classification, exact descriptions and canonical paths');
  }
  return { status: 'PASS', scope: 'ARTIFACT_ONLY', results: seen.size, expected_basis: 'hash-bound evaluator/b-oracle.json' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [task, output] = process.argv.slice(2);
  console.log(JSON.stringify(task === 'a' ? checkA(output) : task === 'b' ? checkB(output) : (() => { throw new Error('task must be a or b'); })()));
}
