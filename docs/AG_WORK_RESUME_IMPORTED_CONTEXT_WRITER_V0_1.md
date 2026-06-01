# AG Work Resume Imported Context Writer v0.1

## Purpose

This document records the Stage D AG Resume imported context writer/helper
slice. The writer creates only imported context review metadata rows in
`ag_work_resume_imported_contexts` from an existing active confirmed mapping
and supplied public-safe packet context.

Imported context remains bounded review metadata. It is not proof/evidence,
not session binding, not Codex execution or continuation, not committed state
authority, and not approval, publish, retry, replay, or merge authority.

This writer/helper slice originally added no route, no read route, and no
Cockpit UI. The later read helper/GET route is documented separately in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`; it reads existing
imported context review metadata only and changes no writer behavior.

## Relationship To Stage D Design And Schema

This writer follows:

- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md`

The schema foundation already defines `ag_work_resume_imported_contexts`,
including `created_by` and `import_reason`. This writer validates the active
confirmed mapping, packet identity, redaction report, actor, and reason before
creating a single `review_metadata` row.

The separately gated create route is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`. It delegates to this
writer core and grants no UI, read route, proof/evidence, session, Codex, work
item/event, confirmed mapping/proposal mutation, approval, publish, retry,
replay, or merge authority.

The separately gated read helper/GET route is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`. It reads only
`ag_work_resume_imported_contexts`, preserves the existing POST create route,
and grants no imported context creation, update, delete, lifecycle mutation,
proof/evidence, session, Codex, work item/event, confirmed mapping/proposal
mutation, approval, publish, retry, replay, or merge authority.

The later read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`. It calls
only the imported context GET route and does not change this writer/helper,
the POST create route, schema, proof/evidence, session, Codex, work,
confirmed mapping/proposal, approval, publish, retry, replay, or merge
behavior.

The later bounded POST create Cockpit panel is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md`. It calls
only the existing imported contexts POST route with supported JSON fields and
does not change this writer/helper core, schema, read route behavior,
proof/evidence, session, Codex, work, confirmed mapping/proposal, approval,
publish, retry, replay, or merge behavior.

