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
Phase 3 / PR 3.3 Mailbox summary views             implemented in PR #60, pending review/merge
```

The next decision after PR #60 should be one of:

```text
1. Phase 4 / PR 4.1: Publisher + Delivery Ledger Lite backend
2. Small Phase 3 polish/docs cleanup: active mailbox filters, reopen behavior, or onboarding cleanup
```

Do not begin Phase 4 publisher behavior until the user decides that PR #60 is
ready to merge or explicitly scopes follow-up work. Mailbox summaries are
derived read-only views, not sources of truth.

## Read These First

A new session should read these files in this order:

1. `DEVELOPMENT_ONBOARDING.md` - this file.
2. `docs/AUGNES_COORDINATION_SPINE_ROADMAP.md` - full roadmap and phase order.
3. `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` - completed Phase 2 flow.
4. `docs/AUTHORITY_MATRIX.md` - actor/surface authority boundaries.
5. `docs/CODEX_HANDOFF_PACKET.md` - handoff packet shape.
6. `docs/EXPECTED_IMPACT_CHECK.md` - expected-vs-actual review discipline.
7. `docs/VERIFICATION_EVIDENCE_PACK.md` - PR verification evidence format.
8. `docs/EXECUTION_SURFACE_RECORD.md` - canonical execution surface names.
9. `.github/pull_request_template.md` - required PR trace format.
10. `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md` - ChatGPT App bridge behavior.
11. `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md` - proof recording after Codex work.

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

Phase 3 completed or in review:

- PR 3.1: Mailbox Lite storage and API is complete.
- PR 3.2: Mailbox integration with handoff status changes is complete.
- PR 3.3: App and Cockpit mailbox summaries are implemented in draft PR #60 and pending review/merge.
- Backend mailbox storage/API remains the source of truth.
- Mailbox summaries are bounded derived views over mailbox messages.
- Cockpit mailbox summary panels are read-only.
- ChatGPT App mailbox summary tooling is bridge-gated and read-only.
- No mailbox summary surface can acknowledge messages, approve/reject state, execute Codex, publish externally, or record proof.

## Current Next Goal

After PR #60, decide between:

```text
Phase 4 / PR 4.1: Publisher + Delivery Ledger Lite backend
```

or:

```text
Small Phase 3 polish/docs cleanup: active mailbox filters, reopen behavior, or onboarding cleanup
```

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

Phase 3 completed or in review:

- PR 3.1 added mailbox storage and create/list/read/update-status APIs.
- PR 3.2 linked handoff status changes to mailbox messages.
- PR 3.3 added derived mailbox summaries for Cockpit and ChatGPT Apps bridge in draft PR #60.

Phase 3 mailbox surfaces must not add:

- free-form agent chat
- publisher or delivery ledger behavior
- GitHub/Discord posting
- Codex execution or orchestration
- ChatGPT App commit/reject authority
- Cockpit write controls
- mailbox summaries as sources of truth
- automatic proof recording

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
GET  /api/events?scope=project:augnes
GET  /api/work?scope=project:augnes
GET  /api/work/{work_id}/brief?scope=project:augnes
POST /api/handoffs/generate
GET  /api/handoffs?scope=project:augnes
POST /api/handoffs/review
GET  /api/mailbox?scope=project:augnes
GET  /api/mailbox/summary?scope=project:augnes
POST /api/mailbox
GET  /api/mailbox/{message_id}
POST /api/mailbox/{message_id}/status
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
augnes_record_action_result
augnes_record_work_event
```

Public/default ChatGPT App mode must not expose bridge-gated write/draft tools.
Public/default ChatGPT App mode must also not expose mailbox summary tools;
`augnes_get_mailbox_summary` is bridge-gated and read-only.

## Authority Boundaries to Preserve

Always confirm in PRs:

```text
No direct Codex orchestration.
No autonomous Codex execution.
No ChatGPT App commit/reject authority.
No GitHub auto-merge.
No hosted auth/deployment semantics unless explicitly scoped.
No secret handling changes unless explicitly scoped.
No publisher behavior unless explicitly scoped.
No GitHub/Discord posting unless explicitly scoped.
No Cockpit write controls unless explicitly scoped.
No free-form agent social chat.
Mailbox summaries are derived read-only views, not sources of truth.
No automatic proof recording from review/draft tools.
```

## How a New ChatGPT Session Should Continue Development

A fresh ChatGPT session should do this:

1. Read this file and the roadmap/runbooks listed above.
2. Confirm that Phase 1, Phase 2, Phase 3 PR 3.1, and Phase 3 PR 3.2 are complete.
3. Confirm that Phase 3 PR 3.3 is implemented in draft PR #60 and still needs user review/merge unless it has already merged.
4. Ask the user to decide whether the next implementation slice should be Phase 4 / PR 4.1 Publisher + Delivery Ledger Lite backend, or a small Phase 3 polish/docs cleanup PR for active mailbox filters, reopen behavior, or onboarding cleanup.
5. Prepare a Codex prompt only after that decision, including working-directory rules, scope boundaries, tests, browser checks, bridge checks, and a Handoff / Reality Feedback Report requirement.
6. Let Codex implement and open or update a draft PR.
7. Review the PR for scope, authority boundaries, test evidence, and repo/task mismatches.
8. Let the user decide whether to merge.

ChatGPT should not merge on its own unless the user explicitly directs it through available GitHub tooling.

## Historical Starter Prompts

The old Phase 3 / PR 3.1 starter prompt has been removed from this onboarding
entrypoint because PR 3.1 is complete. If historical prompt text is needed for
review, use Git history or the merged PR record. A fresh session should not
start PR 3.1 again.

## Merge Discipline

Use the existing workflow:

```text
Codex codes/tests/opens PR.
ChatGPT reviews the PR.
The user decides whether to merge.
```

Do not collapse this into autonomous implementation. The boring boundary is doing important work. Annoying, yes. Useful, also yes.

## Current Open Question After PR 3.3

After PR #60 review, decide whether to begin:

```text
Phase 4 / PR 4.1: Publisher + Delivery Ledger Lite backend
```

or run a small Phase 3 polish/docs cleanup PR first for:

```text
active mailbox filters
reopen behavior
onboarding cleanup
```

Do not add publisher behavior, delivery ledger behavior, external posting, or
automatic proof recording until the user explicitly scopes that work.
