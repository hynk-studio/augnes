# Augnes Development Onboarding

Use this file when a new ChatGPT session, a new computer, or Codex needs to continue Augnes development from the GitHub repository alone.

This is the current repo-level entrypoint for development continuity. Read it before opening the next implementation PR.

## Current Status

Current implementation position:

```text
Phase 1: Trace Spine                              complete
Phase 2: Handoff Registry + ChatGPT-Codex Review  complete
Phase 2 integration runbook                       complete
Phase 3 / PR 3.1 Mailbox Lite storage and API      complete
Phase 3 / PR 3.2 Mailbox-handoff status sync       complete
Phase 3 / PR 3.3 Mailbox summary views             complete
Phase 4 / PR 4.1 Publication draft + delivery ledger backend complete
Phase 4 / PR 4.2 GitHub PR comment publication adapter complete
Phase 4 / PR 4.3 App and Cockpit publication preview / delivery status views complete
Developer Mode publication summary verification via PR #66 complete
Live GitHub PR comment adapter test via PR #67 complete
Cross-surface Control Packet / surface roles design via PR #69 complete
Read-only Control Packet API slice complete
Read-only ChatGPT Apps publication decision-card slice complete
True ChatGPT Developer Mode publication decision-card verification via PR #72 complete
Core approval request records slice complete
```

The cross-surface control packet / surface role design and the first read-only
Control Packet API slice are complete. The first ChatGPT Apps publication
decision-card slice is also read-only: it explains decisions and consequences
without granting approval, publish, retry, proof, state, Codex, GitHub, or
Discord authority. True ChatGPT Developer Mode verification for the publication
decision card is complete via PR #72. The next decision is:

```text
Review whether the next Core-gated approve/publish slice should be a read-only
gate-state renderer or a Core-gated approve action route.
```

Do not restart Phase 4 / PR 4.1. Mailbox summaries and publication summaries
are derived read-only views, not sources of truth. Do not repeat live GitHub
posting unless the user/PM explicitly approves one specific target.

## Read These First

A new session should read these files in this order:

1. `DEVELOPMENT_ONBOARDING.md` - this file.
2. `docs/AUGNES_COORDINATION_SPINE_ROADMAP.md` - full roadmap and phase order.
3. `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` - completed Phase 2 flow.
4. `docs/AUTHORITY_MATRIX.md` - actor/surface authority boundaries.
5. `docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md` - cross-surface control packet and surface roles.
6. `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md` - design-only Core-gated approve/publish workflow.
7. `docs/CODEX_HANDOFF_PACKET.md` - handoff packet shape.
8. `docs/EXPECTED_IMPACT_CHECK.md` - expected-vs-actual review discipline.
9. `docs/VERIFICATION_EVIDENCE_PACK.md` - PR verification evidence format.
10. `docs/EXECUTION_SURFACE_RECORD.md` - canonical execution surface names.
11. `.github/pull_request_template.md` - required PR trace format.
12. `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md` - ChatGPT App bridge behavior.
13. `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md` - proof recording after Codex work.

## Mental Model

Use this division of responsibility:

```text
User
  owns durable approval and decides merges/state approval.

ChatGPT
  interprets repo state, reviews PRs, prepares Codex prompts, checks authority boundaries.

Codex
  implements, tests, runs browser/app checks, opens PRs, and leaves a Reality Feedback Report.

Augnes Core
  owns committed state, proof records, handoff registry, event spine, and commit/reject routes.

ChatGPT Apps bridge
  exposes bridge-gated state/handoff/review tools. It does not execute Codex or approve state.

Cockpit
  visualizes and supports operator review. It should not become a hidden state authority.
```

The most important rule:

```text
Handoff drafts are guidance, result reviews are interpretation, and proof/state changes remain explicit user-directed steps.
```

## Completed Implementation Baseline

Phase 1 completed:

- Coordination event spine schema/storage/API.
- Instrumentation from `action_records` and `work_events` into `coordination_events`.
- Read-only Cockpit Coordination Event Timeline.

Phase 2 completed:

- Handoff registry backend.
- Deterministic handoff generation helper.
- Bridge-gated `augnes_generate_codex_handoff_draft` ChatGPT App tool.
- Deterministic Codex result review drafts.
- Bridge-gated `augnes_review_codex_result_draft` ChatGPT App tool.
- Phase 2 integration runbook.

The current bridge tools are useful for drafting and reviewing handoffs, not for executing Codex or approving state.

