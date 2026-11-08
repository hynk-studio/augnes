import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadSnapshot, runOperations } from './runner.mjs';
import { checkA, checkB } from './check.mjs';
import { exportA, transferB } from './transfer.mjs';
import { inventory, verifyPreparation } from './inventory.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const [out]=process.argv.slice(2);
if (!out || !path.isAbsolute(out) || fs.existsSync(out)) throw new Error('controls ABSENT_ABSOLUTE_OUTPUT_DIRECTORY');
fs.mkdirSync(out,{recursive:true});
const before=verifyPreparation(root);
const begin=performance.now(), read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const write=(p,x)=>fs.writeFileSync(path.join(out,p),JSON.stringify(x,null,2)+'\n');
const operations=read('evaluator/operations.json'),expected=read('evaluator/expected.json');
const summary={kind:'DEVELOPER_CONTROLS_NOT_CONSUMERS',runtime:{node:process.version,platform:process.platform,arch:process.arch},checks:[],matrix:[]};
for (const arm of ['a','b']) {
  const snapshot=loadSnapshot(path.join(root,'snapshots',arm));
  const results=runOperations(snapshot,operations);write(arm+'-original-results.json',{results,trace:snapshot.trace});
  for (const row of results) {
    const want=expected[row.id][arm];
    assert.equal(row.accepted,want.accepted,arm+':'+row.id);
    if(want.accepted) assert.deepEqual(JSON.parse(JSON.stringify(row.value)),want.value??want.packet,arm+':'+row.id);
    else assert.equal(row.error.code,want.error_code,arm+':'+row.id);
    summary.matrix.push({snapshot:arm,id:row.id,accepted:row.accepted,...(!row.accepted?{error:row.error}:{})});
  }
  assert.equal(snapshot.trace.length,6);
}
summary.checks.push('same-input cross-snapshot matrix: '+operations.length+' operations per snapshot');
assert.equal(checkA(path.join(root,'evaluator/a-control.json')).status,'PASS');
assert.equal(checkB(path.join(root,'evaluator/b-control.json')).status,'PASS');
summary.checks.push('independent checker accepts valid developer A/B deliverables');
function rejected(name,body,checker) {const p=path.join(out,name+'.json');write(name+'.json',body);assert.throws(()=>checker(p));summary.checks.push('reject '+name);}
const good=read('evaluator/b-control.json');
const obsolete=structuredClone(good);
for (const row of obsolete.results) if(row.accepted) row.packet=JSON.parse(JSON.stringify(row.packet).replaceAll('C: Build','C - Build').replaceAll('D: Local','D - Local'));
rejected('obsolete-formatting-foil',obsolete,checkB);
const bypass=structuredClone(good);bypass.results.find(x=>x.id==='release-04').accepted=true;
bypass.results.find(x=>x.id==='release-04').packet=read('materials/b/batch.json').records.find(x=>x.id==='release-04').packet;
delete bypass.results.find(x=>x.id==='release-04').error_code;rejected('guard-bypass-foil',bypass,checkB);
const missing=structuredClone(good);missing.results.pop();rejected('missing-result-foil',missing,checkB);
const falseComplete=read('evaluator/a-control.json');falseComplete.skipped_checks=[];falseComplete.gaps=[];rejected('false-completeness-foil',falseComplete,checkA);
const wrongPath=structuredClone(good);wrongPath.results[0].packet.changed_files[0].repository_relative_path='src\\status.ts';rejected('uncanonical-path-foil',wrongPath,checkB);
// Actual exports: no evaluator fixtures, control methods, B source, history or Git.
const aDir=path.join(out,'export-a'),aInv=exportA(aDir);write('export-a-inventory.json',aInv);
assert.equal(Object.keys(aInv).length,12);
assert(Object.keys(aInv).every(p=>!/(evaluator|developer|\.git|snapshots\/b)/.test(p)));
fs.writeFileSync(path.join(aDir,'failed-method.txt'),'DEVELOPER transfer sentinel; retain even unsuccessful assets.\n');
const settled=inventory(aDir),bDir=path.join(out,'export-b');
const transfer=transferB(aDir,bDir,settled);write('transfer-inventory.json',transfer);
assert.equal(transfer.additions.length,9);
assert.equal(fs.readFileSync(path.join(bDir,'failed-method.txt'),'utf8'),fs.readFileSync(path.join(aDir,'failed-method.txt'),'utf8'));
summary.checks.push('whole-A export + nine B additions; no evaluator/history; failed sentinel preserved');
const collision=path.join(out,'collision-a');exportA(collision);
fs.mkdirSync(path.join(collision,'b-input'));fs.writeFileSync(path.join(collision,'b-input/batch.json'),'{}');
assert.throws(()=>transferB(collision,path.join(out,'collision-b'),inventory(collision)),/EEXIST/);
summary.checks.push('B overwrite refused');
// Fail-closed source drift, missing module, and cross-snapshot class identity.
const bad=path.join(out,'loader-bad');fs.cpSync(path.join(root,'snapshots/a'),bad,{recursive:true});
fs.appendFileSync(path.join(bad,'lib/vnext/repository-relative-path.ts.txt'),'\n');
assert.throws(()=>loadSnapshot(bad),/loader_source_hash/);
const absent=path.join(out,'loader-missing');fs.cpSync(path.join(root,'snapshots/a'),absent,{recursive:true});fs.rmSync(path.join(absent,'lib/vnext/protocol-primitives.ts.txt'));
assert.throws(()=>loadSnapshot(absent),/ENOENT/);
const b=loadSnapshot(path.join(root,'snapshots/b'));
assert.throws(()=>b.contract.withNativeHostResultFieldV01('summary',()=>b.contract.assertNativeHostPublicTextV01('Look /private/run/result.txt')),e=>e instanceof b.contract.NativeHostContractErrorV01&&e.result_field==='summary');
const link=path.join(out,'alias');fs.symlinkSync(path.join(root,'snapshots/a'),link);assert.throws(()=>loadSnapshot(link),/loader_root_alias/);fs.unlinkSync(link);
summary.checks.push('source drift/missing source/alias refused; B error class identity preserved');
// Faithful deterministic replay: actual supplied developer method, private HOME,
// temp and cwd; same immutable inputs, distinct absent output. No logic repair.
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'1464-software-replay-'));
try {
  const replay=path.join(out,'developer-replay.json');
  const argv=[path.join(root,'developer-audit.mjs'),path.join(root,'snapshots/b'),path.join(root,'materials/b/batch.json'),replay];
  const env={PATH:path.dirname(process.execPath)+':/usr/bin:/bin',HOME:temporary,TMPDIR:temporary,LANG:'C.UTF-8'};
  const start=performance.now();const child=spawnSync(process.execPath,argv,{cwd:temporary,env,encoding:'utf8',timeout:10000,maxBuffer:1048576});
  write('replay-process.json',{argv:[process.execPath,...argv],cwd:temporary,private_home:temporary,elapsed_seconds:(performance.now()-start)/1000,status:child.status,signal:child.signal,error:child.error?.message,stdout:child.stdout,stderr:child.stderr});
  assert.equal(child.status,0);assert.equal(checkB(replay).status,'PASS');
  assert.deepEqual(JSON.parse(fs.readFileSync(replay)),good);
  summary.checks.push('fresh contained developer-method replay + independent output checker PASS');
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
summary.elapsed_seconds=(performance.now()-begin)/1000;summary.status='PASS';
assert.deepEqual(verifyPreparation(root),before,'immutable originals unchanged through controls');
write('summary.json',summary);write('output-inventory.json',inventory(out));
console.log(JSON.stringify({status:summary.status,checks:summary.checks,elapsed_seconds:summary.elapsed_seconds,output:out}));
