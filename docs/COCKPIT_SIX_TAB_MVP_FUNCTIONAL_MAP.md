# Cockpit Six-Tab MVP Functional Map

Status: superseded. Superseded by `COCKPIT_PERSPECTIVE_IA_V0_1.md` for the
current Cockpit target IA: `Overview / Work / Perspective / Bridge / Operator`.
This document remains as historical context for the earlier six-tab shell and
must not be treated as the current top-level IA contract.

This document defines the functional split, composition plan, authority
boundaries, and low-fidelity wireframes for the next Cockpit MVP UI refactor.
It is a repo-tracked implementation contract for a future PR. It does not
implement tabs, add routes, add controls, change C5 gate semantics, or change
GitHub App/token behavior.

## Final Tab Order

```text
Overview -> Work -> Ledger -> Proof -> Bridge -> Operator
```

1. Overview
2. Work
3. Ledger
4. Proof
5. Bridge
6. Operator

No tab order change should be made in the implementation PR unless a later
product decision updates this document first.

## Global Shell Requirements

The Cockpit shell should use a text-only `AUGNES` identity in the top-left. No
graphic logo is required.

The top navigation must show the six tabs in this order:

```text
Overview | Work | Ledger | Proof | Bridge | Operator
```

Runtime/status chips must include:

- `Runtime: Local / Local SQLite`
- `Read-first Bridge`
- `Work ID AG-001` or the current selected work ID

Shared visual language:

- white cards
- soft borders
- green active state
- small status chips
- readable spacing
- collapsible boundary blocks where needed

The six UI reference images are visual direction, not pixel-perfect
requirements. They guide layout, density, spacing, card style, and hierarchy.
They do not define backend behavior. They do not authorize new controls. No new
authority is created by visual layout.

## Authority Boundary Summary

Augnes Core remains the durable authority runtime. Cockpit is a local
observability and operator surface. The six-tab shell may organize existing
reads and safe local controls, but it must not create hidden authority.

Forbidden controls for this UI refactor:

- publish
- merge
- retry
- GitHub token controls
- installation token exchange
- execute Codex
- backup
- live GitHub App action
- live exchange
- ChatGPT App tools
- RawEpisodeBundle runtime
- PerspectiveSnapshot runtime

Do not add publish/merge/retry/token/live-exchange controls. Do not add
Cockpit buttons that call GitHub, OpenAI, Codex execution, merge, publish,
token exchange, backup, replay, or external mutation. Existing local proposal
commit/reject controls may remain only in Operator and must be labeled as
local Augnes runtime state actions.

## Overview

### Purpose

Overview is the demo first screen. It should explain Augnes in 10 seconds and
show how AI work becomes temporal state.

Hero copy:

```text
AI work becomes temporal state.
Model proposes. User commits. Runtime records proof.
```

Process strip:

```text
Conversation -> Proposal -> Commit Gate -> Ledger -> Proof
```

### Must Show

- Hero copy.
- Process strip.
- Needs Your Decision card.
- Pending proposals count.
- Text: `pending proposals are not ledger entries`.
- Review CTA that may navigate/switch only to Operator or a proposal section.
- Temporal State Graph summary.
- Current Work compact line with selected work ID and status.
- Bottom boundary/next-action bar:
  - `After review:` next recommended action.
  - `Read-first cockpit · Runtime owns writes`.
  - `External systems are not controlled`.

### Use Existing

- `proposals.length`
- `selectedWorkId` / `workItems`
- `brief.agent_handoff.next_recommended_action`
- `trajectory` / `TemporalStateGraph` / `TransitionInspector` in compact form
- `snapshot.open_tensions` only as a summary, not a full list

### Must Not Show

- full Evidence Pack
- full Session Trace
- full Temporal Review Artifact browser
- Observe textarea
- full proposal cards
- Mailbox/Publication/Approval Gate full panels
- publish/merge/retry/token/live-exchange controls

### Low-Fi Wireframe

