// Explicit, append-only selection over existing immutable corpus materials.
// Callbacks belong to the external owner's transaction and access boundary.
import { canonical, digest, hashBytes, keys, text, ref, refs, fail } from './external-response-rules.mjs';
import { SELECTED_CORPUS_VERSION, SELECTED_RETRIEVAL_LIMITS, parseSelectedCorpus } from './selected-source-retrieval.mjs';

export function mergeSelectedCorpora(projectKey, corpora) {
  const groups = new Map();
  for (const corpus of corpora) for (const group of parseSelectedCorpus(corpus, projectKey).groups) {
    const previous = groups.get(group.experience_ref);
    if (previous && canonical(previous) !== canonical(group)) fail('selected_collection_source_conflict');
    groups.set(group.experience_ref, group);
  }
  if (!groups.size || groups.size > SELECTED_RETRIEVAL_LIMITS.groups) fail('selected_collection_group_bound', 413);
  return { version: SELECTED_CORPUS_VERSION, project_key: projectKey,
    groups: [...groups.values()].sort((a, b) => a.experience_ref.localeCompare(b.experience_ref)) };
}

// Recovery and live reads use the same structural checks. Current access is
// checked separately by inspectCorpus; historical retention is not a new grant.
export function validateSelectedCollectionHistory(history, projectKey, readMaterial, readExperience) {
  let previous = null;
  for (const record of history) {
    const p = record.payload;
    keys(p, ['name', 'previous_ref', 'corpus_ref', 'added_corpus_refs', 'material_basis']);
    text(p.name, 160); ref(p.corpus_ref); ref(p.material_basis); refs(p.added_corpus_refs);
    if (!p.added_corpus_refs.length || record.kind !== 'source_collection' ||
        record.sequence !== (previous ? previous.sequence + 1 : 0) ||
        p.previous_ref !== (previous?.ref ?? null) ||
        record.stream !== history[0].stream || p.name !== history[0].payload.name ||
        !record.stream.startsWith('source-collection:')) fail('selected_collection_history_invalid', 503);
    const inputs = [...(previous ? [readMaterial(previous.payload.corpus_ref)] : []), ...p.added_corpus_refs.map(readMaterial)];
    const expected = mergeSelectedCorpora(projectKey, inputs);
    if (canonical(parseSelectedCorpus(readMaterial(p.corpus_ref), projectKey)) !== canonical(expected))
      fail('selected_collection_history_invalid', 503);
    if (readExperience) for (const group of expected.groups) readExperience(group.experience_ref);
    previous = record;
  }
  if (!previous) fail('selected_collection_history_invalid', 503);
  return previous;
}

export function readSelectedCollection(collectionRef, owners) {
  const first = owners.readOwn(ref(collectionRef));
  if (first.kind !== 'source_collection' || first.sequence !== 0) fail('external_access_refused', 403);
  const history = owners.readRecords(first.stream);
  const head = validateSelectedCollectionHistory(history, owners.projectKey, owners.readMaterial);
  return { collection_ref: first.ref, collection_head: head.ref, name: first.payload.name, head, history };
}

export function inspectSelectedCollection(collectionRef, owners) {
  const collection = readSelectedCollection(collectionRef, owners);
  const snapshot = owners.inspectCorpus(collection.head.payload.corpus_ref);
  return { ...snapshot, collection_ref: collection.collection_ref, collection_name: collection.name, collection_head: collection.collection_head,
    binding: digest({ collection_ref: collection.collection_ref, collection_head: collection.collection_head, corpus_binding: snapshot.binding }) };
}

export function collectSelectedSources(data, current, owners) {
  keys(data, ['key', 'collection_ref', 'expected_head', 'name', 'corpus_refs']);
  text(data.key, 100); text(data.name, 160); refs(data.corpus_refs);
  if (!data.corpus_refs.length) fail('selected_collection_sources_required', 422);
  if (process.env.AUGNES_RECOVERY_MODE === '1') fail('external_runtime_unavailable', 503);
  let previous = null, collection = null;
  const operation_key = `source-collection:${data.key}`;
  let stream = `source-collection:${digest({ key: data.key })}`;
  if (data.collection_ref !== null) {
    ref(data.expected_head);
    collection = readSelectedCollection(data.collection_ref, owners);
    previous = collection.history.find(record => record.ref === data.expected_head);
    if (!previous || data.name !== collection.name) fail('selected_collection_basis_changed');
    stream = previous.stream;
  } else if (data.expected_head !== null) fail('selected_collection_basis_changed');
  // Reconstruct from the request's exact predecessor, even on a deliberate
  // replay after later additions. append owns replay versus stale-head refusal.
  const inputs = [...(previous ? [owners.readMaterial(previous.payload.corpus_ref)] : []), ...data.corpus_refs.map(owners.readMaterial)];
  const corpus = mergeSelectedCorpora(owners.projectKey, inputs);
  const body = Buffer.from(canonical(corpus));
  const corpus_ref = owners.putMaterial({ name: 'selected-collection.json', media_type: 'application/json',
    version: SELECTED_CORPUS_VERSION, source: stream, applicability: data.name, dependencies: [],
    sha256: hashBytes(body), size: body.length }, body.toString('base64'));
  const snapshot = owners.inspectCorpus(corpus_ref);
  // Admission must not acknowledge an individually undeliverable source group.
  if (snapshot.groups.some(group => Buffer.byteLength(canonical([group])) > SELECTED_RETRIEVAL_LIMITS.returned_utf8_bytes))
    fail('selected_collection_delivery_bound', 413);
  const saved = owners.append({ kind: 'source_collection', stream, operation_key,
    payload: { name: data.name, previous_ref: data.expected_head, corpus_ref,
      added_corpus_refs: data.corpus_refs, material_basis: current.material_ref } }, data.expected_head);
  return { status: saved.replay ? 'exact_replay' : 'saved', collection_ref: collection?.collection_ref ?? saved.record.ref,
    collection_name: data.name, acknowledged_head: saved.record.ref, corpus_ref, selected_groups: snapshot.groups.length,
    selected_materials: snapshot.scanned_materials, ingested_at: saved.record.created_at,
    qualification: 'Acknowledgement identifies this addition, not the current head. Inspect the selected collection before use.' };
}
