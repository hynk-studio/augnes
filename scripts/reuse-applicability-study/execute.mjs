import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { call } from '../hypothesis-cache-study/io.mjs';
import { plan, observeRaw, transform, toolObservation } from './model.mjs';
import { validPrior } from './oracle.mjs';
import { fresh, json, save, sha } from './files.mjs';

export function execute(inputs, methodFile, output) {
  const started = performance.now(), task = json(inputs, 'task.json');
  if (task.schema !== 'meter-report.v1' || !Array.isArray(task.jobs) || task.jobs.length > 32 ||
      new Set(task.jobs.map(x => x.work_id)).size !== task.jobs.length) throw new Error('invalid_task');
  for (const job of task.jobs) {
    if (JSON.stringify(toolObservation(job.current.tool.version)) !== JSON.stringify(job.current.tool) ||
        !['total', 'peak'].includes(job.current.request.metric) || !['mWh', 'uWh'].includes(job.current.request.unit) ||
        typeof job.can_compute !== 'boolean' || !Number.isFinite(job.limit) ||
        !Array.isArray(job.priors) || job.priors.length > 16 || new Set(job.priors.map(x => x.id)).size !== job.priors.length ||
        job.priors.some(x => !['known', 'unread', 'unavailable'].includes(x.observation.status))) throw new Error('invalid_task_observation');
  }
  for (const group of task.rollups ?? []) if (!Array.isArray(group.work_ids) || !group.work_ids.length ||
      new Set(group.work_ids).size !== group.work_ids.length || !Number.isFinite(group.budget_mWh) ||
      group.work_ids.some(id => !task.jobs.some(x => x.work_id === id))) throw new Error('invalid_rollup');
  const source = readFileSync(methodFile, 'utf8');
  if (Buffer.byteLength(source) > 32768) throw new Error('method_budget_exceeded');
  const program = methodFile.endsWith('.json') ? JSON.parse(source) : null;
  const decide = view => program ? plan(program, view) : call(source, 'plan', [view], 200);
  fresh(output); mkdirSync(path.join(output, 'results'));
  save(path.join(output, 'task.json'), task);
  writeFileSync(path.join(output, program ? 'method.json' : 'method.cjs'), source, { flag: 'wx', mode: 0o600 });
  const ledger = { task_id: task.task_id, method_sha256: sha(source), steps: [], deliveries: [] };
  const completed = new Map();
  try {
    for (const job of task.jobs) {
      if (!/^[a-zA-Z0-9_-]{1,80}$/u.test(job.work_id) || !Number.isSafeInteger(job.delivery_count) ||
          job.delivery_count < 1 || job.delivery_count > 3) throw new Error('invalid_work_identity');
      const priors = job.priors.map(p => ({ id: p.id, observation: p.observation.status === 'known' ?
        { status: 'known', value: json(inputs, p.observation.reference) } : structuredClone(p.observation) }));
      const view = { work_id: job.work_id, current: job.current, priors, can_compute: job.can_compute };
      const step = { work_id: job.work_id, decisions: [], observations: [], checker_refusal: null, fallback: null,
        delivery_count: job.delivery_count, result: null };
      ledger.steps.push(step);
      let decision;
      for (let count = 0; count <= priors.length; count++) {
        decision = decide(structuredClone(view)); step.decisions.push(decision);
        if (decision?.action !== 'observe') break;
        const prior = priors.find(x => x.id === decision.result_id);
        if (!prior || prior.observation.status !== 'unread' || decision.reference !== prior.observation.reference)
          throw new Error('invalid_observation_request');
        const observed = json(inputs, decision.reference);
        step.observations.push({ result_id: prior.id, reference: decision.reference, sha256: sha(observed) });
        prior.observation = { status: 'known', value: observed };
      }
      step.decision = decision;
      let value, sourceRef;
      if (decision?.action === 'reuse') {
        const prior = job.priors.find(p => p.id === decision.result_id);
        const observed = priors.find(p => p.id === decision.result_id)?.observation;
        if (!prior || observed?.status !== 'known' || !validPrior(observed.value, job.current)) {
          step.checker_refusal = 'prior_not_valid_for_request';
        } else {
          const retained = json(inputs, prior.result_file);
          if (sha(retained) !== prior.result_sha256 || retained.id !== prior.id) step.checker_refusal = 'prior_bytes_or_identity_changed';
          else { value = retained.value; sourceRef = { action: 'reuse', result_id: prior.id }; }
        }
      } else if (!['recompute', 'incomplete'].includes(decision?.action)) throw new Error('invalid_action');
      if (decision.action === 'recompute' && decision.work_id !== job.work_id) throw new Error('recompute_work_mismatch');
      if (decision.action === 'incomplete' && (typeof decision.reason !== 'string' || !decision.reason)) throw new Error('incomplete_reason_missing');
      if ((decision.action === 'recompute' || step.checker_refusal) && job.can_compute) {
        const raw = json(inputs, job.input_file);
        if (JSON.stringify(observeRaw(raw)) !== JSON.stringify(job.current)) throw new Error('current_observation_changed');
        value = transform(raw); sourceRef = { action: 'recompute', input_file: job.input_file };
        if (step.checker_refusal) step.fallback = 'recompute';
      } else if (step.checker_refusal) step.fallback = 'incomplete';
      if (value) {
        const result = { id: sha([task.task_id, job.work_id, job.current, sourceRef]), work_id: job.work_id, value, source: sourceRef };
        const relative = `${job.work_id}.json`; save(path.join(output, 'results', relative), result);
        step.result = { file: relative, sha256: sha(result) }; completed.set(job.work_id, result);
        for (let i = 0; i < job.delivery_count; i++) ledger.deliveries.push(result.id);
      }
    }
    const rows = [...completed.values()].map(result => ({ work_id: result.work_id, result_id: result.id,
      value: result.value.value, unit: result.value.unit,
      exceeds_limit: result.value.value > task.jobs.find(x => x.work_id === result.work_id).limit }));
    const missing = task.jobs.filter(x => !completed.has(x.work_id)).map(x => x.work_id);
    const rollups = (task.rollups ?? []).map(group => {
      const values = group.work_ids.map(id => completed.get(id));
      const missingWork = group.work_ids.filter(id => !completed.has(id));
      const measured = values.filter(Boolean).reduce((sum, x) => sum + x.value.value / (x.value.unit === 'uWh' ? 1000 : 1), 0);
      return { id: group.id, complete: missingWork.length === 0, missing: missingWork,
        subtotal_mWh: measured, exceeds_budget: missingWork.length ? null : measured > group.budget_mWh };
    });
    const report = { title: task.title, complete: missing.length === 0, completed_work: completed.size,
      unique_results: new Set(ledger.deliveries).size, rows, missing, rollups };
    save(path.join(output, 'report.json'), report);
    writeFileSync(path.join(output, 'report.md'), `# ${task.title}\n\nStatus: ${report.complete ? 'complete' : 'incomplete'} (${completed.size}/${task.jobs.length}).\n\n` +
      '| Work | Value | Limit exceeded |\n|---|---:|---|\n' + rows.map(row => `| ${row.work_id} | ${row.value} ${row.unit} | ${row.exceeds_limit} |`).join('\n') +
      `\n\nMissing: ${missing.join(', ') || 'none'}.\n\n` +
      rollups.map(group => `${group.id}: ${group.subtotal_mWh} mWh; ${group.complete ? `exceeds budget: ${group.exceeds_budget}` : `incomplete, missing ${group.missing.join(', ')}`}.`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
    return report;
  } catch (error) {
    save(path.join(output, 'failure.json'), { error: error.message }); throw error;
  } finally {
    ledger.elapsed_ms = performance.now() - started;
    save(path.join(output, 'ledger.json'), ledger);
  }
}
