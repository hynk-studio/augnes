# AG Work Resume Imported Context Route v0.1

## Purpose

This document records the Stage D AG Resume imported context create route.
The route creates imported context review metadata rows only by delegating to
`createAgWorkResumeImportedContext`.

Imported context remains bounded review metadata derived from a validated AG
Resume packet and an existing active confirmed mapping. It is not proof or
evidence, not session binding, not Codex execution or continuation, not
committed state authority, and not approval, publish, retry, replay, or merge
authority.

This slice adds no Cockpit UI, no read route, no schema or migration, and no
writer behavior beyond the existing shared core.

## Route

Endpoint:

```text
POST /api/ag-work-resume/imported-contexts
```

Request rules:

- Requires `content-type: application/json`.
- Invalid JSON is rejected.
- Non-object JSON bodies are rejected.
- Unknown body fields are rejected.
- HTTP bodies may not supply `db` or `now`.
- The route delegates validation, active mapping checks, redaction checks, and
  insert behavior to `createAgWorkResumeImportedContext`.

Supported body fields:

- `mapping_id`
- `packet_id`
- `packet_hash`
- `source_runtime_instance_id`
- `foreign_scope`
- `foreign_work_id`
- `local_scope`
- `local_work_id`
- `imported_summary`
- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `created_by`
- `import_reason`
- `created_at`

`import_reason` records why user/Core created or imported this bounded review
metadata.

## Response

The route returns one JSON object:

```ts
{
  ok,
  route,
  result,
  authority_boundary,
  recommended_next_step
}
```

`route` is `ag_work_resume_imported_contexts.v0_1`.

## HTTP Status Mapping

- `created` -> HTTP 201
- `invalid_input` -> HTTP 400
- `mapping_not_found` -> HTTP 404
- `mapping_not_active` -> HTTP 409
- `mapping_mismatch` -> HTTP 409
- `redaction_blocked` -> HTTP 400
- `db_error` -> HTTP 500

## Authority Boundary

The route creates imported context review metadata rows only.

The route:

- does not record proof/evidence
- does not bind sessions
- does not execute Codex
- does not create work items or work events
- does not mutate confirmed mapping rows
- does not mutate proposal rows
- does not add UI
- does not approve, publish, retry, replay, merge, auto-merge, externally post,
  or mutate committed state

The shared writer authority boundary remains the response authority boundary.
It marks imported context creation as `review_metadata_only` and keeps proof,
evidence, session, Codex, approval, publish, retry, replay, and merge authority
false.

## Non-Goals

- No Cockpit UI.
- No read route.
- No schema or migration.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code route.
- No relay.
- No telemetry, analytics, browser persistence, or browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this imported context route slice

## Verification

Run:

```bash
npm run typecheck
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
node --check scripts/smoke-ag-work-resume-imported-context-route.mjs
```
