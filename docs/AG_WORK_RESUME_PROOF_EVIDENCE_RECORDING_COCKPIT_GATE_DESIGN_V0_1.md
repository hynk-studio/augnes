# AG Resume Proof/Evidence Recording Cockpit Gate Design v0.1

## Status

This document is design-only. It defines a future Cockpit Operator UI gate for
invoking the existing bounded route:

```text
POST /api/ag-work-resume/proof-evidence-recordings
```

The future UI must call only that route. It must not call
`createAgWorkResumeProofEvidenceRecordingFromCandidate` directly.

This design adds no UI/Cockpit implementation, no route implementation, no
route modification, no writer/helper behavior change, no schema or migration,
no proof/evidence recording, no `verification_evidence_records` rows, no
`ag_work_resume_proof_evidence_recording_links` rows, no `action_records`
rows, no session binding, no Codex execution or continuation, no work
item/event creation, no imported context mutation, no confirmed mapping
mutation, no proposal mutation, no reconciliation candidate mutation, no
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state authority.

The UI gate design is not UI implementation. The UI gate design is not approval
to record. A future UI implementation PR is not blanket approval to record.
Route success is not approval, publish, retry, replay, or merge authority.
`accepted_for_future_recording` is not proof/evidence recording. Recording
remains exact per-attempt user/Core gated. The UI must not weaken route/helper
validation.

## Larger Goal

The larger AG Resume cross-local continuity goal is to give the operator a
recoverable, inspectable path from accepted reconciliation candidate review
metadata to one local verification evidence record while keeping authority
explicit at every surface.

The writer/helper owns validation and DB writes. The route owns HTTP transport
validation and status mapping. A future Cockpit gate may only provide an
operator-facing invocation surface over that route. It must not become hidden
approval authority.

## UI Purpose

The future UI purpose is to help an operator prepare and submit one exact
proof/evidence recording request to the bounded route after user/Core has
approved the specific attempt.

The UI should make the operator slow down enough to see:

- the candidate id being recorded
- the imported context and confirmed mapping cross-checks
- the exact user/Core approval payload
- the actor, reason, redaction, trust/provenance, local target, and
  idempotency details
- the side effects that are allowed
- the side effects that remain forbidden

The UI must be optimized for careful review, not speed.

## Non-Authority Statement

The future UI must display and preserve this boundary:

- `accepted_for_future_recording` is not proof/evidence recording.
- Route success is not broader approval.
- Actual recording requires exact user/Core approval per attempt.
- The UI cannot approve, publish, retry, replay, merge, auto-merge, externally
  post, commit Augnes state, execute Codex, bind sessions, or create work
  items/events.
- The UI cannot mutate imported context, confirmed mapping, proposal, or
  reconciliation candidate rows.

Route availability, loaded fixture data, prefilled fields, disabled/enabled UI
state, successful validation, route success, idempotent success, browser proof,
or PR merge must never imply approval for another recording attempt.

## Target Cockpit Surface

Recommended future location:

```text
Cockpit Operator tab, near AG Resume proof/evidence recording/candidate panels.
```

The panel should sit after reconciliation candidate review/read surfaces and
near existing AG Resume proof/evidence recording context. It should not be
placed in Overview, Perspective, Bridge, or Work as a hidden write control.

The panel title should be:

```text
AG Resume Proof/Evidence Recording Gate
```

The primary submit button text must include:

```text
Record verification evidence
```

## Exact Route Called

Future UI implementation may call only:

```text
POST /api/ag-work-resume/proof-evidence-recordings
```

The UI must use `application/json`. It must not call the writer/helper directly
and must not call any other route, helper, API, bridge tool, browser automation
tool, or external network API for recording.

## Request Body Fields

The future UI may submit only these route-supported fields:

| Field | UI requirement |
| --- | --- |
| `candidate_id` | Required canonical reconciliation candidate id. |
| `import_id` | Optional cross-check only. |
| `mapping_id` | Optional cross-check only. |
| `user_core_approval` | Required exact approval payload for this one attempt. |
| `actor` | Required explicit user/Core actor. |
| `reason` | Required bounded reason. |
| `redaction_summary` | Required public-safe JSON object. |
| `trust_provenance_label` | Required allowlisted trust/provenance label. |
| `local_target_scope` | Required local target scope. |
| `local_target_work_id` | Required local target work id. |
| `expected_idempotency_key` | Optional cross-check only. |

