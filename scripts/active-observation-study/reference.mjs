// Ordinary adaptive memo/code. Same experience updater and available utilities.
import { support } from './method.mjs';
export function choose(model, view) {
  const unfinished = view.jobs.filter(j => j.observed?.status !== 'complete');
  if (!unfinished.length) return { action: 'finish' };
  const fresh = unfinished.filter(j => (!j.operation || ['unsupported', 'invalid'].includes(j.observed?.status)) &&
    !(j.observed?.status === 'invalid' && j.observed.method === 'robust'));
  const cheap = fresh.find(j => support(model, view, j) !== 'unsupported' && j.observed?.status !== 'invalid');
  if (cheap && view.remaining >= view.costs.fast + 1) return { action: 'fast', work_id: cheap.id };
  for (const j of unfinished.filter(j => j.operation && !['unsupported', 'invalid'].includes(j.observed?.status))) {
    if (view.now - j.operation.started_at >= view.timing.success_delivery && view.remaining >= 2)
      return { action: 'status', work_id: j.id };
    if (support(model, view, j) === 'unknown' && view.now - j.operation.started_at >= view.timing.unsupported && view.remaining >= 4)
      return { action: 'diagnose', work_id: j.id };
  }
  if (fresh.length && view.remaining >= view.costs.robust + 1) return { action: 'robust', work_id: fresh[0].id };
  const pending = unfinished.filter(j => j.operation && !['unsupported', 'invalid'].includes(j.observed?.status));
  if (pending.length) {
    const ticks = Math.max(1, Math.min(...pending.map(j => j.operation.started_at + view.timing.success_delivery - view.now)));
    if (ticks + 1 <= view.remaining) return { action: 'wait', ticks };
  }
  return { action: 'finish' };
}
