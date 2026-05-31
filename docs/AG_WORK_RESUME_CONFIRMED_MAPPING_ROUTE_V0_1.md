# AG Work Resume Confirmed Mapping Route v0.1

## Purpose

This document records the JSON route over the Stage C AG Resume confirmed
mapping writer. The route creates confirmed mapping identity association rows
only by delegating to the shared `createAgWorkResumeConfirmedMapping` core.

Confirmed mapping remains one foreign work identity associated with one
existing local work identity after explicit user/Core confirmation. It is not
import, not imported resume context, not proof/evidence, not session binding,
not Codex execution authority, and not approval, publish, retry, replay, or
merge authority.

## Relationship To Existing Pieces

- Stage C record design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`.
- Stage C DB/schema design:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md`.
- Stage C DB/schema implementation:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
- Stage C writer/helper:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`.
- Stage C read helper/route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md` documents read-only
  confirmed mapping identity metadata access over this same route path.
- Stage C Cockpit read panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md` documents
  the separately scoped Operator panel that calls only the `GET` side of this
  route path.
- Stage C Cockpit create panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md`
  documents the separately scoped Operator panel that calls only this existing
  `POST` route path and adds no route implementation behavior.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`.

This route adds no Cockpit UI and no schema/migration.

## Route

`POST /api/ag-work-resume/confirmed-mappings`

The route is JSON-only and requires `content-type: application/json`.

Accepted body fields:

- `source_proposal_id`
- `foreign_scope`
- `foreign_work_id`
- `local_scope`
- `local_work_id`
- `packet_id`
- `packet_hash`
- `source_runtime_instance_id`
- `confirmed_by`
- `confirmation_reason`
- `confirmed_at`

The route rejects unknown fields, including `db` and `now`. Those fields are
not accepted from HTTP bodies.

## Route Behavior

The route:

- rejects wrong content types
- rejects invalid JSON
- rejects non-object JSON
- rejects unsupported body fields
- delegates validation and insert behavior to
  `createAgWorkResumeConfirmedMapping`
- returns route id, result, authority boundary, and recommended next step
- creates exactly one confirmed mapping row when the shared core returns
  `created`

The route creates confirmed mapping identity association rows only.

## Read Route Pairing

`GET /api/ag-work-resume/confirmed-mappings` is separately documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md`. The GET handler reads
confirmed mapping identity metadata only and does not change POST creation
behavior, create/update/delete confirmed mappings, import context, record
proof/evidence, bind sessions, execute Codex, or grant approval, publish,
retry, replay, or merge authority.

## Status Mapping

- `created` -> HTTP 201
- `invalid_input` -> HTTP 400
- `proposal_not_found` -> HTTP 404
- `proposal_not_active` -> HTTP 409
- `local_work_not_found` -> HTTP 404
- `proposal_mismatch` -> HTTP 409
- `duplicate_active_mapping` -> HTTP 409
- `db_error` -> HTTP 500

## Authority Boundary

The route returns the shared writer authority boundary. On success,
`confirmed_mapping_created` is true. All downstream authority flags remain
false:

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

Durable approval remains `user/Core gated`.

## Non-Goals

- No Cockpit UI.
- No schema or migration.
- No import record.
- No imported resume context.
- No work item creation.
- No work event creation.
- No proposal row update.
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

- route creates confirmed mapping identity association rows only.
- route does not import context.
- route does not create work items.
- route does not update proposal rows.
- route does not record proof/evidence.
- route does not bind sessions.
- route does not execute Codex.
- route adds no UI.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this confirmed mapping route slice

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
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs
```
