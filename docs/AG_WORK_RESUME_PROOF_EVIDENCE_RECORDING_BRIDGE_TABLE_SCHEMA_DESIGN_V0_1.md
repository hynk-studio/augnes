# AG Resume Proof/Evidence Recording Bridge Table Schema Design v0.1

## Status

This document is design-only. It defines the future bridge-table schema for
linking AG Resume reconciliation candidate review metadata to local
proof/evidence records after a later schema/migration PR is explicitly
approved.

This bridge table schema design adds no runtime behavior, adds no schema or migration, modifies no `lib/db/schema.sql`, adds no writer, helper, route, UI,
browser report, proof/evidence recording, `verification_evidence_records` row
creation, `action_records` row creation, session binding, Codex execution or
continuation, work item/event creation, imported context mutation, confirmed
mapping mutation, proposal mutation, reconciliation candidate mutation,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state authority.

The bridge table is not proof/evidence recording by itself. A bridge schema design is not approval to record. A future schema/migration PR is not approval to record. Actual proof/evidence recording remains separately user/Core gated. `accepted_for_future_recording` is not proof/evidence recording.

## Purpose

The schema/integration policy in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`
recommends a future bridge table from reconciliation candidate ids to local
proof/evidence ids, with the first target narrowed to one
`verification_evidence_records` row.

This document designs that bridge table so a later schema/migration PR can be
reviewed against explicit column, constraint, index, foreign-key,
idempotency, immutability, and side-effect expectations. It does not implement
the table.

## Related Gate Context

This bridge-table schema design follows and preserves these controlling docs:

- `docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
- `docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`

Those docs remain controlling for review-metadata, mapping/import,
proof/evidence/session/Codex, reconciliation, candidate lifecycle, recording
gate, and schema/integration policy boundaries. This document only designs a
future bridge-table schema.

