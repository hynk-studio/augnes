# AG Work Resume Mapping Proposal Record Read v0.1

## Purpose

This document records the read-only Stage B AG Resume mapping proposal record
reader. The slice adds a shared reader core, local helper, and route GET handler
for listing or fetching proposal records from `ag_work_resume_mapping_proposals`.

Proposal records remain review metadata only. Reading a proposal record is not
mapping confirmation, not import authorization, not proof/evidence
authorization, not session binding, not Codex execution authority, and not
merge/publish authority.

## Relationship To Existing Pieces

- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  records, confirmed mappings, imports, proof/evidence, session binding, and
  Codex continuation as separate stages.
- Stage B writer:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md` documents the
  only current proposal-record write behavior. This reader does not create,
  update, delete, expire, withdraw, reject, supersede, confirm, or import.
- DB/schema implementation:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
  documents the table this reader selects from.
- Stage B lifecycle actions design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`
  documents design-only future withdraw, reject, supersede, and expire
  semantics. This reader still performs no lifecycle mutation, confirmation,
  import, proof/evidence recording, session binding, or Codex execution.
- Stage A mapping proposal preview:
  the preview helper, preview route, and Cockpit panel remain proposal-preview
  surfaces. This reader adds no Cockpit UI and does not change preview behavior.
- Stage B Cockpit proposal record review:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md`
  documents the later read-only Cockpit panel over this route. The panel does
  not change the reader route and does not add write authority.

## Shared Reader Core

`lib/ag-work-resume-mapping-proposal-record-read.ts` exports
`readAgWorkResumeMappingProposalRecords`.

The shared reader core supports:

- fetch by `proposal_id`
- list by `foreign_scope` plus `foreign_work_id`
- list by `candidate_local_scope` plus `candidate_local_work_id`
- list by `status`
- bounded `limit` with deterministic default and max
- deterministic list ordering by `created_at DESC, proposal_id ASC`

The core parses JSON text fields into the same arrays and objects returned by
the writer record shape.

## Local Helper

`scripts/ag-work-resume-mapping-proposal-record-read.mjs` reads input from:

1. `AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--proposal-id <id>`
- `--foreign-scope <scope>`
- `--foreign-work-id <work_id>`
- `--candidate-local-scope <scope>`
- `--candidate-local-work-id <work_id>`
- `--status <status>`
- `--limit <n>`

The helper prints one JSON object to stdout and writes summaries to stderr. It
exits zero for successful fetch/list reads and non-zero for invalid input, not
found fetches, or DB errors.

## Route

`GET /api/ag-work-resume/mapping-proposal-records`

Query examples:

```text
/api/ag-work-resume/mapping-proposal-records?proposal_id=ag-resume-mapping-proposal:abc
/api/ag-work-resume/mapping-proposal-records?foreign_scope=project:source&foreign_work_id=AG-1
/api/ag-work-resume/mapping-proposal-records?candidate_local_scope=project:augnes&candidate_local_work_id=AG-2
/api/ag-work-resume/mapping-proposal-records?status=proposed&limit=20
```

The existing `POST /api/ag-work-resume/mapping-proposal-records` writer remains
the only proposal-record create route. This slice adds the `GET` read handler
only.

## Input Validation

- `proposal_id` fetch must not be combined with list filters or `limit`.
- `foreign_scope` and `foreign_work_id` must be supplied together.
- `candidate_local_scope` and `candidate_local_work_id` must be supplied
  together.
- `status` must be one of `proposed`, `needs_review`, `superseded`,
  `withdrawn`, `rejected`, or `expired`.
- `limit` must be a positive integer; values above the max are capped.
- At least one supported filter is required. There is no implicit list-all.
- Unknown helper input fields or route query parameters are rejected.
- Repeated route query parameters are rejected.

## Output Shape

Reader results include:

- `ok`
- `status`
- `record`
- `records`
- `filters`
- `limit`
- `warnings`
- `failures`
- `authority_boundary`
- `recommended_next_step`

The route wraps the reader result:

```json
{
  "ok": true,
  "route": "ag_work_resume_mapping_proposal_record_read.v0_1",
  "result": {},
  "recommended_next_step": "User/Core may review proposal records. This read route is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority."
}
```

The helper wraps the same reader result:

```json
{
  "ok": true,
  "helper": "ag_work_resume_mapping_proposal_record_read.v0_1",
  "input_mode": "flags",
  "result": {},
  "recommended_next_step": "User/Core may review proposal records. This is read-only review metadata, not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority."
}
```

## Status Codes And Exit Codes

Route status codes:

- 200: fetched or listed
- 400: invalid input
- 404: `proposal_id` not found
- 500: unexpected DB error

Helper exit codes:

- 0: fetched or listed
- non-zero: invalid input, not found, or DB error

## DB Behavior

- Reads only from `ag_work_resume_mapping_proposals`.
- Does not insert rows.
- Does not update rows.
- Does not delete rows.
- Does not expire, withdraw, reject, supersede, or confirm rows.
- Does not create confirmed mapping rows.
- Does not create import rows.
- Does not create work items or work events.
- Does not create proof/evidence rows.
- Does not bind sessions.
- Does not execute Codex.

## Authority Boundary

- Read-only.
- Proposal review metadata only.
- Not confirmed mapping.
- Not import.
- Not proof/evidence.
- Not session binding.
- Not Codex execution.
- Not approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Original Reader Slice Non-Goals

- The original reader/helper/route slice added no Cockpit UI. A later
  read-only Cockpit panel is documented separately in
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md`.
- No ChatGPT App card.
- No MCP/App tool schema change.
- No bridge tool.
- No confirmed mapping.
- No import record.
- No imported resume context.
- No work item.
- No work event.
- No proof/evidence/session behavior.
- No Direct Resume Code.
- No relay.
- No localStorage, sessionStorage, indexedDB, telemetry, or analytics.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-proposal-record-design
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-mapping-proposal-preview
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview-route
npm run smoke:ag-work-resume-packet-preflight
git diff --check
node --check scripts/ag-work-resume-mapping-proposal-record-read.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs
```

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this Stage B read route/helper slice
```
