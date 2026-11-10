// #1595: controlled authors and real native owners, never independent parties.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { applyCanonicalDatabaseMigrations } from './canonical-database-migrations.mjs';
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from '../lib/vnext/persistence/project-identity-registry';
import { scopeKey, validateExternalStore } from '../lib/vnext/persistence/external-response-store.mjs';
import { EXTERNAL_VERSION } from '../lib/vnext/external-response-rules.mjs';
import { previewOperatingProfile } from '../lib/vnext/operating-profile.mjs';
import { canonical } from '../plugins/augnes-operator/mcp/review-connection.mjs';
import { EXTERNAL_TOOL } from '../plugins/augnes-operator/mcp/external-response.mjs';
import { POST as externalRoute } from '../app/api/augnes/external-response/route';
import { checkDeclarations, sha256 } from '../examples/native-method-use/check-declarations.mjs';
import { mode, directory, root, db, artifactDirectory, save, raw, call, readCurrent, saveChanges, savePrepared, note, refused, setupServer, finish, choice, find } from './execution-choice-transition-harness';

const consumerRoot = path.join(directory, 'consumer-project');
const readArtifact = (name: string) => JSON.parse(readFileSync(path.join(artifactDirectory, name + '.json'), 'utf8'));
const external = (repository_root: string, action: string, data: object = {}, expected_material_ref?: string) => call(EXTERNAL_TOOL, { repository_root, action, data, ...(expected_material_ref ? { expected_material_ref } : {}) });
async function current(repositoryRoot: string) {
  const r = await call('augnes_resume_repository', { repositoryRoot });
  return call('augnes_read_repository_work_sources', { repositoryRoot, expectedSnapshotBinding: r.continuity.snapshot.binding, includeWorkDefinition: true });
}
async function put(repositoryRoot: string, name: string, content: string, dependencies: string[] = [], version = 'native-method-case.v1') {
  const body = Buffer.from(content), basis = (await external(repositoryRoot, 'read')).material_basis;
  const data = { metadata: { name, media_type: 'application/json', version, source: 'Controlled #1595 case; authored provenance', applicability: 'Declared platform fit only; no install or live-runtime evidence', dependencies, sha256: 'sha256:' + sha256(body), size: body.length }, base64: body.toString('base64') };
  const first = await external(repositoryRoot, 'put_material', data, basis);
  assert.equal((await external(repositoryRoot, 'put_material', data, basis)).material_ref, first.material_ref);
  return first.material_ref;
}
const burden = { preparation: 'Two manifests and scoped terms', waiting: 'No external wait observed', execution: 'Local deterministic check', coordination: 'Controlled manual relay', integration: 'Original and supported finding retained', switching: 'Unknown outside this case' };
const judgment = (chosen: string, reason: string) => ({ present: 'Wait', alternatives: [
  { arrangement: 'Wait', benefit: 'Retain the restriction and seek authority', burden },
  { arrangement: 'Commission', benefit: 'Obtain the bounded declaration report', burden, manual_contribution: true }
], recommended: chosen, chosen, expectation: reason, uncertainty: 'No verified external actor, live compatibility or payment', horizon: new Date(Date.now() + 3600000).toISOString(), reconsider_when: 'Restriction scope, authority or inputs change' });

