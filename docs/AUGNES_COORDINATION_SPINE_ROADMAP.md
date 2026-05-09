# Augnes Coordination Spine Roadmap

This roadmap defines the current implementation plan for making Augnes a practical coordination spine between ChatGPT, Codex, GitHub, Browser/Chrome, MCP surfaces, and Augnes Core without turning ChatGPT Apps into an autonomous execution controller.

## Purpose

Augnes should reduce the human-message-bus burden while improving temporal state quality. The goal is not to build a free-form agent social network. The goal is to turn handoffs, execution results, verification evidence, publication attempts, and approval needs into typed, reviewable, time-ordered coordination events.

This roadmap should be read together with:

- `docs/AUTHORITY_MATRIX.md`
- `docs/CODEX_HANDOFF_PACKET.md`
- `docs/VERIFICATION_EVIDENCE_PACK.md`
- `docs/EXECUTION_SURFACE_RECORD.md`
- `docs/EXPECTED_IMPACT_CHECK.md`
- `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md`
- `.github/pull_request_template.md`
- `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md`
- `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md`

## Authority Boundary

The roadmap keeps the existing authority split intact:

- The user owns durable approval.
- Augnes Core owns committed state, the commit/reject gate, temporal proof, and coordination event storage.
- ChatGPT Apps own conversational interpretation, handoff drafting, result review, and record-draft preparation.
- Codex owns repo execution, verification, and PR preparation.
- GitHub owns code history and PR review surfaces.
- Browser/Chrome, ChatGPT Developer Mode, and MCP Inspector are verification surfaces, not durable state authorities.

The roadmap does not grant:

- direct Codex orchestration from ChatGPT Apps
- autonomous Codex execution
- ChatGPT App commit/reject authority
- GitHub auto-merge
- automatic public posting without preview or approval
- hosted auth or deployment semantics
- secret handling changes

## Product Shape

Use this mental model:

```text
ChatGPT Apps: conversational coordination surface
Cockpit: operator review and visualization surface
Augnes Core: temporal authority, event spine, proof ledger
Codex: repo execution and verification worker
GitHub/Discord/etc.: publication or review surfaces
User: durable approval authority
```

## Phase 1: Trace Spine

### Goal

Create a backend-first append-only coordination event spine. This turns handoffs, proof records, work events, review decisions, and publication attempts into explicit temporal data instead of scattered prose.

### Backend Scope

Add a minimal event spine capable of recording coordination events such as:

- `handoff_created`
- `handoff_ready`
- `handoff_delivered`
- `handoff_acknowledged`
- `work_event_recorded`
- `action_result_recorded`
- `result_review_created`
- `record_draft_created`
- `publication_draft_created`
- `publication_sent`
- `publication_failed`
- `publication_acknowledged`

Recommended minimal fields:

```text
event_id
event_type
scope
work_id
actor
target
source_surface
authority_level
state_keys
causal_parent_id
payload_ref
result_status
created_at
```

Recommended `authority_level` values:

```text
raw_observation
interpretation_only
handoff_guidance
execution_trace
action_proof
publication_notice
acknowledged_notice
committed_state
```

### ChatGPT Apps Scope

Read only. ChatGPT Apps may display or summarize event spine state, but Phase 1 should not add new ChatGPT App write authority.

### Cockpit Scope

Add visualization and inspection only:

- coordination event timeline
- event inspector
- links from event to work item, action record, state key, or PR

### PR Slices for Codex

#### PR 1.1: Event spine schema and storage

- Add backend event model and persistence.
- Add basic list/read API for coordination events.
- No UI write behavior.
- No publisher behavior.

Verification:

- `npm run typecheck`
- existing runtime smoke or targeted API check

#### PR 1.2: Instrument existing records into event spine

- Record events when action results and work events are created.
- Link event records to existing `action_records` and `work_events`.
- Preserve current action/work behavior.

Verification:

- action record still appears in state brief
- work event still appears in work brief
- event spine shows matching events

#### PR 1.3: Cockpit event timeline read view

- Add read-only event timeline panel.
- Add event inspector with state keys, work ID, actor, authority level, and payload reference.
- No new write controls.

Verification:

- cockpit loads with and without events
- no commit/reject behavior changes

## Phase 2: Handoff Registry + AG-006 ChatGPT-Codex Handoff & Review Loop

### Goal

Promote Codex handoffs from copy-paste prose into durable handoff records and make ChatGPT Apps useful as a handoff and review assistant, not an execution controller.

### Backend Scope

Add a handoff registry. A handoff record should capture:

```text
handoff_id
scope
work_id
source_state_brief_ref
source_work_brief_ref
target_agent
status
current_committed_state_summary
task_brief
expected_files
expected_state_keys
expected_checks
expected_execution_surfaces
safety_boundaries
completion_record_fields
created_by
created_at
supersedes_handoff_id
```