`candidate_id` is the canonical input. `import_id`, `mapping_id`, and
`expected_idempotency_key` are cross-checks only and must not be used to select
alternate source rows.

## Required Approval Payload

The UI must require an exact `user_core_approval` JSON object for the current
attempt. The approval payload must match the route/helper policy for:

- candidate id
- imported context id
- confirmed mapping id
- local target scope
- local target work id
- target record kind
- idempotency key
- actor
- reason
- redaction summary
- trust/provenance label
- allowed insert tables
- forbidden side effects

The UI must not synthesize approval from session/auth state, Cockpit state,
candidate status, a previous route success, a prior browser report, fixture
data, or PR state.

## Actor, Reason, Redaction, Trust, And Local Target

The UI must expose explicit fields for:

- `actor`
- `reason`
- `redaction_summary`
- `trust_provenance_label`
- `local_target_scope`
- `local_target_work_id`

The UI may perform shallow local validation for missing fields and obvious JSON
shape problems. The route and helper remain authoritative for validation,
cross-checking, idempotency, redaction safety, trust/provenance allowlisting,
source-row reads, and DB writes.

## Explicit UI Copy

The future UI must include visible copy near the form:

```text
accepted_for_future_recording is not proof/evidence recording.
```

```text
Route success is not broader approval.
```

```text
Actual recording requires exact user/Core approval for this attempt.
```

```text
This UI calls only POST /api/ag-work-resume/proof-evidence-recordings and must
not weaken route/helper validation.
```

The copy must be visible before submission and in the result area after any
success, idempotent success, or failure.

## Design Decisions

Manual JSON approval payload entry is allowed and required for the first UI
implementation. The first implementation should use an explicit JSON textarea
for `user_core_approval` so approval provenance remains visible to the
operator.

The UI may build a draft approval payload from visible fields only as a
copy/edit convenience. That draft is not approval. The user/Core actor must
review it, keep it visible, and confirm the exact attempt before submission.

Safe fixture loading is allowed only for development, smoke, and local demo
verification. Fixture data may never imply approval. Any fixture control must
be labeled:

```text
Load safe fixture (not approval)
```

The UI prevents accidental submit by requiring:

- all required fields to be non-empty
- valid JSON for `user_core_approval` and `redaction_summary`
- a checked confirmation checkbox saying:
  `I have exact user/Core approval for this recording attempt.`
- a typed confirmation phrase:
  `record verification evidence`
- submit button text containing `Record verification evidence`

The idempotency key must be shown before submission when present in the
approval payload or supplied as `expected_idempotency_key`. It must be labeled
as a cross-check, not retry/replay authority.

Success must display `evidence_id`, `recording_link_id`, `candidate_id`, and
`idempotency_key`. Failure text must be public-safe only.

Browser verification is required for any future UI implementation PR.

## Local Validation Expectations

Local UI validation should fail closed before route submission when:

- `candidate_id` is missing
- `actor` is missing
- `reason` is missing
- `redaction_summary` is missing or invalid JSON
- `trust_provenance_label` is missing
- `local_target_scope` is missing
- `local_target_work_id` is missing
- `user_core_approval` is missing or invalid JSON
- the confirmation checkbox is unchecked
- the typed confirmation phrase does not exactly match
  `record verification evidence`
- unsupported request fields are present in advanced JSON state
- forbidden fields are present in advanced JSON state

Local validation is a usability guard only. It must not replace route/helper
validation.

## Forbidden Controls

Future UI must not add controls for:

- Run Codex
- continue Codex
- bind session
- create work item/event
- create action record
- approve/publish/retry/replay/merge
- auto-merge
- external post
- mutate imported context
- mutate confirmed mapping
- mutate proposal
- mutate reconciliation candidate
- Direct Resume Code
- relay/hosted transfer

The future UI must not include hidden buttons, menu items, keyboard shortcuts,
or helper calls for those actions.

## Forbidden Fields

The future UI must reject and never submit these fields:

