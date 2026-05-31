# AG Work Resume Mapping Proposal Record Design v0.1

## Status

This document is design-only. It defines the Stage B AG Resume mapping proposal
record design and authority boundary before any implementation exists.

This document adds no implementation, no schema, no migration, no route, no UI
control, no persistence, no record creation, no confirmed mapping, no import,
no proof/evidence recording, no session binding, no Codex execution, and no
approval, publish, retry, replay, merge, or state mutation authority.

Stage B in this document is proposal record design only. It does not authorize
DB/schema work, migrations, write routes, Cockpit controls, runtime behavior,
record writers, mapping proposal record creation, confirmed mapping record
creation, imported resume context, proof/evidence writes, session binding,
Codex continuation, approval, publish, retry, replay, external posting, merge,
auto-merge, telemetry, local storage persistence, or committed-state mutation.

Durable approval remains user/Core gated.

## Purpose

Stage A mapping proposal previews are ephemeral review metadata. They can help
an operator compare a foreign AG Resume Packet with explicit Local B candidate
work, but the preview result is transient and is not a durable decision.

A future Stage B mapping proposal record would preserve a proposed mapping for
later user/Core review. The proposed mapping remains review metadata. A proposal
record is not a confirmed mapping. A proposal record is not imported resume
context. A proposal record does not authorize writes beyond the proposal record
itself, and even that future write requires separately approved schema and write
route work.

This document defines the possible record shape and authority boundary before
any schema, migration, route, UI control, persistence path, or writer exists.

## Relationship To Existing Stages

- **Stage A: mapping proposal preview**. Read-only mapping proposal preview,
  already implemented by the pure helper, local helper, route, and Cockpit
  panel. Stage A returns proposal-only review metadata and creates no records.
- **Stage B: mapping proposal record**. Future mapping proposal record stage,
  design-only in this PR. This document defines possible shape and authority
  rules but implements nothing.
- **Stage C: confirmed mapping record**. Future confirmed mapping record stage,
  requiring separate user/Core-gated design and explicit action.
- **Stage D: imported resume context**. Future imported resume context stage,
  requiring separate user/Core-gated design and explicit action.
- **Proof/evidence/session/Codex gates**. Proof/evidence recording, session
  binding, and Codex continuation remain separate authority gates. No Stage B
  proposal record grants those authorities.

No stage implies the next stage. Stage B does not authorize Stage C, Stage D,
proof/evidence, session binding, Codex execution, approval, publication, retry,
replay, or merge.

## Definitions

- **mapping proposal record**: a future persisted review record that captures a
  proposed association between one foreign work identity and one selected
  candidate local work identity for later user/Core review. It is proposal-only.
- **proposal status**: the future Stage B lifecycle state for a proposal record:
  `proposed`, `needs_review`, `superseded`, `withdrawn`, `rejected`, or
  `expired`.
- **foreign work identity**: the foreign scope and foreign work id supplied by
  the AG Resume Packet source. It is not automatically a local work id.
- **candidate local work identity**: the Local B scope and local work id for an
  existing candidate work item supplied for review. A candidate does not become
  mapped by appearing in a proposal record.
- **selected candidate**: the explicit candidate chosen for proposal review.
  Stage B must not infer a candidate silently when more than one candidate is
  available.
- **proposal source preview**: the Stage A mapping proposal preview that
  informed the proposed record. It remains source review metadata.
- **proposal preview id**: the `proposal_preview_id` from the Stage A review
  result. It is not a durable mapping and not an import.
- **proposal snapshot**: a bounded, redacted copy or summary of the relevant
  preview fields at the time the proposal record was proposed.
- **proposal review metadata**: comparison, gaps, conflicts, questions,
  confidence labels, repo context summary, redaction summary, proposer/reviewer
  fields, and notes needed for later user/Core review.
- **proposal supersession**: a trace relationship showing that one proposal was
  replaced by a newer proposal. Supersession is not confirmation.
- **proposal withdrawal**: removal of a proposal from consideration by
  user/Core. Withdrawal is not rejection of the underlying packet or work.
- **proposal expiration**: a lifecycle state indicating a proposal is stale or
  no longer valid because packet/proposal freshness requirements are no longer
  met.
- **user/Core proposer**: the user/Core actor or approved user/Core surface
  that explicitly requested future proposal record creation.
- **user/Core reviewer**: the user/Core actor or approved user/Core surface
  that later reviews, withdraws, rejects, supersedes, or escalates the proposal.
- **not confirmed mapping**: a proposal record is not mapping confirmation and
  does not create a confirmed mapping.
- **not import**: a proposal record is not imported resume context and does not
  import packet content.
- **not proof/evidence**: a proposal record is not proof, not evidence, and not
  proof/evidence authorization.
- **not Codex execution authority**: a proposal record does not allow Codex
  execution or continuation.

