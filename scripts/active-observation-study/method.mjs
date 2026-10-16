// Supplied deterministic hypothesis language; only executed observations update it.
import { createHash } from 'node:crypto';
export const digest = x => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex');
export const initial = () => ({ schema: 'processing-method.v1', scope: null, conditions: {}, evidence: [], revisions: [] });

export function update(previous, observation) {
  const model = structuredClone(previous);
  if (!observation || !['complete', 'unsupported'].includes(observation.status) || observation.method !== 'fast') return model;
  if (!/^[a-f0-9]{64}$/u.test(observation.event_id ?? '') || !/^[a-f0-9]{64}$/u.test(observation.tool_scope ?? '') ||
      !['utf8', 'utf16le'].includes(observation.encoding) || !Number.isFinite(observation.occurred_at) ||
      observation.observed_at < observation.occurred_at) throw new Error('invalid_experience');
  if (model.scope && model.scope !== observation.tool_scope) return model; // no cross-tool extrapolation
  if (model.evidence.includes(observation.event_id)) return model;
  const before = digest(model.conditions);
  model.scope = observation.tool_scope;
  const condition = model.conditions[observation.encoding] ?? [];
  if (!condition.includes(observation.status)) condition.push(observation.status);
  model.conditions[observation.encoding] = condition.sort();
  model.evidence.push(observation.event_id);
  model.revisions.push({ event_id: observation.event_id, occurred_at: observation.occurred_at,
    observed_at: observation.observed_at, before, after: digest(model.conditions), changed: before !== digest(model.conditions) });
  return model;
}

export function support(model, view, job) {
  if (model.scope !== view.tool_scope) return 'unknown';
  const values = model.conditions[job.encoding] ?? [];
  return values.length !== 1 ? 'unknown' : values[0];
}

// Forecasts depend on evidence and condition. Goals/deadlines enter selection only.
export function alternatives(model, view) {
  const options = [];
  for (const job of view.jobs) {
    if (job.observed?.status === 'complete') continue;
    if (job.observed?.status === 'invalid' && job.observed.method === 'robust') continue;
    const learned = support(model, view, job);
    if (!job.operation || ['unsupported', 'invalid'].includes(job.observed?.status)) {
      if (learned !== 'unsupported' && job.observed?.status !== 'invalid')
        options.push({ action: 'fast', work_id: job.id, cost: view.costs.fast,
          forecast: learned === 'complete' ? ['complete'] : ['complete', 'unsupported'], useful: 1 });
      options.push({ action: 'robust', work_id: job.id, cost: view.costs.robust, forecast: ['complete_or_invalid'], useful: 1 });
    } else {
      const age = view.now - job.operation.started_at;
      const delivery = learned === 'unsupported' ? view.timing.unsupported_delivery : view.timing.success_delivery;
      if (age >= delivery) options.push({ action: 'status', work_id: job.id, cost: view.costs.status,
        forecast: learned === 'unknown' ? ['complete', 'pending', 'unsupported'] : [learned], useful: 1 });
      if (learned === 'unknown' && age >= view.timing.unsupported)
        options.push({ action: 'diagnose', work_id: job.id, cost: view.costs.diagnose,
          forecast: ['complete', 'pending', 'unsupported'], useful: 1 });
      const ticks = Math.max(1, delivery - age);
      options.push({ action: 'wait', ticks, cost: ticks, forecast: ['time_advanced'], useful: 0 });
    }
  }
  return options;
}

export function choose(model, view) {
  if (view.jobs.every(j => j.observed?.status === 'complete')) return { action: 'finish' };
  const options = alternatives(model, view).filter(x => x.cost + view.costs.finish <= view.remaining);
  // Productive cheap work can advance both the task and the simulated clock.
  // Diagnosis beats waiting when it can resolve a conditional incompatibility
  // sooner. Stable sort preserves public input order, never scenario names.
  options.sort((a, b) => (a.cost + (a.action === 'wait' ? 1 : 0)) - (b.cost + (b.action === 'wait' ? 1 : 0)));
  const chosen = options[0];
  return chosen ? Object.fromEntries(Object.entries(chosen).filter(([k]) => ['action', 'work_id', 'ticks'].includes(k))) : { action: 'finish' };
}
