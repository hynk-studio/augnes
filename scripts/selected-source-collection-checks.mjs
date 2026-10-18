// One exposed workflow, extending the real Web writer/import/recovery test.
// Expected text and locators stay here, never in successor task input.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { canonical, hashBytes } from '../lib/vnext/external-response-rules.mjs';
import { SELECTED_CORPUS_VERSION } from '../lib/vnext/selected-source-retrieval.mjs';
import { recheckBeforeUse } from './selected-source-use.mjs';

export async function exerciseSelectedCollections({ target, other, first, next, unrelatedExport, request, op, consume,
  refuses, basis, addCorrectionSource, state, keep, configureTarget, db }) {
  const started = performance.now();
  const query = 'What should visitors know about the library workshop?';
  const task = { query, heading: 'Workshop notice: staff review', applies_to: 'East Library workshop notice' };
  const literalInspection = await op(target, 'inspect_corpus', { corpus_ref: first.corpus_ref });
  const literal = await op(target, 'retrieve_sources', { corpus_ref: first.corpus_ref, query,
    expected_corpus_binding: literalInspection.corpus_binding });
  assert.equal(literal.returned_groups, 0, 'ordinary question fails the retained literal AND contract');
  keep('collection/literal-baseline.json', literal);
  const create = { key: 'workshop-collection', collection_ref: null, expected_head: null,
    name: 'Workshop source folder', corpus_refs: [first.corpus_ref] };
  const initial = await op(target, 'collect_sources', create, basis);
  const collection = initial.collection_ref;
  const before = await consume('collection-before', target, null, { ...task, collection });
  assert(before.text.includes('18:00')); assert.equal(before.used.length, 1);
  const initialInspection = await op(target, 'inspect_corpus', { collection_ref: collection });
  const addition = { ...create, key: 'workshop-add-revision', collection_ref: collection,
    expected_head: initial.acknowledged_head, corpus_refs: [next.corpus_ref] };
  const added = await op(target, 'collect_sources', addition, basis);
  assert.equal(added.collection_ref, collection); assert.equal(added.selected_groups, 2);
  let prior = state();
  assert.equal((await op(target, 'collect_sources', addition, basis)).status, 'exact_replay'); assert.equal(state(), prior);
  assert.equal((await op(target, 'collect_sources', create, basis)).acknowledged_head, initial.acknowledged_head); assert.equal(state(), prior);
  await refuses('collection_conflicting_replay', () => op(target, 'collect_sources', { ...addition, corpus_refs: [first.corpus_ref] }, basis), /replay_conflict/);
  await refuses('collection_stale_addition', () => op(target, 'collect_sources', { ...addition, key: 'stale' }, basis), /head_changed/);
  await refuses('collection_stale_use', () => recheckBeforeUse((action, data) => op(target, action, data), { ...initialInspection, query_mode: 'question' }, query), /basis_changed/);
  await refuses('collection_other_project', () => op(other, 'inspect_corpus', { collection_ref: collection }), /access_refused/);
  const updated = await consume('collection-added-revision', target, null, { ...task, collection });
  assert(updated.text.includes('18:00') && updated.text.includes('19:00'));
  assert(updated.text.includes('recency does not establish supersession')); assert.equal(updated.used.length, 2);
  // Add an actually selected but non-applicable Web file. No corpus rebuilding.
  const gardenFile = unrelatedExport.data.revisions.at(-1).files.filter(f => f.name === 'unrelated.txt');
  const garden = await op(target, 'import_web_export', { ...request(target, unrelatedExport.data, 'selected-garden', gardenFile), applicability: 'Roof garden maintenance' }, basis);
  const gardenAdd = { ...addition, key: 'garden-addition', expected_head: added.acknowledged_head, corpus_refs: [garden.corpus_ref] };
  const expanded = await op(target, 'collect_sources', gardenAdd, basis);
  assert.equal(expanded.selected_groups, 3);
  const irrelevant = await consume('collection-unrelated', target, null, { ...task, collection });
  assert.equal(irrelevant.output_sha256, updated.output_sha256); assert.deepEqual(irrelevant.used, updated.used);
  const gardenInspection = await op(target, 'inspect_corpus', { collection_ref: collection });
  const foundGarden = await op(target, 'retrieve_sources', { collection_ref: collection, query: 'What needs watering in the garden?', query_mode: 'question', expected_corpus_binding: gardenInspection.corpus_binding });
  assert(foundGarden.results.some(g => g.experience.ref === garden.experience_ref), 'acknowledged unrelated addition is searchable for its own task');
  const duplicate = await op(target, 'collect_sources', { ...gardenAdd, key: 'duplicate-selection', expected_head: expanded.acknowledged_head }, basis);
  assert.equal(duplicate.corpus_ref, expanded.corpus_ref); assert.equal(duplicate.selected_groups, 3);

  const current = await addCorrectionSource(); basis = current.material_basis;
  const correctionRefs = [];
  for (const [key, statement] of [
    ['time-update', 'For the East Library workshop, the organizer corrects the start to 19:00. Seat reservations at the front desk remain applicable.'],
    ['unresolved-time', 'A conflicting staff note lists 20:00 for this workshop. The discrepancy with the organizer remains unresolved; confirm before publishing.'],
  ]) {
    const correction = await op(target, 'correct', { key, target_ref: first.experience_ref, topic: 'Workshop start time', statement,
      source_refs: [current.sources.find(s => s.source_locator === 'note-ref:workshop-correction').source_binding], targets: [] }, basis);
    correctionRefs.push(correction.record.ref);
  }
  await refuses('collection_correction_changes_binding', () => op(target, 'retrieve_sources', { collection_ref: collection, query, query_mode: 'question', expected_corpus_binding: gardenInspection.corpus_binding }), /basis_changed/);
  const corrected = await consume('collection-corrections', target, null, { ...task, collection });
  assert(corrected.text.includes('19:00') && corrected.text.includes('20:00') && corrected.text.includes('unresolved'));
  assert(corrected.text.includes('Reserve a seat at the front desk.')); assert.notEqual(corrected.output_sha256, irrelevant.output_sha256);
  assert(corrected.used.some(u => correctionRefs.every(r => u.correction_refs.includes(r))));
  assert(corrected.used.some(u => u.experience_ref === next.experience_ref && u.correction_refs.length === 0));
  const outside = await consume('collection-outside', target, null, { ...task, collection, applies_to: 'West Library opening notice' });
  assert.equal(outside.status, 'unknown'); assert.deepEqual(outside.used, []);
  const direct = await consume('collection-direct', target, null, { ...task, collection, direct_collection: true });
  assert.equal(direct.output_sha256, corrected.output_sha256); assert.deepEqual(direct.used, corrected.used);
  const workflowStorage = db.prepare('SELECT COUNT(*) materials,SUM(length(body)) body_bytes FROM vnext_external_materials').get();

  configureTarget(false);
  await refuses('collection_configuration_withdrawal', () => op(target, 'inspect_corpus', { collection_ref: collection }), /access_refused/);
  configureTarget(true);
  const inspection = await op(target, 'inspect_corpus', { collection_ref: collection });
  const miss = await op(target, 'retrieve_sources', { collection_ref: collection, query: 'Where is the telescope?', query_mode: 'question', expected_corpus_binding: inspection.corpus_binding });
  assert.equal(miss.returned_groups, 0); assert(miss.qualifications.some(q => q.includes('not global absence')));
  await refuses('collection_empty_question', () => op(target, 'retrieve_sources', { collection_ref: collection, query: 'What should we do?', query_mode: 'question', expected_corpus_binding: inspection.corpus_binding }), /query_invalid/);
  await refuses('collection_term_bound', () => op(target, 'retrieve_sources', { collection_ref: collection, query: 'alpha beta gamma delta epsilon zeta eta theta iota', query_mode: 'question', expected_corpus_binding: inspection.corpus_binding }), /query_invalid/);
  const manifest = await op(target, 'material', { ref: first.corpus_ref });
  const conflicting = JSON.parse(Buffer.from(manifest.material.base64, 'base64').toString()); conflicting.groups[0].source.meaning = 'claim';
  const body = Buffer.from(canonical(conflicting));
  const conflict = await op(target, 'put_material', { metadata: { ...manifest.material.metadata, sha256: hashBytes(body), size: body.length }, base64: body.toString('base64') }, basis);
  await refuses('collection_conflicting_source_declaration', () => op(target, 'collect_sources', { ...gardenAdd, key: 'conflicting-source', expected_head: duplicate.acknowledged_head, corpus_refs: [conflict.material_ref] }, basis), /source_conflict/);
  // Existing 16-group contract: no admission silently drops a seventeenth group.
  const dummyGroups = Array.from({ length: 16 }, (_, i) => ({ ...conflicting.groups[0], experience_ref: hashBytes(`unadmitted-${i}`) }));
  const overflowBody = Buffer.from(canonical({ ...conflicting, groups: dummyGroups }));
  const overflow = await op(target, 'put_material', { metadata: { ...manifest.material.metadata, version: SELECTED_CORPUS_VERSION, sha256: hashBytes(overflowBody), size: overflowBody.length }, base64: overflowBody.toString('base64') }, basis);
  await refuses('collection_group_bound', () => op(target, 'collect_sources', { ...gardenAdd, key: 'overflow', expected_head: duplicate.acknowledged_head, corpus_refs: [overflow.material_ref] }, basis), /group_bound/);
  const storage = db.prepare('SELECT COUNT(*) materials,SUM(length(body)) body_bytes FROM vnext_external_materials').get();
  keep('collection/summary.json', { method: 'developer_exposed_scripted_lexical_retrieval_and_quote_assembly',
    collection_ref: collection, admissions: [initial, added, expanded, duplicate], correction_refs: correctionRefs,
    literal_matching_groups: literal.matching_groups, selected_groups: inspection.selected_groups,
    source_preparation: 'Two actual Web revisions and one whole unrelated file selected through the existing importer; no per-question manifest or fact mapping.',
    recurring_selection_calls: 3, duplicate_control_calls: 1, manual_repair_during_successful_workflow: 0,
    human_preparation_minutes: null, development_model_tokens: null, exposure: 'All questions and sources are developer-exposed; no held-out or observed-model claim.',
    admitted_original_bytes: [first, next, garden].flatMap(a => a.files).reduce((n, f) => n + f.web.file.bytes, 0),
    delivered_groups: corrected.delivered_groups, delivered_result_bytes: corrected.delivered_result_bytes,
    consumers: [before, updated, irrelevant, corrected, direct].map(c => ({ output_sha256: c.output_sha256,
      calls: c.calls.length, duration_ms: c.duration_ms, delivered_bytes: c.delivered_bytes })),
    direct_output_equal: direct.output_sha256 === corrected.output_sha256, workflow_storage: workflowStorage,
    storage_including_negative_fixtures: storage, elapsed_ms: performance.now() - started });
  return { collection, task, corrected, basis };
}
