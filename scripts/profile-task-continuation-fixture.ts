// Exposed synthetic engineering case. Each role is a separate process. Receiving
// roles read only the registered project through the ordinary persisted readers.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { canonical, digest } from '../plugins/augnes-operator/mcp/review-connection.mjs';
import { prepareExecutionChoice } from '../plugins/augnes-operator/mcp/execution-choice.mjs';
import {
  mode, root, db, artifactDirectory, save, raw, call, readCurrent, saveChanges,
  savePrepared, note, refused, setupServer, finish, choice, lookup, find, setSaveFailure,
} from './execution-choice-transition-harness';

const transferLocator = 'note-ref:profile-continuation-origin';
const inputLocator = 'note-ref:identity-change-records';
const resultLocator = 'note-ref:reconciliation-report';
const calculationLocator = 'note-ref:reconciliation-calculation';
const manualLocator = (ref: string) => 'note-ref:manual-contribution:' + ref.slice(7);
const profileLocator = (ref: string) => 'note-ref:operating-profile:' + ref.slice(7);
const zero = 'sha256:' + '0'.repeat(64);

async function exactRetained(locator: string, sourceRef: string) {
  const result = await lookup(locator);
  assert.equal(result.status, 'available');
  assert.equal(result.lookup.truncated, false);
  const hits = result.lookup.results.filter((r: any) => r.note.source_locator === locator && r.note.source_binding === sourceRef);
  assert.equal(hits.length, 1, 'exact dependency must be accessible before crossing the task boundary');
  return hits[0];
}