Recommended statuses:

```text
draft
ready
delivered
acknowledged
reviewed
superseded
expired
```

### ChatGPT Apps User Surface

Add conversational affordances for:

1. Codex Handoff Draft
   - Generate a handoff packet from `work_id`, state brief, work brief, pending proposals, open tensions, and recent proof.
   - Include expected files, state keys, checks, execution surfaces, safety boundaries, and completion record fields.
   - Make it copyable.
   - Do not execute Codex.

2. Codex Result Review
   - Compare Codex result against expected files, expected state keys, expected checks, and expected surfaces.
   - Surface skipped checks and exact failure reasons.
   - Suggest `result_status` and `result_kind` without pretending incomplete work is completed.

3. Augnes Record Draft
   - Prepare action record draft fields.
   - Prepare work event draft fields.
   - Optionally call bridge-gated recording tools when explicitly requested and available.
   - Make clear that proof/trace recording is not commit/reject.

4. Approval Needed Summary
   - Summarize pending proposals, open tensions, partial/blocked/needs_review outcomes, and risky handoffs.
   - Direct durable state decisions back to Augnes Core or Cockpit.

### Cockpit Scope

Add operator controls for:

- viewing handoff records
- copying handoff packets
- comparing expected vs actual results
- preparing record drafts
- linking handoffs to action records and work events

### PR Slices for Codex

#### PR 2.1: Handoff registry backend

- Add handoff model and storage.
- Add create/list/read/update-status API.
- Emit `handoff_created` and `handoff_ready` events.
- No ChatGPT App execution controls.

Verification:

- create a handoff record
- list handoffs by scope/work_id
- event spine records creation

#### PR 2.2: Handoff generation helper

- Add deterministic handoff builder from state brief/work brief.
- Preserve existing `docs/CODEX_HANDOFF_PACKET.md` shape.
- Include expected files, state keys, checks, and completion record fields.

Verification:

- generated packet includes work ID, state keys, checks, and safety boundaries
- no Codex execution route exists

#### PR 2.3: ChatGPT App handoff draft surface

- Add a bridge-readable handoff draft tool or answer pattern.
- Prioritize plain-language output plus copyable handoff packet.
- Maintain public profile read-only behavior.
- Keep bridge-gated behavior explicit.

Verification:

- public tool list remains safe
- bridge mode can read/generate handoff draft
- invariants still pass

#### PR 2.4: Codex result review and record draft

- Add result-review template or helper.
- Produce expected-vs-actual summary.
- Produce action/work record drafts.
- Do not commit/reject state.

Verification:

- review handles completed, partial, blocked, failed, and needs_review results
- record draft contains sourceAgentId/actionName/resultSummary/filesChanged/resultStatus/resultKind/relatedPr/relatedStateKeys

## Phase 3: Mailbox Lite

### Goal

Add a narrow, task-oriented mailbox for handoffs and review-needed notices. This is not a free-form agent chat system.

### Backend Scope

Add a minimal mailbox/message model:

```text
message_id
scope
work_id
from_agent
to_agent
message_type
summary
payload_ref
requires_ack
status
created_at
acknowledged_at
supersedes_message_id
```

Allowed `message_type` values:

```text
handoff
review_request
blocked_notice
result_report
approval_needed
verification_needed
```

Recommended statuses:

```text
draft
ready
delivered
acknowledged
reviewed
superseded
expired
```

### ChatGPT Apps User Surface

Add summaries for:

- Pending Handoffs
- Needs Review
- Approval Needed
- Blocked or Partial Results

ChatGPT Apps should summarize mailbox state and help draft replies or review notes. It should not become an autonomous task dispatcher.

### Cockpit Scope

Add mailbox panels for:

- pending handoffs
- delivered handoffs
- acknowledged handoffs
- review-needed items
- blocked items

### PR Slices for Codex

#### PR 3.1: Mailbox storage and API

- Add mailbox model and backend endpoints.
- Link mailbox messages to handoff records and event spine.
- No external publication.

Verification:

- create/list/update-status message
- event spine records delivery and acknowledgement events

#### PR 3.2: Mailbox integration with handoffs

- When a handoff is marked ready or delivered, create/update mailbox message.
- When acknowledged/reviewed, update both handoff and mailbox status where appropriate.

Verification:

- handoff status and mailbox status remain consistent
- superseded handoffs do not appear as active needs-review items

#### PR 3.3: App and Cockpit mailbox summaries

- ChatGPT Apps can summarize pending handoffs and needs-review items.
- Cockpit can show mailbox state in read/review panels.
- No automatic execution.
- Mailbox summaries are derived read-only views over mailbox storage, not a source
  of truth and not an approval, status-update, proof-recording, publisher, or
  Codex execution surface.
