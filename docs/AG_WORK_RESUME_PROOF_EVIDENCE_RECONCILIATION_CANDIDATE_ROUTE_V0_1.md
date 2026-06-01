# AG Work Resume Proof Evidence Reconciliation Candidate Route v0.1

## Purpose

This document records the AG Resume proof/evidence reconciliation candidate
create route. The route creates reconciliation candidate review metadata rows
only by delegating to
`createAgWorkResumeProofEvidenceReconciliationCandidate`.
The route creates reconciliation candidate review metadata rows only.

Candidate rows are not proof/evidence. The route does not record
proof/evidence. The route does not bind sessions. The route does not execute
Codex. The route does not create work items/events. The route does not mutate
imported context rows, confirmed mapping rows, or proposal rows. The route
adds no UI and does not approve, publish, retry, replay, or merge.
The route does not execute Codex. The route adds no UI.

Foreign refs remain foreign until explicitly reconciled through a separately
approved user/Core gate. Reconciliation candidate rows remain bounded review
metadata only.

## Relationship To Writer Schema And Gate Docs

This route follows:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`

The route adds a JSON-only HTTP surface over the existing shared writer core.
It does not change writer validation, schema, imported context behavior,
proof/evidence reconciliation authority, session binding, Codex continuation,
approval, publish, retry, replay, or merge behavior.

The later read-only GET route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
It lists or fetches candidate review metadata only and preserves this existing
POST create route behavior.

The later read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only the existing GET route and grants no create/update/delete,
lifecycle, proof/evidence/session, Codex, work item/event creation, imported
context/confirmed mapping/proposal mutation, schema/migration, approval,
publish, retry, replay, or merge authority.

The later bounded Cockpit Operator create panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only this existing POST route and does not add schema/migration,
proof/evidence/session, Codex, work item/event creation, imported
context/confirmed mapping/proposal mutation, approval, publish, retry, replay,
or merge authority.

The candidate lifecycle action route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`.
It is a separate lifecycle endpoint that updates existing candidate review
metadata only. `accepted_for_future_recording` is not proof/evidence
recording, and the create route remains limited to proposed candidate row
creation.

## Route

Endpoint:

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

Request rules:

- Requires `content-type: application/json`.
- Invalid JSON is rejected.
- Non-object JSON bodies are rejected.
- Unknown body fields are rejected.
- HTTP bodies may not supply `db` or `now`.
- The route delegates validation, imported context checks, local target checks,
  redaction checks, duplicate checks, and insert behavior to
  `createAgWorkResumeProofEvidenceReconciliationCandidate`.

Supported body fields:

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

`route` is
`ag_work_resume_proof_evidence_reconciliation_candidates.v0_1`.

## HTTP Status Mapping

- `created` -> HTTP 201
- `invalid_input` -> HTTP 400
- `imported_context_not_found` -> HTTP 404
- `imported_context_not_allowed` -> HTTP 409
- `imported_context_mismatch` -> HTTP 409
- `redaction_blocked` -> HTTP 400
- `duplicate_candidate` -> HTTP 409
- `db_error` -> HTTP 500

## Authority Boundary

The route authority boundary is the shared writer authority boundary.

On success, `reconciliation_candidate_created` is `true` and the route creates
exactly one proposed candidate review metadata row. In all cases:

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

Reconciliation candidate creation is review metadata only and not
proof/evidence/session/Codex/merge authority.

## Non-Goals

- No Cockpit UI.
- No schema or migration.
- No POST behavior change from the read helper/GET route slice.
- No proof/evidence recording.
- No evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item/event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App/MCP/App schema.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this reconciliation candidate route slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs
node --check scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs
```
