# AG Work Resume Confirmed Mapping Read v0.1

## Purpose

This document records the read-only Stage C AG Resume confirmed mapping reader
core, local helper, and GET route for `ag_work_resume_confirmed_mappings`.

Confirmed mapping reads expose mapping identity metadata only: one foreign work
identity associated with one existing local work identity after prior
user/Core confirmation. Reads are not import, not imported resume context, not
proof/evidence, not session binding, not Codex execution authority, and not
approval, publish, retry, replay, or merge authority.

This helper/route slice added no Cockpit UI, no schema/migration, no lifecycle
mutation, no writer behavior change, no ChatGPT App/MCP/App schema, no bridge
tool, no Direct Resume Code, no relay, and no telemetry/analytics/browser
persistence. The separately scoped Cockpit read panel is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md`.

## Relationship To Existing Pieces

- Stage C record design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`.
- Stage C DB/schema implementation:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
- Stage C writer/helper:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`.
- Stage C create route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`.
- Stage C Cockpit read panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md` documents
  the read-only Operator panel that calls only this `GET` route.
- Stage C Cockpit create panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md`
  documents the separately scoped Operator panel that calls only the existing
  `POST` create route and does not call this `GET` read route.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`.

## Shared Reader Core

`lib/ag-work-resume-confirmed-mapping-read.ts` exports
`readAgWorkResumeConfirmedMappings`.

The core reads only from `ag_work_resume_confirmed_mappings`. It does not join
to proposal, work, proof/evidence, session, import, or Codex tables. It does not insert rows.
It does not update rows. It does not delete rows. It does not drop tables. It
does not create lifecycle actions, create work items, create work events,
record proof/evidence, bind sessions, execute Codex, call network, call
OpenAI, use GitHub tokens, or use browser persistence.

## Read Filters

Supported filters:

- `mapping_id`: fetch one mapping.
- `foreign_scope` plus `foreign_work_id`: list mappings for one foreign work
  identity.
- `local_scope` plus `local_work_id`: list mappings for one local work
  identity.
- `source_proposal_id`: list mappings derived from one Stage B proposal.
- `packet_id` plus `packet_hash`: list mappings for one source packet
  identity.
- `status`: list mappings by `active`, `superseded`, `withdrawn`, or
  `revoked`.
- `limit`: bounded list limit only.

Validation rules:

- Unknown input fields are rejected.
- `mapping_id` fetch must not combine with list filters or `limit`.
- `foreign_scope` and `foreign_work_id` must be supplied together.
- `local_scope` and `local_work_id` must be supplied together.
- `packet_id` and `packet_hash` must be supplied together.
- At least one supported read filter is required; there is no implicit
  list-all.
- `limit` must be a positive integer. The default is 20 and the maximum is
  100.
- List reads order by `created_at DESC, mapping_id ASC`.
- `authority_boundary` JSON text is parsed into a bounded object on returned
  records.

## Local Helper

`scripts/ag-work-resume-confirmed-mapping-read.mjs` reads input in this
priority order:

1. `AG_WORK_RESUME_CONFIRMED_MAPPING_READ_INPUT`
2. `--file <path>`
3. flags
4. stdin

Flags:

- `--json`
- `--help`
- `--file <path>`
- `--mapping-id <id>`
- `--foreign-scope <scope>`
- `--foreign-work-id <id>`
- `--local-scope <scope>`
- `--local-work-id <id>`
- `--source-proposal-id <id>`
- `--packet-id <id>`
- `--packet-hash <hash>`
- `--status <active|superseded|withdrawn|revoked>`
- `--limit <n>`

The helper prints one JSON object to stdout. It exits zero only for `fetched`
or `listed` results and exits non-zero for `invalid_input`, `not_found`, and
`db_error`.

## Route

`GET /api/ag-work-resume/confirmed-mappings`

The GET route accepts query parameters only. It rejects repeated query
parameters, unknown query parameters, invalid filter combinations, and request bodies.
It delegates to `readAgWorkResumeConfirmedMappings`.

Status mapping:

- `fetched` -> HTTP 200
- `listed` -> HTTP 200
- `invalid_input` -> HTTP 400
- `not_found` -> HTTP 404
- `db_error` -> HTTP 500

The existing `POST /api/ag-work-resume/confirmed-mappings` create route remains
the Stage C create route documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`; this read slice does
not change POST creation semantics.

## Result Shape

The core returns:

```json
{
  "ok": true,
  "status": "fetched",
  "record": {},
  "records": [],
  "filters": {},
  "limit": null,
  "warnings": [],
  "failures": [],
  "authority_boundary": {},
  "recommended_next_step": "User/Core may review confirmed mapping identity metadata."
}
```

Result statuses:

- `fetched`
- `listed`
- `invalid_input`
- `not_found`
- `db_error`

## Authority Boundary

The read authority boundary includes:

- `read_only: true`
- `mapping_identity_metadata_only: true`
- `confirmed_mapping_created: false`
- `confirmed_mapping_updated: false`
- `confirmed_mapping_deleted: false`
- `import_record_created: false`
- `imported_context_created: false`
- `work_item_created: false`
- `work_event_created: false`
- `proof_recorded: false`
- `evidence_recorded: false`
- `session_bound: false`
- `codex_executed: false`
- `approval_granted: false`
- `publish_retry_replay_authority: false`
- `merge_authority: false`
- `durable_approval: user/Core gated`

Statement: reads are mapping identity metadata only and not
import/proof/evidence/session/Codex/merge authority.

## Non-Goals

- No writer changes.
- No POST behavior change.
- No lifecycle mutation.
- No Cockpit UI.
- No schema or migration.
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

- Not proof/evidence.
- Not session binding.
- Not Codex execution.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this confirmed mapping read helper/route slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-read
npm run smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-db-schema
npm run smoke:ag-work-resume-confirmed-mapping-db-schema-design
npm run smoke:ag-work-resume-confirmed-mapping-record-design
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-confirmed-mapping-read.mjs
node --check scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs
```
