// Local one-way admission. The Web validator is pure Node-compatible code;
// importing it does not open Web storage or use Web identity as native authority.
import type Database from 'better-sqlite3';
import { validateFileExport, FILE_EXPORT_REQUEST_BYTES, type FileEntry } from '../../apps/web_planning/src/files';
import { UUID } from '../../apps/web_planning/src/contract';
import { canonical, digest, hashBytes, keys, text, ref, fail, LIMITS } from './external-response-rules.mjs';
import { append, putMaterial } from './persistence/external-response-store.mjs';
import { SELECTED_CORPUS_VERSION, retrieveSelectedSources } from './selected-source-retrieval.mjs';

export const WEB_ADMISSION_VERSION = 'augnes.web-export-admission.v1';
export function selectWebExport(value: any, expected: any, selection: unknown) {
  // This is the existing Web request ceiling, not a larger native body limit.
  if (Buffer.byteLength(canonical(value)) > FILE_EXPORT_REQUEST_BYTES) fail('web_export_request_bound', 413);
  const first = value?.revisions?.[0];
  const scope = { workspace_id: first?.workspace_id, project_id: first?.project_id, author_ref: first?.author_ref };
  if (Object.values(scope).some(v => typeof v !== 'string' || !UUID.test(v))) fail('web_export_identity_invalid', 422);
  const { chain, bodies } = validateFileExport(scope, value);
  const current = chain.at(-1)!;
  keys(expected, ['export_fingerprint', 'work_id', 'revision', 'fingerprint']);
  if (expected.export_fingerprint !== value.fingerprint || expected.work_id !== current.work_id ||
      expected.revision !== current.revision || expected.fingerprint !== current.fingerprint)
    fail('web_export_basis_changed');
  if (!Array.isArray(selection) || !selection.length || selection.length > LIMITS.dependencies)
    fail('web_export_selection_invalid', 422);
  const names = new Set<string>();
  const files = selection.map((selected: FileEntry) => {
    keys(selected, ['name', 'role', 'bytes', 'digest']);
    if (names.has(selected.name)) fail('web_export_duplicate_selection', 422);
    names.add(selected.name);
    const file = current.files?.find(f => f.name === selected.name);
    if (!file) fail('web_export_selected_file_not_current', 422);
    if (canonical(file) !== canonical(selected)) fail('web_export_selected_file_changed');
    const extension = /\.(txt|md|markdown)$/i.exec(file.name)?.[1].toLowerCase();
    if (!extension) fail('web_export_media_unsupported', 422);
    if (!file.bytes || file.bytes > LIMITS.material) fail('web_export_native_material_bound', 413);
    const body = bodies.find(b => b.digest === file.digest)!;
    try { new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Buffer.from(body.data, 'base64')); }
    catch { fail('web_export_utf8_invalid', 422); }
    return { file, base64: body.data, media_type: extension === 'txt' ? 'text/plain' : 'text/markdown' };
  }).sort((a, b) => a.file.name < b.file.name ? -1 : a.file.name > b.file.name ? 1 : 0);
  return { current, files };
}

/** Must run inside the external owner's immediate transaction, after exact
 * project/configuration/physical-root/current-material admission. All writes,
 * including the existing operation-key consumption, commit together. */
