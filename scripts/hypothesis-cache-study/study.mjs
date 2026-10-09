import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bytes, call, identities, read, save, sha } from './io.mjs';
import { executeBatch, observe } from './environment.mjs';

export const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
export const sourceFiles = ['fixtures.json', 'seed.cjs', 'io.mjs', 'environment.mjs', 'study.mjs', 'scripted.mjs', 'check.mjs'];
export const arms = ['candidate', 'reference'];
export const armPath = (root, arm) => {
  assert(arms.includes(arm), 'arm_invalid'); return path.join(root, arm);
};
export const revisions = (root, arm) => readdirSync(path.join(armPath(root, arm), 'revisions'))
  .sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]))
  .map(file => read(path.join(armPath(root, arm), 'revisions', file)));

export function frozen(root) {
  const manifest = read(path.join(root, 'manifest.json'));
  assert.deepEqual(Object.keys(manifest.sources), sourceFiles, 'source_inventory_changed');
  for (const [name, hash] of Object.entries(manifest.sources)) {
    assert.equal(sha(readFileSync(path.join(sourceRoot, name))), hash, `source_changed:${name}`);
    assert.equal(sha(readFileSync(path.join(root, 'frozen', name))), hash, `frozen_source_changed:${name}`);
  }
  const observations = read(path.join(root, 'observations.json'));
  assert.equal(sha(observations), manifest.observations_sha256, 'observations_changed');
  return { manifest, observations, fixture: read(path.join(root, 'frozen/fixtures.json')) };
}

function checkpoint(root, arm, prior, source, notes, received, manifest) {
  const item = { version: prior ? prior.version + 1 : 0, parent_sha256: prior ? sha(prior) : null,
    manifest_sha256: sha(manifest), adapter: source, ...identities(source),
    notes, notes_sha256: sha(notes), received, observations_sha256: sha(received),
    evidence_kind: notes.mode, authority: 'derived_research_only' };
  save(path.join(armPath(root, arm), 'revisions', `${item.version}.json`), item);
  return item;
}

export function prepare(root) {
  assert(path.isAbsolute(root), 'absolute_new_output_directory_required');
  const started = performance.now();
  mkdirSync(root); mkdirSync(path.join(root, 'frozen'));
  const sources = {};
  for (const name of sourceFiles) {
    const source = readFileSync(path.join(sourceRoot, name)); sources[name] = sha(source);
    writeFileSync(path.join(root, 'frozen', name), source, { flag: 'wx', mode: 0o400 });
  }
  const fixture = read(path.join(root, 'frozen/fixtures.json'));
  const seed = readFileSync(path.join(root, 'frozen/seed.cjs'), 'utf8');
  const observations = observe(fixture, seed);
  assert.deepEqual(observations.map(x => x.id), fixture.observation_order);
  const manifest = { version: fixture.version, sources, observations_sha256: sha(observations),
    seed_sha256: sha(seed), reference_sha256: sha(fixture.b_reference),
    created_at: new Date().toISOString(), schedule: fixture.observation_order,
    equivalent_resources: { sources: sourceFiles, starting_adapter_sha256: sha(seed),
      limits: fixture.limits, operations: ['inspect', 'compute', 'reuse', 'reset', 'refuse'],
      history: 'Complete normal inspection in both arms; no withheld state field.',
      worker: 'Same supported local Codex filesystem interface; no automated worker dispatch.' },
    exposure: 'Constructed fixtures, oracle and scripted corrections authored by the implementing Codex session. This is exposed development evidence.',
    live_model_comparison: 'NOT_RUN' };
  save(path.join(root, 'manifest.json'), manifest); save(path.join(root, 'observations.json'), observations);
  for (const arm of arms) {
    const directory = armPath(root, arm); mkdirSync(directory);
    mkdirSync(path.join(directory, 'working')); mkdirSync(path.join(directory, 'revisions'));
    const notes = { mode: 'developer_supplied_seed', author: 'fixture developer', evidence: [],
      summary: 'Provisional assumptions: name identifies reusable input and version; mean divides by length plus one; delivery count measures executions.',
      unresolved: ['The starting assumptions have not been qualified.'] };
    writeFileSync(path.join(directory, 'working/adapter.cjs'), seed, { flag: 'wx' });
    save(path.join(directory, 'working/notes.json'), notes);
    checkpoint(root, arm, null, seed, notes, [], manifest);
    writeFileSync(path.join(directory, 'TASK.md'), workerTask(arm), { flag: 'wx' });
  }
  save(path.join(root, 'preparation.json'), { measured_ms: performance.now() - started,
    model_calls: 0, human_minutes: null, human_minutes_reason: 'Not measured; user supplied assignment, Codex authored cases/rules/corrections.',
    simulation_preparation: { development_executions: 7, b_seed_executions_per_arm: 2 },
    live_model_comparison: 'NOT_RUN' });
  return { output: root, manifest_sha256: sha(manifest), observations_sha256: sha(observations) };
}

