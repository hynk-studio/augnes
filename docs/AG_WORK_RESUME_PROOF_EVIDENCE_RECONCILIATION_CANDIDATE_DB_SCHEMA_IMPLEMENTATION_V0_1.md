# AG Work Resume Proof Evidence Reconciliation Candidate DB Schema Implementation v0.1

## Status

This document records the AG Resume proof/evidence reconciliation candidate
schema foundation. It implements only the SQLite table and indexes for future
reconciliation candidate review metadata.

This is schema foundation only.

This schema foundation originally added no candidate writer/helper and no
candidate read helper/route. Later candidate writer/helper, create route, and
read helper/GET route slices are documented separately and do not change this
schema foundation. This schema foundation adds no Cockpit UI, no
proof/evidence recording, no session binding,
no Codex execution or continuation, no work item or work event creation, no
imported context mutation, no confirmed mapping mutation, no proposal
mutation, no ChatGPT App/MCP/App schema, no bridge tool, no Direct Resume
Code, no relay, no telemetry/analytics/browser persistence, and no approval,
publish, retry, replay, or merge authority.

Reconciliation candidates are review metadata only. They are not proof
records, not evidence records, not session bindings, not Codex continuation,
not committed state authority, and not approval/publish/retry/replay/merge
authority. Durable approval remains user/Core gated.

## Implemented Schema Foundation

`lib/db/schema.sql` now creates:

- table: `ag_work_resume_proof_evidence_reconciliation_candidates`
- indexes:
  - `idx_ag_reconciliation_candidates_import_time`
  - `idx_ag_reconciliation_candidates_mapping_time`
  - `idx_ag_reconciliation_candidates_foreign_ref`
  - `idx_ag_reconciliation_candidates_local_target_time`
  - `idx_ag_reconciliation_candidates_status_time`
  - `idx_ag_reconciliation_candidates_proposed_by_time`
  - `idx_ag_reconciliation_candidates_reviewed_by_time`
  - `idx_ag_reconciliation_candidates_supersedes`
  - `idx_ag_reconciliation_candidates_superseded_by`

The table and indexes use `CREATE ... IF NOT EXISTS`, so empty DB migration and
repeat migration are idempotent.

The schema creates no reconciliation candidate rows during migration. It
creates no imported context rows, proof/evidence records, session rows, work
items, work events, confirmed mapping rows, proposal rows, route, writer,
helper, UI, Codex, approval, publish, retry, replay, or merge behavior.

The later read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only the existing GET reconciliation candidates route and adds no
schema/migration, row creation, create/update/delete controls, lifecycle,
proof/evidence/session behavior, Codex authority, work item/event creation,
imported context/confirmed mapping/proposal mutation, approval, publish,
retry, replay, or merge authority.

## Implemented Table

Implemented table name:
`ag_work_resume_proof_evidence_reconciliation_candidates`.

Implemented columns, in order:

- `candidate_id TEXT PRIMARY KEY`
- `record_kind TEXT NOT NULL CHECK record_kind = ag_work_resume_proof_evidence_reconciliation_candidate`
- `schema TEXT NOT NULL CHECK schema = augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1`
- `status TEXT NOT NULL CHECK status IN proposed, accepted_for_future_recording, rejected, deferred, superseded, withdrawn, revoked`
- `import_id TEXT NOT NULL`
- `mapping_id TEXT NOT NULL`
- `foreign_ref_type TEXT NOT NULL CHECK foreign_ref_type IN proof, evidence, action, session, git, evidence_pack, handoff, other`
- `foreign_ref_id TEXT NOT NULL`
- `local_target_scope TEXT NOT NULL`
- `local_target_work_id TEXT NOT NULL`
- `summary TEXT NOT NULL`
- `redaction_status TEXT NOT NULL DEFAULT '{}'`
- `proposed_by TEXT NOT NULL`
- `proposed_reason TEXT NOT NULL`
- `reviewed_by TEXT`
- `reviewed_at TEXT`
- `review_note TEXT`
- `supersedes_candidate_id TEXT`
- `superseded_by_candidate_id TEXT`
- `authority_boundary TEXT NOT NULL DEFAULT '{}'`
- `created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
- `updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`

Implemented status values:

- `proposed`
- `accepted_for_future_recording`
- `rejected`
- `deferred`
- `superseded`
- `withdrawn`
- `revoked`

`accepted_for_future_recording` is not proof/evidence recording. It is still a
candidate lifecycle value for review metadata only.

## JSON Text Fields

The implemented JSON text fields are:

- `redaction_status`
- `authority_boundary`

The schema stores these as `TEXT`. Future writer/helper code must validate
bounded object shapes before persistence.

## Foreign-Key Policy

This schema foundation does not add database-level foreign keys from:

- `import_id` to `ag_work_resume_imported_contexts(import_id)`
- `mapping_id` to `ag_work_resume_confirmed_mappings(mapping_id)`

This follows
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
The table is a schema foundation for review metadata only. Cross-table
authority checks remain future writer responsibilities, and no writer is
implemented in this slice.

Future writer validation must require:

- imported context exists
- imported context status is allowed for reconciliation
- `mapping_id` matches the imported context
- local target work identity exists
- redaction status is safe
- foreign ref is a bounded summary, not a raw payload
- actor is present
- reason is present
- duplicate candidate policy is explicitly designed and enforced

The candidate read helper/GET route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
It reads candidate review metadata only and does not change this schema
foundation, record proof/evidence, bind sessions, execute Codex, create work
items/events, mutate imported contexts, confirmed mappings, or proposals, or
grant approval, publish, retry, replay, or merge authority.

## Idempotent Migration Behavior

The schema foundation uses idempotent SQL:

- `CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_reconciliation_candidates`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_import_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_mapping_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_foreign_ref`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_local_target_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_status_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_proposed_by_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_reviewed_by_time`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_supersedes`
- `CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_superseded_by`

Running `npm run db:migrate` more than once should leave the table and indexes
present without creating rows or changing other AG Resume authority behavior.

## Status And Lifecycle Caveat

The implemented status column is a schema constraint only. No status creates
proof/evidence, binds a session, executes Codex, creates work items/events,
mutates imported contexts, mutates confirmed mappings, mutates proposals, or
grants approval, publish, retry, replay, or merge authority.

`proposed` is candidate review metadata. `accepted_for_future_recording` means
accepted for possible future proof/evidence recording design; it does not
record proof/evidence. `rejected`, `deferred`, `superseded`, `withdrawn`, and
`revoked` are inactive or non-recording states.

Lifecycle writers, readers, routes, or UI, if ever implemented, require
separate design and user/Core approval.

## Authority Boundary

The implemented table stores reconciliation candidate review metadata only.

- No reconciliation candidate rows are created during migration.
- No proof/evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No candidate writer/helper.
- No candidate read helper/route.
- No Cockpit UI.
- No ChatGPT App/MCP/App schema.
- No bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

- No candidate writer/helper.
- No candidate read helper/route.
- No Cockpit UI.
- No proof/evidence implementation.
- No proof/evidence recording.
- No session implementation.
- No session binding.
- No Codex implementation.
- No Codex behavior.
- No work item/event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future Work

Future candidate writer/helper work must validate imported context, mapping,
local work, redaction status, actor/reason, and duplicate candidate policy
before any row creation behavior exists.

The candidate writer/helper is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
It creates one proposed candidate review metadata row from an imported context
and bounded foreign ref summary, and it adds no route/UI, proof/evidence
recording, session binding, Codex behavior, work item/event creation, imported
context mutation, confirmed mapping/proposal mutation, approval, publish,
retry, replay, or merge authority.

The candidate create route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
It delegates to the shared writer core and creates candidate review metadata
rows only; it adds no Cockpit UI, schema/migration, proof/evidence recording,
session binding, Codex behavior, work item/event creation, imported
context/confirmed mapping/proposal mutation, approval, publish, retry, replay,
or merge authority.

The candidate lifecycle action contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`.
It uses the existing candidate lifecycle columns and status values, including
`accepted_for_future_recording`, as review metadata only. It adds no schema or
migration and does not record proof/evidence.

Future actual proof/evidence recording remains separately approved. Session
binding and Codex continuation remain separate gates. Approval, publish, retry,
replay, and merge remain separate user/Core or review-gated decisions.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this schema-only proof/evidence reconciliation candidate slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-create-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs
```
