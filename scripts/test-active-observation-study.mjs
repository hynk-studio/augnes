import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialize, act, current } from './active-observation-study/environment.mjs';
import { initial, update, choose, alternatives, digest } from './active-observation-study/method.mjs';
import { choose as reference } from './active-observation-study/reference.mjs';
import { fixture } from './active-observation-study/cases.mjs';
import { check } from './active-observation-study/check.mjs';
import { read, save } from './reuse-applicability-study/files.mjs';
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from './canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

const owners = [], checks = [];
const owned = () => { const o = createCanonicalTestResourceRoot('ag-c64-', { shortSocketPaths: true }); owners.push(o); return o; };
const firstOwner = owned();
const run = (name, kind, method = initial(), selector = choose, change = x => x) => {
  const base = path.join(firstOwner.root, name); mkdirSync(base);
  const input = change(fixture(kind, name));
  const state = path.join(base, 'state'), output = path.join(base, 'output'); mkdirSync(output);
  let view = initialize(state, input.contract, input.inputs), model = structuredClone(method), result;
  for (let i = 0; i < 64 && !view.finished; i++) {
    result = act(state, { ...selector(model, view), model_sha256: digest(model) });
    model = update(model, result.entry.observation); view = result.view;
  }
  assert(view.finished);
  save(path.join(output, 'report.json'), result.report);
  save(path.join(output, 'results.json'), view.jobs.filter(j => j.observed?.status === 'complete').map(j => j.observed));
  return { state, output, model, view, checked: check(state, output) };
};
try {
  const first = run('candidate', 'first');
  assert.equal(first.checked.status, 'PASS'); assert.equal(first.checked.complete, true);
  assert(first.checked.actions.some(x => x.action === 'diagnose' && x.outcome === 'unsupported'));
  assert(first.checked.actions.some(x => x.action === 'wait'));
  assert.deepEqual(first.model.conditions, { utf16le: ['unsupported'], utf8: ['complete'] });
  const later = run('later', 'later', first.model);
  assert.equal(later.checked.status, 'PASS'); assert.equal(later.checked.complete, true);
  assert(!later.checked.actions.some(x => x.action === 'diagnose'));
  assert.equal(later.checked.actions.filter(x => x.action === 'fast').length, 3);
  const baseline = run('reference', 'first', initial(), reference);
  const baseLater = run('reference-later', 'later', baseline.model, reference);
  assert.equal(baseLater.checked.status, 'PASS'); assert.equal(baseLater.checked.complete, true);
  checks.push('selected productive/diagnostic actions revise conditions; later actual outputs; strong adaptive reference');
  const cold = run('cold', 'later');
  assert.equal(cold.checked.status, 'PASS');
  assert(cold.checked.completed < later.checked.completed || cold.checked.simulated_cost > later.checked.simulated_cost);
  checks.push('model-free cold-history diagnostic separates acquired condition from supplied mechanism');

  const temporal = path.join(firstOwner.root, 'temporal'), f = fixture('first', 'temporal');
  initialize(temporal, f.contract, f.inputs);
  const pending = act(temporal, { action: 'status', work_id: 'folio' });
  assert.equal(pending.entry.observation.status, 'pending'); assert.deepEqual(update(initial(), pending.entry.observation), initial());
  const refuse = act(temporal, { action: 'robust', work_id: 'folio' });
  assert.equal(refuse.entry.refusal, 'reconcile_before_reissue');
  const late = act(temporal, { action: 'status', work_id: 'folio' });
  assert.equal(late.entry.observation.status, 'unsupported');
  assert(late.entry.observation.occurred_at < late.entry.observation.observed_at);
  assert.equal(pending.entry.observation.status, 'pending');
  const model = update(initial(), late.entry.observation);
  assert.deepEqual(update(model, late.entry.observation), model);
  const duplicate = act(temporal, { action: 'status', work_id: 'folio' });
  assert.equal(duplicate.entry.observation.event_id, late.entry.observation.event_id);
  assert.deepEqual(update(model, duplicate.entry.observation), model);
  const changedScope = { ...late.entry.observation, event_id: 'a'.repeat(64), tool_scope: 'b'.repeat(64) };
  assert.deepEqual(update(model, changedScope), model);
  const unknown = { ...late.entry.observation, status: 'unknown' };
  assert.deepEqual(update(model, unknown), model);
  checks.push('pending, late availability, uncertain-effect refusal, duplicate identity, unknown and changed provenance');

  const view = pending.view;
  assert(alternatives(initial(), view).length > 0);
  assert.deepEqual(alternatives(first.model, view), alternatives(first.model, { ...view, remaining: 1, task: { ...view.task, budget: 1 } }));
  const repeatCondition = { ...late.entry.observation, event_id: 'c'.repeat(64) };
  const retained = update(model, repeatCondition);
  assert.equal(retained.revisions.at(-1).changed, false);
  const conflict = update(model, { ...repeatCondition, status: 'complete' });
  assert.deepEqual(conflict.conditions.utf16le, ['complete', 'unsupported']);
  const finite = run('finite', 'first', initial(), choose, x => { x.contract.budget = 3; return x; });
  assert.equal(finite.checked.status, 'PASS'); assert.equal(finite.checked.complete, false);
  assert(finite.view.history.length <= 3);
  const invalid = run('invalid', 'later', initial(), choose, x => {
    x.contract.jobs = [x.contract.jobs[1]]; x.contract.limits = { south: 1 }; x.inputs.store = Buffer.from('{bad'); return x;
  });
  assert.equal(invalid.checked.status, 'PASS'); assert.equal(invalid.checked.complete, false);
  assert(invalid.view.history.some(x => x.observation?.status === 'invalid'));
  assert.throws(() => act(finite.state, { action: 'wait', ticks: 1 }), /task_finished/);
  const bad = fixture('first', 'bad'); bad.contract.jobs[0].id = '../escape';
  assert.throws(() => initialize(path.join(firstOwner.root, 'bad'), bad.contract, bad.inputs), /invalid_contract/);
  checks.push('goal-independent forecast; finite budget, invalid input and refusal without fabricated completion');

  const original = readFileSync(path.join(later.output, 'report.json'));
  const report = JSON.parse(original); report.rows[1].result_id = report.rows[0].result_id;
  writeFileSync(path.join(later.output, 'report.json'), JSON.stringify(report));
  assert.equal(check(later.state, later.output).status, 'FAIL');
  writeFileSync(path.join(later.output, 'report.json'), original);
  const freshOwner = owned(), consumer = path.join(freshOwner.root, 'consumer'); mkdirSync(consumer);
  const g = fixture('later', 'fresh'); const state = path.join(freshOwner.root, 'state'); initialize(state, g.contract, g.inputs);
  for (const name of ['work.mjs', 'method.mjs', 'reference.mjs']) copyFileSync(new URL(`./active-observation-study/${name}`, import.meta.url), path.join(consumer, name));
  save(path.join(consumer, 'connection.json'), { endpoint: fileURLToPath(new URL('./active-observation-study/environment.mjs', import.meta.url)), state });
  mkdirSync(path.join(consumer, 'retained')); save(path.join(consumer, 'retained/model.json'), first.model);
  const child = await runCanonicalChild({ suite: 'active-observation', label: 'fresh-method-use', command: process.execPath,
    args: ['work.mjs', 'run', 'candidate'], cwd: consumer, env: buildCanonicalChildEnvironment({ temporaryRoot: freshOwner.root }),
    timeoutMs: 3000, resourceOwner: freshOwner, stdout: { write() {} } });
  assert.equal(canonicalChildAcceptanceFailure(child, { suite: 'active-observation', timeoutMs: 3000, requireNaturalExit: true }), null);
  assert.equal(read(path.join(consumer, 'output/start.json')).model_sha256, digest(first.model));
  assert.equal(check(state, path.join(consumer, 'output')).status, 'PASS');
  checks.push('fresh process loads exact predecessor method, performs actions and produces independently checked files');
  const failedOwner = owned();
  const failed = await runCanonicalChild({ suite: 'active-observation', label: 'invalid-action-process', command: process.execPath,
    args: [fileURLToPath(new URL('./active-observation-study/environment.mjs', import.meta.url)), state, '{"action":"invent"}'],
    cwd: consumer, env: buildCanonicalChildEnvironment({ temporaryRoot: failedOwner.root }), timeoutMs: 2000,
    resourceOwner: failedOwner, stdout: { write() {} }, stderr: { write() {} } });
  assert.notEqual(canonicalChildAcceptanceFailure(failed, { suite: 'active-observation', timeoutMs: 2000, requireNaturalExit: true }), null);
  assert.equal(existsSync(path.join(state, 'action.lock')), false);
  checks.push('failed action process remains failed with settled process tree and no lock residue');
  console.log(JSON.stringify({ status: 'PASS', checks, candidate: [first.checked, later.checked], reference: [baseline.checked, baseLater.checked], cold: cold.checked, model_calls: 0 }, null, 2));
} finally {
  const cleanup = cleanupCanonicalTestResources(owners); assert(cleanup.every(x => x.completed));
  assert(owners.every(x => !existsSync(x.root))); console.log(JSON.stringify({ cleanup: 'PASS', remaining_owned_resources: 0 }));
}
