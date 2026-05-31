# AG Work Resume Mapping Proposal DB Schema Implementation v0.1

## Purpose

This document records the Stage B DB/schema foundation for AG Resume mapping
proposal records. The implementation adds the SQLite table and indexes needed
for a future user/Core-gated proposal record writer, while still adding no
write route, no UI, no record writer, and no proposal record creation behavior.

## Relationship To Existing Pieces

- DB/schema design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md` defines the
  table, columns, indexes, idempotency expectations, validation boundary, and
  authority boundary this implementation follows.
- Stage B proposal record design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md` defines the
  proposal-only record shape and says a proposal record is not a confirmed
  mapping, not import, not proof/evidence, and not Codex execution authority.
- Stage A preview-only surfaces:
  the pure helper, local helper, route, and Cockpit panel remain read-only
  mapping proposal preview surfaces. They do not write to this table.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps mapping,
  proposal record, confirmed mapping, import, proof/evidence, session binding,
  and Codex continuation as separate user/Core-gated stages.

## Implemented Table

The implemented table is:

`ag_work_resume_mapping_proposals`

The table stores Stage B proposal metadata only. It has no foreign keys to
`work_items`, `agents`, `sessions`, proof/evidence tables, or future confirmed
mapping tables. This preserves cross-local proposal metadata without implying
local work ownership, proof/evidence authority, session authority, or confirmed
mapping authority.

The table uses:

- `record_kind = 'ag_work_resume_mapping_proposal'`
- `schema = 'augnes.ag_work_resume_mapping_proposal.v0_1'`
- status enum values `proposed`, `needs_review`, `superseded`, `withdrawn`,
  `rejected`, and `expired`

There is no `confirmed` status. Confirmed mapping remains Stage C and should
use a separate future table.

## Implemented Indexes

The schema adds these indexes:

- `idx_ag_mapping_proposals_foreign_work_time`
- `idx_ag_mapping_proposals_candidate_time`
- `idx_ag_mapping_proposals_status_time`
- `idx_ag_mapping_proposals_packet_hash`
- `idx_ag_mapping_proposals_preview_hash`
- `idx_ag_mapping_proposals_expires_at`
- `idx_ag_mapping_proposals_supersedes`
- `idx_ag_mapping_proposals_superseded_by`
- `idx_ag_mapping_proposals_active_unique`

`idx_ag_mapping_proposals_active_unique` is a SQLite partial unique index over
`foreign_scope`, `foreign_work_id`, `candidate_local_scope`, and
`candidate_local_work_id` where status is `proposed` or `needs_review`. It
prevents duplicate active proposals for the same foreign/candidate tuple while
allowing later proposals after earlier rows become non-active statuses such as
`withdrawn`, `rejected`, `expired`, or `superseded`.

## JSON Text Fields

The table stores JSON-ish arrays and objects as `TEXT`, matching existing
`schema.sql` patterns.

Array defaults:

- `comparison_summary TEXT NOT NULL DEFAULT '[]'`
- `gaps_summary TEXT NOT NULL DEFAULT '[]'`
- `conflicts_summary TEXT NOT NULL DEFAULT '[]'`
- `questions_summary TEXT NOT NULL DEFAULT '[]'`

Object defaults:

- `foreign_refs_summary TEXT NOT NULL DEFAULT '{}'`
- `repo_context_summary TEXT NOT NULL DEFAULT '{}'`
- `redaction_summary TEXT NOT NULL DEFAULT '{}'`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'`

Future writers must validate these strings as parseable JSON before insert or
update. This schema does not add that writer.

## Migration And Idempotency Behavior

The table and indexes live in `lib/db/schema.sql` using the existing
`CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` pattern.

`scripts/db-reset.mjs`, `scripts/db-init.mjs`, and `scripts/db-migrate.mjs`
already execute `lib/db/schema.sql`, so this slice does not add a targeted
helper in `scripts/db-migrations.mjs` and does not change
`scripts/db-migrate.mjs`.

Running migration repeatedly is idempotent. Migration creates the table and
indexes when absent and leaves existing rows alone. Migration does not insert,
backfill, drop, or rewrite proposal rows, and it does not modify unrelated
tables beyond the existing migration mechanics already present in the repo.

## Authority Boundary

- The schema exists.
- No write route.
- No read route.
- No read helper.
- No record writer.
- No proposal records are created by migration.
- No confirmed mapping.
- No import.
- No proof/evidence.
- No session binding.
- No Codex execution.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  application-level committed-state mutation.
- No Cockpit UI, ChatGPT App card, MCP/App tool schema, bridge tool, Direct
  Resume Code route, relay behavior, telemetry, or local storage persistence.

The schema enables future user/Core-gated proposal record work, but it does not
itself create proposal records outside isolated smoke fixtures. It does not
confirm mappings, import packet context, record proof/evidence, bind sessions,
start Codex, publish, retry, replay, or merge.

Durable approval remains user/Core gated.

## Future Write And Read Separation

A future write route remains separately gated and must explicitly require
strict packet preflight, a generated mapping proposal preview, an explicit
selected candidate, user/Core request, safe redaction and target policy, and no
blocked preview status. It must create only proposal records and must not create
confirmed mappings, imports, work items, proof/evidence, sessions, or Codex
execution state.

A future read helper or read route also remains separately gated unless it is
explicitly scoped. This schema PR does not expose application-level reads.

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md` documents the
first Stage B proposal-only writer over this table. It still does not confirm
mappings, import packet context, record proof/evidence, bind sessions, start
Codex, approve, publish, retry, replay, or merge.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-proposal-db-schema-design
npm run smoke:ag-work-resume-mapping-proposal-record-design
npm run smoke:ag-work-resume-mapping-proposal-preview-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-preview-route
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-target-preview-cockpit-panel
npm run smoke:ag-work-resume-target-preview-route
npm run smoke:ag-work-resume-target-preview-helper
npm run smoke:ag-work-resume-target-preview
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
npm run smoke:codex-handoff-preflight
npm run smoke:chatgpt-work-contract-card
npm run smoke:current-runtime-codex-handoff-contract
npm run smoke:current-runtime-dogfood-readiness
git diff --check
node --check scripts/smoke-ag-work-resume-mapping-proposal-db-schema.mjs
```

Also run `db:reset` and `db:migrate` against an isolated temp DB path. Do not
run schema verification against the developer's real local DB.

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this DB/schema-only Stage B slice
```
