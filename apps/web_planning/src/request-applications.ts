import { applicationMode, login, projectEntryEnabled, requireScope, type Access, type ApplicantAccess, type Environment } from './access';
import { boundedText, canonical, exact, fail, FINGERPRINT, hash, UUID } from './contract';
import { prepareGrantDisclosure, verifyGrantSelection } from './participation';
import { ownedPublication, readPublicRequest } from './public-requests';
import type { Database } from './store';

const DAY = 86_400_000;
export const APPLICATION_LIMITS = { perPublication: 25, pendingPerPrincipal: 5, pendingDays: 7, pageSize: 10 } as const;
const now = "CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)";
type Context = { DB:Database; env:Environment };
type Input = Record<string,any>;

async function requireApplications(s:Context) {
  if(!applicationMode(s.env)) fail('application_unavailable',404);
  const row=await s.DB.prepare(`SELECT version,(SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND
    name IN ('web_planning_intake_event','web_planning_request_application')) AS present FROM web_planning_schema`)
    .first<{version:number;present:number}>();
  if(row?.version!==6 || row.present!==2) fail('application_migration_required',503);
}
function scopeValues(env:Environment) {
  return [env.WORKSPACE_ID,env.PROJECT_ID,env.AUTHOR_REF,hash(login(env.OWNER_EMAIL)!),Number(projectEntryEnabled(env))];
}

// These expressions run inside the same SQLite statement as each change. A
// reader's earlier observation cannot authorize a grant once its basis moves.
const publications = `WITH config(workspace,project,author,owner,multi) AS (VALUES (?,?,?,?,?)),
scoped AS NOT MATERIALIZED (
  SELECT p.* FROM web_planning_public_request p JOIN config c ON c.workspace=p.workspace_id
  JOIN web_planning_workspace w ON w.workspace_id=p.workspace_id AND w.project_id=p.project_id
    AND w.owner_login_hash=p.issuer_hash AND w.author_ref=json_extract(p.material,'$.issuer_ref')
  WHERE (c.multi=1 OR p.project_id=c.project) AND
    (w.singleton!=1 OR (p.project_id=c.project AND w.author_ref=c.author AND w.owner_login_hash=c.owner))
),
live AS NOT MATERIALIZED (
  SELECT p.*,g.recipient_hash AS original_recipient FROM scoped p JOIN web_planning_participation g
    ON g.workspace_id=p.workspace_id AND g.project_id=p.project_id AND g.work_id=p.work_id AND g.grant_id=p.grant_id
  WHERE p.revoked_at IS NULL AND p.expires>${now} AND g.revoked_at IS NULL AND g.expires>=p.expires
    AND g.disclosure_fingerprint=p.grant_fingerprint
    AND NOT EXISTS (SELECT 1 FROM web_planning_erased e WHERE e.workspace_id=p.workspace_id AND e.project_id=p.project_id AND e.work_id=p.work_id)
    AND EXISTS (SELECT 1 FROM web_planning_revision r WHERE r.workspace_id=p.workspace_id AND r.project_id=p.project_id AND r.work_id=p.work_id
      AND r.revision=json_extract(p.material,'$.request.revision') AND r.fingerprint=json_extract(p.material,'$.request.fingerprint')
      AND json_extract(r.envelope,'$.exchange.kind')='request')
    AND (SELECT h.revision FROM web_planning_revision h WHERE h.workspace_id=p.workspace_id AND h.project_id=p.project_id AND h.work_id=p.work_id
         ORDER BY h.revision DESC LIMIT 1)=json_extract(p.material,'$.expected.revision')
    AND EXISTS (SELECT 1 FROM web_planning_revision h WHERE h.workspace_id=p.workspace_id AND h.project_id=p.project_id AND h.work_id=p.work_id
      AND h.revision=json_extract(p.material,'$.expected.revision') AND h.fingerprint=json_extract(p.material,'$.expected.fingerprint'))
    AND NOT EXISTS (SELECT 1 FROM web_planning_revision r WHERE r.workspace_id=p.workspace_id AND r.project_id=p.project_id AND r.work_id=p.work_id
      AND json_extract(r.envelope,'$.exchange.basis.fingerprint')=json_extract(p.material,'$.request.fingerprint'))
),
accepting AS NOT MATERIALIZED (
  SELECT p.* FROM live p WHERE (SELECT enabled FROM web_planning_intake_event WHERE publication_id=p.publication_id ORDER BY version DESC LIMIT 1)=1
)`;

