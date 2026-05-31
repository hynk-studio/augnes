# AG Work Resume Confirmed Mapping DB Schema Design v0.1

## Status

This document is design-only. It defines a future DB/schema contract for Stage
C AG Resume confirmed mapping records after the confirmed mapping record
contract in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`.

This PR adds no schema/migration implementation, no runtime behavior, no
writer/helper/route/UI, and no confirmed mapping rows. It does not modify
`lib/db/schema.sql`, add migrations, create records, import context, record
proof/evidence, bind sessions, execute Codex, or grant approval, publish,
retry, replay, or merge authority.

Durable approval remains user/Core gated.

## Purpose

Schema must be designed separately before implementation because a confirmed
mapping row is a durable identity association. The table shape, indexes,
status constraints, foreign-key policy, active uniqueness rule, and lifecycle
behavior need explicit review before any future schema or migration PR can
write local Augnes storage.

This document translates
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md` into a possible
future SQLite table and index contract. It preserves confirmed mapping as an
identity association only: one foreign work identity associated with one
existing local work identity after explicit user/Core confirmation.

Confirmed mapping remains separate from import, imported resume context,
proof/evidence, session binding, Codex execution, approval, publish, retry,
replay, and merge authority.

## Proposed Table

Future table name: `ag_work_resume_confirmed_mappings`.

The following SQL sketch is plain text for design review. It is not executed by
this PR and is not schema implementation.

```sql
CREATE TABLE IF NOT EXISTS ag_work_resume_confirmed_mappings (
  mapping_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_confirmed_mapping'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_confirmed_mapping.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN ('active', 'superseded', 'withdrawn', 'revoked')
  ),
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  local_scope TEXT NOT NULL,
  local_work_id TEXT NOT NULL,
  source_proposal_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  confirmed_by TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  confirmation_reason TEXT NOT NULL,
  supersedes_mapping_id TEXT,
  superseded_by_mapping_id TEXT,
  revoked_by TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  authority_boundary TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`authority_boundary` is JSON text. Future implementation should parse and
validate it as a bounded object, but storage remains `TEXT` to match existing
Augnes JSON-text storage patterns.

Field notes:

- `mapping_id TEXT PRIMARY KEY`
- `record_kind TEXT CHECK record_kind = ag_work_resume_confirmed_mapping`
- `schema TEXT CHECK schema = augnes.ag_work_resume_confirmed_mapping.v0_1`
- `status TEXT CHECK status IN active, superseded, withdrawn, revoked`
- `foreign_scope TEXT NOT NULL`
- `foreign_work_id TEXT NOT NULL`
- `local_scope TEXT NOT NULL`
- `local_work_id TEXT NOT NULL`
- `source_proposal_id TEXT NOT NULL`
- `packet_id TEXT NOT NULL`
- `packet_hash TEXT NOT NULL`
- `source_runtime_instance_id TEXT`
- `confirmed_by TEXT NOT NULL`
- `confirmed_at TEXT NOT NULL`
- `confirmation_reason TEXT NOT NULL`
- `supersedes_mapping_id TEXT`
- `superseded_by_mapping_id TEXT`
- `revoked_by TEXT`
- `revoked_at TEXT`
- `revocation_reason TEXT`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

## Proposed Indexes

Future active uniqueness:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_active_foreign
  ON ag_work_resume_confirmed_mappings(foreign_scope, foreign_work_id)
  WHERE status = 'active';
```

