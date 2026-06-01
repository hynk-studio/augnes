# AG Work Resume Proof Evidence Reconciliation Candidate Read Cockpit Panel v0.1

## Purpose

This document records the read-only Cockpit Operator panel for AG Resume
proof/evidence reconciliation candidate review metadata.

The panel calls only:

```text
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

Reads are read-only reconciliation candidate review metadata only. Candidate
rows are not proof/evidence. Candidate rows are not proof/evidence. The panel
is not proof/evidence recording, not session binding, not Codex execution or
continuation, not work item/event creation, not imported context/confirmed
mapping/proposal mutation, and not approval, publish, retry, replay, or merge
authority.

The existing candidate create route is preserved but not changed by this
Cockpit read panel slice.

The candidate lifecycle action panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`.
It calls only the separate lifecycle action route and updates existing
candidate review metadata only. `accepted_for_future_recording` is not
proof/evidence recording.

## Relationship To Reader Route Writer Schema And Design

The panel sits on top of the read helper/GET route documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.

Related documents:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`

The writer creates bounded reconciliation candidate review metadata from an
imported context row and a bounded foreign ref summary. The panel does not
call that writer route. It only submits query parameters to the existing GET
route and renders the route result. Foreign refs remain foreign until
explicitly reconciled through a separately approved user/Core gate.

The later bounded Cockpit Operator create panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only the existing POST route and grants no update/delete, lifecycle,
proof/evidence/session, Codex, work item/event creation, imported
context/confirmed mapping/proposal mutation, schema/migration, approval,
publish, retry, replay, or merge authority.

## Allowed UI

The panel exposes native inputs for:

- `candidate_id`
- `import_id`
- `mapping_id`
- `foreign_ref_type` plus `foreign_ref_id`
- `local_target_scope` plus `local_target_work_id`
- `status`
- `proposed_by`
- `reviewed_by`
- `limit`

Safe fixture buttons load synthetic public-safe values into local React state
only. They do not call routes and do not persist browser state.

The panel includes:

- `Load safe candidate lookup`
- `Load safe import lookup`
- `Load safe mapping lookup`
- `Load safe foreign ref lookup`
- `Load safe local target lookup`
- `Load safe status lookup`
- `Load safe proposer lookup`
- `Load safe reviewer lookup`
- `Clear reconciliation candidate inputs`
- `Read reconciliation candidates`

## Local Validation

The panel validates before calling the route:

- `candidate_id` fetch must not combine with list filters or `limit`.
- `foreign_ref_type` and `foreign_ref_id` must be supplied together.
- `local_target_scope` and `local_target_work_id` must be supplied together.
- At least one supported filter is required.
- `limit` must be a positive integer.

The route remains canonical validation. Repeated query params, unknown query
params, request bodies, unsupported statuses, unsupported foreign ref types,
and limit capping remain route responsibilities.

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
- candidate cards

Candidate cards render:

- `candidate_id`
- `import_id`
- `mapping_id`
- `foreign_ref_type`
- `foreign_ref_id`
- `local_target_scope`
- `local_target_work_id`
- `summary`
- `redaction_status`
- `proposed_by`
- `proposed_reason`
- `reviewed_by`
- `reviewed_at`
- `review_note`
- `status`
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

- `redaction_status`
- `authority_boundary`

The panel renders these parsed values. It does not parse database text fields
itself and does not join imported context, confirmed mapping, proposal, work,
proof/evidence, session, or Codex tables.

## Accessibility

The panel uses native inputs, select elements, and buttons. Inputs have real
labels with `htmlFor`, descriptive `aria-describedby` text, `role="alert"` for
local or route errors, and an `aria-live="polite"` result region.

Keyboard observation in browser verification covers fixture buttons, text
inputs, selects, clear, and submit controls.

## Authority Boundary

Visible panel copy states that reconciliation candidate reads are read-only
candidate review metadata only.

The rendered read authority boundary includes:

- `read_only: true`
- `review_metadata_only: true`
- `reconciliation_candidate_created: false`
- `reconciliation_candidate_updated: false`
- `reconciliation_candidate_deleted: false`
- `proof_recorded: false`
- `evidence_recorded: false`
- `session_bound: false`
- `codex_executed: false`
- `work_item_created: false`
- `work_event_created: false`
- `imported_context_updated: false`
- `confirmed_mapping_updated: false`
- `proposal_record_updated: false`
- `approval_granted: false`
- `publish_retry_replay_authority: false`
- `merge_authority: false`
- `durable_approval: user/Core gated`

Candidate reads expose review metadata only and are not
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
- No imported context mutation.
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

Browser verification is required because this slice changes a rendered
Cockpit Operator surface.

Browser verification report:

```text
reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md
```

The report covers:

- `candidate_id` fetch
- `import_id` list
- `mapping_id` list
- foreign ref tuple list
- local target tuple list
- `status` list
- `proposed_by` list
- `reviewed_by` list
- not_found
- local validation errors
- clear after success/error
- accessibility/keyboard observation
- unauthorized controls scan
- network proof
- DB side-effect proof

Network proof must show only
`GET /api/ag-work-resume/proof-evidence-reconciliation-candidates`, no writer
route call, no request body, no JSON `Content-Type` header, and no forbidden
route calls.

DB side-effect proof must show candidate row count/content unchanged, imported
context rows unchanged, confirmed mapping rows unchanged, source proposal rows
unchanged, local work rows unchanged, protected tables unchanged, and no
proof/evidence/session/Codex side effects.
