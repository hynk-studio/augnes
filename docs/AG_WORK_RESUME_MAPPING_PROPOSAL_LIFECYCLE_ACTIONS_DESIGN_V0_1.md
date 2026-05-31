# AG Work Resume Mapping Proposal Lifecycle Actions Design v0.1

## Status

This document is design-only. It defines future Stage B lifecycle semantics for
AG Resume mapping proposal records before any lifecycle update route, helper,
writer, or UI exists.

This PR adds no runtime behavior, no DB migration, no route, no helper, no UI,
no write authority, no lifecycle writer, no confirmed mapping, no import, no
proof/evidence recording, no session binding, no Codex execution, and no
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state mutation authority.

Proposal records remain review metadata only. This design does not update
proposal records and does not authorize any lifecycle mutation.

Durable approval remains user/Core gated.

## Purpose

Lifecycle action semantics need to be designed before any update helper, route,
or Cockpit control exists because the words `withdraw`, `reject`, `supersede`,
and `expire` can otherwise be mistaken for mapping, import, proof/evidence,
session, Codex, approval, publish, retry, replay, or merge authority.

Stage B proposal rows are review metadata only. They can preserve a proposed
relationship between one foreign work identity and one candidate local work
identity for later user/Core review, but they are not confirmed mappings and
they do not import context. A future lifecycle action would only move a
proposal record out of active consideration or link it to a replacement
proposal; it would not perform the downstream work.

This design establishes the boundary for future work so any later lifecycle
implementation can be reviewed against explicit non-authority rules.