The future proof/evidence/session/Codex gate contract is design-only in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`.
It defines separate future gates and does not change this writer/helper or
authorize proof/evidence recording, session binding, Codex continuation,
approval, publish, retry, replay, or merge.

The proof/evidence reconciliation design in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md` keeps
foreign refs as review-only reconciliation candidates until separately
authorized and does not change this writer/helper.
The candidate DB/schema design in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
adds no schema implementation, migration, runtime behavior, writer/helper
behavior, proof/evidence recording, session binding, Codex behavior, approval,
publish, retry, replay, or merge authority.
The candidate DB/schema implementation in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
creates only a future candidate table and indexes; it adds no imported context
writer/helper behavior, proof/evidence recording, session binding, Codex
behavior, approval, publish, retry, replay, or merge authority.
The candidate writer/helper in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`
creates candidate review metadata only from existing imported context rows and
bounded foreign ref summaries. It does not change this imported context
writer/helper, record proof/evidence, bind sessions, execute Codex, create
work items/events, mutate imported contexts, confirmed mappings, or proposals,
add routes/UI, or grant approval, publish, retry, replay, or merge authority.
The candidate create route in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`
delegates to the candidate writer core and creates reconciliation candidate
review metadata rows only. It does not change this imported context
writer/helper, add Cockpit UI, record proof/evidence, bind sessions, execute
Codex, create work items/events, mutate imported contexts, confirmed mappings,
or proposals, or grant approval, publish, retry, replay, or merge authority.
The candidate read helper/GET route in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`
reads reconciliation candidate review metadata only. It does not change this
imported context writer/helper, record proof/evidence, bind sessions, execute
Codex, create work items/events, mutate imported contexts, confirmed mappings,
or proposals, or grant approval, publish, retry, replay, or merge authority.
The candidate lifecycle action contract in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
updates existing candidate review metadata only. It does not change this
imported context writer/helper, mutate imported contexts, record
proof/evidence, bind sessions, execute Codex, create work items/events, or
grant approval, publish, retry, replay, or merge authority.

## Core API

Core module:

```ts
import { createAgWorkResumeImportedContext } from "@/lib/ag-work-resume-imported-context";
```

Input shape:

```ts
{
  mapping_id: unknown,
  packet_id: unknown,
  packet_hash: unknown,
  source_runtime_instance_id?: unknown,
  foreign_scope?: unknown,
  foreign_work_id?: unknown,
  local_scope?: unknown,
  local_work_id?: unknown,
  imported_summary: unknown,
  imported_expected_files?: unknown,
  imported_expected_checks?: unknown,
  foreign_refs_summary?: unknown,
  redaction_report: unknown,
  created_by: unknown,
  import_reason: unknown,
  created_at?: unknown,
  db?: Database.Database,
  now?: string
}
```

## Helper Usage

Helper command:

```bash
npm run ag:resume-imported-context-create -- --json --file input.json
```

Input priority:

1. `AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--mapping-id <id>`
- `--packet-id <id>`
- `--packet-hash <hash>`
- `--source-runtime-instance-id <id>`
- `--foreign-scope <scope>`
- `--foreign-work-id <id>`
- `--local-scope <scope>`
- `--local-work-id <id>`
- `--imported-summary <summary>`
- `--imported-expected-files-json <json-array>`
- `--imported-expected-checks-json <json-array>`
- `--foreign-refs-summary-json <json-object>`
- `--redaction-report-json <json-object>`
- `--created-by <actor>`
- `--import-reason <reason>`
- `--created-at <iso>`

The helper prints one JSON object to stdout and exits 0 only when the imported
context row is created. Invalid input and fail-closed statuses exit non-zero.

## Validation Rules

- Reject unknown fields.
- `mapping_id`, `packet_id`, and `packet_hash` are required non-empty strings.
- `imported_summary` is required and bounded.
- `created_by` is required and non-empty.
- `import_reason` is required and bounded; it records why user/Core created or
  imported this bounded review metadata.
- `created_at` and internal `now` must be ISO UTC timestamps with millisecond
  precision when supplied.
- `imported_expected_files` defaults to `[]` and must be an array of strings.
- `imported_expected_checks` defaults to `[]` and must be an array of strings.
- `foreign_refs_summary` defaults to `{}` and must be a bounded object.
- `redaction_report` is required.

## DB Behavior

The writer uses a DB transaction and inserts exactly one row on success:

- `record_kind = ag_work_resume_imported_context`
- `schema = augnes.ag_work_resume_imported_context.v0_1`
- `status = review_metadata`
- identity fields copied from the active confirmed mapping
- packet identity validated against the confirmed mapping
- JSON text fields persisted after validation
- `authority_boundary` records this as review metadata only

The writer does not mutate confirmed mapping rows. The writer does not mutate
proposal rows. The writer does not create work items or work events.
The writer does not record proof/evidence. The writer does not bind sessions.
The writer does not execute Codex. The writer adds no route/UI.

## Active Confirmed Mapping Validation

The writer loads `ag_work_resume_confirmed_mappings` by `mapping_id`.

- Missing mapping returns `mapping_not_found`.
- Non-active mapping returns `mapping_not_active`.
- Supplied `foreign_scope`, `foreign_work_id`, `local_scope`, `local_work_id`,
  `packet_id`, `packet_hash`, and `source_runtime_instance_id` must match the
  active confirmed mapping when supplied.
- Omitted foreign/local fields are derived from the active confirmed mapping.

## Redaction Validation

The writer rejects imported context creation unless `redaction_report` states:

- `secrets_included === false`
- `raw_db_paths_included === false`
- `session_payloads_included === false`
- `proof_payloads_included === false`

Redaction failures return `redaction_blocked`.

## Output Shape

Result shape:

```ts
{
  ok,
  status,
  import_id,
  record,
  source_mapping,
  warnings,
  failures,
  authority_boundary,
  recommended_next_step
}
```

Statuses:

- `created`
- `invalid_input`
- `mapping_not_found`
- `mapping_not_active`
- `mapping_mismatch`
- `redaction_blocked`
- `db_error`

## Authority Boundary

The authority boundary states:

- `imported_context_created: true` only on success.
- `review_metadata_only: true`.
- `confirmed_mapping_required: true`.
- `confirmed_mapping_updated: false`.
- `proposal_record_updated: false`.
- `work_item_created: false`.
- `work_event_created: false`.
- `proof_recorded: false`.
- `evidence_recorded: false`.
- `session_bound: false`.
- `codex_executed: false`.
- `approval_granted: false`.
- `publish_retry_replay_authority: false`.
- `merge_authority: false`.
- `durable_approval: user/Core gated`.

Statement: imported context is bounded review metadata only and not
proof/evidence/session/Codex/merge authority.

## Non-Goals

- No route.
- Read helper/GET route is separately documented in
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md` and changes no writer
  behavior.
- No Cockpit UI in this writer/helper slice. Read and bounded create Cockpit
  panels are separately documented in
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md` and
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md`.
- No app changes.
- No components changes.
- No migrations.
- No schema changes in this writer/helper slice.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this imported context writer/helper slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-imported-context-db-schema-design
npm run smoke:ag-work-resume-imported-context-record-design
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-imported-context-create.mjs
node --check scripts/smoke-ag-work-resume-imported-context-writer.mjs
```
