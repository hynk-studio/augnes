import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const EXPECTED_TS = '6.0.3';
export const compilerOptions = Object.freeze({ module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2017, esModuleInterop: true, isolatedModules: true });
const hash = b => crypto.createHash('sha256').update(b).digest('hex');

// This is a source loader, not a validator. No filesystem/process APIs enter
// the loaded modules. Each invocation has its own module cache and manifest.
export function loadSnapshot(directory) {
  if (ts.version !== EXPECTED_TS) throw new Error('loader_compiler_version');
  const compiler = fs.readFileSync(createRequire(import.meta.url).resolve('typescript'));
  if (hash(compiler) !== '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39')
    throw new Error('loader_compiler_hash');
  const root = path.resolve(directory);
  if (fs.realpathSync(root) !== root) throw new Error('loader_root_alias');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  const bytes = new Map(), cache = new Map(), trace = [];
  for (const [logical, entry] of Object.entries(manifest.files)) {
    if (entry.file !== logical + '.txt' || !/^(lib|types)\/[\w/.-]+\.ts$/.test(logical))
      throw new Error('loader_manifest_path');
    const physical = path.join(root, entry.file), stat = fs.lstatSync(physical);
    if (!stat.isFile() || stat.nlink !== 1 || fs.realpathSync(physical) !== physical)
      throw new Error('loader_source_alias');
    const source = fs.readFileSync(physical);
    if (source.length !== entry.bytes || hash(source) !== entry.sha256)
      throw new Error('loader_source_hash');
    bytes.set(logical, source);
  }
  function load(logical) {
    if (cache.has(logical)) return cache.get(logical).exports;
    if (!bytes.has(logical)) throw new Error('loader_import_denied:' + logical);
    const module = { exports: {} }; cache.set(logical, module);
    trace.push({ module: logical, sha256: hash(bytes.get(logical)) });
    const compiled = ts.transpileModule(bytes.get(logical).toString('utf8'),
      { compilerOptions, fileName: logical, reportDiagnostics: true });
    if (compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error))
      throw new Error('loader_transpile_failed');
    const require = spec => {
      if (spec === 'node:path') return path;
      if (spec === 'node:crypto') return crypto;
      let target;
      if (spec.startsWith('@/')) target = spec.slice(2);
      else if (spec.startsWith('./') || spec.startsWith('../'))
        target = path.posix.normalize(path.posix.join(path.posix.dirname(logical), spec));
      else throw new Error('loader_import_denied:' + spec);
      return load(target.endsWith('.ts') ? target : target + '.ts');
    };
    const context = vm.createContext({ module, exports: module.exports, require, Buffer });
    new vm.Script(compiled.outputText, { filename: root + '/' + logical }).runInContext(context, { timeout: 2000 });
    return module.exports;
  }
  const contract = load('lib/vnext/native-host/native-host-contract.ts');
  const paths = load('lib/vnext/repository-relative-path.ts');
  return { contract, paths, trace, manifest };
}

export function runOperations(snapshot, operations) {
  return operations.map(operation => {
    try {
      let value;
      if (operation.op === 'path') value = snapshot.paths.canonicalizeRepositoryRelativePathV01(operation.value);
      else if (operation.op === 'text') {
        snapshot.contract.assertNativeHostPublicTextV01(operation.value); value = operation.value;
      } else if (operation.op === 'result')
        value = snapshot.contract.assertNativeHostResultV01(operation.request, operation.value);
      else throw new Error('runner_operation_unknown');
      return { id: operation.id, accepted: true, value };
    } catch (error) {
      // Unexpected loader/runtime errors are not admission refusals.
      if (error.name !== 'NativeHostContractErrorV01' && error.message !== 'repository_relative_path_invalid') throw error;
      return { id: operation.id, accepted: false, error: {
        name: error.name, code: error.code ?? error.message,
        ...(error.result_field === undefined ? {} : { result_field: error.result_field }) } };
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, input, output] = process.argv.slice(2);
  if (!directory || !input || !output || fs.existsSync(output))
    throw new Error('Usage: node runner.mjs SNAPSHOT INPUT_JSON ABSENT_OUTPUT_JSON');
  const snapshot = loadSnapshot(directory);
  const results = runOperations(snapshot, JSON.parse(fs.readFileSync(input)));
  fs.writeFileSync(output, JSON.stringify({ results, trace: snapshot.trace,
    runtime: { node: process.version, platform: process.platform, arch: process.arch,
      typescript: ts.version, compilerOptions, snapshot: snapshot.manifest.commit } }, null, 2) + '\n', { flag: 'wx' });
}
