# AG Resume Proof/Evidence Recording Route Gate Design v0.1

## Status

This document is design-only. It defines a future POST route gate over the
existing bounded writer/helper:

```text
createAgWorkResumeProofEvidenceRecordingFromCandidate
```

This design adds no route implementation, no UI/Cockpit controls, no schema or
migration, no writer/helper implementation changes, no proof/evidence
recording, no `verification_evidence_records` rows, no
`ag_work_resume_proof_evidence_recording_links` rows, no `action_records` rows,
no session binding, no Codex execution or continuation, no work item/event
creation, no imported context mutation, no confirmed mapping mutation, no
proposal mutation, no reconciliation candidate mutation, no approval, publish,
retry, replay, merge, auto-merge, external posting, or committed-state
authority.

The route gate design is not route implementation. The route gate design is not
approval to record. A future route implementation PR is not blanket approval to
record. Actual recording remains per-attempt user/Core gated.
`accepted_for_future_recording` is not proof/evidence recording. The helper can
record only when exact approval is supplied. The route must not weaken helper
validation.

## Larger Goal

The larger AG Resume cross-local continuity goal is to expose a recoverable,
reviewable path from accepted reconciliation candidate metadata to local
verification evidence without turning review metadata, route success, PR
review, or UI state into recording authority.

The writer/helper now owns the local transaction boundary for exactly one
`verification_evidence_records` row plus exactly one
`ag_work_resume_proof_evidence_recording_links` row. A future route should only
be a thin HTTP invocation boundary around that helper. It should make request
shape, fail-closed behavior, response shape, and status codes predictable while
preserving the helper's exact approval, validation, idempotency, and side-effect
limits.

## Route Purpose

The future route purpose is to let an authorized local caller submit one exact
AG Resume proof/evidence recording attempt to the existing writer/helper over
HTTP.

The route does not decide whether recording is approved. It does not infer
authority from the candidate lifecycle state, a user session, Cockpit UI state,
Codex context, a browser report, a merged PR, or a smoke pass. It only validates
transport-level constraints, rejects unsupported fields, delegates to the
helper, and returns the helper result with an HTTP status code.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper changes, schema/migration, proof/evidence recording, bridge rows,
verification evidence rows, action records, or broader recording authority.

## Proposed Route

Proposed route path:

```text
POST /api/ag-work-resume/proof-evidence-recordings
```

HTTP method:

```text
POST
```

Content type:

```text
application/json
```

The route must reject non-`application/json` requests before calling the helper.
It must reject invalid JSON and non-object JSON before calling the helper.

## Non-Authority Statement

The route must not grant:

- approval to record
- proof/evidence recording without exact user/Core approval
- route-derived recording authority
- UI/Cockpit authority
- action-record creation authority
- session binding authority
- Codex execution or continuation authority
- work item/event creation authority
- imported context mutation authority
- confirmed mapping mutation authority
- proposal mutation authority
- reconciliation candidate mutation authority
- approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

Route availability, route success, a returned `ok`, an idempotent response, a
PR merge, or a smoke pass must never be treated as approval for a future
recording attempt.

## Request Body Contract

The route body should mirror the external helper input contract. It should not
mirror internal test-only or process-local helper fields.

Supported fields only:

| Field | Requirement |
| --- | --- |
| `candidate_id` | Required canonical reconciliation candidate id. |
| `import_id` | Optional cross-check; if supplied, must match the candidate-derived import id. |
| `mapping_id` | Optional cross-check; if supplied, must match the candidate-derived mapping id. |
| `user_core_approval` | Required exact approval payload for this one attempt. |
| `actor` | Required explicit user/Core actor; not inferred from session, Codex, ChatGPT, Browser, MCP, or GitHub context. |
| `reason` | Required bounded recording reason. |
| `redaction_summary` | Required public-safe JSON object matching the approval payload. |
| `trust_provenance_label` | Required allowlisted trust/provenance label. |
| `local_target_scope` | Required expected local target scope, cross-checked by the helper. |
| `local_target_work_id` | Required expected local target work id, cross-checked by the helper. |
| `expected_idempotency_key` | Optional cross-check; if supplied, must match the helper-derived key and approval payload. |

The route must reject unsupported fields. The route must not accept `db`, `now`,
or any field that attempts to choose implementation internals. The future route
implementation may let the helper use its own timestamp behavior; it must not
let HTTP callers supply a database handle or route-local clock override.

## Forbidden Fields

The route must reject requests containing fields that attempt to add unrelated
control, authority, or mutation paths. Forbidden examples include:

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

The route may accept the required `user_core_approval` payload, but that payload
is only the helper's exact per-attempt recording authorization input. It is not
publication approval, retry authority, replay authority, merge authority, or
route implementation authority.

## Exact User/Core Approval Payload Requirement

The route must require `user_core_approval` and pass it to the helper without
weakening or replacing helper validation.

The approval payload must exactly match the candidate, imported context,
confirmed mapping, local target, idempotency key, actor, reason, redaction
summary, trust/provenance label, and allowed/forbidden side effects for this
attempt. The route must not infer or synthesize approval from:

- authentication/session context
- Cockpit UI state
- ChatGPT, Codex, Browser, MCP, or GitHub context
- candidate status
- a previous successful route response
- idempotent replay state
- PR state

## Candidate Canonical Input And Cross-Checks

`candidate_id` is the canonical input. The route should forward optional
`import_id`, `mapping_id`, and `expected_idempotency_key` only as cross-checks.

The helper remains responsible for re-reading the candidate, deriving the
canonical source rows and idempotency key, and failing closed on mismatch.
The route must not precompute a substitute idempotency key, select alternate
source rows, or bypass candidate/import/mapping/local-target validation.

## Actor, Reason, Redaction, Trust, And Local Target

The route must require explicit `actor`, `reason`, `redaction_summary`,
`trust_provenance_label`, `local_target_scope`, and `local_target_work_id`.

The route may perform shallow request-shape checks, but the helper remains the
source of truth for:

- explicit actor validation
- bounded reason validation
- safe redaction summary validation
- allowlisted trust/provenance label validation
- local target scope/work id cross-checking
- existing local work row requirement

The route must not infer actor from an auth/session identity or route caller. If
a later route implementation has authentication, that authentication may protect
access to the route, but it is not a substitute for the explicit helper `actor`
and exact approval payload.

## Expected Idempotency Key Behavior

`expected_idempotency_key` is optional outside the approval payload. If supplied,
the route must pass it to the helper as a cross-check. If omitted, the helper
still requires the approval payload to carry the exact helper-derived key.

The route must not treat idempotency as retry, replay, publish, or merge
authority. `idempotent_no_new_write` means the same exact approved attempt was
already recorded and no new rows were created.

## Response Schema

Every response must include an `authority_boundary` object. This includes
transport-level failures that happen before the helper is called.

Route response body:

| Field | Requirement |
| --- | --- |
| `ok` | Boolean success marker. |
| `result` | Helper result name or route-level validation result. |
| `created` | Boolean; true only when the helper created rows. |
| `candidate_id` | Candidate id or null when unavailable. |
| `evidence_id` | Evidence row id on `recorded` or `idempotent_no_new_write`; otherwise null. |
| `recording_link_id` | Bridge link id on `recorded` or `idempotent_no_new_write`; otherwise null. |
| `idempotency_key` | Derived idempotency key when available. |
| `target_record_kind` | `verification_evidence` on recorded/idempotent success; otherwise null. |
| `warnings` | Bounded string array. |
| `failures` | Bounded public-safe string array. |
| `authority_boundary` | Required on every response; no forbidden side effects. |
| `recommended_next_step` | Bounded public-safe next-step string. |

The route should expose created row ids for `recorded` and existing row ids for
`idempotent_no_new_write`, because those ids are the bounded local audit result
from the helper. It must not expose raw DB internals, raw foreign payloads,
tokens, cookies, private paths, raw session payloads, raw proof payloads, raw
evidence payloads, or stack traces.

## Status Code Mapping

The future route must map helper results to HTTP status codes:

| Result | HTTP status | Meaning |
| --- | ---: | --- |
| `recorded` | 201 | Exact approved attempt created one evidence row and one bridge row. |
| `idempotent_no_new_write` | 200 | Same key and same payload already recorded; no new writes. |
| `unauthorized_attempt` | 403 | Missing or mismatched exact user/Core approval. |
| `invalid_candidate` | 409 | Candidate missing, wrong state, or not eligible for recording. |
| `source_cross_check_failed` | 409 | Supplied or derived source identity does not match. |
| `missing_source_rows` | 404 | Required imported context, confirmed mapping, or local work row missing. |
| `unsafe_redaction` | 422 | Redaction summary or source redaction metadata is not safe. |
| `invalid_actor_reason` | 422 | Actor or reason is missing, inferred, or invalid. |
| `invalid_trust_provenance` | 422 | Trust/provenance label is missing or not allowlisted. |
| `duplicate_conflict` | 409 | Same key/different payload or same candidate/different key conflict. |
| `fk_or_unique_failure` | 409 | Local FK/unique conflict; transaction must roll back. |
| `db_error` | 500 | Unexpected DB failure; no raw internals in response. |

Route-level transport validation should use:

| Route-level failure | HTTP status |
| --- | ---: |
| Unsupported method | 405 |
| Unsupported content type | 415 |
| Invalid JSON | 400 |
| Non-object JSON | 400 |
| Unsupported or forbidden field | 400 |

## Fail-Closed Behavior

The route must fail closed before helper invocation when transport or request
shape is invalid. The route must fail closed through helper results when source,
approval, redaction, trust, idempotency, duplicate, FK/unique, or DB checks
fail.

Failure responses must create no:

- verification evidence rows
- bridge rows
- action records
- session rows or bindings
- work items
- work events
- imported context mutations
- confirmed mapping mutations
- proposal mutations
- reconciliation candidate mutations
- approval/publication/delivery rows
- external posts
- committed-state changes