export function admitWebExport({ db, scope, projectKey, current, data, inspectCorpus }: {
  db: Database.Database; scope: { workspace_id: string; project_id: string }; projectKey: string;
  current: any; data: any; inspectCorpus: (reference: string) => any;
}) {
  keys(data, ['key', 'project_key', 'export', 'expected', 'selected_files', 'applicability', 'attribution']);
  text(data.key, 100); ref(data.project_key);
  if (data.project_key !== projectKey) fail('web_export_target_mismatch', 403);
  if (process.env.AUGNES_RECOVERY_MODE === '1') fail('external_runtime_unavailable', 503);
  text(data.applicability);
  keys(data.attribution, ['endpoint', 'account', 'operator', 'confidence']);
  Object.values(data.attribution).forEach(v => text(v, 200));
  const selected = selectWebExport(data.export, data.expected, data.selected_files);
  const r = selected.current, operation_key = `web-import:${data.key}`;
  // Existing records reserve the operation identity within this workspace. An
  // exact key collision in another project refuses without reading its content.
  if (db.prepare('SELECT 1 FROM vnext_external_records WHERE workspace_id=? AND operation_key=? AND project_id<>?')
    .get(scope.workspace_id, operation_key, scope.project_id)) fail('external_replay_conflict');
  const sources = selected.files.map(({ file }) => {
    const web = { format: data.export.format, compatibility: data.export.compatibility, schema: data.export.schema,
      export_fingerprint: data.export.fingerprint, workspace_id: r.workspace_id, project_id: r.project_id,
      author_ref: r.author_ref, work_id: r.work_id, revision: r.revision, revision_fingerprint: r.fingerprint,
      recorded_at: r.recorded_at, file };
    return { source_binding: digest(web), source_locator: `web-export:${data.export.fingerprint}:${encodeURIComponent(file.name)}`, web };
  });
  const materials = selected.files.map(({ file, base64, media_type }, i) => putMaterial(db, scope, {
    // Native filenames retain their existing ASCII contract. The exact Web name
    // and role remain in the bound source metadata; no filesystem write uses it.
    name: `web-${file.digest.slice(7)}.${media_type === 'text/plain' ? 'txt' : 'md'}`,
    media_type, version: WEB_ADMISSION_VERSION, source: canonical(sources[i].web),
    applicability: data.applicability, dependencies: [], sha256: file.digest, size: file.bytes,
  }, base64));
  const saved = append(db, scope, { kind: 'experience', stream: `experience:${operation_key}`, operation_key,
    payload: { title: `Web export ${r.work_id} revision ${r.revision}`, sources, conditions: data.applicability,
      association: data.attribution, assessment: 'Supplied Web source metadata; unverified authorship, meaning and adoption. No native acceptance or authority.',
      materials, targets: [], material_basis: current.material_ref } });
  const corpus = { version: SELECTED_CORPUS_VERSION, project_key: projectKey,
    groups: [{ experience_ref: saved.record.ref, source: { identity: `web-work:${r.work_id}`, revision: `${r.revision}:${r.fingerprint}`,
      work: r.work_id, session: null, source_time: r.recorded_at, event_time: null, valid_from: null, valid_until: null,
      meaning: 'unknown', adoption: 'unknown', original_context: 'complete_selected_material' } }] };
  const body = Buffer.from(canonical(corpus));
  const corpus_ref = putMaterial(db, scope, { name: 'web-selected-corpus.json', media_type: 'application/json', version: SELECTED_CORPUS_VERSION,
    source: canonical({ operation_key, export_fingerprint: data.export.fingerprint, project_key: projectKey }),
    applicability: data.applicability, dependencies: [], sha256: hashBytes(body), size: body.length }, body.toString('base64'));
  // Use the real access/scan/output owners before committing. No clipped source
  // group may be acknowledged as a completed import.
  const snapshot = inspectCorpus(corpus_ref);
  const delivery = retrieveSelectedSources(snapshot, 'Web export', snapshot.binding);
  if (delivery.truncated || delivery.returned_groups !== 1) fail('web_export_native_delivery_bound', 413);
  return { status: saved.replay ? 'exact_replay' : 'saved', operation_key,
    project_key: projectKey, export_fingerprint: data.export.fingerprint, revision: data.expected,
    files: sources.map((s, i) => ({ ...s, material_ref: materials[i] })),
    experience_ref: saved.record.ref, ingested_at: saved.record.created_at,
    corpus_ref, corpus_binding: snapshot.binding, scanned_utf8_bytes: snapshot.scanned_utf8_bytes,
    delivered_utf8_bytes: delivery.result_utf8_bytes, prior_copies_recalled: false };
}
