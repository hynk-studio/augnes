import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, verify } from './inventory.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
// Defined before any outcomes. Excluded directories are infrastructure only;
// all other regular A files transfer, including unsuccessful methods and outputs.
export const exclusions = ['node_modules/', '.runtime/'];
function copyFile(source, target) {
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.nlink !== 1 || fs.realpathSync(source) !== source) throw new Error('transfer_alias');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
}
export function exportA(destination) {
  if (fs.existsSync(destination)) throw new Error('destination_exists');
  fs.mkdirSync(destination, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'snapshots/a/manifest.json')));
  const names = ['runner.mjs','package.json','package-lock.json',
    'snapshots/a/manifest.json', ...Object.values(manifest.files).map(x=>'snapshots/a/'+x.file)];
  for (const name of names) copyFile(path.join(root,name),path.join(destination,name));
  copyFile(path.join(root,'materials/a/facts.json'),path.join(destination,'facts.json'));
  copyFile(path.join(root,'materials/a/BRIEF.md'),path.join(destination,'BRIEF.md'));
  return inventory(destination);
}
export function transferB(settledA, destination, aInventory) {
  if (fs.existsSync(destination)) throw new Error('destination_exists');
  verify(settledA, aInventory);
  fs.mkdirSync(destination,{recursive:true});
  function visit(relative) {
    for (const name of fs.readdirSync(path.join(settledA,relative)).sort()) {
      const rel=path.posix.join(relative,name);
      if (exclusions.some(e=>rel+'/'===e)) continue;
      const source=path.join(settledA,rel),stat=fs.lstatSync(source);
      if (stat.isSymbolicLink()) throw new Error('transfer_alias');
      if(stat.isDirectory()) visit(rel); else copyFile(source,path.join(destination,rel));
    }
  }
  visit('');
  const m=JSON.parse(fs.readFileSync(path.join(root,'snapshots/b/manifest.json')));
  const additions=['snapshots/b/manifest.json',...Object.values(m.files).map(x=>'snapshots/b/'+x.file)];
  for (const name of additions) copyFile(path.join(root,name),path.join(destination,name));
  copyFile(path.join(root,'materials/b/batch.json'),path.join(destination,'b-input/batch.json'));
  copyFile(path.join(root,'materials/b/BRIEF.md'),path.join(destination,'B_BRIEF.md'));
  // COPYFILE_EXCL above refuses every collision; no selected useful subset.
  return { a: aInventory, b: inventory(destination), additions: [...additions,'b-input/batch.json','B_BRIEF.md'], exclusions };
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [task,source,destination,manifest]=process.argv.slice(2);
  console.log(JSON.stringify(task==='a'?exportA(source):task==='b'?transferB(source,destination,JSON.parse(fs.readFileSync(manifest))):(()=>{throw new Error('a DEST | b SETTLED_A DEST INVENTORY');})(),null,2));
}
