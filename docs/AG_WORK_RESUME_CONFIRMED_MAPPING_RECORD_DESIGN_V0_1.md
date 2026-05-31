# AG Work Resume Confirmed Mapping Record Design v0.1

## Status

This document is design-only. It defines the Stage C AG Resume confirmed
mapping record contract as a future design after the Stage B proposal record
and proposal lifecycle slices.

This PR adds no runtime behavior, no schema/migration, no writer/helper/route/UI,
and no write authority. It does not create confirmed mapping rows. It does not import context.
It does not record proof/evidence. It does not bind sessions. It does not execute Codex.

This design adds no DB schema, no migration, no confirmed mapping writer, no
helper, no route, no Cockpit UI, no ChatGPT App card, no MCP/App schema, no
bridge tool, no import record, no imported resume context, no work item, no
work event, no proof/evidence/session behavior, no Codex continuation, no
Direct Resume Code, no relay, no telemetry/analytics, and no
localStorage/sessionStorage/indexedDB persistence.

Durable approval remains user/Core gated.

## Purpose

Stage C confirmed mapping is the future step that would explicitly associate
one foreign work identity with one existing local work identity after
user/Core confirmation. It is separate from Stage B because Stage B proposal
records and lifecycle actions are review metadata only.

Proposal records can preserve a candidate association for review. Lifecycle
actions can move proposals out of active consideration. Neither proposal
records nor lifecycle actions confirm mappings, import context, create work,
record proof/evidence, bind sessions, authorize Codex, approve, publish, retry,
replay, or merge.

Confirmed mapping must be designed separately because it is a different record
class and authority boundary. A future confirmed mapping connects one
`foreign_scope` + `foreign_work_id` to one `local_scope` + `local_work_id` that
already exists locally. Even when such a future row exists, the mapping still
does not import packet content, create imported resume context, record
proof/evidence, bind sessions, authorize Codex execution or continuation,
grant approval, publish, retry, replay, or merge.

This document names the future record shape, constraints, lifecycle, schema
considerations, writer/helper/route sketch, authority boundary, and non-goals
before any implementation exists.

## Definitions

- **foreign work identity**: the source-side identity made from
  `foreign_scope` and `foreign_work_id`. It remains foreign context until a
  future user/Core confirmation creates a confirmed mapping row.
- **local work identity**: the local identity made from `local_scope` and
  `local_work_id` in the current Augnes runtime.
- **existing local work item**: a local work item that already exists before
  mapping confirmation. Confirmed mapping must not create it.
- **proposal record**: a Stage B persisted review metadata row that proposes a
  possible association between one foreign work identity and one candidate
  local work identity. It is not a confirmed mapping.
- **active proposal**: a proposal record still in active consideration,
  currently represented by Stage B statuses such as `proposed` or
  `needs_review`.
- **lifecycle action**: a Stage B proposal metadata action such as withdraw,
  reject, supersede, or expire. A lifecycle action does not create a confirmed
  mapping.
- **confirmed mapping**: a future Stage C persisted identity association
  between one foreign work identity and one existing local work identity after
  explicit user/Core confirmation.
- **mapping confirmation actor / user-Core actor**: the explicit user/Core
  actor or approved user/Core surface that confirms the mapping. A route `ok`,
  smoke pass, browser pass, PR merge, or proof row is not this actor.
- **confirmation reason**: the human-readable reason supplied by the
  confirmation actor for why this foreign work identity should map to this
  existing local work identity.
- **source packet identity**: packet provenance fields that may be copied for
  traceability only: `packet_id`, `packet_hash`, and
  `source_runtime_instance_id`.
- **mapping status**: the future Stage C lifecycle state of a confirmed
  mapping: `active`, `superseded`, `withdrawn`, or `revoked`.
- **supersession**: a future relationship showing an active mapping was
  replaced by another confirmed mapping. Supersession is not import,
  proof/evidence, session binding, Codex authority, approval, publish, retry,
  replay, or merge.
- **revocation**: a future user/Core determination that the mapping should no
  longer be trusted. Revocation does not delete proof/evidence, sessions, work
  items, or imported context.
- **imported resume context**: future Stage D review metadata derived from a
  validated packet and a confirmed mapping. It is explicitly separate from
  confirmed mapping.

## Confirmed Mapping Record Shape

The following is a future non-implemented confirmed mapping record shape. It
is design only, not schema/runtime, not a writer contract, and not a route
contract in this PR.