## Non-Authority Rules

- A proposal record is not mapping confirmation.
- A proposal record is not a confirmed mapping.
- A proposal record does not create a confirmed mapping.
- A proposal record does not import packet content.
- A proposal record does not create imported resume context.
- A proposal record does not create work items.
- A proposal record does not reconcile foreign refs.
- A proposal record does not record proof/evidence.
- A proposal record does not bind sessions.
- A proposal record does not allow Codex execution.
- A proposal record does not approve, publish, retry, replay, or merge.
- A proposal record does not mutate committed project state except the future
  proposal record itself, if a future schema and write route are separately
  approved by user/Core.
- A proposal record is not approval authority and not merge authority.

Foreign refs remain foreign. Route `ok`, preview
`ok_for_user_core_review`, smoke passes, a PR, and proof rows are not
user/Core approval.

## Future Minimal Record Shape

The following is a possible future persisted mapping proposal record shape. It
is future-only and not implemented in this PR.

```json
{
  "proposal_id": "ag-resume-mapping-proposal:example",
  "record_kind": "ag_work_resume_mapping_proposal",
  "schema": "augnes.ag_work_resume_mapping_proposal.v0_1",
  "status": "proposed",
  "foreign_scope": "project:source",
  "foreign_work_id": "AG-FOREIGN-123",
  "foreign_title": "Foreign work title",
  "foreign_status": "in_progress",
  "foreign_next_action": "Continue bounded implementation after review",
  "candidate_local_scope": "project:augnes",
  "candidate_local_work_id": "AG-LOCAL-123",
  "candidate_title": "Local candidate title",
  "candidate_status": "in_progress",
  "candidate_next_action": "Review Stage A preview output",
  "packet_id": "ag-resume-packet:example",
  "packet_hash": "sha256:packet-example",
  "source_runtime_instance_id": "runtime-instance:source",
  "source_packet_created_at": "2026-05-31T00:00:00.000Z",
  "proposal_preview_id": "mapping-proposal-preview:example",
  "proposal_preview_hash": "sha256:proposal-preview-example",
  "match_confidence_label": "possible",
  "comparison_summary": [],
  "gaps_summary": [],
  "conflicts_summary": [],
  "questions_summary": [],
  "foreign_refs_summary": {},
  "repo_context_summary": {},
  "redaction_summary": {},
  "proposed_by": "user-core",
  "proposed_at": "2026-05-31T00:00:00.000Z",
  "proposal_reason": "User/Core requested a durable proposal for later review.",
  "expires_at": "2026-06-07T00:00:00.000Z",
  "supersedes_proposal_id": null,
  "superseded_by_proposal_id": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "review_note": null,
  "authority_boundary": {
    "proposal_only": true,
    "not_mapping_confirmation": true,
    "does_not_create_confirmed_mapping": true,
    "does_not_import_packet_content": true,
    "does_not_record_proof_evidence": true,
    "does_not_bind_session": true,
    "does_not_authorize_codex": true,
    "durable_approval": "user/Core gated"
  },
  "created_at": "2026-05-31T00:00:00.000Z",
  "updated_at": "2026-05-31T00:00:00.000Z"
}
```

`proposal_id` is not `mapping_id`. `proposal_id` is not `import_id`.
`proposal_preview_id` is source review metadata, not a durable mapping.
`packet_hash` and `proposal_preview_hash` are traceability metadata, not
approval, not proof, and not import authority.

A future proposal record must not store raw secrets, raw DB paths, tunnel URLs,
screenshots/media, raw OpenAI responses, or local absolute paths. Redaction
summaries should describe what was omitted without embedding sensitive material.

## Status Semantics

The future Stage B status values are:

- `proposed`: proposal was created for review, not confirmed.
- `needs_review`: proposal exists but still needs user/Core review.
- `superseded`: proposal was replaced by a newer proposal.
- `withdrawn`: proposal was removed from consideration by user/Core.
- `rejected`: proposal was explicitly rejected by user/Core.
- `expired`: proposal is no longer valid due to packet/proposal expiry.

The Stage B status enum intentionally has no `confirmed` value. Confirmed
mapping belongs to Stage C, not Stage B.

## Required Future Write-Route Preconditions

If a future PR implements proposal record creation, the write route must require
all of the following:

- packet passed strict preflight
- mapping proposal preview was generated
- selected candidate is explicit
- user/Core explicitly requested proposal record creation
- authority copy displayed or supplied
- no blocked preview status
- no conflict preview status unless user/Core explicitly chooses to record
  conflict for review, if that policy is separately designed
- no unsafe redaction or target policy
- no stale packet expiry
- no hidden auto-create
- no local work item creation
- no mapping confirmation

The route must not infer user/Core intent from page load, route `ok`, preview
`ok_for_user_core_review`, selected candidate defaults, keyboard focus, smoke
passes, proof rows, or PR creation.

