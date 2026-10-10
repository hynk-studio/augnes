import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { Script } from 'node:vm';

export const sha = value => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
).digest('hex');
export const read = file => JSON.parse(readFileSync(file, 'utf8'));
export const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
export const bytes = value => Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value));

// Pure CommonJS functions, supplied by a trusted local worker. No host objects,
// filesystem APIs or process are passed in. VM is NOT a hostile-code sandbox.
// Each call starts fresh, is bounded, and receives JSON copies of public state.
export function call(source, method, args, timeout = 500) {
  if (!['plan', 'project', 'countExecutions', 'identities'].includes(method)) throw new Error('unknown_adapter_method');
  const invoke = method === 'identities'
    ? `({plan: module.exports.plan.toString(), project: module.exports.project.toString(), telemetry: module.exports.countExecutions.toString()})`
    : `module.exports.${method}(...JSON.parse(${JSON.stringify(JSON.stringify(args))}))`;
  const result = new Script(`'use strict'; const module = {exports: {}};\n${source}\nJSON.stringify(${invoke});`)
    .runInNewContext(Object.create(null), { timeout, contextCodeGeneration: { strings: false, wasm: false } });
  if (typeof result !== 'string' || bytes(result) > 32768) throw new Error('adapter_output_invalid');
  return JSON.parse(result);
}

export function identities(source) {
  const functions = call(source, 'identities', []);
  return { adapter_sha256: sha(source), causal_sha256: sha([functions.plan, functions.project]),
    telemetry_sha256: sha(functions.telemetry) };
}