```json
{
  "mapping_id": "ag-resume-confirmed-mapping:example",
  "record_kind": "ag_work_resume_confirmed_mapping",
  "schema": "augnes.ag_work_resume_confirmed_mapping.v0_1",
  "status": "active",
  "foreign_scope": "project:source",
  "foreign_work_id": "AG-FOREIGN-1",
  "local_scope": "project:augnes",
  "local_work_id": "AG-LOCAL-1",
  "source_proposal_id": "ag-resume-mapping-proposal:example",
  "packet_id": "resume-packet:example",
  "packet_hash": "sha256:example",
  "source_runtime_instance_id": "runtime-instance:source",
  "confirmed_by": "user-core:reviewer",
  "confirmed_at": "2026-05-31T00:00:00.000Z",
  "confirmation_reason": "User/Core confirmed this existing local work match.",
  "supersedes_mapping_id": null,
  "superseded_by_mapping_id": null,
  "revoked_by": null,
  "revoked_at": null,
  "revocation_reason": null,
  "authority_boundary": {
    "confirmed_mapping_created": true,
    "proposal_record_created": false,
    "import_record_created": false,
    "imported_context_created": false,
    "work_item_created": false,
    "work_event_created": false,
    "proof_recorded": false,
    "evidence_recorded": false,
    "session_bound": false,
    "codex_executed": false,
    "approval_granted": false,
    "publish_retry_replay_authority": false,
    "merge_authority": false,
    "durable_approval": "user/Core gated"
  },
  "created_at": "2026-05-31T00:00:00.000Z",
  "updated_at": "2026-05-31T00:00:00.000Z"
}
```

`mapping_id` is not `proposal_id` and not `import_id`. `source_proposal_id` is
traceability to Stage B review metadata, not a proposal status named
`confirmed`. `packet_id`, `packet_hash`, and `source_runtime_instance_id` are
traceability metadata only. They are not proof, evidence, import authority,
session authority, Codex authority, approval, publish, retry, replay, or merge
authority.

## Mapping Constraints

Intended future constraints:

- One active confirmed mapping per `foreign_scope` + `foreign_work_id`.
- One foreign work maps to one existing local work at a time.
- Local work must already exist.
- Confirmed mapping must not create local work.
- Confirmation should require an explicit user/Core actor and confirmation
  reason.
- `source_proposal_id` should be required for the normal future Stage C
  implementation path because Stage B proposal records provide the review
  metadata and traceability for confirmation.
- If `source_proposal_id` is missing, a future normal confirmation route must
  reject the request with an invalid-input result and no writes.
- If `source_proposal_id` points to a missing proposal record, a future normal
  confirmation route must reject the request with a not-found result and no
  writes.
- If `source_proposal_id` points to an inactive, rejected, withdrawn,
  superseded, or expired proposal, a future normal confirmation route must
  reject the request with a not-active-for-confirmation result and no writes.
- If a future direct confirmation path without `source_proposal_id` is ever
  wanted, it must be separately designed and must require extra confirmation
  evidence such as explicit actor, reason, packet id/hash, local work lookup
  proof, and an authority copy. That path is out of scope here.
- Do not add a proposal status named `confirmed`.
- A proposal lifecycle status must not automatically create a confirmed
  mapping.
- A route ok, smoke pass, browser pass, PR merge, or proof row is not
  confirmation.

No constraint in this section creates schema, migration, helper, route, UI, or
runtime behavior in this PR.

## Relationship To Proposal Records

- A proposal record is review metadata only.
- Lifecycle actions move proposals out of active consideration but do not
  confirm mappings.
- Confirmed mapping may be created only by future explicit Stage C
  confirmation.
- A confirmed mapping may reference a proposal record for traceability.
- Creating a confirmed mapping should not mutate the source proposal record
  unless a future design explicitly says so.
- If a future implementation wants to supersede/close proposal records during
  confirmation, that behavior must be separately designed or transactionally
  guarded.

Stage B remains proposal-only. There is no proposal status named `confirmed`,
and a lifecycle action does not create confirmed mapping rows.

## Status And Lifecycle

Future confirmed mapping statuses:

- `active`: the current confirmed association for a foreign work identity.
- `superseded`: the mapping was replaced by another confirmed mapping.
- `withdrawn`: user/Core removed the mapping from active use without saying it
  was wrong.
- `revoked`: user/Core determined the mapping should no longer be trusted.

Suggested transitions:

- `active` -> `superseded`
- `active` -> `withdrawn`
- `active` -> `revoked`

Terminal statuses do not transition further unless a future correction/reopen
design allows it. That correction/reopen design would require separate
authority review, transaction rules, and side-effect guards.

`superseded` means replaced by another confirmed mapping. `withdrawn` means
user/Core removed mapping from active use without saying it was wrong.
`revoked` means user/Core determined the mapping should no longer be trusted.

No status implies import, imported resume context, proof/evidence, session
binding, Codex execution or continuation, approval, publish, retry, replay,
merge, auto-merge, external posting, or committed-state mutation beyond the
future mapping row itself.

