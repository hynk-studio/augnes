import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { armPath, arms, frozen, packet, record, run } from './study.mjs';
import { read, save, sha } from './io.mjs';
import { executeBatch } from './environment.mjs';
import { check, checkBatch } from './check.mjs';

// Developer-supplied solutions qualify mechanics only. Neither arm discovers
// these rules. The strong memo is allowed the exact same improved executable.
export function corrected(seed, round) {
  let source = seed;
  if (round >= 2) source = source.replace('(job.values.length + 1)', 'job.values.length');
  if (round >= 3) source = source.replace(
    "const entry = view.entries.find(item => item.key === job.name);",
    "const entry = view.entries.find(item => item.job.toolchain === job.toolchain && JSON.stringify(item.job.values) === JSON.stringify(job.values));",
  ).replace("{ action: 'compute', key: job.name }", "{ action: 'compute', key: JSON.stringify([job.values, job.toolchain]) }");
  if (round >= 5) source = source.replace('return deliveries.length;', 'return new Set(deliveries.map(item => item.execution_id)).size;');
  return source;
}

const summaries = [
  'symptom: mean output disagrees with the requirement. Arithmetic or stale input could explain it; retain code until the isolated observation.',
  'fresh: isolated raw=12 and mean=4 contradict required mean=6. Correct division by length. Reject stale-cache explanation for this observation without deleting it.',
  'grouping: isolated operations give 6 and 12; reuses give 5 and 6. Name is not sufficient. Match complete values and toolchain; output projection may share a raw sum.',
  'history: shallow dashboards match but prior producers and next values differ (5 versus 12). Retain the full-input/version applicability rule and accessible history.',
  'delivery: two identical deliveries point to one actual execution with raw=8. Deduplicate accounting; retain the causal model and cache, with no recomputation.',
];
const unresolved = [
  ['Arithmetic error versus stale cache input is unresolved from this output alone.'],
  ['Applicability of cache reuse across different values and toolchains remains unqualified.'],
  ['Whether the shallow current dashboard alone suffices for reuse is unqualified.'],
  ['Whether delivery count equals execution count is unqualified.'],
  ['Concurrency, eviction, nondeterministic tools and real workload usefulness were not studied; no conclusion beyond these fixtures.'],
];

export function scripted(root) {
  const started = performance.now(), { fixture } = frozen(root);
  const seed = readFileSync(path.join(root, 'frozen/seed.cjs'), 'utf8');
  const output = {};
  for (const arm of arms) {
    for (let round = 1; round <= fixture.observation_order.length; round++) {
      const received = packet(root, arm);
      const notes = { mode: 'scripted', author: 'implementing Codex session; developer-supplied correction',
        evidence: received.observations.map(x => x.id), summary: summaries[round - 1], unresolved: unresolved[round - 1],
        ...(arm === 'candidate'
          ? { hypotheses: summaries.slice(0, round).map((text, index) => ({ source: fixture.observation_order[index], interpretation: text })) }
          : { adaptive_memo: summaries.slice(0, round).join('\n'), permission: 'May use equivalent hypotheses, methods and arbitrary bounded code.' }) };
      writeFileSync(path.join(armPath(root, arm), 'working/adapter.cjs'), corrected(seed, round));
      writeFileSync(path.join(armPath(root, arm), 'working/notes.json'), JSON.stringify(notes, null, 2) + '\n');
      record(root, arm);
    }
    run(root, arm);
    output[arm] = check(root, arm);
    save(path.join(armPath(root, arm), 'B/check.json'), output[arm]);
  }
  mkdirSync(path.join(root, 'controls'));
  output.controls = {};
  const fixed = corrected(seed, 5);
  const controls = {
    unchanged: seed,
    reset: fixed + "\nmodule.exports.plan = job => ({action: 'reset-compute', key: job.name});\n",
    refuse: fixed + "\nmodule.exports.plan = () => ({action: 'refuse', reason: 'Scripted refusal control'});\n",
  };
  for (const [name, adapter] of Object.entries(controls)) {
    const start = performance.now(), directory = path.join(root, 'controls', name); mkdirSync(directory);
    writeFileSync(path.join(directory, 'adapter.cjs'), adapter, { flag: 'wx' });
    const batch = executeBatch(fixture, adapter);
    save(path.join(directory, 'results.json'), batch.results);
    save(path.join(directory, 'ledger.json'), { initial: batch.initial, actions: batch.actions, final: batch.final });
    const result = checkBatch(fixture, read(path.join(directory, 'ledger.json')), read(path.join(directory, 'results.json')));
    output.controls[name] = result;
    save(path.join(directory, 'check.json'), { ...result, adapter_sha256: sha(adapter), evidence_kind: 'scripted_control',
      measured_execution_and_check_ms: performance.now() - start });
  }
  save(path.join(root, 'scripted-accounting.json'), { measured_ms: performance.now() - started,
    initiated_model_calls: 0, scripted_revisions: 10, rule_author: 'implementing Codex session',
    human_assistance: 'User assignment; no human corrections during scripted execution. Human/development minutes and session token costs are unmeasured.',
    live_model_comparison: 'NOT_RUN', selection: 'Fixed identical observation schedule; active selection NOT_RUN.',
    conclusion: 'Equal B behavior. No observed candidate advantage; representation preparation burden has not been compared with live workers.' });
  return output;
}
