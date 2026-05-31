# AG Work Resume Mapping Proposal Lifecycle Action Helper v0.1

## Purpose

This document records the first Stage B AG Resume mapping proposal lifecycle
action core and local helper for existing proposal records.

The helper updates existing proposal lifecycle and review metadata only in
`ag_work_resume_mapping_proposals`. It supports explicit `withdraw`, `reject`,
`supersede`, and `expire` actions on active proposal records. A lifecycle
update is not mapping confirmation, not import authorization, not
proof/evidence authorization, not session binding, not Codex execution
authority, and not merge/publish authority.

This helper does not confirm mappings, does not import context, does not record
proof/evidence, does not bind sessions, and does not execute Codex.

This slice adds no app/api route, no Cockpit UI, no DB schema, no migration,
no proposal creation, no replacement proposal creation, no confirmed mapping,
no import, no proof/evidence recording, no session binding, and no Codex
execution or continuation.

## Relationship To PR #303 Lifecycle Design

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`
defines the design-only lifecycle contract for `withdraw`, `reject`,
`supersede`, and `expire`. This helper is the next bounded implementation
slice over that design.

The helper implements only the existing-row lifecycle update. It does not
create replacement proposal rows. It does not update replacement proposal rows.
It does not implement same-tuple transactional replacement creation or
bidirectional supersession repair. Those remain future separately gated work.

## Route Surface

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md`
documents the JSON route over this shared core. The route delegates to
`applyAgWorkResumeMappingProposalLifecycleAction` and adds no Cockpit UI, DB
schema, migration, proposal creation, replacement proposal creation, confirmed
mapping, import, proof/evidence, session, Codex, approval, publish, retry,
replay, or merge authority.

## Cockpit Surface

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
documents the later bounded Cockpit Operator panel over the existing route.
That panel does not change this helper contract, create proposal rows, create
replacement proposal rows, confirm mappings, import context, record
proof/evidence, bind sessions, execute Codex, approve, publish, retry, replay,
or merge.

## Core API

`lib/ag-work-resume-mapping-proposal-lifecycle-action.ts` exports
`applyAgWorkResumeMappingProposalLifecycleAction`.

Input shape:

```ts
{
  proposal_id: unknown;
  action: unknown;
  reviewed_by: unknown;
  review_note: unknown;
  reviewed_at?: unknown;
  replacement_proposal_id?: unknown;
  superseded_by_proposal_id?: unknown;
  db?: Database.Database;
  now?: string;
}
```

The core:

- rejects unknown fields
- requires `proposal_id`
- requires `action` to be `withdraw`, `reject`, `supersede`, or `expire`
- requires `reviewed_by`
- requires `review_note`
- requires `reviewed_at` and `now`, when supplied, to be ISO UTC timestamps
  with millisecond precision
- uses `now` when `reviewed_at` is omitted and `now` is supplied
- uses `new Date().toISOString()` only when both `reviewed_at` and `now` are
  omitted
- allows replacement ids only for `supersede`
- requires matching replacement ids if both `replacement_proposal_id` and
  `superseded_by_proposal_id` are supplied
- rejects a replacement id equal to `proposal_id`
- requires supplied replacement proposal rows to already exist
- uses a single DB transaction
- returns the parsed proposal record shape using the existing proposal row
  parser

## Helper Usage

`scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs` reads input in
this priority order:

1. `AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--proposal-id <id>`
- `--action <withdraw|reject|supersede|expire>`
- `--reviewed-by <actor>`
- `--review-note <note>`
- `--reviewed-at <iso>`
- `--replacement-proposal-id <id>`
- `--superseded-by-proposal-id <id>`

The helper prints one JSON object to stdout and writes pass/fail summaries to
stderr. It exits zero only when the lifecycle update succeeds.

## Input Examples

Withdraw an active proposal:

```json
{
  "proposal_id": "ag-resume-mapping-proposal:example",
  "action": "withdraw",
  "reviewed_by": "user-core:reviewer",
  "review_note": "Withdrawn from active consideration.",
  "reviewed_at": "2026-05-31T00:00:00.000Z"
}
```

Supersede an active proposal and link an existing replacement proposal:

```json
{
  "proposal_id": "ag-resume-mapping-proposal:old",
  "action": "supersede",
  "reviewed_by": "user-core:reviewer",
  "review_note": "A later proposal is now current.",
  "reviewed_at": "2026-05-31T00:00:00.000Z",
  "replacement_proposal_id": "ag-resume-mapping-proposal:new"
}
```