## Helper-Only Delegation

The route must call only
`createAgWorkResumeProofEvidenceRecordingFromCandidate` for recording behavior.
It must not duplicate or weaken helper validation. It must not call:

- Codex helpers
- session bind helpers
- action-record writers
- work item/event writers
- imported context writers
- confirmed mapping writers
- proposal writers
- reconciliation candidate lifecycle writers
- approval, publish, retry, replay, merge, auto-merge, or external-posting
  helpers
- external network APIs

The route must not call `fetch`, OpenAI APIs, GitHub APIs, browser automation,
MCP tools, or ChatGPT App tools.

## Route Smoke Expectations

A future route implementation smoke must prove:

- the route exists only in the explicitly scoped implementation PR
- `POST /api/ag-work-resume/proof-evidence-recordings` requires
  `application/json`
- invalid JSON and non-object JSON fail closed
- unsupported fields fail closed
- exact user/Core approval remains required
- route delegates to the helper and does not weaken validation
- `recorded` returns 201
- `idempotent_no_new_write` returns 200 and creates no duplicate rows
- `duplicate_conflict` returns 409 and creates no rows
- `invalid_candidate` returns 409 and creates no rows
- `unauthorized_attempt` returns 403 and creates no rows
- `source_cross_check_failed` returns 409 and creates no rows
- `missing_source_rows` returns 404 and creates no rows
- `unsafe_redaction`, `invalid_actor_reason`, and
  `invalid_trust_provenance` return 422 and create no rows
- `fk_or_unique_failure` returns 409 and rolls back
- `db_error` returns 500 with public-safe bounded failure text
- every response includes `authority_boundary`
- no Codex, external network, session/work/action/source-row/approval/publish,
  retry, replay, merge, auto-merge, external posting, or committed-state
  authority is added

This design-only PR smoke should verify only the document boundary and changed
file boundary. It must not add a route implementation or call the helper to
record proof/evidence.

## Future Route Implementation Verification Matrix

| Area | Required proof |
| --- | --- |
| Transport | Method, content type, invalid JSON, non-object JSON, and unsupported-field failures. |
| Delegation | Static or direct test proof that recording behavior calls only the helper. |
| Success | 201 response, exactly one evidence row, exactly one bridge row. |
| Idempotency | 200 response with no new rows for same key/same payload. |
| Duplicate conflicts | 409 response with no rows for same key/different payload and same candidate/different key. |
| Candidate/source failures | 409 or 404 responses with no rows and no source mutations. |
| Approval failures | 403 response with no rows and no inferred approval. |
| Redaction/trust/actor failures | 422 responses with no rows and bounded public-safe failures. |
| FK/unique failures | 409 response, rollback, no partial writes. |
| DB errors | 500 response, no raw internals, no partial writes. |
| Authority | Protected table counts unchanged except the two allowed rows on `recorded`. |
| Network | No `fetch`, OpenAI, GitHub, MCP, Browser, or external network call. |
| Browser | Not required unless UI/Cockpit/browser surface is added in a separate PR. |

## Future PR Sequence

1. Route gate design PR: this document only.
2. Route implementation PR: add the POST route only after this design is
   accepted, with smoke/DB proof and no UI.
3. Read-surface PR, if needed: show existing evidence/bridge links without new
   recording controls.
4. UI/Cockpit route invocation design PR, if needed.
5. UI/Cockpit implementation PR only after separate user/Core approval and
   browser verification.

No future route or UI PR may treat a route implementation merge as blanket
recording approval.

## Authority Boundary

This route gate design grants:

- no route implementation
- no UI/Cockpit controls
- no schema or migration
- no writer/helper implementation change
- no proof/evidence recording
- no bridge rows created
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

Actual recording remains per-attempt user/Core gated through the helper.

## What This Enables Next

This design enables a later route implementation PR to add the smallest HTTP
invocation boundary around the existing helper, with explicit request/response
shape, status mapping, unsupported-field rejection, and route-level smoke
expectations.

It does not authorize that implementation to record without exact per-attempt
approval.

## What This Does Not Solve

This design does not solve:

- route implementation
- UI/Cockpit controls
- proof/evidence recording
- evidence row creation by this PR
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
by this design-only route gate PR.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-recording-route-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper
npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema-design
npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy
npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design
npm run smoke:ag-work-resume-review-metadata-closeout
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs
git diff --check
git diff --cached --check
```

## Proof/Evidence Recording Gate Closeout Pointer

The AG Resume Proof/Evidence Recording Gate Milestone v0.1 closeout is tracked
in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md`.

That closeout records the post-PR #354 safe stopping point: exactly one
`verification_evidence_records` row and exactly one
`ag_work_resume_proof_evidence_recording_links` row may be created in one
transaction only through exact per-attempt user/Core approval and the existing
writer/helper, route, and Cockpit gate path. It does not add action records,
session binding, Codex continuation, work item/event creation, source-row
mutation, approval, publish, retry, replay, merge, Direct Resume Code,
relay/hosted transfer, or committed-state authority.