The bridge-table migration/DDL policy is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`.
It is design-only and documents future DDL/migration expectations without
modifying `lib/db/schema.sql`, adding migration files, creating the bridge
table, recording proof/evidence, creating evidence/action rows, binding
sessions, continuing Codex, or granting approval/publish/retry/replay/merge
authority.

The schema-only implementation adds
`ag_work_resume_proof_evidence_recording_links` to `lib/db/schema.sql` as an
empty table with indexes. It creates no bridge rows, creates no
`verification_evidence_records` rows, creates no `action_records` rows, adds no
writer/helper/route/UI, and does not authorize actual proof/evidence recording.

The writer/helper gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and defines the future helper contract for one separately
approved candidate-to-evidence recording attempt. It does not implement the
writer/helper or create bridge/evidence/action rows.

The proof/evidence recording route gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and defines a future POST invocation boundary over the
writer/helper. It does not implement the route, add UI/Cockpit controls,
change schema, mutate source rows, or authorize recording.

## Proposed Table

Proposed table name:

```text
ag_work_resume_proof_evidence_recording_links
```

Proposed record kind:

```text
ag_work_resume_proof_evidence_recording_link
```

Proposed schema label:

```text
augnes.ag_work_resume_proof_evidence_recording_link.v0_1
```

The table is a local immutable link from one reviewed reconciliation candidate
to one future local evidence record for the first implementation. It is not a
candidate lifecycle table, not an imported context table, not a confirmed
mapping table, not a proposal table, not an approval table, not a work event
table, and not proof/evidence recording authority by itself.

## Non-Authority Statement

The bridge table stores linkage and audit metadata after a separately approved
recording attempt has already been authorized and successfully written. It does
not authorize the recording attempt.

The table must not be used to infer:

- approval to record
- proof/evidence existence before a target evidence row exists
- session binding
- Codex continuation
- work item/event creation
- imported context mutation
- confirmed mapping mutation
- proposal mutation
- reconciliation candidate mutation
- approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

## Relationship To Reconciliation Candidate Rows

The bridge row references one row in
`ag_work_resume_proof_evidence_reconciliation_candidates`.

For the first implementation:

- `candidate_id` is required and unique.
- The referenced candidate must be in `accepted_for_future_recording`.
- `accepted_for_future_recording` is necessary but not sufficient.
- The bridge writer must re-read the candidate at recording time.
- The bridge writer must not mutate the candidate row.
- The bridge writer must not mark the candidate recorded by changing
  candidate lifecycle fields.
- Any future many-records-per-candidate policy requires a separate design.

Decision: one candidate can have more than one recording link? No. The first
implementation must enforce one candidate to at most one bridge link through a
unique `candidate_id` constraint.

## Relationship To Imported Context Rows

The bridge row carries the source `import_id` from
`ag_work_resume_imported_contexts`.

For the first implementation:

- `import_id` is required.
- The imported context must exist.
- The imported context must still be allowed for recording by the future
  writer policy.
- The bridge writer must re-read imported context at recording time.
- The bridge writer must not mutate imported context rows.
- Redaction summary and provenance must be copied only as bounded public-safe
  metadata, not raw imported payloads.

Imported context, confirmed mapping, and candidate rows are never mutated by bridge behavior.

## Relationship To Confirmed Mapping Rows

The bridge row carries the source `mapping_id` from
`ag_work_resume_confirmed_mappings`.

For the first implementation:

- `mapping_id` is required.
- The confirmed mapping must exist.
- The confirmed mapping must connect the candidate's foreign work identity to
  the intended local target work identity.
- The bridge writer must re-read confirmed mapping at recording time.
- The bridge writer must not mutate confirmed mapping rows.
- The mapping is not approval to record.

## Relationship To Verification Evidence Records

The first target path is one `verification_evidence_records` row.

For the first implementation:

- `target_record_kind` is required and must be `verification_evidence`.
- `target_evidence_id` is required and non-null.
- `target_evidence_id` must be unique.
- The bridge row must be created in the same transaction as the
  `verification_evidence_records` row.
- The bridge row must not be created before recording as a placeholder row.
- If the evidence row creation fails, the bridge row must not exist.
- If the bridge row creation fails, the evidence row must roll back.

Decision: is `target_evidence_id` nullable before recording or non-null after
recording? It is non-null in the first implementation because the table stores
only completed recording links, not pending placeholders.

Decision: is this table created before or in the same transaction as the
verification evidence row in a later implementation? The table exists after a
future schema/migration PR, but each bridge row is created in the same
transaction as its target `verification_evidence_records` row.

## Optional Future Relationship To Action Records

The first implementation excludes `action_records`.

For the first implementation:

- `target_action_id` is nullable.
- `target_action_id` must be `NULL`.
- No `action_records` row is created.
- No proof/action-record target is created.
- No split proof/evidence recording is created.

Action records are out of first implementation scope unless separately approved.
A later design may widen `target_record_kind`, `target_action_id`, uniqueness,
read surfaces, and rollback behavior for proof/action-record targets.

## Proposed Columns

| Column | Nullability | Proposed constraint | Purpose |
| --- | --- | --- | --- |
| `recording_link_id` | `NOT NULL` | primary key | Stable bridge row id. |
| `record_kind` | `NOT NULL` | equals `ag_work_resume_proof_evidence_recording_link` | Row kind guard. |
| `schema` | `NOT NULL` | equals `augnes.ag_work_resume_proof_evidence_recording_link.v0_1` | Schema/version guard. |
| `candidate_id` | `NOT NULL` | unique, FK candidate policy | Source reconciliation candidate. |
| `import_id` | `NOT NULL` | FK imported context policy | Source imported context. |
| `mapping_id` | `NOT NULL` | FK confirmed mapping policy | Source confirmed mapping. |
| `local_target_scope` | `NOT NULL` | non-empty text | Local target scope copied from candidate/import context. |
| `local_target_work_id` | `NOT NULL` | non-empty text | Local target work id copied from candidate/import context. |
| `target_record_kind` | `NOT NULL` | equals `verification_evidence` for first implementation | Local target kind. |
| `target_evidence_id` | `NOT NULL` | unique, FK `verification_evidence_records(evidence_id)` policy | Local evidence target id. |
| `target_action_id` | nullable | must be `NULL` for first implementation | Reserved future proof/action target id. |
| `idempotency_key` | `NOT NULL` | unique, non-empty text | Duplicate-write protection. |
| `actor` | `NOT NULL` | non-empty text | Explicit user/Core actor for the recording attempt. |
| `reason` | `NOT NULL` | non-empty bounded text | Explicit reason for the recording attempt. |
| `redaction_summary` | `NOT NULL` | bounded JSON object text | Public-safe redaction summary. |
| `trust_provenance_label` | `NOT NULL` | conservative label allowlist | Trust/provenance classification. |
| `provenance_json` | `NOT NULL` | bounded JSON object text | Structured source and target provenance. |
| `recording_status` | `NOT NULL` | equals `recorded` for first implementation | Completed link status. |
| `failure_reason` | nullable | must be `NULL` for first implementation | Reserved only for separately designed failure audit. |
| `created_at` | `NOT NULL` | ISO UTC timestamp default | Creation timestamp. |
| `updated_at` | `NOT NULL` | equals `created_at` in first implementation | Timestamp reserved for future status extensions. |

## Nullable Vs Non-Nullable Policy

Non-null in the first implementation:

- `recording_link_id`
- `record_kind`
- `schema`
- `candidate_id`
- `import_id`
- `mapping_id`
- `local_target_scope`
- `local_target_work_id`
- `target_record_kind`
- `target_evidence_id`
- `idempotency_key`
- `actor`
- `reason`
- `redaction_summary`
- `trust_provenance_label`
- `provenance_json`
- `recording_status`
- `created_at`
- `updated_at`

Nullable in the first implementation:

- `target_action_id`, which must remain `NULL`
- `failure_reason`, which must remain `NULL`

There are no pending bridge rows in the first implementation. A row exists only
after the future recording transaction has successfully created its target
`verification_evidence_records` row.

## Target Record Kind Fields

`target_record_kind` should be constrained to `verification_evidence` for the
first implementation.

The first implementation must not allow:

- `action_record`
- `proof_action`
- `split_proof_and_evidence`
- `session`
- `work_event`
- any external or hosted target kind

A later design may add new target kinds only after separately approving target
semantics, side effects, rollback behavior, read surfaces, and smokes.

## Target Evidence ID Field

`target_evidence_id` is required and unique for the first implementation.

Decision: must `target_evidence_id` be unique? Yes. One local evidence row may
be linked by at most one bridge row.

Decision: is `target_evidence_id` nullable? No. The first implementation does
not create pending or failed bridge rows.

The target evidence row should mirror public-safe provenance in its `metadata`,
but the bridge table is the canonical candidate-to-evidence linkage.

## Optional Target Action ID Field

`target_action_id` is nullable and must be null for the first implementation.

Decision: are action records excluded from the first implementation? Yes.
`action_records` are excluded from the first implementation unless a later
design explicitly adds them.

If a future design adds action-record support, it must decide whether
`target_action_id` is unique, whether `target_record_kind` expands, whether
split evidence/action writes are allowed, and how action rows remain separate
from session binding and Codex continuation.

## Unique Constraints

The future schema/migration PR should propose these uniqueness rules:

- primary key on `recording_link_id`
- unique `candidate_id`
- unique `idempotency_key`
- unique `target_evidence_id`
- optional unique `target_action_id` only if a later action-record design
  allows non-null action targets

Decision: can one candidate have more than one recording link? No. The first
implementation uses unique `candidate_id`.

Decision: can one idempotency key map to more than one link? No. The first
implementation uses unique `idempotency_key`.

Decision: must candidate_id be unique for the first implementation? Yes.

## Indexes

The future schema/migration PR should propose indexes for:

- `candidate_id`
- `import_id, created_at DESC`
- `mapping_id, created_at DESC`
- `local_target_scope, local_target_work_id, created_at DESC`
- `target_evidence_id`
- `idempotency_key`
- `recording_status, created_at DESC`
- `actor, created_at DESC`
- `trust_provenance_label, created_at DESC`

Unique constraints may satisfy some lookup needs, but named indexes should
support read surfaces that list links by source import, mapping, local work,
actor, status, or provenance label.

## Foreign Key Policy

The future schema/migration PR should prefer database-level foreign keys where
the target tables are stable:

- `candidate_id` references
  `ag_work_resume_proof_evidence_reconciliation_candidates(candidate_id)`
- `import_id` references `ag_work_resume_imported_contexts(import_id)`
- `mapping_id` references `ag_work_resume_confirmed_mappings(mapping_id)`
- `target_evidence_id` references
  `verification_evidence_records(evidence_id)`
- `target_action_id` references `action_records(id)` only in a later design
  that allows non-null action targets

If a later migration finds one of those foreign keys incompatible with the
existing SQLite migration model, it must explain the exception and replace it
with explicit writer validation plus smoke coverage.

## Cascade/Delete Policy

No cascade deletes.

The future schema should use restrict/no-action semantics:

- deleting a candidate with a bridge row must fail
- deleting an imported context with a bridge row must fail
- deleting a confirmed mapping with a bridge row must fail
- deleting a verification evidence row with a bridge row must fail
- deleting or replacing a bridge row is out of scope

Bridge rows are audit linkage. They are not cleanup hints and must not be
removed by source row lifecycle changes.

## Idempotency Key Policy

The idempotency key must live in `idempotency_key` under a unique constraint.
The evidence row may mirror the key in metadata for read surfaces, but the
bridge table is canonical.

Recommended key shape:

```text
actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:verification_evidence
```

Same key and same payload may return an idempotent no-new-write result. Same key with different payload must fail closed. Same candidate with a different key must fail closed.

Idempotency is not retry, replay, publish, or merge authority. It only
prevents duplicate local writes.

## Actor And Reason Fields

`actor` is required. It must identify the explicit user/Core actor for the
exact recording attempt. It must not be inferred from Codex, ChatGPT, a session
id, a route success, a PR, a smoke pass, or a candidate row alone.

`reason` is required. It must be bounded human-readable text explaining why
this candidate is being recorded as local verification evidence.

The evidence row should mirror the actor in `created_by` and mirror a bounded
reason in `result_summary` or `metadata`, but the bridge table is the canonical
recording-link audit location.

## Redaction Summary Fields

`redaction_summary` is required as bounded JSON object text.

It must confirm, at minimum:

- no secrets included
- no raw DB paths included
- no raw session payloads included
- no raw proof payloads included
- no raw evidence payloads included
- no raw foreign payloads copied into the local evidence record

The bridge row must store only public-safe redaction summary. Raw payloads,
tokens, credentials, cookies, absolute private paths, and unredacted command
output remain forbidden.

## Trust/Provenance Label Fields

`trust_provenance_label` is required.

The first implementation should prefer a conservative label such as:

```text
foreign_summary_user_core_attested
```

Allowed labels should be an explicit allowlist in the future writer/helper
design. The label is metadata, not approval, and must not bypass actor, reason,
redaction, mapping, idempotency, or user/Core approval checks.

## Provenance JSON Fields

`provenance_json` is required as bounded JSON object text.

It should include:

- source runtime or packet identity
- source packet id and packet hash
- source imported context id
- source confirmed mapping id
- source reconciliation candidate id
- foreign ref type and id
- local target scope and work id
- target evidence id
- target record kind
- actor
- reason summary
- redaction summary ref or hash
- trust/provenance label
- authority boundary summary

`provenance_json` must not include raw foreign payloads, secrets, raw DB paths,
raw session payloads, raw proof payloads, or raw evidence payloads.

## Status Model

The first implementation should use one status:

```text
recorded
```

`recording_status` should be `recorded` for every first-implementation row.
The table should not contain `pending`, `failed`, `revoked`, `superseded`, or
`deleted` rows in the first implementation.

Failure attempts should roll back and create no bridge row. A future failure
audit design may add failure rows or another table, but this design does not
authorize that behavior.

## Rollback And Failure Fields

`failure_reason` is nullable and must be null for first-implementation rows.

The field is reserved only so a later design can decide whether failure audit
belongs in this table or another table. The first implementation must not write
failure rows, partial rows, pending rows, or failure-only metadata rows.

Failure behavior:

- no bridge row
- no evidence row
- no action record
- no work item/event
- no session binding
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no reconciliation candidate mutation
- no approval/publication/delivery row

## Created/Updated Timestamp Policy

`created_at` is required and should use the repo's ISO UTC timestamp style.

`updated_at` is required for consistency with AG Resume tables, but in the
first implementation it should equal `created_at` and never change. If future
status expansion allows updates, that later design must identify exactly which
fields can change and why.

## Immutable Vs Mutable Fields

Immutable in the first implementation:

- every proposed column

Mutable in the first implementation:

- none

Bridge behavior must never mutate imported context rows, confirmed mapping
rows, reconciliation candidate rows, proposal rows, verification evidence rows,
action records, session rows, work rows, publication rows, or delivery rows
outside the single explicitly approved evidence-row-and-bridge-row recording
transaction.

## Allowed Future Writer Behavior

A later writer/helper implementation may, after separate approval:

- validate the candidate is `accepted_for_future_recording`
- validate imported context and confirmed mapping still match
- validate actor, reason, redaction, trust/provenance, and idempotency
- create one `verification_evidence_records` row
- create one `ag_work_resume_proof_evidence_recording_links` row
- do both writes in one transaction
- return an idempotent no-new-write result for same key and same payload
- fail closed for duplicate, mismatched, unsafe, or stale inputs

That later behavior still requires explicit user/Core approval for the exact
recording attempt.

## Disallowed Side Effects

The bridge table and future first writer must not:

- create `action_records`
- create proof/action records
- create more than one evidence row
- create more than one bridge row for a candidate
- create pending bridge rows
- create failed bridge rows
- bind sessions
- execute or continue Codex
- create work items/events
- mutate imported context rows
- mutate confirmed mapping rows
- mutate proposal rows
- mutate reconciliation candidate rows
- approve, publish, retry, replay, merge, auto-merge, externally post, or
  mutate committed state

Approval/publish/retry/replay/merge remains out of scope. Session binding and Codex continuation remain out of scope.

## Read-Surface Implications

The bridge table enables future read surfaces to show:

- candidate id
- imported context id
- confirmed mapping id
- local target work id
- target evidence id
- idempotency key hash or public-safe id
- actor
- reason summary
- redaction summary
- trust/provenance label
- created timestamp

Read surfaces must distinguish:

- candidate review metadata
- bridge/link metadata
- actual local verification evidence row
- user/Core approval requirement

Read surfaces must not add write controls, session controls, Codex controls,
approval controls, publish controls, retry/replay controls, merge controls, or
auto-merge controls in this design.

## Migration Risk

Migration risk is medium.

The table is narrow and local, but it introduces durable linkage among AG
Resume candidate, imported context, confirmed mapping, and verification
evidence tables. Risks to handle in a later schema/migration PR:

- foreign-key compatibility with existing SQLite migration patterns
- unique constraint behavior for candidate id and idempotency key
- exact timestamp default consistency
- JSON text validation responsibility
- preventing placeholder or failed rows
- preventing cascade deletion
- preserving existing candidate/import/mapping/proposal behavior

The migration must create no rows and must not touch existing data.

## Validation Expectations For Later Schema/Migration PR

A later schema/migration PR must verify:

- `lib/db/schema.sql` contains the table only when that PR is explicitly scoped
- migration is idempotent
- empty DB migration creates the table and indexes
- repeated migration is no-op
- no bridge rows are created by migration
- no `verification_evidence_records` rows are created by migration
- no `action_records` rows are created by migration
- no imported context rows are mutated
- no confirmed mapping rows are mutated
- no proposal rows are mutated
- no reconciliation candidate rows are mutated
- no session/work/publication/delivery rows are created or mutated
- unique `candidate_id`, unique `idempotency_key`, and unique
  `target_evidence_id` constraints exist
- action-record columns remain null/out of scope for first implementation
- cascade deletes are not enabled

## Smoke Expectations For Later Implementation PR

A later writer/helper implementation PR must include smoke coverage for:

- successful one-candidate to one-evidence-row link creation
- same idempotency key and same payload returns no-new-write behavior
- same idempotency key with different payload fails closed
- same candidate with different idempotency key fails closed
- missing imported context fails closed
- missing confirmed mapping fails closed
- candidate not in `accepted_for_future_recording` fails closed
- unsafe redaction fails closed
- missing actor fails closed
- missing reason fails closed
- `target_action_id` remains null
- `action_records` count is unchanged
- session count/bindings are unchanged
- work item/event counts are unchanged
- imported context, confirmed mapping, proposal, and candidate rows are not
  mutated
- failure paths leave no partial bridge or evidence rows
- no network, GitHub, OpenAI, publish, retry, replay, merge, or Codex execution
  calls occur

## Authority Boundary

This bridge-table schema design grants:

- no runtime behavior
- no schema or migration
- no `lib/db/schema.sql` modification
- no writer, helper, route, or UI
- no browser report
- no proof/evidence recording
- no `verification_evidence_records` row creation
- no `action_records` row creation
- no session binding
- no Codex execution or continuation
- no work item creation
- no work event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no reconciliation candidate mutation
- no approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

Actual proof/evidence recording remains separately user/Core gated.

## Non-Goals

- No runtime behavior.
- No schema or migration.
- No `lib/db/schema.sql` modification.
- No writer/helper/route/UI.
- No browser report.
- No proof/evidence recording.
- No `verification_evidence_records` row creation.
- No `action_records` row creation.
- No session binding.
- No Codex execution or continuation.
- No work item/event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No reconciliation candidate mutation.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

Browser verification skipped: no runtime/UI/Cockpit/browser files changed in
this design-only bridge-table schema design PR.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper behavior changes, schema/migration, proof/evidence recording,
bridge rows, verification evidence rows, action records, or broader recording
authority.

## Verification

Run:

```bash
npm run typecheck
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
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs
node --check scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs
node --check scripts/smoke-ag-work-resume-review-metadata-closeout.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs
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