```text
[Top shell: AUGNES identity] [Overview Work Ledger Proof Bridge Operator]
[Runtime: Local / Local SQLite] [Read-first Bridge] [Work ID AG-001]

[Hero]
AI work becomes temporal state.
Model proposes. User commits. Runtime records proof.

[Process strip]
Conversation -> Proposal -> Commit Gate -> Ledger -> Proof

[Main grid]
left:  Needs Your Decision
       pending proposals count
       pending proposals are not ledger entries
       Review CTA -> Operator/proposals only

right: Temporal State Graph summary
       compact lane/transition count
       selected transition summary if available

[Current Work compact line]
AG-001 / selected work status / next action hint

[Bottom boundary/next-action bar]
After review: next recommended action
Read-first cockpit · Runtime owns writes
External systems are not controlled
```

## Work

### Purpose

Work is a Work ID centered trace view. It shows work items as trace anchors,
not as committed state authority.

Required language:

```text
Work IDs anchor traces. Ledger owns truth.
```

### Must Show

- Page header.
- Work summary cards:
  - total work items
  - in progress count
  - needs decision/user attention count
  - completed count, if derivable
- Left column:
  - work item list
  - selected work ID
  - status/priority
- Center column:
  - selected work summary
  - next action
  - recent work events/activity
- Right column:
  - related state keys
  - related proof/context
  - Codex handoff copy/draft area if existing and safe

### Use Existing

- `WorkFocusSection`
- `workItems`
- `selectedWorkId`
- `workBrief`
- `workBrief.recent_events`
- `workBrief.related_proof`
- `workBrief.related_state_keys`
- `workBrief.codex_handoff`

### Safe Existing Controls

- copy Codex handoff
- copy work event template
- select work item

### Do Not Add

- Run Codex
- external execution
- publish
- merge
- retry
- token exchange
- new work mutation controls

### Low-Fi Wireframe

```text
[Page header]
Work
Work IDs anchor traces. Ledger owns truth.

[Stats row]
total work items | in progress | needs decision | completed

[3-column grid]
left:   Work list
        selected work ID
        status / priority chips

center: Selected work trace
        summary
        next action
        recent events/activity

right:  Context / proof / handoff
        related state keys
        related proof/context
        copy Codex handoff
        copy work event template
```

## Ledger

### Purpose

Ledger is the committed state source-of-truth view. It must distinguish
committed state from pending proposals.

Heading:

```text
Temporal Ledger
```

Boundary:

```text
Ledger is the source of truth.
Pending proposals are not ledger entries.
```

### Must Show

- Heading: `Temporal Ledger`.
- Source-of-truth boundary.
- Summary cards:
  - committed transition count
  - state key count
  - active/future/completed/deprecated counts where available
- Main:
  - committed transition timeline/list
  - state key lanes or graph
- Inspector:
  - selected committed transition
  - before/after
  - committed_at
  - reason
  - source session/agent where available

### Use Existing

- `snapshot`
- `trajectory`
- `selectedTransition`
- `TemporalStateGraph`
- `TransitionInspector`
- `StateGroup`

### Do Not Show

- pending proposal commit/reject controls
- Observe input
- Plan Next
- Evidence Pack as source of truth
- proof as committed state
- publish/merge/retry/token controls

### Low-Fi Wireframe

```text
[Page header]
Temporal Ledger
Ledger is the source of truth.
Pending proposals are not ledger entries.

[Stats row]
committed transitions | state keys | active | future | completed | deprecated

[Main grid]
left:   State key / transition list
        active/future/completed/deprecated group filters

center: Ledger graph/timeline
        committed transition lanes

right:  Selected transition inspector
        before / after
        committed_at
        reason
        source session/agent where available
```

## Proof

### Purpose

Proof is a read-only evidence, proof, and verification view. It shows that
proof records evidence only and does not commit state.

Heading:

```text
Proof / Evidence
```

Boundary:

```text
Proof records evidence only.
It does not commit, approve, publish, replay, or execute anything.
```

### Must Show

