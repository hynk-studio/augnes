# AG Resume Proof/Evidence Recording Bridge Table Migration/DDL Policy v0.1

## Status

This migration/DDL policy was introduced as design-only. The schema-only
implementation follow-up may add the documented empty bridge table and indexes
to `lib/db/schema.sql`; that schema implementation still adds no writer,
helper, route, UI, browser surface, proof/evidence recording,
`verification_evidence_records` row creation, `action_records` row creation,
session binding, Codex execution or continuation, work item/event creation,
imported context mutation, confirmed mapping mutation, proposal mutation,
reconciliation candidate mutation, approval, publish, retry, replay, merge,
auto-merge, external posting, or committed-state authority.

The migration/DDL policy is not approval to record. A schema/migration PR is not approval to record. The bridge table is not proof/evidence recording by itself. Actual proof/evidence recording remains separately user/Core gated. `accepted_for_future_recording` is not proof/evidence recording.

The required table is `ag_work_resume_proof_evidence_recording_links`.

## Purpose

The bridge-table schema design in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`
defined the future link-table contract. This document narrows the future
schema/migration PR so reviewers can inspect exact DDL, constraints, indexes,
foreign-key feasibility, JSON validation expectations, reset/init behavior,
rollback policy, and proof requirements before any schema is added.

This policy preserves the evidence-first first implementation target:

- one accepted reconciliation candidate
- at most one bridge link
- exactly one future `verification_evidence_records` row
- no `action_records` target in the first implementation
- no pending placeholder bridge rows
- no mutation of imported context, confirmed mapping, proposal, or
  reconciliation candidate rows

## Related Design Inputs

- `docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
- `docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`

These documents remain controlling for authority boundaries. This policy only
defines future migration mechanics.

## Future Migration Scope

A later separately approved schema/migration PR may:

- add the table definition for
  `ag_work_resume_proof_evidence_recording_links`
- add the unique indexes and read indexes listed below
- add schema smoke coverage proving the table, constraints, and indexes exist
- update `lib/db/schema.sql` only if that PR is explicitly scoped as the
  schema/migration PR
- add migration/reset compatibility coverage if the repo has a separate
  migration path at that time

That later PR must not add writer/helper/route/UI behavior, proof/evidence
recording, evidence-row creation behavior, action-record creation behavior,
session binding, Codex continuation, work item/event creation, row mutation,
approval/publish/retry/replay/merge, auto-merge, external posting, or
committed-state authority.

The migration itself must create no rows. It must only create an empty table
and indexes.

## Schema-Only Implementation Status

The schema-only implementation adds
`ag_work_resume_proof_evidence_recording_links` and its documented indexes to
`lib/db/schema.sql`. That implementation is limited to an empty table plus
indexes. It does not create bridge rows, does not create
`verification_evidence_records` rows, does not create `action_records` rows,
and does not add any recording writer/helper/route/UI.

The writer/helper gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and defines the future helper transaction contract after the
empty bridge table exists. It creates no bridge/evidence/action rows and does
not authorize actual recording.

The proof/evidence recording route gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and defines a future `POST
/api/ag-work-resume/proof-evidence-recordings` invocation boundary over the
writer/helper. It adds no route implementation, UI/Cockpit controls, schema,
writer/helper changes, bridge rows, evidence rows, action records, or
recording authority.

The schema smoke for this implementation is:

```bash
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema
```

## Proposed Future Table

Required future table:

```text
ag_work_resume_proof_evidence_recording_links
```

Required record kind:

```text
ag_work_resume_proof_evidence_recording_link
```

Required schema label:

```text
augnes.ag_work_resume_proof_evidence_recording_link.v0_1
```

Required first implementation target:

```text
verification_evidence
```

`action_records` are out of first implementation scope unless a later design
and implementation PR explicitly widens the target policy.

## Exact Proposed CREATE TABLE DDL

The following DDL is documentation only. It must not appear in
`lib/db/schema.sql` until a later schema/migration PR is explicitly approved.

