// Minimal origin through supported product writers. The existing profile suite
// retains malformed-input, full-capacity and legacy/manual compatibility tests.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { applyCanonicalDatabaseMigrations } from './canonical-database-migrations.mjs';
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from '../lib/vnext/persistence/project-identity-registry';
import { directory, root, db, artifactDirectory, save, saveChanges, savePrepared, note, setupServer, finish, choice, readCurrent, find } from './execution-choice-transition-harness';

async function produce() {
  applyCanonicalDatabaseMigrations(db); mkdirSync(root); mkdirSync(artifactDirectory);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: 'Synthetic origin and distinct reconciliation' });
  await saveChanges({ goal: 'Check the selected alert and recommend the next observation',
    success_criteria: ['Retain legitimate automation and credential misuse explanations'], non_goals: ['No remediation or independent participant claim'] }, true);
  const alert = { job: 'job-7', service_account: 'svc-a', command: 'backup.sh', source_revision: 'alert-v1', actor: 'unknown' };
  await saveChanges({ sources: { add: [note('/private/alert.json', alert), note('note-ref:unrelated', 'Unrelated original: next month inventory planning; do not transfer')] } });
  const source = (await readCurrent()).sources.find((s: any) => s.excerpt_text === JSON.stringify(alert));
  const burden = { preparation: 'selected material', waiting: 'unknown', execution: 'unknown', coordination: 'manual', integration: 'check', switching: 'unknown' };
  await savePrepared(await choice('choose', { judgment: { present: 'Direct', alternatives: [
    { arrangement: 'Direct', benefit: 'Inspect alert', burden }, { arrangement: 'Manual', benefit: 'Get missing manifest', burden, manual_contribution: true },
  ], recommended: 'Manual', chosen: 'Manual', expectation: 'Manifest comparison informs next check', uncertainty: 'Actor unknown',
  horizon: new Date(Date.now() + 3600000).toISOString(), reconsider_when: 'Task or manifest changes' } }));
  const profile = readFileSync('examples/operating-profiles/manual-manifest.json', 'utf8');
  const request = await choice('participate', { participation: { purpose: 'Compare manifest', question: 'Return job, owner, command and limits',
    expected_return: 'Selected manifest only', checks: 'Match job and command; preserve actor uncertainty', check_use_owner: 'Origin maintainer',
    return_method: 'Manual UTF-8 file', feedback_method: 'Saved manual feedback', recheck: 'Task or manifest changes',
    material_refs: [source.source_binding], operating_profile: { json: profile, step_id: 'inspect' } } });
  assert(!JSON.stringify(request.delivery).includes('inventory planning')); assert(!JSON.stringify(request.delivery).includes('/private/alert.json'));
  await savePrepared(request); save('manual-request', request.delivery);
  writeFileSync(path.join(artifactDirectory, 'profile-input.json'), profile);
  // Exposed deterministic contribution from the actual delivered request.
  const delivered = JSON.parse(request.delivery.request.material[0].text);
  const original = JSON.stringify({ job: delivered.job, owner: 'ops', command: 'backup.sh', approval: 'unverified', advice: 'disable svc-a now' }, null, 2) + '\n';
  await savePrepared(await choice('receive', { manual_return: { manual_request_ref: request.delivery.manual_request_ref,
    material_ref: request.delivery.material_ref, content: original, source_revision: 'manifest-v1', selection: 'Whole supplied UTF-8 file',
    actor: 'Implementer-authored synthetic responder', assistance: 'Deterministic local relay; no independent participant' } }));
  writeFileSync(path.join(artifactDirectory, 'original-return.txt'), original);
  const returned = (await choice('read')).manual_contribution, manifest = JSON.parse(returned.original.value.content);
  assert.equal(manifest.job, alert.job); assert.equal(manifest.command, alert.command);
  const result = { job: manifest.job, owner: manifest.owner, command: manifest.command, job_and_command_match: true,
    recommendation: 'Verify actor identity and approval before action', execution_authorized: false };
  await saveChanges({ sources: { add: [note('note-ref:manifest-recommendation', result, 'derived_interpretation')] } });
  await savePrepared(await choice('assess', { assessment: { manual_request_ref: returned.request.ref, manual_return_ref: returned.original.ref,
    result_refs: [find(await readCurrent(), 'note-ref:manifest-recommendation').source_binding], disposition: 'partly_used',
    checks: 'Exact job-7 and backup.sh equality with alert-v1', applicability: 'Selected job only', reason: 'Use manifest comparison; decline disabling advice',
    uncertainty: 'Actor identity and approval unverified', unfinished: 'Verify actor identity and approval',
    next_action: 'Obtain identity/change records', reconsider_when: 'Task, alert or manifest changes' } }));
  await saveChanges({ sources: { deselect: [returned.request.source_ref] } });
  const feedback = await choice('feedback'); await savePrepared(feedback); save('manual-feedback', feedback.delivery);
  const finished = await choice('read'), m = finished.manual_contribution;
  assert.equal(m.decision_currentness, 'saved_basis_retained');
  await saveChanges({ sources: { deselect: [m.original.source_ref, m.decision.source_ref, m.operating_profile.source_ref] } });
  save('origin-cycle', finished);
}
void setupServer().then(produce).finally(finish);
