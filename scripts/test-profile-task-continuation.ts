import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, cpSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { canonical, digest } from '../plugins/augnes-operator/mcp/review-connection.mjs';

const destination = process.argv[2], timeoutMs = 60_000;
assert(!destination || (path.isAbsolute(destination) && !existsSync(destination)));
const owner = createCanonicalTestResourceRoot('ag-suite-', { shortSocketPaths: true });
const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
async function main() {
  beginCanonicalTestResourceUse(owner);
  let settled = true;
  const children: any[] = [];
  try {
    for (const role of ['producer', 'transfer', 'recipient', 'reopen', 'boundary']) {
      settled = false;
      const script = role === 'producer' ? 'scripts/profile-task-continuation-origin.ts' : 'scripts/profile-task-continuation-fixture.ts';
      const result = await runCanonicalChild({ suite: 'profile-task-continuation', label: role, command: process.execPath,
        args: ['--import', 'tsx', script, role, owner.root], cwd: process.cwd(), env: process.env,
        timeoutMs, heartbeatMs: 5000, resourceOwner: undefined, onSpawn: (pid?: number) => { children.push({ role, pid }); } });
      children.at(-1).result = result;
      settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
      assert.equal(canonicalChildAcceptanceFailure(result, { suite: 'profile-task-continuation', timeoutMs, requireNaturalExit: true }), null);
    }
    const artifact = (name: string) => path.join(owner.root, 'artifacts', name);
    const read = (name: string) => JSON.parse(readFileSync(artifact(name + '.json'), 'utf8'));
    const transfer = read('continuation-transfer'), recipient = read('continuation-recipient'), reopened = read('continuation-reopened');
    // Independent fixed oracle: it does not call the receiving algorithm or
    // accept its saved use label as correctness. Original event records are
    // checked against the exposed case before evaluating every returned row.
    assert.deepEqual(transfer.inputs.events.map((e: any) => [e.id, e.minute, e.bytes, e.principal]), [
      ['e1', 603, 120, 'runner-17'], ['e2', 604, 80, 'runner-17'], ['e3', 625, 50, 'runner-17'], ['e4', 605, 30, null],
    ]);
    assert.deepEqual(recipient.report.rows, [
      { id: 'e1', bytes: 120, manifest_match: true, status: 'reconciled' },
      { id: 'e2', bytes: 80, manifest_match: true, status: 'reconciled' },
      { id: 'e3', bytes: 50, manifest_match: true, status: 'approval_unresolved' },
      { id: 'e4', bytes: 30, manifest_match: true, status: 'identity_unresolved' },
    ]);
    assert.equal(recipient.report.total_bytes, 280);
    assert.equal(recipient.report.reconciled_bytes, 200);
    assert.equal(recipient.report.unresolved_bytes, 80);
    assert.equal(recipient.report.execution_authorized, false);
    const old = transfer.origin.manual_contribution, fresh = reopened.view.manual_contribution;
    assert.equal(old.original.value.content, readFileSync(artifact('original-return.txt'), 'utf8'));
    assert.equal(fresh.original.value.content, old.original.value.content);
    assert.deepEqual(fresh.operating_profile.profile, old.operating_profile.profile);
    assert.equal(fresh.task_identity, transfer.recipient.manual_contribution.task_identity);
    assert.notEqual(fresh.task_identity, old.task_identity);
    assert.equal(fresh.decision_task, 'same_task'); assert.equal(fresh.request_task, 'different_task');
    assert.equal(fresh.decision_currentness, 'saved_basis_retained');
    assert.equal(reopened.historical_decision.lookup.results[0].note.excerpt_text, canonical(old.decision.value));
    assert.equal(JSON.parse(fresh.downstream[0].text).report, digest(recipient.report));
    assert.equal(recipient.report.declined, JSON.parse(old.original.value.content).advice);
    const reportBytes = readFileSync(artifact('reconciliation-report.json'));
    assert(reportBytes.equals(readFileSync(artifact('reopened-report.json'))));
    assert.equal(new Set(children.map(c => c.pid)).size, children.length);
    const results = { status: 'PASS', children, origin_task: old.task_identity, recipient_task: fresh.task_identity,
      report_sha256: sha(reportBytes), original_return_sha256: sha(old.original.value.content),
      unchanged_historical_decision: true, exact_dependency_closure: true, new_artifact: true,
      independent_scripted_oracle: true, fresh_persisted_reentry: true, provider_calls: 0,
      actual_model_understanding: 'NOT_RUN', independent_participation: 'NOT_RUN', comparative_usefulness: 'NOT_EVALUATED', full_W2: 'NOT_ESTABLISHED' };
    writeFileSync(artifact('continuation-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally {
    let exportError;
    try {
      if (destination && existsSync(path.join(owner.root, 'artifacts'))) {
        mkdirSync(destination); cpSync(path.join(owner.root, 'artifacts'), destination, { recursive: true, errorOnExist: true });
      }
    } catch (error) { exportError = error; }
    if (settled) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner]); console.log(JSON.stringify({ cleanup }));
    assert(cleanup.every((r: any) => r.completed)); if (exportError) throw exportError;
  }
}
void main();
