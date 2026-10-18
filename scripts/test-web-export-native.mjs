import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { startLocal, fixtureScope } from './web-planning-local-runtime.mjs';
import { canonical, hash, headBinding, makeRevision, normalizePayload } from '../apps/web_planning/src/contract.ts';
import { selectedFiles, exportFiles, validateFileExport } from '../apps/web_planning/src/files.ts';
import { applyCanonicalDatabaseMigrations } from './canonical-database-migrations.mjs';
import { createCanonicalTestResourceRoot, createCanonicalTestResourceDirectory, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { installZeroNetworkGuard } from './test-harness-zero-network-guard.mjs';
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from '../lib/vnext/persistence/project-identity-registry.ts';
import { readCodexRepositoryContinuityV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-continuity.ts';
import { initializeCodexRepositoryWorkV01, reviseCodexRepositoryWorkV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-work-revision.ts';
import { handleExternalOperation } from '../lib/vnext/external-response.ts';
import { scopeKey, validateExternalStore } from '../lib/vnext/persistence/external-response-store.mjs';
import { EXTERNAL_VERSION, hashBytes, LIMITS } from '../lib/vnext/external-response-rules.mjs';
import { exerciseSelectedCollections } from './selected-source-collection-checks.mjs';
import { createRecoveryBackup } from './recovery-backup.mjs';
import { prepareRuntimeDatabase, restoreRuntimeDatabase, inspectRecoveryDatabaseFile } from './runtime-database-bootstrap.mjs';

const root = process.cwd(), started = performance.now(), owner = createCanonicalTestResourceRoot('ag-resource-test-', { shortSocketPaths: true });
const savedEnv = { ...process.env }, guard = installZeroNetworkGuard({ allowLoopback: true });
const exportPath = process.argv[2];
assert(!exportPath || (path.isAbsolute(exportPath) && !existsSync(exportPath)));
const dbPath = path.join(owner.root, 'native.db'), configPath = path.join(owner.root, 'external.json');
let db = new Database(dbPath), server;
const evidence = [], checks = [], refusals = [], calls = [], consumers = [], admissions = [];
const keep = (name, value) => evidence.push({ name, bytes: Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : JSON.stringify(value, null, 2)) });
const channel = { key: 'fixture-only', instance_id: 'fixture', generation_id: 'fixture-generation', repository_fingerprint: 'e'.repeat(64) };
const tables = ['vnext_external_records', 'vnext_external_materials', 'vnext_external_shares', 'vnext_external_envelopes'];
const state = () => canonical(tables.map(t => db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all()));
const op = async (p, action, data = {}, basis) => {
  const at = performance.now();
  try { const result = await handleExternalOperation({ repository_root: p.root, action, data, ...(basis ? { expected_material_ref: basis } : {}) });
    calls.push({ action, duration_ms: performance.now() - at, status: result.status, bytes: Buffer.byteLength(JSON.stringify(result)) }); return result;
  } catch (error) { calls.push({ action, duration_ms: performance.now() - at, refused: error.code ?? error.message }); throw error; }
};
async function work(p, initial = false) {
  const c = await readCodexRepositoryContinuityV01(db, { repository_root: p.root });
  const input = { repository_root: p.root, action: 'preview', expected_snapshot_binding: c.continuity.snapshot.binding,
    ...(initial ? { intent: 'initial_work' } : {}), changes: { goal: initial ? 'Prepare a source-attributed library notice draft' : 'Review a new native task basis',
      success_criteria: ['Preserve supplied wording and source bindings'], non_goals: ['No publication or accepted facts'] } };
  const writer = initial ? initializeCodexRepositoryWorkV01 : reviseCodexRepositoryWorkV01;
  const preview = await writer(db, input, channel); assert.equal(preview.status, 'previewed');
  const saved = await writer(db, { ...input, action: 'save', preview_binding: preview.preview_binding }, channel); assert.equal(saved.status, 'saved');
}
async function refuses(name, fn, pattern) {
  const before = state(), t = performance.now(); let error;
  try { await fn(); } catch (e) { error = e; }
  assert(error, name + ' must refuse'); if (pattern) assert.match(error.message, pattern, name);
  assert.equal(state(), before, name + ' must leave all external bytes/records/shares/operation consumption unchanged');
  refusals.push({ name, reason: error.code ?? error.message, duration_ms: performance.now() - t, atomic: true });
}
async function child(label, script, args, cwdOwner, timeoutMs = 20000, expectedSuccess = true) {
  let stdout = '', stderr = '';
  const result = await runCanonicalChild({ suite: 'web-export-native', label, command: process.execPath,
    args: ['--import', path.join(root, 'node_modules/tsx/dist/loader.mjs'), path.join(root, script), ...args], cwd: cwdOwner.root,
    env: { PATH: process.env.PATH, HOME: cwdOwner.root, TMPDIR: cwdOwner.root, AUGNES_RUNTIME_STATE_DIR: cwdOwner.root,
      TSX_TSCONFIG_PATH: path.join(root, 'tsconfig.json'), AUGNES_DB_PATH: dbPath, AUGNES_EXTERNAL_CONFIG_FILE: configPath },
    timeoutMs, heartbeatMs: 0, resourceOwner: cwdOwner, log: () => {},
    stdout: { write(c) { stdout += c; return true; } }, stderr: { write(c) { stderr += c; return true; } } });
  assert(result.cleanup_completed && result.remaining_owned_processes === 0, stderr);
  if (expectedSuccess) assert.equal(canonicalChildAcceptanceFailure(result, { timeoutMs, requireNaturalExit: true }), null, stderr + stdout);
  else { assert.notEqual(result.exit_code, 0); assert.equal(stdout, ''); }
  return { stdout, stderr, result };
}
async function consume(label, p, corpus, task = {}, direct) {
  const resource = createCanonicalTestResourceDirectory(path.join(owner.root, label));
  try {
    const input = direct ? { direct, ...ordinaryTask, ...task } : { project: p.root, corpus, ...ordinaryTask, ...task };
    const inputFile = path.join(resource.root, 'task.json'); writeFileSync(inputFile, JSON.stringify(input));
    const c = await child(label, 'scripts/fixtures/web-export-native/consumer.mjs', [inputFile], resource);
    const output = JSON.parse(c.stdout); assert.equal(output.network_attempts, 0);
    for (const n of readdirSync(resource.root).filter(n => ['draft.txt', 'delivered.json', 'output.json', 'task.json'].includes(n))) keep(`${label}/${n}`, readFileSync(path.join(resource.root, n)));
    consumers.push({ label, ...output, child_duration_ms: c.result.duration_ms, cleanup: c.result.cleanup_completed }); return output;
  } finally { assert(cleanupCanonicalTestResources([resource]).every(c => c.completed)); }
}
const applicability = 'East Library workshop notice';
const ordinaryTask = { query: 'East Library workshop', applies_to: applicability, heading: 'Draft for staff review' };
const definition = { goal: 'Write the East Library workshop notice', success_criteria: ['Keep original wording'], non_goals: ['No publication'] };
const original = Buffer.from('\ufeffThe East Library workshop begins at 18:00.\r\n처음 오신 분도 환영합니다. Cafe\u0301\r\nReserve a seat at the front desk.\r\n');
const updated = Buffer.from(original.toString().replace('18:00', '19:00'));
const upload = (name, body, role = 'source') => ({ name, role, data: body.toString('base64') });
// Negative controls may use the exact Web constructors; positives below use the
// real authenticated Web handler, D1 writer and complete-export route.
function negativeExport(files) {
  const selected = selectedFiles(normalizePayload(fixtureScope, definition, []), files);
  const revision = makeRevision(fixtureScope, randomUUID(), { revision: 0, fingerprint: null }, randomUUID(), selected.payload, new Date().toISOString());
  return exportFiles([revision], selected.bodies);
}
const expected = e => ({ export_fingerprint: e.fingerprint, work_id: e.revisions.at(-1).work_id,
  revision: e.revisions.at(-1).revision, fingerprint: e.revisions.at(-1).fingerprint });
function request(p, e, key, files = e.revisions.at(-1).files) { return { key, project_key: scopeKey(p.scope), export: e, expected: expected(e), selected_files: files,
  applicability, attribution: { endpoint: 'Local Web complete export', account: 'unverified Web source account', operator: 'synthetic operator declaration', confidence: 'supplied, not independently verified' } }; }
function rehash(e) { const { fingerprint, ...content } = e; e.fingerprint = hash(canonical(content)); return e; }

try {
  db.pragma('foreign_keys=ON'); applyCanonicalDatabaseMigrations(db);
  Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_STATE_DIR: owner.root, AUGNES_EXTERNAL_CONFIG_FILE: configPath });
  // Miniflare's optional remote cf.json lookup is irrelevant to local D1/auth.
  // Use its supported offline setting, retaining the zero-network assertion.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED = 'false';
  delete process.env.AUGNES_RECOVERY_MODE;
  const ws = getOrCreateDefaultWorkspaceIdentityV01(db);
  const projects = ['target', 'other', 'capacity'].map(name => {
    const dir = path.join(owner.root, name); mkdirSync(dir);
    const r = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: ws.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(dir, { base_path: owner.root }), display_name: name });
    return { root: dir, scope: { workspace_id: ws.workspace_id, project_id: r.project.project_id } };
  });
  const [target, other, filler] = projects;
  const config = { version: EXTERNAL_VERSION, projects: projects.map(p => ({ repository_root: p.root, project_key: scopeKey(p.scope), share_to: [] })), envelopes: [] };
  const configure = () => writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 }); configure();
  for (const p of projects) await work(p, true);
  const basis = (await op(target, 'read')).material_basis;
  const coreBefore = canonical(db.prepare('SELECT * FROM vnext_core_records ORDER BY record_id').all());
  const webRoot = path.join(owner.root, 'web'); mkdirSync(webRoot); server = await startLocal({ root: webRoot });
  const entry = await server.mf.dispatchFetch(server.origin + '/', { headers: { cookie: `web_planning_local=${server.env.LOCAL_SESSION}` } });
  const csrf = (await entry.text()).match(/name="csrf-token" content="([^"]+)"/)[1];
  const cookie = `web_planning_local=${server.env.LOCAL_SESSION}; ${entry.headers.get('set-cookie').split(';')[0]}`;
  async function web(url, body) {
    const start = performance.now();
    const res = await server.mf.dispatchFetch(server.origin + url, { method: body === undefined ? 'GET' : 'POST',
      headers: { cookie, ...(body === undefined ? {} : { origin: server.origin, 'content-type': 'application/json', 'x-csrf-token': csrf }) },
      ...(body === undefined ? {} : { body: JSON.stringify({ workspace_id: fixtureScope.workspace_id, project_id: fixtureScope.project_id, ...body }) }) });
    const raw = await res.text(); calls.push({ action: 'web:' + url.split('/').at(-1), status: res.status, duration_ms: performance.now() - start, bytes: Buffer.byteLength(raw) });
    assert.equal(res.status, 200, raw); return { data: JSON.parse(raw), raw };
  }
  const draft = (await web('/api/drafts', {})).data;
  let head = (await web(`/api/work/${draft.work_id}/save`, { ticket: draft.ticket, definition, notes: [], files: [upload('안내.md', original), upload('scratch.txt', Buffer.from('Earlier scratch source'))] })).data.saved;
  async function exportCurrent(label) {
    const e = await web(`/api/work/${head.work_id}/export`); validateFileExport(fixtureScope, e.data);
    assert.equal((await web(`/api/work/${head.work_id}/export`)).raw, e.raw, 'export bytes stable');
    keep(`${label}/planning-work.json`, e.raw); return e;
  }
  async function revise(files) {
    const content = { definition, notes: [], files };
    const ticket = (await web(`/api/work/${head.work_id}/ticket`, { expected: headBinding(head), ...content })).data.ticket;
    head = (await web(`/api/work/${head.work_id}/save`, { ticket, ...content })).data.saved;
  }
  const firstExport = await exportCurrent('original');
  const selected = firstExport.data.revisions.at(-1).files.filter(f => f.name === '안내.md');
  const firstRequest = request(target, firstExport.data, 'original', selected);
  const cliOwner = createCanonicalTestResourceDirectory(path.join(owner.root, 'import-cli'));
  let first;
  try {
    const source = path.join(cliOwner.root, 'planning-work.json'), input = path.join(cliOwner.root, 'admission.json');
    writeFileSync(source, firstExport.raw); const { export: ignored, ...data } = firstRequest;
    writeFileSync(input, JSON.stringify({ repository_root: target.root, expected_material_ref: basis, ...data }));
    const invoked = await child('actual-local-command', 'scripts/import-web-planning-export.ts', [source, input], cliOwner);
    first = JSON.parse(invoked.stdout); admissions.push(first); keep('original/admission.json', first);
    calls.push({ action: 'local_import_command', duration_ms: invoked.result.duration_ms });
    const before = state(); writeFileSync(source, '{ malformed');
    const malformedOwner = createCanonicalTestResourceDirectory(path.join(owner.root, 'malformed-cli'));
    let malformed;
    try { malformed = await child('malformed-local-export', 'scripts/import-web-planning-export.ts', [source, input], malformedOwner, 20000, false); }
    finally { assert(cleanupCanonicalTestResources([malformedOwner]).every(c => c.completed)); }
    assert.equal(state(), before); refusals.push({ name: 'malformed_export_json', reason: malformed.stderr.trim(), atomic: true, stdout_bytes: 0 });
  } finally { assert(cleanupCanonicalTestResources([cliOwner]).every(c => c.completed)); }
  assert.equal(first.status, 'saved');
  const beforeReplay = state(), replay = await op(target, 'import_web_export', firstRequest, basis);
  assert.deepEqual({ ...replay, status: 'saved' }, first); assert.equal(state(), beforeReplay);
  checks.push('actual Web D1 writer/export -> local planning-work.json -> operator CLI -> native material/experience/corpus; exact replay');
  const material = (await op(target, 'material', { ref: first.files[0].material_ref })).material;
  assert.deepEqual(Buffer.from(material.base64, 'base64'), original); assert.equal(material.metadata.sha256, selected[0].digest);
  const experience = (await op(target, 'read_experience', { ref: first.experience_ref })).experience;
  assert.deepEqual(experience.payload.sources[0].web.file, selected[0]); assert.equal(experience.payload.sources[0].web.export_fingerprint, firstExport.data.fingerprint);
  assert.equal(experience.created_at, first.ingested_at); assert.equal(experience.payload.sources[0].web.recorded_at, head.recorded_at);
  assert.deepEqual(experience.payload.association, firstRequest.attribution);
  assert.equal(experience.payload.conditions, firstRequest.applicability);
  const corpusMaterial = (await op(target, 'material', { ref: first.corpus_ref })).material;
  const corpus = JSON.parse(Buffer.from(corpusMaterial.base64, 'base64').toString());
  assert.equal(corpus.project_key, scopeKey(target.scope));
  assert.equal(corpus.groups.length, 1); assert.equal(corpus.groups[0].experience_ref, first.experience_ref);
  assert.equal(corpus.groups[0].source.meaning, 'unknown'); assert.equal(corpus.groups[0].source.adoption, 'unknown');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM vnext_external_materials').get().n, 2);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM vnext_external_records').get().n, 1);
  assert.equal((await op(target, 'inspect_corpus', { corpus_ref: first.corpus_ref })).corpus_binding, first.corpus_binding);
  keep('original/native-corpus.json', corpusMaterial);
  keep('original/native-material.json', material); keep('original/native-experience.json', experience);
  const originalOutput = await consume('original-use', target, first.corpus_ref);
  assert.equal(originalOutput.text, ordinaryTask.heading + '\n\n' + original.toString()); assert.equal(originalOutput.used.length, 1);
  await revise([upload('안내.md', updated)]); const nextExport = await exportCurrent('updated');
  const nextRequest = request(target, nextExport.data, 'updated');
  const next = await op(target, 'import_web_export', nextRequest, basis); admissions.push(next); keep('updated/admission.json', next);
  const nextOutput = await consume('updated-use', target, next.corpus_ref);
  assert.equal(nextOutput.text, ordinaryTask.heading + '\n\n' + updated.toString()); assert.notDeepEqual(nextOutput.used, originalOutput.used);
  assert.equal((await consume('historical-reread', target, first.corpus_ref)).text, originalOutput.text);
  const priorOnly = firstExport.data.revisions[0].files.find(f => f.name === 'scratch.txt');
  await refuses('selected_file_absent_from_current_revision', () => op(target, 'import_web_export', { ...nextRequest, key: 'old-selection', selected_files: [priorOnly] }, basis), /not_current/);
  await revise([...head.files, upload('unrelated.txt', Buffer.from('The roof garden needs watering.'))]);
  const unrelatedExport = await exportCurrent('unrelated-web-addition');
  const irrelevant = await consume('unrelated-web-use', target, next.corpus_ref);
  assert.deepEqual(irrelevant.used, nextOutput.used); assert.equal(irrelevant.output_sha256, nextOutput.output_sha256);
  const extra = Buffer.from('Unselected native garden note');
  await op(target, 'put_material', { metadata: { name: 'garden.txt', media_type: 'text/plain', version: 'fixture.v1', source: 'unrelated fixture', applicability: 'garden', dependencies: [], sha256: hashBytes(extra), size: extra.length }, base64: extra.toString('base64') }, basis);
  const unrelatedNative = await consume('unrelated-native-use', target, next.corpus_ref);
  assert.deepEqual(unrelatedNative.used, nextOutput.used); assert.equal(unrelatedNative.output_sha256, nextOutput.output_sha256);
  const outside = await consume('outside-applicability', target, next.corpus_ref, { applies_to: 'West Library opening notice' });
  assert.equal(outside.status, 'unknown'); assert.deepEqual(outside.used, []); assert.equal(outside.output_sha256, null);
  const directPath = path.join(owner.root, 'direct-export.json'); writeFileSync(directPath, nextExport.raw);
  const control = await consume('direct-read-control', target, null, {}, { export_path: directPath, expected: nextRequest.expected, selected_files: nextRequest.selected_files, applicability });
  assert.equal(control.output_sha256, nextOutput.output_sha256);
  checks.push('fresh original and updated outputs; prior export/material/output retained; unrelated Web and native additions leave output/used dependencies unchanged; outside applicability unknown; direct-export control ties');

  const mutateExport = (fn, recompute = true) => { const e = structuredClone(nextExport.data); fn(e); return recompute ? rehash(e) : e; };
  for (const [name, fn, recompute] of [
    ['incompatible_format', e => e.format = 'web_planning_export.v0.2'],
    ['incompatible_compatibility', e => e.compatibility = 'web-planning/2'],
    ['incompatible_schema', e => e.schema = 2],
    ['altered_export_fingerprint', e => e.fingerprint = 'sha256:' + '0'.repeat(64), false],
    ['invalid_revision_chain', e => e.revisions.shift()],
    ['altered_revision_fingerprint', e => e.revisions[0].fingerprint = 'sha256:' + '0'.repeat(64)],
    ['altered_predecessor', e => e.revisions[1].predecessor = 'sha256:' + '0'.repeat(64)],
    ['work_identity_mismatch', e => e.revisions[1].work_id = randomUUID()],
    ['duplicate_revision_identity', e => e.revisions[1].request_key = e.revisions[0].request_key],
    ['file_manifest_body_mismatch', e => e.files.pop()],
    ['altered_file_digest', e => e.files[0].digest = 'sha256:' + '0'.repeat(64)],
    ['altered_byte_count', e => e.files[0].bytes++],
    ['altered_base64', e => e.files[0].data += '\n'],
    ['duplicate_body_identity', e => e.files.push(e.files[0])],
    ['duplicate_manifest_name', e => e.revisions.at(-1).files.push(e.revisions.at(-1).files[0])],
    ['closed_export_shape', e => e.extra = true],
    ['closed_revision_shape', e => e.revisions[0].extra = true],
    ['file_role_invalid', e => e.revisions.at(-1).files[0].role = 'execute'],
    ['file_name_invalid', e => e.revisions.at(-1).files[0].name = '../escape.txt'],
  ]) {
    const e = mutateExport(fn, recompute); await refuses(name, () => op(target, 'import_web_export', { ...nextRequest, key: name, export: e }, basis));
  }
  await refuses('duplicate_selected_name_or_identity', () => op(target, 'import_web_export', { ...nextRequest, selected_files: [...nextRequest.selected_files, ...nextRequest.selected_files] }, basis), /duplicate/);
  await refuses('missing_selected_file', () => op(target, 'import_web_export', { ...nextRequest, selected_files: [{ ...nextRequest.selected_files[0], name: 'missing.txt' }] }, basis), /not_current/);
  await refuses('stale_web_export_binding', () => op(target, 'import_web_export', { ...nextRequest, expected: firstRequest.expected }, basis), /basis_changed/);
  await refuses('stale_selected_file_binding', () => op(target, 'import_web_export', { ...nextRequest, selected_files: selected }, basis), /file_changed/);
  for (const [name, files, reason] of [
    ['invalid_utf8', [upload('invalid.txt', Buffer.from([0xc3, 0x28]))], /utf8_invalid/],
    ['unsupported_media', [upload('active.html', Buffer.from('<script>throw 1</script>'))], /media_unsupported/],
    ['native_per_file_bound', [upload('large.txt', Buffer.alloc(65537, 'a'))], /material_bound/],
    ['native_empty_file_bound', [upload('empty.txt', Buffer.alloc(0))], /material_bound/],
    ['native_result_group_bound', [upload('one.txt', Buffer.alloc(65536, 'a')), upload('two.txt', Buffer.alloc(65536, 'b'))], /delivery_bound/],
    ['native_scan_bound', Array.from({ length: 8 }, (_, i) => upload(`large-${i}.txt`, Buffer.alloc(65536, 65 + i))), /scan_bound/],
  ]) { const e = negativeExport(files); await refuses(name, () => op(target, 'import_web_export', request(target, e, name), basis), reason); }
  // Web's 8 selections and one native group enforce tighter admission than the
  // reader's 16 groups/32 materials. The existing reader regression covers both.
  await refuses('selection_count_bound', () => op(target, 'import_web_export', { ...nextRequest, selected_files: Array(9).fill(nextRequest.selected_files[0]) }, basis), /selection_invalid/);
  const otherBasis = (await op(other, 'read')).material_basis;
  await refuses('unknown_native_target', () => op({ root: path.join(owner.root, 'unknown') }, 'import_web_export', nextRequest, basis), /access_refused/);
  await refuses('wrong_native_target', () => op(other, 'import_web_export', nextRequest, otherBasis), /target_mismatch/);
  await refuses('unauthorized_cross_project_corpus', () => op(other, 'inspect_corpus', { corpus_ref: first.corpus_ref }), /access_refused/);
  config.projects = config.projects.filter(p => p.project_key !== scopeKey(target.scope)); configure();
  await refuses('unauthorized_native_project', () => op(target, 'import_web_export', nextRequest, basis), /access_refused/);
  config.projects.push({ repository_root: target.root, project_key: scopeKey(target.scope), share_to: [] }); configure();
  await refuses('implicit_share_request', () => op(target, 'import_web_export', { ...nextRequest, targets: [scopeKey(other.scope)] }, basis), /invalid_input/);
  await refuses('conflicting_replay_export', () => op(target, 'import_web_export', { ...nextRequest, key: 'original' }, basis), /replay_conflict/);
  await refuses('conflicting_replay_selection', () => op(target, 'import_web_export', request(target, firstExport.data, 'original'), basis), /replay_conflict/);
  await refuses('conflicting_replay_applicability', () => op(target, 'import_web_export', { ...firstRequest, applicability: 'Another task' }, basis), /replay_conflict/);
  await refuses('conflicting_replay_attribution', () => op(target, 'import_web_export', { ...firstRequest, attribution: { ...firstRequest.attribution, operator: 'Changed declaration' } }, basis), /replay_conflict/);
  await refuses('conflicting_replay_target', () => op(other, 'import_web_export', { ...firstRequest, project_key: scopeKey(other.scope) }, otherBasis), /replay_conflict/);
  const currentBinding = (await op(target, 'inspect_corpus', { corpus_ref: next.corpus_ref })).corpus_binding;
  await refuses('stale_corpus_binding', () => op(target, 'retrieve_sources', { corpus_ref: first.corpus_ref, query: ordinaryTask.query, expected_corpus_binding: currentBinding }), /basis_changed/);
  assert.equal(canonical(db.prepare('SELECT * FROM vnext_core_records ORDER BY record_id').all()), coreBefore);
  await work(target); await refuses('stale_native_target_material_binding', () => op(target, 'import_web_export', nextRequest, basis), /work_basis_changed/);
  let newBasis = (await op(target, 'read')).material_basis;
  const collectionCase = await exerciseSelectedCollections({ target, other, first, next, unrelatedExport, request, op, consume, refuses,
    basis: newBasis, state, keep, db, configureTarget(enabled) {
      config.projects = config.projects.filter(p => p.project_key !== scopeKey(target.scope));
      if (enabled) config.projects.push({ repository_root: target.root, project_key: scopeKey(target.scope), share_to: [] });
      configure();
    }, async addCorrectionSource() {
      const c = await readCodexRepositoryContinuityV01(db, { repository_root: target.root });
      const input = { repository_root: target.root, action: 'preview', expected_snapshot_binding: c.continuity.snapshot.binding,
        changes: { sources: { add: [{ source: 'note-ref:workshop-correction', text: 'For the East Library workshop, the organizer corrects the start to 19:00. Seat reservations at the front desk remain applicable. A conflicting staff note lists 20:00 for this workshop. The discrepancy with the organizer remains unresolved; confirm before publishing.', observed_at: null, provenance: 'imported_unverified', label: 'Next check' }] } } };
      const preview = await reviseCodexRepositoryWorkV01(db, input, channel); assert.equal(preview.status, 'previewed');
      const saved = await reviseCodexRepositoryWorkV01(db, { ...input, action: 'save', preview_binding: preview.preview_binding }, channel); assert.equal(saved.status, 'saved');
      return op(target, 'read');
    } });
  newBasis = collectionCase.basis;
  checks.push('stable incremental collection; natural question versus literal miss; exact/conflicting replay; explicit corrections/conflicts; selective output; direct-read equality; atomic bounds/access refusals');
  validateExternalStore(db);
  const retained = state(); db.close();
  const lifecycle = { databasePath: dbPath, backupDirectory: path.join(owner.root, 'backups'), repositoryRoot: root,
    instanceId: 'web-export-native-test', repositoryFingerprint: 'e'.repeat(64), databaseOverrideActive: true };
  const backup = await createRecoveryBackup({ databasePath: dbPath, backupDirectory: lifecycle.backupDirectory,
    applicationScopeFingerprint: lifecycle.repositoryFingerprint, sourceApplication: { application_version: null, build_identity: null, package_contract: null,
      package_contract_version: null, runtime_contract: null, runtime_schema_version: null }, reason: 'manual_recovery', inspectDatabase: inspectRecoveryDatabaseFile });
  db = new Database(dbPath);
  // A real capacity refusal after source material and experience insertion must
  // roll back both when the final corpus cannot fit. No fault hooks/SQL surgery.
  const failureExport = negativeExport([upload('fresh.txt', Buffer.from('A new selected source that has not been admitted.'))]);
  const failureRequest = request(target, failureExport, 'capacity-rollback');
  const free = failureExport.revisions[0].files[0].bytes + 100;
  let remaining = LIMITS.workspaceBytes - free - db.prepare('SELECT COALESCE(SUM(length(body)),0) n FROM vnext_external_materials').get().n;
  const fillerBasis = (await op(filler, 'read')).material_basis;
  for (let i = 0; remaining > 0; i++) {
    const body = Buffer.alloc(Math.min(remaining, LIMITS.material), 97 + i % 26); remaining -= body.length;
    await op(filler, 'put_material', { metadata: { name: `capacity-${i}.txt`, media_type: 'text/plain', version: 'fixture.v1', source: 'Explicit capacity control', applicability: 'capacity test only', dependencies: [], sha256: hashBytes(body), size: body.length }, base64: body.toString('base64') }, fillerBasis);
  }
  await refuses('native_aggregate_capacity_after_validation_before_completion', () => op(target, 'import_web_export', failureRequest, newBasis), /material_capacity/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM vnext_external_records WHERE operation_key=?').get('web-import:capacity-rollback').n, 0);
  db.close();
  await restoreRuntimeDatabase({ ...lifecycle, selectedBackupId: backup.manifest.backup_id });
  await prepareRuntimeDatabase(lifecycle); db = new Database(dbPath); assert.equal(state(), retained); validateExternalStore(db);
  const recovered = await consume('recovered-fresh-use', target, next.corpus_ref);
  assert.equal(recovered.output_sha256, nextOutput.output_sha256); assert.deepEqual(recovered.used, nextOutput.used);
  const recoveredCollection = await consume('collection-recovered', target, null, { ...collectionCase.task, collection: collectionCase.collection });
  assert.equal(recoveredCollection.output_sha256, collectionCase.corrected.output_sha256);
  assert.deepEqual(recoveredCollection.used, collectionCase.corrected.used);
  const recoveredReplay = await op(target, 'import_web_export', firstRequest, newBasis).then(() => null, e => e.code);
  assert.equal(recoveredReplay, 'external_replay_conflict', 'a changed native basis cannot rewrite the earlier import');
  const afterFailure = await op(target, 'import_web_export', failureRequest, newBasis); assert.equal(afterFailure.status, 'saved');
  checks.push('supported backup/restore preserves exact material/experience/corpus; fresh consumer after recovery; aggregate refusal rolls back source/experience/corpus and consumes no operation key; explicit retry succeeds after supported recovery');
  assert.equal(server.externalRequests(), 0); assert.equal(guard.attempts.length, 0, JSON.stringify(guard.attempts));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM vnext_external_shares').get().n, 0);
  const usage = db.prepare('SELECT COUNT(*) materials, SUM(length(body)) body_bytes FROM vnext_external_materials').get();
  const report = { evidence: 'developer_exposed_deterministic_portability_and_text_use', checks, refusals, admissions, consumers, calls,
    export_bytes: { original: Buffer.byteLength(firstExport.raw), updated: Buffer.byteLength(nextExport.raw), unrelated: Buffer.byteLength(unrelatedExport.raw) },
    selected_bytes: original.length, selected_files: 1, storage: usage,
    native_records: db.prepare('SELECT COUNT(*) n FROM vnext_external_records').get().n,
    comparison: 'equal output; no measured usefulness or performance advantage', provider_calls: 0, network_attempts: guard.attempts.length,
    elapsed_ms: performance.now() - started, recovery: { backup_id: backup.manifest.backup_id, exact_state_preserved: true },
    admission_bounds: { groups: 'one; below reader 16', materials: 'Web selection at most 8; below reader 32; count refusals additionally exercised by selected-source regression' } };
  keep('report.json', report);
  if (exportPath) {
    mkdirSync(exportPath);
    for (const e of evidence) { const dest = path.join(exportPath, e.name); mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, e.bytes); }
    writeFileSync(path.join(exportPath, 'manifest.json'), JSON.stringify(evidence.map(e => ({ name: e.name, bytes: e.bytes.length, sha256: hashBytes(e.bytes) })), null, 2));
  }
  console.log(JSON.stringify({ passed: true, checks, refusals: refusals.length, consumers: consumers.length, storage: usage, elapsed_ms: report.elapsed_ms }));
} catch (error) {
  if (exportPath && !existsSync(exportPath)) {
    mkdirSync(exportPath);
    for (const e of evidence) { const dest = path.join(exportPath, e.name); mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, e.bytes); }
    writeFileSync(path.join(exportPath, 'failed-attempt.json'), JSON.stringify({ error: String(error), checks, refusals, calls, consumers, blocked_network_attempts: guard.attempts }, null, 2));
  }
  throw error;
} finally {
  if (db.open) db.close(); if (server) await server.close(); guard.restore();
  for (const k of Object.keys(process.env)) if (!(k in savedEnv)) delete process.env[k]; Object.assign(process.env, savedEnv);
  const cleanup = cleanupCanonicalTestResources([owner]); console.log(JSON.stringify({ cleanup })); assert(cleanup.every(c => c.completed));
}