## Output Shape

Results include:

- `ok`
- `status`
- `action`
- `proposal_id`
- `before_record`
- `record`
- `updated_fields`
- `warnings`
- `failures`
- `authority_boundary`
- `recommended_next_step`

The `authority_boundary` sets `proposal_lifecycle_updated: true` only on a
successful update. It always keeps proposal creation/deletion, confirmed
mapping, import, imported context, work item/event creation, proof/evidence,
session binding, Codex execution, approval, publish/retry/replay, and merge
authority false.

## Status And Exit Codes

Core statuses:

- `updated`: lifecycle review metadata was updated
- `invalid_input`: input failed validation; no write
- `not_found`: target proposal was not found; no write
- `not_active`: target proposal was already terminal or inactive; no write
- `replacement_not_found`: supersede replacement id was not found; no write
- `db_error`: DB failure; stop and inspect before retry

Helper exit codes:

- `0`: lifecycle update succeeded
- non-zero: invalid input, not found, inactive proposal, replacement missing,
  DB error, invalid JSON, or invalid CLI usage

## Validation Rules

- Unknown fields are rejected.
- `proposal_id` must be a non-empty string.
- `action` must be `withdraw`, `reject`, `supersede`, or `expire`.
- `reviewed_by` must be a non-empty string.
- `review_note` must be a non-empty string.
- `reviewed_at` may be omitted; if supplied, it must be ISO UTC with
  millisecond precision.
- `now`, if supplied, must be ISO UTC with millisecond precision.
- `replacement_proposal_id` and `superseded_by_proposal_id` are allowed only
  for `supersede`.
- If both replacement id fields are supplied, they must match after trimming.
- A supersede replacement id must not equal the target `proposal_id`.
- A supplied replacement proposal id must already exist.
- `expire` is explicit action only. The helper does not infer expiration from
  `expires_at`.

## DB Behavior

- Opens the DB with `openDatabase` unless a DB is injected.
- Uses a single transaction.
- Selects the target proposal row by `proposal_id`.
- Operates only on active proposal statuses: `proposed` and `needs_review`.
- Updates only the target proposal row.
- Updates only `status`, `reviewed_by`, `reviewed_at`, `review_note`, and
  `updated_at`.
- Updates `superseded_by_proposal_id` only for `supersede` when a replacement
  id is supplied.
- Does not update foreign work fields.
- Does not update candidate work fields.
- Does not update packet hash fields.
- Does not update proposal preview hash fields.
- Does not update comparison, gap, conflict, or question summaries.
- Does not update the stored row `authority_boundary` JSON.
- Does not insert rows.
- Does not delete rows.
- Does not update any other table.

## Supersede Limitations

This first lifecycle helper slice can mark the target proposal `superseded`.
When an existing replacement proposal id is supplied, it writes that id to the
target row only.

It does not create replacement proposal rows. It does not update replacement
proposal rows. It does not implement same-tuple transactional replacement
creation. It does not repair bidirectional links. Future same-tuple
supersede-with-replacement creation remains separately gated because the
active-proposal partial unique index blocks duplicate active proposals for the
same foreign/candidate tuple.

## Authority Boundary

- Existing proposal lifecycle/review metadata update only.
- Not proposal creation.
- Not replacement proposal creation.
- Not confirmed mapping.
- Not import.
- Not imported context.
- Not work item or work event creation.
- Does not record proof/evidence.
- Not proof/evidence recording.
- Not proof/evidence authorization.
- Not session binding.
- Not Codex execution or continuation.
- Not ChatGPT App cards.
- Not MCP/App schema changes.
- Not bridge tools.
- Not Direct Resume Code.
- Not relay.
- Not telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- Not approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

- No app/api route.
- No Cockpit UI.
- No DB schema or migration.
- No proposal creation.
- No replacement proposal creation.
- No replacement proposal row update.
- No same-tuple transactional replacement creation.
- No confirmed mapping design or implementation.
- No import design or implementation.
- No proof/evidence/session reconciliation.
- No Codex execution behavior.
- No ChatGPT App, MCP/App schema, or bridge behavior.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, or browser persistence.

## Stage C Design Pointer

This helper slice itself added no confirmed mapping design or implementation.
The separate Stage C confirmed mapping record design is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`; it is
design-only and adds no schema, migration, writer, helper, route, UI, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-actions-design
npm run smoke:ag-work-resume-mapping-proposal-record-read-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-proposal-record-design
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs
```

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this lifecycle core/helper slice
