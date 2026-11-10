#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { acquire } from './learn.mjs';
import { experience, prepareTask } from './cases.mjs';
import { execute } from './execute.mjs';
import { check } from './oracle.mjs';
import { equalFields } from './model.mjs';
import { fresh, save, read, sha, manifest } from './files.mjs';

export function develop(root) {
  fresh(root); const records = experience(); save(path.join(root, 'experience.json'), records);
  const runs = [];
  for (const arm of ['candidate', 'reference']) {
    const dir = path.join(root, arm); mkdirSync(dir);
    let previous = { schema: 'reuse-equalities.v1', equal: [] }, parent = null;
    save(path.join(dir, 'program-0.json'), previous);
    for (const stage of [1, 2, 3, 4]) {
      const started = performance.now(), exposed = records.filter(x => x.stage <= stage);
      const beforeFailures = exposed.filter(row => previous.equal.every(key => equalFields(row.prior, row.current)[key]) !== row.valid).map(x => x.id);
      const result = acquire(exposed, arm === 'candidate' ? 'contrastive' : 'all');
      const version = { stage, parent_sha256: parent, ...result, previous_program: previous,
        original_failure_ids: beforeFailures, changed: JSON.stringify(previous) !== JSON.stringify(result.program),
        elapsed_ms: performance.now() - started, attribution: 'algorithmic induction; developer-supplied language/selection/records/checker' };
      save(path.join(dir, `version-${stage}.json`), version); save(path.join(dir, `program-${stage}.json`), result.program);
      writeFileSync(path.join(dir, `memo-${stage}.md`), `# Adaptive evidence memo, stage ${stage}\n\nRecords: ${exposed.map(x => x.id).join(', ')}.\n\nPrevious failures: ${beforeFailures.join(', ') || 'none'}.\n\nRequired equal observed fields: ${result.program.equal.join(', ')}.\n\n${version.changed ? 'Revise' : 'Retain'} the method. This is algorithmically populated accounting, not autonomous model learning.\n`, { flag: 'wx' });
      parent = sha(version); previous = result.program;
      runs.push({ arm, stage, changed: version.changed, original_failures: beforeFailures, selected: result.selected_ids.length,
        repair_count: result.repairs.length, elapsed_ms: version.elapsed_ms });
    }
  }
  const inputs = path.join(root, 'development-inputs'); prepareTask(inputs, 'development');
  // Actual original unsafe decisions + shared-checker rescues remain inspectable.
  for (const version of [0, 1, 2, 3, 4]) {
    const output = path.join(root, `candidate-replay-${version}`);
    execute(inputs, path.join(root, 'candidate', `program-${version}.json`), output);
    save(path.join(output, 'check.json'), check(output, inputs));
  }
  save(path.join(root, 'development.json'), { task: '1459-calibration-method-derivation-v1', records: records.length, runs,
    live_model_acquisition: 'NOT_RUN', common_authorship: true });
  return runs;
}

export function freeze(root, candidate, reference) {
  fresh(root);
  const c = readFileSync(candidate), r = readFileSync(reference);
  writeFileSync(path.join(root, candidate.endsWith('.json') ? 'candidate.json' : 'candidate.cjs'), c, { flag: 'wx' });
  writeFileSync(path.join(root, reference.endsWith('.json') ? 'reference.json' : 'reference.cjs'), r, { flag: 'wx' });
  const controls = {
    recompute: 'module.exports.plan = v => v.can_compute ? {action:"recompute",work_id:v.work_id} : {action:"incomplete",reason:"input_unavailable"};\n',
    refuse: 'module.exports.plan = () => ({action:"incomplete",reason:"refuse_control"});\n',
  };
  for (const [name, source] of Object.entries(controls)) writeFileSync(path.join(root, `${name}.cjs`), source, { flag: 'wx' });
  prepareTask(path.join(root, 'complete-inputs'), 'confirmation');
  prepareTask(path.join(root, 'incomplete-inputs'), 'incomplete');
  const contract = { schema: '1459-confirmation.v1', candidate_sha256: sha(c), reference_sha256: sha(r),
    candidate_file: candidate.endsWith('.json') ? 'candidate.json' : 'candidate.cjs',
    reference_file: reference.endsWith('.json') ? 'reference.json' : 'reference.cjs',
    ...Object.fromEntries(Object.entries(controls).flatMap(([name, source]) => [[`${name}_file`, `${name}.cjs`], [`${name}_sha256`, sha(source)]])),
    tasks: ['complete-inputs', 'incomplete-inputs'].map(name => ({ name, files: manifest(path.join(root, name)) })),
    allocation: 'one execution per method per task; no method/data changes or outcome-conditioned retries',
    conditions: ['no invalid prior accepted', 'no false complete report', 'identity distinct from delivery and content'],
    comparison: 'contrastive acquisition versus all-evidence adaptive memo/code; equal observations/source/tools',
    limits: 'constructed and coordinator-exposed; later task is reporting, not derivation; no independent causal/blind claim',
    next_decision_rule: 'prefer simpler reference if valid completion and unnecessary-work counts tie',
    created_at: new Date().toISOString() };
  save(path.join(root, 'confirmation-contract.json'), contract);
  return contract;
}

export function confirm(root, arm, taskName) {
  if (!['candidate', 'reference', 'recompute', 'refuse'].includes(arm)) throw new Error('unknown_arm');
  const contract = read(path.join(root, 'confirmation-contract.json'));
  const task = contract.tasks.find(x => x.name === taskName);
  if (!task || JSON.stringify(manifest(path.join(root, taskName))) !== JSON.stringify(task.files)) throw new Error('confirmation_inputs_changed');
  const method = path.join(root, contract[`${arm}_file`]);
  if (sha(readFileSync(method)) !== contract[`${arm}_sha256`]) throw new Error('confirmation_method_changed');
  const output = path.join(root, `${arm}-${taskName}`);
  const report = execute(path.join(root, taskName), method, output);
  const result = check(output, path.join(root, taskName)); save(path.join(output, 'check.json'), result);
  return { report, check: result };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'develop' && args.length === 1) console.log(JSON.stringify(develop(args[0]), null, 2));
  else if (command === 'freeze' && args.length === 3) console.log(JSON.stringify(freeze(...args), null, 2));
  else if (command === 'run' && args.length === 3) console.log(JSON.stringify(execute(...args), null, 2));
  else if (command === 'confirm' && args.length === 3) {
    const result = confirm(...args); console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.check.status === 'PASS' ? 0 : 1;
  } else if (command === 'check' && args.length === 2) {
    const result = check(...args); console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  }
  else throw new Error('usage: develop DIR | freeze DIR CANDIDATE REFERENCE | confirm DIR ARM TASK | run INPUTS METHOD OUT | check OUT INPUTS');
}