Phase 3 completed:

- PR 3.1: Mailbox Lite storage and API is complete.
- PR 3.2: Mailbox integration with handoff status changes is complete.
- PR 3.3: App and Cockpit mailbox summaries are complete.
- Backend mailbox storage/API remains the source of truth.
- Mailbox summaries are bounded derived views over mailbox messages.
- Cockpit mailbox summary panels are read-only.
- ChatGPT App mailbox summary tooling is bridge-gated and read-only.
- No mailbox summary surface can acknowledge messages, approve/reject state, execute Codex, publish externally, or record proof.

Phase 4 completed:

- PR 4.1: Publication draft and delivery ledger backend records are complete.
- PR 4.2: GitHub PR comment publication adapter is complete behind explicit approval, dry-run, stored `target_ref`, idempotency, and token gates.
- PR 4.3: App and Cockpit publication preview / delivery status views are complete.
- Developer Mode publication summary verification is complete via PR #66.
- Live GitHub PR comment adapter testing is complete via PR #67.
- True ChatGPT Developer Mode publication decision-card verification is complete via PR #72.
- Core approval request records are complete. They represent that user/PM
  approval is being requested for a specific publication target; they do not
  grant approval, change publication status, create delivery rows, dry-run,
  publish, retry, record proof, update mailbox status, or commit/reject state.
- Publication preview and delivery status views are bounded derived read-only views, not authority.
- Actual GitHub posting remains gated by approved publication status, explicit `dry_run=false`, stored publication `target_ref`, required `idempotency_key`, fresh delivery row, token availability, and explicit user/PM approval for a specific target.
- No Cockpit publish controls, ChatGPT App publish tools, Discord/webhook adapter, auto-posting, or proof recording have been added.

## Live GitHub Adapter Test Baseline

PR #67 performed the first approved live GitHub PR comment adapter test:

- One live GitHub PR comment was posted to PR #67.
- Test comment id: `4414174258`.
- Test comment URL: `https://github.com/Aurna-code/augnes/pull/67#issuecomment-4414174258`.
- The comment is intentionally kept as evidence. Do not delete it unless the user explicitly requests deletion.
- Replaying the same `idempotency_key` created no duplicate comment.
- The delivery ledger recorded one sent delivery.
- The publication became `sent`.
- No auto-merge, PR review approval, reviewer request, PR title/body/label mutation, Discord/webhook posting, proof recording, state commit/reject, or Codex execution occurred.
- This test does not authorize automatic posting in future PRs.

Future live posting must remain preview-first, approval-gated, idempotent, and
target-specific.

## Current Next Goal

Next default decision:

```text
Choose the next Core-gated approve/publish slice: C2 read-only gate-state
renderer or C3 Core-gated approve action route.
```

Do not restart Phase 4 / PR 4.1. Do not add publish buttons, approval
controls, retry controls, ChatGPT App publish tools, or ChatGPT App intent
tools without a separate explicit PR. Do not repeat live GitHub posting unless
the user/PM explicitly approves a specific target. Do not delete the PR #67 test
comment unless the user explicitly requests deletion.

Before adding approve/publish controls, read
`docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md` and
`docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md`. Keep the cross-surface
control/authority split intact: ChatGPT Apps may be the primary user-facing
decision surface, Codex may be the implementation control surface, Cockpit may
be the observability surface, and Augnes Core remains the source of truth and
durable authority runtime.

Phase 3 added a narrow task-oriented mailbox for handoffs and review-needed
notices. It should not become a free-form agent social network.

## Phase 3 Mailbox Baseline

Implemented mailbox/message fields:

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

Allowed message types:

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

Phase 3 completed:

- PR 3.1 added mailbox storage and create/list/read/update-status APIs.
- PR 3.2 linked handoff status changes to mailbox messages.
- PR 3.3 added derived mailbox summaries for Cockpit and ChatGPT Apps bridge.

Active mailbox views are composed by excluding terminal `superseded` and
`expired` messages. The list API supports the read-only filter
`GET /api/mailbox?scope=project:augnes&active=true`; summary buckets apply the
same terminal exclusion and report superseded/expired counts only as inactive
context. Terminal mailbox messages must not be reactivated to `ready`,
`delivered`, `acknowledged`, or `reviewed` unless a future explicit reopen
design is implemented.

Phase 3 mailbox surfaces must not add:

- free-form agent chat
- publisher or delivery ledger behavior
- GitHub/Discord posting
- Codex execution or orchestration
- ChatGPT App commit/reject authority
- Cockpit write controls
- mailbox summaries as sources of truth
- automatic proof recording