async function produce() {
  applyCanonicalDatabaseMigrations(db); mkdirSync(root); mkdirSync(consumerRoot); mkdirSync(artifactDirectory);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const projects = [root, consumerRoot].map(localRoot => {
    const r = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: normalizeLocalProjectRootRefV01(localRoot, { base_path: directory }), display_name: localRoot === root ? 'A package investigation' : 'C next package assessment' });
    return { repository_root: localRoot, project_key: scopeKey({ workspace_id: workspace.workspace_id, project_id: r.project.project_id }) };
  });
  const config = { version: EXTERNAL_VERSION, projects: projects.map((p, i) => ({ ...p, share_to: i === 0 ? [projects[1].project_key] : [] })), envelopes: [] };
  writeFileSync(path.join(directory, 'external.json'), JSON.stringify(config), { mode: 0o600 });
  const target = { node: '22.23.4', os: 'darwin', cpu: 'arm64' };
  const pkg = (version: string, engine: string) => JSON.stringify({ name: 'case-widget', version, engines: { node: engine }, os: ['darwin'], cpu: ['arm64'] }) + '\n';
  const pair = { baseline: pkg('1.0.0', '>=22.0.0 <25'), candidate: pkg('2.0.0', '>=24.0.0 <25'), target };
  const contract = { author: 'Controlled case author, not an independent principal', restriction: { origin: 'A executor host policy v1', actor: 'A executor', action: 'direct investigation', scope: 'executor only', reason: 'read-only current role' }, commissioning: { origin: 'A controller scenario authorization v1', scope: 'task-owned declarations only', permitted: true }, compensation: { hypothetical: true, beneficiary: 'B', benefit: '10 example credits', condition: 'Correct bounded investigation, including a negative finding', proposed: true, accepted: 'authored scenario agreement only', fulfilled: false }, private_method: 'B retains internal checklist; no redistribution' };
  await saveChanges({ goal: 'Decide whether case-widget 2.0 declares support for A target before requesting installation testing', success_criteria: ['Preserve a checked negative finding and leave untested claims open'], non_goals: ['No installation, dispatch, independent participation or payment'] }, true);
  await saveChanges({ sources: { add: [note('note-ref:package-pair', JSON.stringify(pair)), note('note-ref:scoped-terms', JSON.stringify(contract))] } });
  save('contract', contract); save('input-pair', pair);
  // Scope contrasts are authored choices actually preserved/read by the owner.
  // The product validates structure/binding, not the truth of policy prose.
  const scopeControls = [];
  for (const [scope, permission] of [['project-wide no commissioning', false], ['requester A cannot commission', false], ['executor direct-only restriction', true]] as const) {
    const c = structuredClone(contract); c.restriction.scope = scope; c.commissioning.permitted = permission;
    const before = await readCurrent();
    await saveChanges({ sources: { replace: [{ source_binding: find(before, 'note-ref:scoped-terms').source_binding, note: note('note-ref:scoped-terms', JSON.stringify(c)) }] } });
    const prepared = await choice('choose', { judgment: judgment(permission ? 'Commission' : 'Wait', permission ? 'A separately permits this bounded request' : 'No commissioning; retain restriction') });
    await savePrepared(prepared);
    const read = await choice('read');
    assert.equal(read.choice.judgment.chosen, permission ? 'Commission' : 'Wait');
    scopeControls.push({ scope, authored_chosen: permission ? 'Commission' : 'Wait', projection: read });
    if (!permission) {
      assert(!read.manual_contribution?.request);
      const selected = (await readCurrent()).sources.find((s: any) => s.source_locator?.startsWith('note-ref:execution-choice:'));
      await saveChanges({ sources: { deselect: [selected.source_binding] } });
    }
  }
  save('scope-controls', { enforcement: 'Author-selected policy interpretation; no runtime policy evaluator', cases: scopeControls });
  const profileText = readFileSync('examples/native-method-use/operating-profile.json', 'utf8');
  const preview = previewOperatingProfile(profileText);
  assert.equal(preview.execution_ready, false); assert([...canonical(preview.profile)].length <= 2000);
  save('profile-preview', preview);
  const pairRef = find(await readCurrent(), 'note-ref:package-pair').source_binding;
  const participation = { purpose: 'Check declared platform fit', question: 'Compare the exact two manifests with the selected target', expected_return: 'Original declaration checks, hashes and untested limits', checks: 'Recalculate ranges and target membership', check_use_owner: 'A case author', return_method: 'Local UTF-8 file', feedback_method: 'Saved authored judgment', recheck: 'Input, purpose or authority changes', material_refs: [pairRef], operating_profile: { json: profileText, step_id: 'check' } };
  const prepared = await choice('participate', { participation });
  assert.equal(prepared.delivery.operating_profile.execution_ready, false);
  assert(!prepared.delivery.request.expected_return.includes('credits'));
  await savePrepared(prepared); save('request', prepared.delivery);
  const input = JSON.parse(prepared.delivery.request.material[0].text);
  const basicMethod = { version: 'package-declarations.v1', purpose: 'declared-platform-fit' };
  const original = { baseline: checkDeclarations(input.baseline, input.target, basicMethod), candidate: checkDeclarations(input.candidate, input.target, basicMethod), unsupported_recommendation: 'Install anyway: unsupported and not used' };
  const originalBytes = JSON.stringify(original) + '\n';
  writeFileSync(path.join(artifactDirectory, 'original-report.json'), originalBytes);
  const returnArgs = { manual_request_ref: prepared.delivery.manual_request_ref, material_ref: prepared.delivery.material_ref, source_revision: 'declaration-check-v1', selection: 'Whole report', actor: 'Controlled B role', assistance: 'Deterministic task-owned script; no independent participation', content: originalBytes };
  await refused('wrong original request', () => choice('receive', { manual_return: { ...returnArgs, manual_request_ref: 'sha256:' + '0'.repeat(64) } }, true), 'execution_choice_manual_request_mismatch');
  await savePrepared(await choice('receive', { manual_return: returnArgs }));
  const returned = (await choice('read')).manual_contribution;
  assert.equal(returned.original.value.content, originalBytes);
  // Independent expectations are in the parent driver, not generated here.
  const used = { report_sha256: sha256(originalBytes), baseline: original.baseline.outcome, candidate: original.candidate.outcome, deliverable_acceptance: 'Authored: bounded report meets the requested declaration check', result: 'Hold installation proposal: candidate excludes the declared Node 22 target', excluded: 'Install-anyway recommendation', runtime_compatibility: 'NOT_TESTED', compensation: 'Outstanding hypothetical condition; no payment' };
  await saveChanges({ sources: { add: [note('note-ref:checked-package-use', JSON.stringify(used), 'derived_interpretation')] } });
  const resultRef = find(await readCurrent(), 'note-ref:checked-package-use').source_binding;
  await savePrepared(await choice('assess', { assessment: { manual_request_ref: returned.request.ref, manual_return_ref: returned.original.ref, result_refs: [resultRef], disposition: 'partly_used', checks: 'Compared exact input hashes; Node 22 is below 24; os/cpu match', applicability: 'Only supplied declarations and target', reason: 'Use mismatch finding; decline unsupported installation advice', uncertainty: 'No installation or live runtime test', unfinished: 'Hypothetical B compensation unfulfilled; runtime test separately authorized', next_action: 'Retain hold and publish only permitted conditional method', reconsider_when: 'New target, declarations or authority' } }));
  const saved = await choice('read'); save('a-saved', saved); save('a-output', used);
  const privateRef = await put(root, 'b-withheld-checklist.json', JSON.stringify({ private: 'Task-owned B internal checklist fixture; withheld from C', revision: '1' }));
  const originalRef = await put(root, 'original-report.json', originalBytes);
  const method = { ...basicMethod, source: { report_ref: originalRef, sha256: sha256(originalBytes), revision: 'declaration-check-v1' }, procedure: ['Read exact manifest strings and target', 'Accept only >=major.minor.patch <major and literal positive os/cpu arrays', 'Compare the floor/ceiling and membership', 'Keep declaration fit distinct from runtime evidence'], applicability: 'Task asks only about declared platform fit; exact supported syntax', contrary_case: 'Other semver syntax or a request for live compatibility is unsuitable', limitations: ['No install, ABI, dependency or live compatibility conclusion', 'No inherited authority, compensation or B availability'], correction: 'Inspect current shared experience and recheck binding before use' };
  const methodRef = await put(root, 'permitted-method.json', JSON.stringify(method), [originalRef], method.version);
  const state = await external(root, 'read');
  const publishData = { key: 'permitted-package-method-v1', title: 'Package declared platform fit method', source_refs: [resultRef], conditions: method.applicability, association: { endpoint: 'none', account: 'unknown', operator: 'Controlled case author', confidence: 'declared' }, assessment: 'Derived from actual negative declaration check; C must decide applicability and authority', materials: [methodRef, originalRef], targets: [projects[1].project_key] };
  const published = await external(root, 'publish', publishData, state.material_basis);
  assert.equal((await external(root, 'publish', publishData, state.material_basis)).status, 'exact_replay');
  const manifest = { version: 'augnes.selected-source-corpus.v1', project_key: projects[1].project_key, groups: [{ experience_ref: published.record.ref, source: { identity: 'controlled-package-investigation', revision: 'declaration-check-v1', work: saved.manual_contribution.task_identity, session: null, source_time: null, event_time: null, valid_from: null, valid_until: null, meaning: 'inference', adoption: 'proposed', original_context: 'complete_selected_material' } }] };
  const task = { display: 'C candidate 2.1', goal: 'Check the declared fit of a new candidate on Node 24', purpose: 'declared-platform-fit', candidate: pkg('2.1.0', '>=24.20.0 <25'), target: { node: '24.22.1', os: 'darwin', cpu: 'arm64' }, authority: { origin: 'C controller authored case instruction v1', permitted_action: 'local declaration check and saved output only', install: false, commissioning: false } };
  await saveChanges({ goal: task.goal, success_criteria: ['Save checked declaration result and current applicability judgment'], non_goals: ['No copied A decision, private B method or runtime claim'] }, true, consumerRoot);
  await saveChanges({ sources: { add: [note('note-ref:package-task', JSON.stringify(task))] } }, false, consumerRoot);
  const corpusRef = await put(consumerRoot, 'selected-method-corpus.json', JSON.stringify(manifest), [], manifest.version);
  await saveChanges({ sources: { add: [note('note-ref:selected-method-entry', JSON.stringify({ corpus_ref: corpusRef, query: 'Package' }))] } }, false, consumerRoot);
  writeFileSync(path.join(directory, 'consumer-entry.json'), JSON.stringify({ repositoryRoot: consumerRoot }));
  save('producer', { projects, workspace: workspace.workspace_id, privateRef, originalRef, methodRef, experienceRef: published.record.ref, corpusRef, publishData, method, originalBytes, aTask: saved.manual_contribution.task_identity });
  save('derived-method', method);
}

