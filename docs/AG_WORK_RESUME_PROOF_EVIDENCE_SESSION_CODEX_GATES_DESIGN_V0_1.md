# AG Work Resume Proof Evidence Session Codex Gates Design v0.1

## Status

This document is design-only. It defines a future gate contract after Stage D
AG Resume imported context review metadata.

This document adds no runtime behavior. It adds no schema or migration. It
adds no writer, helper, route, or UI. It creates no proof/evidence records,
no session records or session bindings, no Codex records or actions, no work
items, no work events, and no imported context records.

This design adds no proof/evidence writer, no session binder, no Codex
continuation route/helper/UI, no app/api changes, no components changes, no lib runtime changes, no ChatGPT App/MCP/App schema changes, no bridge tools,
no Direct Resume Code, no relay, no telemetry/analytics/browser persistence,
and no browser report.

This design grants no approval, publish, retry, replay, merge, auto-merge,
external posting, or committed-state mutation authority. Durable approval
remains user/Core gated.

## Purpose

Imported context is bounded review metadata derived from a validated AG Resume
packet and an existing active confirmed mapping. It can help a reviewer see
packet summary material, expected files, expected checks, foreign refs summary,
and redaction metadata, but it must remain review metadata until separately
gated.

Imported context must remain review metadata because it may mention foreign
refs and foreign history that are not local Augnes proof, evidence, sessions,
work events, committed state, or Codex authority. A stored imported context
row means local review metadata exists. It does not mean proof/evidence was
reconciled, a session was bound, Codex may continue, or durable approval was
granted.

Proof/evidence reconciliation, session binding, and Codex continuation are
distinct future gates. Each gate needs its own design, explicit authorization,
actor, reason, validation, side-effect boundary, and verification. No gate
implies the next gate.

