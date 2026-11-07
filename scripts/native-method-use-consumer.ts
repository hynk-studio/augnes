// Fresh C: ordinary registered project entry, saved task, permitted corpus.
// No import/read of the producer, evaluator, expected output or prior conversation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { EXTERNAL_TOOL } from '../plugins/augnes-operator/mcp/external-response.mjs';
import { retrieveForSuccessor, recheckBeforeUse } from './selected-source-use.mjs';
import { checkDeclarations, sha256 } from '../examples/native-method-use/check-declarations.mjs';
import { mode, directory, artifactDirectory, save, call, saveChanges, note, setupServer, finish, find } from './execution-choice-transition-harness';

async function consume() {
  const { repositoryRoot } = JSON.parse(readFileSync(path.join(directory, 'consumer-entry.json'), 'utf8'));
  const read = async () => {
    const r = await call('augnes_resume_repository', { repositoryRoot });
    return call('augnes_read_repository_work_sources', { repositoryRoot, expectedSnapshotBinding: r.continuity.snapshot.binding, includeWorkDefinition: true });
  };
  const view = await read(), task = JSON.parse(find(view, 'note-ref:package-task').excerpt_text), entry = JSON.parse(find(view, 'note-ref:selected-method-entry').excerpt_text);
  assert.match(view.task_identity, /^sha256:[a-f0-9]{64}$/);
  const op = (action: string, data: object) => call(EXTERNAL_TOOL, { repository_root: repositoryRoot, action, data });
  const delivery = await retrieveForSuccessor(op, entry.corpus_ref, entry.query);
  assert(!delivery.truncated && delivery.results.length === 1);
  const group = delivery.results[0];
  const selected = group.materials.find((m: any) => m.metadata.version === 'package-declarations.v1');
  assert(selected, 'No selected permitted method');
  const bytes = Buffer.from(selected.base64, 'base64'); assert.equal('sha256:' + sha256(bytes), selected.metadata.sha256);
  const method = JSON.parse(bytes.toString());
  const original = group.materials.find((m: any) => m.ref === method.source.report_ref);
  assert(original && sha256(Buffer.from(original.base64, 'base64')) === method.source.sha256);
  // These are bounded authored interpretation rules for this consumer, not
  // an Augnes policy engine or proof of authenticated commissioning authority.
  const authorized = task.authority.permitted_action === 'local declaration check and saved output only' && task.authority.install === false && task.authority.commissioning === false;
  const applicable = authorized && task.purpose === method.purpose && group.corrections.length === 0;
  await recheckBeforeUse(op, delivery, entry.query);
  const output = applicable ? checkDeclarations(task.candidate, task.target, method) : {
    input_sha256: sha256(task.candidate), target: task.target, outcome: 'not_applicable',
    reason: authorized ? 'Task needs live-runtime evidence outside this method' : 'Current authored authority does not permit this action', runtime_compatibility: 'NOT_TESTED'
  };
  const content = JSON.stringify(output) + '\n';
  const disposition = applicable && output.outcome !== 'not_applicable' ? 'adapt' : 'non_use';
  const judgment = { author: 'Fresh controlled C process', task_identity: view.task_identity, disposition,
    method: selected.ref, experience: group.experience.ref, source: method.source, corpus_binding: delivery.corpus_binding,
    authority: task.authority, applicability: applicable ? 'Same bounded declaration question; new input/version/target rechecked' : 'Unsuitable purpose or unresolved conditions',
    reason: disposition === 'adapt' ? 'Use the conditional procedure on C inputs; do not adopt A result' : 'Retain original method without making a runtime claim',
    output_sha256: sha256(content), limitations: 'No install/runtime verification or independent participation', next_action: disposition === 'adapt' ? 'Request separately authorized runtime testing if needed' : 'Select a method and authority covering the new question' };
  await recheckBeforeUse(op, delivery, entry.query);
  const materialState = await op('read', {}), body = Buffer.from(content);
  const stored = await call(EXTERNAL_TOOL, { repository_root: repositoryRoot, action: 'put_material', expected_material_ref: materialState.material_basis, data: {
    metadata: { name: 'c-declaration-report.json', media_type: 'application/json', version: 'c-declaration-result.v1', source: `Current C judgment of ${selected.ref}`, applicability: 'Only supplied declarations and target', dependencies: [selected.ref, original.ref], sha256: 'sha256:' + sha256(body), size: body.length }, base64: body.toString('base64')
  } });
  const outputNote = note('note-ref:current-checked-artifact', JSON.stringify({ material_ref: stored.material_ref, ...output }), 'derived_interpretation');
  const judgmentNote = note('note-ref:current-method-judgment', JSON.stringify(judgment), 'derived_interpretation');
  const changes: any = { add: [], replace: [] };
  for (const n of [outputNote, judgmentNote]) {
    const prior = find(view, n.source);
    if (prior) changes.replace.push({ source_binding: prior.source_binding, note: n }); else changes.add.push(n);
  }
  await saveChanges({ sources: changes }, false, repositoryRoot);
  const saved = await read();
  assert.equal(find(saved, judgmentNote.source).excerpt_text, judgmentNote.text);
  const reread = await op('material', { ref: stored.material_ref });
  assert.equal(Buffer.from(reread.material.base64, 'base64').toString(), content);
  writeFileSync(path.join(artifactDirectory, `${mode}-output.json`), content);
  save(`${mode}-delivery`, delivery);
  save(`${mode}-judgment`, judgment);
  save(`${mode}-saved`, saved);
  save(`${mode}-process`, { pid: process.pid, parent_pid: process.ppid, task_identity: view.task_identity, entry: repositoryRoot, output_ref: stored.material_ref, output_bytes: body.length, received_bytes: Buffer.byteLength(JSON.stringify(delivery)), provider_calls: 0, judgment_origin: 'Deterministic authored rules; no model or evaluator oracle' });
}
process.env.AUGNES_EXTERNAL_CONFIG_FILE = path.join(directory, 'external.json');
void setupServer().then(consume).catch(error => { console.error(error); process.exitCode = 1; }).finally(finish);
