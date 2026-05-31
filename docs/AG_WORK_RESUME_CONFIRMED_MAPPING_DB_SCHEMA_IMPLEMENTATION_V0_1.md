# AG Work Resume Confirmed Mapping DB Schema Implementation v0.1

## Purpose

This document records the Stage C DB/schema foundation for AG Resume confirmed
mapping records. The implementation adds the SQLite table and indexes needed
for a future user/Core-gated confirmed mapping writer while still adding no
writer/helper/route/UI and no confirmed mapping row creation behavior.
It adds no writer/helper/route/UI authority.

This is schema foundation only. Confirmed mapping remains an identity
association between one foreign work identity and one existing local work
identity after explicit user/Core confirmation.

## Relationship To Design

- DB/schema design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md` defines the
  table, columns, indexes, active uniqueness policy, FK policy, lifecycle
  expectations, and authority boundary this implementation follows.
- Confirmed mapping record design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md` defines the
  Stage C record semantics and confirms that mapping is not import,
  proof/evidence, session binding, Codex execution, approval, publish, retry,
  replay, or merge authority.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps mapping,
  import, proof/evidence, session binding, and Codex continuation as separate
  user/Core-gated stages.
- Confirmed mapping writer/helper:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md` documents the first
  Stage C writer/helper built on this schema foundation. It creates confirmed
  mapping identity association rows only and still adds no route/UI, import,
  proof/evidence, session binding, Codex execution, approval, publish, retry,
  replay, or merge authority.
- Confirmed mapping route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md` documents the JSON
  route over the shared writer core. It creates confirmed mapping identity
  association rows only and still adds no Cockpit UI, schema/migration,
  import, proof/evidence, session binding, Codex execution, approval, publish,
  retry, replay, or merge authority.

## Implemented Table

The implemented table is:

`ag_work_resume_confirmed_mappings`

The table stores Stage C confirmed mapping identity metadata only. It creates
no rows during migration and has no runtime writer in this PR.

The table uses:

- `record_kind = 'ag_work_resume_confirmed_mapping'`
- `schema = 'augnes.ag_work_resume_confirmed_mapping.v0_1'`
- status enum values `active`, `superseded`, `withdrawn`, and `revoked`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'` as JSON text
- timestamp defaults for `created_at` and `updated_at`

## Implemented Indexes

The schema adds these indexes:

- `idx_ag_confirmed_mappings_active_foreign`
- `idx_ag_confirmed_mappings_foreign_time`
- `idx_ag_confirmed_mappings_local_time`
- `idx_ag_confirmed_mappings_source_proposal`
- `idx_ag_confirmed_mappings_packet_hash`
- `idx_ag_confirmed_mappings_status_time`
- `idx_ag_confirmed_mappings_supersedes`
- `idx_ag_confirmed_mappings_superseded_by`

`idx_ag_confirmed_mappings_active_foreign` is a SQLite partial unique index on
`foreign_scope` and `foreign_work_id` where `status = 'active'`. It permits
inactive historical rows for the same foreign identity while preventing two
active confirmed mappings for that foreign identity.

## FK Policy

This schema implementation does not add a DB foreign key to
`ag_work_resume_mapping_proposals(source_proposal_id)`. The design noted that a
direct FK can enforce local proposal existence but may complicate future
archival, import, or cross-runtime reconciliation.

Because no FK is added here, a future writer must validate:

- source proposal exists
- source proposal is active for confirmation
- packet id/hash match the reviewed proposal metadata
- local work exists
- duplicate active mapping does not exist unless a supersession path is
  explicitly designed
- explicit user/Core actor and confirmation reason are present

This schema implementation also does not add a work item FK. A future writer
must validate local work existence before creating any confirmed mapping row.

## Migration And Idempotency Behavior

The table and indexes live in `lib/db/schema.sql` using the existing
`CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` pattern.

`scripts/db-reset.mjs`, `scripts/db-init.mjs`, and `scripts/db-migrate.mjs`
already execute `lib/db/schema.sql`, so this slice does not add a targeted
helper in `scripts/db-migrations.mjs` and does not change
`scripts/db-migrate.mjs`.

Running migration repeatedly is idempotent. Migration creates the table and
indexes when absent and leaves existing rows alone. Migration does not insert,
backfill, drop, or rewrite confirmed mapping rows, and it does not modify
unrelated tables beyond the existing migration mechanics already present in
the repo.

## Authority Boundary

- Schema foundation only.
- Creates no confirmed mapping rows.
- Grants no writer/helper/route/UI authority.
- No import.
- No imported resume context.
- No work item or work event creation.
- No proof/evidence recording.
- No proof/evidence authorization.
- No session binding.
- No Codex execution or continuation.
- No ChatGPT App card.
- No MCP/App schema change.
- No bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation beyond the schema foundation.

Durable approval remains user/Core gated.

## Non-Goals

- No confirmed mapping writer/helper.
- No route.
- No Cockpit UI.
- No import record.
- No imported resume context.
- No work item or work event creation.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No ChatGPT App, MCP/App schema, or bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, or external posting.
- No browser report.

## Future Work

The first writer/helper PR is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`. It validates source
proposal existence, active proposal status, packet id/hash, local work
existence, duplicate active mapping policy, explicit user/Core actor, and
confirmation reason.

The JSON create route is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`. Future Cockpit UI work
remains separately gated. Stage D imported resume context remains after
confirmed mapping and requires separate design and authority review.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this schema-only confirmed mapping slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-confirmed-mapping-db-schema
npm run smoke:ag-work-resume-confirmed-mapping-db-schema-design
npm run smoke:ag-work-resume-confirmed-mapping-record-design
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-record-read
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs
```
