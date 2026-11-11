import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { headBinding } from '../apps/web_planning/src/contract.ts';
import { planningDraft, prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { openFileProjects, openFileProject, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { fixtureScope, migrationPrefix } from './web-planning-local-runtime.mjs';
import { webRoot } from './build-web-planning.mjs';

const contributor = 'independent-principal-b@example.test';
export { session as projectSession, ok as projectOk, agentSession as projectAgentSession, bindings as projectBindings, input as projectInput };
const route = (r, suffix = '') => '/api/work/' + r.work_id + (suffix ? '/' + suffix : '');
const upload = (name, text) => {
  const bytes = Buffer.from(text);
  return { name, media_type: 'text/plain', bytes: bytes.length,
    digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'), data: bytes.toString('base64') };
};
const bindings = () => ({ PROJECT_ENTRY_MODE: 'admitted-private-v1', PROJECT_ADMITTED_EMAILS: JSON.stringify([contributor]),
  PARTICIPATION_MODE: 'verified-recipient-v1', LOCAL_PARTICIPANT_SESSION: randomUUID(), LOCAL_PARTICIPANT_LOGIN: contributor });
const principalCookie = (s, actor) => 'web_planning_local=' + (actor === 'B' ? s.env.LOCAL_PARTICIPANT_SESSION : s.env.LOCAL_SESSION);
async function agentSession(server, actor, use) {
  const keys = ['AUGNES_WEB_ORIGIN', 'AUGNES_WEB_FIXTURE_COOKIE', 'AUGNES_WEB_PROJECT_ID'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.AUGNES_WEB_ORIGIN = server.origin;
  process.env.AUGNES_WEB_FIXTURE_COOKIE = principalCookie(server, actor);
  delete process.env.AUGNES_WEB_PROJECT_ID;
  try { return await use(); }
  finally { for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
}

// New HTTP/CSRF sessions share only fixture authentication and a deliberately
// selected project. They retain no prior editor or conversation state.
async function session(server, actor, project, entryPath) {
  const origin = server.env.APP_ORIGIN, cookie = principalCookie(server, actor);
  const entry = await server.mf.dispatchFetch(origin + (entryPath ?? (project ? '/?project=' + project.project_id : '/projects')), { headers: { cookie } });
  assert.equal(entry.status, 200, await entry.clone().text());
  const html = await entry.text(), csrf = html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
  const csrfCookie = entry.headers.get('set-cookie')?.split(';')[0];
  assert(csrf && csrfCookie, 'entry must issue a principal/project-bound write session');
  const cookies = cookie + '; ' + csrfCookie;
  return { html, csrf, cookies, project, async request(url, body, extra = {}) {
    const response = await server.mf.dispatchFetch(origin + url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { cookie: cookies, ...(project && !entryPath ? { 'x-web-planning-project': project.project_id } : {}),
        ...(body === undefined ? {} : { origin, 'content-type': 'application/json', 'x-csrf-token': csrf }), ...extra },
      ...(body === undefined ? {} : { body: JSON.stringify({ ...(project ? { workspace_id: project.workspace_id, project_id: project.project_id } : {}), ...body }) }),
    });
    const raw = await response.text();
    const data = (response.headers.get('content-type') ?? '').includes('application/json') ? JSON.parse(raw) : raw;
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    return { status: response.status, data, raw };
  } };
}
async function ok(c, url, body) {
  const r = await c.request(url, body); assert.equal(r.status, 200, JSON.stringify(r.data)); return r.data;
}
async function prepare(c, head, draft) {
  const t = await ok(c, route(head, 'ticket'), { ...draft, expected: headBinding(head) });
  return { ...draft, ticket: t.ticket };
}
async function change(c, head, goal) {
  const draft = planningDraft(head); draft.definition.goal = goal;
  return prepare(c, head, draft);
}
const input = (actor) => ({ request_key: randomUUID(), name: actor + ' independent project',
  purpose: actor === 'B' ? 'B_PRIVATE_PURPOSE: prepare a quiet accessible reading session' : 'A_PRIVATE_PURPOSE: check the workshop notice',
  judgment: { text: actor === 'B' ? 'The east ramp is confirmed accessible; the evening noise is still unknown.' : 'The draft needs an exact arrival time.',
    source: actor === 'B' ? 'Venue email, 2026-11-10; noise was not assessed' : 'Workshop draft, 2026-11-10' },
  unfinished: actor === 'B' ? 'B_PRIVATE_UNFINISHED: measure evening noise before booking.' : 'A_PRIVATE_UNFINISHED: confirm arrival instructions.',
  next_action: actor === 'B' ? 'B_PRIVATE_NEXT: measure the room at 18:00 and retain the result.' : 'A_PRIVATE_NEXT: ask for a corrected notice.' });

export async function checkIndependentProjects({ start, root, passed }) {
  const s = await start('independent-projects', { bindings: bindings() });
  const entryA = await session(s, 'A'), entryB = await session(s, 'B');
  const ia = input('A'), ib = input('B');
  const createdA = await ok(entryA, '/api/projects', ia);
  const createdB = await agentSession(s, 'B', async () => (await openFileProjects()).create(ib));
  const a = createdA.project, b = createdB.project;
  for (const p of [a, b]) for (const key of ['workspace_id', 'project_id', 'author_ref', 'continuation_work_id']) assert.match(p[key], /^[a-f0-9-]{36}$/);
  assert.notEqual(a.project_id, b.project_id); assert.notEqual(a.author_ref, b.author_ref);
  const replayedB = await ok(entryB, '/api/projects', ib);
  assert.deepEqual(replayedB.project, createdB.project, 'unknown create acknowledgement must reconcile by exact key');
  assert.deepEqual(replayedB.saved, createdB.saved); assert.equal(replayedB.replayed, true);
  assert.equal((await entryB.request('/api/projects', { ...ib, purpose: 'Altered replay' })).status, 409);
  const listA = await ok(entryA, '/api/projects'), listB = await ok(entryB, '/api/projects');
  assert(listA.projects.some(p => p.project_id === a.project_id)); assert(!JSON.stringify(listA).includes(b.project_id));
  assert.equal(listB.projects.length, 1); assert.equal(listB.projects[0].project_id, b.project_id);
  assert(!JSON.stringify(listB).includes(a.name));
  await agentSession(s, 'B', async () => {
    const entry = await openFileProjects(); assert.deepEqual(await entry.list(), listB);
    const selected = await entry.open(b.project_id); assert.equal(selected.project.project_id, b.project_id);
    assert.equal((await selected.continuation()).saved.work_id, b.continuation_work_id);
    await assert.rejects(entry.open(a.project_id), /access_denied/);
  });
  let owner = await session(s, 'A', a), independent = await session(s, 'B', b);
  let ah = (await ok(owner, '/api/project/continuation')).saved;
  let bh = (await ok(independent, '/api/project/continuation')).saved;
  assert.equal(ah.work_id, a.continuation_work_id); assert.equal(bh.work_id, b.continuation_work_id);
  assert.equal(bh.author_ref, b.author_ref); assert.equal(bh.definition.goal, ib.purpose);
  for (const value of [ib.judgment.text, ib.judgment.source, ib.unfinished, ib.next_action]) assert(JSON.stringify(bh).includes(value), value);
  assert.equal((await ok(independent, '/api/project')).project_id, b.project_id);
  assert.equal((await ok(independent, '/api/works')).items[0].work_id, b.continuation_work_id);
  passed('independent projects: admitted A and B create and select isolated projects before any W1 participation; exact create replay, retained purpose and attributable continuation');

  for (const actor of ['A', 'B']) {
    const c = actor === 'A' ? owner : independent, other = actor === 'A' ? b : a;
    for (const url of ['/api/project', '/api/works', '/api/works/search?q=PRIVATE', route({ work_id: other.continuation_work_id }),
      route({ work_id: other.continuation_work_id }, 'history'), route({ work_id: other.continuation_work_id }, 'export')]) {
      const r = await c.request(url, undefined, { 'x-web-planning-project': other.project_id });
      assert.equal(r.status, 403, url); assert(!r.raw.includes(other.name));
    }
    assert.equal((await s.mf.dispatchFetch(s.origin + '/?project=' + other.project_id, { headers: { cookie: principalCookie(s, actor) } })).status, 403);
  }
  for (const suffix of ['', 'history', 'export', 'exchanges']) {
    const r = await independent.request(route(ah, suffix));
    assert([403, 404].includes(r.status), suffix + ': ' + JSON.stringify(r.data)); assert(!r.raw.includes('A_PRIVATE'));
  }
  assert.deepEqual((await ok(independent, route(ah, 'participation'))).grants, [], 'unknown work has no grants in B scope');
  assert.equal((await independent.request('/api/drafts', { project_id: a.project_id })).status, 403);
  assert.equal((await independent.request('/api/works', undefined, { 'x-web-planning-project': b.project_id + ',' + a.project_id })).status, 403);
  for (const query of ['?unexpected=1', '?project=' + a.project_id + '&unexpected=1', '?project=' + a.project_id + '&project=' + a.project_id]) {
    assert.equal((await s.mf.dispatchFetch(s.origin + '/' + query, { headers: { cookie: principalCookie(s, 'A'), 'x-web-planning-project': a.project_id } })).status, 403);
  }
  assert.equal((await entryB.request('/api/projects', input('B'), { cookie: principalCookie(s, 'A') + '; ' + entryB.cookies.split('; ').at(-1) })).status, 403);
  assert.equal((await s.mf.dispatchFetch(s.origin + '/projects', { headers: { 'oai-authenticated-user-email': contributor } })).status, 403);
  const pendingB = await change(independent, bh, 'B-private pending continuation');
  assert.equal((await owner.request(route(bh, 'save'), pendingB)).status, 403, 'another project cannot retarget the signed write');
  const legacy = await session(s, 'A', fixtureScope), pendingA = await change(owner, ah, 'A pending own-project write');
  assert.equal((await legacy.request(route(ah, 'save'), pendingA)).status, 403, 'even the same admitted principal cannot retarget a ticket to another owned project');
  passed('project isolation: changed project/work identifiers, account CSRF, header spoof, wrong-project tickets and own-project selection cannot disclose or retarget writes');

  // A browser cookie jar keeps only the latest value for each cookie name.
  // Visiting the chooser and another project must not invalidate an earlier
  // project's pending operation or make its token valid in the new scope.
  const jar = new Map();
  for (const c of [owner, entryA, legacy]) for (const part of c.cookies.split('; ')) jar.set(part.slice(0, part.indexOf('=')), part);
  const sharedCookies = [...jar.values()].join('; ');
  const jarResolve = await owner.request(route(ah, 'resolve'), pendingA, { cookie: sharedCookies });
  assert.equal(jarResolve.status, 200, JSON.stringify(jarResolve.data)); assert.equal(jarResolve.data.outcome, 'unknown');
  assert.equal((await owner.request(route(ah, 'save'), pendingA, { cookie: sharedCookies, 'x-csrf-token': legacy.csrf })).status, 403);
  const jarSave = await owner.request(route(ah, 'save'), pendingA, { cookie: sharedCookies });
  assert.equal(jarSave.status, 200, JSON.stringify(jarSave.data)); ah = jarSave.data.saved;
  passed('project tabs: account and two project cookies coexist while the original CSRF and ticket resolve/save successfully; a different scope token still refuses');

  const aDraft = planningDraft(ah);
  aDraft.files = [{ name: 'private-source.txt', role: 'source', data: Buffer.from('A_PRIVATE_SOURCE_BYTES').toString('base64') }];
  ah = (await ok(owner, route(ah, 'save'), await prepare(owner, ah, aDraft))).saved;
  const filePath = route(ah, 'files/' + ah.revision + '/' + ah.fingerprint.slice(7) + '/0');
  assert.equal((await ok(owner, filePath)), 'A_PRIVATE_SOURCE_BYTES');
  const crossFile = await independent.request(filePath); assert([403, 409].includes(crossFile.status)); assert(!crossFile.raw.includes('A_PRIVATE'));
  const event = await ok(owner, route(ah, 'exchanges/save'), { kind: 'request', basis: null, expected: headBinding(ah), request_key: randomUUID(),
    message: 'A_PRIVATE_REASON', next_action: 'A_PRIVATE_INTERNAL_NEXT', files: [upload('notice.txt', 'Arrival 18:30.\n')] });
  const grant = await ok(owner, route(ah, 'participation/create'), { grant_id: randomUUID(), request: event.item.ref, expected: event.head,
    recipient: contributor, brief: 'Correct arrival to 18:00.', next_action: 'Return the corrected notice.', indices: [0], expires: Date.now() + 86400000 });
  // A known URL is not secret authority. Another project cannot make an
  // existing recipient route ambiguous by choosing the same grant identifier.
  // Use a third recipient: asking B to invite itself would test the earlier
  // self-recipient refusal instead of the cross-project uniqueness boundary.
  const thirdRecipient = 'independent-third-recipient@example.test';
  const thirdGrant = await ok(owner, route(ah, 'participation/create'), { grant_id: randomUUID(), request: event.item.ref, expected: event.head,
    recipient: thirdRecipient, brief: 'Inspect the original notice.', next_action: 'Return an independent check.', indices: [0], expires: Date.now() + 86400000 });
  const collisionDraft = await ok(independent, '/api/drafts', {});
  const collisionWork = (await ok(independent, route(collisionDraft, 'save'), { ticket: collisionDraft.ticket,
    definition: { goal: 'B separately requests a venue check', success_criteria: ['Retain an independent reply'], non_goals: [] }, notes: [] })).saved;
  const collisionRequest = await ok(independent, route(collisionWork, 'exchanges/save'), { kind: 'request', basis: null,
    expected: headBinding(collisionWork), request_key: randomUUID(), message: 'Check this separate request.', next_action: 'Await a response.', files: [upload('other.txt', 'B separate request.\n')] });
  const collision = await independent.request(route(collisionWork, 'participation/create'), { grant_id: thirdGrant.id, request: collisionRequest.item.ref,
    expected: collisionRequest.head, recipient: thirdRecipient, brief: 'Different project request.', next_action: 'Return a check.', indices: [0], expires: Date.now() + 86400000 });
  assert.equal(collision.status, 409, JSON.stringify(collision.data));
  assert.equal(await s.db.prepare('SELECT grant_id FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND grant_id=?')
    .bind(b.workspace_id, b.project_id, thirdGrant.id).first(), null);
  await s.setOptions({ bindings: { ...s.env, LOCAL_PARTICIPANT_LOGIN: thirdRecipient } });
  try {
    const third = await session(s, 'B', a, '/participate/' + thirdGrant.id);
    assert.equal((await ok(third, '/api/participation/' + thirdGrant.id)).project_id, a.project_id);
  } finally { await s.setOptions({ bindings: s.env }); }
  passed('grant isolation: B cannot collide a known A grant identifier for the same third recipient; no B grant is inserted and A recipient access remains available');
  const participant = await session(s, 'B', a, '/participate/' + grant.id), proot = '/api/participation/' + grant.id;
  await s.setOptions({ bindings: { ...s.env, WORKSPACE_ID: randomUUID() } });
  try { assert.equal((await participant.request(proot)).status, 403, 'changed installation scope cannot admit an old project grant'); }
  finally { await s.setOptions({ bindings: s.env }); }
  const visible = await ok(participant, proot); assert.equal(visible.project_id, a.project_id); assert(!JSON.stringify(visible).includes('A_PRIVATE'));
  const returned = await ok(participant, proot + '/save', { kind: 'return', basis: event.item.ref, expected: event.head, request_key: randomUUID(),
    message: 'Corrected the arrival time.', next_action: 'Owner checks whether it fits this workshop.', files: [upload('notice.txt', 'Arrival 18:00.\n')] });
  const selection = await ok(owner, route(ah, 'inspect-return'), { returned: returned.item.ref, index: 0, after: null });
  ah = (await ok(owner, route(ah))).saved;
  const decline = await prepareReturnDraft((url, body) => ok(owner, url, body), selection.selection,
    { decision: 'declined', rationale: 'This workshop starts earlier; a new owner notice is needed.', next_action: 'Write the owner notice.',
      participant_feedback: { explanation: 'This return is not used for this workshop.', next_action: 'Your own project remains yours to continue.' } }, { saved: ah });
  ah = (await ok(owner, route(ah, 'save'), decline.body)).saved;
  assert.equal((await ok(participant, proot + '/feedback')).feedback[0].disposition, 'declined');
  independent = await session(s, 'B', b);
  assert.deepEqual((await ok(independent, '/api/project/continuation')).saved, bh, 'A decline does not alter B continuation');
  const fresh = planningDraft(bh);
  fresh.notes.push({ text: 'The 18:00 measurement was 38 dBA; keep the east ramp and ask the venue about Friday availability.', source: 'Room meter reading, 2026-11-11 18:00',
    observed_at: '2026-11-11T18:00:00.000Z', provenance: 'user_declaration', label: 'Changed assumption / user correction' });
  fresh.material_edits.push({ adapts: null, dependencies: [] });
  fresh.definition.success_criteria = ['Ask the venue about Friday availability using the recorded noise result.'];
  const setupPath = path.join(root, 'independent-b-task.json');
  await writeFile(setupPath, JSON.stringify({ format: 'augnes_web_file_task.v1', origin: s.origin,
    workspace_id: b.workspace_id, project_id: b.project_id, work_id: b.continuation_work_id }), { flag: 'wx', mode: 0o600 });
  const next = await agentSession(s, 'B', async () => {
    const project = await openFileProject(s.origin, b.project_id); assert.deepEqual((await project.continuation()).saved, bh);
    const task = await openFileTask(setupPath); assert.deepEqual(await task.planning.current(), bh);
    return task.planning.prepare(headBinding(bh), fresh);
  });
  assert.equal((await ok(independent, route(bh, 'resolve'), next)).outcome, 'unknown');
  await agentSession(s, 'B', async () => (await openFileTask(setupPath)).planning.save(next)); // Discard a real committed acknowledgement.
  independent = await session(s, 'B', b);
  const resolved = await ok(independent, route(bh, 'resolve'), next); assert.equal(resolved.outcome, 'saved');
  bh = resolved.saved; assert.equal(bh.author_ref, b.author_ref); assert.equal(bh.revision, 2);
  assert.deepEqual((await ok(independent, route(bh, 'save'), next)).saved, bh);
  assert.equal((await independent.request(route(bh, 'save'), pendingB)).status, 409);
  const left = await change(independent, bh, 'B: check Friday availability'), right = await change(independent, bh, 'B: check Saturday availability');
  const race = await Promise.all([independent.request(route(bh, 'save'), left), independent.request(route(bh, 'save'), right)]);
  assert.deepEqual(race.map(r => r.status).sort(), [200, 409]); bh = race.find(r => r.status === 200).data.saved;
  const bHistory = (await ok(independent, route(bh, 'history'))).revisions;
  assert.equal(bHistory.length, 3); assert.deepEqual(bHistory[0], createdB.saved); assert(bHistory.every(r => r.author_ref === b.author_ref));
  passed('continuation: A declines B separate contribution while a fresh B session recovers its own purpose/grounded judgment/open work/next step and makes an attributable later save; unknown, stale and concurrent writes remain enforced');

  // Recovery fixture: make only B's store empty, as after replacing lost storage.
  // This is not an application erasure and cannot clear an erasure tombstone.
  const bRequest = await ok(independent, route(bh, 'exchanges/save'), { kind: 'request', basis: null, expected: headBinding(bh), request_key: randomUUID(),
    message: 'Confirm venue availability.', next_action: 'Await a venue response.', files: [upload('venue.txt', 'Friday availability unknown.\n')] });
  const bGrant = await ok(independent, route(bh, 'participation/create'), { grant_id: randomUUID(), request: bRequest.item.ref, expected: bRequest.head,
    recipient: 'independent-venue@example.test', brief: 'Confirm Friday availability.', next_action: 'Return an availability note.', indices: [0], expires: Date.now() + 86400000 });
  bh = (await ok(independent, route(bh))).saved;
  const aExport = await owner.request(route(ah, 'export')), bExport = await independent.request(route(bh, 'export'));
  assert.equal(aExport.status, 200); assert.equal(bExport.status, 200);
  const aGrantBefore = await s.db.prepare('SELECT * FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND grant_id=?').bind(a.workspace_id, a.project_id, grant.id).first();
  await s.db.batch([
    s.db.prepare('DELETE FROM web_planning_file WHERE workspace_id=? AND project_id=?').bind(b.workspace_id, b.project_id),
    s.db.prepare('DELETE FROM web_planning_revision WHERE workspace_id=? AND project_id=?').bind(b.workspace_id, b.project_id),
  ]);
  await ok(independent, '/api/reconstruct-files', { export: bExport.data, confirm: 'reconstruct-empty-store' });
  assert.equal((await independent.request(route(bh, 'export'))).raw, bExport.raw);
  assert.equal((await owner.request(route(ah, 'export'))).raw, aExport.raw);
  assert.deepEqual(await s.db.prepare('SELECT * FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND grant_id=?').bind(a.workspace_id, a.project_id, grant.id).first(), aGrantBefore);
  assert((await s.db.prepare('SELECT revoked_at FROM web_planning_participation WHERE workspace_id=? AND project_id=? AND grant_id=?').bind(b.workspace_id, b.project_id, bGrant.id).first()).revoked_at);
  assert.equal((await participant.request(proot)).status, 200);
  const repeated = await independent.request('/api/reconstruct-files', { export: bExport.data, confirm: 'reconstruct-empty-store' });
  assert.notEqual(repeated.status, 200, 'nonempty B reconstruction must refuse');
  await ok(independent, route(bh, 'erase'), { expected: headBinding(bh), confirm: 'erase-whole-work' });
  assert.equal((await independent.request(route(bh))).status, 410);
  assert.notEqual((await independent.request('/api/project/continuation')).status, 200);
  assert.notEqual((await independent.request('/api/reconstruct-files', { export: bExport.data, confirm: 'reconstruct-empty-store' })).status, 200);
  assert.equal((await owner.request(route(ah, 'export'))).raw, aExport.raw);
  assert.equal((await participant.request(proot)).status, 200);
  passed('project recovery: B-only empty-store reconstruction retains exact export bytes, revokes only B grants, cannot resurrect erased work, and leaves A history/files and active request access unchanged');

  await s.setOptions({ bindings: { ...s.env, PROJECT_ADMITTED_EMAILS: '[]' } });
  assert.equal((await independent.request('/api/project')).status, 403);
  assert.equal((await owner.request('/api/project')).status, 200);
  await s.setOptions({ bindings: { ...s.env, PROJECT_ENTRY_MODE: '' } });
  assert.equal((await s.mf.dispatchFetch(s.origin + '/', { headers: { cookie: principalCookie(s, 'B') } })).status, 403);
  assert.equal((await s.mf.dispatchFetch(s.origin + '/', { headers: { cookie: principalCookie(s, 'A') } })).status, 200);
  assert.equal((await owner.request('/api/project')).status, 403, 'disabled multi-project mode cannot silently select nonlegacy scope');
  passed('admission: removing B admission immediately ends own-project access; disabling the opt-in preserves the configured legacy owner-only deployment');

  const migrationsFolder = await migrationPrefix(root, 6);
  const old = await start('independent-legacy-migration', { migrationsFolder });
  const oldOwner = await session(old, 'A', fixtureScope, '/');
  const draft = await ok(oldOwner, '/api/drafts', {});
  const legacySaved = (await ok(oldOwner, route({ work_id: draft.work_id }, 'save'), { ticket: draft.ticket,
    definition: { goal: 'Legacy owner retained work', success_criteria: ['Preserve exact export bytes'], non_goals: [] },
    notes: [{ text: 'Legacy attributable observation.', source: 'Legacy source', observed_at: null, provenance: 'user_declaration', label: 'Open question' }] })).saved;
  const before = await oldOwner.request(route(legacySaved, 'export'));
  const mapping = await old.db.prepare('SELECT singleton,workspace_id,project_id,author_ref,owner_login_hash FROM web_planning_workspace').first();
  const req = createRequire(path.join(webRoot, 'package.json'));
  await req('drizzle-orm/d1/migrator').migrate(req('drizzle-orm/d1').drizzle(old.db), { migrationsFolder: path.join(webRoot, 'drizzle') });
  const afterOwner = await session(old, 'A', fixtureScope, '/'), after = await afterOwner.request(route(legacySaved, 'export'));
  assert.equal(after.status, 200); assert.equal(after.raw, before.raw);
  assert.deepEqual(await old.db.prepare('SELECT singleton,workspace_id,project_id,author_ref,owner_login_hash FROM web_planning_workspace').first(), mapping);
  assert.equal((await old.db.prepare('PRAGMA foreign_key_check').all()).results.length, 0);
  passed('migration: existing schema4 owner mapping and complete revision/export bytes survive the supported migration, with intact foreign keys and unchanged default access');
}
