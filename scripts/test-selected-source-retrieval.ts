// Fixed, developer-exposed mechanism checks. No model/provider experiment.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { applyCanonicalDatabaseMigrations } from './canonical-database-migrations.mjs';
import { createCanonicalTestResourceRoot, createCanonicalTestResourceDirectory, cleanupCanonicalTestResources } from './canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { installZeroNetworkGuard } from './test-harness-zero-network-guard.mjs';
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from '../lib/vnext/persistence/project-identity-registry';
import { readCodexRepositoryContinuityV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-continuity';
import { initializeCodexRepositoryWorkV01, reviseCodexRepositoryWorkV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-work-revision';
import { readCodexRepositoryRetainedSourcesV01 } from '../lib/vnext/codex-repository-continuity/codex-repository-retained-sources';
import { handleExternalOperation } from '../lib/vnext/external-response';
import { POST as externalRoute } from '../app/api/augnes/external-response/route';
import { EXTERNAL_MARKER, externalToolDescription } from '../plugins/augnes-operator/mcp/external-response.mjs';
import { scopeKey, validateExternalStore } from '../lib/vnext/persistence/external-response-store.mjs';
import { canonical, hashBytes, EXTERNAL_VERSION } from '../lib/vnext/external-response-rules.mjs';
import { SELECTED_CORPUS_VERSION, SELECTED_RETRIEVAL_LIMITS, parseSelectedCorpus, inspectSelectedCorpus, retrieveSelectedSources } from '../lib/vnext/selected-source-retrieval.mjs';

const root = process.cwd(), start = performance.now();
const owner = createCanonicalTestResourceRoot('ag-resource-test-', { shortSocketPaths: true });
const savedEnv = { ...process.env }, guard = installZeroNetworkGuard();
const dbPath = path.join(owner.root, 'sources.db');
let db = new Database(dbPath);
const exportPath = process.argv[2];
assert(!exportPath || (path.isAbsolute(exportPath) && !existsSync(exportPath)));
const expectations = JSON.parse(readFileSync(path.join(root, 'scripts/fixtures/selected-source/expectations.json'), 'utf8'));
const calls: any[] = [], consumers: any[] = [], checks: string[] = [], files: { name: string; bytes: Buffer }[] = [];
const channel = { key: 'fixture-private-channel-only', instance_id: 'fixture', generation_id: 'fixture-generation', repository_fingerprint: 'e'.repeat(64) };
const note = (source: string, text: string) => ({ source, text, observed_at: null, provenance: 'imported_unverified', label: 'Next check' });
let config: any, configPath: string;
const configure = () => writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 });
async function op(p: any, action: string, data: any = {}, basis?: string): Promise<any> {
  const at = performance.now();
  const result: any = await handleExternalOperation({ repository_root: p.root, action, data, ...(basis ? { expected_material_ref: basis } : {}) });
  calls.push({ action, duration_ms: performance.now() - at, response_bytes: Buffer.byteLength(JSON.stringify(result)) });
  assert(['available', 'saved', 'exact_replay'].includes(result.status)); return result;
}
async function work(p: any, changes: any, intent?: 'initial_work' | 'new_task') {
  const continuity = await readCodexRepositoryContinuityV01(db, { repository_root: p.root });
  assert.equal(continuity.continuity!.snapshot.status, 'exact');
  const input = { ...(intent ? { intent } : {}), action: 'preview', repository_root: p.root,
    expected_snapshot_binding: continuity.continuity!.snapshot.binding, changes };
  const writer = intent === 'initial_work' ? initializeCodexRepositoryWorkV01 : reviseCodexRepositoryWorkV01;
  const preview = await writer(db, input, channel);
  assert.equal(preview.status, 'previewed');
  const saved = await writer(db, { ...input, action: 'save', preview_binding: preview.preview_binding }, channel);
  assert.equal(saved.status, 'saved'); return saved;
}
async function put(p: any, name: string, value: any, version = 'selected-material.v1', media = 'application/json') {
  const body = Buffer.from(typeof value === 'string' ? value : canonical(value));
  const data = { metadata: { name, media_type: media, version, source: 'Explicit synthetic prior source artifact',
    applicability: 'Declared conditions in the associated experience', dependencies: [], sha256: hashBytes(body), size: body.length }, base64: body.toString('base64') };
  const basis = (await op(p, 'read')).material_basis;
  const first = await op(p, 'put_material', data, basis);
  const before = db.prepare('SELECT COUNT(*) n FROM vnext_external_materials').get();
  assert.equal((await op(p, 'put_material', data, basis)).material_ref, first.material_ref);
  assert.deepEqual(db.prepare('SELECT COUNT(*) n FROM vnext_external_materials').get(), before);
  return first.material_ref;
}
async function publish(p: any, target: any, key: string, fact: any, applies: string, sourceWork: string) {
  await work(p, { sources: { add: [note(`note-ref:${key}`, `Selected ${key} artifact from ${sourceWork}; supplied context and conditions retained.`)] } });
  const material = await put(p, `${key}.json`, fact);
  const current = await op(p, 'read');
  const source = current.sources.find((s: any) => s.source_locator === `note-ref:${key}`);
  const data = { key, title: `${applies} ${key}`, source_refs: [source.source_binding], conditions: JSON.stringify({ applies_to: applies }),
    association: { endpoint: 'none', account: 'unknown', operator: 'fixture author', confidence: 'declared' },
    assessment: 'Supplied observation for bounded deterministic use; no independent truth or general usefulness claim.', materials: [material], targets: [scopeKey(target.scope)] };
  const first = await op(p, 'publish', data, current.material_basis);
  assert.equal((await op(p, 'publish', data, current.material_basis)).status, 'exact_replay');
  return { experience_ref: first.record.ref, source: { identity: `fixture:${key}`, revision: 'v1', work: sourceWork, session: `session:${sourceWork}`,
    source_time: '2026-10-01T00:00:00.000Z', event_time: null, valid_from: null, valid_until: null,
    meaning: 'observation', adoption: 'adopted', original_context: 'complete_selected_material' } };
}
async function corpus(p: any, groups: any[]) {
  return put(p, 'selected-corpus.json', { version: SELECTED_CORPUS_VERSION, project_key: scopeKey(p.scope), groups }, SELECTED_CORPUS_VERSION);
}
async function query(p: any, c: string, q: string, binding?: string) {
  const b = binding ?? (await op(p, 'inspect_corpus', { corpus_ref: c })).corpus_binding;
  return op(p, 'retrieve_sources', { corpus_ref: c, query: q, expected_corpus_binding: b });
}
async function refuses(action: () => Promise<any>, pattern: RegExp) {
  const before = canonical(db.prepare('SELECT * FROM vnext_external_records ORDER BY ref').all());
  await assert.rejects(action, pattern);
  assert.equal(canonical(db.prepare('SELECT * FROM vnext_external_records ORDER BY ref').all()), before);
}
async function consumer(label: string, p: any, c: string, task: any) {
  const child = createCanonicalTestResourceDirectory(path.join(owner.root, label));
  writeFileSync(path.join(child.root, 'task.json'), JSON.stringify({ project: p.root, corpus: c, ...task }));
  let stdout = '', stderr = '';
  const result = await runCanonicalChild({ suite: 'selected-source', label, command: process.execPath,
    args: ['--import', path.join(root, 'node_modules/tsx/dist/loader.mjs'), path.join(root, 'scripts/fixtures/selected-source/consumer.ts'), path.join(child.root, 'task.json')],
    cwd: child.root, env: { PATH: process.env.PATH, HOME: child.root, TMPDIR: child.root,
      TSX_TSCONFIG_PATH: path.join(root, 'tsconfig.json'), AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_STATE_DIR: child.root,
      AUGNES_EXTERNAL_CONFIG_FILE: configPath }, timeoutMs: 20000, heartbeatMs: 0, resourceOwner: child, log: () => {},
    stdout: { write(c: any) { stdout += c; return true; } } as any,
    stderr: { write(c: any) { stderr += c; return true; } } as any });
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: 'selected-source', timeoutMs: 20000, requireNaturalExit: true }), null, stderr + stdout);
  const output = JSON.parse(stdout);
  for (const name of readdirSync(child.root).filter(n => ['output.json', 'delivered.json', 'audit.mjs', 'bulletin.txt'].includes(n)))
    files.push({ name: `${label}/${name}`, bytes: readFileSync(path.join(child.root, name)) });
  consumers.push({ label, ...output, child_duration_ms: result.duration_ms, cleanup: result.cleanup_completed, remaining: result.remaining_owned_processes });
  assert(cleanupCanonicalTestResources([child]).every((c: any) => c.completed));
  return output;
}

