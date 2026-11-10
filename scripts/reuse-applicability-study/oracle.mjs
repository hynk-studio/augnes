// Independent contract/arithmetic implementation. Never imports the learner, plan,
// production transform or its feature builder. Shared authorship is disclosed.
import { read, sha } from '../hypothesis-cache-study/io.mjs';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

export function expected(raw) {
  let total = 0, peak = -Infinity;
  for (const reading of raw.input.readings) {
    const value = (raw.tool.version === 'meter-2' && reading < 0 ? 0 : reading) * raw.dependency.multiplier;
    total += value; if (value > peak) peak = value;
  }
  return { value: (raw.request.metric === 'peak' ? peak : total) * (raw.request.unit === 'uWh' ? 1000 : 1), unit: raw.request.unit };
}

export function validPrior(before, now) {
  if (!before || !now) return false;
  if (![before.tool.version, now.tool.version].every(x => ['meter-1', 'meter-1.1', 'meter-2'].includes(x))) return false;
  return before.input.entity === now.input.entity &&
    before.input.readings_sha256 === now.input.readings_sha256 &&
    before.dependency.multiplier === now.dependency.multiplier &&
    (before.tool.version === 'meter-2') === (now.tool.version === 'meter-2') &&
    before.request.metric === now.request.metric && before.request.unit === now.request.unit;
}

