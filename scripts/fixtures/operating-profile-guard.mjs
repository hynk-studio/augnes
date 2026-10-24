// Test-only observation of the exercised CLI's boundary, not a production sandbox.
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import childProcess from 'node:child_process';
import workerThreads from 'node:worker_threads';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { installZeroNetworkGuard } from '../test-harness-zero-network-guard.mjs';

const violations = [], selectedReads = [];
const reportAudit = fs.writeSync.bind(fs);
const moduleFiles = new Set(['../operating-profile.mjs', '../../lib/vnext/operating-profile.mjs',
  '../../plugins/augnes-operator/mcp/operating-profile.mjs', '../../plugins/augnes-operator/mcp/review-connection.mjs'].map(file => fileURLToPath(new URL(file, import.meta.url))));
const block = method => {
  violations.push(method);
  throw new Error(`profile_test_effect_forbidden:${method}`);
};
const network = installZeroNetworkGuard({ onBlockedAttempt: attempt => violations.push(attempt.method) });
for (const target of [fs, fsPromises]) {
  for (const method of ['writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'write',
    'writev', 'writevSync', 'createWriteStream', 'mkdir', 'mkdirSync', 'mkdtemp', 'mkdtempSync',
    'unlink', 'unlinkSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync', 'rename', 'renameSync',
    'copyFile', 'copyFileSync', 'cp', 'cpSync', 'truncate', 'truncateSync', 'ftruncate', 'ftruncateSync',
    'chmod', 'chmodSync', 'fchmod', 'fchmodSync', 'chown', 'chownSync', 'fchown', 'fchownSync',
    'link', 'linkSync', 'symlink', 'symlinkSync', 'utimes', 'utimesSync', 'futimes', 'futimesSync']) {
    if (typeof target[method] === 'function') target[method] = () => block(`fs.${method}`);
  }
  for (const method of ['open', 'openSync']) {
    if (typeof target[method] !== 'function') continue;
    const original = target[method];
    target[method] = function (path, flags, ...rest) {
      const writing = typeof flags === 'number' ?
        Boolean(flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND)) : flags !== 'r';
      if (writing) block(`fs.${method}:write`);
      const file = path instanceof URL ? fileURLToPath(path) : String(path);
      if (file === process.argv[2]) selectedReads.push(file);
      else if (!moduleFiles.has(file)) block(`fs.${method}:unselected_read`);
      return original.call(this, path, flags, ...rest);
    };
  }
}
// The CLI's declared output descriptors are allowed; application-file writes are not.
fs.writeSync = (descriptor, ...args) => {
  if (descriptor !== 1 && descriptor !== 2) block('fs.writeSync:application_file');
  return reportAudit(descriptor, ...args);
};
for (const method of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'])
  childProcess[method] = () => block(`child_process.${method}`);
workerThreads.Worker = class { constructor() { block('worker_threads.Worker'); } };
syncBuiltinESMExports();
process.on('exit', () => {
  // The harness's own fixed stderr audit must flush even during process exit.
  reportAudit(2, `PROFILE_BOUNDARY ${JSON.stringify({ violations, network_attempts: network.attempts.length, selected_reads: selectedReads.length })}\n`);
  if (violations.length > 0) process.exitCode = 70;
});
