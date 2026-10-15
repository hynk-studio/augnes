// Constructed cases fixed by the implementing session; never claimed blind/customer work.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { observeRaw, toolObservation, transform } from './model.mjs';
import { expected, validPrior } from './oracle.mjs';
import { fresh, save, sha } from './files.mjs';

export function raw(overrides = {}) {
  return { input: { entity: 'calibration-A', readings: [7, -2, 9], caption: 'bench', ...overrides.input },
    dependency: { multiplier: 2, label: 'calibration', ...overrides.dependency },
    tool: toolObservation(overrides.version ?? 'meter-1'),
    request: { metric: 'total', unit: 'mWh', ...overrides.request },
    report: { title: 'Calibration derivation', threshold: 20, ...overrides.report } };
}

export function experience() {
  const before = raw();
  const variants = [
    ['same', {}, 1],
    ['reading-change', { input: { readings: [7, -1, 9] } }, 1],
    ['caption-only', { input: { caption: 'renamed bench' } }, 1],
    ['multiplier-change', { dependency: { multiplier: 3 } }, 2],
    ['dependency-label-only', { dependency: { label: 'audited' } }, 2],
    ['compatible-release', { version: 'meter-1.1' }, 2],
    ['semantic-release', { version: 'meter-2' }, 2],
    ['peak-request', { request: { metric: 'peak' } }, 2],
    ['distinct-entity', { input: { entity: 'calibration-B' } }, 2],
    ['different-unit', { request: { unit: 'uWh' } }, 3],
    ['report-feedback', { report: { title: 'Safety follow-up', threshold: 500 } }, 4],
  ];
  return variants.map(([id, change, stage]) => {
    const current = raw(change), priorValue = transform(before), currentValue = transform(current);
    if (JSON.stringify(currentValue) !== JSON.stringify(expected(current))) throw new Error('development_transform_mismatch');
    return { id, stage, prior: observeRaw(before), current: observeRaw(current),
      prior_value: priorValue, executed_value: currentValue,
      valid: validPrior(observeRaw(before), observeRaw(current)),
      provenance: 'constructed executions; independent task-contract label; common developer' };
  });
}

export function prepareTask(root, variant = 'confirmation') {
  fresh(root); mkdirSync(path.join(root, 'materials'));
  const b = raw({ input: { entity: 'north', readings: [11, -3, 4], caption: 'north meter' },
    report: { title: 'Service prioritization', threshold: 25 } });
  const change = (base, patch) => ({ ...structuredClone(base), ...patch });
  let current = [
    ['stable-total', b, b, 'known', true, 2, 25],
    ['compatible-total', change(b, { tool: toolObservation('meter-1.1') }), b, 'known', true, 1, 25],
    ['irrelevant-label', change(b, { dependency: { multiplier: 2, label: 'new label' }, input: { ...b.input, caption: 'display change' } }), b, 'known', true, 1, 25],
    ['corrected-reading', change(b, { input: { ...b.input, readings: [11, -2, 4] } }), b, 'known', true, 1, 25],
    ['new-calibration', change(b, { dependency: { multiplier: 3, label: 'new' } }), b, 'known', true, 1, 25],
    ['clamped-release', change(b, { tool: toolObservation('meter-2') }), b, 'known', true, 1, 25],
    ['required-peak', change(b, { request: { metric: 'peak', unit: 'mWh' } }), b, 'known', true, 1, 20],
    ['south-total', change(b, { input: { ...b.input, entity: 'south' } }), change(b, { input: { ...b.input, entity: 'south' } }), 'known', true, 1, 25],
    ['retrieve-provenance', b, b, 'unread', true, 1, 25],
    ['lost-provenance', b, b, 'unavailable', true, 1, 25],
    ['unit-report', change(b, { request: { metric: 'total', unit: 'uWh' } }), b, 'known', true, 1, 25000],
  ];
  if (variant === 'development') {
    current = experience().map(record => {
      const before = raw();
      // Reconstruct the small exposed derivation inputs from executed records.
      const mapping = { 'reading-change': { input: { readings: [7, -1, 9] } },
        'caption-only': { input: { caption: 'renamed bench' } }, 'multiplier-change': { dependency: { multiplier: 3 } },
        'dependency-label-only': { dependency: { label: 'audited' } }, 'compatible-release': { version: 'meter-1.1' },
        'semantic-release': { version: 'meter-2' }, 'peak-request': { request: { metric: 'peak' } },
        'distinct-entity': { input: { entity: 'calibration-B' } }, 'different-unit': { request: { unit: 'uWh' } },
        'report-feedback': { report: { title: 'Safety follow-up', threshold: 500 } } };
      return [record.id, raw(mapping[record.id]), before, 'known', true, 1, 20];
    });
  }
  if (variant === 'incomplete') current.push(['offline-untraceable', b, b, 'unavailable', false, 1, 25]);
  if (!['confirmation', 'incomplete', 'development'].includes(variant)) throw new Error('unknown_task_variant');
  const truths = {}, jobs = current.map(([id, now, before, status, canCompute, deliveries, limit]) => {
    const result = { id: `prior-${id}`, value: transform(before) };
    const resultFile = `materials/${id}-result.json`, observationFile = `materials/${id}-provenance.json`, inputFile = `materials/${id}-input.json`;
    save(path.join(root, resultFile), result);
    if (status !== 'unavailable') save(path.join(root, observationFile), observeRaw(before));
    if (canCompute) save(path.join(root, inputFile), now);
    truths[id] = now;
    return { work_id: id, current: observeRaw(now), can_compute: canCompute, input_file: inputFile,
      delivery_count: deliveries, limit,
      priors: [{ id: result.id, result_file: resultFile, result_sha256: sha(result),
        observation: { status, reference: observationFile } }] };
  });
  const task = { schema: 'meter-report.v1', task_id: `1459-service-prioritization-${variant}-v1`,
    title: variant === 'development' ? 'Exposed calibration derivation replay' : 'Service prioritization and capacity report', jobs,
    rollups: variant === 'development' ? [] : [
      { id: 'signed-accounting', work_ids: ['stable-total', 'south-total', 'unit-report'], budget_mWh: 70 },
      { id: 'changed-basis', work_ids: ['corrected-reading', 'new-calibration', 'clamped-release'], budget_mWh: 85 },
      { id: 'inspection', work_ids: ['required-peak', 'retrieve-provenance', ...(variant === 'incomplete' ? ['offline-untraceable'] : [])], budget_mWh: 45 },
    ] };
  save(path.join(root, 'task.json'), task);
  save(path.join(root, 'evaluator.json'), truths);
  return task;
}
