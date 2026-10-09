import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { armPath, frozen, revisions } from './study.mjs';
import { call, identities, read, sha } from './io.mjs';

// Independent arithmetic and ledger replay: no simulator or adapter is used to
// produce the oracle, decide output correctness, or account action costs.
function referenceRaw(job, fixture) {
  let total = 0;
  for (let index = 0; index < job.values.length; index++) total += job.values[index];
  return total * fixture.spec.factors[job.toolchain];
}
const applicable = (entry, job) => entry.job.toolchain === job.toolchain &&
  JSON.stringify(entry.job.values) === JSON.stringify(job.values);
const surface = entries => ({ status: 'idle', cache_slots: entries.size });

export function checkBatch(fixture, ledger, results) {
  const entries = new Map(), executions = [], deliveries = [];
  let sequence = 0;
  function insert(job, key) {
    const entry = { id: `execution-${++sequence}`, key, job, raw: referenceRaw(job, fixture) };
    entries.set(key, entry); executions.push(entry);
    deliveries.push({ event_id: `event-${sequence}`, execution_id: entry.id, raw: entry.raw });
    return entry;
  }
  const view = () => ({ surface: surface(entries), entries: [...entries.values()], executions: [...executions], deliveries: [...deliveries] });
  for (const job of fixture.b_seed) insert(job, job.name);
  assert.deepEqual(ledger.initial, view(), 'initial_cache_provenance');
  assert.equal(results.length, fixture.b_jobs.length, 'result_inventory');
  let cursor = 0, cost = 0, recomputations = 0, computes = 0, reuse = 0, unsafe = 0, resets = 0, refusals = 0, correct = 0;
  const consume = (job, expected) => {
    const action = ledger.actions[cursor];
    assert(action && action.index === cursor && action.job_id === job.id, 'action_order');
    if (expected) assert.equal(action.action, expected, 'action_kind');
    assert(Object.hasOwn(fixture.simulated_costs, action.action), 'unknown_action');
    assert.equal(action.units, fixture.simulated_costs[action.action], 'action_cost');
    cursor++; cost += action.units; return action;
  };
  for (const [index, job] of fixture.b_jobs.entries()) {
    const expectedRaw = referenceRaw(job, fixture);
    assert.equal(fixture.b_reference[job.id], job.output === 'mean' ? expectedRaw / job.values.length : expectedRaw, 'predeclared_oracle_arithmetic');
    assert.deepEqual(consume(job, 'inspect').view, view(), 'normal_interface_history');
    const couldReuse = [...entries.values()].some(entry => applicable(entry, job));
    let action = consume(job), entry;
    if (action.action === 'reset') {
      resets++; entries.clear(); action = consume(job, 'compute');
    }
    if (action.action === 'compute') {
      computes++; if (couldReuse) recomputations++;
      assert(typeof action.entry?.key === 'string' && action.entry.key.length > 0 && action.entry.key.length <= 512, 'cache_key');
      entry = insert(job, action.entry.key);
      assert.deepEqual(action.entry, entry, 'execution_provenance');
    } else if (action.action === 'reuse') {
      reuse++; entry = [...entries.values()].find(item => item.id === action.entry?.id);
      assert(entry, 'invented_or_evicted_cache_entry');
      assert.deepEqual(action.entry, entry, 'reuse_provenance');
      if (!applicable(entry, job)) unsafe++;
    } else {
      assert.equal(action.action, 'refuse', 'unexpected_action'); refusals++;
    }
    const result = results[index]; assert.equal(result.job_id, job.id, 'result_order');
    if (entry) {
      assert.equal(result.status, 'completed', 'completion_state');
      assert.equal(result.execution_id, entry.id, 'result_lineage');
      assert.equal(result.action_index, action.index, 'result_action_link');
      assert(typeof result.value === 'number' && Number.isFinite(result.value), 'finite_output');
      if (result.value === fixture.b_reference[job.id]) correct++;
    } else assert.deepEqual(result, { job_id: job.id, status: 'refused' }, 'refusal_not_completion');
  }
  assert.equal(cursor, ledger.actions.length, 'extra_actions');
  assert.deepEqual(ledger.final, view(), 'final_cache_and_execution_history');
  // Independent lower bound: one compute for each unavailable raw equivalence
  // class, then reuse. No worker plan or assumed candidate success is consulted.
  const seen = new Set(fixture.b_seed.map(job => JSON.stringify([job.values, job.toolchain])));
  let minimumComputes = 0;
  for (const job of fixture.b_jobs) {
    const key = JSON.stringify([job.values, job.toolchain]);
    if (!seen.has(key)) { minimumComputes++; seen.add(key); }
  }
  assert.equal(minimumComputes, fixture.b_optimal.computations);
  const minimumCost = fixture.b_jobs.length * fixture.simulated_costs.inspect + minimumComputes * fixture.simulated_costs.compute +
    (fixture.b_jobs.length - minimumComputes) * fixture.simulated_costs.reuse;
  assert.equal(minimumCost, fixture.b_optimal.simulated_units);
  return { integrity: 'PASS', completed: refusals === 0, correct_jobs: correct, total_jobs: results.length,
    outputs_correct: correct === results.length, computations: computes, reuses: reuse, resets, refusals,
    unsafe_reuses: unsafe, locally_available_recomputations: recomputations,
    unnecessary_recomputations: Math.max(0, computes - minimumComputes),
    excess_computations: Math.max(0, computes - minimumComputes), simulated_units: cost,
    minimum_simulated_units: minimumCost, extra_simulated_units: cost - minimumCost,
    cost_comparison_valid: correct === results.length,
    success: correct === results.length && unsafe === 0 && refusals === 0 };
}