The first design-only proof/evidence reconciliation contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`. It
describes future review of imported context foreign refs as reconciliation
candidates only; it adds no runtime behavior, schema/migration,
writer/helper/route/UI, proof/evidence recording, session binding, Codex
behavior, approval, publish, retry, replay, or merge authority.

The future reconciliation candidate DB/schema contract is design-only in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
It documents possible future candidate table shape and indexes only, with no
schema/migration implementation and no downstream proof/evidence/session/Codex
authority.

Approval, publish, retry, replay, and merge remain separate from imported
context review. Durable approval remains user/Core gated and merge remains a
GitHub/user review decision, not an AG Resume imported context decision.

## Definitions

- **imported context review metadata**: a Stage D
  `ag_work_resume_imported_contexts` row containing bounded summary, expected
  files/checks, foreign refs summary, redaction metadata, actor, reason, and
  authority boundary for review only.
- **proof record**: a local Augnes proof/action record created only through a
  separately authorized proof path. Imported context is not a proof record and
  must not automatically create one.
- **evidence record**: a local verification evidence row created only through a
  separately authorized evidence path. Imported context is not an evidence
  record and must not automatically create one.
- **session binding**: an explicit local association between a known local work
  identity and a known existing session identity. Imported context must not
  create, infer, or mutate session bindings.
- **Codex continuation**: future authorized Codex work on local repo files
  after current local state and work context are read and stop conditions are
  defined. Imported context must not execute or continue Codex.
- **codex:read-brief**: the check-only Codex helper that reads current Augnes
  state and, when a work id is supplied, current Work Brief context before
  Codex work proceeds.
- **user/Core approval**: explicit human/Core-gated authorization for a named
  future action. A packet, imported context row, route `ok`, smoke pass, PR,
  browser pass, or proof row is not user/Core approval.
- **committed state authority**: authority to make durable accepted project
  state transitions in Augnes Core. Imported context review metadata has none.
- **merge/publish/retry/replay authority**: authority to merge GitHub PRs,
  externally publish, retry publication, replay delivery, or grant those
  abilities. Imported context review metadata has none.

## Gate Model

### Gate A: Imported Context Review Complete

The reviewer confirms that an imported context row exists for the intended
confirmed mapping and that its bounded review metadata is understandable,
redacted, and still relevant.

Gate A completion is not proof/evidence reconciliation, not session binding,
not Codex continuation, not work item/event creation, and not approval,
publish, retry, replay, or merge authority.

### Gate B: Proof/Evidence Reconciliation Design And Explicit Authorization

Proof/evidence reconciliation must be designed and authorized separately before
any imported context material can be used to create local proof or evidence
records.

The future gate must define the exact source refs, local target work identity,
actor, reason, validation, allowed record shape, side effects, failure modes,
and verification. Imported context does not automatically record
proof/evidence.

### Gate C: Session Binding Design And Explicit Authorization

Session binding must be designed and authorized separately before any local
session can be associated with the mapped local work.

The future gate must define the exact local work identity, explicit session
identity, actor, reason, validation, allowed binding behavior, side effects,
failure modes, and verification. Imported context does not automatically bind
sessions.

### Gate D: Codex Continuation After Fresh codex:read-brief

Codex continuation must be designed and authorized separately. A future Codex
continuation gate requires a fresh `codex:read-brief` result before Codex work
can proceed.

The future gate must define the local work identity, confirmed mapping,
reviewed imported context, expected files/checks, stop conditions, required
runtime ids, actor, reason, and verification. Imported context and Cockpit UI
do not automatically execute or continue Codex.

### Gate E: Approval/Publish/Retry/Replay/Merge Remains Separate

Approval, publish, retry, replay, merge, auto-merge, and external posting are
not downstream defaults of imported context review, proof/evidence
reconciliation, session binding, or Codex continuation.

Those actions remain separately user/Core gated. Merge remains outside Codex
authority and outside imported context authority.

## Required Future Checks Before Proof/Evidence

Before any future proof/evidence reconciliation implementation is approved,
the design must require:

- imported context row exists
- imported context status is `review_metadata`, or an approved future status
  only if separately designed
- redaction report is safe and explicitly excludes secrets, raw DB paths,
  session payloads, and proof payloads
- foreign refs remain foreign until a separate reconciliation gate validates
  them for local use
- user/Core actor is required
- user/Core reason is required
- no automatic proof/evidence recording from imported context

## Required Future Checks Before Session Binding

Before any future session binding implementation is approved, the design must
require:

- local work identity is confirmed
- session identity is explicit
- user/Core actor is required
- user/Core reason is required
- no automatic session binding from imported context

## Required Future Checks Before Codex Continuation

Before any future Codex continuation implementation is approved, the design
must require:

- confirmed mapping exists
- imported context was reviewed
- fresh `codex:read-brief` succeeds
- expected files/checks were reviewed
- stop conditions are defined
- `CODEX_WORK_ID` is present if required by the future runtime
- `CODEX_SESSION_ID` is present if required by the future runtime
- no automatic Codex execution from imported context or UI

## Authority Boundary

This design grants:

- no proof/evidence recording
- no session binding
- no Codex execution or continuation
- no work item creation
- no work event creation
- no confirmed mapping mutation
- no proposal mutation
- no approval, publish, retry, replay, merge, auto-merge, or external posting
- no Direct Resume Code
- no relay
- no committed state authority

Durable approval remains user/Core gated. Imported context review metadata is
not proof/evidence, not session binding, not Codex, not work authority, and
not approval/publish/retry/replay/merge authority.

## Non-Goals

- No schema or migration.
- No writer, helper, route, or UI.
- No proof/evidence writer.
- No proof/evidence reconciliation implementation.
- No session binder.
- No session binding implementation.
- No Codex continuation route/helper/UI.
- No Codex continuation implementation.
- No app/api changes.
- No components changes.
- No lib runtime changes.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Proof/evidence/session/Codex gate design only: this PR.
2. Proof/evidence reconciliation design:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`.
3. Reconciliation candidate DB/schema design:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
4. Proof/evidence schema/design or integration design, separately approved.
5. Session binding design, separately approved.
6. Codex continuation design, separately approved.
7. Runtime implementations only after separate user/Core approval.

Each future PR must restate the authority boundary, name actor and reason
requirements, identify side effects, include fail-closed checks, and verify
that imported context review metadata does not itself grant downstream
authority.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only proof/evidence/session/Codex gate slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-create-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs
```
