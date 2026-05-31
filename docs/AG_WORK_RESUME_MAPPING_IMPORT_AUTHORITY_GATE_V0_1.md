# AG Work Resume Mapping Import Authority Gate v0.1

## Status

This document is design-only. It is a proposal and authority contract for
future AG Resume real-packet mapping/import work, not runtime behavior.

This document adds no implementation. It adds no schema, no API route, no UI
control, no import, no persistence, no mapping record creation, no work item
creation, no proof/evidence recording, no session binding, no Codex execution,
and no approval, publish, retry, replay, merge, or committed-state mutation
authority.

Status summary: no runtime behavior, no schema, no API route, no UI control,
no import, no persistence, no mapping record creation, no work item creation,
no proof/evidence recording, no session binding, no Codex execution, and no
approval, publish, retry, replay, merge, or committed-state mutation.

The design does not authorize implementation by itself. Durable approval
remains user/Core gated.

## Purpose

The existing AG Resume pipeline can already:

- build a read-only AG Resume Packet preview
- preflight a packet with `ag:resume-preflight`
- run the target preview pure checker
- run the local target preview helper
- call the read-only target preview route
- inspect an already built packet in the Cockpit Operator tab
- validate copied packet only with Local B context sent as null
- test safe fixture, error-state, accessibility, and keyboard-readiness states

The existing pipeline still cannot:

- map foreign work to local work persistently
- import foreign packet context
- create local work items
- create mapping records
- bind sessions
- record proof/evidence
- start Codex
- approve, publish, or merge

This authority-gate design names the future decision points before any
real-packet mapping/import workflow is implemented.

## Definitions

- **AG Resume Packet**: a bounded, redacted JSON artifact that carries one
  foreign work unit's summary, Git refs, expected files/checks, foreign refs,
  and target policy for read-only Local B review.
- **foreign work id**: the `source_work.work_id` in a packet from another
  runtime, scope, or local context. It is not automatically a local work id.
- **local work id**: a work id owned by the current local Augnes runtime and
  scope.
- **foreign ref**: an action, evidence, evidence-pack, session, proof, Git, or
  handoff ref that came from the packet source. Foreign refs remain foreign
  unless user/Core separately reconciles them.
- **local mapping**: an association between a foreign scope/work_id and an
  existing local scope/work_id. Mapping does not create work, import packet
  content, record proof/evidence, bind sessions, approve, merge, or start
  Codex.
- **mapping proposal**: review metadata only. It may compare a packet's
  foreign work with a candidate local work item, but it is not a mapping
  record and is not durable authority.
- **confirmed mapping**: a future persisted mapping record that requires
  explicit user/Core action. It connects one foreign scope/work_id to one
  existing local scope/work_id, subject to schema and route design that do not
  exist in this PR.
- **imported resume context**: a future bounded review record derived from a
  validated packet and confirmed mapping. Imported context is not proof, not
  evidence, not approval, and not source of truth.
- **import**: writing a bounded imported resume context record. Import requires
  explicit user/Core action and future schema/route design.
- **persistence**: any durable write to local Augnes storage, including mapping
  records, imported context records, work items, work events, proof records,
  evidence rows, or session bindings.
- **user/Core approval**: explicit human/Core-gated authorization for a named
  future write or authority action. A packet, route `ok`, preview
  `ok_to_continue`, PR, smoke pass, or proof row is not user/Core approval.
- **proof/evidence authorization**: separate explicit authorization to write
  proof/evidence records for a known local work item. Mapping and import do
  not grant this authorization.
- **session binding authorization**: separate explicit authorization to bind an
  existing local session to known local work context. Mapping and import do not
  grant this authorization.
- **execution authority**: permission to start or continue Codex against local
  work. Codex execution remains separate and must go through the normal
  `codex:read-brief` gate after local mapping is confirmed.

## Current Allowed Behavior

The merged AG Resume slices currently allow read-only behavior only:

- validate a packet with `ag:resume-preflight`
- build a read-only packet preview
- run the target preview pure checker
- run the local target preview helper
- call the read-only target preview route
- use the Cockpit panel to paste packet/local context
- load safe synthetic fixtures
- validate pasted packet only with `local: null`, `strict: true`, and
  `skip_preflight: false`
- inspect safe fixture, error-state, accessibility, and keyboard-readiness
  states

All of the above behavior is read-only. None of it creates records, imports
context, maps work, records proof/evidence, binds sessions, starts Codex,
approves, publishes, merges, or mutates committed state.

## Still Forbidden Behavior

The following behavior remains forbidden unless a future user/Core-gated design
and implementation PR explicitly authorizes it:

- no automatic local work item creation
- no automatic mapping creation
- no automatic import/persistence
- no proof/evidence recording
- no session binding
- no Codex execution
- no approval, publish, retry, replay, external posting, merge, or auto-merge
- no committed-state mutation
- no Direct Resume Code route
- no relay
- no use of foreign proof/evidence/session refs as local proof/evidence/session
  records
- no treatment of route `ok` or preview `ok_to_continue` as implementation
  authority

## Future Gated Workflow Stages

Future work, if approved, should remain split into separate stages and separate
PRs:

- **Stage A: mapping proposal preview**. Read-only. No persistence. It may
  compare a packet to candidate local work and surface questions.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md` documents the
  Stage A mapping proposal preview only; it does not add persistence or
  mapping/import authority.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md` documents the
  local helper for this Stage A mapping proposal preview only; it remains
  preview-only and does not create mappings, imports, proof/evidence, sessions,
  work items, routes, or Codex execution authority.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md` documents the
  read-only route for this Stage A mapping proposal preview only; it remains
  preview-only and does not create mappings, imports, proof/evidence, sessions,
  work items, persistence, or Codex execution authority.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md`
  documents the Cockpit Operator tab panel over the route; it remains Stage A
  preview-only and adds no mapping/import persistence or approval authority.
- **Stage B: mapping proposal record**. Future write stage only if user/Core
  approves a schema and record class. A proposal record is still not a
  confirmed mapping.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md` documents the
  Stage B mapping proposal record design; current Stage A surfaces remain
  read-only and do not implement proposal records.
  Stage B DB/schema design is documented in
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md`; current
  Stage A surfaces and Stage B record design remain non-implementation; no
  schema or migration is added by current docs.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
  documents the Stage B schema foundation; it creates no proposal records and
  grants no write route, confirmed mapping, import, proof/evidence, session,
  Codex, approval, publish, or merge authority.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md` documents the
  first Stage B proposal record writer; it creates proposal-only rows and
  still grants no confirmed mapping, import, proof/evidence, session, Codex,
  approval, publish, retry, replay, or merge authority.
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md` documents the
  first Stage B proposal record read helper and route; it performs no writes
  and still grants no confirmed mapping, import, proof/evidence, session,
  Codex, approval, publish, retry, replay, or merge authority.
- **Stage C: confirmed mapping record**. Future write stage requiring explicit
  user/Core action for one foreign scope/work_id and one existing local
  scope/work_id.
- **Stage D: imported resume context record**. Future write stage requiring
  explicit user/Core action and schema. It writes bounded review metadata only.
- **Stage E: optional local work item creation**. Future-only and only if ever
  allowed by explicit user/Core action and separate design.
- **Stage F: optional proof/evidence/session reconciliation**. Future-only and
  requiring separate proof/evidence/session authority.
- **Stage G: optional Codex continuation**. Future-only, after confirmed local
  mapping and successful `codex:read-brief`.

No stage implies the next stage. Each write stage requires separate user/Core
approval. Proof/evidence, session binding, and Codex execution remain separate
authority gates.

## Minimal Future Mapping Proposal Preview Shape

A future read-only mapping proposal preview object may include:

```json
{
  "packet_foreign_work": {
    "scope": "project:augnes",
    "work_id": "AG-123",
    "title": "Foreign work title",
    "status": "in_progress",
    "next_action": "Continue after review"
  },
  "candidate_local_work": {
    "scope": "project:augnes",
    "work_id": "AG-LOCAL-123",
    "title": "Local work title",
    "status": "in_progress",
    "next_action": "Review local context"
  },
  "match_confidence": "possible",
  "comparison_summary": [],
  "conflicts": [],
  "gaps": [],
  "required_user_core_questions": [],
  "recommended_next_step": "User/Core should decide whether to confirm a mapping.",
  "authority_boundary": {
    "read_only": true,
    "no_persistence": true,
    "no_mapping_created": true
  },
  "foreign_refs_summary": {}
}
```

`match_confidence` is a label, not a decision. The preview has no persistence
and no authority to confirm mapping, import context, create work, reconcile
foreign refs, record proof/evidence, bind sessions, or execute Codex.

## Minimal Future Confirmed Mapping Record Shape

A possible future persisted confirmed mapping record shape, not implemented in
this PR, might include:

```json
{
  "mapping_id": "ag-resume-mapping:example",
  "foreign_scope": "project:augnes",
  "foreign_work_id": "AG-123",
  "local_scope": "project:augnes",
  "local_work_id": "AG-LOCAL-123",
  "packet_id": "resume-packet:example",
  "packet_hash": "sha256:example",
  "source_runtime_instance_id": "runtime-instance:source",
  "confirmed_by": "user-core",
  "confirmed_at": "2026-05-31T00:00:00.000Z",
  "confirmation_reason": "User/Core confirmed this existing local work match.",
  "status": "active",
  "supersedes_mapping_id": null,
  "authority_boundary": {
    "does_not_record_proof_evidence_session": true,
    "does_not_import_packet_content": true,
    "does_not_authorize_codex": true
  },
  "created_at": "2026-05-31T00:00:00.000Z",
  "updated_at": "2026-05-31T00:00:00.000Z"
}
```

This future record does not create proof/evidence/session records. It does not
import packet content by itself. It does not authorize Codex execution. It does
not approve or merge anything.

## Minimal Future Imported Resume Context Record Shape

A possible future persisted imported resume context record shape, not
implemented in this PR, might include:

```json
{
  "import_id": "ag-resume-import:example",
  "mapping_id": "ag-resume-mapping:example",
  "packet_id": "resume-packet:example",
  "packet_hash": "sha256:example",
  "source_runtime_instance_id": "runtime-instance:source",
  "imported_summary": "Bounded review summary.",
  "imported_expected_files": [],
  "imported_expected_checks": [],
  "foreign_refs_summary": {},
  "redaction_report": {
    "secrets_included": false,
    "raw_db_paths_included": false
  },
  "created_by": "user-core",
  "created_at": "2026-05-31T00:00:00.000Z",
  "status": "review_metadata",
  "authority_boundary": {
    "review_metadata_only": true,
    "not_proof_evidence": true,
    "not_committed_state_authority": true,
    "not_approval": true,
    "does_not_start_codex": true
  }
}
```

Imported context is review metadata only. Imported context is not
proof/evidence. Imported context is not committed state authority.
Imported context does not imply user/Core approval. Imported context does not start Codex.

## Invalid And Preflight-Failing Packet Handling

Malformed packet JSON must fail before any route, mapping, or import path.
Preflight-failing packets must not be mapped/imported.

A previously failing packet can only be reconsidered after a corrected packet
passes preflight. The correction must preserve packet provenance or clearly
create a new packet id/hash. Cockpit or any future UI must not silently apply
corrections. User/Core must decide whether a corrected packet is acceptable
before any future write stage.

## Foreign Ref Reconciliation

Foreign action, evidence, evidence-pack, proof, and session refs remain
foreign. Local proof/evidence/session records are never created automatically.

Reconciliation, if ever implemented, requires separate design and user/Core
authorization. Foreign refs may be displayed as context only. Foreign refs may
be used as source refs only if a future design defines that safely and keeps
local proof/evidence/session authority separate.

## Codex Continuation Gate

Even after confirmed mapping/import, Codex cannot start automatically. A Codex
start requires:

- local runtime endpoint
- `CODEX_SCOPE`
- `CODEX_WORK_ID`
- successful `npm run codex:read-brief`
- expected files/checks
- explicit evidence/proof/session authorization choices
- stop conditions

Failed `codex:read-brief` means stop. PR creation is not merge authority.
Proof is not approval.

## UX Principles For Future UI

- Default to preview-only.
- Visually separate write actions from read-only previews.
- Require explicit user/Core confirmation copy for dangerous future write
  actions.
- Do not hide writes.
- Do not call write routes from preview buttons.
- Avoid ambiguous labels such as `Resume` when they could imply execution.
- Use labels such as `Propose mapping`, `Confirm mapping`, and
  `Import context` only after those stages are designed and approved.
- Explain disabled states and warnings.
- Preserve accessibility and keyboard behavior.

## Required Future PR Review Checklist

Future PRs touching this area must include:

- changed files
- authority boundary statement
- schema changes: yes/no
- route changes: yes/no
- write route: yes/no
- DB migration: yes/no
- proof/evidence writes: yes/no
- session binding: yes/no
- work item creation: yes/no
- mapping record creation: yes/no
- import record creation: yes/no
- Codex execution: yes/no
- approval/publish/retry/replay/merge: yes/no
- browser verification required if UI changes
- smoke coverage
- skipped checks with concrete reasons
- user/Core judgment questions

## Non-Goals

This PR does not implement mapping/import/persistence. Non-goals:

- no implementation in this PR
- no routes
- no DB/schema changes
- no UI
- no import
- no persistence
- no mapping records
- no work item creation
- no Direct Resume Code
- no relay
- no proof/evidence/session/Codex/approval/merge authority

## Next Suggested Implementation After This Design

If user/Core approves, the next implementation PR could add a read-only
mapping proposal preview helper with no persistence. Alternatively, stop here
and dogfood the current paste-only workflow with a real packet.

This design document itself does not authorize implementation.
