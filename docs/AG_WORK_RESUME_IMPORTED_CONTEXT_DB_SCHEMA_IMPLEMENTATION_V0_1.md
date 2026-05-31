# AG Work Resume Imported Context DB Schema Implementation v0.1

## Status

This document records the Stage D AG Resume imported context schema
foundation. It implements only the SQLite table and indexes for imported
context review metadata.

This PR adds no imported context writer/helper, no route, no read route, no
Cockpit UI, no proof/evidence recording, no session binding, no Codex
execution or continuation, no work item or work event creation, no confirmed
mapping mutation, no proposal mutation, no ChatGPT App/MCP/App schema, no
bridge tool, no Direct Resume Code, no relay, no telemetry/analytics/browser
persistence, and no approval, publish, retry, replay, or merge authority.

Durable approval remains user/Core gated.

## Implemented Schema Foundation

`lib/db/schema.sql` now creates:

- table: `ag_work_resume_imported_contexts`
- indexes:
  - `idx_ag_imported_contexts_mapping_time`
  - `idx_ag_imported_contexts_foreign_time`
  - `idx_ag_imported_contexts_local_time`
  - `idx_ag_imported_contexts_packet_hash`
  - `idx_ag_imported_contexts_status_time`
  - `idx_ag_imported_contexts_created_by_time`

The table and indexes use `CREATE ... IF NOT EXISTS`, so empty DB migration and
repeat migration are idempotent.

The schema creates no imported context rows during migration. It creates no
proof/evidence, session, work, confirmed mapping, proposal, route, writer,
helper, UI, Codex, approval, publish, retry, replay, or merge behavior.

## Implemented Table

Implemented table name: `ag_work_resume_imported_contexts`.

Implemented columns, in order:

- `import_id TEXT PRIMARY KEY`
- `record_kind TEXT NOT NULL CHECK record_kind = ag_work_resume_imported_context`
- `schema TEXT NOT NULL CHECK schema = augnes.ag_work_resume_imported_context.v0_1`
- `status TEXT NOT NULL CHECK status IN review_metadata, superseded, withdrawn, revoked`
- `mapping_id TEXT NOT NULL`
- `foreign_scope TEXT NOT NULL`
- `foreign_work_id TEXT NOT NULL`
- `local_scope TEXT NOT NULL`
- `local_work_id TEXT NOT NULL`
- `packet_id TEXT NOT NULL`
- `packet_hash TEXT NOT NULL`
- `source_runtime_instance_id TEXT`
- `imported_summary TEXT NOT NULL`
- `imported_expected_files TEXT NOT NULL DEFAULT '[]'`
- `imported_expected_checks TEXT NOT NULL DEFAULT '[]'`
- `foreign_refs_summary TEXT NOT NULL DEFAULT '{}'`
- `redaction_report TEXT NOT NULL DEFAULT '{}'`
- `created_by TEXT NOT NULL`
- `import_reason TEXT NOT NULL`
- `created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
- `updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'`

`import_reason` records why user/Core created or imported this bounded review
metadata. It is audit context only, not proof/evidence, session binding,
approval, publish, retry, replay, merge, or committed-state authority.

Implemented status values:

- `review_metadata`
- `superseded`
- `withdrawn`
- `revoked`

## JSON Text Fields

The implemented JSON text fields are:

- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `authority_boundary`

The schema stores these as `TEXT`. Future writer/helper code must validate
bounded array/object shapes before persistence.

## Foreign-Key Policy

This schema foundation does not add a DB foreign key from `mapping_id` to
`ag_work_resume_confirmed_mappings(mapping_id)`.

This follows the Stage D DB/schema design: no FK keeps archival and
cross-runtime import options simpler. The future writer remains responsible
for active confirmed mapping validation before any imported context row is
created.

Future writer validation must require:

- mapping exists
- mapping status is `active`
- `foreign_scope`, `foreign_work_id`, `local_scope`, and `local_work_id` match
  the active confirmed mapping
- `packet_id` and `packet_hash` match the reviewed packet
- redaction report excludes secrets, raw DB paths, raw session payloads, and
  raw proof payloads
- explicit user/Core actor and reason are present
- duplicate/import policy, if any, is separately designed

## Idempotent Migration Behavior

The schema foundation uses idempotent SQL:

- `CREATE TABLE IF NOT EXISTS ag_work_resume_imported_contexts`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_mapping_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_foreign_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_local_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_packet_hash`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_status_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_created_by_time`

Running `npm run db:migrate` more than once should leave the table and indexes
present without creating rows or changing other AG Resume authority behavior.

## Authority Boundary

The implemented table stores imported context review metadata only.

- No imported context rows are created during migration.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No committed state authority.
- No approval, publish, retry, replay, or merge.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No imported context writer/helper.
- No route or read route.
- No Cockpit UI.
- No ChatGPT App/MCP/App schema.
- No bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.

Durable approval remains user/Core gated.

## Non-Goals

- No writer/helper.
- No route.
- No read route.
- No Cockpit UI.
- No imported context row creation behavior.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App/MCP/App schema.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future Work

Future writer/helper, route, read route, and UI work remain separately gated.
Those future slices must restate the authority boundary and prove that imported
context remains review metadata only unless user/Core separately approves a
more specific behavior.

The Stage D imported context writer/helper is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`. It creates only
imported context review metadata rows from active confirmed mappings, validates
actor/reason and redaction metadata, and adds no route, read route, Cockpit UI,
proof/evidence recording, session binding, Codex execution, work item/event
creation, confirmed mapping/proposal mutation, or approval, publish, retry,
replay, or merge authority.

Proof/evidence, session, and Codex gates remain separate.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this schema-only imported context slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-imported-context-db-schema-design
npm run smoke:ag-work-resume-imported-context-record-design
npm run smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-read
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-imported-context-db-schema.mjs
```