## Future DB/Schema Considerations

Design only:

- Possible table name: `ag_work_resume_confirmed_mappings`.
- Possible active unique index: unique on `foreign_scope`, `foreign_work_id`
  where `status = 'active'`.
- Possible lookup index on `local_scope`, `local_work_id`.
- Possible lookup index on `source_proposal_id`.
- Possible lookup index on `packet_id`, `packet_hash`.
- Possible lookup index on `status`, `created_at`.

No schema/migration is added in this PR.

The design-only DB/schema contract for these future rows is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md`; it adds no
schema implementation, migration, runtime behavior, writer/helper/route/UI,
confirmed mapping rows, import, proof/evidence, session binding, Codex
execution, or approval/publish/retry/replay/merge authority.

The schema foundation implementation is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`; it
adds the future confirmed mapping table and indexes only, creates no rows in
normal runtime, and still grants no writer/helper/route/UI, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

Future implementation must use a transaction and side-effect guards. The
guards must prove the only intended write is the confirmed mapping row or its
future lifecycle fields, and that no proposal creation, import, imported
context, work, proof/evidence, session, Codex execution, bridge, MCP/App,
approval, publish, retry, replay, merge, telemetry, analytics, or browser
persistence writes occurred.

The first confirmed mapping writer/helper implementation is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`. It creates one
confirmed mapping identity association row from an active Stage B proposal and
existing local work, and still adds no route/UI, import, proof/evidence,
session binding, Codex execution, approval, publish, retry, replay, or merge
authority.

The JSON route over that writer is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`. It delegates to the
shared writer core and still adds no Cockpit UI, schema/migration, import,
proof/evidence, session binding, Codex execution, approval, publish, retry,
replay, or merge authority.

## Future Writer/Helper/Route Contract Sketch

Design only. A future writer/helper/route input could include:

```json
{
  "foreign_scope": "project:source",
  "foreign_work_id": "AG-FOREIGN-1",
  "local_scope": "project:augnes",
  "local_work_id": "AG-LOCAL-1",
  "source_proposal_id": "ag-resume-mapping-proposal:example",
  "packet_id": "resume-packet:example",
  "packet_hash": "sha256:example",
  "source_runtime_instance_id": "runtime-instance:source",
  "confirmed_by": "user-core:reviewer",
  "confirmation_reason": "User/Core confirmed this existing local work match.",
  "confirmed_at": "2026-05-31T00:00:00.000Z"
}
```

A future implementation must reject missing explicit actor/reason. It must
reject non-existing local work. It must reject a duplicate active mapping
unless a supersession path is explicitly designed. It must reject missing,
missing-record, inactive, rejected, withdrawn, superseded, or expired
`source_proposal_id` for the normal Stage C path. It must not import context.
It must not write proof/evidence/session/work/Codex tables. It must return an
authority boundary.

This sketch is not implementation. It is not a helper, route, schema, Cockpit
control, ChatGPT App card, MCP/App tool, bridge tool, Direct Resume Code,
relay, or runtime contract in this PR.

## Authority Boundary

- Confirmed mapping creation is only a foreign/local identity association.
- It is not import.
- It is not imported resume context.
- It is not proof/evidence.
- It is not session binding.
- It is not Codex execution or continuation.
- It is not approval, publish, retry, replay, merge, auto-merge, external
  posting, or committed-state mutation beyond the future mapping row itself.
- It does not create proposal records.
- It does not create import records.
- It does not create imported context.
- It does not create work items or work events.
- It does not reconcile foreign proof/evidence/session refs as local records.
- It does not grant proof/evidence authorization.
- It does not grant session binding authorization.
- It does not grant Codex authority.
- Durable approval remains user/Core gated.

## Non-Goals

- No schema/migration.
- No writer/helper/route.
- No Cockpit UI.
- No ChatGPT App card.
- No MCP/App schema.
- No bridge tool.
- No import design implementation.
- No imported context implementation.
- No proof/evidence/session reconciliation.
- No Codex continuation.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Confirmed mapping design only: this PR.
2. Confirmed mapping DB/schema design:
   `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md`.
3. Confirmed mapping DB/schema implementation:
   `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
4. Confirmed mapping writer/helper:
   `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`.
5. Confirmed mapping route:
   `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`.
6. Confirmed mapping Cockpit review/control UI, only if separately approved.
7. Imported resume context design as Stage D.
8. Proof/evidence/session/Codex gates remain separate.

Each future PR must restate the authority boundary and prove it does not grant
unscoped downstream authority.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only confirmed mapping slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-confirmed-mapping-record-design
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route
npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action
npm run smoke:ag-work-resume-mapping-proposal-record-read-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-record-read
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs
```
