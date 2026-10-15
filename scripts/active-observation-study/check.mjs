// Independent arithmetic/completeness checker; not a source of action feedback.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { json, sha } from '../reuse-applicability-study/files.mjs';
export function check(root, output) {
  const state = json(root, 'state.json'), report = json(output, 'report.json');
  const events = json(output, 'results.json');
  const errors = [], expected = {};
  for (const job of state.contract.jobs) {
    const bytes = readFileSync(path.join(root, 'inputs', `${job.id}.json`));
    try {
      const raw = bytes[0] === 255 && bytes[1] === 254 ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8');
      const rows = JSON.parse(raw);
      if (!Array.isArray(rows) || !rows.length || rows.some(r => Object.keys(r).sort().join(',') !== 'cents,units' ||
          !Number.isSafeInteger(r.cents) || Math.abs(r.cents) > 1e6 || !Number.isSafeInteger(r.units) || r.units < 0 || r.units > 1e6)) continue;
      expected[job.id] = rows.map(r => BigInt(r.cents) * BigInt(r.units)).reduce((a, b) => a + b, 0n).toString();
    } catch { /* Invalid inputs cannot be completed. */ }
  }
  if (!state.finished || report.task_id !== state.contract.id || report.kind !== state.contract.kind ||
      report.simulated_cost !== state.now || state.now > state.contract.budget) errors.push('task_or_budget');
  const ids = new Set(), resultIds = new Set();
  for (const row of report.rows) {
    const job = state.jobs[row.work_id], known = state.known[row.work_id];
    const event = events.find(x => x.event_id === row.result_id);
    if (ids.has(row.work_id) || resultIds.has(row.result_id) || !job || !known || known.status !== 'complete' ||
        known.event_id !== row.result_id || !event || JSON.stringify(event) !== JSON.stringify(known) ||
        row.input_sha256 !== job.input_sha256 || row.group !== job.group || String(row.cents) !== expected[row.work_id]) errors.push('invalid_result');
    if (known && sha(json(root, `events/${known.event_id}.json`)) !== sha(Object.fromEntries(Object.entries(known).filter(([k]) => !['observed_at', 'source'].includes(k))))) errors.push('event_bytes');
    ids.add(row.work_id); resultIds.add(row.result_id);
  }
  const missing = state.contract.jobs.filter(j => !ids.has(j.id)).map(j => j.id);
  if (JSON.stringify(report.missing) !== JSON.stringify(missing) || report.complete !== (missing.length === 0) ||
      events.length !== ids.size || report.total_cents !== report.rows.reduce((n, r) => n + r.cents, 0)) errors.push('false_completeness');
  if (report.groups.length !== Object.keys(state.contract.limits).length) errors.push('groups');
  for (const group of report.groups) {
    const absent = missing.filter(id => state.jobs[id].group === group.group);
    const sum = report.rows.filter(r => r.group === group.group).reduce((n, r) => n + r.cents, 0);
    if (!(group.group in state.contract.limits) || group.subtotal_cents !== sum || JSON.stringify(group.missing) !== JSON.stringify(absent) ||
        group.exceeds_limit !== (absent.length ? null : sum > state.contract.limits[group.group])) errors.push('invalid_group');
  }
  if (report.delivery_count !== state.deliveries.length || report.distinct_observations !== new Set(state.deliveries).size) errors.push('delivery_identity');
  return { status: errors.length ? 'FAIL' : 'PASS', errors: [...new Set(errors)], complete: report.complete,
    completed: ids.size, required: state.contract.jobs.length, simulated_cost: state.now,
    actions: state.history.map(x => ({ action: x.requested.action, work_id: x.requested.work_id ?? null,
      cost: x.cost, outcome: x.observation?.status ?? null, refusal: x.refusal })),
    distinct_observations: new Set(state.deliveries).size, deliveries: state.deliveries.length,
    refusals: state.refusals.length, clock: 'simulated task-cost units; not production latency' };
}
