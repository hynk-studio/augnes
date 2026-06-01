# AG Work Resume Imported Context DB Schema Design v0.1

## Status

This document is design-only. It defines a future DB/schema contract for Stage
D AG Resume imported resume context records after the imported context record
contract in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`.

This PR adds no schema/migration implementation, no runtime behavior, no
writer/helper/route/UI, and no imported context rows. It does not modify
`lib/db/schema.sql`, add migrations, create records, record proof/evidence,
bind sessions, execute or continue Codex, or grant approval, publish, retry,
replay, merge, or committed-state authority.

Durable approval remains user/Core gated.

## Purpose

Imported context schema must be designed separately before implementation
because the record stores bounded packet review metadata derived from a
validated AG Resume packet and an existing active confirmed mapping. Table
shape, JSON text fields, indexes, foreign-key policy, redaction requirements,
and lifecycle semantics need explicit review before any future schema or
migration PR can write local Augnes storage.

This document translates
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md` into a possible
future SQLite table and index contract. It preserves imported context as
review metadata only.

Confirmed mapping remains a required prerequisite, but it is not downstream
authority. A confirmed mapping does not import packet context, record
proof/evidence, bind sessions, start Codex, approve, publish, retry, replay,
or merge.

## Proposed Table

Future table name: `ag_work_resume_imported_contexts`.

The following SQL sketch is plain text for design review. It is not executed by
this PR and is not schema implementation.

```sql
CREATE TABLE IF NOT EXISTS ag_work_resume_imported_contexts (
  import_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_imported_context'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_imported_context.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN ('review_metadata', 'superseded', 'withdrawn', 'revoked')
  ),
  mapping_id TEXT NOT NULL,
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  local_scope TEXT NOT NULL,
  local_work_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  imported_summary TEXT NOT NULL,
  imported_expected_files TEXT NOT NULL DEFAULT '[]',
  imported_expected_checks TEXT NOT NULL DEFAULT '[]',
  foreign_refs_summary TEXT NOT NULL DEFAULT '{}',
  redaction_report TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  import_reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  authority_boundary TEXT NOT NULL DEFAULT '{}'
);
```

Field notes:

- `import_id TEXT PRIMARY KEY`
- `record_kind TEXT CHECK record_kind = ag_work_resume_imported_context`
- `schema TEXT CHECK schema = augnes.ag_work_resume_imported_context.v0_1`
- `status TEXT CHECK status IN review_metadata, superseded, withdrawn, revoked`
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
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'`

`import_reason` records why user/Core created or imported this bounded review
metadata. It is audit context only, not proof/evidence, session binding,
approval, publish, retry, replay, merge, or committed-state authority.

JSON text fields:

- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `authority_boundary`

Future implementation should parse and validate these JSON text fields as
bounded array or object shapes before persistence, but storage remains `TEXT`
to match existing Augnes JSON-text storage patterns.

## Proposed Indexes

Future lookup indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_mapping_time
  ON ag_work_resume_imported_contexts(mapping_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_foreign_time
  ON ag_work_resume_imported_contexts(
    foreign_scope,
    foreign_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_local_time
  ON ag_work_resume_imported_contexts(
    local_scope,
    local_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_packet_hash
  ON ag_work_resume_imported_contexts(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_status_time
  ON ag_work_resume_imported_contexts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_created_by_time
  ON ag_work_resume_imported_contexts(created_by, created_at DESC);
```

The intended lookup patterns are:

- `mapping_id`, `created_at DESC`
- `foreign_scope`, `foreign_work_id`, `created_at DESC`
- `local_scope`, `local_work_id`, `created_at DESC`
- `packet_id`, `packet_hash`
- `status`, `created_at DESC`
- `created_by`, `created_at DESC`

## Constraints And Foreign-Key Policy

`mapping_id` identifies the active confirmed mapping reviewed before the
future imported context record is created. A future implementation has two
reasonable policy options:

- Direct DB foreign key to
  `ag_work_resume_confirmed_mappings(mapping_id)`: this enforces local mapping
  existence at storage time, but it may complicate archival or cross-runtime
  import flows.
- No DB foreign key: this keeps archival and cross-runtime import options
  simpler, but the future writer must validate active confirmed mapping
  existence explicitly and fail closed before writing if validation fails.

This design recommends that the future schema implementation PR document the
FK choice explicitly and keep the future writer responsible for validation
either way.

Future writer validation must require:

- mapping exists
- mapping status is `active`
- `foreign_scope`, `foreign_work_id`, `local_scope`, and `local_work_id` match
  the active confirmed mapping
- `packet_id` and `packet_hash` match the reviewed packet
- redaction report excludes secrets, raw DB paths, raw session payloads, and
  raw proof payloads

No schema is implemented in this PR.

## Lifecycle And Status Model

Future imported context statuses:

- `review_metadata`: active/default review metadata state
- `superseded`: inactive; replaced by a newer imported context record
- `withdrawn`: inactive; user/Core removed the record from active review use
- `revoked`: inactive; user/Core determined the record should no longer be
  trusted

`superseded`, `withdrawn`, and `revoked` imported contexts are inactive. They
remain as historical rows and must not be deleted as part of ordinary lifecycle
changes.

Imported context lifecycle does not mutate confirmed mapping rows. Imported
context lifecycle does not create proof/evidence records, bind sessions,
execute or continue Codex, approve, publish, retry, replay, merge, create work
items, or create work events.

Revocation and withdrawal must not delete rows. They should update status and
bounded review metadata only, subject to a separately designed lifecycle
writer/route if that route is ever approved.

## Authority Boundary

The future table stores imported context review metadata only.

- No proof/evidence.
- No session binding.
- No Codex execution or continuation.
- No committed state authority.
- No approval, publish, retry, replay, or merge.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No bridge tool, MCP/App schema, Direct Resume Code, relay, telemetry,
  analytics, localStorage, sessionStorage, or indexedDB behavior.

Durable approval remains user/Core gated.

## Non-Goals

- No schema implementation.
- No migration.
- No writer/helper/route/UI.
- No imported context row creation.
- No proof/evidence/session reconciliation.
- No Codex continuation.
- No Direct Resume Code.
- No relay.
- No ChatGPT App, MCP/App schema, or bridge tool.
- No telemetry/analytics/browser persistence.
- No localStorage, sessionStorage, or indexedDB persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future Implementation Notes

A future schema implementation PR should add the imported context table and
indexes only. It should not add a writer, helper, route, Cockpit UI, ChatGPT
App card, MCP/App schema, bridge tool, proof/evidence/session behavior, Codex
execution behavior, or approval/publish/retry/replay/merge behavior.

A future writer/helper PR must validate active confirmed mapping, packet
identity, redaction report, actor/reason, and any duplicate/import policy if
one is separately designed.

Future route, read, and UI work remain separately gated. Proof/evidence,
session, and Codex gates remain separate.

The schema foundation implementation is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md`. It
creates the imported context table and indexes only, creates no imported
context rows during migration, and grants no writer/helper/route/UI,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

The separately gated writer/helper is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`. It creates only imported
context review metadata rows from active confirmed mappings and still grants no
route/UI, proof/evidence, session, Codex, approval, publish, retry, replay, or
merge authority.

The separately gated create route is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`. It delegates to the
writer core and still grants no read route, UI, proof/evidence, session, Codex,
work item/event, confirmed mapping/proposal mutation, approval, publish, retry,
replay, or merge authority.

This design document itself does not authorize implementation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only imported context schema slice

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
node --check scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs
```
