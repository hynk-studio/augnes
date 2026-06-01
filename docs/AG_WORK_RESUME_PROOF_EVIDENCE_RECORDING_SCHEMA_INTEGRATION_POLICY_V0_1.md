# AG Resume Proof/Evidence Recording Schema Integration Policy v0.1

## Status

This document is design-only. It chooses and narrows the schema/integration
policy for a future actual proof/evidence recording implementation from
reviewed AG Resume reconciliation candidate metadata.

This policy adds no runtime behavior, adds no schema or migration, adds no writer, helper, route, UI, browser report, proof/evidence recording, evidence
recording, session binding, Codex execution or continuation, work item/event
creation, imported context mutation, confirmed mapping mutation, proposal
mutation, approval, publish, retry, replay, merge, auto-merge, external
posting, or committed-state authority.

`accepted_for_future_recording` is not proof/evidence recording. Schema/integration design is not approval to record. Actual recording remains separately user/Core gated.

## Purpose

The actual proof/evidence recording gate design in
`docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`
requires a schema/integration policy before any future implementation may turn
candidate review metadata into a local proof/evidence record.

This policy evaluates five integration options and recommends the first future
implementation path. It deliberately stops before creating any table, migration,
writer, route, UI, proof/evidence record, session binding, Codex continuation,
work item/event, or authority-changing behavior.

## Related Gate Context

This policy follows and preserves these controlling docs:

- `docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
- `docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`

Those docs remain controlling for review-metadata, mapping/import,
proof/evidence/session/Codex, reconciliation, and candidate lifecycle
boundaries. This policy only narrows future schema/integration shape.

## Policy Recommendation

Recommended first implementation path: use a new bridge table from reconciliation candidate ids to local proof/evidence ids, with the first target record kind narrowed to one `verification_evidence_records` row.

The future implementation should create exactly one local verification evidence
record and exactly one bridge/link row in a single local transaction, only
after explicit user/Core approval for the exact recording attempt. The bridge
row should carry the durable candidate-to-local-record link, idempotency key,
actor, reason, redaction summary, source imported context id, confirmed mapping
id, reconciliation candidate id, trust/provenance label, target local record id,
and rollback/failure status. The verification evidence row should remain the
human-reviewable evidence record shown through existing Evidence Pack and
verification evidence surfaces.

This recommendation does not implement the bridge table, does not create a
verification evidence row, and does not approve recording. It only chooses the
future integration policy to be designed and implemented in later explicit PRs.

The bridge-table schema design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`.
It is design-only and does not add schema/migration, modify
`lib/db/schema.sql`, create bridge rows, create evidence rows, create action
records, or authorize actual recording.