## Current Phase 4 Publication Baseline

Current publication behavior after PR 4.3:

- Publication drafts are backend records.
- Delivery ledger entries are backend records.
- The GitHub PR comment adapter exists, but actual posting is approval-gated.
- Publication summary is bounded and read-only.
- Cockpit publication panel is read-only.
- ChatGPT App publication summary is bridge-gated and read-only.
- No Cockpit publish controls exist.
- No ChatGPT App publish tools exist.
- No Discord/webhook adapter exists.
- No auto-posting exists.
- No proof recording is performed by publication preview or summary views.

Publication preview and delivery status surfaces must remain derived views. They
must not become publication authority, approval authority, retry authority,
proof authority, or durable state authority.

Actual GitHub posting remains gated by all of the following:

- approved publication status
- explicit `dry_run=false`
- stored publication `target_ref`
- required `idempotency_key`
- fresh delivery row
- token availability
- explicit user/PM approval for a specific target

## Completed Publication Verification Slices

`augnes_get_publication_summary` has true ChatGPT Developer Mode verification
from PR #66. The tool remains bridge-gated and read-only; public/default mode
must not expose publication summary, approval, publish, or retry tools.

The GitHub PR comment adapter has a completed live GitHub test from PR #67.
Future live GitHub testing must not be bundled into unrelated docs or summary
view PRs. It requires:

- explicit user/PM approval
- specific test PR `target_ref`
- scoped `GITHUB_TOKEN`
- unique `idempotency_key`
- one comment only
- replay check proving no duplicate comment
- no PR merge, review, label, title, or body mutation

The PR #67 test comment is intentionally retained as evidence. Do not delete it
unless explicitly requested.

## Working Directory Rules

Always state the working directory in Codex prompts.

```text
Working directory:
- Start from the repo root: /Users/hynk/Documents/augnes, or the checked-out root of Aurna-code/augnes.
- Run root package commands from the repo root.
- Run ChatGPT App package commands with npm --prefix apps/augnes_apps ... from the repo root, or cd apps/augnes_apps first and state that explicitly.
- For browser/runtime checks, start the root runtime from the repo root with npm run dev -- --port 3000.
- For bridge checks, start the nested app package from the repo root with:
  AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
  Or cd apps/augnes_apps first and run:
  AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm run dev
```

Do not let Codex run root commands from `apps/augnes_apps` by accident. Humans already invented directory confusion; no need to honor the tradition.

## Required Verification Pattern

For implementation PRs, Codex should normally run from the repo root:

```text
npm run db:reset
npm run db:migrate
npm run demo:seed
npm run typecheck
npm run build
npm --prefix apps/augnes_apps run typecheck
npm --prefix apps/augnes_apps run smoke
npm --prefix apps/augnes_apps run invariants
```

For runtime checks:

```text
npm run dev -- --port 3000
```

Then verify relevant endpoints with `curl` and `jq`.

For browser checks, open:

```text
http://localhost:3000
```

Confirm these panels still render unless the PR intentionally changes them:

```text
Current Work
Work Focus
Coordination Event Timeline
State Snapshot
Temporal State Graph
```

For ChatGPT App bridge checks when practical:

```text
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
curl -sS http://localhost:8787/healthz
```

If ChatGPT Developer Mode or MCP Inspector is unavailable, record the exact skipped reason.

## Current API Surfaces to Know

Core runtime:

```text
GET  /api/state/brief?scope=project:augnes
GET  /api/control/brief?scope=project:augnes
GET  /api/events?scope=project:augnes
GET  /api/work?scope=project:augnes
GET  /api/work/{work_id}/brief?scope=project:augnes
POST /api/handoffs/generate
GET  /api/handoffs?scope=project:augnes
POST /api/handoffs/review
GET  /api/mailbox?scope=project:augnes
GET  /api/mailbox?scope=project:augnes&active=true
GET  /api/mailbox/summary?scope=project:augnes
POST /api/mailbox
GET  /api/mailbox/{message_id}
POST /api/mailbox/{message_id}/status
GET  /api/publications?scope=project:augnes
POST /api/publications
GET  /api/publications/{publication_id}?scope=project:augnes
POST /api/publications/{publication_id}/status
GET  /api/deliveries?scope=project:augnes
POST /api/deliveries
GET  /api/deliveries/{delivery_id}?scope=project:augnes
POST /api/deliveries/{delivery_id}/status
GET  /api/publications/summary?scope=project:augnes
GET  /api/publication-approval-requests?scope=project:augnes
POST /api/publication-approval-requests
GET  /api/publication-approval-requests/{approval_request_id}?scope=project:augnes
POST /api/publications/{publication_id}/publish/github-pr-comment
POST /api/actions/record
POST /api/work/{work_id}/events
```

