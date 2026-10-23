// Deterministic replay only. Existing bounded process-tree/stream settlement.
import { Writable } from 'node:stream';
import { runCanonicalChild } from '../canonical-child-runner.mjs';

const [raw, cwd] = process.argv.slice(2);
const argv = JSON.parse(raw);
if (!Array.isArray(argv) || !argv.length || !argv.every(x => typeof x === 'string')) {
  throw new Error('invalid replay argv');
}
const capture = () => {
  let bytes = 0;
  const chunks = [];
  const stream = new Writable({ write(chunk, encoding, done) {
    bytes += chunk.length;
    if (bytes <= 131072) chunks.push(Buffer.from(chunk));
    done();
  }});
  return { stream, text: () => Buffer.concat(chunks).toString('utf8'), truncated: () => bytes > 131072 };
};
const out = capture(), err = capture(), events = [];
const controller = new AbortController();
process.on('SIGINT', () => controller.abort());
process.on('SIGTERM', () => controller.abort());
const result = await runCanonicalChild({
  suite: 'file-identity-replay', label: 'unchanged delivered method',
  command: argv[0], args: argv.slice(1), cwd, env: process.env,
  timeoutMs: 60000, termGraceMs: 8000, killGraceMs: 5000, heartbeatMs: 0,
  stdout: out.stream, stderr: err.stream, signal: controller.signal,
  onSpawn: pid => events.push({ child_pid: pid, at: new Date().toISOString() }),
  log: message => events.push({ message, at: new Date().toISOString() }),
});
console.log(JSON.stringify({ result, stdout: out.text(), stderr: err.text(),
  truncated: out.truncated() || err.truncated(), events }));
