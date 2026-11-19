import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prepareReturnDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { hash } from '../apps/web_planning/src/contract.ts';
import { participantClient } from './web-planning-participation-checks.mjs';
import { checkApplicationRaces } from './web-planning-application-races.mjs';

function ok(response) {
  assert.equal(response.status, 200, JSON.stringify(response.data));
  return response.data;
}

async function applicationClient(server, publicationId, session) {
  const { origin, mf } = server;
  const cookie = session ? 'web_planning_local=' + session : '';
  const entry = await mf.dispatchFetch(origin + '/apply/' + publicationId, { headers: cookie ? { cookie } : {} });
  const html = await entry.text();
  assert.equal(entry.status, 200, html);
  const csrf = html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
  assert(csrf, 'the signed-in application page supplies its own write token');
  const cookies = [cookie, entry.headers.get('set-cookie').split(';')[0]].filter(Boolean).join('; ');
  const root = origin + '/api/applications/' + publicationId;
  return { cookies, csrf, async request(suffix = '', body, headers = {}) {
    const response = await mf.dispatchFetch(root + suffix, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { cookie: cookies, ...(body === undefined ? {} : {
        origin, 'content-type': 'application/json', 'x-csrf-token': csrf,
      }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, data: await response.json() };
  } };
}

export async function checkApplicantIngress(server, selected, ownerRequest) {
  const id = selected.input.publication_id;
  const management = '/api/work/' + selected.base.work_id + '/public-requests/' + id + '/applications';
  await ownerRequest(management + '/intake', {operation_id: randomUUID(), expected_version: 0, enabled: true});
  const account = 'signed-in-applicant@example.test';
  await server.setOptions({access: {aud: server.env.ACCESS_AUDIENCE, identity: {email: account}}});
  const reader = await applicationClient(server, id);
  const before = ok(await reader.request());
  assert.equal(before.available, true);
  const offer = {operation_id: randomUUID(), publication_fingerprint: before.publication_fingerprint, offer: 'I can check the opening time.'};
  ok(await reader.request('/apply', offer));
  const reopened = await applicationClient(server, id);
  assert.equal(ok(await reopened.request()).application.id, offer.operation_id);
  assert.equal((await server.mf.dispatchFetch(server.origin + '/api/work/' + selected.base.work_id)).status, 403);
  assert.equal((await server.mf.dispatchFetch(server.origin + management)).status, 403);
}

export async function checkPublicRequestApplications({ server, owner, freshOwner, seed, file, passed }) {
  const { origin, mf, env } = server;
  const applicantClient = (id, session = env.LOCAL_APPLICANT_SESSION) => applicationClient(server, id, session);
  const originalCookie = 'web_planning_local=' + env.LOCAL_PARTICIPANT_SESSION;
  const applicantCookie = 'web_planning_local=' + env.LOCAL_APPLICANT_SESSION;
  const otherCookie = 'web_planning_local=' + env.LOCAL_OTHER_SESSION;
  const statusAs = async (path, cookie) => (await mf.dispatchFetch(origin + path, { headers: cookie ? { cookie } : {} })).status;
  const fixture = await seed('application-journey');
  const work = '/api/work/' + fixture.base.work_id;
  const id = fixture.input.publication_id;
  const management = work + '/public-requests/' + id + '/applications';
  const req = async (path, body) => ok(await owner.request(path, body));
  await req(work + '/public-requests/create', fixture.input);
  const publicView = async () => (await mf.dispatchFetch(origin + '/public-requests/' + id + '.json')).json();
  const before = await publicView();
  assert.equal(before.intake, undefined);
  const initial = await req(management);
  assert.equal(initial.intake.enabled, false);
  const open = { operation_id: randomUUID(), expected_version: initial.intake.version, enabled: true };
  await req(management + '/intake', open);
  const published = await publicView();
  assert.equal(published.intake.schema, 'augnes.public-request-intake.v1');
  assert.equal(new URL(published.intake.url, origin).href, origin + '/apply/' + id);
  assert.deepEqual(published.summary, before.summary);
  assert.deepEqual(published.source, before.source);
  assert.deepEqual(published.reply, before.reply);
  assert.equal(await statusAs('/apply/' + id), 403);
  assert.equal(await statusAs('/api/applications/' + id), 403);
  const applicant = await applicantClient(id);
  const other = await applicantClient(id, env.LOCAL_OTHER_SESSION);
  const initialStatus = ok(await applicant.request());
  assert.equal(initialStatus.application, null);
  assert.equal(initialStatus.available, true);
  assert.equal(initialStatus.publication_fingerprint, before.source.publication_fingerprint);
  assert.equal(await statusAs('/api/projects', applicantCookie), 403);
  assert.equal(await statusAs(work, applicantCookie), 403);
  assert.equal(await statusAs(management, applicantCookie), 403);
  assert.equal(await statusAs('/api/participation/' + fixture.grant.id, applicantCookie), 403);
  const offer = { operation_id: randomUUID(), publication_fingerprint: initialStatus.publication_fingerprint,
    offer: 'I can check the entrance notice against the workshop invitation.' };
  assert.equal((await applicant.request('/apply', offer, {
    'x-csrf-token': other.csrf, cookie: applicant.cookies.replace(applicant.csrf, other.csrf),
  })).status, 403);
  assert.equal((await applicant.request('/apply', { ...offer, offer: 'a'.repeat(501) })).status, 422);
  ok(await applicant.request('/apply', offer)); // The caller loses this acknowledgement.
  const freshApplicant = await applicantClient(id);
  const pending = ok(await freshApplicant.request()).application;
  assert.equal(pending.id, offer.operation_id);
  assert.equal(pending.status, 'pending');
  assert.equal(pending.grant_url, null);
  assert.deepEqual(ok(await freshApplicant.request('/apply', offer)).application, pending);
  assert.equal((await freshApplicant.request('/apply', { ...offer, offer: 'An altered offer' })).status, 409);
  assert.equal(ok(await other.request()).application, null);
  assert.equal(await statusAs(management, otherCookie), 403);
  const queue = await req(management);
  assert.equal(queue.applications.length, 1);
  assert.equal(queue.applications[0].applicant, env.LOCAL_APPLICANT_LOGIN);
  assert.equal(queue.applications[0].offer, offer.offer);
  assert.equal(queue.applications[0].id, pending.id);
  const anonymous = JSON.stringify(await publicView());
  for (const value of [pending.id, offer.offer, env.LOCAL_APPLICANT_LOGIN, env.LOCAL_PARTICIPANT_LOGIN]) assert(!anonymous.includes(value));
  passed('applications: opt-in preserves frozen public material; a verified non-admitted applicant reconciles its own pending offer and gains no source, list or recipient authority');

  const decision = { application_id: pending.id, operation_id: randomUUID(), decision: 'approve',
    brief: 'Check the attendee notice.', next_action: 'Return the corrected arrival and entrance.',
    indices: [0], expires: Date.now() + 4 * 3600000 };
  const decisionKey = { application_id: pending.id, operation_id: decision.operation_id };
  assert.equal((await req(management + '/resolve', decisionKey)).outcome, 'unknown');
  await req(management + '/decide', decision); // The owner reconnects without this receipt.
  const reopenedOwner = await freshOwner();
  const resolved = ok(await reopenedOwner.request(management + '/resolve', decisionKey));
  assert.equal(resolved.outcome, 'decided');
  assert.equal(resolved.application.status, 'approved');
  assert.equal(resolved.application.decision_operation_id, decision.operation_id);
  const grantId = resolved.application.grant_id;
  assert(grantId && grantId !== fixture.grant.id);
  assert.equal(ok(await reopenedOwner.request(management + '/decide', decision)).grant_id, grantId);
  assert.equal((await reopenedOwner.request(management + '/decide', { ...decision, indices: [1] })).status, 409);
  const granted = await req(work + '/participation');
  assert.equal(granted.grants.length, 2);
  assert.equal(granted.grants.find(g => g.id === grantId).recipient, env.LOCAL_APPLICANT_LOGIN);
  assert.equal(granted.grants.find(g => g.id === fixture.grant.id).recipient, env.LOCAL_PARTICIPANT_LOGIN);
  const approved = ok(await (await applicantClient(id)).request()).application;
  assert.equal(approved.status, 'approved');
  const path = '/participate/' + grantId;
  assert.equal(new URL(approved.grant_url, origin).href, origin + path);
  assert.equal(ok(await other.request()).application, null);
  for (const cookie of [otherCookie, originalCookie]) assert.equal(await statusAs(path, cookie), 403);
  assert.equal(await statusAs(work, applicantCookie), 403);
  const close = { operation_id: randomUUID(), expected_version: queue.intake.version, enabled: false };
  await req(management + '/intake', close);
  assert.equal((await publicView()).intake, undefined);
  assert.equal(ok(await freshApplicant.request()).application.grant_url, approved.grant_url);
  assert.equal((await other.request('/apply', { ...offer, operation_id: randomUUID() })).status, 409);
  passed('applications: a separate owner authorizes the exact disclosure once; a lost decision resolves to a new applicant-bound grant, and closing intake preserves both existing grants');

  const recipient = await participantClient(server, grantId, applicantCookie);
  const visible = ok(await recipient.request());
  assert.equal(visible.items[0].message, decision.brief);
  assert.equal(visible.items[0].files.length, 1);
  const originalFile = visible.items[0].files[0];
  assert.equal(ok(await recipient.request(originalFile.download)), 'Workshop starts at 18:30. Use the north entrance.\r\n');
  assert.equal((await recipient.request(originalFile.download.replace(/0$/, '1'))).status, 403);
  const submission = { kind: 'return', basis: visible.items[0].ref, expected: visible.head, request_key: randomUUID(),
    message: 'Corrected the arrival and entrance.', next_action: 'Check the room booking.',
    files: [file('corrected.txt', 'Doors open at 18:00. Use the east ramp.\r\n')] };
  const original = await participantClient(server, fixture.grant.id, originalCookie);
  assert.equal(ok(await original.request()).can_submit, true);
  ok(await recipient.request('/save', submission)); // The next session reads the committed return.
  const returnedBy = await participantClient(server, grantId, applicantCookie);
  const restored = ok(await returnedBy.request('/resolve', submission));
  assert.equal(restored.outcome, 'saved');
  assert.equal(restored.item.contributor.grant_id, grantId);
  assert.equal(restored.item.contributor.principal_ref, hash(env.LOCAL_APPLICANT_LOGIN));
  assert.equal((await returnedBy.request('/save', { ...submission, message: 'Different action' })).status, 409);
  assert.equal((await original.request('/save', { ...submission, request_key: randomUUID() })).status, 409);
  const originalHistory = ok(await original.request());
  assert.equal(originalHistory.can_submit, false);
  assert.equal(originalHistory.items.length, 1);
  assert.equal((await req(work + '/history')).revisions.length, 3);
  assert.equal((await publicView()).status, 'answered');
  const inspected = await req(work + '/inspect-return', { returned: restored.item.ref, index: 0, after: null });
  const feedback = { explanation: 'The booking confirms doors open at 18:00. The notice now includes the east ramp.', next_action: 'No further work requested.' };
  const judgment = { decision: 'adapted', name: 'attendee-notice.md', text: 'Doors open at 18:00 in Room B. Use the east ramp.\r\n',
    rationale: 'PRIVATE_BOOKING_DECISION', reported_check: 'PRIVATE_ROOM_CHECK', limits: 'PRIVATE_LIMIT', next_action: 'PRIVATE_NEXT', participant_feedback: feedback };
  const prepared = await prepareReturnDraft(req, inspected.selection, judgment, { goal: 'PRIVATE_OUTPUT' });
  const result = await req('/api/work/' + prepared.work_id + '/save', prepared.body);
  const checked = (await req(work + '/inspect-return', { returned: restored.item.ref, index: 0, after: null })).decisions[0];
  assert.equal(await req(checked.download), judgment.text);
  const next = await applicantClient(id);
  const retainedGrant = ok(await next.request()).application.grant_url;
  const later = await participantClient(server, new URL(retainedGrant, origin).pathname.split('/').pop(), applicantCookie);
  const laterView = ok(await later.request());
  assert.deepEqual(laterView.items[1].ref, restored.item.ref);
  assert.equal(ok(await later.request(laterView.items[1].files[0].download)), 'Doors open at 18:00. Use the east ramp.\r\n');
  const shared = ok(await later.request('/feedback'));
  assert.equal(shared.feedback.length, 1);
  assert.equal(shared.feedback[0].disposition, 'adapted');
  assert.equal(shared.feedback[0].explanation, feedback.explanation);
  assert.equal(shared.feedback[0].next_action, feedback.next_action);
  for (const value of ['PRIVATE_', judgment.text, result.saved.fingerprint, env.LOCAL_APPLICANT_LOGIN]) assert(!JSON.stringify(shared).includes(value), value);
  assert.equal(ok(await original.request('/feedback')).feedback.length, 0);
  await req(work + '/participation/revoke', { grant_id: grantId });
  const afterRevocation = ok(await next.request()).application;
  assert.equal(afterRevocation.grant_url, null);
  for (const value of [feedback.explanation, 'PRIVATE_', originalFile.download, submission.message]) assert(!JSON.stringify(afterRevocation).includes(value), value);
  for (const endpoint of ['', '/feedback', originalFile.download]) assert.equal((await later.request(endpoint)).status, 403);
  assert.equal(ok(await reopenedOwner.request(management + '/decide', decision)).grant_id, grantId);
  assert.equal(ok(await next.request()).application.grant_url, null);
  passed('applications: selected bytes produce one attributable answer across both grants, a saved checked use and private feedback in a fresh session; revocation blocks private reads and exact replay cannot renew authority');

  await checkApplicationRaces({ server, owner, seed, applicantClient, passed });
  assert.equal(server.externalRequests(), 0);
}