const capacity = `(SELECT COUNT(*) FROM web_planning_request_application t WHERE t.publication_id=p.publication_id)<${APPLICATION_LIMITS.perPublication}
  AND (SELECT COUNT(*) FROM (SELECT 1 FROM web_planning_request_application t
    WHERE t.applicant_hash=? AND t.decision IS NULL AND t.invalidated_at IS NULL AND t.expires>${now}
      AND EXISTS (SELECT 1 FROM live q WHERE q.publication_id=t.publication_id AND q.material_fingerprint=t.material_fingerprint)
    LIMIT ${APPLICATION_LIMITS.pendingPerPrincipal}))<${APPLICATION_LIMITS.pendingPerPrincipal}`;

interface ApplicationRow {
  application_id:string; applicant_login:string; applicant_hash:string; offer:string; body_fingerprint:string;
  created_at:string; expires:number; decision:'approved'|'declined'|null; decision_operation_id:string|null;
  decision_fingerprint:string|null; grant_id:string|null; invalidated_at:string|null; source_live:number; grant_active:number;
}
const applicationColumns = `a.*,EXISTS(SELECT 1 FROM live l WHERE l.publication_id=p.publication_id
  AND l.material_fingerprint=a.material_fingerprint) AS source_live,
  EXISTS(SELECT 1 FROM web_planning_participation g WHERE g.workspace_id=p.workspace_id AND g.project_id=p.project_id
    AND g.work_id=p.work_id AND g.grant_id=a.grant_id AND g.recipient_hash=a.applicant_hash AND g.revoked_at IS NULL AND g.expires>${now}
    AND NOT EXISTS(SELECT 1 FROM web_planning_erased e WHERE e.workspace_id=p.workspace_id AND e.project_id=p.project_id AND e.work_id=p.work_id)
  ) AS grant_active`;
