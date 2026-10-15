// Task-local observations and execution. This is supplied scaffolding, not learned rules.
import { Script } from 'node:vm';
import { sha } from '../hypothesis-cache-study/io.mjs';

export const TOOL_SOURCES = Object.freeze({
  'meter-1': 'module.exports = xs => xs.map(x => x);',
  'meter-1.1': '// diagnostic-only release\nmodule.exports = xs => xs.map(x => x);',
  'meter-2': 'module.exports = xs => xs.map(x => Math.max(0, x));',
});
// Compatibility is supplied, inspectable source evidence, not a guessed version order.
export function toolObservation(version) {
  const source = TOOL_SOURCES[version];
  if (!source) throw new Error('unknown_tool');
  return { version, source_sha256: sha(source),
    semantics: source.replace(/^\/\/[^\n]*\n/u, '') };
}

export function transform(raw) {
  const { input, dependency, tool, request } = raw;
  if (!input || !Array.isArray(input.readings) || input.readings.length < 1 || input.readings.length > 32 ||
      input.readings.some(x => !Number.isSafeInteger(x) || Math.abs(x) > 1000000) ||
      !Number.isSafeInteger(dependency?.multiplier) || dependency.multiplier < 1 || dependency.multiplier > 100 ||
      !['total', 'peak'].includes(request?.metric) || !['mWh', 'uWh'].includes(request?.unit))
    throw new Error('unsupported_measurement');
  const observed = toolObservation(tool.version);
  if (JSON.stringify(observed) !== JSON.stringify(tool)) throw new Error('unbound_tool_observation');
  const normalized = new Script(`${observed.semantics}\nmodule.exports(${JSON.stringify(input.readings)})`)
    .runInNewContext({ module: { exports: {} } }, { timeout: 100 });
  const values = Array.from(normalized, x => x * dependency.multiplier);
  const value = (request.metric === 'total' ? values.reduce((a, b) => a + b, 0) : Math.max(...values)) *
    (request.unit === 'uWh' ? 1000 : 1);
  return { value, unit: request.unit };
}

export function observeRaw(raw) {
  return { input: { entity: raw.input.entity, readings_sha256: sha(raw.input.readings), caption: raw.input.caption,
    file_sha256: sha(raw.input) }, dependency: raw.dependency, tool: raw.tool, request: raw.request, report: raw.report };
}

// All observed leaf fields compete equally. No 'valid', 'relevant' or checker feature.
// Arrays are one observed field; metadata, version/source bytes and report goal compete too.
export function flatten(value, prefix = '', result = {}) {
  for (const [key, item] of Object.entries(value ?? {})) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item)) flatten(item, name, result);
    else result[name] = item;
  }
  return result;
}

export function equalFields(prior, current) {
  const before = flatten(prior), after = flatten(current);
  return Object.fromEntries([...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .map(key => [key, Object.hasOwn(before, key) && Object.hasOwn(after, key) &&
      JSON.stringify(before[key]) === JSON.stringify(after[key])]));
}

export function plan(program, view) {
  if (program.schema !== 'reuse-equalities.v1' || !Array.isArray(program.equal) ||
      program.equal.length > 24 || program.equal.some(x => typeof x !== 'string')) throw new Error('invalid_program');
  const current = flatten(view.current);
  let unavailable = null;
  for (const prior of view.priors) {
    if (prior.observation.status === 'unread') return { action: 'observe', result_id: prior.id,
      reference: prior.observation.reference };
    if (prior.observation.status !== 'known') { unavailable = prior.id; continue; }
    const before = flatten(prior.observation.value);
    if (program.equal.every(key => Object.hasOwn(before, key) && Object.hasOwn(current, key) &&
        JSON.stringify(before[key]) === JSON.stringify(current[key])))
      return { action: 'reuse', result_id: prior.id };
  }
  if (view.can_compute) return { action: 'recompute', work_id: view.work_id };
  return { action: 'incomplete', reason: unavailable ? `provenance_unavailable:${unavailable}` : 'input_unavailable' };
}