async function transfer() {
  // Independent preservation audit only; consumer work uses the public readers.
  const historicalRows = db.prepare('SELECT record_id, payload_json FROM vnext_core_records ORDER BY record_id').all() as { record_id: string; payload_json: string }[];
  const origin = await choice('read'), m = origin.manual_contribution;
  assert.equal(m.decision_currentness, 'saved_basis_retained');
  assert.equal(m.decision.value.disposition, 'partly_used');
  assert.equal(m.operating_profile.selection, 'historical_not_selected');
  assert.match(m.decision.value.reason, /decline disabling advice/);
  // Resolve only the selected cycle's fixed dependencies, while origin access is
  // still valid. The recipient's retained reader intentionally cannot do this.
  const dependencies = [
    ...[m.request, m.original, m.decision].map(r => [manualLocator(r.ref), r.source_ref]),
    [profileLocator(m.operating_profile.fingerprint), m.operating_profile.source_ref],
  ];
  const hits: any[] = [];
  for (const [locator, binding] of dependencies) hits.push(await exactRetained(locator, binding));
  const before = await readCurrent();
  const unrelated = find(before, 'note-ref:unrelated');
  const arrangement = before.sources.find((s: any) => s.source_locator?.startsWith('note-ref:execution-choice:'));
  const removed = before.sources.filter((s: any) => ![unrelated.source_binding, arrangement.source_binding, m.feedback.source_ref].includes(s.source_binding));
  await refused('changed dependency reference preserves origin', () => raw('augnes_preview_repository_work_revision', {
    repositoryRoot: root, expectedSnapshotBinding: before.snapshot,
    changes: { sources: { deselect: removed.map((s: any) => s.source_binding), retained_source_refs: [{ ...hits[0].source, source_fingerprint: zero }] } },
  }));
  await saveChanges({ sources: { deselect: removed.map((s: any) => s.source_binding), retained_source_refs: hits.map(h => h.source) } });
  const ready = await choice('read'), selected = await readCurrent();
  assert.equal(ready.manual_contribution.task_identity, m.task_identity);
  assert.equal(selected.sources.length, 7);
  assert.equal(find(selected, 'note-ref:unrelated').excerpt_text, unrelated.excerpt_text);
  const closure = selected.sources.filter((s: any) => s.source_binding !== unrelated.source_binding);
  assert.equal(closure.length, 6);
  const transferRecord = {
    origin_task: m.task_identity, origin_goal: origin.work.goal,
    origin_packet: origin.packet, predecessor_packet: ready.packet,
    request: m.request.ref, original: m.original.ref, decision: m.decision.ref,
    feedback: m.feedback.ref, operating_profile: m.operating_profile.fingerprint,
    step: m.operating_profile.selected_step.id,
    omitted: ['Unrelated note stays in origin history', 'Alert and comparison remain exact embedded request/decision material'],
    unavailable: [], obligations: 'Historical only; recipient must explicitly adopt its own scope',
  };
  // Newly permitted data, not a stored answer or instructions from the producer.
  const inputs = {
    revision: 'identity-change-v2', identity: { account: 'svc-a', principal: 'runner-17', owner: 'ops', record: 'identity-4' },
    change: { id: 'CR-8', job: 'job-7', command: 'backup.sh', principal: 'runner-17', from: 600, through: 620, approved: true },
    events: [
      { id: 'e1', job: 'job-7', command: 'backup.sh', account: 'svc-a', principal: 'runner-17', minute: 603, bytes: 120 },
      { id: 'e2', job: 'job-7', command: 'backup.sh', account: 'svc-a', principal: 'runner-17', minute: 604, bytes: 80 },
      { id: 'e3', job: 'job-7', command: 'backup.sh', account: 'svc-a', principal: 'runner-17', minute: 625, bytes: 50 },
      { id: 'e4', job: 'job-7', command: 'backup.sh', account: 'svc-a', principal: null, minute: 605, bytes: 30 },
    ],
  };
  const changes = {
    goal: 'Reconcile job-7 activity with new identity and change records',
    success_criteria: ['Account for every supplied event and byte; distinguish approved scope from unresolved activity'],
    non_goals: ['No live defense, disabling, credential changes or execution authorization'],
    sources: {
      keep: closure.map((s: any) => s.source_binding),
      add: [note(transferLocator, transferRecord, 'derived_interpretation'), note(inputLocator, inputs)],
      omitted_sources: [{ source_binding: unrelated.source_binding, reason: 'Unrelated origin material; retain it only in its original task history' }],
    },
  };
  const args = { repositoryRoot: root, expectedSnapshotBinding: selected.snapshot, changes };
  await refused('foreign or unavailable selected dependency cannot transfer', () => raw('augnes_preview_repository_new_work', {
    ...args, changes: { ...changes, sources: { ...changes.sources, keep: [zero, ...changes.sources.keep.slice(1)] } },
  }));
  await refused('ninth note cannot evict unrelated origin material', () => raw('augnes_preview_repository_new_work', {
    ...args, changes: { ...changes, sources: { ...changes.sources, keep: selected.sources.map((s: any) => s.source_binding), omitted_sources: [] } },
  }));
  await refused('retained references cannot cross the new-task API', () => raw('augnes_preview_repository_new_work', {
    ...args, changes: { ...changes, sources: { ...changes.sources, retained_source_refs: hits.map(h => h.source) } },
  }));
  const preview = await call('augnes_preview_repository_new_work', args);
  setSaveFailure(true);
  await refused('recipient creation rolls back atomically', () => raw('augnes_prepare_repository_new_work', { ...args, previewBinding: preview.preview_binding }));
  setSaveFailure(false);
  const saved = await call('augnes_prepare_repository_new_work', { ...args, previewBinding: preview.preview_binding });
  const recipient = await choice('read'), current = await readCurrent();
  const resume = await call('augnes_resume_repository', { repositoryRoot: root });
  assert.deepEqual(resume.continuity.current_work.previous_preparation, {
    goal: origin.work.goal, packet_fingerprint: ready.packet, marked_complete: false,
  });
  assert.equal(resume.continuity.managed_execution.stage, 'no_run');
  assert.equal(resume.continuity.latest_result.state, 'no_result');
  for (const row of historicalRows) {
    assert.equal((db.prepare('SELECT payload_json FROM vnext_core_records WHERE record_id = ?').get(row.record_id) as typeof row).payload_json, row.payload_json);
  }
  assert.notEqual(recipient.manual_contribution.task_identity, m.task_identity);
  assert.notEqual(recipient.work.goal, origin.work.goal);
  assert.equal(recipient.manual_contribution.decision_task, 'different_task');
  assert.equal(recipient.manual_contribution.decision_currentness, 'reassessment_required');
  assert.equal(saved.preparation.prior_work_marked_complete, false);
  assert.equal(current.sources.length, 8);
  for (const source of closure) assert.deepEqual(current.sources.find((s: any) => s.source_binding === source.source_binding), source);
  assert(!JSON.stringify(current).includes(unrelated.excerpt_text));
  assert.equal((await lookup('note-ref:unrelated')).lookup.results.length, 0);
  await refused('origin-only retained reference is inaccessible in recipient', () => raw('augnes_preview_repository_work_revision', {
    repositoryRoot: root, expectedSnapshotBinding: current.snapshot,
    changes: { sources: { retained_source_refs: [hits[0].source] } },
  }));
  save('continuation-transfer', { origin, ready, closure, transferRecord, inputs, args, preview, saved, recipient, resume,
    preserved_origin_records: historicalRows.length, checks: ['closure resolved before task creation', 'no provenance relabeling', 'origin-only lookup stays scoped', 'every original record preserved'] });
}