async function changeTask() {
  const view = await current(consumerRoot), source = find(view, 'note-ref:package-task'), task = JSON.parse(source.excerpt_text);
  if (mode === 'label') task.display = 'Renamed display only';
  else task.purpose = 'live-runtime-compatibility';
  await saveChanges({ sources: { replace: [{ source_binding: source.source_binding, note: note('note-ref:package-task', JSON.stringify(task)) }] } }, false, consumerRoot);
}

async function boundaries() {
  const p = readArtifact('producer'), denied: any[] = [];
  const deny = async (label: string, args: object, reason: string) => denied.push({ label, result: await refused(label, () => raw(EXTERNAL_TOOL, args), reason) });
  await deny('private material withheld', { repository_root: consumerRoot, action: 'material', data: { ref: p.privateRef } }, 'external_access_refused');
  await deny('shared experience does not expose undeclared private bytes', { repository_root: consumerRoot, action: 'material', data: { ref: p.privateRef, experience_ref: p.experienceRef } }, 'external_access_refused');
  const c = await external(consumerRoot, 'read');
  await deny('A task-local source cannot be transplanted into C publish', { repository_root: consumerRoot, action: 'publish', expected_material_ref: c.material_basis, data: { ...p.publishData, key: 'bad-source-transfer', materials: [], targets: [] } }, 'external_source_unavailable');
  const before = await external(consumerRoot, 'inspect_corpus', { corpus_ref: p.corpusRef });
  const state = await external(root, 'read');
  const correction = await external(root, 'correct', { key: 'clarify-syntax', target_ref: p.experienceRef, topic: 'Supported syntax', statement: 'Only >=major.minor.patch <major syntax; other syntax needs a different check.', source_refs: p.publishData.source_refs, targets: [p.projects[1].project_key] }, state.material_basis);
  await deny('stale binding refuses after current correction', { repository_root: consumerRoot, action: 'retrieve_sources', data: { corpus_ref: p.corpusRef, query: 'Package', expected_corpus_binding: before.corpus_binding } }, 'selected_source_basis_changed');
  const refreshed = await external(consumerRoot, 'inspect_corpus', { corpus_ref: p.corpusRef });
  const delivered = await external(consumerRoot, 'retrieve_sources', { corpus_ref: p.corpusRef, query: 'Package', expected_corpus_binding: refreshed.corpus_binding });
  assert(delivered.results[0].corrections.some((r: any) => r.ref === correction.record.ref));
  save('current-correction-read', delivered);
  const original = await external(root, 'material', { ref: p.originalRef });
  assert.equal(Buffer.from(original.material.base64, 'base64').toString(), p.originalBytes);
  const outputBefore = readFileSync(path.join(artifactDirectory, 'consumer-current-output.json'), 'utf8');
  const withdrawn = await external(root, 'withdraw', { ref: p.experienceRef, target_key: p.projects[1].project_key });
  assert.equal(withdrawn.prior_copies_recalled, false);
  await deny('withdrawn share refuses even with current binding', { repository_root: consumerRoot, action: 'retrieve_sources', data: { corpus_ref: p.corpusRef, query: 'Package', expected_corpus_binding: refreshed.corpus_binding } }, 'external_access_refused');
  assert.equal(readFileSync(path.join(artifactDirectory, 'consumer-current-output.json'), 'utf8'), outputBefore);
  const priorCopy = await external(consumerRoot, 'material', { ref: readArtifact('consumer-current-process').output_ref });
  assert.equal(Buffer.from(priorCopy.material.base64, 'base64').toString(), outputBefore);
  const savedC = await current(consumerRoot); assert(find(savedC, 'note-ref:current-method-judgment'));
  const unauthenticated = await externalRoute(new Request('http://127.0.0.1/api/augnes/external-response?scope=repository:local', { method: 'POST', headers: { 'content-type': 'application/json', 'x-augnes-external': 'external-response-v1' }, body: JSON.stringify({ repository_root: consumerRoot, action: 'read' }) }));
  assert.equal(unauthenticated.status, 403);
  const staleAuth = await externalRoute(new Request('http://127.0.0.1/api/augnes/external-response?scope=repository:local', { method: 'POST', headers: {
    'content-type': 'application/json', 'x-augnes-external': 'external-response-v1',
    'x-augnes-companion-proxy': process.env.AUGNES_COMPANION_PROXY_TOKEN!,
    'x-augnes-runtime-instance': process.env.AUGNES_RUNTIME_INSTANCE_ID!,
    'x-augnes-runtime-generation': 'obsolete-generation',
    'x-augnes-runtime-repository': process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT!
  }, body: JSON.stringify({ repository_root: consumerRoot, action: 'read' }) }));
  assert.equal(staleAuth.status, 409);
  validateExternalStore(db);
  save('boundaries', { denied, withdrawn, authentication_refusal: await unauthenticated.json(), stale_authentication_refusal: await staleAuth.json(), original_unchanged: true, delivered_copy_preserved: true, saved_consumer_readable: true, validated_store: true });
}

process.env.AUGNES_EXTERNAL_CONFIG_FILE = path.join(directory, 'external.json');
void setupServer().then(() => mode === 'producer' ? produce() : mode === 'boundary' ? boundaries() : changeTask()).catch(error => { console.error(error); process.exitCode = 1; }).finally(finish);
