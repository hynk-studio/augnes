# AG Resume Actual Proof/Evidence Recording Gate Design v0.1

## Status

This document is design-only. It defines a future explicit gate for turning
reviewed AG Resume reconciliation candidate metadata into actual local
proof/evidence records.

This design adds no runtime behavior, adds no schema or migration, adds no writer, helper, route, UI, proof/evidence recording, evidence recording,
session binding, Codex execution or continuation, work item/event creation,
imported context mutation, confirmed mapping mutation, proposal mutation,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state authority.

`accepted_for_future_recording` is not proof/evidence recording. Actual proof/evidence recording remains unauthorized until a separate implementation PR is explicitly approved after this design.

Durable approval remains user/Core gated.

## Purpose

The review-metadata milestone closed a recoverable pipeline from AG Resume
packet review through reconciliation candidate lifecycle review. That pipeline
can identify a candidate that may be suitable for a future local proof/evidence
recording path, but it deliberately stops before creating any local proof or
evidence record.

This gate design defines what a future implementation must prove before it may
turn one reviewed reconciliation candidate into one or more local proof/evidence
records. It separates review readiness from recording authority, keeps foreign
refs foreign until explicitly authorized, and names the preconditions,
side-effect boundaries, integration choices, and verification obligations for
later PRs.

## Related Gate Context

This design follows the review-metadata closeout in
`docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md`
and keeps the earlier boundary docs active:

- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`

Those documents remain controlling for their scopes. This design only defines
the future actual proof/evidence recording gate and does not reopen session
binding, Codex continuation, mapping/import mutation, or candidate lifecycle
authority.

## Why Review Metadata Is Not Proof/Evidence

Review metadata helps a user/Core reviewer decide whether a foreign ref summary
is understandable, bounded, redacted, and related to a confirmed local work
identity. It is not proof/evidence because:

- it may summarize foreign refs from another runtime, packet, handoff, or
  browser report without carrying local Augnes record authority
- it may omit raw payloads by design
- it may depend on human interpretation of provenance, redaction, and local
  work relevance
- it has not passed a local proof/evidence writer contract
- it has not selected a local target table, record kind, idempotency key,
  actor, reason, redaction outcome, or failure policy
- it has not produced a local action record, verification evidence row, work
  event, or Evidence Pack entry

`accepted_for_future_recording` means only that candidate review metadata was
accepted as potentially suitable for a future recording path. It is not a
recording action, not a proof id, not an evidence id, not local source of truth,
not session binding, not Codex continuation, not work authority, and not
approval, publish, retry, replay, merge, or auto-merge authority.

## Required Preconditions Before Recording

A future actual recording implementation must fail closed unless all of these
preconditions are satisfied:

- user/Core explicitly authorizes the exact recording attempt
- this design-only PR has merged
- a separate implementation PR is explicitly approved
- the target schema/integration policy is decided
- actor, reason, redaction, failure, rollback, and idempotency policy are
  decided
- side-effect proof plan is documented
- source reconciliation candidate exists
- candidate lifecycle state is allowed by the implementation policy
- source imported context exists and is still allowed for recording
- source confirmed mapping exists and is still active or otherwise allowed by a
  separately approved policy
- local target work identity is explicit
- foreign refs are bounded summaries, not raw trusted local records
- redaction report is safe
- provenance/trust classification is explicit
- dedupe/idempotency key is explicit
- protected side-effect boundary is enforced

No default path may record proof/evidence from imported context or candidate
metadata without those checks.

## Candidate Lifecycle State Requirement

The required candidate lifecycle state for the first future implementation should be `accepted_for_future_recording`.

That state is necessary but not sufficient. A candidate with
`accepted_for_future_recording` still requires explicit user/Core approval,
source imported context validation, confirmed mapping validation, actor,
reason, redaction, trust/provenance, dedupe/idempotency, failure/rollback, and
side-effect checks before any local proof/evidence record can be created.

The future implementation must reject candidates in `proposed`, `deferred`, `rejected`, `withdrawn`, `superseded`, or `revoked` unless a later design
explicitly names another allowed state. `superseded -> revoke` must continue to preserve `superseded_by_candidate_id` as audit metadata and must not be
treated as proof/evidence recording or replacement-row mutation.

## Actor Requirement

A future recording request must include an explicit user/Core actor. The actor
must be stored or linked according to the implementation's chosen integration
policy and must be visible in the proof/evidence review surface.

The actor may not be inferred from the candidate row alone, from a session id,
from Codex, from ChatGPT, from a browser report, from a route `ok`, from a PR,
or from a smoke pass.

## Reason Requirement

A future recording request must include a written reason explaining why this
specific candidate should become local proof/evidence. The reason must be
bounded, human-readable, and stored or linked according to the implementation's
chosen integration policy.

The reason must identify the intended local target work, the source imported
context, the foreign ref being reconciled, and the safety judgment that made
recording acceptable.

## Source Imported Context Requirement

The source imported context row must exist and must match the candidate's
`import_id`. It must still be in a status allowed for proof/evidence recording
by the future implementation policy.

The implementation must re-read the imported context at recording time. It
must verify that the imported context is bounded review metadata, that its
redaction report is safe, and that it does not include raw secrets, raw DB
paths, raw session payloads, raw proof payloads, or raw evidence payloads.

The implementation must not mutate imported context rows. Any status update,
lifecycle mutation, backfill, repair, or deletion of imported context remains
out of scope unless separately designed and approved.

## Confirmed Mapping Requirement

The source confirmed mapping must exist and must connect the candidate's
foreign work identity to the intended local target work identity. The first
future implementation should require an active confirmed mapping unless a later
design explicitly allows another status.

The implementation must re-read the confirmed mapping at recording time. It
must not mutate confirmed mapping rows, create replacement mappings, create
work items, create work events, or treat the mapping as approval to record.

## Redaction Policy

Recording must fail closed when redaction is unknown, unsafe, or inconsistent.
At minimum, the future implementation must reject recording if any source
metadata indicates:

- secrets included
- raw DB paths included
- raw session payloads included
- raw proof payloads included
- raw evidence payloads included
- unredacted tokens, keys, cookies, credentials, local absolute private paths,
  or raw command output that could expose secrets

The future implementation must preserve a public-safe redaction summary in the
created local record or linked audit metadata. It must not copy raw foreign payloads into local proof/evidence records.

## Trust And Provenance Policy

Foreign refs remain untrusted foreign review context until explicitly
authorized for local recording. A future implementation must classify
provenance before recording:

- source runtime or packet identity
- source packet id and packet hash
- source imported context id
- source confirmed mapping id
- source reconciliation candidate id
- foreign ref type and id
- local target scope and work id
- reviewer actor and reason
- trust level, such as `foreign_summary_only`, `operator_attested`, or another
  separately approved label

The trust label is metadata, not approval. It must not bypass redaction,
idempotency, actor, reason, mapping, or user/Core approval checks.

## Dedupe And Idempotency Policy

A future implementation must define an idempotency key before recording. The
recommended first key shape is:

```text
actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:<record_kind>
```

The implementation must define how duplicate requests behave:

- same key and same payload may return an idempotent replay result without creating another record
- same key with different payload must fail closed
- same candidate with a different key must fail closed unless a future design explicitly allows multiple records
- already-recorded candidate state must be visible in read surfaces before
  another recording attempt can proceed

Idempotency is not retry, replay, publish, or merge authority. It is only a local duplicate-write protection policy for the future recording route/helper.

## Rollback And Failure Policy

The future implementation must use an atomic transaction for every local
recording attempt. On failure it must create no partial proof/evidence record,
no work event, no session binding, no imported context mutation, no confirmed
mapping mutation, no proposal mutation, no approval row, no publication row,
and no delivery row.

The implementation must define whether failures are returned only to the caller
or recorded as bounded audit metadata. Recording failure metadata itself must
not become proof/evidence unless separately authorized.

Rollback must be mechanical and local. It must not call external services,
publish, retry, replay, merge, auto-merge, execute Codex, or bind sessions.

## Protected Side-Effect Boundary

The first future implementation must protect against all side effects except
the explicitly approved proof/evidence record write and any explicitly approved
same-transaction audit/idempotency metadata.

Protected side effects that must remain false:

- session binding
- Codex execution or continuation
- work item creation
- work event creation, unless a later implementation explicitly approves a
  local audit event tied to the recording
- imported context update/delete/lifecycle mutation
- confirmed mapping update/delete/lifecycle mutation
- proposal update/delete/lifecycle mutation
- approval grant
- publication, retry, replay, delivery, external posting
- merge or auto-merge
- Direct Resume Code creation or resolution
- relay/hosted transfer

## Database And Schema Integration Options

This design does not choose a schema. A future implementation PR must choose
one of these options, or introduce another option in a design-only PR first:

1. Existing proof/action-record path: create a local proof/action record through
   an existing proof-only route, with candidate provenance stored in bounded
   metadata.
2. Existing verification evidence path: create a local verification evidence
   row, with candidate provenance stored in bounded metadata.
3. Split proof and evidence records: create one proof/action record and one
   verification evidence row in one atomic policy, if separately approved.
4. New bridge table: add a dedicated mapping from reconciliation candidate ids
   to local proof/evidence ids before or during recording, if a schema PR is
   explicitly approved.
5. Design-only extension first: defer implementation until a separate schema
   and integration policy doc is approved.

Any option that adds schema, migration, helper, route, writer, UI, or runtime
behavior must be a separate implementation PR after this design.

The schema/integration policy decision is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`.
It is design-only and recommends a future bridge-table path with one
verification evidence target row first. It does not add schema, migration,
writer/helper/route/UI, or proof/evidence recording authority.