Bridge-gated ChatGPT App tools include:

```text
augnes_get_state_brief
augnes_list_work_items
augnes_get_work_brief
augnes_generate_codex_handoff_draft
augnes_review_codex_result_draft
augnes_get_mailbox_summary
augnes_get_publication_summary
augnes_get_publication_decision_card
augnes_record_action_result
augnes_record_work_event
```

Public/default ChatGPT App mode must not expose bridge-gated write/draft tools.
Public/default ChatGPT App mode must also not expose mailbox summary or
publication summary tools; `augnes_get_mailbox_summary` and
`augnes_get_publication_summary` are bridge-gated and read-only.
`augnes_get_publication_decision_card` is also bridge-gated and read-only; it
derives a user-facing publication decision card from the Control Packet and does
not approve, publish, retry, record proof, commit/reject state, execute Codex,
mutate GitHub, or post to Discord.
Public/default mode must not expose publication approval, publish, or retry
tools.

## Authority Boundaries to Preserve

Always confirm in PRs:

```text
No direct Codex orchestration.
No autonomous Codex execution.
No ChatGPT App commit/reject authority.
No GitHub auto-merge.
No hosted auth/deployment semantics unless explicitly scoped.
No secret handling changes unless explicitly scoped.
No new publisher behavior unless explicitly scoped.
No GitHub/Discord posting unless explicitly scoped and explicitly approved for a specific target.
No publication approval/publish/retry tools unless explicitly scoped.
No Cockpit write controls unless explicitly scoped.
No free-form agent social chat.
Mailbox summaries are derived read-only views, not sources of truth.
Publication previews and delivery summaries are derived read-only views, not sources of truth.
No automatic proof recording from review/draft tools.
```

## How a New ChatGPT Session Should Continue Development

A fresh ChatGPT session should do this:

1. Read this file and the roadmap/runbooks listed above.
2. Confirm that Phase 1, Phase 2, Phase 3 PR 3.1, Phase 3 PR 3.2, Phase 3 PR 3.3, Phase 4 PR 4.1, Phase 4 PR 4.2, Phase 4 PR 4.3, Developer Mode publication summary verification via PR #66, the live GitHub adapter test via PR #67, and true ChatGPT Developer Mode publication decision-card verification via PR #72 are complete.
3. Confirm that C1 Core approval request records are records-only and do not grant approval, change publication status, create deliveries, dry-run, publish, retry, record proof, update mailbox status, or commit/reject state.
4. Ask the user to choose whether the next slice should be C2 read-only gate-state renderer or C3 Core-gated approve action route.
5. Prepare a Codex prompt only after that decision, including working-directory rules, scope boundaries, tests, browser checks, bridge checks, and a Handoff / Reality Feedback Report requirement.
6. Let Codex implement and open or update a draft PR.
7. Review the PR for scope, authority boundaries, test evidence, and repo/task mismatches.
8. Let the user decide whether to merge.

ChatGPT should not merge on its own unless the user explicitly directs it through available GitHub tooling.

## Historical Starter Prompts

The old Phase 3 / PR 3.1 and Phase 4 / PR 4.1 starter prompts have been
removed from this onboarding entrypoint because those slices are complete. If
historical prompt text is needed for review, use Git history or the merged PR
record. A fresh session should not start PR 3.1 or PR 4.1 again.

## Merge Discipline

Use the existing workflow:

```text
Codex codes/tests/opens PR.
ChatGPT reviews the PR.
The user decides whether to merge.
```

Do not collapse this into autonomous implementation. The boring boundary is doing important work. Annoying, yes. Useful, also yes.

## Current Next Goal

Begin with:

```text
Choose the next Core-gated approve/publish slice: C2 read-only gate-state
renderer or C3 Core-gated approve action route.
```

Do not repeat live GitHub posting unless the user/PM explicitly approves a
specific target. Do not delete the PR #67 test comment unless explicitly
requested. Do not add publish buttons, approval controls, retry controls,
external posting, Discord/webhook behavior, or automatic proof recording until
the user explicitly scopes that work.
