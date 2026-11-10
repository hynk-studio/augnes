// A deliberately simple, exposed text-assembly task. No model or inference.
import { readFileSync, writeFileSync } from 'node:fs';
import { handleExternalOperation } from '../../../lib/vnext/external-response.ts';
import { hashBytes } from '../../../lib/vnext/external-response-rules.mjs';
import { retrieveForSuccessor, retrieveCollectionForSuccessor, recheckBeforeUse } from '../../selected-source-use.mjs';
import { selectWebExport } from '../../../lib/vnext/web-export-admission.ts';
import { installZeroNetworkGuard } from '../../test-harness-zero-network-guard.mjs';
const guard = installZeroNetworkGuard(), started = performance.now();
const task = JSON.parse(readFileSync(process.argv[2], 'utf8')), calls = [];
const op = async (action, data) => {
  const start = performance.now();
  const result = await handleExternalOperation({ repository_root: task.project, action, data });
  calls.push({ action, duration_ms: performance.now() - start, bytes: Buffer.byteLength(JSON.stringify(result)) });
  return result;
};
try {
  let contents = [], used = [], delivery;
  if (task.direct) {
    // Direct control receives precisely the permitted export/selection, no
    // expected answer. This branch never reads a native corpus or prior output.
    const e = JSON.parse(readFileSync(task.direct.export_path, 'utf8'));
    const selected = selectWebExport(e, task.direct.expected, task.direct.selected_files);
    if (task.direct.applicability === task.applies_to) contents = selected.files.map(f => Buffer.from(f.base64, 'base64'));
    delivery = { mode: 'direct_export', export_fingerprint: e.fingerprint, selected_files: selected.files.map(f => f.file) };
    calls.push({ action: 'local_export_read', bytes: Buffer.byteLength(JSON.stringify(e)) });
  } else {
    if (task.collection && task.direct_collection) {
      // Strong tiny-corpus control: read every currently permitted original
      // and correction, with exactly the same applicability rule below.
      const inspection = await op('inspect_corpus', { collection_ref: task.collection });
      const manifest = await op('material', { ref: inspection.corpus_ref });
      const corpus = JSON.parse(Buffer.from(manifest.material.base64, 'base64').toString('utf8'));
      const results = [];
      for (const selected of corpus.groups) {
        const read = await op('read_experience', { ref: selected.experience_ref });
        const corrections = [];
        for (const c of read.dependencies[0].corrections) corrections.push((await op('read_experience', { ref: c.ref })).experience);
        const materials = [];
        for (const ref of read.experience.payload.materials) materials.push((await op('material', { ref, experience_ref: read.experience.ref })).material);
        results.push({ source: selected.source, experience: read.experience, corrections, materials });
      }
      delivery = { ...inspection, query_mode: 'question', truncated: false, results, method: 'direct_collection_read' };
    } else delivery = task.collection ? await retrieveCollectionForSuccessor(op, task.collection, task.query) : await retrieveForSuccessor(op, task.corpus, task.query);
    // Deterministic quote assembly in stable source order; no latest-wins or
    // automatic correction interpretation. Review text is part of the output.
    if (task.collection) delivery.results.sort((a, b) => a.experience.ref.localeCompare(b.experience.ref));
    if (!delivery.truncated) for (const group of delivery.results) {
      // Unknown authorship/meaning is retained. This task quotes supplied draft
      // text, not accepted facts. Uninterpreted corrections require review.
      if (group.experience.payload.conditions !== task.applies_to || (!task.collection && group.corrections.length)) continue;
      if (task.collection) contents.push(Buffer.from(`Source ${group.experience.ref}\nConditions: ${group.experience.payload.conditions}\nSupplied revision: ${group.source.revision ?? 'unknown'}; meaning: ${group.source.meaning}; adoption: ${group.source.adoption}\n`));
      for (const m of group.materials) {
        const body = Buffer.from(m.base64, 'base64');
        if (hashBytes(body) !== m.metadata.sha256) throw new Error('material_integrity');
        contents.push(body);
        used.push({ experience_ref: group.experience.ref, material_ref: m.ref, sha256: m.metadata.sha256,
          source_bindings: group.experience.payload.sources.map(s => s.source_binding), correction_refs: group.corrections.map(c => c.ref) });
      }
      if (task.collection && group.corrections.length) contents.push(Buffer.from('Connected corrections (review together; no automatic supersession):\n' + group.corrections.map(c => `${c.ref}: ${c.payload.topic}\n${c.payload.statement}`).join('\n\n')));
    }
    await recheckBeforeUse(op, delivery, task.query);
  }
  const text = contents.length ? task.heading + (task.collection ? '\nSelected statements for review. Differences remain unresolved; recency does not establish supersession.' : '') + '\n\n' + contents.map(b => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(b)).join('\n\n') : null;
  if (text !== null) writeFileSync('draft.txt', text, { flag: 'wx' });
  const output = { status: text === null ? 'unknown' : 'draft', text, used,
    output_sha256: text === null ? null : hashBytes(Buffer.from(text)),
    delivered_bytes: Buffer.byteLength(JSON.stringify(delivery)), delivered_groups: delivery.results?.length ?? null,
    delivered_result_bytes: delivery.result_utf8_bytes ?? null,
    corpus_binding: delivery.corpus_binding ?? null, calls, duration_ms: performance.now() - started,
    provider_calls: 0, network_attempts: guard.attempts.length };
  writeFileSync('delivered.json', JSON.stringify(delivery, null, 2), { flag: 'wx' });
  writeFileSync('output.json', JSON.stringify(output, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(output));
} finally { guard.restore(); }
