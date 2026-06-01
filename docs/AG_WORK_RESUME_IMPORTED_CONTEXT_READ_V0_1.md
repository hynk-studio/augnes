# AG Work Resume Imported Context Read v0.1

## Purpose

This document records the Stage D AG Resume imported context read helper and
GET route. The reader lists or fetches rows from
`ag_work_resume_imported_contexts` as read-only imported context review
metadata.

Reads are read-only imported context review metadata only. They are not
proof/evidence, not session binding, not Codex execution or continuation, not
work item/event creation, not confirmed mapping/proposal mutation, and not
approval, publish, retry, replay, or merge authority.

No Cockpit UI, schema, migration, lifecycle mutation, proof/evidence
recording, session binding, Codex execution, Direct Resume Code, relay,
browser report, ChatGPT App/MCP/App schema, or bridge tool was added by this
read helper/route slice. The later read-only Cockpit panel is documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`; it uses
the GET route only and preserves existing POST create behavior.
The later bounded POST create Cockpit panel is documented separately in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md`; it does
not change this read helper/GET route.

## Relationship To Writer Route Schema And Design

This read slice follows:

- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`

The writer creates bounded imported context review metadata from an active
confirmed mapping. The existing POST route delegates creation to that writer.
This read helper/route only reads imported context rows already present in
`ag_work_resume_imported_contexts`; it does not join proposal, confirmed
mapping, work, proof/evidence, session, or Codex tables.

The future proof/evidence/session/Codex gate contract is design-only in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`.
It does not change this read helper/GET route and does not authorize
proof/evidence recording, session binding, Codex continuation, approval,
publish, retry, replay, or merge.

The proof/evidence reconciliation design is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`. It keeps
foreign refs foreign until explicitly reconciled and does not change this
read helper/GET route.

## Read Filters

Supported read filters:

- `import_id`: fetch one imported context.
- `mapping_id`
- `foreign_scope` plus `foreign_work_id`
- `local_scope` plus `local_work_id`
- `packet_id` plus `packet_hash`
- `status`
- `created_by`
- `limit` for list reads only

List reads order records by `created_at DESC, import_id ASC`.

## Validation Rules

- At least one supported read filter is required; there is no implicit
  list-all.
- `import_id` fetch must not combine with list filters or `limit`.
- `foreign_scope` and `foreign_work_id` must be supplied together.
- `local_scope` and `local_work_id` must be supplied together.
- `packet_id` and `packet_hash` must be supplied together.
- `limit` must be a positive integer.
- Default `limit` is `20`.
- Maximum `limit` is `100`; larger values are capped to `100`.
- `status` must be one of `review_metadata`, `superseded`, `withdrawn`, or
  `revoked`.

## Core API

Core module:

```ts
import { readAgWorkResumeImportedContexts } from "@/lib/ag-work-resume-imported-context-read";
```

Input shape:

```ts
{
  import_id?: unknown,
  mapping_id?: unknown,
  foreign_scope?: unknown,
  foreign_work_id?: unknown,
  local_scope?: unknown,
  local_work_id?: unknown,
  packet_id?: unknown,
  packet_hash?: unknown,
  status?: unknown,
  created_by?: unknown,
  limit?: unknown,
  db?: Database.Database
}
```

Result shape:

```ts
{
  ok,
  status,
  record,
  records,
  filters,
  limit,
  warnings,
  failures,
  authority_boundary,
  recommended_next_step
}
```

Statuses:

- `fetched`
- `listed`
- `invalid_input`
- `not_found`
- `db_error`

## JSON Text Parsing

Read records parse these JSON text fields into structured output:

- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `authority_boundary`

Malformed stored JSON is treated as a database read error by the core.

## Local Helper Usage

Helper command:

```bash
npm run ag:resume-imported-context-read -- --json --file input.json
```

Input priority:

1. `AG_WORK_RESUME_IMPORTED_CONTEXT_READ_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--import-id <id>`
- `--mapping-id <id>`
- `--foreign-scope <scope>`
- `--foreign-work-id <id>`
- `--local-scope <scope>`
- `--local-work-id <id>`
- `--packet-id <id>`
- `--packet-hash <hash>`
- `--status <review_metadata|superseded|withdrawn|revoked>`
- `--created-by <actor>`
- `--limit <n>`

The helper prints one JSON object to stdout. It exits 0 for `fetched` and
`listed`, and non-zero for `invalid_input`, `not_found`, and `db_error`. It
never calls route, network, browser, GitHub, OpenAI, proof/evidence, session,
work, or Codex helpers.

## GET Route Behavior

Endpoint:

```text
GET /api/ag-work-resume/imported-contexts
```

GET uses query params only. It rejects repeated params, unknown params, and
request bodies before delegating to `readAgWorkResumeImportedContexts`.

GET response shape:

```ts
{
  ok,
  route,
  result,
  authority_boundary,
  recommended_next_step
}
```

GET route id is `ag_work_resume_imported_context_read.v0_1`.

HTTP status mapping:

- `fetched` -> HTTP 200
- `listed` -> HTTP 200
- `invalid_input` -> HTTP 400
- `not_found` -> HTTP 404
- `db_error` -> HTTP 500

Existing `POST /api/ag-work-resume/imported-contexts` create behavior and its
route id `ag_work_resume_imported_contexts.v0_1` are preserved.

## Authority Boundary

The read authority boundary states:

- `read_only: true`
- `review_metadata_only: true`
- `imported_context_created: false`
- `imported_context_updated: false`
- `imported_context_deleted: false`
- `confirmed_mapping_created: false`
- `confirmed_mapping_updated: false`
- `proposal_record_updated: false`
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

Statement: imported context reads expose bounded review metadata only and are
not proof/evidence/session/Codex/merge authority.

## Non-Goals

- No writer changes.
- No POST behavior change; the existing POST create route is preserved.
- No lifecycle mutation.
- No Cockpit UI in this helper/route slice; the later read-only Cockpit
  review panel is documented in
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`.
- Bounded POST create Cockpit controls are separately documented in
  `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md` and do
  not change this read helper/route.
- No schema or migration.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, browser persistence, or browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this imported context read helper/route slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-imported-context-db-schema-design
npm run smoke:ag-work-resume-imported-context-record-design
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-imported-context-read.mjs
node --check scripts/smoke-ag-work-resume-imported-context-read.mjs
```
