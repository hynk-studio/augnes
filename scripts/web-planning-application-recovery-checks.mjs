import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonical, hash } from '../apps/web_planning/src/contract.ts';

// Model the operational rows already present at a recovery destination. They
// are absent from the portable work export that the owner is about to import.
export async function retainedApplications(source, target, publicationId) {
  const pub = await source.prepare('SELECT * FROM web_planning_public_request WHERE publication_id=?').bind(publicationId).first();
  const grant = await source.prepare('SELECT * FROM web_planning_participation WHERE grant_id=?').bind(pub.grant_id).first();
  const approvedEmail = 'approved-application@example.test';
  const issuedGrant = { ...grant, grant_id: randomUUID(), recipient_login: approvedEmail, recipient_hash: hash(approvedEmail) };
  async function insert(db, table, row) {
    const keys = Object.keys(row);
    await db.prepare('INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')')
      .bind(...Object.values(row)).run();
  }
  function application(publication, email, decision = null) {
    const offer = 'Private application to help with this request.';
    return { publication_id: publication.publication_id, application_id: randomUUID(), applicant_login: email, applicant_hash: hash(email),
      material_fingerprint: publication.material_fingerprint, offer, body_fingerprint: hash(canonical({offer, publication_fingerprint: publication.material_fingerprint})),
      created_at: publication.created_at, expires: publication.expires, decision,
      decision_operation_id: decision && randomUUID(), decision_fingerprint: decision && hash(decision),
      grant_id: decision === 'approved' ? issuedGrant.grant_id : null, invalidated_at: null };
  }
  const pending = application(pub,'pending-application@example.test');
  const approved = application(pub,approvedEmail,'approved');
  const declined = application(pub,'declined-application@example.test','declined');
  for (const db of [source,target]) {
    await insert(db,'web_planning_participation',issuedGrant);
    await insert(db,'web_planning_intake_event',{publication_id: publicationId, version: 1, operation_id: randomUUID(), enabled: 1});
    for (const row of [pending,approved,declined]) await insert(db,'web_planning_request_application',row);
  }
  // An independently retained project can use the same opaque work ID.
  const otherProject = randomUUID(), otherAuthor = randomUUID(), otherOwner = hash('other-project@example.test');
  const otherGrant = {...grant, project_id: otherProject, grant_id: randomUUID()};
  await insert(target,'web_planning_workspace',{singleton: 2, workspace_id: pub.workspace_id, project_id: otherProject,
    author_ref: otherAuthor, owner_login_hash: otherOwner});
  await insert(target,'web_planning_participation',otherGrant);
  const material = canonical({...JSON.parse(pub.material), issuer_ref: otherAuthor, grant_id: otherGrant.grant_id});
  const otherPublication = {...pub, project_id: otherProject, publication_id: randomUUID(), issuer_hash: otherOwner,
    grant_id: otherGrant.grant_id, material, material_fingerprint: hash(material)};
  await insert(target,'web_planning_public_request',otherPublication);
  const unrelated = application(otherPublication,'pending-application@example.test');
  await insert(target,'web_planning_request_application',unrelated);

  const read = (db, row) => db.prepare('SELECT * FROM web_planning_request_application WHERE publication_id=? AND application_id=?')
    .bind(row.publication_id,row.application_id).first();
  const grantState = () => target.prepare('SELECT revoked_at FROM web_planning_participation WHERE grant_id=?').bind(issuedGrant.grant_id).first();
  return {
    async checkRolledBack() {
      assert.deepEqual(await read(target,pending),pending);
      assert.equal((await grantState()).revoked_at,null);
    },
    async checkInvalidated(db) {
      const after = await read(db,pending);
      assert.ok(after.invalidated_at);
      assert.deepEqual(after,{...pending,invalidated_at: after.invalidated_at});
      assert.deepEqual(await read(db,approved),approved);
      assert.deepEqual(await read(db,declined),declined);
      if (db === target) {
        assert.ok((await grantState()).revoked_at);
        assert.deepEqual(await read(db,unrelated),unrelated);
        assert.deepEqual(await db.prepare('SELECT * FROM web_planning_public_request WHERE publication_id=?')
          .bind(otherPublication.publication_id).first(),otherPublication);
        assert.deepEqual(await db.prepare('SELECT * FROM web_planning_participation WHERE grant_id=?').bind(otherGrant.grant_id).first(),otherGrant);
      }
    },
  };
}