export function check(root, arm) {
  const start = performance.now(), { fixture, observations, manifest } = frozen(root);
  const history = revisions(root, arm);
  assert.equal(history.length, observations.length + 1, 'revision_inventory');
  assert.deepEqual(readdirSync(path.join(armPath(root, arm), 'revisions')).sort(), history.map(x => `${x.version}.json`).sort());
  for (const [index, item] of history.entries()) {
    assert.equal(item.version, index); assert.equal(item.parent_sha256, index ? sha(history[index - 1]) : null);
    assert.equal(item.manifest_sha256, sha(manifest));
    assert.deepEqual(item.received, observations.slice(0, index), 'original_observations_preserved');
    assert.equal(item.observations_sha256, sha(item.received)); assert.equal(item.notes_sha256, sha(item.notes));
    assert.deepEqual(item.notes.evidence, item.received.map(x => x.id));
    for (const [key, value] of Object.entries(identities(item.adapter))) assert.equal(item[key], value);
    assert.equal(item.authority, 'derived_research_only'); assert.equal(item.evidence_kind, item.notes.mode);
  }
  assert.equal(history[0].adapter_sha256, manifest.seed_sha256, 'same_starting_code');
  // Compare original bytes, not a rewritten explanation, including rejected ones.
  const h = observations.find(item => item.id === 'history');
  const fresh = observations.find(item => item.id === 'fresh');
  assert.equal(fresh.entry.raw, referenceRaw(fixture.development.implementation, fixture));
  assert.equal(fresh.output, 4); assert.equal(fresh.required, 6);
  assert.equal(fresh.state.executions.length, 1);
  for (const trial of observations.find(item => item.id === 'grouping').trials) {
    assert.equal(trial.isolated.raw, referenceRaw(trial.job, fixture));
    assert.equal(trial.required, trial.isolated.raw);
    assert.notEqual(trial.reused.raw, trial.isolated.raw);
    assert.equal(trial.reused.raw, referenceRaw(trial.reused.job, fixture));
  }
  assert.deepEqual(h.left.before.surface, h.right.before.surface);
  assert.notDeepEqual(h.left.before.executions, h.right.before.executions);
  assert.equal(h.left.next.raw, 5); assert.equal(h.right.next.raw, 12);
  const delivery = observations.at(-1);
  assert.equal(delivery.state.executions.length, 1); assert.equal(delivery.state.deliveries.length, 2);
  assert.deepEqual(delivery.state.deliveries[0], delivery.state.deliveries[1]);
  assert.equal(delivery.actual.raw, referenceRaw(fixture.development.telemetry, fixture));
  const diagnoses = history.map(item => ({ version: item.version,
    available_observations: item.received.map(x => x.id),
    // Replaying frozen probes measures artifact behavior, never new experience
    // supplied to A or an extra simulated compute charged to B.
    isolated_mean: call(item.adapter, 'project', [fresh.job, fresh.entry.raw]),
    history_left_action: call(item.adapter, 'plan', [h.next_job, h.left.before]).action,
    history_right_action: call(item.adapter, 'plan', [h.next_job, h.right.before]).action,
  }));
  const last = history.at(-1), directory = path.join(armPath(root, arm), 'B');
  const ledger = read(path.join(directory, 'ledger.json'));
  assert.deepEqual(readdirSync(path.join(directory, 'results')).sort(), fixture.b_jobs.map(job => `${job.id}.json`).sort());
  const results = fixture.b_jobs.map(job => read(path.join(directory, 'results', `${job.id}.json`)));
  const receipt = read(path.join(directory, 'receipt.json'));
  assert.equal(receipt.manifest_sha256, sha(manifest)); assert.equal(receipt.revision_sha256, sha(last));
  assert.deepEqual(read(path.join(directory, 'started.json')), { manifest_sha256: sha(manifest), revision_sha256: sha(last) });
  assert.equal(receipt.results_sha256, sha(results)); assert.equal(receipt.ledger_sha256, sha(ledger));
  for (const [key, value] of Object.entries(identities(last.adapter))) assert.equal(receipt[key], value);
  const batch = checkBatch(fixture, ledger, results);
  assert.equal(receipt.simulated_units, batch.simulated_units);
  const telemetryCount = call(last.adapter, 'countExecutions', [delivery.state.deliveries]);
  assert.equal(receipt.telemetry_execution_count, telemetryCount);
  const changes = history.slice(1).map((item, index) => ({ observation: observations[index].id,
    causal_changed: item.causal_sha256 !== history[index].causal_sha256,
    telemetry_changed: item.telemetry_sha256 !== history[index].telemetry_sha256,
    notes_bytes: Buffer.byteLength(JSON.stringify(item.notes)) }));
  return { ...batch, telemetry_correct: telemetryCount === 1, revisions: changes,
    unnecessary_causal_revisions_on_delivery: Number(changes.at(-1).causal_changed), diagnoses,
    original_observations_preserved: true, results_sha256: sha(results), ledger_sha256: sha(ledger),
    revision_sha256: sha(last), measured_check_ms: performance.now() - start,
    evidence_kind: last.evidence_kind, live_model_comparison: 'NOT_RUN',
    independent_check_scope: 'Separate arithmetic/oracle and ledger replay; same developer, no independent human or blind model evaluation.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = check(path.resolve(process.argv[2]), process.argv[3]);
    console.log(JSON.stringify(result, null, 2));
    if (!result.success || !result.telemetry_correct) process.exitCode = 1;
  }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