function status(row:ApplicationRow) {
  if(row.decision) return row.decision;
  if(row.invalidated_at!==null) return 'unavailable';
  if(row.expires<=Date.now()) return 'expired';
  return row.source_live?'pending':'unavailable';
}
function applicantView(env:Environment,row:ApplicationRow) {
  return {id:row.application_id,status:status(row),expires:row.expires,
    grant_status:row.decision==='approved'?(row.grant_active?'active':'unavailable'):null,
    grant_url:row.decision==='approved' && row.grant_active?env.APP_ORIGIN+'/participate/'+row.grant_id:null};
}
function ownerView(env:Environment,row:ApplicationRow) {
  return {...applicantView(env,row),applicant:row.applicant_login,offer:row.offer,created_at:row.created_at,
    decision_operation_id:row.decision_operation_id,grant_id:row.grant_id};
}
function identifier(value:unknown):string {
  if(typeof value!=='string'||!UUID.test(value)) fail('invalid_application');
  return value;
}
async function readApplicant(s:ApplicantAccess) {
  const row=await s.DB.prepare(`${publications}
    SELECT p.material_fingerprint AS publication_fingerprint,${applicationColumns},EXISTS(
      SELECT 1 FROM accepting op WHERE op.publication_id=p.publication_id AND op.issuer_hash!=? AND op.original_recipient!=?
    ) AND a.application_id IS NULL AND ${capacity} AS available
    FROM scoped p LEFT JOIN web_planning_request_application a ON a.publication_id=p.publication_id AND a.applicant_hash=?
    WHERE p.publication_id=?`).bind(...scopeValues(s.env),s.principalHash,s.principalHash,s.principalHash,s.principalHash,s.publicationId)
    .first<ApplicationRow & {publication_fingerprint:string;available:number}>();
  if(!row) fail('application_unavailable',404);
  return row;
}
function applicantResult(s:ApplicantAccess,row:Awaited<ReturnType<typeof readApplicant>>) {
  return {available:!!row.available,publication_fingerprint:row.available?row.publication_fingerprint:null,
    application:row.application_id?applicantView(s.env,row):null};
}
export async function applicationStatus(s:ApplicantAccess) {
  await requireApplications(s);
  return applicantResult(s,await readApplicant(s));
}
export async function submitApplication(s:ApplicantAccess,input:Input) {
  await requireApplications(s);
  exact(input,'operation_id,publication_fingerprint,offer');
  const id=identifier(input.operation_id),offer=boundedText(input.offer,true);
  if(typeof input.publication_fingerprint!=='string'||!FINGERPRINT.test(input.publication_fingerprint)) fail('invalid_application');
  const fingerprint=hash(canonical({publication_id:s.publicationId,...input}));
  function replay(row:Awaited<ReturnType<typeof readApplicant>>) {
    if(row.application_id!==id || row.body_fingerprint!==fingerprint) fail('application_conflict',409);
    return applicantResult(s,row);
  }
  const prior=await readApplicant(s);
  if(prior.application_id)return replay(prior);
  if(!prior.available || prior.publication_fingerprint!==input.publication_fingerprint)fail('application_unavailable',409);
  // Reuse the published material and original disclosure integrity reader.
  const published=await readPublicRequest(s.env,s.publicationId);
  if(!published.available || !published.intake || published.source.publication_fingerprint!==input.publication_fingerprint)fail('application_unavailable',409);
  await s.DB.prepare(`${publications} INSERT INTO web_planning_request_application
    (publication_id,application_id,applicant_login,applicant_hash,material_fingerprint,offer,body_fingerprint,created_at,expires)
    SELECT p.publication_id,?,?,?,p.material_fingerprint,?,?,?,MIN(p.expires,${now}+${APPLICATION_LIMITS.pendingDays*DAY})
    FROM accepting p WHERE p.publication_id=? AND p.material_fingerprint=? AND p.issuer_hash!=? AND p.original_recipient!=?
      AND ${capacity} ON CONFLICT DO NOTHING`)
    .bind(...scopeValues(s.env),id,s.login,s.principalHash,offer,fingerprint,new Date().toISOString(),
      s.publicationId,input.publication_fingerprint,s.principalHash,s.principalHash,s.principalHash).run();
  const saved=await readApplicant(s);
  if(!saved.application_id)fail('application_unavailable',409);
  return replay(saved);
}