- `db`
- `now`
- `route_path`
- `route_method`
- `content_type`
- `session_id`
- `bind_session`
- `codex_session_id`
- `codex_continue`
- `codex_execute`
- `work_item`
- `work_item_create`
- `work_event`
- `work_event_create`
- `action_id`
- `action_record`
- `target_action_id`
- `evidence_id`
- `recording_link_id`
- `mutate_imported_context`
- `mutate_confirmed_mapping`
- `mutate_proposal`
- `mutate_candidate`
- `approval_request_id`
- `approval_decision_id`
- `publish`
- `retry`
- `replay`
- `merge`
- `auto_merge`
- `external_post`
- `committed_state`
- `direct_resume_code`
- `relay_transfer`
- `hosted_transfer`

## Forbidden Calls

Future UI must not call:

- Codex APIs/helpers
- session binding helpers
- action-record writers
- work item/event writers
- imported context writers
- confirmed mapping writers
- proposal writers
- reconciliation candidate lifecycle writers
- approval/publish/retry/replay/merge helpers
- external network APIs
- OpenAI APIs
- GitHub APIs
- MCP tools
- Browser automation
- `createAgWorkResumeProofEvidenceRecordingFromCandidate` directly

## Clear And Reset Behavior

The panel must provide a clear/reset control that:

- clears all text inputs and JSON textareas
- clears local validation errors
- clears pending confirmation checkbox and typed confirmation
- clears displayed route results
- does not call the route
- does not mutate any DB rows
- does not preserve `user_core_approval` in localStorage, sessionStorage,
  indexedDB, cookies, or telemetry

The clear/reset control must not clear by submitting an empty request.

## Success Rendering

For `recorded` responses:

- show a success state
- show `evidence_id`
- show `recording_link_id`
- show `candidate_id`
- show `idempotency_key`
- show `target_record_kind`
- show the route `authority_boundary`
- restate that route success is not broader approval
- restate that no session/Codex/work/action/source-row/approval/publish/retry/
  replay/merge authority was granted

## Idempotent Rendering

For `idempotent_no_new_write` responses:

- show a distinct idempotent state, not a new recording state
- show the existing `evidence_id`
- show the existing `recording_link_id`
- show the existing `idempotency_key`
- state that no duplicate rows were created
- restate that idempotent success is not retry, replay, publish, merge, or
  approval authority

## Failure Rendering

For failures:

- show public-safe failure text only
- do not display raw stack traces
- do not display raw DB internals
- do not display raw foreign payloads
- do not display tokens, cookies, private paths, session payloads, raw proof
  payloads, or raw evidence payloads
- show HTTP status and route result name
- show `authority_boundary`
- state that no UI/Cockpit authority was gained
- provide a bounded recommended next step

## Future DB And Network Proof Expectations

Future UI implementation PR must include smoke or test proof that:

- successful submit calls only
  `POST /api/ag-work-resume/proof-evidence-recordings`
- no direct helper calls occur from the component
- no external network calls occur
- no Codex/session/work/action/source-row/approval/publish/retry/replay/merge
  helper calls occur
- exact approved submit creates exactly one `verification_evidence_records`
  row and exactly one `ag_work_resume_proof_evidence_recording_links` row
  through the route/helper
- idempotent repeat creates no duplicate rows
- failure paths create no rows
- `fk_or_unique_failure` rolls back
- protected table counts are unchanged for `action_records`, `sessions`,
  `work_items`, `work_events`, `ag_work_resume_imported_contexts`,
  `ag_work_resume_confirmed_mappings`, `ag_work_resume_mapping_proposals`, and
  `ag_work_resume_proof_evidence_reconciliation_candidates`

## Future Browser Verification Matrix

Browser verification is required for future UI implementation. It must verify:

