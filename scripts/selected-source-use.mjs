// Ordinary caller seam: the same explicit Companion operation serves any task.
// Callers choose the corpus and query; no source-answer locator is accepted.
export async function retrieveForSuccessor(op, corpus_ref, query) {
  const inspection = await op('inspect_corpus', { corpus_ref });
  if (inspection.status !== 'available') throw new Error(inspection.reason ?? 'selected_source_unavailable');
  const result = await op('retrieve_sources', { corpus_ref, query, expected_corpus_binding: inspection.corpus_binding });
  if (result.status !== 'available') throw new Error(result.reason ?? 'selected_source_unavailable');
  return result;
}

export async function recheckBeforeUse(op, retrieval, query) {
  const current = await op('retrieve_sources', { corpus_ref: retrieval.corpus_ref, query, expected_corpus_binding: retrieval.corpus_binding });
  if (current.status !== 'available') throw new Error(current.reason ?? 'selected_source_unavailable');
  return current;
}