The bridge-table migration/DDL policy is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`.
It is design-only and does not add schema/migration, modify
`lib/db/schema.sql`, add migration files, create the bridge table, create
bridge/evidence/action rows, or authorize actual recording.

The schema-only bridge table implementation adds
`ag_work_resume_proof_evidence_recording_links` and its indexes to
`lib/db/schema.sql`. It is schema-only: it creates no bridge/evidence/action
rows, adds no writer/helper/route/UI, and does not authorize actual recording.

The writer/helper gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and narrows the future helper contract after the bridge table
exists. It adds no writer/helper implementation, route/UI, bridge row creation,
verification evidence row creation, action record creation, or actual
recording authority by itself.

The proof/evidence recording route gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and narrows a future HTTP invocation boundary over the
writer/helper. It adds no route implementation, UI/Cockpit control,
schema/migration, writer/helper implementation change, bridge row creation,
verification evidence row creation, action record creation, or actual
recording authority by itself.

## Why This Is The First Path

The first path should not mutate candidate rows to mark recording, because
candidate lifecycle is review metadata only. It should not overload
`action_records`, because that table has proof semantics but no structured
metadata/idempotency fields for this reconciliation use case. It should not
start with split proof and evidence records, because dual-write proof/evidence
creation increases rollback, dedupe, and read-surface complexity before the
recording gate has been proven.

A bridge table plus one verification evidence row gives the smallest auditable
recording path that can keep:

- candidate lifecycle metadata immutable except for already-scoped lifecycle
  actions
- proof/evidence recording separately authorized
- idempotency enforceable by local schema in a later migration
- provenance structured rather than buried in prose
- read surfaces able to show both the evidence row and the candidate linkage
- future proof/action-record recording available as a later policy extension

## Required Future Preconditions

A future implementation must still fail closed unless all of these are true:

- user/Core explicitly approves the exact recording attempt
- the candidate is in `accepted_for_future_recording`
- `accepted_for_future_recording` is treated as necessary but not sufficient
- source imported context exists and remains allowed
- source confirmed mapping exists and remains allowed
- the local target work identity is explicit
- actor is explicit
- reason is explicit
- redaction summary is safe
- trust/provenance label is explicit
- idempotency key is explicit
- bridge-table schema and transaction policy have been implemented in a
  separately approved PR
- no protected side effects occur beyond the explicitly approved local
  evidence record and bridge/link row

Schema/integration design is not approval to record. Actual recording remains
separately user/Core gated.

## Option 1: Existing Proof/Action-Record Path

### What Local Record Would Be Created Later

A future implementation would create one `action_records` row, likely through a
proof-only action-record path, as the local proof record for the accepted
candidate.

### Required Existing Tables Or Schema Changes

The existing `action_records` table has `id`, `scope`, `state_key`, `title`,
`description`, `status`, `source_agent_id`, `source_session_id`, `created_at`,
and `completed_at`. No schema change is required to create an action record,
but structured candidate provenance, idempotency, actor/reason, redaction, and
trust metadata would require either a separate bridge table or lossy encoding
inside text fields.

### Provenance Fields

Provenance could only fit into `title` and `description` unless a bridge table
or linked metadata record is added. That is weak for:

- source runtime or packet identity
- source packet id and packet hash
- source imported context id
- source confirmed mapping id
- source reconciliation candidate id
- foreign ref type and id
- local target scope and work id
- trust/provenance label

### Idempotency Key Placement

`action_records` has no idempotency key column. A future implementation would
need a new bridge table, a new idempotency table, or unsafe text-field
encoding. Text-field encoding does not provide reliable uniqueness.

### Actor/Reason Placement

`source_agent_id` can identify an agent-like source, but it is not enough for
the required user/Core actor and reason. The reason would have to live in
`description` or a bridge table.

### Redaction Summary Placement

The redaction summary would have to live in `description` or a bridge table.
That would make machine validation and read-surface consistency brittle.

### Source Imported Context Linkage

No direct column exists. Linkage would have to live in text or a bridge table.

### Confirmed Mapping Linkage

No direct column exists. Linkage would have to live in text or a bridge table.

### Reconciliation Candidate Linkage

No direct column exists. Linkage would have to live in text or a bridge table.

### Trust/Provenance Label Placement

No direct column exists. Linkage would have to live in text or a bridge table.

### Rollback/Failure Behavior

A single action-record write can be transactional, but idempotency and
candidate linkage would not be safely enforced without additional schema.
Failures must leave no action record, bridge row, work event, session binding,
imported context mutation, confirmed mapping mutation, proposal mutation, or
approval/publication/delivery row.

### Read-Surface Implications

Existing Work Brief, State Brief, Session Trace, and Evidence Pack surfaces can
show action records, but they would not naturally expose the full AG Resume
candidate provenance without a new read model or bridge lookup.

### Migration Risk

Low if only `action_records` is used. Medium if a bridge/idempotency table is
added. Policy risk is high if provenance is stored only in free text.

### Auditability

Moderate for proof existence. Weak for structured candidate-to-record linkage
unless a bridge table is added.

### Fit For First Implementation

This does not fit the first implementation. It gives proof semantics but lacks
structured metadata and idempotency placement. It should remain a later
extension after the evidence-first bridge path is proven.

## Option 2: Existing Verification Evidence Path

### What Local Record Would Be Created Later

A future implementation would create one `verification_evidence_records` row as
the local evidence record for the accepted candidate.

### Required Existing Tables Or Schema Changes

The existing `verification_evidence_records` table already has `evidence_id`,
`scope`, `work_id`, `evidence_kind`, `label`, `status`, `command`,
`result_summary`, `skipped_reason`, `observed_behavior`, `source_surface`,
`source_ref`, `related_action_id`, `related_work_event_id`, `metadata`,
`created_by`, and `created_at`.

No schema change is required to create a verification evidence row. However,
without a bridge table, idempotency and candidate-to-evidence uniqueness would
depend on route/helper checks rather than a durable local unique constraint.

### Provenance Fields

Candidate provenance fits naturally in `metadata`, with `source_surface`
identifying the AG Resume recording gate and `source_ref` identifying the
candidate id. The metadata object can include imported context, confirmed
mapping, foreign ref, packet, local target work, redaction, and trust labels.

### Idempotency Key Placement

The idempotency key can be stored in `metadata`, but `metadata` has no unique
constraint. A bridge table should be used for durable idempotency enforcement,
with the key mirrored into evidence metadata for read surfaces.

### Actor/Reason Placement

`created_by` can hold the actor. The reason can be stored in `result_summary`
and structured `metadata`. A bridge table should also store actor and reason
for durable candidate-link audit.

### Redaction Summary Placement

The redaction summary fits in `metadata` and can be summarized in
`result_summary`.

### Source Imported Context Linkage

The source imported context id can be stored in `metadata`, and a bridge table
should store it as a first-class field.

### Confirmed Mapping Linkage

The confirmed mapping id can be stored in `metadata`, and a bridge table should
store it as a first-class field.

### Reconciliation Candidate Linkage

The candidate id can be stored in `source_ref` and `metadata`, and a bridge
table should store it as a unique first-class field.

### Trust/Provenance Label Placement

The trust/provenance label can be stored in `metadata`, and a bridge table
should store it as a queryable field.

### Rollback/Failure Behavior

The evidence row and bridge row must be created in one transaction. Failure
must leave no evidence row, no bridge row, no action record, no work event, no
session binding, no imported context mutation, no confirmed mapping mutation,
no proposal mutation, and no approval/publication/delivery row.

### Read-Surface Implications

Existing Evidence Pack and verification evidence surfaces can show the new
evidence row. Later AG Resume candidate read surfaces can join through the
bridge table to show the local evidence id without mutating the candidate row.

### Migration Risk

Low if used alone, but idempotency risk remains. Medium with a bridge table,
because a small new schema object is required.

### Auditability

Strong when paired with a bridge table. Moderate without one.

### Fit For First Implementation

This fits as the first target local record, but not as a standalone policy.
The first implementation should use `verification_evidence_records` as the
target record and add a bridge table for idempotency and durable linkage.

## Option 3: Split Proof And Evidence Records

### What Local Record Would Be Created Later

A future implementation would create one `action_records` row and one
`verification_evidence_records` row in one transaction, likely linking the
evidence row through `related_action_id`.

### Required Existing Tables Or Schema Changes

Both target tables already exist. A bridge/idempotency table would still be
needed to make candidate-to-record linkage and duplicate protection durable.

### Provenance Fields

The evidence row can carry structured provenance in `metadata`; the action
record cannot. The bridge table would need to be the durable place for
candidate, import, mapping, target evidence id, target action id, actor,
reason, redaction, trust, and idempotency.

### Idempotency Key Placement

The idempotency key should live in a bridge table and be mirrored in evidence
metadata. Putting it only in `description` or evidence `metadata` is not enough.

### Actor/Reason Placement

The evidence row can use `created_by` and `metadata`; the action record has
limited fields. The bridge table would need to carry the canonical actor and
reason.

### Redaction Summary Placement

The evidence row and bridge table can carry redaction summary. The action
record can only summarize it in text.

### Source Imported Context Linkage

The bridge table should carry the first-class source imported context id.
Evidence metadata may mirror it.

### Confirmed Mapping Linkage

The bridge table should carry the first-class confirmed mapping id. Evidence
metadata may mirror it.

### Reconciliation Candidate Linkage

The bridge table should carry a unique candidate id. Evidence metadata and
source ref may mirror it.

### Trust/Provenance Label Placement

The bridge table should carry the first-class trust/provenance label. Evidence
metadata may mirror it.

### Rollback/Failure Behavior

All writes must be atomic. Failure must leave no action record, no evidence
row, no bridge row, no work event, no session binding, no imported context
mutation, no confirmed mapping mutation, no proposal mutation, and no
approval/publication/delivery row.

### Read-Surface Implications

Evidence Pack, Work Brief, State Brief, and Session Trace may show more than
one record, increasing operator ambiguity unless the UI/read model clearly
distinguishes proof action from verification evidence and candidate linkage.

### Migration Risk

Medium to high. Even if both target tables exist, dual-write semantics and
bridge linkage require careful tests and read-surface copy.

### Auditability

High when implemented correctly, but higher complexity makes first-use audit
harder.

### Fit For First Implementation

This does not fit the first implementation. It is a useful later extension if
the project needs both proof action and verification evidence records for the
same accepted candidate.

## Option 4: New Bridge Table From Reconciliation Candidate IDs To Local Proof/Evidence IDs

### What Local Record Would Be Created Later

The recommended future first implementation should create:

- one `verification_evidence_records` row as the first local evidence target
- one new bridge/link row connecting the accepted candidate to that evidence id

The bridge table should allow future target columns for an action record id,
but the first implementation should leave proof/action-record creation out of
scope.

### Required Existing Tables Or Schema Changes

This option requires a future schema/migration PR for a bridge table. A
possible table name is
`ag_work_resume_proof_evidence_recording_links`.

The later schema should include, at minimum:

- `recording_link_id`
- `candidate_id`
- `import_id`
- `mapping_id`
- `local_target_scope`
- `local_target_work_id`
- `target_record_kind`
- `target_evidence_id`
- `target_action_id`
- `idempotency_key`
- `actor`
- `reason`
- `redaction_summary`
- `trust_provenance_label`
- `provenance`
- `status`
- `failure_summary`
- `created_at`

The later schema should enforce one accepted candidate to one first recording
link unless a later design explicitly allows multiple local records. It should
also enforce unique idempotency key behavior.

### Provenance Fields

The bridge table should be the canonical structured provenance location. It
should include source runtime or packet identity, source packet id and hash,
source imported context id, source confirmed mapping id, source reconciliation
candidate id, foreign ref type and id, local target scope and work id, actor,
reason, and trust/provenance label.

The evidence row metadata should mirror a public-safe copy for existing
Evidence Pack/read surfaces.

### Idempotency Key Placement

The canonical idempotency key should live in the bridge table under a unique
constraint. The same value should be mirrored in the evidence row metadata.

Recommended key shape:

```text
actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:verification_evidence
```

Same key with same payload may return an idempotent no-new-write response.
Same key with different payload must fail closed. Same candidate with a different key must fail closed unless a later design explicitly allows multiple
local records.

### Actor/Reason Placement

The canonical actor and reason should live in the bridge table. The evidence
row should mirror `created_by = actor` and include a bounded reason summary in
`result_summary` and `metadata`.

### Redaction Summary Placement

The canonical redaction summary should live in the bridge table as bounded JSON
text. A public-safe summary should be mirrored in evidence metadata. Raw
foreign payloads, secrets, raw DB paths, session payloads, proof payloads, and
evidence payloads must not be copied.

### Source Imported Context Linkage

The bridge table should carry `import_id` as a first-class field. The evidence
metadata should mirror it for read surfaces.

### Confirmed Mapping Linkage

The bridge table should carry `mapping_id` as a first-class field. The evidence
metadata should mirror it for read surfaces.

### Reconciliation Candidate Linkage

The bridge table should carry `candidate_id` as a unique first-class field. The
evidence row should use `source_surface = ag_work_resume_actual_recording_gate`
and `source_ref = <candidate_id>` or an equivalent bounded source ref chosen by
the later implementation.

### Trust/Provenance Label Placement

The bridge table should carry the canonical trust/provenance label. The first
implementation should prefer a conservative label such as
`foreign_summary_user_core_attested` or another separately approved label. The
label is metadata, not approval.

### Rollback/Failure Behavior

The bridge row and evidence row must be created in one transaction. Failure
must leave no bridge row, no evidence row, no action record, no work event, no
session binding, no imported context mutation, no confirmed mapping mutation,
no proposal mutation, and no approval/publication/delivery row.

Failure metadata, if recorded later, must be explicitly scoped and must not
become proof/evidence by accident.

### Read-Surface Implications

Existing Evidence Pack and verification evidence read surfaces can show the
evidence row immediately after the future implementation exists. AG Resume
candidate read surfaces can later join through the bridge table to show:

- recorded evidence id
- idempotency key hash or public-safe id
- actor and reason
- redaction summary
- trust/provenance label
- source import and mapping ids
- failure state, if separately approved

Candidate rows should not be mutated to display recording state in the first
implementation.

### Migration Risk

Medium. This option requires a new schema/migration PR, but the table can be
small, local, and purpose-built. It avoids broad changes to existing proof,
evidence, imported context, confirmed mapping, proposal, session, work, or
publication schemas.

### Auditability

High. The bridge table makes candidate-to-local-record linkage explicit,
enforces idempotency, keeps provenance structured, and avoids relying on
free-text fields or candidate row mutation.

### Fit For First Implementation

This fits the first implementation and is the recommended policy. The first
implementation should be evidence-first: bridge table plus one
`verification_evidence_records` target row. Proof/action-record creation,
split proof/evidence creation, session binding, Codex continuation, work
item/event creation, and any UI write control remain later gates.

## Option 5: Deferring Implementation Until Another Design-Only Extension

### What Local Record Would Be Created Later

No local record would be created until another design-only extension resolves
the policy.

### Required Existing Tables Or Schema Changes

None.

### Provenance Fields

None yet. Provenance would remain in review metadata and design docs only.

### Idempotency Key Placement

None yet. The idempotency policy would remain unimplemented.

### Actor/Reason Placement

None yet. Actor and reason would remain future requirements only.

### Redaction Summary Placement

None yet. Redaction summary would remain in imported context/candidate review
metadata only.

### Source Imported Context Linkage

No new linkage.

### Confirmed Mapping Linkage

No new linkage.

### Reconciliation Candidate Linkage

No new linkage.

### Trust/Provenance Label Placement

No new trust/provenance label placement beyond existing review metadata.

### Rollback/Failure Behavior

No write behavior exists, so no rollback behavior is needed.

### Read-Surface Implications

Read surfaces remain limited to review metadata. Operators still cannot see a
local proof/evidence recording link because no recording path exists.

### Migration Risk

None.

### Auditability

Safe but incomplete. It preserves boundaries but leaves the future recording
path unresolved.

### Fit For First Implementation

This does not fit as the first implementation path after this policy because
the bridge-table/evidence-first route is now recommended. Deferral remains the
fallback if reviewers reject the bridge-table policy or require another
design-only pass.

## First Implementation Contract For Later PRs

The later implementation sequence should be:

1. Bridge-table schema design PR.
2. Bridge-table schema/migration PR, after
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`
   is accepted.
