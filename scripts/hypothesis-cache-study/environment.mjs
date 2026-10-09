import assert from 'node:assert/strict';
import { call } from './io.mjs';

// Simulator truth, outside the worker-owned adapter. Cache keys deliberately
// carry no built-in correctness promise: applicability belongs to the caller.
export function environment(fixture) {
  let sequence = 0;
  const entries = new Map(), executions = [], deliveries = [];
  const inspect = () => structuredClone({
    surface: { status: 'idle', cache_slots: entries.size },
    entries: [...entries.values()], executions, deliveries,
  });
  function compute(job, key) {
    assert(typeof key === 'string' && key.length > 0 && key.length <= 512, 'cache_key_invalid');
    assert(Object.hasOwn(fixture.spec.factors, job.toolchain), 'unknown_toolchain');
    const raw = job.values.reduce((sum, value) => sum + value, 0) * fixture.spec.factors[job.toolchain];
    const entry = { id: `execution-${++sequence}`, key, job: structuredClone(job), raw };
    executions.push(structuredClone(entry)); entries.set(key, entry);
    deliveries.push({ event_id: `event-${sequence}`, execution_id: entry.id, raw });
    return structuredClone(entry);
  }
  function reuse(id) {
    const entry = [...entries.values()].find(item => item.id === id);
    assert(entry, 'cache_entry_missing');
    return structuredClone(entry);
  }
  return { inspect, compute, reuse, reset: () => entries.clear(),
    duplicateDelivery() { assert(deliveries.length); deliveries.push(structuredClone(deliveries.at(-1))); } };
}

export function observe(fixture, seed) {
  const d = fixture.development;
  const fresh = environment(fixture), isolated = fresh.compute(d.implementation, 'isolated');
  const group = environment(fixture), old = group.compute(d.group_old, 'shared');
  const reusedInput = group.reuse(old.id);
  const isolatedInput = group.compute(d.group_new, 'isolated-input');
  const reusedVersion = group.reuse(isolatedInput.id);
  const isolatedVersion = group.compute(d.version_new, 'isolated-version');
  const pastOld = environment(fixture), pastNew = environment(fixture);
  const historyOld = pastOld.compute(d.group_old, 'shared');
  const historyNew = pastNew.compute(d.version_new, 'shared');
  const telemetry = environment(fixture), actual = telemetry.compute(d.telemetry, 'delivery');
  telemetry.duplicateDelivery();
  return [
    { id: 'symptom', job: d.implementation, output: call(seed, 'project', [d.implementation, isolated.raw]),
      required: fixture.development_reference.implementation, interpretation: null,
      availability: 'Output anomaly first; the next fixed observation supplies isolated raw execution details.' },
    { id: 'fresh', job: d.implementation, entry: isolated, state: fresh.inspect(),
      output: call(seed, 'project', [d.implementation, isolated.raw]), required: fixture.development_reference.implementation },
    { id: 'grouping', state: group.inspect(), trials: [
      { job: d.group_new, reused: reusedInput, isolated: isolatedInput, required: fixture.development_reference.group_new },
      { job: d.version_new, reused: reusedVersion, isolated: isolatedVersion, required: fixture.development_reference.version_new },
    ] },
    { id: 'history', next_job: d.version_new,
      left: { before: pastOld.inspect(), next: pastOld.reuse(historyOld.id) },
      right: { before: pastNew.inspect(), next: pastNew.reuse(historyNew.id) },
      availability: 'Both full normal inspections are supplied, including producer inputs, versions and all history. Only the shallow dashboards match.' },
    { id: 'delivery', job: d.telemetry, actual, state: telemetry.inspect(),
      starter_count: call(seed, 'countExecutions', [telemetry.inspect().deliveries]) },
  ];
}

export function executeBatch(fixture, adapter) {
  const env = environment(fixture);
  for (const job of fixture.b_seed) env.compute(job, job.name);
  const initial = env.inspect(), actions = [], results = [];
  const charge = (job, action, fields = {}) => actions.push({
    index: actions.length, job_id: job.id, action, units: fixture.simulated_costs[action], ...fields,
  });
  try {
    for (const job of fixture.b_jobs) {
      const view = env.inspect(); charge(job, 'inspect', { view });
      const decision = call(adapter, 'plan', [job, view], fixture.limits.call_timeout_ms);
      assert(['reuse', 'compute', 'reset-compute', 'refuse'].includes(decision?.action), 'action_invalid');
      let entry;
      if (decision.action === 'refuse') {
        charge(job, 'refuse', { reason: String(decision.reason ?? '') });
        results.push({ job_id: job.id, status: 'refused' }); continue;
      }
      if (decision.action === 'reset-compute') { env.reset(); charge(job, 'reset'); }
      if (decision.action === 'reuse') {
        entry = env.reuse(decision.entry_id); charge(job, 'reuse', { entry });
      } else {
        entry = env.compute(job, decision.key); charge(job, 'compute', { entry });
      }
      const value = call(adapter, 'project', [job, entry.raw], fixture.limits.call_timeout_ms);
      assert(typeof value === 'number' && Number.isFinite(value), 'result_not_finite');
      results.push({ job_id: job.id, status: 'completed', value, execution_id: entry.id,
        action_index: actions.length - 1 });
    }
  } catch (error) {
    error.partial = { initial, actions, results, final: env.inspect() };
    throw error;
  }
  return { initial, actions, results, final: env.inspect() };
}