| Scenario | Expected browser proof |
| --- | --- |
| Panel location | Operator tab shows the recording gate near AG Resume proof/evidence candidate panels. |
| Boundary copy | Required boundary copy is visible before submit. |
| Keyboard flow | All inputs, checkbox, typed confirmation, clear/reset, and submit are reachable by keyboard. |
| Invalid JSON | Invalid approval/redaction JSON prevents submit and shows public-safe validation text. |
| Missing approval | Submit remains disabled or fails closed with no route-created rows. |
| Exact approved submit | Route call succeeds, success rendering shows `evidence_id` and `recording_link_id`. |
| Idempotent repeat | UI shows idempotent state and says no duplicate rows were created. |
| Failure path | UI shows public-safe bounded failure text only. |
| Forbidden controls scan | No Run Codex, bind session, work item/event, action record, approve, publish, retry, replay, merge, auto-merge, external post, Direct Resume Code, relay, or hosted transfer control is present. |
| Route call scan | Browser/network proof shows only `POST /api/ag-work-resume/proof-evidence-recordings` for submit. |

## Accessibility And Keyboard Expectations

Future UI implementation must:

- use visible labels for every input
- expose JSON validation errors with `aria-describedby`
- make result status available to assistive technology
- keep focus inside any confirmation dialog if one is used
- return focus to a useful control after clear/reset
- keep submit disabled until local required fields and confirmation are present
- avoid hover-only controls
- preserve readable text at mobile and desktop widths

## Unauthorized Controls Scan Expectations

Future smoke and browser verification must scan the Cockpit source and rendered
Operator tab for forbidden labels and route/helper references, including:

- `Run Codex`
- `Continue Codex`
- `Bind session`
- `Create work item`
- `Create work event`
- `Create action record`
- `Approve`
- `Publish`
- `Retry`
- `Replay`
- `Merge`
- `Auto-merge`
- `External post`
- `Direct Resume Code`
- `Relay transfer`
- `Hosted transfer`
- `createAgWorkResumeProofEvidenceRecordingFromCandidate`
- `/api/sessions/bind`
- `/api/actions/record`
- `/api/actions/record-proof`
- `/api/work`
- `/api/publications`

Any match must be explicitly justified as boundary copy or fail the future UI
smoke.

## Protected Table Count Proof Expectations

Future UI implementation smoke must snapshot protected table counts before and
after route calls. Only exact approved `recorded` may increase:

- `verification_evidence_records` by 1
- `ag_work_resume_proof_evidence_recording_links` by 1

All other protected tables must remain unchanged:

- `action_records`
- `sessions`
- `work_items`
- `work_events`
- `ag_work_resume_imported_contexts`
- `ag_work_resume_confirmed_mappings`
- `ag_work_resume_mapping_proposals`
- `ag_work_resume_proof_evidence_reconciliation_candidates`
- approval/publication/delivery tables

## Authority Boundary

This Cockpit gate design grants:

- no UI/Cockpit implementation
- no route implementation
- no route modification
- no writer/helper behavior change
- no schema or migration
- no proof/evidence recording
- no bridge rows
- no `verification_evidence_records` row creation
- no `action_records` row creation
- no session binding
- no Codex execution or continuation
- no work item/event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no reconciliation candidate mutation
- no approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

The future UI must call only the existing route and must preserve route/helper
validation.

## What This Enables Next

This design enables a future Cockpit UI implementation PR to add the smallest
operator-facing recording gate over the existing route, with clear approval
copy, local validation, confirmation controls, result rendering, browser proof,
and DB side-effect proof.

It does not authorize the future UI implementation to record without exact
per-attempt user/Core approval.

## What This Does Not Solve

This design does not solve:

- UI/Cockpit implementation
- route implementation or route modification
- writer/helper behavior
- schema or migration
- proof/evidence recording by this PR
- verification evidence row creation by this PR
- bridge row creation by this PR
- action-record proof creation
- session binding
- Codex continuation
- work item/event creation
- imported context mutation
- confirmed mapping mutation
- proposal mutation
- reconciliation candidate mutation
- approval/publish/retry/replay/merge authority
- auto-merge authority
- external posting
- committed-state mutation
- Direct Resume Code
- relay/hosted transfer

## Browser Verification

Browser verification skipped: no runtime/UI/Cockpit/browser files are changed
by this design-only Cockpit gate PR.

Future UI implementation PR must include browser verification.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-route
npm run smoke:ag-work-resume-proof-evidence-recording-route-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper
npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy
npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy
npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design
npm run smoke:ag-work-resume-review-metadata-closeout
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs
git diff --check
git diff --cached --check
```
