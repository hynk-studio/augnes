# Augnes Coordination Spine Roadmap

This roadmap defines the current implementation plan for making Augnes a practical coordination spine between ChatGPT, Codex, GitHub, Browser/Chrome, MCP surfaces, and Augnes Core without turning ChatGPT Apps into an autonomous execution controller.

## Purpose

Augnes should reduce the human-message-bus burden while improving temporal state quality. The goal is not to build a free-form agent social network. The goal is to turn handoffs, execution results, verification evidence, publication attempts, and approval needs into typed, reviewable, time-ordered coordination events.

This roadmap should be read together with:

- `docs/AUTHORITY_MATRIX.md`
- `docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md`
- `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md`
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
The current GitHub PR comment adapter exists behind explicit approval, dry-run,
stored `target_ref`, idempotency, fresh delivery-row, token, and specific-target
gates. PR #67 recorded the first approved live GitHub PR comment adapter test:
one comment was posted to PR #67, replay with the same `idempotency_key` created
no duplicate comment, one sent delivery was recorded, and no PR merge/review or
Discord/webhook/proof/state mutation occurred. This evidence does not authorize
automatic posting in future PRs.

### ChatGPT Apps User Surface

Read and preview only unless an explicit bridge-gated approval workflow exists:

- Publication Preview
- Delivery Status
- Failed Delivery Summary
- Needs Approval for Publish

### Cockpit Scope

Current implemented Cockpit publication behavior is read-only preview and
delivery status. Future explicit PRs may add operator controls for:

- preview publication draft
- approve/publish action
- cancel draft
- retry failed delivery
- inspect delivery history

### PR Slices for Codex

#### PR 4.1: Publication draft and delivery ledger backend

Status: implemented.

- Added models and APIs for publication drafts and delivery records.
- Emits event spine records for draft creation and delivery changes.
- No external network publisher was included in this slice.

Verification:

- create draft
- approve/cancel draft
- delivery ledger records status changes

#### PR 4.2: GitHub publication adapter

Status: implemented.

- Added a GitHub PR comment adapter behind explicit approval.
- Added dry-run behavior, stored `target_ref`, `GITHUB_TOKEN` gating, and
  idempotency handling to avoid duplicate posting.
- Did not add auto-merge.
- Live GitHub posting was verified by PR #67 with one retained test comment and
  an idempotent replay check that produced no duplicate.

Verification:

- dry-run preview works
- approved publish records sent/failed status
- duplicate publish is blocked or clearly idempotent

#### PR 4.3: App and Cockpit publication views

Status: implemented as read-only publication preview and delivery status views.

- ChatGPT Apps can summarize publication previews and delivery status through a
  bridge-gated read-only tool.
- Cockpit can show publication previews and delivery status as derived
  read-only views.
- Failed deliveries show bounded status/error context.
- Cockpit approve/publish/retry controls remain future explicit scope.

Verification:

- no automatic posting in public profile
- delivery status visible after success/failure

#### Phase 4 verification status

- PR 4.1 backend is complete.
- PR 4.2 GitHub PR comment adapter is complete.
- PR 4.3 read-only App and Cockpit views are complete.
- Developer Mode publication summary verification is complete via PR #66.
- First live GitHub PR comment test is complete via PR #67, with one retained
  test comment and no duplicate replay.
- True ChatGPT Developer Mode publication decision-card verification is
  complete via PR #72.

Next design concern: cross-surface control UX and authority separation. PR A is
implemented as the read-only `GET /api/control/brief?scope=project:augnes`
Control Packet API. PR B adds a bridge-gated read-only ChatGPT Apps publication
decision-card surface derived from that packet, with true ChatGPT Developer
Mode verification complete via PR #72.

The Core-gated approve/publish workflow is now partially implemented through
C3. C1 created approval request records, C2 rendered read-only gate state, and
C3 adds a Core-gated approve action route that grants approval only for one
stored request target. C3 does not dry-run, publish, retry, create delivery
rows, record proof, update mailbox status, commit/reject state, execute Codex,
invoke GitHub, use `GITHUB_TOKEN`, post to GitHub, or post to Discord.

Future implementation slices must remain separate from this design step:

- PR C1: Core approval intent model and approval request records only, with no
  publish execution. Status: implemented as durable approval request records
  and read/create APIs only; request creation does not grant approval, change
  publication status, create delivery rows, dry-run, publish, retry, record
  proof, update mailbox status, or commit/reject state.
- PR C2: ChatGPT Apps or Cockpit read-only gate-state renderer. Status:
  implemented as a derived Core summary API and read-only Cockpit panel; gate
  rendering does not grant approval, change publication status, create delivery
  rows, dry-run, publish, retry, record proof, update mailbox status, or
  commit/reject state.
- PR C3: Core-gated approve action route, with no publish execution. Status:
  implemented as `POST /api/publication-approval-requests/{approval_request_id}/approve`
  and durable `publication_approval_decisions`; approval grant is still not
  publication and does not create delivery rows or external side effects.
- PR C4: Core-gated dry-run publish readiness route.
- PR C5: Core-gated explicit publish action with the GitHub PR comment adapter,
  preserving PR #67 idempotency rules.
- PR C6: Retry workflow design and implementation only after C5 evidence.
- PR C7: Optional Cockpit write controls, only after Core approval/publish
  routes exist.
- PR C8: Optional ChatGPT Apps intent collection, only if the user explicitly
  approves that surface behavior.

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
13. Read-only Control Packet and publication decision-card verification
14. Core-gated approve/publish workflow design before write controls
15. Core approval request records only, with no publish execution
16. Read-only approval gate-state renderer, with no approve/publish execution
17. Core-gated approve action route, with no publish execution
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