async function receive() {
  const view = await choice('read'), m = view.manual_contribution, c = await readCurrent();
  const transferSource = find(c, transferLocator), inputSource = find(c, inputLocator);
  const lineage = JSON.parse(transferSource.excerpt_text), inputs = JSON.parse(inputSource.excerpt_text);
  assert.notEqual(m.task_identity, lineage.origin_task);
  assert.equal(m.decision.ref, lineage.decision);
  assert.equal(m.feedback.ref, lineage.feedback);
  assert.equal(m.operating_profile.fingerprint, lineage.operating_profile);
  assert.equal(m.request.value.task, lineage.origin_task);
  assert.equal(m.decision_task, 'different_task');
  await refused('historical judgment cannot prepare current feedback', () => choice('feedback', {}, true), 'execution_choice_manual_reassessment_required');
  const manifest = JSON.parse(m.original.value.content), alert = JSON.parse(m.request.value.material[0].text);
  const prior = JSON.parse(m.downstream[0].text);
  assert.equal(prior.job_and_command_match, manifest.job === alert.job && manifest.command === alert.command);
  assert.equal(manifest.owner, inputs.identity.owner);
  // This result actually combines the historical manifest/alert with new data.
  // Identity records are supplied assertions, not authentication or a grant.
  const rows = inputs.events.map((event: any) => {
    const manifestMatch = event.job === manifest.job && event.command === manifest.command && event.account === alert.service_account;
    const identityMatch = event.account === inputs.identity.account && event.principal !== null && event.principal === inputs.identity.principal;
    const changeMatch = inputs.change.approved === true && event.job === inputs.change.job && event.command === inputs.change.command &&
      event.principal === inputs.change.principal && event.minute >= inputs.change.from && event.minute <= inputs.change.through;
    return { id: event.id, bytes: event.bytes, manifest_match: manifestMatch,
      status: !manifestMatch ? 'manifest_mismatch' : !identityMatch ? 'identity_unresolved' : !changeMatch ? 'approval_unresolved' : 'reconciled' };
  });
  const report = {
    job: manifest.job, owner: manifest.owner, input_revision: inputs.revision, rows,
    total_bytes: rows.reduce((n: number, row: any) => n + row.bytes, 0),
    reconciled_bytes: rows.filter((r: any) => r.status === 'reconciled').reduce((n: number, row: any) => n + row.bytes, 0),
    unresolved_bytes: rows.filter((r: any) => r.status !== 'reconciled').reduce((n: number, row: any) => n + row.bytes, 0),
    retained: 'Original job/command comparison remains valid',
    changed: 'Supplied identity and CR-8 reconcile only matching events within its window',
    declined: manifest.advice, adopted: 'Reconcile only supplied job-7 events',
    remaining: 'e3 approval outside CR-8; e4 actor identity; record authenticity remains unverified',
    execution_authorized: false,
  };
  const resultNote = note(resultLocator, canonical(report), 'derived_interpretation');
  // Keep the entire historical cycle in the recipient's own retained history.
  // A current judgment is authored separately; none of the old notes is edited.
  const calculation = { report: digest(report), total: report.total_bytes, reconciled: report.reconciled_bytes,
    unresolved: report.unresolved_bytes, events: rows.map((r: any) => [r.id, r.bytes, r.status]) };
  await saveChanges({ sources: { deselect: [m.decision.source_ref, m.feedback.source_ref, m.operating_profile.source_ref, m.request.source_ref],
    add: [resultNote, note(calculationLocator, canonical(calculation), 'derived_interpretation')] } });
  const resultRef = find(await readCurrent(), calculationLocator).source_binding;
  const assessment = {
    manual_request_ref: m.request.ref, manual_return_ref: m.original.ref, result_refs: [resultRef], disposition: 'partly_used',
    checks: 'All four events accounted; sum bytes; compare manifest, identity and CR-8 window',
    applicability: 'Supplied job-7 events and identity-change-v2 only', reason: 'Retain manifest equality; reconsider identity/approval; decline disabling',
    uncertainty: 'Record authenticity and unresolved event identity/approval', unfinished: 'Resolve e3 approval and e4 identity; no remediation obligation adopted',
    next_action: 'Request only missing event evidence', reconsider_when: 'Identity, manifest or change records change',
    reassessment: `Different task; historical decision ${lineage.decision}; adopt event reconciliation only`,
  };
  const withoutReassessment = { ...assessment } as any; delete withoutReassessment.reassessment;
  await refused('current use requires explicit separate-task reassessment', () => choice('assess', { assessment: withoutReassessment }, true), 'execution_choice_manual_reassessment_required');
  // The entire report stays selected. The independently bounded decision embeds
  // the complete calculation note, which names that exact report's fingerprint.
  await savePrepared(await choice('assess', { assessment }));
  await savePrepared(await choice('feedback'));
  const final = await choice('read');
  assert.equal(final.manual_contribution.task_identity, m.task_identity);
  assert.equal(final.manual_contribution.decision_task, 'same_task');
  assert.equal(final.manual_contribution.request_task, 'different_task');
  assert.equal(final.manual_contribution.decision_currentness, 'saved_basis_retained');
  assert.notEqual(final.manual_contribution.decision.ref, lineage.decision);
  const oldDecision = await lookup(manualLocator(lineage.decision)), oldFeedback = await lookup(manualLocator(lineage.feedback));
  assert.equal(oldDecision.lookup.results.length, 1); assert.equal(oldFeedback.lookup.results.length, 1);
  assert.equal(oldDecision.lookup.results[0].note.excerpt_text, canonical(m.decision.value));
  assert.equal(oldFeedback.lookup.results[0].note.excerpt_text, canonical(m.feedback.value));
  writeFileSync(path.join(artifactDirectory, 'reconciliation-report.json'), resultNote.text);
  save('continuation-recipient', { initial: view, lineage, inputSource, report, resultNote, final, oldDecision, oldFeedback });
}