- Heading: `Proof / Evidence`.
- Read-only proof boundary.
- Summary cards where derivable:
  - evidence records
  - Evidence Pack status
  - Temporal review artifact count
  - Session trace status
  - gaps/needs review
- Main surfaces:
  - `EvidencePackPanel`
  - `TemporalReviewArtifactBrowserPanel`
  - `SessionTracePanel` or compact Session Trace summary
  - Verification Evidence Records summary if already available

### Use Existing

- `EvidencePackPanel`
- `TemporalReviewArtifactBrowserPanel`
- `SessionTracePanel`
- `evidencePack.verification_trace`
- `evidencePack.temporal_review_artifact_trace`
- structured verification evidence surfaces if already present

### Safe Controls

- Load Evidence Pack
- Load Session Trace
- Load Temporal Review Artifacts

These controls read existing local runtime endpoints only. They do not write,
publish, replay, approve, or execute.

### Do Not Add

- Record Proof button
- Publish Proof
- Replay
- Commit
- Approve
- external calls

### Low-Fi Wireframe

```text
[Page header]
Proof / Evidence
Proof records evidence only.
It does not commit, approve, publish, replay, or execute anything.

[Stats row]
evidence records | Evidence Pack status | review artifacts | Session Trace | gaps

[Main grid]
left:   Evidence Pack
        Load Evidence Pack
        verification trace summary

center: Review Artifacts
        Load Temporal Review Artifacts
        bounded artifact list/detail

right:  Session Trace / verification gaps
        Load Session Trace
        gaps and read-only boundaries
```

## Bridge

### Purpose

Bridge explains ChatGPT App / MCP / bridge authority and makes the read-first
tool surface clear.

Heading:

```text
Read-first Bridge
```

Boundary:

```text
Bridge is read-first / not external system control.
Configured tool surface, not an external system control panel.
Bridge is a configured tool surface, not direct external control.
```

### Must Show

- Heading: `Read-first Bridge`.
- Boundary statement.
- Capability matrix with rows:
  - public app tools
  - bridge-gated tools
  - work read tools
  - draft tools
  - record tools
- Capability matrix with columns:
  - read
  - draft
  - record
  - commit state
  - execute Codex
  - publish/mutate GitHub
- Allowed/gated/blocked language:
  - read allowed
  - draft gated
  - record proof/trace gated
  - commit state blocked
  - execute Codex blocked
  - publish/mutate GitHub blocked
- Endpoint contract examples.

### Endpoint Contract Examples

```text
GET /api/state/brief
GET /api/evidence-pack
GET /api/sessions/trace
GET /api/evidence/records
GET /api/work
GET /api/proposals
POST /api/observe
POST /api/handoffs/review
POST /api/actions/record
POST /api/work/{work_id}/events
```

These are examples of existing or documented contracts for the future UI
explanation. No new APIs are required by this spec.

### Use Existing

- existing docs and bridge-read behavior
- static/bounded capability matrix
- no new APIs required

### Safe Controls

- copy endpoint text
- open/read docs links if static and safe
- no runtime mutation required

### Do Not Add

- Execute Codex
- publish/mutate GitHub
- merge
- token exchange
- commit/reject state tools
- new ChatGPT App tools

### Low-Fi Wireframe

```text
[Page header]
Read-first Bridge
Configured tool surface, not an external system control panel.

[Capability cards]
read allowed | draft gated | record proof/trace gated | state/external blocked

[Matrix]
rows:    public app tools, bridge-gated tools, work read tools, draft tools, record tools
columns: read, draft, record, commit state, execute Codex, publish/mutate GitHub

[Endpoint contract]
GET /api/state/brief
GET /api/evidence-pack
GET /api/sessions/trace
GET /api/evidence/records
GET /api/work
GET /api/proposals
POST /api/observe
POST /api/handoffs/review
POST /api/actions/record
POST /api/work/{work_id}/events

[Boundary panel]
Bridge is a configured tool surface, not direct external control.
```

## Operator

### Purpose

