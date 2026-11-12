import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { canonical, hash, headBinding } from '../apps/web_planning/src/contract.ts';
import { planningDraft, prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { participantBindings, participantClient, participantEmail } from './web-planning-participation-checks.mjs';

const mode = 'selected-public-request-v1';
const route = (work, suffix = '') => '/api/work/' + work.work_id + (suffix ? '/' + suffix : '');
const publications = (work, suffix = '') => route(work, 'public-requests' + (suffix ? '/' + suffix : ''));
const encode = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const file = (name, text) => {
  const bytes = Buffer.from(text);
  return { name, media_type: 'text/plain', bytes: bytes.length, digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'), data: bytes.toString('base64') };
};

// The same check owner is used by the focused entry and the ordinary D1 suite.
// Work, requests, grants and checked use are created through their real writers.
export async function checkPublicRequests({ start, client, newWork, save, passed }) {
  const bindings = { ...participantBindings(), PUBLIC_REQUEST_MODE: mode };
  const server = await start('public-requests', { bindings });
  let owner = await client(server);
  const req = async (path, body) => {
    const r = await owner.request(path, body);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    return r.data;
  };
  async function seed(label) {
    const initial = await save(owner, await newWork(owner, {
      goal: 'PRIVATE_OWNER_PURPOSE_' + label,
      success_criteria: ['Publish an accurate attendee notice'], non_goals: ['PRIVATE_BUDGET_BOUNDARY'],
    }, [{ source: 'Private planning note', text: 'PRIVATE_INTERNAL_NOTE_' + label, observed_at: null, provenance: 'user_declaration', label: 'Open question' }]));
    assert.equal(initial.status, 200, JSON.stringify(initial.data));
    const base = initial.data.saved;
    const event = await req(route(base, 'exchanges/save'), {
      kind: 'request', basis: null, expected: headBinding(base), request_key: randomUUID(),
      message: 'PRIVATE_REQUEST_REASON_' + label, next_action: 'PRIVATE_OWNER_NEXT',
      files: [file('notice.md', 'Workshop starts at 18:30. Use the north entrance.\r\n'), file('budget-private.txt', 'PRIVATE_BUDGET_BYTES')],
    });
    const grant = await req(route(base, 'participation/create'), {
      grant_id: randomUUID(), request: event.item.ref, expected: event.head, recipient: participantEmail,
      brief: 'Clarify arrival time and the step-free entrance.', next_action: 'Return a corrected attendee notice.',
      indices: [0], expires: Date.now() + 2 * 86400000,
    });
    const input = {
      publication_id: randomUUID(), request: event.item.ref, expected: event.head, grant_id: grant.id,
      summary: {
        project: 'Community workshop ' + label, title: 'Check arrival & step-free access',
        purpose: 'Help attendees reach the workshop.', need: 'A corrected attendee notice.',
        reason: 'Arrival and start times are currently ambiguous.',
        evidence: 'Selected notice revision; <script>globalThis.publicRequestInjected=true</script> is quoted text.',
        expected_return: 'A short notice with arrival at 18:00 and start at 18:30.',
        checking_use: 'The project checks the room booking before using the notice.',
      },
      expires: Date.now() + 86400000, confirm: 'publish-selected-request',
    };
    return { base, event, grant, input };
  }
  async function readPublic(id, suffix = '.json', init = {}) {
    const response = await server.mf.dispatchFetch(server.origin + '/public-requests/' + id + suffix, init);
    const raw = await response.text();
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
    assert.equal(response.headers.get('set-cookie'), null, 'public reads must not issue private write sessions');
    return { response, raw, data: (response.headers.get('content-type') ?? '').includes('application/json') ? JSON.parse(raw) : raw };
  }
  async function unavailable(id, status) {
    const r = await readPublic(id);
    assert.equal(r.response.status, 200, r.raw);
    assert.equal(r.data.status, status);
    assert.equal(r.data.available, false);
    for (const key of ['summary', 'source', 'issuer', 'reply']) assert.equal(Object.hasOwn(r.data, key), false, key);
    const html = await readPublic(id, '');
    assert.equal(html.response.status, 200, html.raw);
    assert(!html.raw.includes('Community workshop'), 'ended public projections must not repeat selected material');
    return r.data;
  }

  const s = await seed('public-selected');
  const resolveBody = { publication_id: s.input.publication_id };
  assert.deepEqual(await req(publications(s.base, 'resolve'), resolveBody), { outcome: 'unknown', publication: null });
  const created = await req(publications(s.base, 'create'), s.input);
  assert.equal(created.id, s.input.publication_id);
  assert.equal(created.link, server.env.APP_ORIGIN + '/public-requests/' + created.id);
  const publicRead = await readPublic(created.id, '.json', { headers: { 'sec-fetch-site': 'cross-site', origin: 'https://outside.example.test' } });
  assert.equal(publicRead.response.status, 200, publicRead.raw);
  assert.equal(publicRead.data.schema, 'augnes.public-request.v1');
  assert.equal(publicRead.data.status, 'active');
  assert.equal(publicRead.data.available, true);
  assert.deepEqual(publicRead.data.summary, s.input.summary);
  assert.deepEqual(publicRead.data.source.request, s.event.item.ref);
  assert.equal(publicRead.data.issuer.author_ref, server.env.AUTHOR_REF);
  assert.equal(publicRead.data.reply.url, s.grant.link);
  assert.equal(publicRead.data.reply.can_submit, true);
  const publicHtml = await readPublic(created.id, '');
  assert.equal(publicHtml.response.status, 200, publicHtml.raw);
  for (const value of Object.values(s.input.summary)) assert(publicHtml.raw.includes(encode(value)), value);
  assert(!publicHtml.raw.includes('<script>globalThis.publicRequestInjected'));
  for (const secret of ['PRIVATE_', participantEmail, server.env.OWNER_EMAIL, server.env.REQUEST_SECRET, 'budget-private.txt']) {
    assert(!publicRead.raw.includes(secret), secret);
    assert(!publicHtml.raw.includes(secret), secret);
  }
  assert.equal((await server.mf.dispatchFetch(s.grant.link)).status, 403, 'public reply link is not a recipient credential');
  await server.setOptions({ bindings: { ...server.env, PUBLIC_REQUEST_MODE: '' } });
  try {
    const disabled = await readPublic(created.id);
    assert([403, 404].includes(disabled.response.status), disabled.raw);
    assert(!disabled.raw.includes(s.input.summary.purpose));
  } finally { await server.setOptions({ bindings: server.env }); }
  passed('public requests: anonymous cross-site HTML/JSON expose the same selected immutable brief and issuer, not private history, recipient identity or executable markup; disabled mode and reply-link possession grant no access');

  // Discard the first committed acknowledgement, then reopen an independent owner
  // session. Resolve and exact retry must recover one publication, not publish twice.
  const replay = await seed('lost-ack');
  await req(publications(replay.base, 'create'), replay.input);
  owner = await client(server);
  const resolved = await req(publications(replay.base, 'resolve'), { publication_id: replay.input.publication_id });
  assert.equal(resolved.outcome, 'created');
  assert.equal(resolved.publication.id, replay.input.publication_id);
  assert.deepEqual(await req(publications(replay.base, 'create'), replay.input), resolved.publication);
  const listed = await req(publications(replay.base));
  assert.equal(listed.publications.length, 1);
  assert.deepEqual(listed.publications[0], resolved.publication);
  assert.equal((await owner.request(publications(replay.base, 'create'), { ...replay.input, summary: { ...replay.input.summary, need: 'A different request' } })).status, 409);
  assert.equal((await req(route(replay.base, 'history'))).revisions.length, 2, 'publication does not fabricate work revisions');
  passed('public requests: fresh owner resolve and exact replay recover a lost acknowledgement without duplicate publication or fabricated history; changed replay refuses');

  const freshInput = () => ({ ...s.input, publication_id: randomUUID() });
  assert.equal((await owner.request(publications(s.base, 'create'), freshInput(), { 'x-csrf-token': 'wrong' })).status, 403);
  assert.equal((await owner.request(publications(s.base, 'create'), freshInput(), { origin: 'https://wrong.example.test' })).status, 403);
  assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), project_id: randomUUID() })).status, 403);
  assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), confirm: '' })).status, 422);
  assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), grant_id: replay.grant.id })).status, 409);
  assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), expires: s.grant.expires + 1 })).status, 422);
  assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), summary: { ...s.input.summary, unexpected: 'not selected' } })).status, 422);
  for (const unsafe of ['private-contact@example.test', '/Users/private-owner/private-project/source.md', 'secret=do-not-publish', 'x'.repeat(501)]) {
    assert.equal((await owner.request(publications(s.base, 'create'), { ...freshInput(), summary: { ...s.input.summary, evidence: unsafe } })).status, 422);
  }
  assert.equal((await owner.request(publications(replay.base, 'create'), { ...replay.input, publication_id: created.id })).status, 409, 'one public locator cannot be rebound to another work');
  for (const body of [{ ...freshInput(), issuer_ref: randomUUID() }, { ...freshInput(), expected: { revision: 1, fingerprint: s.base.fingerprint } }]) {
    assert.notEqual((await owner.request(publications(s.base, 'create'), body)).status, 200);
  }
  for (const suffix of ['', '/create', '/resolve', '/revoke']) {
    const r = await server.mf.dispatchFetch(server.origin + publications(s.base) + suffix, {
      method: suffix ? 'POST' : 'GET', headers: { cookie: 'web_planning_local=' + server.env.LOCAL_PARTICIPANT_SESSION },
    });
    assert.equal(r.status, 403);
    assert(!(await r.text()).includes(s.input.summary.purpose));
  }
  assert.equal((await readPublic(randomUUID())).response.status, 404);
  assert.notEqual((await readPublic(created.id, '.json?private=1')).response.status, 200);
  assert.notEqual((await readPublic(created.id, '.json', { method: 'POST' })).response.status, 200);
  assert.equal((await req(publications(s.base))).publications.length, 1);
  passed('public requests: owner authentication, CSRF, exact project/work/grant/current basis, confirmation, private-text/size and expiry guards enforce publication authority; public locators cannot be rebound or become write endpoints');

  // Use the supported separately authenticated recipient path, not a simulated
  // response record. Origin checking saves actual adapted bytes and shared feedback.
  const participant = await participantClient(server, s.grant.id);
  const visible = (await participant.request()).data;
  const returned = await participant.request('/save', {
    kind: 'return', basis: visible.items[0].ref, expected: visible.head, request_key: randomUUID(),
    message: 'Corrected arrival and step-free entrance.', next_action: 'Owner confirms the room.',
    files: [file('notice.md', 'Arrive at 18:00 for the 18:30 workshop. Use the east ramp.\r\n')],
  });
  assert.equal(returned.status, 200, JSON.stringify(returned.data));
  const answered = await readPublic(created.id);
  assert.equal(answered.data.status, 'answered');
  assert.equal(answered.data.reply.can_submit, false);
  assert.deepEqual(answered.data.summary, publicRead.data.summary);
  assert.deepEqual(answered.data.source, publicRead.data.source);
  const inspect = await req(route(s.base, 'inspect-return'), { returned: returned.data.item.ref, index: 0, after: null });
  const outputText = 'Arrive at 18:00 in Room B for the 18:30 workshop. Use the east ramp.\r\n';
  const prepared = await prepareReturnDraft(req, inspect.selection, {
    decision: 'adapted', name: 'attendee-notice.md', text: outputText,
    rationale: 'PRIVATE_CHECK_RATIONALE', reported_check: 'PRIVATE_ROOM_BOOKING_CHECK', limits: 'PRIVATE_LIMIT', next_action: 'PRIVATE_NEXT',
    participant_feedback: { explanation: 'Used the corrected arrival and entrance, adding the confirmed room.', next_action: 'No further work requested.' },
  }, { goal: 'PRIVATE_OUTPUT_WORK' });
  const output = await req(route(prepared, 'save'), prepared.body);
  const used = (await req(route(s.base, 'inspect-return'), { returned: returned.data.item.ref, index: 0, after: null })).decisions[0];
  assert.equal(await req(used.download), outputText);
  const freshParticipant = await participantClient(server, s.grant.id);
  const feedback = (await freshParticipant.request('/feedback')).data;
  assert.equal(feedback.feedback[0].disposition, 'adapted');
  assert.equal(feedback.feedback[0].explanation, 'Used the corrected arrival and entrance, adding the confirmed room.');
  for (const secret of ['PRIVATE_', prepared.work_id, output.saved.fingerprint, outputText]) assert(!JSON.stringify(feedback).includes(secret), secret);
  assert(!(await readPublic(created.id)).raw.includes('PRIVATE_'));
  passed('public requests: the disclosed response route reaches a separate recipient return, actual checked/adapted origin output and fresh shared-feedback read; answered status retains the published basis without private-use leakage');

  const stale = await seed('stale-basis');
  await req(publications(stale.base, 'create'), stale.input);
  const current = (await req(route(stale.base))).saved;
  const draft = planningDraft(current); draft.definition.goal = 'PRIVATE_REVISED_PURPOSE';
  const ticket = await req(route(current, 'ticket'), { ...draft, expected: headBinding(current) });
  await req(route(current, 'save'), { ...draft, ticket: ticket.ticket });
  const staleRead = await readPublic(stale.input.publication_id);
  assert.equal(staleRead.data.status, 'stale');
  assert.equal(staleRead.data.reply.can_submit, false);
  assert.deepEqual(staleRead.data.summary, stale.input.summary);
  assert.deepEqual(staleRead.data.source.request, stale.event.item.ref);
  assert(!staleRead.raw.includes('PRIVATE_REVISED_PURPOSE'));
  assert.equal((await owner.request(publications(stale.base, 'create'), { ...stale.input, publication_id: randomUUID() })).status, 409);
  passed('public requests: later private source changes disable the stale return path without rebasing the published brief or its source identity; a new publication cannot borrow the stale grant basis');

  const withdrawn = await seed('withdrawn');
  await req(publications(withdrawn.base, 'create'), withdrawn.input);
  const ended = await req(publications(withdrawn.base, 'revoke'), { publication_id: withdrawn.input.publication_id });
  assert(ended.revoked_at);
  assert.deepEqual(await req(publications(withdrawn.base, 'revoke'), { publication_id: withdrawn.input.publication_id }), ended);
  await unavailable(withdrawn.input.publication_id, 'withdrawn');
  const expired = await seed('expired');
  await req(publications(expired.base, 'create'), expired.input);
  // Prepare a coherent past-expiry fixture without sleeping or modifying the
  // production clock. Creation/expiry admission was exercised above.
  const expiryRow = await server.db.prepare('SELECT material FROM web_planning_public_request WHERE publication_id=?').bind(expired.input.publication_id).first();
  const past = Date.now() - 1000, material = { ...JSON.parse(expiryRow.material), expires: past };
  const encoded = canonical(material);
  await server.db.prepare('UPDATE web_planning_public_request SET expires=?,material=?,material_fingerprint=? WHERE publication_id=?')
    .bind(past, encoded, hash(encoded), expired.input.publication_id).run();
  await unavailable(expired.input.publication_id, 'expired');
  const revokedGrant = await seed('revoked-response');
  await req(publications(revokedGrant.base, 'create'), revokedGrant.input);
  await req(route(revokedGrant.base, 'participation/revoke'), { grant_id: revokedGrant.grant.id });
  await unavailable(revokedGrant.input.publication_id, 'response_unavailable');
  passed('public requests: idempotent withdrawal, coherent expiry and recipient-grant revocation remove public material and usable reply details while preserving truthful minimal tombstones');

  const erased = await seed('erase-and-restore');
  await req(publications(erased.base, 'create'), erased.input);
  const exported = await req(route(erased.base, 'export'));
  const restore = await start('public-requests-restore', { bindings: { ...participantBindings(), PUBLIC_REQUEST_MODE: mode } });
  const restorer = await client(restore);
  for (const [table, key, id] of [
    ['web_planning_participation', 'grant_id', erased.grant.id],
    ['web_planning_public_request', 'publication_id', erased.input.publication_id],
  ]) {
    const row = await server.db.prepare('SELECT * FROM ' + table + ' WHERE ' + key + '=?').bind(id).first();
    const keys = Object.keys(row);
    await restore.db.prepare('INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')').bind(...Object.values(row)).run();
  }
  assert.equal((await restorer.request('/api/reconstruct-exchange', { export: exported, confirm: 'reconstruct-empty-store' })).status, 200);
  const restoredPublic = await restore.mf.dispatchFetch(restore.origin + '/public-requests/' + erased.input.publication_id + '.json');
  assert.equal(restoredPublic.status, 200);
  const restoredView = await restoredPublic.json();
  assert.equal(restoredView.status, 'withdrawn');
  assert.equal(restoredView.available, false);
  assert.equal(Object.hasOwn(restoredView, 'summary'), false);
  assert.equal((await restore.mf.dispatchFetch(restore.origin + '/participate/' + erased.grant.id, {
    headers: { cookie: 'web_planning_local=' + restore.env.LOCAL_PARTICIPANT_SESSION },
  })).status, 403);
  await req(route(erased.base, 'erase'), { expected: erased.event.head, confirm: 'erase-whole-work' });
  await unavailable(erased.input.publication_id, 'source_unavailable');
  assert.equal(server.externalRequests(), 0);
  assert.equal(restore.externalRequests(), 0);
  passed('public requests: source erasure removes public material; supported reconstruction retires retained publication and recipient authority instead of reviving public access');
}
