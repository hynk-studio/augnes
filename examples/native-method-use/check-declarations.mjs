// A small task-owned check, not npm semver or an installation/runtime test.
import { createHash } from 'node:crypto';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function checkDeclarations(raw, target, method) {
  const identity = { input_sha256: sha256(raw), target };
  const unknown = reason => ({ ...identity, outcome: 'not_applicable', reason, runtime_compatibility: 'NOT_TESTED' });
  if (method.version !== 'package-declarations.v1' || method.purpose !== 'declared-platform-fit') return unknown('unsupported_method');
  if (typeof raw !== 'string' || Buffer.byteLength(raw) > 4096) return unknown('input_out_of_bounds');
  let pkg;
  try { pkg = JSON.parse(raw); } catch { return unknown('invalid_json'); }
  const range = /^>=(\d+)\.(\d+)\.(\d+) <(\d+)$/.exec(pkg?.engines?.node ?? '');
  const runtime = /^(\d+)\.(\d+)\.(\d+)$/.exec(target.node ?? '');
  if (!range || !runtime || !['os', 'cpu'].every(k => Array.isArray(pkg[k]) && pkg[k].length > 0 && pkg[k].length <= 8 && pkg[k].every(v => typeof v === 'string' && /^[a-z0-9_]+$/.test(v)))) return unknown('unsupported_declarations');
  const floor = range.slice(1, 4).map(Number), current = runtime.slice(1).map(Number), ceiling = Number(range[4]);
  if (![...floor, ...current, ceiling].every(Number.isSafeInteger) || floor[0] >= ceiling) return unknown('invalid_version_bounds');
  let comparison = 0;
  for (let i = 0; i < 3 && comparison === 0; i++) comparison = Math.sign(current[i] - floor[i]);
  const checks = { node: comparison >= 0 && current[0] < ceiling, os: pkg.os.includes(target.os), cpu: pkg.cpu.includes(target.cpu) };
  return { ...identity, package: pkg.name, version: pkg.version, checks,
    outcome: Object.values(checks).every(Boolean) ? 'declared_fit' : 'declared_mismatch', runtime_compatibility: 'NOT_TESTED' };
}