Operator is the local runtime operator view. It houses safe local runtime
actions and existing local proposal controls while making the external
non-control boundary explicit.

Heading:

```text
Operator
```

Boundary:

```text
Operator is local runtime only / no publish/merge/retry.
Operator actions affect the local Augnes runtime only.
No publish, merge, retry, backup, live exchange, or external execution controls live here.
```

### Must Show

- Heading: `Operator`.
- Boundary statement.
- Runtime status cards:
  - Local Runtime
  - State Authority
  - Pending Decisions
  - Mailbox Review Items
  - Evidence Pack
  - Package Version, if available
- Main:
  - `CoordinationEventTimeline`
  - `MailboxSummaryPanel`
  - `PublicationSummaryPanel`
  - `ApprovalGateStatePanel`
  - pending proposal queue / local proposal review
  - safe local actions

### Use Existing

- `MailboxSummaryPanel`
- `PublicationSummaryPanel`
- `ApprovalGateStatePanel`
- `CoordinationEventTimeline`
- proposal cards
- `decideProposal` commit/reject
- `consolidateCandidates`
- `requestPlan`
- `runTool` README/Security/Demo checklist
- observe form, preferably advanced/collapsible
- `notice`

### Safe Existing Controls

- Commit/Reject local proposals, with a clear local-state-only label
- Consolidate Candidates
- Plan Next
- README Checklist
- Security Checklist
- Demo Script
- Load Evidence Pack
- Load Session Trace
- Copy invariant commands, if implemented later as copy-only

### Do Not Add

- publish
- merge
- retry
- GitHub token controls
- installation token exchange
- backup
- execute Codex
- live GitHub App action
- ChatGPT App tools

### Low-Fi Wireframe

```text
[Page header]
Operator
Operator actions affect the local Augnes runtime only.
No publish, merge, retry, backup, live exchange, or external execution controls live here.

[Runtime cards]
Local Runtime | State Authority | Pending Decisions | Mailbox Review Items | Evidence Pack | Package Version

[2/3-column grid]
left:   Pending local proposals
        local Commit/Reject only
        Consolidate Candidates
        Observe advanced/collapsible

center: Operator activity timeline
        CoordinationEventTimeline
        selected event inspector

right:  Mailbox/publication/approval summaries
        MailboxSummaryPanel
        PublicationSummaryPanel
        ApprovalGateStatePanel

[Safe local actions panel]
Plan Next | README Checklist | Security Checklist | Demo Script
Load Evidence Pack | Load Session Trace

[Boundary panel]
Local runtime only. No external execution, publish, merge, retry, token, backup, or live exchange controls.
```

## Current Implementation Mapping

| Current Cockpit element | Future tab placement | Notes |
| --- | --- | --- |
| `CurrentWorkCard` | Overview | Use as compact current work line plus next recommended action. Full handoff detail may move to Work/Operator if needed. |
| `WorkFocusSection` | Work | Primary Work ID trace surface. Keep select and copy controls. |
| `MailboxSummaryPanel` | Operator | Read-only local operator summary. |
| `PublicationSummaryPanel` | Operator | Read-only publication/delivery status. No publish controls. |
| `ApprovalGateStatePanel` | Operator | Read-only gate context. No approve/publish/retry controls. |
| `SessionTracePanel` | Proof, optionally Operator compact link | Proof owns the full read-only trace surface. Operator may include a compact load/link if it remains read-only. |
| `TemporalInterpretationPreviewPanel` | Proof advanced or Operator advanced | Keep as read-only preview only. Do not treat as PerspectiveSnapshot runtime. |
| `TemporalReviewArtifactBrowserPanel` | Proof | Read-only artifact browser. |
| `EvidencePackPanel` | Proof, with Operator safe action link/load | Proof owns the full review bundle. Operator may keep load access as a safe read action. |
| `CoordinationEventTimeline` | Operator | Local runtime operator timeline. |
| `TemporalStateGraph` | Overview compact and Ledger detailed | Overview uses a summary. Ledger owns detailed graph/timeline. |
| State Snapshot | Ledger | Committed state grouping belongs with the source-of-truth ledger. |
| Pending State Deltas | Operator, Overview count only | Full proposal cards and local commit/reject live in Operator. Overview shows only count and decision prompt. |
| Observe textarea | Operator advanced/collapsible | Existing observe flow is local proposal generation, not Overview. |
| State-Grounded Actions | Operator safe actions | `Plan Next` and local checklist actions stay in Operator. |
| Tensions | Overview summary or Operator | Overview may show count/summary only. Full list can live in Operator. |
| Plan Next | Operator | Safe local runtime planning action. |
| README/Security/Demo Checklist | Operator safe quick actions | Local tool actions only. No external mutation. |