## Future Route/Helper/UI Implementation Sequence

Later PRs should stay split and reviewable:

1. Schema/integration policy decision PR, if needed.
2. Writer/helper design PR defining input, validation, idempotency, transaction,
   output, authority boundary, and failure behavior.
3. Writer/helper implementation PR with DB side-effect proof.
4. Route design PR defining request/response shape and HTTP failure mapping.
5. Route implementation PR with HTTP, idempotency, redaction, and protected
   side-effect tests.
6. Read-surface update PR showing recorded local proof/evidence links without
   creating new authority.
7. Cockpit UI design PR, if needed, with explicit approval language and no
   hidden write controls.
8. Cockpit UI implementation PR, if explicitly approved, with browser proof.

No route, helper, or UI may record proof/evidence unless the implementation PR
is explicitly scoped to do so.

## Browser And DB Proof Requirements For Later PRs

A future implementation PR must include DB proof that:

- exactly the approved local proof/evidence record or records were created
- no session rows or bindings were created
- no work items/events were created unless separately approved
- imported context rows were not mutated
- confirmed mapping rows were not mutated
- proposal rows were not mutated
- approval/publication/delivery rows were not created or changed
- duplicate/idempotent requests behave as designed
- failure paths leave no partial writes

A future UI PR must include browser proof that:

- the UI clearly distinguishes review metadata from actual recording
- the user/Core approval prompt names the exact candidate, imported context,
  confirmed mapping, local target work, actor, reason, redaction status, and
  side effects
- no session binding, Codex continuation, work creation, approval, publish,
  retry, replay, merge, Direct Resume Code, or relay controls are introduced
- success and failure states show bounded public-safe metadata only

## Explicit User/Core Approval Requirement

Actual proof/evidence recording requires explicit user/Core approval for the
exact recording attempt. Approval must name:

- candidate id
- imported context id
- confirmed mapping id
- foreign ref type and id
- local target scope and work id
- intended record kind
- actor
- reason
- redaction status
- idempotency key
- expected side effects
- rollback/failure policy

Approval for this design is not approval to record. Approval for a future
implementation PR is not approval for every recording attempt unless that PR
explicitly scopes a safe user/Core-gated route and the user/Core approves the
specific attempt.

## Authority Boundary

This design grants:

- no runtime behavior
- no schema or migration
- no writer, helper, route, or UI
- no proof/evidence recording
- no evidence recording
- no session binding
- no Codex execution or continuation
- no work item creation
- no work event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no approval, publish, retry, replay, merge, auto-merge, or external posting
- no Direct Resume Code
- no relay/hosted transfer
- no committed state authority

Actual proof/evidence recording remains unauthorized until a separate
implementation PR is explicitly approved after this design.

## Non-Goals

- No runtime behavior.
- No schema or migration.
- No writer, helper, route, or UI.
- No proof/evidence recording.
- No evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item creation.
- No work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.
- No Direct Resume Code.
- No relay/hosted transfer.
- No browser report.

## Future PR Sequence

1. Merge this design-only gate.
2. Decide schema/integration policy in
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`.
3. Decide actor/reason/redaction/failure/rollback/idempotency policy details.
4. Implement writer/helper only after explicit approval.
5. Implement route only after writer/helper behavior is approved.
6. Add read-surface links only after recording behavior exists.
7. Add Cockpit UI only after route behavior is approved and UI authority copy
   is reviewed.

Session binding and Codex continuation remain separate future gates.

## Browser Verification

Browser verification skipped: no runtime/UI/Cockpit files changed in this
design-only actual proof/evidence recording gate.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design
npm run smoke:ag-work-resume-review-metadata-closeout
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
node --check scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs
node --check scripts/smoke-ag-work-resume-review-metadata-closeout.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs
git diff --check
git diff --cached --check
```
