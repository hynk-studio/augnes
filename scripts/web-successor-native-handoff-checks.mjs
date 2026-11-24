import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { digest, openFileContinuation, openFileProjects, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { readCodexRepositoryContinuityV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-continuity.ts';
import { readCodexRepositoryWorkSourcesV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-work-sources.ts';
import { reviseCodexRepositoryWorkV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-work-revision.ts';
import { startLocal } from './web-planning-local-runtime.mjs';
import { projectBindings, projectSession, projectOk, projectAgentSession } from './web-planning-project-checks.mjs';

// Each read opens a fresh SQLite connection through the same scoped readers
// used by the local Operator. The fixture supplies its private test channel.
async function readNativeTask(dbPath, repository_root) {
  const reader = new Database(dbPath, { readonly: true });
  try {
    const { continuity } = await readCodexRepositoryContinuityV01(reader, { repository_root });
    const task = await readCodexRepositoryWorkSourcesV01(reader, {
      repository_root, expected_snapshot_binding: continuity.snapshot.binding, include_work_definition: true,
    });
    assert.equal(task.status, 'available');
    assert.ok(task.task_identity);
    return task;
  } finally { reader.close(); }
}

const scenarios = [
  { report: 'The venue reports Tuesday is available.', proposed: 'Send the notice.',
    decision: 'The local editor will prepare a draft and confirm the booking before sending.' },
  { report: 'Correction from the venue: Tuesday was declined.', proposed: 'Cancel the workshop.',
    decision: 'The local editor will hold the notice and request another date; the workshop remains open.' },
];
const decisionFor = new Map(scenarios.map(s => [s.report, s.decision]));

export async function checkWebSuccessorNativeHandoff({ root, code, db, target, channel, op, request }) {
  async function saveSources(current, sources) {
    const input = { repository_root: target.root, action: 'preview', expected_snapshot_binding: current.snapshot_binding, changes: { sources } };
    const preview = await reviseCodexRepositoryWorkV01(db, input, channel);
    assert.equal(preview.status, 'previewed');
    const saved = await reviseCodexRepositoryWorkV01(db, { ...input, action: 'save', preview_binding: preview.preview_binding }, channel);
    assert.equal(saved.status, 'saved');
  }
  const initial = await readNativeTask(db.name, target.root);
  const outstanding = { source: 'note-ref:workshop-room', text: 'Confirm the room before releasing the notice.',
    observed_at: null, provenance: 'user_declaration', label: 'Open question' };
  await saveSources(initial, { add: [outstanding] });
  const original = await readNativeTask(db.name, target.root);
  assert.equal(original.task_identity, initial.task_identity);
  const obligation = original.sources.find(n => n.source_locator === outstanding.source).excerpt_text;
  const originalTexts = original.sources.map(n => n.excerpt_text);
  const brief = original.work_definition.goal + '\n' + original.work_definition.success_criteria.join('\n');
  const upload = (name, text) => ({ name, role: 'source', data: Buffer.from(text).toString('base64') });
  await mkdir(root);
  const server = await startLocal({ root, code, bindings: { ...projectBindings(), PROJECT_ADMITTED_EMAILS: '[]',
    PUBLIC_SUCCESSION_MODE: 'verified-email-home-v1' } });
  try {
    const account = await projectSession(server, 'A');
    const created = await projectOk(account, '/api/projects', { request_key: randomUUID(), name: 'Workshop handoff',
      purpose: original.work_definition.goal, judgment: { text: 'Room confirmation pending.', source: 'Local workshop draft' },
      unfinished: obligation, next_action: 'Ask the successor to check the room.' });
    const project = created.project, workId = created.saved.work_id, work = '/api/work/' + workId;
    const owner = await projectSession(server, 'A', project);
    async function saveFiles(base, files) {
      const draft = { ...planningDraft(base), files };
      const { ticket } = await projectOk(owner, work + '/ticket', { ...draft, expected: headBinding(base) });
      return (await projectOk(owner, work + '/save', { ...draft, ticket })).saved;
    }
    const first = await saveFiles(created.saved, [upload('brief.md', brief)]);
    const grant = await projectOk(owner, work + '/continuation/create', { grant_id: randomUUID(),
      expected: headBinding(first), recipient: server.env.LOCAL_PARTICIPANT_LOGIN, obligation,
      expires: Date.now() + 3600000, max_updates: 2, confirm: 'share-this-work-history' });
    const recipientSetup = path.join(root, 'shared.json'), ownerSetup = path.join(root, 'owner.json');
    await projectAgentSession(server, 'B', async () => {
      const home = await openFileProjects();
      const { items } = await home.shared();
      assert.deepEqual(items.map(item => [item.work_id, item.goal, item.obligation]), [[workId, original.work_definition.goal, obligation]]);
      await writeFile(recipientSetup, JSON.stringify(await home.sharedSetup(items[0].grant_id)));
    });
    await writeFile(ownerSetup, JSON.stringify({ format: 'augnes_web_file_task.v1', origin: server.origin,
      workspace_id: project.workspace_id, project_id: project.project_id, work_id: workId }));
    const ownerHistory = () => projectAgentSession(server, 'A', async () => (await openFileTask(ownerSetup)).planning.history());
    async function importFile(occurrence, name) {
      const bundle = await projectOk(owner, work + '/export');
      assert.equal(bundle.format, 'web_planning_export.v0.10');
      const head = bundle.revisions.at(-1);
      assert.deepEqual(reference(head), reference(occurrence));
      const selected = head.files.find(f => f.name === name);
      const basis = (await op(target, 'read')).material_basis;
      const saved = await op(target, 'import_web_export', request(target, bundle, randomUUID(), [selected]), basis);
      const material = (await op(target, 'material', { ref: saved.files[0].material_ref })).material;
      const experience = (await op(target, 'read_experience', { ref: saved.experience_ref })).experience;
      assert.equal(experience.payload.sources[0].web.revision_fingerprint, head.fingerprint);
      const result = await op(target, 'retrieve_sources', { corpus_ref: saved.corpus_ref,
        expected_corpus_binding: saved.corpus_binding, query: 'Web export' });
      assert.equal(result.results.length, 1);
      assert.equal(result.results[0].source.adoption, 'unknown');
      return { ref: material.ref, text: Buffer.from(material.base64, 'base64').toString(), delivered: result.results[0] };
    }

    const reports = [];
    let selectedTexts = originalTexts;
    for (const scenario of scenarios) {
      const submitted = await projectAgentSession(server, 'B', async () => {
        const client = await openFileContinuation(recipientSetup), before = await client.read();
        const attachment = await client.readAttachment(before.saved, 'files', 0);
        assert.equal(attachment.bytes.toString(), brief);
        return (await client.save({ request_key: randomUUID(), expected: headBinding(before.saved),
          report: scenario.report, next_action: scenario.proposed })).saved;
      });
      // Discover the successor update from the owner's own work history. The
      // submitting client supplies no reference or report to that reader.
      const history = await ownerHistory();
      const observed = history.findLast(revision => revision.continuation);
      assert.deepEqual(reference(observed), reference(submitted));
      const update = observed.continuation;
      assert.equal(update.principal_ref, digest(server.env.LOCAL_PARTICIPANT_LOGIN));
      assert.equal(update.issuer_ref, digest(server.env.OWNER_EMAIL));
      assert.equal(observed.author_ref, project.author_ref);
      assert.equal(update.obligation, obligation);
      const copy = await importFile(observed, 'brief.md');
      assert.equal(copy.text, brief);
      for (const field of [update.report, update.next_action, update.obligation]) {
        assert(!JSON.stringify(copy.delivered).includes(field));
        assert(!copy.text.includes(field));
      }
      const current = await readNativeTask(db.name, target.root);
      assert.deepEqual(current.sources.map(n => n.excerpt_text).sort(), [...selectedTexts].sort());
      const decision = decisionFor.get(update.report);
      assert.equal(decision, scenario.decision);
      const source = 'note-ref:' + observed.fingerprint.slice(7);
      const citation = `Web ${observed.workspace_id}/${observed.project_id}/${workId}, revision ${observed.revision}, ${observed.fingerprint}`;
      const reported = `${citation}\nReported by ${update.principal_ref}: ${update.report}\nObligation: ${update.obligation}\nProposed: ${update.next_action}`;
      const local = `${citation}\nLocal next action: ${decision}`;
      const localNote = { source, text: local, observed_at: null, provenance: 'derived_interpretation', label: 'Next check' };
      const sources = { add: [{ source, text: reported, observed_at: observed.recorded_at, provenance: 'imported_unverified', label: 'Open question' }] };
      const previous = current.sources.find(n => n.review_label === 'Next check');
      if (previous) sources.replace = [{ source_binding: previous.source_binding, note: localNote }];
      else sources.add.push(localNote);
      await saveSources(current, sources);
      const reopened = await readNativeTask(db.name, target.root);
      assert.equal(reopened.task_identity, original.task_identity);
      assert.deepEqual(reopened.work_definition, original.work_definition);
      reports.push(reported);
      selectedTexts = [...originalTexts, ...reports, local];
      assert.deepEqual(reopened.sources.map(n => n.excerpt_text).sort(), [...selectedTexts].sort());
      assert.deepEqual(reopened.sources.filter(n => n.review_label === 'Next check').map(n => n.excerpt_text), [local]);
      assert.equal(reopened.sources.find(n => n.excerpt_text === reported).trust_class, 'imported_unverified');
      assert.equal(reopened.sources.find(n => n.excerpt_text === local).trust_class, 'derived_interpretation');
    }
    // Explicit offline disclosure remains historical after Web access ends.
    const history = await ownerHistory();
    assert.deepEqual(history.filter(r => r.continuation).map(r => r.continuation.report), scenarios.map(s => s.report));
    const head = (await projectOk(owner, work)).saved;
    const curated = await saveFiles(head, [...head.files, upload('handoff.md', reports.at(-1))]);
    const copy = await importFile(curated, 'handoff.md');
    assert.equal(copy.text, reports.at(-1));
    await projectOk(owner, work + '/continuation/revoke', { grant_id: grant.id });
    await projectAgentSession(server, 'B', async () => {
      assert.deepEqual((await (await openFileProjects()).shared()).items, []);
      await assert.rejects(openFileContinuation(recipientSetup), /continuation_unavailable|access_denied|scope_denied/);
    });
    const retained = (await op(target, 'material', { ref: copy.ref })).material;
    assert.equal(Buffer.from(retained.base64, 'base64').toString(), reports.at(-1));
    assert.equal(server.externalRequests(), 0);
  } finally { await server.close(); }
}