## Existing Controls Placement

Safe to keep in the six-tab shell:

- Work tab: select work item.
- Work tab: copy Codex handoff.
- Work tab: copy work event template.
- Proof tab: Load Evidence Pack.
- Proof tab: Load Session Trace.
- Proof tab: Load Temporal Review Artifacts.
- Operator tab: Commit/Reject local proposals with clear local-state-only label.
- Operator tab: Consolidate Candidates.
- Operator tab: Plan Next.
- Operator tab: README Checklist.
- Operator tab: Security Checklist.
- Operator tab: Demo Script.
- Operator tab: observe form if advanced/collapsible and clearly local proposal generation.

Controls that must not appear anywhere in this UI refactor:

- publish
- merge
- retry
- GitHub token controls
- installation token exchange
- execute Codex
- live exchange
- live GitHub App action
- backup
- Replay
- Publish Proof
- Record Proof button
- new ChatGPT App tools

## Reference Image Handling

Future implementation PRs should interpret the six reference images this way:

- The Overview reference image is primary for the Overview layout.
- The remaining tab images should be used as visual direction for layout,
  density, spacing, and card style.
- The images are not pixel-perfect implementation requirements.
- The images do not define backend behavior.
- The images do not authorize backend behavior or new authority controls.
- The images do not authorize new API routes, DB schema, migrations, token
  behavior, live exchange, publish, merge, retry, or Codex execution.
- If an image shows a button not supported by current safe behavior, defer it
  or implement it as static/disabled/copy-only.
- If an image visually implies authority that this document blocks, this
  document wins.

## Future Implementation Review Checklist

Use this checklist for the next implementation PR:

- Six tabs render in the order `Overview -> Work -> Ledger -> Proof -> Bridge -> Operator`.
- Global shell includes text-only `AUGNES` identity.
- Runtime/status chips include `Runtime: Local / Local SQLite`, `Read-first Bridge`, and selected work ID.
- Overview includes the hero copy `AI work becomes temporal state.`
- Overview includes the process strip `Conversation -> Proposal -> Commit Gate -> Ledger -> Proof`.
- Overview shows pending proposals count without full proposal cards.
- Overview says pending proposals are not ledger entries.
- Work centers Work IDs as trace anchors and says Ledger owns truth.
- Work preserves safe copy/select controls only.
- Ledger says Ledger is the source of truth.
- Ledger separates committed transitions from pending proposals.
- Proof says Proof records evidence only.
- Proof loads evidence/session/artifact data read-only.
- Bridge is read-first and not external system control.
- Bridge includes the capability matrix and endpoint examples without adding APIs.
- Operator says local runtime only and no publish/merge/retry.
- Operator houses local proposal commit/reject and safe local actions only.
- No publish/merge/retry/token/live-exchange controls are added.
- No GitHub token controls or installation token exchange controls are added.
- No Execute Codex control is added.
- No backend APIs are added.
- No DB schema or migrations are changed.
- No dependencies are added.
- C5 gate semantics are unchanged.
- GitHub App/token behavior is unchanged.
- ChatGPT App tools are unchanged.
- RawEpisodeBundle runtime is not added.
- PerspectiveSnapshot runtime is not added.
- Visual references are treated as direction, not backend authority.