## Future Write-Route Response Contract

If a future record creation route is ever built, it returns the proposal record
only. HTTP status 201 may mean proposal record created, not mapping confirmed.

The route must not return `ok` text or recommendation text that implies mapping
authority, import authority, proof/evidence authority, session authority, Codex
authority, approval, publish, retry, replay, or merge authority.

The response must include `authority_boundary` and `next_step:
"user/Core review required"`. It must not create confirmed mapping records,
import records, proof records, evidence rows, session records, work items, work
events, Direct Resume Code records, relay records, or Codex execution state.

## Future UI Principles

If Cockpit UI later adds proposal record creation:

- write action must be visually separated from read-only preview
- label must say `Create mapping proposal record`, not `Confirm mapping`
- must show explicit non-authority copy
- must require a checkbox or typed confirmation only if user/Core approves that
  UX
- must show packet id/hash and selected candidate id
- must show conflicts/gaps before record creation
- must not hide read-only vs write distinction
- must remain keyboard accessible
- must not include import/Codex/merge buttons

The read-only Stage A preview surface should remain visually distinct from any
future Stage B write surface.

## Invalid And Preflight-Failing Handling

- Malformed packet input cannot create a proposal record.
- A packet that fails strict preflight cannot create a proposal record.
- Unsafe packet target policy cannot create a proposal record.
- A blocked mapping proposal preview cannot create a proposal record.
- Conflict proposal record handling is future policy; the default is no
  proposal record until conflict is resolved.
- A corrected packet should have a new packet hash or clear provenance trail.
- UI and routes must not silently correct packet content, preview content,
  candidate identity, redaction policy, target policy, or provenance.

Corrected packets must be reviewed as corrected inputs. Silent correction by UI
or route is not allowed.

## Foreign Refs Handling

Foreign refs may be summarized in a proposal record as foreign context only.
The proposal record does not convert foreign refs into local proof/evidence or
session records.

Foreign refs reconciliation remains a separate future design. Proof/evidence
authorization remains separate. Session binding remains separate. A proposal
record must not treat foreign action, proof, evidence, evidence-pack, session,
handoff, Git, or PR refs as local proof/evidence/session authority.

## Expiration And Supersession

Proposals may expire. Proposal expiry does not mutate the packet.

Proposal supersession creates a trace relationship between proposal records,
not confirmation. Only one active proposal per
`foreign_scope`/`foreign_work_id`/local candidate may be recommended, but
enforcement is future-only.

Stale proposal handling must be explicit in future UI and routes. A stale
proposal must not silently become an active proposal, confirmed mapping, import,
proof/evidence authorization, session binding, or Codex continuation.

## Codex Continuation Boundary

Stage B proposal record does not enable Codex. Codex continuation requires a
future confirmed mapping, local runtime/work context, `CODEX_WORK_ID`, and a
successful `codex:read-brief`.

Proof/evidence/session choices remain separate. Proof is not approval. PR
creation is not merge authority. A proposal record is not Codex execution
authority, not proof/evidence authorization, and not session binding authority.

## Required Future PR Review Checklist

- Does this PR add schema?
- Does this PR add migration?
- Does this PR add write route?
- Does this PR create proposal records?
- Does this PR create confirmed mappings?
- Does this PR import packet context?
- Does this PR create work items?
- Does this PR reconcile proof/evidence/session refs?
- Does this PR start Codex?
- Does this PR grant approval/publish/retry/replay/merge?
- Are packet preflight and preview status checked?
- Are authority boundaries visible?
- Are browser checks included for UI?
- Are skipped checks listed with concrete reasons?
- What requires user/Core judgment?

## Non-Goals

- no implementation in this PR
- no schema
- no migration
- no route
- no UI
- no persistence
- no proposal record creation
- no confirmed mapping
- no import
- no proof/evidence/session
- no Codex
- no Direct Resume Code
- no relay
- no approval, merge, or state mutation

This design does not add DB/schema changes, migrations, API routes, route
behavior changes, runtime discovery, runtime state writes, route-side DB reads,
route writes, record writers, MCP/App tool schema changes, bridge tools,
ChatGPT App cards, Cockpit UI changes, persistent import, Direct Resume Code
create/resolve routes, relay behavior, proof/evidence recording, work event
creation, work item creation, mapping proposal record creation, confirmed
mapping record creation, import record creation, session binding, approval,
publish, retry, replay, external posting, merge, auto-merge, Codex execution
controls, localStorage/sessionStorage/indexedDB persistence, telemetry,
analytics, or committed-state mutation.

## Next Suggested Implementation

If user/Core approves a follow-up, the next PR could define DB/schema design for
mapping proposal records while still adding no route writes. Another valid next
step is to continue Stage A real-packet dogfood without persistence.

This design document itself does not authorize implementation.
