import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const digest = b => crypto.createHash('sha256').update(b).digest('hex');
export function inventory(root) {
  const files = {};
  function visit(relative) {
    for (const name of fs.readdirSync(path.join(root, relative)).sort()) {
      if (name === 'node_modules') continue;
      const rel = path.posix.join(relative, name), full = path.join(root, rel), stat = fs.lstatSync(full);
      if (stat.isSymbolicLink() || fs.realpathSync(full) !== full) throw new Error('inventory_alias:' + rel);
      if (stat.isDirectory()) visit(rel);
      else if (stat.isFile() && stat.nlink === 1) {
        const bytes = fs.readFileSync(full); files[rel] = { bytes: bytes.length, sha256: digest(bytes) };
      } else throw new Error('inventory_file_type:' + rel);
    }
  }
  visit(''); return files;
}
export function verify(root, expected) {
  const actual = inventory(root);
  for (const [name, entry] of Object.entries(expected))
    if (JSON.stringify(actual[name]) !== JSON.stringify(entry)) throw new Error('immutable_mismatch:' + name);
  return actual;
}
export function verifyPreparation(root) {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'freeze-ready.json')));
  if (manifest.kind!=='PREPARATION_ONLY_NOT_LIVE_FREEZE') throw new Error('freeze_kind');
  return verify(root,manifest.files);
}