interface IntakeEvent {version:number;operation_id:string;enabled:number}
function intakeView(row:IntakeEvent|null) {
  return {enabled:!!row?.enabled,version:row?.version??0,operation_id:row?.operation_id??null};
}
async function ownerPublication(s:Access,workId:string,pub:string) {
  await requireApplications(s);
  const publication=await ownedPublication(s,workId,pub);
  if(publication.row.issuer_hash!==s.principalHash || publication.material.issuer_ref!==s.author_ref) fail('scope_denied',403);
  return publication;
}
export async function configureIntake(s:Access,workId:string,pub:string,input:Input) {
  exact(input,'workspace_id,project_id,operation_id,expected_version,enabled');requireScope(s,input);
  const op=identifier(input.operation_id);
  if(typeof input.enabled!=='boolean' || !Number.isSafeInteger(input.expected_version)||input.expected_version<0)fail('invalid_intake');
  const publication=await ownerPublication(s,workId,pub);
  const byOperation=()=>s.DB.prepare('SELECT version,operation_id,enabled FROM web_planning_intake_event WHERE publication_id=? AND operation_id=?')
    .bind(pub,op).first<IntakeEvent>();
  const reconcile=(saved:IntakeEvent)=>{
    if(saved.version!==input.expected_version+1||saved.enabled!==Number(input.enabled))fail('altered_replay',409);
    return intakeView(saved);
  };
  const prior=await byOperation();if(prior)return reconcile(prior);
  if(input.enabled) {
    const view=await readPublicRequest(s.env,pub);
    if(!view.available||view.status!=='active')fail('application_unavailable',409);
  }
  const table=input.enabled?'live':'scoped';
  await s.DB.prepare(`${publications} INSERT INTO web_planning_intake_event(publication_id,version,operation_id,enabled)
    SELECT p.publication_id,?,?,? FROM ${table} p WHERE p.publication_id=? AND p.project_id=? AND p.work_id=?
    AND p.issuer_hash=? AND p.material_fingerprint=? AND
    COALESCE((SELECT MAX(version) FROM web_planning_intake_event WHERE publication_id=p.publication_id),0)=?
    ON CONFLICT DO NOTHING`)
    .bind(...scopeValues(s.env),input.expected_version+1,op,Number(input.enabled),pub,s.project_id,workId,
      s.principalHash,publication.row.material_fingerprint,input.expected_version).run();
  const saved=await byOperation();if(!saved)fail('intake_changed',409);
  return reconcile(saved);
}
export async function listApplications(s:Access,workId:string,pub:string,cursor:string) {
  if(cursor)identifier(cursor);
  await ownerPublication(s,workId,pub);
  const current=await s.DB.prepare('SELECT version,operation_id,enabled FROM web_planning_intake_event WHERE publication_id=? ORDER BY version DESC LIMIT 1')
    .bind(pub).first<IntakeEvent>();
  const {results}=await s.DB.prepare(`${publications} SELECT ${applicationColumns} FROM scoped p
    JOIN web_planning_request_application a ON a.publication_id=p.publication_id
    WHERE p.publication_id=? AND p.project_id=? AND p.work_id=? AND p.issuer_hash=? AND a.application_id>?
    ORDER BY a.application_id LIMIT ?`).bind(...scopeValues(s.env),pub,s.project_id,workId,s.principalHash,cursor,APPLICATION_LIMITS.pageSize+1)
    .all<ApplicationRow>();
  const page=results.slice(0,APPLICATION_LIMITS.pageSize);
  return {intake:intakeView(current),applications:page.map(row=>ownerView(s.env,row)),
    next:results.length>page.length?page[page.length-1].application_id:null};
}
async function ownerApplication(s:Access,workId:string,pub:string,id:string) {
  const row=await s.DB.prepare(`${publications} SELECT ${applicationColumns} FROM scoped p
    JOIN web_planning_request_application a ON a.publication_id=p.publication_id
    WHERE p.publication_id=? AND p.work_id=? AND p.project_id=? AND p.issuer_hash=? AND a.application_id=?`)
    .bind(...scopeValues(s.env),pub,workId,s.project_id,s.principalHash,id).first<ApplicationRow>();
  if(!row)fail('application_unavailable',404);
  return row;
}
export async function resolveApplicationDecision(s:Access,workId:string,pub:string,input:Input) {
  exact(input,'workspace_id,project_id,application_id,operation_id');requireScope(s,input);
  const id=identifier(input.application_id),op=identifier(input.operation_id);
  await ownerPublication(s,workId,pub);
  const row=await ownerApplication(s,workId,pub,id);
  return row.decision_operation_id===op?{outcome:'decided',application:ownerView(s.env,row)}:{outcome:'unknown',application:null};
}
export async function decideApplication(s:Access,workId:string,pub:string,input:Input) {
  const approve=input.decision==='approve';
  if(!approve && input.decision!=='decline')fail('invalid_application_decision');
  exact(input,'workspace_id,project_id,application_id,operation_id,decision'+(approve?',brief,next_action,indices,expires':''));
  requireScope(s,input);
  const id=identifier(input.application_id),op=identifier(input.operation_id);
  const publication=await ownerPublication(s,workId,pub),prior=await ownerApplication(s,workId,pub,id);
  const digest=hash(canonical({publication_id:pub,...input}));
  function committed(row:ApplicationRow) {
    if(row.decision_operation_id!==op || row.decision_fingerprint!==digest)fail('application_decision_conflict',409);
    return ownerView(s.env,row);
  }
  if(prior.decision)return committed(prior);
  if(login(prior.applicant_login)!==prior.applicant_login || hash(prior.applicant_login)!==prior.applicant_hash)fail('application_integrity',503);
  if(status(prior)!=='pending')fail('application_unavailable',409);
  const grantId=approve?crypto.randomUUID():null;
  let prepared:Awaited<ReturnType<typeof prepareGrantDisclosure>>|undefined;
  if(approve) {
    if(!Number.isSafeInteger(input.expires)||input.expires<=Date.now()||input.expires>Date.now()+90*DAY)fail('invalid_participation_expiry');
    const view=await readPublicRequest(s.env,pub);
    if(!view.available || !view.intake)fail('application_unavailable',409);
    prepared=await prepareGrantDisclosure(s,publication.material.request,publication.material.expected,input);
    await verifyGrantSelection(s,prepared);
  }
  const decision=approve?'approved':'declined',table=approve?'accepting':'live';
  const update=s.DB.prepare(`${publications} UPDATE web_planning_request_application AS a
    SET decision=?,decision_operation_id=?,decision_fingerprint=?,grant_id=?
    WHERE a.publication_id=? AND a.application_id=? AND a.decision IS NULL AND a.invalidated_at IS NULL AND a.expires>${now}
      AND a.applicant_hash=? AND a.applicant_login=? AND ?>${now}
      AND NOT EXISTS(SELECT 1 FROM web_planning_request_application other WHERE other.publication_id=a.publication_id AND other.decision_operation_id=?)
      AND EXISTS(SELECT 1 FROM ${table} p WHERE p.publication_id=a.publication_id AND p.work_id=? AND p.project_id=?
        AND p.material_fingerprint=a.material_fingerprint AND p.material_fingerprint=? AND p.issuer_hash=?
        AND p.issuer_hash!=a.applicant_hash AND p.original_recipient!=a.applicant_hash)`)
    .bind(...scopeValues(s.env),decision,op,digest,grantId,pub,id,prior.applicant_hash,prior.applicant_login,
      approve?input.expires:prior.expires,op,workId,s.project_id,publication.row.material_fingerprint,s.principalHash);
  if(approve && prepared) {
    // Only this decision can install this freshly generated grant ID. A losing
    // UPDATE inserts nothing. A failed grant INSERT rolls back the decision.
    const insert=s.DB.prepare(`INSERT INTO web_planning_participation
      (workspace_id,project_id,grant_id,work_id,recipient_login,recipient_hash,disclosure,disclosure_fingerprint,expires)
      SELECT p.workspace_id,p.project_id,a.grant_id,p.work_id,a.applicant_login,a.applicant_hash,?,?,?
      FROM web_planning_request_application a JOIN web_planning_public_request p ON p.publication_id=a.publication_id
      WHERE a.publication_id=? AND a.application_id=? AND a.decision='approved' AND a.decision_operation_id=?
        AND a.decision_fingerprint=? AND a.grant_id=?`)
      .bind(prepared.encoded,prepared.fingerprint,input.expires,pub,id,op,digest,grantId);
    await s.DB.batch([update,insert]);
  } else await update.run();
  const saved=await ownerApplication(s,workId,pub,id);
  if(!saved.decision)fail('application_unavailable',409);
  return committed(saved);
}
