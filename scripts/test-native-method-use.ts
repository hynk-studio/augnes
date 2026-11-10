// Fixed expectations are evaluator-only. Children receive saved ordinary entry.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, cpSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
const destination = process.argv[2], timeoutMs = 60_000, started = performance.now();
assert(!destination || (path.isAbsolute(destination) && !existsSync(destination)));
const owner = createCanonicalTestResourceRoot('ag-suite-', { shortSocketPaths: true });
const artifacts = path.join(owner.root, 'artifacts');
const read = (name: string) => JSON.parse(readFileSync(path.join(artifacts, name + '.json'), 'utf8'));
async function main() {
  beginCanonicalTestResourceUse(owner); let settled = true;
  const stages: any[] = [];
  try {
    for (const role of ['producer', 'consumer-current', 'label', 'consumer-label', 'unsuitable', 'consumer-unsuitable', 'boundary']) {
      settled = false;
      const result = await runCanonicalChild({ suite: 'native-method-use', label: role, command: process.execPath,
        args: ['--import', 'tsx', role.startsWith('consumer-') ? 'scripts/native-method-use-consumer.ts' : 'scripts/native-method-use-case.ts', role, owner.root],
        cwd: process.cwd(), env: { ...process.env, OPENAI_API_KEY: undefined }, timeoutMs, heartbeatMs: 5000, resourceOwner: undefined });
      settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
      stages.push({ role, result });
      assert.equal(canonicalChildAcceptanceFailure(result, { suite: 'native-method-use', timeoutMs, requireNaturalExit: true }), null);
    }
    const original = read('original-report'), a = read('a-saved').manual_contribution, producer = read('producer');
    assert.equal(original.baseline.outcome, 'declared_fit');
    assert.deepEqual(original.candidate.checks, { node: false, os: true, cpu: true });
    assert.equal(original.candidate.outcome, 'declared_mismatch');
    assert.equal(a.original.value.content, readFileSync(path.join(artifacts, 'original-report.json'), 'utf8'));
    assert.equal(a.decision.value.disposition, 'partly_used');
    assert.equal(a.decision_currentness, 'saved_basis_retained');
    assert.equal(a.operating_profile.execution_ready, false);
    assert.equal(read('consumer-current-output').outcome, 'declared_fit');
    assert.equal(read('consumer-current-output').version, '2.1.0');
    assert.equal(read('consumer-current-output').runtime_compatibility, 'NOT_TESTED');
    assert.equal(read('consumer-current-judgment').disposition, 'adapt');
    assert.match(read('consumer-current-process').task_identity, /^sha256:[a-f0-9]{64}$/);
    assert.notEqual(read('consumer-current-process').task_identity, producer.aTask);
    assert.equal(readFileSync(path.join(artifacts, 'consumer-current-output.json'), 'utf8'), readFileSync(path.join(artifacts, 'consumer-label-output.json'), 'utf8'));
    assert.equal(read('consumer-label-judgment').disposition, 'adapt');
    assert.equal(read('consumer-unsuitable-judgment').disposition, 'non_use');
    assert.equal(read('consumer-unsuitable-output').outcome, 'not_applicable');
    const pids = ['current', 'label', 'unsuitable'].map(s => read(`consumer-${s}-process`).pid);
    assert.equal(new Set(pids).size, 3); assert(!pids.includes(process.pid));
    for (const label of ['current', 'label', 'unsuitable']) {
      const delivery = read(`consumer-${label}-delivery`);
      assert(!JSON.stringify(delivery).includes(producer.privateRef));
      assert(!JSON.stringify(delivery).includes('internal checklist fixture'));
    }
    assert.equal(read('contract').compensation.fulfilled, false);
    const report = { status: 'PASS', evidence: 'Controlled native cross-project use in one workspace',
      projects: producer.projects, checks: ['actual request/return/check/partial-use', 'independent negative and positive declaration expectations', 'scope contrasts preserved as authored choices', 'private material and undeclared material refused', 'task-local source transplant refused', 'current correction and stale binding refused', 'share withdrawal stops reads and preserves copies', 'fresh C checked artifact and own judgment', 'label-only output equality', 'unsuitable-method non-use', 'current authentication and store validation'],
      stages, elapsed_ms: performance.now() - started, provider_calls: 0, paid_dispatch: 'UNIMPLEMENTED', payment: 'NOT_PERFORMED', runtime_compatibility: 'NOT_TESTED', independent_participation: 'NOT_TESTED', human_preparation_time: 'UNMEASURED', development_model_usage: 'UNMEASURED', comparative_benefit: 'UNKNOWN' };
    writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, checks: report.checks, elapsed_ms: report.elapsed_ms }));
  } finally {
    if (existsSync(artifacts)) writeFileSync(path.join(artifacts, 'stage-results.json'), JSON.stringify(stages, null, 2) + '\n');
    let exportError;
    try { if (destination && existsSync(artifacts)) { mkdirSync(destination); cpSync(artifacts, destination, { recursive: true, errorOnExist: true }); } } catch (error) { exportError = error; }
    if (settled) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner]); console.log(JSON.stringify({ cleanup }));
    assert(cleanup.every((r: any) => r.completed)); if (exportError) throw exportError;
  }
}
void main();