async function main() {
  db.pragma('foreign_keys=ON'); applyCanonicalDatabaseMigrations(db);
  process.env.AUGNES_DB_PATH = dbPath;
  process.env.AUGNES_RUNTIME_STATE_DIR = owner.root;
  delete process.env.AUGNES_RECOVERY_MODE;
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const projects = ['prior', 'successor', 'private'].map(label => {
    const dir = path.join(owner.root, label); mkdirSync(dir);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(dir, { base_path: owner.root }), display_name: label });
    return { root: dir, scope: { workspace_id: workspace.workspace_id, project_id: registration.project.project_id } };
  });
  const [prior, successor, other] = projects as [any, any, any];
  config = { version: EXTERNAL_VERSION, projects: projects.map(p => ({ repository_root: p.root, project_key: scopeKey(p.scope),
    share_to: p === prior ? [scopeKey(successor.scope)] : [] })), envelopes: [] };
  configPath = path.join(owner.root, 'external.json'); configure(); process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  for (const p of projects) await work(p, { goal: p === prior ? 'Prior coding observations' : 'Independent selected-source tasks',
    success_criteria: ['Produce a source-bound output under declared conditions'], non_goals: ['No model, service or accepted-state changes'] }, 'initial_work');
  const duration = await publish(prior, successor, 'duration', { kind: 'coding', key: 'duration', field: 'duration', multiplier: 1000 }, 'build-events.v2', 'coding-prior');
  const identity = await publish(prior, successor, 'identity', { kind: 'coding', key: 'identity', field: 'attempt_id' }, 'build-events.v2', 'coding-prior');
  const noise = await publish(prior, successor, 'paint', { kind: 'textual', key: 'paint', text: 'Paint the store room blue.' }, 'store-room', 'coding-prior');
  const old = await op(prior, 'read');
  await work(prior, { goal: 'Prior library workshop observations', success_criteria: ['Retain selected workshop context'], non_goals: ['No publishing'],
    sources: { keep: [], add: [], omitted_sources: old.sources.map((s: any) => ({ source_binding: s.source_binding, reason: 'A different task with deliberately separate sources' })) } }, 'new_task');
  const when = await publish(prior, successor, 'workshop-time', { kind: 'textual', key: 'time', text: 'The East Library workshop begins at 18:00.' }, 'East Library workshop', 'textual-prior');
  const booking = await publish(prior, successor, 'workshop-booking', { kind: 'textual', key: 'booking', text: 'Reserve a seat at the front desk.' }, 'East Library workshop', 'textual-prior');
  const groups = [duration, identity, noise, when, booking];
  const c = await corpus(successor, groups);
  const codingTask = { kind: 'coding', query: 'build-events.v2', applies_to: 'build-events.v2',
    rows: [{ attempt_id: 'x', duration: 2 }, { attempt_id: 'x', duration: 2 }, { attempt_id: 'y', duration: 3 }] };
  const textualTask = { kind: 'textual', query: 'East Library workshop', applies_to: 'East Library workshop' };
  const assertCoding = (v: any, expected: any) => assert.deepEqual({ status: v.status, attempts: v.attempts, total_ms: v.total_ms }, expected);
  const first = await consumer('coding-before', successor, c, codingTask); assertCoding(first, expectations.coding_before);
  const firstText = await consumer('textual-before', successor, c, textualTask); assert.equal(firstText.text, expectations.textual_before);
  checks.push('fresh coding then textual output; complete original source delivery; two prior work/session groups; distractor excluded');

  const initialBinding = (await op(successor, 'inspect_corpus', { corpus_ref: c })).corpus_binding;
  await work(prior, { sources: { add: [note('note-ref:corrections', 'Explicit correction: build-events.v2 duration is already milliseconds. East Library workshop now begins at 19:00. Independent identity and booking remain applicable.')] } });
  const r = await op(prior, 'read'), binding = r.sources.find((s: any) => s.source_locator === 'note-ref:corrections').source_binding;
  const corrections: string[] = [];
  for (const [key, group, applies, field, value, targetKey] of [
    ['duration-units', duration, 'build-events.v2', 'multiplier', 1, 'duration'],
    ['workshop-delay', when, 'East Library workshop', 'text', 'The East Library workshop begins at 19:00.', 'time'],
  ] as any[]) {
    const data = { key, target_ref: group.experience_ref, topic: key, statement: JSON.stringify({ applies_to: applies, target_key: targetKey, field, value }), source_refs: [binding], targets: [scopeKey(successor.scope)] };
    const update = await op(prior, 'correct', data, r.material_basis); corrections.push(update.record.ref);
    assert.equal((await op(prior, 'correct', data, r.material_basis)).status, 'exact_replay');
  }
  await refuses(() => query(successor, c, codingTask.query, initialBinding), /selected_source_basis_changed/);
  // Re-open the authoritative store; fresh consumers reconstruct without an index.
  validateExternalStore(db); db.close(); db = new Database(dbPath);
  const after = await consumer('coding-after', successor, c, codingTask); assertCoding(after, expectations.coding_after);
  const textAfter = await consumer('textual-after', successor, c, textualTask); assert.equal(textAfter.text, expectations.textual_after);
  assert(after.used.some((u: any) => u.corrections.includes(corrections[0])));
  assert(textAfter.used.some((u: any) => u.corrections.includes(corrections[1])));
  assert(after.used.some((u: any) => u.experience === identity.experience_ref && u.corrections.length === 0));
  assert(textAfter.used.some((u: any) => u.experience === booking.experience_ref && u.corrections.length === 0));
  const extra = await publish(prior, successor, 'garden', { kind: 'textual', key: 'garden', text: 'Water the roof garden.' }, 'roof garden', 'textual-prior');
  const expanded = await corpus(successor, [...groups, extra]);
  const unrelated = await consumer('coding-unrelated', successor, expanded, codingTask); assertCoding(unrelated, expectations.coding_after);
  const textUnrelated = await consumer('textual-unrelated', successor, expanded, textualTask); assert.equal(textUnrelated.text, expectations.textual_after);
  assert.deepEqual(unrelated.used, after.used); assert.deepEqual(textUnrelated.used, textAfter.used);
  const unknown = await consumer('outside-applicability', successor, expanded, { ...codingTask, applies_to: 'build-events.v3' });
  assert.equal(unknown.status, expectations.outside_applicability); assert.equal(unknown.artifact, null); assert.deepEqual(unknown.used, []);
  const codingControl = await consumer('coding-control', successor, expanded, { ...codingTask, control: true }); assertCoding(codingControl, expectations.coding_after);
  const textControl = await consumer('textual-control', successor, expanded, { ...textualTask, control: true }); assert.equal(textControl.text, expectations.textual_after);
  checks.push('explicit corrections reach later outputs; independent material retained; unrelated selected addition leaves outputs/dependencies unchanged; honest non-use; direct-read control ties');

  const retainedContinuity = await readCodexRepositoryContinuityV01(db, { repository_root: prior.root });
  const retained = await readCodexRepositoryRetainedSourcesV01(db, { repository_root: prior.root,
    expected_snapshot_binding: retainedContinuity.continuity!.snapshot.binding!, query: 'duration artifact' });
  assert.equal(retained.status, 'available');
  assert.equal(retained.lookup!.results.length, 0, 'new-task cutoff cannot be widened');
  const full = await query(successor, expanded, codingTask.query);
  assert.equal(full.results.length, 2); assert.equal(full.truncated, false);
  assert.equal(full.results.find((g: any) => g.experience.ref === duration.experience_ref).source.event_time, null);
  assert.equal((await query(successor, expanded, 'no-such-observation')).returned_groups, 0);
  assert.equal((await query(successor, expanded, 'note-ref:duration')).returned_groups, 0, 'locators are not a matching oracle');
  const correctionMatch = await query(successor, expanded, 'duration-units');
  assert.equal(correctionMatch.results.length, 1);
  assert.equal(correctionMatch.results[0].experience.ref, duration.experience_ref);
  assert.equal(correctionMatch.results[0].materials.length, 1);
  assert.equal(correctionMatch.results[0].corrections.length, 1);
  await refuses(() => query(successor, expanded, 'q'.repeat(161)), /external_invalid_input/);
  await refuses(() => query(successor, expanded, 'a b c d e f g h i'), /selected_source_query_invalid/);
  await refuses(() => query(successor, expanded, 'x\ny'), /selected_source_query_invalid/);
  await refuses(() => query(other, expanded, 'build-events.v2'), /external_access_refused/);
  const bad = await put(successor, 'bad.json', { version: SELECTED_CORPUS_VERSION, project_key: scopeKey(other.scope), groups }, SELECTED_CORPUS_VERSION);
  await refuses(() => query(successor, bad, 'x'), /selected_corpus_invalid/);
  const manifestMaterial = (await op(successor, 'material', { ref: expanded })).material;
  const invalidGroups = { version: SELECTED_CORPUS_VERSION, project_key: scopeKey(successor.scope), groups: Array(17).fill(duration) };
  assert.throws(() => parseSelectedCorpus({ ...manifestMaterial, base64: Buffer.from(JSON.stringify(invalidGroups)).toString('base64') }, scopeKey(successor.scope)), /selected_corpus_invalid/);
  const completeGroup = full.results[0];
  const large = { ...completeGroup, experience: { ...completeGroup.experience, payload: { ...completeGroup.experience.payload, assessment: 'x'.repeat(SELECTED_RETRIEVAL_LIMITS.returned_utf8_bytes) } } };
  const bounded = retrieveSelectedSources({ corpus_ref: expanded, binding: full.corpus_binding, groups: [large], scanned_utf8_bytes: 0, scanned_materials: 0 }, codingTask.query, full.corpus_binding);
  assert.equal(bounded.returned_groups, 0); assert.equal(bounded.truncated, true);
  assert.equal(bounded.omitted_matching_groups, 1, 'never split a correction/condition group');
  const countBound = retrieveSelectedSources({ corpus_ref: expanded, binding: full.corpus_binding,
    groups: Array(5).fill(completeGroup), scanned_utf8_bytes: 0, scanned_materials: 0 }, codingTask.query, full.corpus_binding);
  assert.equal(countBound.returned_groups, 4); assert.equal(countBound.omitted_matching_groups, 1);
  const scope = scopeKey(successor.scope);
  const two = { ...manifestMaterial, base64: Buffer.from(JSON.stringify({ version: SELECTED_CORPUS_VERSION, project_key: scope, groups: [duration, identity] })).toString('base64') };
  const inspection = (n: number, body: string) => inspectSelectedCorpus({ corpus: two, projectKey: scope,
    readExperience: (r: string) => ({ ...completeGroup.experience, ref: r, payload: { ...completeGroup.experience.payload, materials: Array(n).fill(completeGroup.materials[0].ref) } }),
    readDependencies: () => ({ status: 'available', corrections: [] }),
    readMaterial: () => ({ ...completeGroup.materials[0], base64: body }) });
  assert.throws(() => inspection(17, ''), /selected_source_scan_bound/, 'material work cap');
  assert.throws(() => inspection(8, Buffer.alloc(65536, 'x').toString('base64')), /selected_source_scan_bound/, 'aggregate serialized scan cap');
  checks.push('Resume boundary preserved; query/count/output bounds; malformed scope; miss; full-group omission');

  // Real private HTTP route contract without starting or adopting a service.
  Object.assign(process.env, { AUGNES_RUNTIME_CHILD_ROLE: 'ui', AUGNES_RUNTIME_INSTANCE_ID: 'fixture', AUGNES_RUNTIME_GENERATION_ID: 'fixture-generation',
    AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: 'e'.repeat(64), AUGNES_COMPANION_PROXY_TOKEN: 'fixture-proxy-token' });
  const route = (auth: boolean) => externalRoute(new Request('http://127.0.0.1/api/augnes/external-response?scope=repository:local', {
    method: 'POST', headers: { host: '127.0.0.1', 'content-type': 'application/json', 'x-augnes-external': EXTERNAL_MARKER,
      'x-augnes-companion-proxy': auth ? 'fixture-proxy-token' : 'invalid', 'x-augnes-runtime-instance': 'fixture',
      'x-augnes-runtime-generation': 'fixture-generation', 'x-augnes-runtime-repository': 'e'.repeat(64) },
    body: JSON.stringify({ repository_root: successor.root, action: 'retrieve_sources', data: { corpus_ref: expanded, query: codingTask.query, expected_corpus_binding: full.corpus_binding } }) }));
  assert.equal((await route(false)).status, 403); const routed = await route(true); assert.equal(routed.status, 200);
  assert.deepEqual((await routed.json()).results, full.results);
  assert(externalToolDescription().inputSchema.properties.action.enum.includes('retrieve_sources'));
  checks.push('private authenticated route delivers identical bytes; unauthenticated route refuses; ordinary tool exposes action');

  const backup = path.join(owner.root, 'backup.db'); await db.backup(backup);
  const restored = new Database(backup); validateExternalStore(restored); restored.close();
  const activePath = process.env.AUGNES_DB_PATH; process.env.AUGNES_DB_PATH = backup;
  assert.deepEqual((await query(successor, expanded, codingTask.query)).results, full.results);
  process.env.AUGNES_DB_PATH = activePath;
  const baselineRows = canonical(db.prepare('SELECT * FROM vnext_external_records ORDER BY ref').all());
  const lost = full.results[0].materials[0].ref;
  const savedMaterial = db.prepare('SELECT * FROM vnext_external_materials WHERE ref=?').get(lost) as any;
  db.prepare('UPDATE vnext_external_materials SET body=? WHERE ref=?').run(Buffer.from('damaged'), lost);
  await refuses(() => query(successor, expanded, codingTask.query), /external_material_integrity_failed/);
  db.prepare('UPDATE vnext_external_materials SET body=? WHERE ref=?').run(savedMaterial.body, lost);
  db.prepare('DELETE FROM vnext_external_materials WHERE ref=?').run(lost); // Disposable loss fault, not a new deletion policy.
  await refuses(() => query(successor, expanded, codingTask.query), /external_material_known_absent/);
  db.prepare('INSERT INTO vnext_external_materials VALUES(?,?,?,?,?)').run(savedMaterial.ref, savedMaterial.workspace_id, savedMaterial.project_id, savedMaterial.metadata_json, savedMaterial.body);
  assert.equal(canonical(db.prepare('SELECT * FROM vnext_external_records ORDER BY ref').all()), baselineRows);
  await op(prior, 'withdraw', { ref: corrections[0], target_key: scopeKey(successor.scope) });
  await refuses(() => query(successor, expanded, codingTask.query), /selected_source_context_unavailable/);
  await op(prior, 'withdraw', { ref: duration.experience_ref, target_key: scopeKey(successor.scope) });
  await refuses(() => query(successor, expanded, codingTask.query), /external_access_refused/);
  const excluded = await corpus(successor, [when, booking, noise]);
  assert.equal((await query(successor, excluded, codingTask.query)).returned_groups, 0);
  await refuses(() => query(successor, expanded, codingTask.query), /external_access_refused/); // Explicit reselection cannot bypass withdrawal.
  config.projects = config.projects.filter((p: any) => p.project_key !== scopeKey(successor.scope)); configure();
  await refuses(() => query(successor, excluded, textualTask.query), /external_access_refused/);
  assert.equal(first.total_ms, 5000); assert.equal(firstText.text, expectations.textual_before);
  validateExternalStore(db);
  checks.push('fresh store reconstruction; SQLite backup/source-owner validation; source loss refuses; correction/source withdrawal; explicit exclusion/reselection; access removal; prior bytes/output retained');

  const usage = db.prepare('SELECT COUNT(*) materials, SUM(length(body)) body_bytes FROM vnext_external_materials').get();
  const report = { evidence: 'developer_exposed_deterministic_mechanism_and_use', source_base: 'fe2d1eb03ac19257477d083ba2219b3570e7c66e',
    expectations_sha256: hashBytes(readFileSync(path.join(root, 'scripts/fixtures/selected-source/expectations.json'))),
    source_groups: [...groups, extra], corpus_refs: [c, expanded, excluded], correction_refs: corrections,
    checks, consumers, setup_calls: calls, storage: usage, indexing: 'none; fresh authoritative scan per request',
    comparison: 'both methods produced correct observed outputs; no measured usefulness or model advantage',
    provider_calls: 0, network_attempts: guard.attempts.length, automatic_follow_on: false,
    elapsed_ms: performance.now() - start };
  assert.equal(guard.attempts.length, 0);
  if (exportPath) {
    mkdirSync(exportPath);
    for (const f of files) { const destination = path.join(exportPath, f.name); mkdirSync(path.dirname(destination), { recursive: true }); writeFileSync(destination, f.bytes); }
    writeFileSync(path.join(exportPath, 'report.json'), JSON.stringify(report, null, 2));
    copyFileSync(path.join(root, 'scripts/fixtures/selected-source/expectations.json'), path.join(exportPath, 'expectations.json'));
  }
  console.log(JSON.stringify({ status: 'passed', checks, consumers: consumers.length, elapsed_ms: report.elapsed_ms, storage: usage }));
}
void main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  db.close(); guard.restore();
  for (const k of Object.keys(process.env)) if (!(k in savedEnv)) delete process.env[k];
  Object.assign(process.env, savedEnv);
  const cleanup = cleanupCanonicalTestResources([owner]);
  console.log(JSON.stringify({ cleanup })); assert(cleanup.every((r: any) => r.completed));
});