- Active mailbox views exclude `superseded` and `expired` messages. Runtime
  list callers can request that composed view with
  `GET /api/mailbox?scope=project:augnes&active=true`; summary buckets apply
  the same exclusion and keep terminal counts as inactive context.
- Terminal mailbox states `superseded` and `expired` block reactivation to
  `ready`, `delivered`, `acknowledged`, or `reviewed` unless a future explicit
  reopen design is implemented.

Verification:

- public profile remains read-only
- bridge mode summaries match backend state
- summary reads create no action records, work events, state commits, pending
  proposals, or mailbox status changes

## Phase 4: Publisher + Delivery Ledger Lite

### Goal

Add approval-based publication and delivery tracking for external surfaces such as GitHub PR comments or Discord messages. This phase should make publishing visible and auditable without making automatic posting the default.

### Backend Scope

Add publication drafts and delivery ledger records:

```text
publication_id
scope
work_id
source_event_id
target_surface
target_ref
status
preview_body
created_by
approved_by
created_at
sent_at
```

```text
delivery_id
publication_id
target_surface
target_ref
status
sent_at
acknowledged_at
error_message
idempotency_key
```

Recommended publication statuses:

```text
draft
approved
sent
failed
cancelled
```

Recommended delivery statuses:

```text
pending
sent
failed
acknowledged
```

### Publisher Adapter Scope

Start small:

- GitHub PR or issue comment adapter
- Optional Discord webhook adapter later

All external publishing should be preview-first and approval-based by default.

### ChatGPT Apps User Surface

Read and preview only unless an explicit bridge-gated approval workflow exists:

- Publication Preview
- Delivery Status
- Failed Delivery Summary
- Needs Approval for Publish

### Cockpit Scope

Add operator controls for:

- preview publication draft
- approve publish
- cancel draft
- retry failed delivery
- inspect delivery history

### PR Slices for Codex

#### PR 4.1: Publication draft and delivery ledger backend

- Add models and APIs for publication drafts and delivery records.
- Emit event spine records for draft creation and delivery changes.
- No external network publisher yet.

Verification:

- create draft
- approve/cancel draft
- delivery ledger records status changes

#### PR 4.2: GitHub publication adapter

- Add a GitHub PR/issue comment adapter behind explicit approval.
- Add idempotency key handling to avoid duplicate posting.
- Do not add auto-merge.

Verification:

- dry-run preview works
- approved publish records sent/failed status
- duplicate publish is blocked or clearly idempotent

#### PR 4.3: App and Cockpit publication views

- ChatGPT Apps can summarize publication previews and delivery status.
- Cockpit can approve or retry when allowed.
- Failed deliveries show exact error messages.

Verification:

- no automatic posting in public profile
- delivery status visible after success/failure

## Cross-Phase Invariants

Every phase must preserve these rules:

- ChatGPT Apps do not gain commit/reject authority.
- ChatGPT Apps do not directly execute Codex.
- Codex results are proof/trace until the user commits durable state.
- Publication is preview-first and approval-based by default.
- Raw discussion is not canonical state.
- Work IDs are trace anchors, not state authority.
- Action records are official execution proof.
- Work events are human-readable trace notes.
- Event spine entries should be append-only.
- Derived summaries remain views, not sources of truth.

## Recommended Implementation Order

```text
1. Event spine storage and API
2. Existing action/work event instrumentation
3. Cockpit read-only event timeline
4. Handoff registry backend
5. Handoff generation helper
6. ChatGPT App handoff draft surface
7. Codex result review and record draft
8. Mailbox Lite backend
9. Mailbox summaries in ChatGPT Apps and Cockpit
10. Publication draft and delivery ledger backend
11. GitHub publication adapter
12. Publication preview/delivery status surfaces
```

## Success Criteria

This roadmap succeeds when a user can follow this path without manually carrying context between systems:

```text
User asks what to do next
→ ChatGPT Apps read Augnes state/work context
→ ChatGPT Apps draft a Codex handoff
→ Codex executes and reports work
→ ChatGPT Apps review the result
→ Augnes records action/work proof
→ Cockpit shows the event chain over time
→ optional publication preview is approved and delivered
→ delivery status is visible
→ durable state approval remains user-gated
```

## Out of Scope for This Roadmap

- free-form agent social networking
- autonomous Codex swarms
- ChatGPT-controlled Codex execution
- automatic PR merge
- automatic Discord/GitHub posting by default
- multi-user hosted auth
- secrets management changes
- replacing Cockpit with ChatGPT Apps
- treating ChatGPT conversation text as canonical Augnes memory