```sql
CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_recording_links (
  recording_link_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_proof_evidence_recording_link'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_proof_evidence_recording_link.v0_1'
  ),
  candidate_id TEXT NOT NULL,
  import_id TEXT NOT NULL,
  mapping_id TEXT NOT NULL,
  local_target_scope TEXT NOT NULL CHECK (
    length(trim(local_target_scope)) > 0
  ),
  local_target_work_id TEXT NOT NULL CHECK (
    length(trim(local_target_work_id)) > 0
  ),
  target_record_kind TEXT NOT NULL CHECK (
    target_record_kind = 'verification_evidence'
  ),
  target_evidence_id TEXT NOT NULL,
  target_action_id TEXT CHECK (target_action_id IS NULL),
  idempotency_key TEXT NOT NULL CHECK (
    length(trim(idempotency_key)) > 0
  ),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (
    length(trim(reason)) > 0 AND length(reason) <= 4000
  ),
  redaction_summary TEXT NOT NULL DEFAULT '{}' CHECK (
    CASE
      WHEN json_valid(redaction_summary)
      THEN json_type(redaction_summary) = 'object'
      ELSE 0
    END
  ),
  trust_provenance_label TEXT NOT NULL CHECK (
    trust_provenance_label IN ('foreign_summary_user_core_attested')
  ),
  provenance_json TEXT NOT NULL DEFAULT '{}' CHECK (
    CASE
      WHEN json_valid(provenance_json)
      THEN json_type(provenance_json) = 'object'
      ELSE 0
    END
  ),
  recording_status TEXT NOT NULL CHECK (
    recording_status = 'recorded'
  ),
  failure_reason TEXT CHECK (failure_reason IS NULL),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (updated_at = created_at),
  FOREIGN KEY (candidate_id)
    REFERENCES ag_work_resume_proof_evidence_reconciliation_candidates(candidate_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (import_id)
    REFERENCES ag_work_resume_imported_contexts(import_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (mapping_id)
    REFERENCES ag_work_resume_confirmed_mappings(mapping_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (target_evidence_id)
    REFERENCES verification_evidence_records(evidence_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
);
```

No `target_action_id` foreign key is proposed for the first implementation
because `target_action_id` must be `NULL` and `action_records` are out of first
implementation scope.

## Proposed Index DDL

