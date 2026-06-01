# AG Work Resume Proof Evidence Reconciliation Candidate DB Schema Design v0.1

## Status

This document is design-only. It defines a future DB/schema contract for AG
Resume proof/evidence reconciliation candidates.

This document adds no schema implementation and no migration. This document
adds no runtime behavior, writer, helper, route, or UI. It creates no
proof/evidence records, no reconciliation candidate rows, no session bindings,
no Codex records or actions, no work items, and no work events.

This design grants no session authority, no Codex authority, no approval,
publish, retry, replay, merge, auto-merge, external posting, or committed-state
mutation authority. Durable approval remains user/Core gated.

## Purpose

Candidate schema must be designed separately before implementation because
proof/evidence reconciliation candidates sit between imported context review
metadata and any future local proof/evidence recording. A schema must preserve
the distinction between a review candidate and a local proof or evidence
record before any table, writer, helper, route, or UI exists.

This design follows the reconciliation contract in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`. It
documents a future storage shape for reconciliation candidates only. It does
not implement that storage.

Reconciliation candidates remain review metadata only. They may identify a
bounded foreign ref summary for human review, but they are not proof records,
not evidence records, not session bindings, not Codex continuation, not
committed state authority, and not approval/publish/retry/replay/merge
authority.

Foreign refs remain foreign until explicitly reconciled through a separately
approved user/Core gate. Candidate rows, if ever implemented, must not
automatically convert imported context foreign refs into local proof/evidence.

## Proposed Table

Future table name:

```text
ag_work_resume_proof_evidence_reconciliation_candidates
```

Proposed fields:

| Field | Proposed contract |
| --- | --- |
| `candidate_id` | `TEXT PRIMARY KEY` |
| `record_kind` | `TEXT CHECK record_kind = ag_work_resume_proof_evidence_reconciliation_candidate` |
| `schema` | `TEXT CHECK schema = augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1` |
| `status` | `TEXT CHECK status IN proposed, accepted_for_future_recording, rejected, deferred, superseded, withdrawn, revoked` |
| `import_id` | `TEXT NOT NULL` |
| `mapping_id` | `TEXT NOT NULL` |
| `foreign_ref_type` | `TEXT NOT NULL CHECK foreign_ref_type IN proof, evidence, action, session, git, evidence_pack, handoff, other` |
| `foreign_ref_id` | `TEXT NOT NULL` |
| `local_target_scope` | `TEXT NOT NULL` |
| `local_target_work_id` | `TEXT NOT NULL` |
| `summary` | `TEXT NOT NULL` |
| `redaction_status` | `TEXT NOT NULL DEFAULT '{}'` |
| `proposed_by` | `TEXT NOT NULL` |
| `proposed_reason` | `TEXT NOT NULL` |
| `reviewed_by` | `TEXT` |
| `reviewed_at` | `TEXT` |
| `review_note` | `TEXT` |
| `supersedes_candidate_id` | `TEXT` |
| `superseded_by_candidate_id` | `TEXT` |
| `authority_boundary` | `TEXT NOT NULL DEFAULT '{}'` |
| `created_at` | `TEXT NOT NULL` |
| `updated_at` | `TEXT NOT NULL` |

State JSON text fields:

- `redaction_status`
- `authority_boundary`

No schema is implemented in this PR.

The follow-up schema implementation is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
It creates the table and indexes only; it adds no writer/helper/route/UI,
proof/evidence recording, session binding, Codex behavior, or
approval/publish/retry/replay/merge authority.

## Proposed Indexes

Future schema implementation should consider indexes for:

- `import_id, created_at DESC`
- `mapping_id, created_at DESC`
- `foreign_ref_type, foreign_ref_id`
- `local_target_scope, local_target_work_id, created_at DESC`
- `status, created_at DESC`
- `proposed_by, created_at DESC`
- `reviewed_by, reviewed_at DESC`
- `supersedes_candidate_id`
- `superseded_by_candidate_id`

These indexes are design targets only. No index is added by this PR.

## Constraints And FK Policy

A future schema could use a foreign key from `import_id` to
`ag_work_resume_imported_contexts(import_id)` to preserve traceability to the
imported context review metadata that supplied the foreign ref summary.

A future schema could use a foreign key from `mapping_id` to
`ag_work_resume_confirmed_mappings(mapping_id)` to preserve traceability to the
active local/foreign work identity mapping.

Whether or not future schema implementation uses database-level foreign keys,
the future candidate writer must validate:

- imported context exists
- imported context status is allowed for reconciliation
- `mapping_id` matches the imported context
- local target work identity exists
- redaction status is safe
- foreign ref is a bounded summary, not a raw payload
- actor is present
- reason is present

No schema is implemented in this PR. No FK is added in this PR. No writer
validation is implemented in this PR.

The follow-up schema implementation deliberately keeps this FK policy and
requires future writer validation for imported context, mapping, local work,
redaction, actor/reason, and duplicate candidate checks.

## Status And Lifecycle Model

- `proposed` is review metadata candidate state.
- `accepted_for_future_recording` means a candidate was accepted for possible
  future proof/evidence recording design; it is not proof/evidence recording.
- `rejected` is inactive and non-recording.
- `deferred` is inactive or waiting and non-recording.
- `superseded` is inactive and non-recording.
- `withdrawn` is inactive and non-recording.
- `revoked` is inactive and non-recording.

No status creates proof/evidence. No status binds a session. No status
executes Codex. No status grants approval, publish, retry, replay, merge,
auto-merge, external posting, or committed-state authority.

Lifecycle changes, if ever implemented, require separate design. A future
lifecycle writer/helper/route/UI must remain separately scoped and must not
silently create proof/evidence, bind sessions, execute Codex, or grant
approval/publish/retry/replay/merge authority.

## Authority Boundary

Candidate rows are review metadata only.

This design grants:

- no proof/evidence recording
- no session binding
- no Codex execution
- no work item creation
- no work event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no approval, publish, retry, replay, merge, auto-merge, or external posting
- no committed state authority

Durable approval remains user/Core gated. Candidate rows, if ever implemented,
must remain review metadata and must not become proof/evidence authority.

## Non-Goals

- No schema implementation.
- No migration.
- No writer, helper, route, or UI.
- No proof/evidence implementation.
- No proof/evidence recording.
- No session implementation.
- No session binding.
- No Codex implementation.
- No Codex behavior.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future Implementation Notes

- A future schema implementation PR should add the candidate table and indexes
  only.
- The schema implementation is documented in
  `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
- A future candidate writer/helper should validate imported context, mapping,
  local work, redaction, actor/reason, and duplicate candidate policy.
- Future actual proof/evidence recording remains separately approved.
- Session/Codex gates remain separate.
- Approval, publish, retry, replay, and merge remain separate user/Core or
  review-gated decisions.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only proof/evidence reconciliation candidate schema slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
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
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs
```
