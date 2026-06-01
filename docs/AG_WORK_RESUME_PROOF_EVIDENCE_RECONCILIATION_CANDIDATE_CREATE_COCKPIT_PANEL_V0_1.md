# AG Work Resume Proof Evidence Reconciliation Candidate Create Cockpit Panel v0.1

## Status

This document describes the bounded Cockpit Operator create panel for AG Resume
proof/evidence reconciliation candidate review metadata.

The panel is UI-only over the existing route:

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

It adds no schema, migration, read route behavior, candidate lifecycle
transition, proof/evidence recording, session binding, Codex behavior, work
item/event creation, imported context mutation, confirmed mapping mutation,
proposal mutation, approval, publish, retry, replay, or merge authority.

## Purpose

The panel lets an operator propose one reconciliation candidate from an existing
imported context and bounded foreign ref summary. Reconciliation candidates are
review metadata only. Candidate rows are not proof/evidence, do not bind
sessions, do not execute or continue Codex, and do not become committed state
authority.
Reconciliation candidates are review metadata only.

Foreign refs remain foreign until a future separately approved reconciliation
and proof/evidence recording flow exists.

## Relationship To Existing Surfaces

- The writer contract is
  `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
- The route contract is
  `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
- The read helper/route contract is
  `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
- The read-only Cockpit review panel is
  `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.

This create panel does not call the GET read route and does not change read
route behavior.

## Route-Only POST Behavior

The create action sends exactly one route request:

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

The request uses a JSON `Content-Type` header and a JSON body built only from
supported route fields:

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
- `created_at`

The body does not include `db` or `now`. The panel does not call proof,
evidence, session, Codex, work, imported context mutation, confirmed mapping
mutation, proposal mutation, approval, publication, bridge, MCP/App, Direct
Resume Code, or relay routes.

## Local Validation

The panel validates locally before calling the route:

- `import_id` is required.
- `foreign_ref_type` is required and must be one of `proof`, `evidence`,
  `action`, `session`, `git`, `evidence_pack`, `handoff`, or `other`.
- `foreign_ref_id` is required.
- `local_target_scope` is required.
- `local_target_work_id` is required.
- `summary` is required.
- `redaction_status` JSON is required and must parse as a JSON object.
- `proposed_by` is required.
- `proposed_reason` is required.
- `created_at`, when supplied, must be ISO UTC with millisecond precision.

The route remains the canonical validator.

## Redaction Validation

`redaction_status` must explicitly include:

```json
{
  "safe": true,
  "secrets_included": false,
  "raw_db_paths_included": false,
  "session_payloads_included": false,
  "proof_payloads_included": false
}
```

Unsafe redaction metadata fails closed locally before any route call.

## Output Rendering

The result area renders:

- HTTP status
- route ok
- writer status
- `candidate_id`
- `import_id`
- `mapping_id`
- `foreign_ref_type` / `foreign_ref_id`
- `local_target_scope` / `local_target_work_id`
- `summary`
- `redaction_status`
- `proposed_by` / `proposed_reason`
- authority boundary
- warnings and failures

If a candidate record is returned, the existing candidate card renderer shows
the full candidate review metadata and record authority boundary.

## Accessibility Behavior

The panel uses native inputs, select, textarea, and buttons. Each control has a
real `label` with `htmlFor`, descriptive `aria-describedby` text, and grouped
sections with stable headings. Local and route errors render with `role="alert"`.
Result rendering uses `aria-live="polite"`.

## Authority Boundary

On successful create, the writer may set:

- `reconciliation_candidate_created: true`

In all cases the boundary remains:

- `review_metadata_only: true`
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

Candidate creation is review metadata only and is not proof/evidence,
proof/evidence recording, session binding, Codex execution/continuation, work
item/event creation, imported context/confirmed mapping/proposal mutation,
approval, publish, retry, replay, or merge authority.

## Non-Goals

- No schema or migration.
- No read route behavior change.
- No create of proof/evidence records.
- No proof/evidence recording.
- No evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No lifecycle mutation controls.
- No approve, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.
- No Direct Resume Code.
- No relay.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.

## Browser Verification Requirement

Browser verification is required because this slice changes a rendered Cockpit
Operator surface and calls the POST candidate route.

Browser verification report:

```text
reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md
```

The report covers:

- create from active imported context
- omitted `mapping_id` derives from imported context
- explicit matching `mapping_id`
- missing required local validation
- malformed `created_at` local validation
- unsafe redaction local validation
- `imported_context_not_found`
- `imported_context_not_allowed`
- `imported_context_mismatch`
- duplicate candidate
- clear after success/error
- network proof
- DB side-effect proof
- unauthorized controls scan
