import { lstatSync, readFileSync, realpathSync, mkdirSync, readdirSync } from 'node:fs';
import { sha } from '../hypothesis-cache-study/io.mjs';
import path from 'node:path';
export { read, save, sha } from '../hypothesis-cache-study/io.mjs';

export function fresh(root) {
  if (!path.isAbsolute(root)) throw new Error('absolute_output_required');
  const parent = path.dirname(root);
  if (realpathSync(parent) !== parent) throw new Error('aliased_parent');
  mkdirSync(root, { mode: 0o700 });
  return root;
}

export function file(root, relative) {
  if (typeof relative !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/u.test(relative) ||
      relative.split('/').some(x => x === '..' || x === '.' || x === '')) throw new Error('invalid_reference');
  const target = path.join(root, relative);
  if (realpathSync(root) !== path.resolve(root)) throw new Error('aliased_root');
  for (const [index, part] of relative.split('/').entries()) {
    const current = path.join(root, ...relative.split('/').slice(0, index), part);
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error('symlink_reference');
  }
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.size > 131072) throw new Error('invalid_file');
  return target;
}

export function json(root, relative) { return JSON.parse(readFileSync(file(root, relative), 'utf8')); }

export function manifest(root, prefix = '') {
  const result = {};
  for (const name of readdirSync(path.join(root, prefix)).sort()) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(path.join(root, relative));
    if (stat.isSymbolicLink()) throw new Error('symlink_reference');
    if (stat.isDirectory()) Object.assign(result, manifest(root, relative));
    else result[relative] = sha(readFileSync(file(root, relative)));
  }
  return result;
}
