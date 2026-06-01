# AG Work Resume Proof Evidence Reconciliation Candidate Lifecycle Action Cockpit Panel v0.1

## Purpose

This document records the Cockpit Operator panel for AG Resume proof/evidence
reconciliation candidate lifecycle actions.

The panel calls only:

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions
```

Lifecycle actions update existing reconciliation candidate review metadata only.
accepted_for_future_recording is not proof/evidence recording. The panel does
not create proof/evidence records, bind sessions, execute or
continue Codex, create work items/events, mutate imported context rows, mutate
confirmed mapping rows, mutate proposal rows, approve, publish, retry, replay,
or merge.

## Relationship To Lifecycle Contract

The lifecycle action core, helper, route, statuses, transitions, validation
rules, idempotency/duplicate-action behavior, and side-effect boundaries are
documented in:

`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`

The panel sits near the existing candidate create and read panels:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`

## Allowed UI

The panel exposes native controls for:

- `candidate_id`
- `action`
- `reviewed_by`
- `review_note`
- `reviewed_at`
- `replacement_candidate_id`

Supported lifecycle action values:

- `accept_for_future_recording`
- `reject`
- `defer`
- `withdraw`
- `revoke`
- `supersede`

Safe fixture buttons load synthetic public-safe values into local React state
only. They do not call routes, create rows, update rows, or persist browser
state.

The panel includes:

- `Load safe accept for future recording action`
- `Load safe reject action`
- `Load safe defer action`
- `Load safe withdraw action`
- `Load safe revoke action`
- `Load safe supersede action`
- `Clear reconciliation candidate lifecycle inputs`
- `Apply reconciliation candidate lifecycle action`

## Local Validation

The panel validates before calling the route:

- `candidate_id` is required.
- `action` is required and must be one of the supported lifecycle actions.
- `reviewed_by` is required.
- `review_note` is required.
- `reviewed_at`, when supplied, must be ISO UTC with millisecond precision.
- `replacement_candidate_id` is allowed only for `supersede`.
- `replacement_candidate_id` must not equal `candidate_id`.

The route remains canonical validation for unknown fields, missing candidate,
invalid transition, missing replacement candidate, and all DB behavior.

## POST Route Behavior

The panel sends exactly one route request with method POST, a JSON
`Content-Type` header, and a JSON request body built only from supported body
fields.

The panel does not call:

- candidate create or read routes
- proof/evidence routes
- session routes
- Codex routes
- work item/event routes
- imported context routes
- confirmed mapping routes
- proposal routes
- approval or publication routes
- bridge, MCP/App, Direct Resume Code, or relay routes

## Output Rendering

The panel renders:

- HTTP status
- route ok
- lifecycle status
- action
- candidate id
- before/after status
- updated fields
- warnings
- failures
- lifecycle authority boundary
- before candidate snapshot
- after candidate snapshot

The result region uses `aria-live="polite"`. Local and route errors render
with `role="alert"`.

## Accessibility

The panel uses native inputs, selects, textareas, and buttons. Inputs have real
labels with `htmlFor`, descriptive `aria-describedby` text, and labelled
control groups for fixture controls, inputs, and action controls.

Keyboard observation in browser verification covers fixture buttons, text
inputs, select, clear, and submit controls.

## Authority Boundary

Visible panel copy states that lifecycle actions update candidate review
metadata only and that `accepted_for_future_recording` is not proof/evidence
recording.

The rendered authority boundary includes:

- `reconciliation_candidate_lifecycle_updated`
- `reconciliation_candidate_updated`
- `review_metadata_only`
- `reconciliation_candidate_created`
- `reconciliation_candidate_deleted`
- `proof_recorded`
- `evidence_recorded`
- `session_bound`
- `codex_executed`
- `work_item_created`
- `work_event_created`
- `imported_context_updated`
- `confirmed_mapping_updated`
- `proposal_record_updated`
- `approval_granted`
- `publish_retry_replay_authority`
- `merge_authority`
- `durable_approval`

## Non-Goals

- No create controls beyond the existing candidate create panel.
- No read controls beyond the existing candidate read panel.
- No delete route.
- No schema or migration.
- No proof/evidence recording.
- No proof/evidence record creation.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No replacement candidate row update.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification Requirement

Browser verification must cover successful lifecycle actions, invalid action,
invalid transition, missing `reviewed_by`, missing `review_note`, missing
candidate, route failure display, clear/reset behavior, accessibility/keyboard
observation, unauthorized controls scan, network proof showing only the
candidate lifecycle route, DB side-effect proof showing only candidate review
metadata changed, and protected table count proof for proof/evidence,
session, work item/event, imported context, confirmed mapping, and proposal
tables.
