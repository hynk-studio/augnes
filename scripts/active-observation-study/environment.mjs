// Disposable file-processing environment. Never imported into consumer material.
import { readFileSync, writeFileSync, mkdirSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { file, fresh, json, save, sha } from '../reuse-applicability-study/files.mjs';

export const costs = Object.freeze({ fast: 2, robust: 6, diagnose: 3, status: 1, finish: 1 });
export const timing = Object.freeze({ success: 4, unsupported: 2, success_delivery: 6, unsupported_delivery: 8 });
const idOK = x => typeof x === 'string' && /^[a-z][a-z0-9-]{0,39}$/u.test(x);
const integer = x => Number.isSafeInteger(x) && Math.abs(x) <= 1_000_000;

function decode(bytes, robust) {
  const utf16 = bytes[0] === 255 && bytes[1] === 254;
  if (utf16 && !robust) return { status: 'unsupported', reason: 'input_encoding' };
  let rows;
  try { rows = JSON.parse(utf16 ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8')); }
  catch { return { status: 'invalid', reason: 'invalid_json' }; }
  if (!Array.isArray(rows) || !rows.length || rows.length > 32 || rows.some(r =>
    !r || Object.keys(r).sort().join(',') !== 'cents,units' || !integer(r.cents) || !integer(r.units) || r.units < 0))
    return { status: 'invalid', reason: 'invalid_rows' };
  const value = rows.reduce((n, r) => n + r.cents * r.units, 0);
  if (!Number.isSafeInteger(value)) return { status: 'invalid', reason: 'unsafe_total' };
  return { status: 'complete', cents: value, rows: rows.length };
}

export function initialize(root, contract, inputs) {
  if (contract.schema !== 'processing-task.v1' || !idOK(contract.id) || !['settlement', 'regional'].includes(contract.kind) ||
      !Number.isInteger(contract.budget) || contract.budget < 1 || contract.budget > 200 ||
      !Array.isArray(contract.jobs) || !contract.jobs.length || contract.jobs.length > 16 ||
      new Set(contract.jobs.map(j => j.id)).size !== contract.jobs.length ||
      contract.jobs.some(j => !idOK(j.id) || !idOK(j.group) || !['utf8', 'utf16le'].includes(j.encoding) || typeof j.pending !== 'boolean') ||
      !contract.limits || Object.values(contract.limits).some(x => !integer(x))) throw new Error('invalid_contract');
  fresh(root); mkdirSync(path.join(root, 'inputs')); mkdirSync(path.join(root, 'events')); mkdirSync(path.join(root, 'versions'));
  const scope = sha(readFileSync(new URL('./environment.mjs', import.meta.url)));
  const state = { schema: 'processing-state.v1', contract, scope, now: 0, sequence: 0, finished: false,
    jobs: {}, operations: {}, history: [], known: {}, deliveries: [], refusals: [] };
  for (const job of contract.jobs) {
    const bytes = inputs[job.id];
    if (!Buffer.isBuffer(bytes) || bytes.length > 8192 ||
        (bytes[0] === 255 && bytes[1] === 254 ? 'utf16le' : 'utf8') !== job.encoding) throw new Error('invalid_input');
    writeFileSync(path.join(root, 'inputs', `${job.id}.json`), bytes, { flag: 'wx', mode: 0o600 });
    state.jobs[job.id] = { ...job, input_sha256: sha(bytes), operation: null };
    if (job.pending) issue(root, state, job.id, 'fast', 0);
  }
  save(path.join(root, 'state.json'), state); save(path.join(root, 'versions/0.json'), state);
  return view(state);
}

function issue(root, state, jobId, method, at) {
  const job = state.jobs[jobId];
  const bytes = readFileSync(file(root, `inputs/${jobId}.json`));
  if (sha(bytes) !== job.input_sha256) throw new Error('input_changed');
  const result = decode(bytes, method === 'robust');
  const number = Object.values(state.operations).filter(x => x.job_id === jobId).length;
  const id = sha([state.contract.id, jobId, job.input_sha256, method, number]);
  const occurred = at + (method === 'robust' ? costs.robust : timing[result.status === 'complete' ? 'success' : 'unsupported']);
  const available = at + (method === 'robust' ? costs.robust : timing[result.status === 'complete' ? 'success_delivery' : 'unsupported_delivery']);
  state.operations[id] = { id, job_id: jobId, method, started_at: at, occurred_at: occurred,
    available_at: available, result, materialized: false };
  job.operation = id;
  return state.operations[id];
}

function materialize(root, state) {
  for (const operation of Object.values(state.operations)) if (!operation.materialized && state.now >= operation.occurred_at) {
    const event = { event_id: operation.id, task_id: state.contract.id, work_id: operation.job_id,
      input_sha256: state.jobs[operation.job_id].input_sha256, tool_scope: state.scope,
      encoding: state.jobs[operation.job_id].encoding, method: operation.method,
      occurred_at: operation.occurred_at, available_at: operation.available_at, ...operation.result };
    save(path.join(root, 'events', `${operation.id}.json`), event);
    operation.materialized = true;
  }
}

function observe(root, state, operation, diagnostic) {
  const visible = state.now >= (diagnostic ? operation.occurred_at : operation.available_at);
  if (!visible) return { status: 'pending', event_id: operation.id, work_id: operation.job_id,
    method: operation.method, started_at: operation.started_at, observed_at: state.now,
    source: diagnostic ? 'execution_diagnostic' : 'delivery_status' };
  const event = json(root, `events/${operation.id}.json`);
  const observation = { ...event, observed_at: state.now, source: diagnostic ? 'execution_diagnostic' : 'delivery_status' };
  state.known[operation.job_id] = observation;
  state.deliveries.push(event.event_id);
  return observation;
}

export function view(state) {
  return { schema: 'processing-view.v1', task: state.contract, tool_scope: state.scope,
    now: state.now, remaining: state.contract.budget - state.now, finished: state.finished,
    costs, timing, max_actions: 64, actions_used: state.sequence,
    jobs: Object.values(state.jobs).map(j => ({ id: j.id, group: j.group, encoding: j.encoding,
      input_sha256: j.input_sha256, operation: j.operation ? { id: j.operation, method: state.operations[j.operation].method,
        started_at: state.operations[j.operation].started_at } : null,
      observed: state.known[j.id] ?? null })), history: state.history };
}

function report(state) {
  const rows = Object.values(state.known).filter(x => x.status === 'complete').map(x => ({ work_id: x.work_id,
    result_id: x.event_id, input_sha256: x.input_sha256, cents: x.cents, group: state.jobs[x.work_id].group }));
  const missing = Object.keys(state.jobs).filter(id => !rows.some(x => x.work_id === id));
  const groups = Object.keys(state.contract.limits).map(group => {
    const groupMissing = missing.filter(id => state.jobs[id].group === group);
    const subtotal = rows.filter(x => x.group === group).reduce((n, x) => n + x.cents, 0);
    return { group, subtotal_cents: subtotal, missing: groupMissing,
      exceeds_limit: groupMissing.length ? null : subtotal > state.contract.limits[group] };
  });
  return { task_id: state.contract.id, kind: state.contract.kind, complete: missing.length === 0, rows, missing,
    total_cents: rows.reduce((n, x) => n + x.cents, 0), groups, simulated_cost: state.now,
    delivery_count: state.deliveries.length, distinct_observations: new Set(state.deliveries).size };
}

export function act(root, request) {
  const lock = path.join(root, 'action.lock');
  const fd = openSync(lock, 'wx', 0o600);
  try {
    const state = json(root, 'state.json'), before = structuredClone(view(state));
    if (state.finished) throw new Error('task_finished');
    const validAction = ['fast', 'robust', 'status', 'diagnose', 'wait', 'finish'].includes(request?.action);
    if (!validAction || state.sequence >= 64) throw new Error('invalid_action_or_limit');
    const job = state.jobs[request.work_id];
    if (!['wait', 'finish'].includes(request.action) && !job) throw new Error('unknown_work');
    const charge = request.action === 'wait' ? request.ticks : costs[request.action];
    if (!Number.isInteger(charge) || charge < 1 || charge > 16) throw new Error('invalid_cost');
    if (state.now + charge > state.contract.budget) throw new Error('task_budget_exhausted');
    let refusal = null, operation = job?.operation && state.operations[job.operation];
    if (['fast', 'robust'].includes(request.action) && operation &&
        !['unsupported', 'invalid'].includes(state.known[job.id]?.status)) refusal = 'reconcile_before_reissue';
    if (['status', 'diagnose'].includes(request.action) && !operation) refusal = 'no_operation';
    state.now += charge; state.sequence++;
    let observation = null;
    if (!refusal && ['fast', 'robust'].includes(request.action)) operation = issue(root, state, job.id, request.action, before.now);
    materialize(root, state);
    if (refusal) state.refusals.push({ at: state.now, request, reason: refusal });
    else if (['fast', 'robust', 'status', 'diagnose'].includes(request.action))
      observation = observe(root, state, operation, request.action === 'diagnose');
    else if (request.action === 'finish') state.finished = true;
    const entry = { sequence: state.sequence, requested: request, basis: { time: before.now,
      view_sha256: sha(before), model_sha256: request.model_sha256 ?? null, method_sha256: request.method_sha256 ?? null },
      cost: charge, observation, refusal };
    state.history.push(entry);
    save(path.join(root, 'versions', `${state.sequence}.json`), state);
    writeFileSync(path.join(root, 'next-state.json'), JSON.stringify(state, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    renameSync(path.join(root, 'next-state.json'), path.join(root, 'state.json'));
    return { entry, view: view(state), report: state.finished ? report(state) : null };
  } finally { closeSync(fd); unlinkSync(lock); }
}

export function current(root) { return view(json(root, 'state.json')); }

// A command boundary, not a model launcher. Consumer access is limited by the
// declared protocol, not hostile same-user filesystem isolation.
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    const [root, command] = process.argv.slice(2);
    const request = JSON.parse(command);
    console.log(JSON.stringify(request.action === 'view' ? { view: current(root) } : act(root, request)));
  } catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
}