export function check(root, inputs) {
  const contract = read(path.join(root, 'task.json')), ledger = read(path.join(root, 'ledger.json'));
  const report = read(path.join(root, 'report.json'));
  const truths = read(path.join(inputs, 'evaluator.json'));
  const errors = [], obligations = new Map(contract.jobs.map(x => [x.work_id, x]));
  if (sha(contract) !== sha(read(path.join(inputs, 'task.json')))) errors.push('task_binding_changed');
  const methodFile = path.join(root, existsSync(path.join(root, 'method.json')) ? 'method.json' : 'method.cjs');
  if (sha(readFileSync(methodFile)) !== ledger.method_sha256) errors.push('method_binding_changed');
  const delivered = new Map(), sources = new Set(), contentHashes = new Map();
  let rawUnsafe = 0, refusals = 0, reused = 0, computed = 0, unnecessary = 0;
  for (const step of ledger.steps) {
    const job = obligations.get(step.work_id);
    if (!job) { errors.push('unknown_work'); continue; }
    if (JSON.stringify(step.decisions.at(-1)) !== JSON.stringify(step.decision)) errors.push('original_decision_changed');
    for (const observation of step.observations ?? []) {
      const requested = job.priors.find(x => x.id === observation.result_id);
      if (!requested || requested.observation.status !== 'unread' || requested.observation.reference !== observation.reference ||
          sha(read(path.join(inputs, observation.reference))) !== observation.sha256) errors.push('observation_record');
    }
    const prior = step.decision.action === 'reuse' ? job.priors.find(x => x.id === step.decision.result_id) : null;
    const provenance = prior && prior.observation.status !== 'unavailable' ? read(path.join(inputs, prior.observation.reference)) : null;
    const priorValue = prior ? read(path.join(inputs, prior.result_file)).value : null;
    const checkedPrior = prior && provenance && validPrior(provenance, job.current) &&
      JSON.stringify(priorValue) === JSON.stringify(expected(truths[job.work_id]));
    if (step.decision.action === 'reuse' && !checkedPrior) rawUnsafe++;
    if (step.checker_refusal) refusals++;
    if (!step.result) continue;
    const result = read(path.join(root, 'results', step.result.file));
    if (sha(result) !== step.result.sha256) errors.push('result_bytes_changed');
    if (result.work_id !== job.work_id || JSON.stringify(result.value) !== JSON.stringify(expected(truths[job.work_id])))
      errors.push('invalid_current_result');
    if (result.source.action === 'reuse') {
      reused++;
      if (!checkedPrior || result.source.result_id !== prior?.id) errors.push('invalid_prior_accepted');
    } else if (result.source.action === 'recompute') {
      computed++;
      if (!job.can_compute) errors.push('unavailable_compute');
      if (job.priors.some(p => p.observation.status !== 'unavailable' &&
          validPrior(read(path.join(inputs, p.observation.reference)), job.current) &&
          JSON.stringify(read(path.join(inputs, p.result_file)).value) === JSON.stringify(expected(truths[job.work_id])))) unnecessary++;
    } else errors.push('unknown_result_source');
    if (result.id !== sha([contract.task_id, job.work_id, job.current, result.source])) errors.push('result_identity');
    if (delivered.has(job.work_id) && delivered.get(job.work_id).id !== result.id) errors.push('duplicate_work_disagrees');
    delivered.set(job.work_id, result); sources.add(result.id);
    const hash = sha(result.value); contentHashes.set(hash, (contentHashes.get(hash) ?? 0) + 1);
  }
  const rows = [...delivered.values()].map(result => ({ work_id: result.work_id, result_id: result.id,
    value: result.value.value, unit: result.value.unit,
    exceeds_limit: result.value.value > obligations.get(result.work_id).limit }));
  if (JSON.stringify(report.rows) !== JSON.stringify(rows)) errors.push('report_rows');
  const missing = [...obligations.keys()].filter(id => !delivered.has(id));
  if (JSON.stringify(report.missing) !== JSON.stringify(missing)) errors.push('missing_inventory');
  if (report.complete !== (missing.length === 0) || report.completed_work !== delivered.size) errors.push('false_completeness');
  if (report.unique_results !== sources.size) errors.push('delivery_identity_count');
  if (ledger.deliveries.some(id => !sources.has(id))) errors.push('unknown_delivery');
  if (ledger.deliveries.length !== ledger.steps.filter(x => x.result).reduce((n, x) => n + x.delivery_count, 0)) errors.push('delivery_count');
  const rollups = [];
  for (const group of contract.rollups ?? []) {
    let sum = 0; const absent = [];
    for (const id of group.work_ids) {
      if (!delivered.has(id)) { absent.push(id); continue; }
      const result = expected(truths[id]); sum += result.unit === 'uWh' ? result.value / 1000 : result.value;
    }
    rollups.push({ id: group.id, complete: absent.length === 0, missing: absent,
      subtotal_mWh: sum, exceeds_budget: absent.length ? null : sum > group.budget_mWh });
  }
  if (JSON.stringify(report.rollups) !== JSON.stringify(rollups)) errors.push('rollup_output');
  const markdown = readFileSync(path.join(root, 'report.md'), 'utf8');
  if (!markdown.includes(`Status: ${missing.length ? 'incomplete' : 'complete'} (${delivered.size}/${obligations.size}).`) ||
      !rows.every(row => markdown.includes(`| ${row.work_id} | ${row.value} ${row.unit} | ${row.exceeds_limit} |`)) ||
      !markdown.includes(`Missing: ${missing.join(', ') || 'none'}.`)) errors.push('readable_report_mismatch');
  if (ledger.steps.length !== obligations.size || new Set(ledger.steps.map(x => x.work_id)).size !== obligations.size)
    errors.push('work_step_inventory');
  return { status: errors.length ? 'FAIL' : 'PASS', errors, complete: report.complete, valid_completed: delivered.size,
    required: obligations.size, raw_unsafe_reuses: rawUnsafe, checker_refusals: refusals,
    reuses: reused, recomputations: computed, unnecessary_recomputations: unnecessary,
    deliveries: ledger.deliveries.length, distinct_results: sources.size,
    observation_requests: ledger.steps.reduce((n, step) => n + step.decisions.filter(x => x.action === 'observe').length, 0),
    byte_equal_distinct_results: [...contentHashes.values()].filter(n => n > 1).reduce((a, b) => a + b, 0) };
}