async function reopen() {
  const view = await choice('read'), c = await readCurrent(), m = view.manual_contribution;
  const lineage = JSON.parse(find(c, transferLocator).excerpt_text);
  const resume = await call('augnes_resume_repository', { repositoryRoot: root });
  assert.deepEqual(resume.continuity.current_work.previous_preparation, {
    goal: lineage.origin_goal, packet_fingerprint: lineage.predecessor_packet, marked_complete: false,
  });
  assert.equal(resume.continuity.managed_execution.stage, 'no_run');
  assert.equal(resume.continuity.latest_result.state, 'no_result');
  const reportSource = find(c, resultLocator), report = JSON.parse(reportSource.excerpt_text);
  const previous = await lookup(manualLocator(lineage.decision));
  assert.equal(previous.lookup.results.length, 1);
  assert.equal(JSON.parse(previous.lookup.results[0].note.excerpt_text).basis.task, lineage.origin_task);
  assert.equal(m.decision_currentness, 'saved_basis_retained');
  assert.equal(m.operating_profile.selection, 'historical_not_selected');
  assert.equal(m.request.value.task, lineage.origin_task);
  assert.notEqual(m.task_identity, lineage.origin_task);
  assert.equal(JSON.parse(m.downstream[0].text).report, digest(report));
  writeFileSync(path.join(artifactDirectory, 'reopened-report.json'), reportSource.excerpt_text);
  save('continuation-reopened', { view, sources: c, lineage, report, historical_decision: previous, resume });
}

