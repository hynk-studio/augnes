import { sql } from 'drizzle-orm';
import { blob, check, foreignKey, index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// Hosted planning schema only. No installed native Augnes database imports.
export const schemaVersion=sqliteTable('web_planning_schema',{
  version:integer('version').primaryKey(),
},t=>[check('web_planning_schema_version',sql`${t.version} = 6`)]);

export const workspace=sqliteTable('web_planning_workspace',{
  singleton:integer('singleton').primaryKey(),
  workspace_id:text('workspace_id').notNull(),
  project_id:text('project_id').notNull(),
  author_ref:text('author_ref').notNull(),
  owner_login_hash:text('owner_login_hash').notNull(),
  name:text('name'),
  continuation_work_id:text('continuation_work_id'),
  creation_key:text('creation_key'),
  creation_fingerprint:text('creation_fingerprint'),
},t=>[
  check('web_planning_workspace_positive',sql`${t.singleton} >= 1`),
  unique('web_planning_workspace_scope').on(t.workspace_id,t.project_id),
  unique('web_planning_workspace_creation').on(t.owner_login_hash,t.creation_key),
  index('web_planning_workspace_owner').on(t.owner_login_hash,t.project_id),
]);

export const revision=sqliteTable('web_planning_revision',{
  workspace_id:text('workspace_id').notNull(),
  project_id:text('project_id').notNull(),
  work_id:text('work_id').notNull(),
  revision:integer('revision').notNull(),
  fingerprint:text('fingerprint').notNull(),
  request_key:text('request_key').notNull(),
  request_fingerprint:text('request_fingerprint').notNull(),
  envelope:text('envelope').notNull(),
},t=>[
  primaryKey({columns:[t.workspace_id,t.project_id,t.work_id,t.revision]}),
  index('web_planning_return_destination').on(t.workspace_id,t.project_id,sql`envelope ->> '$.return_use.returned.fingerprint'`,sql`envelope ->> '$.return_use.index'`,t.work_id,t.revision)
    .where(sql`(envelope ->> '$.return_use.returned.fingerprint') IS NOT NULL`),
  unique('web_planning_revision_request').on(t.workspace_id,t.project_id,t.request_key),
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
  check('web_planning_revision_positive',sql`typeof(${t.revision}) = 'integer' AND ${t.revision} BETWEEN 1 AND 9007199254740991`),
  check('web_planning_revision_json',sql`json_valid(${t.envelope})`),
]);

export const erased=sqliteTable('web_planning_erased',{
  workspace_id:text('workspace_id').notNull(),
  project_id:text('project_id').notNull(),
  work_id:text('work_id').notNull(),
},t=>[
  primaryKey({columns:[t.workspace_id,t.project_id,t.work_id]}),
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
]);

// Operational access grants are excluded from revision/export reconstruction.
export const participation=sqliteTable('web_planning_participation',{
  workspace_id:text('workspace_id').notNull(),project_id:text('project_id').notNull(),
  grant_id:text('grant_id').notNull(),work_id:text('work_id').notNull(),
  recipient_login:text('recipient_login').notNull(),recipient_hash:text('recipient_hash').notNull(),
  disclosure:text('disclosure').notNull(),disclosure_fingerprint:text('disclosure_fingerprint').notNull(),
  expires:integer('expires').notNull(),revoked_at:text('revoked_at'),
},t=>[
  primaryKey({columns:[t.workspace_id,t.project_id,t.grant_id]}),
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
  index('web_planning_participation_request').on(t.workspace_id,t.project_id,t.work_id),
  unique('web_planning_participation_identity').on(t.grant_id),
  check('web_planning_participation_disclosure',sql`json_valid(${t.disclosure})`),
]);

// A finite, revocable right to append attributed updates to one existing work.
// These operational grants never travel in a portable work export.
export const continuation=sqliteTable('web_planning_continuation',{
  grant_id:text('grant_id').primaryKey(),
  workspace_id:text('workspace_id').notNull(),project_id:text('project_id').notNull(),work_id:text('work_id').notNull(),
  issuer_hash:text('issuer_hash').notNull(),recipient_login:text('recipient_login').notNull(),recipient_hash:text('recipient_hash').notNull(),
  obligation:text('obligation').notNull(),creation_fingerprint:text('creation_fingerprint').notNull(),
  expires:integer('expires').notNull(),max_updates:integer('max_updates').notNull(),revoked_at:text('revoked_at'),
},t=>[
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
  index('web_planning_continuation_work').on(t.workspace_id,t.project_id,t.work_id,t.grant_id),
  check('web_planning_continuation_limit',sql`${t.max_updates} BETWEEN 1 AND 20`),
]);

// Quotas are also enforced by the migration's transaction-local INSERT trigger.
export const file=sqliteTable('web_planning_file',{
  workspace_id:text('workspace_id').notNull(),project_id:text('project_id').notNull(),
  work_id:text('work_id').notNull(),digest:text('digest').notNull(),
  bytes:integer('bytes').notNull(),body:blob('body',{mode:'buffer'}),
},t=>[
  primaryKey({columns:[t.workspace_id,t.project_id,t.work_id,t.digest]}),
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
  check('web_planning_file_size',sql`${t.bytes} BETWEEN 0 AND 6291456`),
  check('web_planning_file_body',sql`(${t.bytes} <= 262144 AND typeof(${t.body}) = 'blob' AND length(${t.body}) = ${t.bytes}) OR (${t.bytes} > 262144 AND ${t.body} IS NULL)`),
]);

// Large exchange bodies use aligned base64 slices: each D1 value stays below
// the row/binding limit. The manifest and every slice commit in the same batch.
export const filePart=sqliteTable('web_planning_file_part',{
  workspace_id:text('workspace_id').notNull(),project_id:text('project_id').notNull(),
  work_id:text('work_id').notNull(),digest:text('digest').notNull(),
  ordinal:integer('ordinal').notNull(),data:text('data').notNull(),
},t=>[
  primaryKey({columns:[t.workspace_id,t.project_id,t.work_id,t.digest,t.ordinal]}),
  foreignKey({columns:[t.workspace_id,t.project_id,t.work_id,t.digest],foreignColumns:[file.workspace_id,file.project_id,file.work_id,file.digest]}).onDelete('cascade'),
  check('web_planning_part_ordinal',sql`typeof(${t.ordinal}) = 'integer' AND ${t.ordinal} BETWEEN 0 AND 31`),
  check('web_planning_part_size',sql`typeof(${t.data}) = 'text' AND length(${t.data}) BETWEEN 4 AND 262144`),
]);