The following index DDL is documentation only. The unique indexes are the
proposed SQLite form of the required uniqueness constraints.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_candidate_unique
  ON ag_work_resume_proof_evidence_recording_links(candidate_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_idempotency_unique
  ON ag_work_resume_proof_evidence_recording_links(idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_target_evidence_unique
  ON ag_work_resume_proof_evidence_recording_links(target_evidence_id);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_import_time
  ON ag_work_resume_proof_evidence_recording_links(import_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_mapping_time
  ON ag_work_resume_proof_evidence_recording_links(mapping_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_local_target_time
  ON ag_work_resume_proof_evidence_recording_links(
    local_target_scope,
    local_target_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_status_time
  ON ag_work_resume_proof_evidence_recording_links(recording_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_actor_time
  ON ag_work_resume_proof_evidence_recording_links(actor, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_trust_label_time
  ON ag_work_resume_proof_evidence_recording_links(
    trust_provenance_label,
    created_at DESC
  );
```

## Proposed Column Types

| Column | Type | First implementation policy |
| --- | --- | --- |
| `recording_link_id` | `TEXT` | Primary key. |
| `record_kind` | `TEXT` | Fixed to `ag_work_resume_proof_evidence_recording_link`. |
| `schema` | `TEXT` | Fixed to `augnes.ag_work_resume_proof_evidence_recording_link.v0_1`. |
| `candidate_id` | `TEXT` | Required source candidate id. |
| `import_id` | `TEXT` | Required source imported context id. |
| `mapping_id` | `TEXT` | Required source confirmed mapping id. |
| `local_target_scope` | `TEXT` | Required non-empty local scope. |
| `local_target_work_id` | `TEXT` | Required non-empty local work id. |
| `target_record_kind` | `TEXT` | Fixed to `verification_evidence`. |
| `target_evidence_id` | `TEXT` | Required target evidence id. |
| `target_action_id` | `TEXT` | Nullable and `NULL`-only. |
| `idempotency_key` | `TEXT` | Required non-empty unique key. |
| `actor` | `TEXT` | Required explicit user/Core actor. |
| `reason` | `TEXT` | Required bounded reason. |
| `redaction_summary` | `TEXT` | Required JSON object text. |
| `trust_provenance_label` | `TEXT` | Required conservative trust/provenance label. |
| `provenance_json` | `TEXT` | Required JSON object text. |
| `recording_status` | `TEXT` | Fixed to `recorded`. |
| `failure_reason` | `TEXT` | Nullable and `NULL`-only. |
| `created_at` | `TEXT` | Required ISO UTC timestamp. |
| `updated_at` | `TEXT` | Required and equal to `created_at` in first implementation. |

## NOT NULL Constraints

The future schema/migration PR must make these columns `NOT NULL`:

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

The only nullable columns in the first implementation are
`target_action_id` and `failure_reason`, and both must be constrained to
`NULL`.

## CHECK Constraints

The future schema/migration PR must enforce:

- `record_kind = 'ag_work_resume_proof_evidence_recording_link'`
- `schema = 'augnes.ag_work_resume_proof_evidence_recording_link.v0_1'`
- `local_target_scope` is non-empty after trim
- `local_target_work_id` is non-empty after trim
- `target_record_kind = 'verification_evidence'`
- `target_action_id IS NULL`
- `idempotency_key` is non-empty after trim
- `actor` is non-empty after trim
- `reason` is non-empty and bounded
- `redaction_summary` is a JSON object text if SQLite JSON functions are
  available
- `trust_provenance_label` is in the first implementation allowlist
- `provenance_json` is a JSON object text if SQLite JSON functions are
  available
- `recording_status = 'recorded'`
- `failure_reason IS NULL`
- `updated_at = created_at`

No pending placeholder rows are allowed. The table must not accept `pending`,
`failed`, `revoked`, `superseded`, `deleted`, `action_record`, or split-target
rows in the first implementation.

## UNIQUE Constraints

The future schema/migration PR must enforce:

- primary key uniqueness for `recording_link_id`
- unique `candidate_id`
- unique `idempotency_key`
- unique `target_evidence_id`

Candidate id uniqueness means one accepted reconciliation candidate maps to at
most one future verification evidence row. Idempotency key uniqueness prevents
duplicate writes. Target evidence id uniqueness means one evidence row can be
linked by at most one bridge row.

`target_action_id` must not receive a unique index in the first implementation
because it must remain `NULL`.

## Index List

The future schema/migration PR must add or prove equivalent coverage for:

- `idx_ag_recording_links_candidate_unique`
- `idx_ag_recording_links_idempotency_unique`
- `idx_ag_recording_links_target_evidence_unique`
- `idx_ag_recording_links_import_time`
- `idx_ag_recording_links_mapping_time`
- `idx_ag_recording_links_local_target_time`
- `idx_ag_recording_links_status_time`
- `idx_ag_recording_links_actor_time`
- `idx_ag_recording_links_trust_label_time`

The unique indexes may satisfy point lookups. The non-unique indexes support
future read surfaces by import, mapping, local work, status, actor, and
trust/provenance label.

## Foreign Key Feasibility

The current SQLite schema enables foreign-key enforcement with
`PRAGMA foreign_keys = ON;` and already uses foreign keys among local runtime
tables. The future migration should therefore prefer database-level foreign
keys for stable table relationships:

- `candidate_id` references
  `ag_work_resume_proof_evidence_reconciliation_candidates(candidate_id)`
- `import_id` references `ag_work_resume_imported_contexts(import_id)`
- `mapping_id` references `ag_work_resume_confirmed_mappings(mapping_id)`
- `target_evidence_id` references
  `verification_evidence_records(evidence_id)`

The future migration should place the bridge table after the referenced source
tables and after `verification_evidence_records` in `lib/db/schema.sql`, or use
the repo's migration mechanism in an order that leaves all referenced tables
available before smoke validation.

No `target_action_id` foreign key is proposed in the first implementation.
`action_records` remain out of first implementation scope.

## FK Fallback Policy

If a later schema/migration PR finds database-level FKs incompatible with the
current SQLite/project migration model, it must not silently drop referential
protection. It must:

- identify the incompatible FK and the exact SQLite or migration-model reason
- preserve all non-FK checks and unique indexes
- add explicit future writer validation for that relationship
- add schema smoke coverage proving missing source or target rows fail closed
  before any bridge/evidence write
- document that the fallback is not approval to record

The fallback policy may replace database-level FKs only for the incompatible
relationship. It must not widen writer/helper/route/UI authority.

## No-Cascade/Delete Restrict Policy

No cascade deletes.

The proposed DDL uses `ON DELETE RESTRICT` and `ON UPDATE RESTRICT` for
candidate, imported context, confirmed mapping, and verification evidence
references. If the project chooses SQLite's default no-action behavior instead
of explicit `RESTRICT`, the later PR must prove equivalent fail-closed delete
behavior in schema smoke coverage.

Deleting or updating any referenced source/target id while a bridge row exists
must fail. Bridge rows are audit linkage and must not be cleanup hints.

## Timestamp Defaults

`created_at` and `updated_at` are required. The proposed DDL uses the repo's
ISO UTC style:

```sql
strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
```

For the first implementation, `updated_at` must equal `created_at`. The
proposed DDL enforces `CHECK (updated_at = created_at)`. A future writer may
also explicitly supply the same timestamp to both fields. Any future status
model that mutates `updated_at` requires a separate design that names mutable
fields and reasons.

## JSON Text Validation Expectations

`redaction_summary` and `provenance_json` must be bounded JSON object text.
The future schema/migration PR should use SQLite JSON functions in CHECK
constraints when available:

- `json_valid(redaction_summary)`
- `json_type(redaction_summary) = 'object'`
- `json_valid(provenance_json)`
- `json_type(provenance_json) = 'object'`

If the project's SQLite runtime cannot guarantee JSON function availability,
the future PR must keep the columns as `TEXT NOT NULL DEFAULT '{}'`, document
the database-level JSON validation exception, and add explicit writer
validation plus smoke coverage. JSON fallback is not permission to store raw
payloads.

Both JSON texts must exclude secrets, raw DB paths, raw session payloads, raw
proof payloads, raw evidence payloads, raw foreign payloads, tokens,
credentials, cookies, and unredacted command output.

## Idempotency Key Uniqueness Policy

`idempotency_key` is required, non-empty, and unique.

Recommended key shape:

```text
actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:verification_evidence
```

Same key with same payload may return an idempotent no-new-write result in a
future writer. Same key with different payload must fail closed. Same
candidate with a different key must fail closed.

Idempotency is not retry, replay, publish, merge, auto-merge, or recording
authority.

## Candidate ID Uniqueness Policy

`candidate_id` is required and unique. The referenced candidate must be in
`accepted_for_future_recording` at future recording time, but that state is
necessary and not sufficient.

The bridge behavior must not mutate the candidate row, must not mark it
recorded, and must not rewrite `superseded_by_candidate_id`. Reconciliation
candidate rows remain review metadata unless and until a separate user/Core
recording gate authorizes the exact recording attempt.

## Target Evidence ID Uniqueness Policy

`target_evidence_id` is required, non-null, and unique. The bridge row must be
created in the same future transaction as the target
`verification_evidence_records` row. The bridge row must never be created
before target evidence exists.

If evidence-row creation fails, there must be no bridge row. If bridge-row
creation fails, the evidence row must roll back.

## Target Action ID Policy

`target_action_id` is nullable and must be `NULL` for the first implementation.
The proposed DDL enforces:

```sql
target_action_id TEXT CHECK (target_action_id IS NULL)
```

No `action_records` row may be created by the schema/migration PR or by the
first recording implementation. No `action_records` foreign key or unique index
is proposed until a later design explicitly adds action-record target
semantics.

Action records are out of first implementation scope.

## Recording Status And Failure Policy

`recording_status` is fixed to `recorded` for the first implementation.

`failure_reason` is nullable and must be `NULL` for the first implementation.
There are no failed bridge rows, no pending placeholder rows, and no partial
bridge rows. Failure attempts belong to rollback behavior unless a later
failure-audit design explicitly adds another policy.

## Migration Ordering

For `lib/db/schema.sql`, the future table should be added after these
referenced tables are defined:

- `ag_work_resume_confirmed_mappings`
- `ag_work_resume_imported_contexts`
- `ag_work_resume_proof_evidence_reconciliation_candidates`
- `verification_evidence_records`

Because `verification_evidence_records` currently appears after the AG Resume
candidate tables, the safest documented placement is after the
`verification_evidence_records` table and its indexes. The future PR must keep
schema ordering readable and reset/init compatible.

If the repo uses a separate migration file by then, that migration must run
after the migrations that create all referenced tables.

## DB Reset/Init Compatibility Expectations

A later schema/migration PR must prove:

- fresh DB init creates the bridge table
- fresh DB init creates all required indexes
- repeated reset/init remains idempotent
- repeated migration is a no-op or cleanly idempotent
- the bridge table starts empty
- no `verification_evidence_records` rows are created by migration
- no `action_records` rows are created by migration
- no work item/event, session, publication, delivery, imported context,
  confirmed mapping, proposal, or reconciliation candidate rows are created or
  mutated by migration

## Schema Smoke Expectations

A later schema/migration PR must add schema smoke coverage for:

- table exists
- primary key exists
- fixed `record_kind` and `schema` checks reject wrong values
- fixed `target_record_kind = 'verification_evidence'` check rejects other
  targets
- fixed `recording_status = 'recorded'` check rejects pending/failed statuses
- `target_action_id` rejects non-null values
- `failure_reason` rejects non-null values
- `updated_at = created_at`
- unique `candidate_id`
- unique `idempotency_key`
- unique `target_evidence_id`
- required NOT NULL columns reject nulls
- JSON object checks for `redaction_summary` and `provenance_json`, or explicit
  fallback writer-validation smoke if JSON functions are unavailable
- FK enforcement or documented fallback validation for candidate, import,
  mapping, and target evidence ids
- no cascade/delete behavior for candidate, import, mapping, and target
  evidence references
- the table is empty immediately after migration
- no writer/helper/route/UI or recording behavior is added

## Diff Boundary For Later Schema/Migration PR

The later schema/migration PR should be limited to:

- `lib/db/schema.sql`, only when the PR is explicitly scoped to add the table
- migration file(s), only if the repo has a migration-file path at that time
- schema smoke script(s)
- package smoke script pointer(s), if required
- documentation pointer updates

It must not change:

- runtime writers or helpers
- API routes
- UI or Cockpit components
- browser reports
- proof/evidence recording helpers
- session binding helpers
- Codex continuation helpers
- work item/event writers
- imported context writers
- confirmed mapping writers
- proposal writers
- reconciliation candidate lifecycle writers
- approval/publish/retry/replay/merge code
- auto-merge, external posting, or committed-state authority code

## Rollback/Backout Policy

Before any bridge rows exist, a failed schema/migration PR can be backed out by
removing the table and index DDL from the PR branch before merge.

After a schema/migration PR merges but before any recording implementation
exists, backout should be a separate migration/revert PR that removes the
unused table only after confirming it is empty.

Once bridge rows exist in a future implementation, destructive table removal is
not allowed without a separate user/Core-approved data retention, export, and
rollback design. No cascade delete may be used as a backout mechanism.

Rollback must never delete proof/evidence records, action records, imported
contexts, confirmed mappings, proposals, reconciliation candidates, sessions,
work items/events, publications, deliveries, or committed state unless a
separate explicit user/Core-approved policy authorizes that exact action.

## Later PR Proof Requirements

A later schema/migration PR must prove it did not add writer/helper/route/UI or
recording behavior by including:

- changed-file audit showing only schema/migration, docs, package smoke
  pointers, and schema smoke files changed
- `git diff --check`
- `git diff --cached --check`
- `node --check` over new/modified `.mjs` smoke scripts
- schema smoke showing the bridge table and indexes exist
- smoke or diff audit showing no route/helper/UI/runtime/browser files changed
- smoke or diff audit showing no `verification_evidence_records` rows are
  created by migration
- smoke or diff audit showing no `action_records` rows are created by migration
- smoke or diff audit showing no imported context, confirmed mapping, proposal,
  or reconciliation candidate rows are mutated

## Authority Boundary

This schema-only bridge table implementation grants:

- schema table/indexes only
- no migration files
- no writer/helper/route/UI
- no proof/evidence recording
- no `verification_evidence_records` row creation
- no `action_records` row creation
- no bridge row creation
- no session binding
- no Codex execution or continuation
- no work item/event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no reconciliation candidate mutation
- no approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

Approval/publish/retry/replay/merge remains out of scope. Session binding and
Codex continuation remain out of scope.

## Non-Goals

- No runtime behavior.
- No migration files.
- No writer/helper/route/UI.
- No browser report.
- No proof/evidence recording.
- No evidence recording.
- No `verification_evidence_records` row creation.
- No `action_records` row creation.
- No bridge row creation.
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

Browser verification skipped: this is a schema-only bridge table/index
implementation with no runtime, Cockpit, UI, or browser files changed.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper behavior changes, schema/migration, proof/evidence recording,
bridge rows, verification evidence rows, action records, or broader recording
authority.

## Suggested Verification For This Schema PR

```bash
npm run typecheck
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
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs
git diff --check
git diff --cached --check
```
