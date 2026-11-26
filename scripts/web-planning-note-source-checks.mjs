import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { compareNoteContext, planningDraft, selectHistoricalNote } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { openFileProject, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { canonicalChildAcceptanceFailure, runCanonicalChild } from './canonical-child-runner.mjs';
import { projectAgentSession } from './web-planning-project-checks.mjs';

export async function checkNoteSource({ start, root, passed }) {
  const server = await start('saved-note-source');
  await projectAgentSession(server, 'A', async () => {
    const project = await openFileProject();
    async function create(goal, texts) {
      const notes = texts.map(text => ({ text, source: 'Print shop', label: 'Next check', observed_at: null, provenance: 'user_declaration' }));
      const input = { definition: { goal, success_criteria: ['Check the edition'], non_goals: [] }, notes };
      const { work_id, ticket } = await (await project.request('/api/drafts', input)).json();
      const { saved } = await (await project.request('/api/work/' + work_id + '/save', { ...input, ticket })).json();
      const setup = path.join(root, work_id + '.json');
      await writeFile(setup, JSON.stringify({ format: 'augnes_web_file_task.v1', origin: server.origin,
        workspace_id: saved.workspace_id, project_id: saved.project_id, work_id }));
      return { saved, setup, client: (await openFileTask(setup)).planning };
    }
    async function save(client, head, draft) {
      return (await client.save(await client.prepare(headBinding(head), draft))).saved;
    }
    const instruction = 'Pack the edition.', proof = 'Inspect the proof.';
    const first = 'Check the ink sample.', second = 'Check the calibration sheet.';
    const source = await create('Press record', [instruction, proof, first, second]);
    const entries = source.saved.sources;
    const index = text => entries.findIndex(entry => entry.bounded_summary === text);
    const ref = text => entries[index(text)].source_ref;
    assert.equal(source.saved.relations, undefined);
    const withLinks = planningDraft(source.saved);
    withLinks.material_edits[index(instruction)].dependencies = [index(proof), index(first), index(second)];
    withLinks.material_edits[index(proof)].dependencies = [index(first)];
    const basis = await save(source.client, source.saved, withLinks);
    const legacy = await source.client.checkNoteSource(1, index(instruction) + 1);
    assert.equal(legacy.changes.length, 4);
    assert(legacy.changes.every(change => change.kind === 'requirement_added'));

    const destination = await create('Dispatch instructions', []);
    const copy = selectHistoricalNote(planningDraft(destination.saved), destination.saved, basis, ref(instruction));
    const retained = await save(destination.client, destination.saved, copy);
    const number = retained.sources.findIndex(entry => entry.source_ref === ref(instruction)) + 1;
    const check = () => destination.client.checkNoteSource(retained.revision, number);
    const revisedGoal = planningDraft(basis);
    revisedGoal.definition.goal = 'Archive the print run';
    const renamed = await save(source.client, basis, revisedGoal);
    const unchanged = await check();
    assert.deepEqual(unchanged.basis, { ...reference(basis), source_ref: ref(instruction) });
    assert.deepEqual(unchanged.head, reference(renamed));
    assert.equal(unchanged.status, 'same_recorded_context');
    assert.deepEqual(unchanged.changes, []);

    // All four note identities, the root's direct requirements and the set
    // of reachable notes stay identical. Only the proof's requirement changes.
    const rewired = planningDraft(renamed);
    rewired.material_edits[index(proof)].dependencies = [index(second)];
    const changed = await save(source.client, renamed, rewired);
    assert.deepEqual(changed.sources, basis.sources);
    const instructionAt = revision => revision.relations.materials.find(material => material.source_ref === ref(instruction));
    assert.deepEqual(instructionAt(changed), instructionAt(basis));
    const delta = await check();
    assert.deepEqual(delta.selected, { ...reference(retained), source_ref: ref(instruction) });
    assert.deepEqual(delta.head, reference(changed));
    assert.equal(delta.status, 'recorded_context_changed');
    assert.deepEqual(delta.changes, [
      { kind: 'requirement_removed', source_ref: ref(proof), required_ref: ref(first) },
      { kind: 'requirement_added', source_ref: ref(proof), required_ref: ref(second) },
    ]);
    assert.equal(delta.notes[ref(second)].text, second);
    let output = '', errors = '';
    const run = await runCanonicalChild({ suite: 'web-planning', label: 'check-note-source', command: process.execPath,
      args: ['apps/augnes_apps/scripts/file-exchange.mjs', destination.setup, 'check-note-source', String(retained.revision), String(number)],
      cwd: path.resolve('.'), env: process.env, timeoutMs: 10000,
      stdout: { write: chunk => { output += chunk; } }, stderr: { write: chunk => { errors += chunk; } } });
    assert.equal(canonicalChildAcceptanceFailure(run, { requireNaturalExit: true }), null, errors);
    assert.deepEqual(JSON.parse(output), delta);

    const logs = await create('Calibration log', [second]);
    const relink = selectHistoricalNote(planningDraft(changed), changed, logs.saved, ref(second));
    const relinked = await save(source.client, changed, relink);
    const origin = await source.client.checkNoteSource(changed.revision, index(instruction) + 1);
    assert.deepEqual(origin.changes, [{ kind: 'origin_changed', source_ref: ref(second),
      before: { kind: 'authored', from: null }, after: { kind: 'inherited', from: { ...reference(logs.saved), source_ref: ref(second) } } }]);
    // The deeper origin is a recorded identity. Reading it is unnecessary.
    await project.request('/api/work/' + logs.saved.work_id + '/erase', { expected: headBinding(logs.saved), confirm: 'erase-whole-work' });
    assert.deepEqual(await source.client.checkNoteSource(changed.revision, index(instruction) + 1), origin);
    const history = await source.client.history();
    assert.throws(() => compareNoteContext(history, { ...delta.basis, fingerprint: relinked.fingerprint }), /historical_note_unavailable/);

    const changedAuthor = planningDraft(relinked);
    changedAuthor.notes[index(instruction)].source = 'Different notebook';
    const replaced = await save(source.client, relinked, changedAuthor);
    assert.equal((await check()).status, 'note_not_selected');
    await project.request('/api/work/' + replaced.work_id + '/erase', { expected: headBinding(replaced), confirm: 'erase-whole-work' });
    await assert.rejects(check, /work_erased/);
    assert.deepEqual(await destination.client.current(), retained);
  });
  passed('saved note source comparison through the owner client and fresh CLI: legacy notes, transitive edge replacement, changed origin, same-text replacement and unavailable source');
}
