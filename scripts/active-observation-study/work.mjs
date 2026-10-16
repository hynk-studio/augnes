// Consumer-owned executable. Adapter request/response is the only environment path.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { initial, update, digest, choose, alternatives } from './method.mjs';
import { choose as reference } from './reference.mjs';

const mode = process.argv[2], policy = process.argv[3] ?? 'candidate';
const config = JSON.parse(readFileSync('connection.json', 'utf8'));
const request = value => JSON.parse(execFileSync(process.execPath, [config.endpoint, config.state, JSON.stringify(value)],
  { encoding: 'utf8', timeout: 5000, maxBuffer: 2 * 1024 * 1024 }));
mkdirSync('output', { recursive: true }); mkdirSync('output/method-versions', { recursive: true });
mkdirSync('output/source-versions', { recursive: true });
const write = (name, value) => writeFileSync(name, JSON.stringify(value, null, 2) + '\n');
let model = existsSync('output/model.json') ? JSON.parse(readFileSync('output/model.json')) :
  existsSync('retained/model.json') ? JSON.parse(readFileSync('retained/model.json')) : initial();
const methodFile = policy === 'reference' ? './reference.mjs' : './method.mjs';
const methodSource = readFileSync(new URL(methodFile, import.meta.url), 'utf8');
const updateSource = readFileSync(new URL('./method.mjs', import.meta.url), 'utf8');
const methodSha = digest([methodSource, updateSource]);
for (const source of [methodSource, updateSource]) {
  const target = `output/source-versions/${digest(source)}.mjs`;
  if (!existsSync(target)) writeFileSync(target, source, { flag: 'wx', mode: 0o600 });
}
const decide = policy === 'reference' ? reference : choose;
let view = request({ action: 'view' }).view;
if (mode === 'view') console.log(JSON.stringify({ view, model }));
else if (mode === 'suggest') console.log(JSON.stringify({ action: decide(model, view), options: alternatives(model, view), model }));
else if (['act', 'run'].includes(mode)) {
  const start = { model_sha256: digest(model), method_sha256: methodSha, task_id: view.task.id,
    retained_loaded: existsSync('retained/model.json'), at: new Date().toISOString() };
  if (!existsSync('output/start.json')) write('output/start.json', start);
  for (let n = 0; n < (mode === 'run' ? 64 : 1) && !view.finished; n++) {
    const action = mode === 'act' ? JSON.parse(process.argv[4]) : decide(model, view);
    const basis = { model_sha256: digest(model), method_sha256: methodSha };
    const before = model;
    const result = request({ ...action, ...basis });
    model = update(model, result.entry.observation); view = result.view;
    const version = `output/method-versions/${view.actions_used}.json`;
    if (existsSync(version)) throw new Error('method_version_exists');
    write(version, { before, after: model, action, observation: result.entry.observation, ...basis });
    write('output/model.json', model); write('output/observations.json', view.history);
    if (result.report) {
      write('output/report.json', result.report);
      writeFileSync('output/report.md', `# ${view.task.title}\n\n${result.report.complete ? 'Complete' : 'Incomplete'}: ${result.report.rows.length}/${view.jobs.length} files.\n\nTotal: ${result.report.total_cents} cents. Simulated cost: ${result.report.simulated_cost}/${view.task.budget}.\n\n` +
        result.report.groups.map(g => `${g.group}: ${g.subtotal_cents} cents; exceeds limit: ${g.exceeds_limit ?? 'UNKNOWN'}; missing: ${g.missing.join(', ') || 'none'}.`).join('\n') + '\n');
      write('output/results.json', view.jobs.filter(j => j.observed?.status === 'complete').map(j => j.observed));
    }
    console.log(JSON.stringify({ action, observation: result.entry.observation, refusal: result.entry.refusal,
      now: view.now, model_changed: digest(before) !== digest(model), complete: result.report?.complete ?? null }));
  }
} else throw new Error('use_view_suggest_act_or_run');