Future lookup indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_foreign_time
  ON ag_work_resume_confirmed_mappings(
    foreign_scope,
    foreign_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_local_time
  ON ag_work_resume_confirmed_mappings(
    local_scope,
    local_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_source_proposal
  ON ag_work_resume_confirmed_mappings(source_proposal_id);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_packet_hash
  ON ag_work_resume_confirmed_mappings(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_status_time
  ON ag_work_resume_confirmed_mappings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_supersedes
  ON ag_work_resume_confirmed_mappings(supersedes_mapping_id);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_superseded_by
  ON ag_work_resume_confirmed_mappings(superseded_by_mapping_id);
```

The intended lookup patterns are:

- `foreign_scope`, `foreign_work_id`, `created_at DESC`
- `local_scope`, `local_work_id`, `created_at DESC`
- `source_proposal_id`
- `packet_id`, `packet_hash`
- `status`, `created_at DESC`
- `supersedes_mapping_id`
- `superseded_by_mapping_id`

## Constraints And Foreign-Key Policy

`source_proposal_id` should normally identify the Stage B proposal record that
was reviewed before Stage C confirmation. A future implementation has two
reasonable policy options:

- Direct DB foreign key to
  `ag_work_resume_mapping_proposals(source_proposal_id)`: this enforces local
  proposal existence at storage time, but it may complicate future archival,
  import, or cross-runtime reconciliation flows.
- No DB foreign key: this keeps archival/import options simpler, but the future
  writer must validate source proposal existence explicitly, must validate the
  proposal is active for confirmation, and must fail closed before writing if
  validation fails.

This design recommends that the future schema implementation PR document the
FK choice explicitly and keep the future writer responsible for validating
`source_proposal_id` either way.

Local work item relation:

- A future writer must validate local work exists before creating any mapping.
- A DB foreign key to a future or existing `work_items(scope, work_id)` key may
  be considered, but it is not added here.
- Confirmed mapping must never create local work as a side effect.

No schema is implemented in this PR.

## Active Uniqueness And Lifecycle

There must be only one active confirmed mapping per `foreign_scope` +
`foreign_work_id`.

`superseded`, `withdrawn`, and `revoked` mappings are inactive. They remain as
historical rows and must not be deleted as part of ordinary lifecycle changes.

Supersession must be transactional in a future implementation. The transaction
must ensure that replacing one active mapping with another cannot leave two
active rows for the same foreign identity and cannot leave a half-written
supersession link.

Revocation and withdrawal must not delete rows. They should update status and
bounded review metadata only, subject to a separately designed lifecycle
writer/route if that route is ever approved.

## Authority Boundary

The future table stores mapping identity association only.

- No import context.
- No imported resume context.
- No proof/evidence.
- No session binding.
- No Codex execution or continuation.
- No approval, merge, publish, retry, or replay.
- No work item or work event creation.
- No proposal creation.
- No import record creation.
- No bridge tool, MCP/App schema, Direct Resume Code, relay, telemetry,
  analytics, localStorage, sessionStorage, or indexedDB behavior.

Durable approval remains user/Core gated.

## Non-Goals

- No schema implementation.
- No migration.
- No writer/helper/route/UI.
- No import schema.
- No import record.
- No imported resume context.
- No proof/evidence/session reconciliation.
- No Codex continuation.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future Implementation Notes

A future schema implementation PR should add the table and indexes only. It
should not add a writer, helper, route, Cockpit UI, ChatGPT App card, MCP/App
schema, bridge tool, import table, proof/evidence/session behavior, Codex
execution behavior, or approval/publish/retry/replay/merge behavior.

`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
documents the schema foundation implementation. That implementation creates
the `ag_work_resume_confirmed_mappings` table and indexes only; it creates no
rows in normal runtime and grants no writer/helper/route/UI, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

A future writer/helper PR should validate:

- source proposal exists
- source proposal is active for confirmation
- packet id/hash and packet hash match expected proposal metadata
- local work exists
- explicit user/Core actor and confirmation reason are present
- duplicate active mapping does not exist unless a supersession path is
  explicitly designed

Future route/UI work should remain separately gated. Stage D imported resume
context remains after confirmed mapping and requires its own design and
authority review.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only confirmed mapping schema slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-confirmed-mapping-db-schema-design
npm run smoke:ag-work-resume-confirmed-mapping-record-design
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs
```
