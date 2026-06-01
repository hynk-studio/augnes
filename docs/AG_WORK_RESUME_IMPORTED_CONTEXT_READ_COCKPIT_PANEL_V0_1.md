# AG Work Resume Imported Context Read Cockpit Panel v0.1

## Purpose

This document records the read-only Cockpit Operator panel for Stage D AG
Resume imported context review metadata.

The panel calls only:

```text
GET /api/ag-work-resume/imported-contexts
```

Reads are read-only imported context review metadata only. They are not
proof/evidence, not session binding, not Codex execution or continuation, not
work item/event creation, not confirmed mapping/proposal mutation, and not
approval, publish, retry, replay, or merge authority.

The existing POST create route is preserved but not changed by this Cockpit
read panel slice.

## Relationship To Writer Route Schema And Design

The panel sits on top of the read helper/GET route documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`.

Related documents:

- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`

The writer creates bounded imported context review metadata from an active
confirmed mapping. The panel does not call that writer route. It only submits
query parameters to the existing GET route and renders the route result.

## Allowed UI

The panel exposes native inputs for:

- `import_id`
- `mapping_id`
- `foreign_scope` plus `foreign_work_id`
- `local_scope` plus `local_work_id`
- `packet_id` plus `packet_hash`
- `status`
- `created_by`
- `limit`

Safe fixture buttons load synthetic public-safe values into local React state
only. They do not call routes and do not persist browser state.

The panel includes:

- `Load safe import id lookup`
- `Load safe mapping lookup`
- `Load safe foreign work lookup`
- `Load safe local work lookup`
- `Load safe packet lookup`
- `Load safe status lookup`
- `Load safe creator lookup`
- `Clear imported context inputs`
- `Read imported contexts`

## Local Validation

The panel validates before calling the route:

- `import_id` fetch must not combine with list filters or `limit`.
- `foreign_scope` and `foreign_work_id` must be supplied together.
- `local_scope` and `local_work_id` must be supplied together.
- `packet_id` and `packet_hash` must be supplied together.
- At least one supported filter is required.
- `limit` must be a positive integer.

The route remains canonical validation. Repeated query params, unknown query
params, request bodies, unsupported statuses, and limit capping remain route
responsibilities.

## GET Route Behavior

The panel sends one route request with method GET, query params only, no
request body, and no JSON `Content-Type` header.

It renders:

- HTTP status
- route ok
- reader status
- filters
- limit
- warnings
- failures
- read authority boundary
- imported context cards

Imported context cards render:

- `import_id`
- `mapping_id`
- foreign and local identities
- packet id/hash
- `imported_summary`
- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `created_by`
- `import_reason`
- `created_at`
- `updated_at`
- record authority boundary

## Result Shape

The panel expects the route response shape:

```ts
{
  ok,
  route,
  result,
  authority_boundary,
  recommended_next_step
}
```

The nested reader result includes `record`, `records`, `filters`, `limit`,
`warnings`, `failures`, `authority_boundary`, and `recommended_next_step`.

## JSON Text Parsing

The panel receives parsed JSON fields from the read helper/route:

- `imported_expected_files`
- `imported_expected_checks`
- `foreign_refs_summary`
- `redaction_report`
- `authority_boundary`

The panel renders these parsed values. It does not parse database text fields
itself and does not join proposal, confirmed mapping, work, proof/evidence,
session, or Codex tables.

## Accessibility

The panel uses native inputs, select elements, and buttons. Inputs have real
labels with `htmlFor`, descriptive `aria-describedby` text, `role="alert"` for
local or route errors, and an `aria-live="polite"` result region.

## Authority Boundary

Visible panel copy states that imported context reads are read-only imported
context review metadata only.

The rendered read authority boundary includes:

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

Imported context reads expose bounded review metadata only and are not
proof/evidence/session/Codex/merge authority.

## Non-Goals

- No create controls.
- No update route.
- No delete route.
- No lifecycle mutation.
- No proof/evidence recording or controls.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No Cockpit writer behavior.
- No schema or migration.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification Requirement

Browser verification is required because this slice changes a rendered Cockpit
Operator surface. The verification report is:

`reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md`

The report covers import id fetch, list filters, local validation errors,
clear behavior, accessibility/keyboard observation, unauthorized controls scan,
network proof, and DB side-effect proof.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-imported-context-read-cockpit-panel.mjs
```
