# AG Work Resume Confirmed Mapping Writer v0.1

## Purpose

This document records the first Stage C AG Resume confirmed mapping
writer/helper. The writer creates only confirmed mapping identity association
rows in `ag_work_resume_confirmed_mappings` from an active Stage B mapping
proposal and an existing local work item.

Confirmed mapping means one foreign work identity is explicitly associated
with one existing local work identity after user/Core confirmation. It is not
import, not imported resume context, not proof/evidence, not session binding,
not Codex execution authority, and not approval, publish, retry, replay, or
merge authority.

## Relationship To Stage C Design/Schema Implementation

- Stage C record design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md` defines the
  confirmed mapping record semantics and authority boundary.
- Stage C DB/schema design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md` defines
  the table and index contract.
- Stage C DB/schema implementation:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
  adds the table and indexes only.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps confirmed
  mapping, import, proof/evidence, session binding, and Codex continuation as
  separate user/Core-gated stages.
- Stage C route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md` documents the JSON
  route over this shared writer core. The route delegates to the core and
  still adds no Cockpit UI, schema/migration, import, proof/evidence, session
  binding, Codex execution, approval, publish, retry, replay, or merge
  authority.

This writer is the first write boundary for confirmed mapping rows. It adds no
route/UI and no schema/migration.

## Core API

`lib/ag-work-resume-confirmed-mapping.ts` exports
`createAgWorkResumeConfirmedMapping`.

The core API:

- rejects unknown fields
- requires `source_proposal_id`
- requires `confirmed_by`
- requires `confirmation_reason`
- accepts optional `confirmed_at`
- derives omitted foreign/local/packet fields from the source proposal row
- validates any supplied foreign/local/packet fields match the source proposal
- validates the source proposal exists
- validates the source proposal status is `proposed` or `needs_review`
- validates local work exists in `work_items`
- rejects duplicate active mappings for the same `foreign_scope` +
  `foreign_work_id`
- uses a DB transaction
- computes a deterministic `mapping_id` from canonical input material
- inserts exactly one `active` row into `ag_work_resume_confirmed_mappings` on
  success
- returns the inserted record, source proposal, warnings, failures,
  authority boundary, and recommended next step

## Helper Usage

`scripts/ag-work-resume-confirmed-mapping-create.mjs` reads input from:

1. `AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_INPUT`
2. `--file <path>`
3. flags
4. stdin

Flags:

- `--json`
- `--help`
- `--file <path>`
- `--source-proposal-id <id>`
- `--foreign-scope <scope>`
- `--foreign-work-id <id>`
- `--local-scope <scope>`
- `--local-work-id <id>`
- `--packet-id <id>`
- `--packet-hash <hash>`
- `--source-runtime-instance-id <id>`
- `--confirmed-by <actor>`
- `--confirmation-reason <reason>`
- `--confirmed-at <iso>`

The helper prints one JSON object to stdout, writes pass/fail summaries to
stderr, and exits zero only when a confirmed mapping row is created. It never
calls a route, network, browser, GitHub, OpenAI, proof/evidence helper,
session helper, work/import helper, or Codex execution path.

## Validation Rules

- Unknown fields are rejected.
- `source_proposal_id` is required.
- `confirmed_by` is required.
- `confirmation_reason` is required.
- `confirmed_at` is optional; when supplied it must be an ISO UTC timestamp
  with millisecond precision.
- Internal `now` injection is accepted by the core for deterministic tests and
  must also be an ISO UTC timestamp with millisecond precision.
- If `confirmed_at` is omitted, the writer uses `now` when supplied or
  `new Date().toISOString()`.
- The source proposal row must exist in
  `ag_work_resume_mapping_proposals`.
- The source proposal status must be `proposed` or `needs_review`.
- Supplied `foreign_scope`, `foreign_work_id`, `local_scope`, `local_work_id`,
  `packet_id`, `packet_hash`, and `source_runtime_instance_id` must match the
  source proposal row.
- Omitted fields are derived from the source proposal row.

## DB Behavior

- Inserts only into `ag_work_resume_confirmed_mappings`.
- Inserts exactly one row on success.
- Uses a DB transaction.
- Does not mutate the source proposal row.
- Does not create proposal rows.
- Does not create work items.
- Does not create work events.
- Does not create import or imported-context rows.
- Does not create proof/evidence rows.
- Does not create or bind sessions.

The writer creates only confirmed mapping identity association rows.

## Local Work Existence Validation

The writer validates that `work_items(scope, work_id)` contains the proposed
local work identity before inserting a confirmed mapping row. The writer does
not create work items and does not repair missing local work. Missing local
work returns `local_work_not_found` with no confirmed mapping row.

## Proposal Match Validation

The writer treats the Stage B proposal row as the reviewed source metadata.
If a caller supplies foreign identity, local identity, packet identity, packet
hash, or source runtime instance fields, those fields must match the source
proposal row exactly. Mismatches return `proposal_mismatch` with no confirmed
mapping row.

The writer does not update proposal rows. Proposal lifecycle, review metadata,
and any future proposal closeout remain separately scoped.

## Duplicate Active Mapping Policy

There may be only one active confirmed mapping per `foreign_scope` +
`foreign_work_id`. The writer checks for an existing active row before insert
and also maps DB unique-constraint failures to `duplicate_active_mapping`.

Supersession, withdrawal, and revocation are future lifecycle work and are not
implemented by this writer/helper slice.

## Output Shape

The core returns:

```json
{
  "ok": true,
  "status": "created",
  "mapping_id": "ag-resume-confirmed-mapping:...",
  "record": {},
  "source_proposal": {},
  "warnings": [],
  "failures": [],
  "authority_boundary": {},
  "recommended_next_step": "User/Core may review the confirmed mapping identity association."
}
```

Failure statuses are:

- `invalid_input`
- `proposal_not_found`
- `proposal_not_active`
- `local_work_not_found`
- `proposal_mismatch`
- `duplicate_active_mapping`
- `db_error`

## Authority Boundary

On success, `confirmed_mapping_created` is true. All downstream authority flags
remain false:

- `proposal_record_created`
- `proposal_record_updated`
- `proposal_record_deleted`
- `import_record_created`
- `imported_context_created`
- `work_item_created`
- `work_event_created`
- `proof_recorded`
- `evidence_recorded`
- `session_bound`
- `codex_executed`
- `approval_granted`
- `publish_retry_replay_authority`
- `merge_authority`

`durable_approval` remains `user/Core gated`.

Confirmed mapping creation is only a foreign/local identity association and
not import/proof/evidence/session/Codex/merge authority.

## Non-Goals

- No route.
- No Cockpit UI.
- No schema or migration.
- No proposal row creation.
- No proposal row update.
- No import record.
- No imported resume context.
- No work item creation.
- No work event creation.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No ChatGPT App card.
- No MCP/App schema change.
- No bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, or external posting.

Explicit statements:

- writer creates only confirmed mapping identity association rows.
- writer does not import context.
- writer does not create work items.
- writer does not update proposal rows.
- writer does not record proof/evidence.
- writer does not bind sessions.
- writer does not execute Codex.
- writer adds no route/UI.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this confirmed mapping writer/helper slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-db-schema
npm run smoke:ag-work-resume-confirmed-mapping-db-schema-design
npm run smoke:ag-work-resume-confirmed-mapping-record-design
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-confirmed-mapping-create.mjs
node --check scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs
```