async function boundaries() {
  const before = await choice('read'), m = before.manual_contribution, c = await readCurrent();
  const actual = await call('augnes_read_repository_work_sources', { repositoryRoot: root, expectedSnapshotBinding: c.snapshot, includeWorkDefinition: true });
  const priorBytes = db.serialize();
  // Transport fault controls use the production reader over actual persisted
  // source projection; no mutation or fabricated stored source is introduced.
  for (const fault of ['missing', 'changed']) {
    const result: any = await (prepareExecutionChoice as any)({ action: 'read', repositoryRoot: root, expectedSnapshotBinding: c.snapshot }, {
      readSources: async () => actual, review: async () => ({ status: 'available', connections: [] }),
      lookupRetained: async (args: any) => {
        const r = await call('augnes_lookup_repository_retained_sources', args);
        if (args.query.startsWith('note-ref:operating-profile:')) {
          if (fault === 'missing') r.lookup.results = [];
          else r.lookup.results[0].note.excerpt_text += ' ';
        }
        return r;
      },
    });
    assert.equal(result.reason, fault === 'missing' ? 'execution_choice_manual_profile_material_unavailable' : 'execution_choice_manual_profile_identity_mismatch');
    assert(priorBytes.equals(db.serialize()));
    save('dependency-' + fault, result);
  }
  const exact = await exactRetained(profileLocator(m.operating_profile.fingerprint), m.operating_profile.source_ref);
  await saveChanges({ sources: { retained_source_refs: [exact.source], deselect: [m.original.source_ref] } });
  assert.equal((await choice('read')).manual_contribution.operating_profile.selection, 'currently_selected');
  const current = await readCurrent(), inputs = find(current, inputLocator);
  const prepared = { repositoryRoot: root, expectedSnapshotBinding: current.snapshot, changes: { sources: { add: [note('note-ref:pending-revision', 'No stale save', 'derived_interpretation')], deselect: [m.feedback.source_ref] } } };
  const preview = await call('augnes_preview_repository_work_revision', prepared);
  const correction = JSON.parse(inputs.excerpt_text); correction.revision = 'identity-change-v3'; correction.change.through = 630;
  await saveChanges({ sources: { replace: [{ source_binding: inputs.source_binding, note: note(inputLocator, correction) }] } });
  await refused('changed recipient inputs invalidate held save', () => raw('augnes_save_repository_work_revision', { ...prepared, previewBinding: preview.preview_binding }));
  await refused('changed recipient basis requires a new use decision', () => choice('feedback', {}, true), 'execution_choice_manual_reassessment_required');
  const stale = await choice('read');
  assert.equal(stale.manual_contribution.decision_currentness, 'reassessment_required');
  assert.equal(stale.manual_contribution.task_identity, m.task_identity);
  const changed = find(await readCurrent(), inputLocator);
  await saveChanges({ sources: { replace: [{ source_binding: changed.source_binding, note: note(inputLocator, inputs.excerpt_text) }] } });
  const restored = await choice('read');
  assert.equal(restored.manual_contribution.decision_currentness, 'saved_basis_retained');
  assert.equal(restored.manual_contribution.task_identity, m.task_identity);
  save('continuation-boundaries', { before, stale, restored, exact_reselection: exact, provider_calls: 0 });
}

const roles: Record<string, () => Promise<void>> = { transfer, recipient: receive, reopen, boundary: boundaries };
assert(roles[mode]);
void setupServer().then(roles[mode]).finally(finish);
