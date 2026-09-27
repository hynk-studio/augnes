import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// Hosted planning schema only. No installed native Augnes database imports.
export const schemaVersion=sqliteTable('web_planning_schema',{
  version:integer('version').primaryKey(),
},t=>[check('web_planning_schema_version',sql`${t.version} = 1`)]);

export const workspace=sqliteTable('web_planning_workspace',{
  singleton:integer('singleton').primaryKey(),
  workspace_id:text('workspace_id').notNull(),
  project_id:text('project_id').notNull(),
  author_ref:text('author_ref').notNull(),
  owner_login_hash:text('owner_login_hash').notNull(),
},t=>[
  check('web_planning_workspace_singleton',sql`${t.singleton} = 1`),
  unique('web_planning_workspace_scope').on(t.workspace_id,t.project_id),
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
  unique('web_planning_revision_request').on(t.workspace_id,t.project_id,t.request_key),
  foreignKey({columns:[t.workspace_id,t.project_id],foreignColumns:[workspace.workspace_id,workspace.project_id]}),
  check('web_planning_revision_bound',sql`${t.revision} BETWEEN 1 AND 32`),
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