3. Writer/helper design PR for the exact approved recording attempt, now
   tracked in
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
4. Writer/helper implementation PR creating one bridge row and one evidence
   row in one transaction.
5. Read-surface PR showing the bridge/evidence link without candidate mutation.
6. Route gate design PR, now tracked in
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`,
   and route implementation PRs only after the writer/helper is approved.
7. UI design and UI implementation PRs only after route behavior is approved.

No later PR may skip explicit user/Core approval for the exact recording
attempt.

## Protected Side-Effect Boundary

The recommended future path permits only the later explicitly approved local
evidence row and bridge/link row. It still forbids:

- proof/action-record creation in the first implementation
- split proof/evidence creation in the first implementation
- session binding
- Codex execution or continuation
- work item creation
- work event creation
- imported context mutation
- confirmed mapping mutation
- proposal mutation
- candidate lifecycle mutation beyond existing scoped lifecycle actions
- approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation
- Direct Resume Code
- relay/hosted transfer

Approval/publish/retry/replay/merge remains out of scope. Session binding and Codex continuation remain out of scope.

## Browser And DB Proof Requirements For Later Implementation PRs

A future implementation PR must include DB proof that:

- exactly one bridge row and exactly one verification evidence row are created
  for the exact approved candidate
- no action record is created in the first implementation
- no session rows or bindings are created
- no work item/event rows are created
- imported context rows are not mutated
- confirmed mapping rows are not mutated
- proposal rows are not mutated
- candidate rows are not mutated beyond separately approved lifecycle actions
- duplicate/idempotent requests behave as designed
- failure paths leave no partial writes

Browser verification is required only for later UI PRs. A UI PR must prove the
operator surface clearly distinguishes review metadata, schema/integration
policy, user/Core approval, and actual recording.

## Authority Boundary

This policy grants:

- no runtime behavior
- no schema or migration
- no writer, helper, route, or UI
- no browser report
- no proof/evidence recording
- no evidence recording
- no session binding
- no Codex execution or continuation
- no work item creation
- no work event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

Actual recording remains separately user/Core gated.

## Non-Goals

- No runtime behavior.
- No schema or migration.
- No writer, helper, route, or UI.
- No browser report.
- No proof/evidence recording.
- No evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item creation.
- No work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No candidate row mutation.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

Browser verification skipped: no runtime/UI/Cockpit/browser files changed in
this design-only schema/integration policy PR.

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
npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy
npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design
npm run smoke:ag-work-resume-review-metadata-closeout
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
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