function workerTask(arm) {
  return `# Task A: ${arm}\n\nUse the ordinary local Codex file interface. Edit only your working/adapter.cjs and working/notes.json.\n` +
    `Run the packet command for the next fixed observation, then record after each observation. Both arms may inspect the same frozen simulator/source/spec and full history, write arbitrary bounded pure JavaScript, formulate hypotheses and revise methods.\n` +
    (arm === 'candidate' ? `Keep provisional hypotheses alongside your executable model, with evidence-linked rejection/revision/retention.\n`
      : `Keep the strongest source-linked adaptive memo and executable code. You may invent equivalent hypothesis/model methods without restriction.\n`) +
    `Notes require author, mode (exposed_development or fixed_worker), evidence (all received observation IDs in order), summary and unresolved (array). Additional fields are free. Preserve observations and prior versions. Return concise public rationales, not hidden reasoning.\n` +
    `Adapter exports plan(job, view), project(job, raw), countExecutions(deliveries). See seed.cjs and environment.mjs. No imports or external effects. Only finite JSON output; each call is fresh and time-bounded. This trusted-code runner is not a security sandbox.\n` +
    `Task B and its reference answers were declared before either A artifact. After A, run your final adapter on B to create result files and an action ledger. Refusing every job fails completion; extra resets/computation count. Do not edit simulator, oracle, sealed snapshots or the other arm.\n` +
    `This development pack exposes expected answers and scripted developer solutions. It is not a blind model study. No provider campaign is authorized by these files.\n`;
}

export function packet(root, arm) {
  const { observations } = frozen(root), history = revisions(root, arm);
  const next = history.length - 1;
  assert(next < observations.length, 'A_already_complete');
  return { round: next + 1, previous_sha256: sha(history.at(-1)), observations: observations.slice(0, next + 1) };
}

export function record(root, arm) {
  const { manifest, fixture } = frozen(root), history = revisions(root, arm);
  const received = packet(root, arm).observations, directory = armPath(root, arm);
  const source = readFileSync(path.join(directory, 'working/adapter.cjs'), 'utf8');
  const notes = read(path.join(directory, 'working/notes.json'));
  assert(bytes(source) <= fixture.limits.adapter_bytes && bytes(notes) <= fixture.limits.notes_bytes, 'artifact_budget_exceeded');
  assert(['scripted', 'exposed_development', 'fixed_worker'].includes(notes.mode), 'evidence_mode_required');
  assert(typeof notes.author === 'string' && notes.author.trim() && typeof notes.summary === 'string' && notes.summary.trim(), 'attribution_required');
  assert(Array.isArray(notes.unresolved) && notes.unresolved.every(x => typeof x === 'string'), 'unresolved_required');
  assert.deepEqual(notes.evidence, received.map(x => x.id), 'observation_schedule_mismatch');
  return checkpoint(root, arm, history.at(-1), source, notes, received, manifest);
}

export function run(root, arm) {
  const { manifest, fixture, observations } = frozen(root), history = revisions(root, arm), final = history.at(-1);
  assert.equal(history.length, observations.length + 1, 'A_incomplete');
  const directory = path.join(armPath(root, arm), 'B'); mkdirSync(directory);
  save(path.join(directory, 'started.json'), { manifest_sha256: sha(manifest), revision_sha256: sha(final) });
  const start = performance.now();
  try {
    const batch = executeBatch(fixture, final.adapter);
    mkdirSync(path.join(directory, 'results'));
    for (const result of batch.results) save(path.join(directory, 'results', `${result.job_id}.json`), result);
    save(path.join(directory, 'ledger.json'), { initial: batch.initial, actions: batch.actions, final: batch.final });
    const executionCount = call(final.adapter, 'countExecutions', [observations.at(-1).state.deliveries]);
    const receipt = { manifest_sha256: sha(manifest), revision_sha256: sha(final), ...identities(final.adapter),
      results_sha256: sha(batch.results), ledger_sha256: sha({ initial: batch.initial, actions: batch.actions, final: batch.final }),
      simulated_units: batch.actions.reduce((n, action) => n + action.units, 0),
      telemetry_execution_count: executionCount, measured_batch_ms: performance.now() - start,
      runner_model_calls: 0, external_worker_usage: null,
      external_worker_usage_reason: 'Authorship is recorded in notes; the file runner does not measure the external worker.',
      human_effort: 'Unmeasured; developer-authored rules/corrections, no human repair inside this batch.',
      live_model_comparison: 'NOT_RUN', evidence_kind: final.evidence_kind };
    save(path.join(directory, 'receipt.json'), receipt);
    frozen(root); return receipt;
  } catch (error) {
    save(path.join(directory, 'failure.json'), { status: 'FAILED', name: error.name, message: String(error.message).slice(0, 300),
      partial: error.partial ?? null, measured_ms: performance.now() - start, retry: 'No overwrite; preserve this attempt.' });
    throw error;
  }
}

export async function main(args) {
  const [command, directory, arm] = args;
  const root = path.resolve(directory ?? '');
  assert(directory && args.length <= 3, 'usage: study.mjs prepare|packet|record|run|scripted ABSOLUTE_DIRECTORY [candidate|reference]');
  if (command === 'prepare') return prepare(root);
  if (command === 'packet') return packet(root, arm);
  if (command === 'record') return { revision_sha256: sha(record(root, arm)) };
  if (command === 'run') return run(root, arm);
  if (command === 'scripted') return (await import('./scripted.mjs')).scripted(root);
  throw new Error('unknown_command');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.message); process.exitCode = 1;
  });
}
