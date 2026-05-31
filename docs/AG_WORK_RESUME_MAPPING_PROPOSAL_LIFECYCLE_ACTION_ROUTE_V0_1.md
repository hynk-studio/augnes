# AG Work Resume Mapping Proposal Lifecycle Action Route v0.1

## Purpose

This document records the JSON route over the Stage B AG Resume mapping
proposal lifecycle action core.

The route updates existing proposal lifecycle and review metadata only by
delegating to `applyAgWorkResumeMappingProposalLifecycleAction`. It supports
explicit `withdraw`, `reject`, `supersede`, and `expire` actions on existing
active proposal records.

This route is not mapping confirmation, not import authorization, not
proof/evidence authorization, not session binding, not Codex execution
authority, and not approval, publish, retry, replay, or merge authority.

## Relationship To Existing Pieces

- Lifecycle action design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`
  defines the lifecycle semantics and authority boundary.
- Lifecycle action core/helper:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md`
  documents the shared core and local helper this route delegates to.
- Lifecycle action Cockpit panel:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
  documents the later bounded Cockpit Operator panel that calls this existing
  route. The route contract itself remains unchanged.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  lifecycle metadata, confirmed mappings, imports, proof/evidence, session
  binding, Codex continuation, approval, publish, retry, replay, and merge as
  separate authority boundaries.

## Route

`POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions`

The route accepts JSON request bodies only. Requests without
`content-type: application/json` are rejected.

The route passes only these fields to the core:

- `proposal_id`
- `action`
- `reviewed_by`
- `review_note`
- `reviewed_at`
- `replacement_proposal_id`
- `superseded_by_proposal_id`

The route does not accept `db` or `now` from the HTTP body. If `reviewed_at` is
supplied, the core uses it as the reviewed timestamp after validation. If it is
omitted, the core uses its normal timestamp behavior.

## Input Example

```json
{
  "proposal_id": "ag-resume-mapping-proposal:example",
  "action": "withdraw",
  "reviewed_by": "user-core:reviewer",
  "review_note": "Withdrawn from active consideration.",
  "reviewed_at": "2026-05-31T00:00:00.000Z"
}
```

## Output Shape

Route responses include:

- `ok`
- `route`
- `result`
- `authority_boundary`
- `recommended_next_step`

`result` is the core lifecycle action result. `authority_boundary` is the core
authority boundary and sets `proposal_lifecycle_updated: true` only on a
successful lifecycle update.

## Status Mapping

- `updated` -> HTTP 200
- `invalid_input` -> HTTP 400
- `not_found` -> HTTP 404
- `not_active` -> HTTP 409
- `replacement_not_found` -> HTTP 404
- `db_error` -> HTTP 500

`replacement_not_found` maps to HTTP 404 because the supplied replacement
proposal id names a missing proposal record and the route does not create
replacement proposal rows.

## Validation And Parsing

- Requires `content-type: application/json`.
- Rejects invalid JSON.
- Rejects non-object JSON bodies.
- Rejects unsupported fields, including `db` and `now`.
- Delegates lifecycle input validation to the shared core.
- Does not infer expiration from `expires_at`; `expire` remains an explicit
  action only.

## DB Behavior

The route performs no direct DB writes. It delegates all lifecycle behavior to
the shared core, which uses a DB transaction and updates only the target row in
`ag_work_resume_mapping_proposals`.

The route does not call the proposal writer, the read route, browser APIs,
GitHub, OpenAI, proof/evidence helpers, session helpers, work writers, import
writers, confirmed mapping writers, bridge tools, MCP/App tools, relay paths,
or Codex helpers. The route performs no fetch/network calls.

## Authority Boundary

- Existing proposal lifecycle/review metadata update only.
- No Cockpit UI was added by this route slice.
- No DB schema or migration.
- No proposal creation.
- No replacement proposal creation.
- No replacement proposal row update.
- No same-tuple transactional replacement creation.
- No confirmed mapping.
- No import.
- No imported context.
- No work item or work event creation.
- No proof/evidence recording.
- No proof/evidence authorization.
- No session binding.
- No Codex execution or continuation.
- No ChatGPT App cards.
- No MCP/App schema changes.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

- No Cockpit UI.
- No DB schema or migration.
- No proposal writer change.
- No read route change.
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

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-actions-design
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs
```

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this lifecycle route slice
