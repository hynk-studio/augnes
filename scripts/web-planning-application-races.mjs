import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { authorize, authorizeApplicant } from '../apps/web_planning/src/access.ts';
import { hash, headBinding, Refusal } from '../apps/web_planning/src/contract.ts';
import { decideApplication, submitApplication } from '../apps/web_planning/src/request-applications.ts';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { participantClient } from './web-planning-participation-checks.mjs';

export async function checkApplicationRaces({server, owner, seed, applicantClient, passed}) {
  const {env, db} = server;
  const scope = {workspace_id: env.WORKSPACE_ID, project_id: env.PROJECT_ID};
  const ownerWrite = async (path, body) => {
    const result = await owner.request(path, body);
    assert.equal(result.status, 200, JSON.stringify(result.data));
    return result.data;
  };
  async function open(fixture, publicationId = fixture.input.publication_id) {
    const work = '/api/work/' + fixture.base.work_id;
    const api = `${work}/public-requests/${publicationId}/applications`;
    await ownerWrite(work + '/public-requests/create', {...fixture.input, publication_id: publicationId});
    await ownerWrite(api + '/intake', {operation_id: randomUUID(), enabled: true, expected_version: 0});
    const publicRead = await server.mf.dispatchFetch(server.origin + '/public-requests/' + publicationId + '.json');
    assert.equal(publicRead.status, 200);
    const {source} = await publicRead.json();
    return {...fixture, publicationId, api, work, fingerprint: source.publication_fingerprint};
  }
  const submitBody = f => ({operation_id: randomUUID(), publication_fingerprint: f.fingerprint, offer: 'I can check the revised notice.'});
  async function submitFrom(f, login) {
    const access = await authorizeApplicant(new Request(server.origin + '/apply/' + f.publicationId),
      {...env, DB: db}, {login, localFixture: true}, f.publicationId);
    const input = submitBody(f);
    const result = await submitApplication(access, input);
    assert.equal(result.application.id, input.operation_id);
    return input.operation_id;
  }
  const approval = id => ({application_id: id, operation_id: randomUUID(), decision: 'approve', indices: [0],
    brief: 'Review the arrival time.', next_action: 'Return your checked notice.', expires: Date.now() + 3600000});
  const appRow = (f, id) => db.prepare(`SELECT decision, decision_operation_id, grant_id
    FROM web_planning_request_application WHERE publication_id=? AND application_id=?`).bind(f.publicationId, id).first();
  const newGrants = f => db.prepare(`SELECT grant_id FROM web_planning_participation
    WHERE workspace_id=? AND project_id=? AND work_id=? AND grant_id<>?`)
    .bind(scope.workspace_id, scope.project_id, f.base.work_id, f.grant.id).all();

  // Change real D1 state after the decision owner has read and checked the
  // application and selected bytes, immediately before its transaction begins.
  async function decisionAfter(f, input, change) {
    const access = await authorize(new Request(server.origin + f.api, {headers: {'x-web-planning-project': scope.project_id}}),
      {...env, DB: db}, {login: env.OWNER_EMAIL, localFixture: true});
    const real = access.DB;
    let entered = 0;
    access.DB = {prepare: sql => real.prepare(sql), batch: async statements => {
      assert.equal(++entered, 1, 'decision submitted more than one transaction');
      await change();
      return real.batch(statements);
    }};
    await assert.rejects(decideApplication(access, f.base.work_id, f.publicationId, {...scope, ...input}),
      e => e instanceof Refusal && [403, 404, 409, 410].includes(e.status));
    assert.equal(entered, 1, 'the committed state change must occur after validation');
  }
  const changes = {
    'closed intake': f => ownerWrite(f.api + '/intake', {operation_id: randomUUID(), enabled: false, expected_version: 1}),
    'withdrawn publication': f => ownerWrite(f.work + '/public-requests/revoke', {publication_id: f.publicationId}),
    'revoked original grant': f => ownerWrite(f.work + '/participation/revoke', {grant_id: f.grant.id}),
    'expired application': (f, id) => db.prepare(`UPDATE web_planning_request_application SET expires=?
      WHERE publication_id=? AND application_id=?`).bind(Date.now() - 1000, f.publicationId, id).run(),
    'erased request': f => ownerWrite(f.work + '/erase', {expected: f.event.head, confirm: 'erase-whole-work'}),
    'new source revision': async f => {
      const {saved} = await ownerWrite(f.work);
      const draft = planningDraft(saved);
      draft.definition.goal = 'Use the updated room and timetable.';
      const {ticket} = await ownerWrite(f.work + '/ticket', {...draft, expected: headBinding(saved)});
      await ownerWrite(f.work + '/save', {...draft, ticket});
    },
    'original recipient answered': async f => {
      const original = await participantClient(server, f.grant.id);
      const bytes = Buffer.from('The room opens at 18:00.');
      const returned = await original.request('/save', {kind: 'return', basis: f.event.item.ref, expected: f.event.head,
        request_key: randomUUID(), message: 'Confirmed the room opening.', next_action: 'Check the notice.',
        files: [{name: 'notice.txt', bytes: bytes.length, digest: hash(bytes.toString()), data: bytes.toString('base64'), media_type: 'text/plain'}]});
      assert.equal(returned.status, 200, JSON.stringify(returned.data));
    },
  };
  for (const [name, change] of Object.entries(changes)) {
    const f = await open(await seed(name));
    const id = await submitFrom(f, randomUUID() + '@example.test');
    await decisionAfter(f, approval(id), () => change(f, id));
    assert.deepEqual(await appRow(f, id), {decision: null, decision_operation_id: null, grant_id: null}, name);
    assert.deepEqual((await newGrants(f)).results, [], name);
  }
  passed('applications: intake closure, withdrawal, original grant revocation, expiry, erasure, source advance and an earlier answer each stop an already-prepared approval at its D1 commit');

  const competing = await open(await seed('competing owner decisions'));
  const subject = await submitFrom(competing, randomUUID() + '@example.test');
  const decline = {application_id: subject, operation_id: randomUUID(), decision: 'decline'};
  await decisionAfter(competing, approval(subject), () => ownerWrite(competing.api + '/decide', decline));
  assert.deepEqual(await appRow(competing, subject), {decision: 'declined', decision_operation_id: decline.operation_id, grant_id: null});
  assert.deepEqual((await newGrants(competing)).results, []);

  const rollback = await open(await seed('grant insert rollback'));
  const pending = await submitFrom(rollback, env.LOCAL_OTHER_LOGIN);
  const decision = approval(pending);
  await db.prepare(`CREATE TRIGGER fixture_application_grant_fault BEFORE INSERT ON web_planning_participation
    BEGIN SELECT RAISE(ABORT, 'controlled grant insert interruption'); END`).run();
  try {
    const failed = await owner.request(rollback.api + '/decide', decision);
    assert.equal(failed.status, 503, JSON.stringify(failed.data));
  } finally {
    await db.prepare('DROP TRIGGER fixture_application_grant_fault').run();
  }
  assert.deepEqual(await appRow(rollback, pending), {decision: null, decision_operation_id: null, grant_id: null});
  assert.deepEqual((await newGrants(rollback)).results, []);
  assert.equal((await ownerWrite(rollback.api + '/resolve', {application_id: pending, operation_id: decision.operation_id})).outcome, 'unknown');
  const sameDecision = await Promise.all([ownerWrite(rollback.api + '/decide', decision), ownerWrite(rollback.api + '/decide', decision)]);
  assert(sameDecision[0].grant_id);
  assert.equal(sameDecision[1].grant_id, sameDecision[0].grant_id);
  assert.deepEqual((await newGrants(rollback)).results, [{grant_id: sameDecision[0].grant_id}]);
  const linkedGrant = sameDecision[0].grant_id;
  const expiredAt = Date.now() - 1000;
  await db.prepare(`UPDATE web_planning_participation SET expires=? WHERE workspace_id=? AND project_id=? AND grant_id=?`)
    .bind(expiredAt, scope.workspace_id, scope.project_id, linkedGrant).run();
  const fresh = await applicantClient(rollback.publicationId, env.LOCAL_OTHER_SESSION);
  const afterExpiry = await fresh.request();
  assert.equal(afterExpiry.status, 200);
  assert.equal(afterExpiry.data.application.status, 'approved');
  assert.equal(afterExpiry.data.application.grant_url, null);
  const feedback = await server.mf.dispatchFetch(server.origin + '/api/participation/' + linkedGrant + '/feedback',
    {headers: {cookie: 'web_planning_local=' + env.LOCAL_OTHER_SESSION}});
  assert.equal(feedback.status, 403);
  await feedback.arrayBuffer();
  assert.equal((await ownerWrite(rollback.api + '/decide', decision)).grant_id, linkedGrant);
  assert.deepEqual((await db.prepare(`SELECT grant_id, expires FROM web_planning_participation WHERE work_id=? AND grant_id<>?`)
    .bind(rollback.base.work_id, rollback.grant.id).all()).results, [{grant_id: linkedGrant, expires: expiredAt}]);
  passed('applications: a competing decline leaves no grant; failed issuance rolls back the decision, concurrent approval issues once, and exact replay preserves grant expiry');

  const quota = await open(await seed('last place'));
  // The first 24 offers use separately verified local test principals and the
  // production intake owner. The final two contend through independent sessions.
  for (let index = 0; index < 24; index++) await submitFrom(quota, `cohort-${index}@example.test`);
  const last = await Promise.all([applicantClient(quota.publicationId), applicantClient(quota.publicationId, env.LOCAL_OTHER_SESSION)]);
  const contenders = await Promise.all(last.map(app => app.request('/apply', submitBody(quota))));
  assert.equal(contenders.filter(r => r.status === 200).length, 1, JSON.stringify(contenders));
  assert([409, 429].includes(contenders.find(r => r.status !== 200).status));
  const count = await db.prepare('SELECT count(*) AS n FROM web_planning_request_application WHERE publication_id=?').bind(quota.publicationId).first();
  assert.equal(count.n, 25);
  const firstPage = await ownerWrite(quota.api);
  assert.equal(firstPage.applications.length, 10);
  const secondPage = await ownerWrite(quota.api + '?cursor=' + firstPage.next);
  assert.equal(secondPage.applications.length, 10);
  const lastPage = await ownerWrite(quota.api + '?cursor=' + secondPage.next);
  assert.equal(lastPage.applications.length, 5);
  assert.equal(lastPage.next, null);
  assert.equal(new Set([...firstPage.applications, ...secondPage.applications, ...lastPage.applications].map(a => a.id)).size, 25);

  const duplicate = await open(await seed('same applicant in two sessions'));
  const sessions = await Promise.all([applicantClient(duplicate.publicationId), applicantClient(duplicate.publicationId)]);
  const duplicateOffers = await Promise.all(sessions.map((app, i) => app.request('/apply', {...submitBody(duplicate), offer: 'Offer from session ' + i})));
  assert.equal(duplicateOffers.filter(r => r.status === 200).length, 1, JSON.stringify(duplicateOffers));
  assert.equal(duplicateOffers.find(r => r.status !== 200).status, 409);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM web_planning_request_application WHERE publication_id=?').bind(duplicate.publicationId).first()).n, 1);
  passed('applications: two distinct readers racing for the 25th record cannot overfill intake, all 25 remain visible across three bounded owner pages, and two sessions cannot create a second application for one principal');

  // Six different publications may reference the same live request and grant.
  // The workspace-wide limit concerns this one reader's pending offers.
  const basis = await seed('pending across publications');
  const reader = randomUUID() + '@example.test';
  const publications = [];
  for (let i = 0; i < 6; i++) publications.push(await open(basis, randomUUID()));
  for (const f of publications.slice(0, 4)) await submitFrom(f, reader);
  const finalTwo = publications.slice(4);
  const raced = await Promise.allSettled(finalTwo.map(f => submitFrom(f, reader)));
  const lost = raced.findIndex(result => result.status === 'rejected');
  assert.equal(raced.filter(result => result.status === 'fulfilled').length, 1);
  assert(raced[lost].reason instanceof Refusal && [409, 429].includes(raced[lost].reason.status));
  const paused = publications[0];
  const full = e => e instanceof Refusal && [409, 429].includes(e.status);
  await ownerWrite(paused.api + '/intake', {operation_id: randomUUID(), enabled: false, expected_version: 1});
  await assert.rejects(submitFrom(finalTwo[lost], reader), full, 'pausing a queue preserves its undecided reservation');
  await ownerWrite(paused.api + '/intake', {operation_id: randomUUID(), enabled: true, expected_version: 2});
  await assert.rejects(submitFrom(finalTwo[lost], reader), full, 'reopening cannot expose a sixth pending offer');
  await ownerWrite(publications[0].work + '/public-requests/revoke', {publication_id: publications[0].publicationId});
  await submitFrom(finalTwo[lost], reader);
  assert.equal((await db.prepare(`SELECT count(*) AS n FROM web_planning_request_application
    WHERE applicant_hash=? AND decision IS NULL AND invalidated_at IS NULL`).bind(hash(reader)).first()).n, 5);
  passed('applications: one principal can have five live undecided offers; pauses preserve the count across reopening, and permanent withdrawal releases exactly one place');
}