## Implemented Helper Slice

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md`
documents the first bounded lifecycle action core and local helper. That helper
updates existing proposal lifecycle/review metadata only; it adds no route, UI,
schema, migration, replacement proposal creation, confirmed mapping, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

## Definitions

- **active proposal statuses**: `proposed` and `needs_review`. These statuses
  represent proposals that are still active review metadata.
- **terminal or inactive proposal statuses**: `withdrawn`, `rejected`,
  `superseded`, and `expired`. These statuses remove a proposal from active
  consideration without confirming a mapping.
- **lifecycle action**: a future explicit user/Core-gated operation that moves
  one active proposal record to `withdrawn`, `rejected`, `superseded`, or
  `expired`, and records review metadata for that move.
- **reviewer/user-Core actor**: the user/Core actor or approved user/Core
  surface that explicitly requests a lifecycle action. A script pass, browser
  pass, proof row, PR, or route `ok` value is not this actor.
- **review note**: the future human-readable reason or context for a lifecycle
  action. It is review metadata only, not proof/evidence.
- **replacement proposal**: a later proposal record that replaces an earlier
  proposal for review. A replacement proposal is still proposal metadata only.
- **confirmed mapping**: a separate future Stage C object created only through
  a separately approved user/Core-gated design and implementation. Confirmed
  mapping is not a Stage B proposal status and is not created by any lifecycle
  action in this design.

There is no proposal status named `confirmed`. This design does not add or
imply one.

## Transition Model

Allowed future lifecycle transitions from active statuses:

- `proposed` -> `withdrawn`
- `proposed` -> `rejected`
- `proposed` -> `superseded`
- `proposed` -> `expired`
- `needs_review` -> `withdrawn`
- `needs_review` -> `rejected`
- `needs_review` -> `superseded`
- `needs_review` -> `expired`

Terminal statuses do not transition further unless a future separately gated
design allows correction or reopen behavior. That future correction/reopen
design would need its own authority review and side-effect guards.

No transition ever means confirmed mapping. No transition creates an import,
proof/evidence record, session binding, Codex continuation, approval, publish,
retry, replay, merge, auto-merge, external posting, or committed-state
mutation.

## Action Semantics

### Withdraw

`withdraw` is used when the proposal should be removed from active
consideration without saying the candidate mapping is wrong.

A future withdraw action should require an explicit reviewer/user-Core actor
and a reason or review note. It should update only the proposal lifecycle and
review metadata fields needed to mark the proposal `withdrawn`.

Withdraw grants no confirmed mapping, import, proof/evidence, session, Codex,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state mutation authority.

### Reject

`reject` is used when user/Core determines the candidate mapping should not
proceed.

A future reject action should require an explicit reviewer/user-Core actor and
a reason or review note. Rejection is a review decision about the proposal
metadata. It is not proof/evidence and does not mutate the foreign packet or
the candidate local work item.

Reject grants no confirmed mapping, import, proof/evidence, session, Codex,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state mutation authority.

### Supersede

`supersede` is used when a later proposal replaces this proposal or when this
proposal is no longer the current candidate under review.

The current partial unique index blocks duplicate active proposals for the same
`foreign_scope`, `foreign_work_id`, `candidate_local_scope`, and
`candidate_local_work_id` tuple while status is `proposed` or `needs_review`.
Because of that duplicate-active tuple rule, any future same-tuple
supersede-with-replacement flow must be deliberately designed and likely
transactional. The future implementation would need to move the old proposal
out of the active set and create or link the replacement in one guarded DB
transaction, or otherwise prove the ordering cannot leave duplicate active
rows or an inconsistent supersession link.

A future supersede action should require an explicit reviewer/user-Core actor,
a reason or review note, and, when applicable, a replacement proposal id such
as `replacement_proposal_id` or `superseded_by_proposal_id`.

Supersede grants no confirmed mapping, import, proof/evidence, session, Codex,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state mutation authority.

### Expire

`expire` is used when `expires_at` is reached or stale proposal review should
be removed from active consideration.

`expires_at` being in the past must not by itself imply an unauthorized write.
Reading a stale proposal may show it is stale, but this design does not
authorize any automatic update. Automatic expiration, if ever added, requires a
separate user/Core-gated design or maintenance-authority design with explicit
scope, side-effect guards, and verification.

A future expire action should require an explicit actor or separately approved
maintenance authority and should record a review note or deterministic reason
for the expiration.

Expire grants no confirmed mapping, import, proof/evidence, session, Codex,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state mutation authority.

## Future Update Contract Sketch

The following is a non-implemented future input shape for lifecycle mutation.
It is design-only and must not be treated as a route, helper, schema, UI, or
runtime contract in this PR.

```json
{
  "proposal_id": "ag-resume-mapping-proposal:example",
  "action": "withdraw | reject | supersede | expire",
  "reviewed_by": "user-core:reviewer",
  "review_note": "Reason for lifecycle action",
  "reviewed_at": "2026-05-31T00:00:00.000Z",
  "replacement_proposal_id": "ag-resume-mapping-proposal:replacement-if-supersede",
  "superseded_by_proposal_id": "ag-resume-mapping-proposal:replacement-if-supersede"
}
```

`replacement_proposal_id` or `superseded_by_proposal_id` should apply only to a
future supersede action, if applicable. Future implementation must validate
that `proposal_id` names exactly one existing active proposal and that action
inputs are unambiguous.

Future implementation must use a DB transaction and side-effect guards. The
guards must prove proposal row count and intended row content changes are
bounded, no unauthorized tables are written, and no downstream authority is
granted.

## DB Behavior

This PR changes no DB schema and creates no tables.

A future lifecycle implementation would update only
`ag_work_resume_mapping_proposals` lifecycle and review fields, such as
`status`, `reviewed_by`, `reviewed_at`, `review_note`, `updated_at`,
`supersedes_proposal_id`, and `superseded_by_proposal_id` where applicable.

A future lifecycle implementation must not write confirmed mapping tables,
import tables, imported-context tables, work tables, proof/evidence tables,
session tables, Codex execution records, bridge tables, MCP/App schema, or
telemetry/analytics storage.

A future implementation must preserve an audit trail through `reviewed_by`,
`reviewed_at`, `review_note`, `status`, `updated_at`, and supersession link
fields where applicable.

## Authority Boundary

- No mapping confirmation.
- No confirmed mapping object.
- No import.
- No imported context.
- No work item or work event creation.
- No proof/evidence recording.
- No proof/evidence authorization.
- No session binding.
- No Codex execution or continuation.
- No ChatGPT App card.
- No MCP/App schema change.
- No bridge tool.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

- No route/helper/UI.
- No lifecycle writer.
- No runtime behavior.
- No DB schema or migration.
- No confirmed mapping design.
- No confirmed mapping implementation.
- No import design.
- No import implementation.
- No proof/evidence/session reconciliation.
- No Codex execution behavior.
- No Direct Resume Code.
- No relay.
- No ChatGPT App, MCP/App schema, or bridge behavior.
- No telemetry, analytics, or browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Lifecycle design only: this PR.
2. Lifecycle update helper/core: future, separately approved.
3. Lifecycle route: future, separately approved.
4. Cockpit lifecycle controls: future, separately approved, if ever allowed.
5. Stage C confirmed mapping design: future, separately approved.

Each future PR must restate the authority boundary and prove the requested
surface grants no unscoped downstream authority.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only lifecycle slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-actions-design
npm run smoke:ag-work-resume-mapping-proposal-record-read-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-proposal-record-design
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-actions-design.mjs
```
