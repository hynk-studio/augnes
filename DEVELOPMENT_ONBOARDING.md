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
Read-only approval gate-state renderer slice complete
C3 Core-gated approve action route complete
C4 Core-gated dry-run publish readiness route complete
C5 explicit Core-gated GitHub PR comment publish route complete, with no live posting executed in verification
```

The cross-surface control packet / surface role design and the first read-only
Control Packet API slice are complete. The first ChatGPT Apps publication
decision-card slice is also read-only: it explains decisions and consequences
without granting approval, publish, retry, proof, state, Codex, GitHub, or
Discord authority. True ChatGPT Developer Mode verification for the publication
decision card is complete via PR #72. The C3 Core-gated approve action route is
implemented for stored approval requests and targets, C4 dry-run publish
readiness checks are implemented as Core-gated readiness records, and C5 adds
an explicit Core-gated GitHub PR comment publish route from a fresh readiness
check. C5 verification did not execute live posting. The next likely slice is:

```text
Decide whether to approve one exact future live C5 GitHub posting test target.
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
6. `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md` - Core-gated approve/publish workflow and implemented C1-C5 boundaries.
7. `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` - decision packet and procedure for a future C5 live GitHub publish test.
8. `docs/CODEX_HANDOFF_PACKET.md` - handoff packet shape.
9. `docs/EXPECTED_IMPACT_CHECK.md` - expected-vs-actual review discipline.
10. `docs/VERIFICATION_EVIDENCE_PACK.md` - PR verification evidence format.
11. `docs/EXECUTION_SURFACE_RECORD.md` - canonical execution surface names.
12. `.github/pull_request_template.md` - required PR trace format.
13. `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md` - ChatGPT App bridge behavior.
14. `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md` - proof recording after Codex work.

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
- Read-only approval gate-state rendering is complete. The derived summary API
  and Cockpit panel make approval request records visible as gate context; they
  do not grant approval, change publication status, create delivery rows,
  dry-run, publish, retry, record proof, update mailbox status, or commit/reject
  state. Gate-state views are derived views, not sources of truth.
- C3 Core-gated approve action routing is complete. It records durable
  `publication_approval_decisions` approval grants for one existing approval
  request and its stored publication target, then moves the linked publication
  from `draft` to `approved` when Core gates pass. The approval request remains
  a request record; the decision row is the grant record.
- C3 approval grant is still not publication. It does not dry-run, publish,
  retry, create delivery rows, record proof, update mailbox status,
  commit/reject Augnes state, execute Codex, invoke the GitHub PR comment
  adapter, use `GITHUB_TOKEN`, post to GitHub, or post to Discord.
- C4 Core-gated dry-run publish readiness routing is complete. It records
  durable `publication_readiness_checks` for one approved decision and stored
  publication target, validates current readiness gates, and can return ready or
  blocked. Dry-run readiness is still not publication.
- C4 does not publish, retry, create delivery rows, invoke the GitHub PR comment
  adapter, use `GITHUB_TOKEN`, post externally, record proof, update mailbox
  status, commit/reject Augnes state, execute Codex, add ChatGPT App tools, or
  add Cockpit write controls.
- C5 explicit Core-gated GitHub PR comment publish routing is complete at
  `POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment`.
  `dry_run=true` returns a publish readiness preview only; it does not call the
  GitHub adapter, require or use `GITHUB_TOKEN`, create delivery rows, update
  publication status, create `publication_sent` or `publication_failed` events,
  record proof, update mailbox status, commit/reject Augnes state, execute
  Codex, post externally, add ChatGPT App tools, or add Cockpit write controls.
- C5 `dry_run=false` is implemented as the only actual publish path, but it was
  not executed live in the C5 implementation PR. It requires a fresh ready
  readiness check, approved decision, requested approval request, approved
  publication, exact stored GitHub PR target match, explicit target approval
  fields, required `idempotency_key`, token availability before adapter
  execution, and replay/no-duplicate gates.
- The legacy
  `POST /api/publications/{publication_id}/publish/github-pr-comment` route is
  disabled so it cannot bypass C1-C4 gates.
- `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` prepares the approval
  packet and procedure for a possible future live C5 test. It does not approve
  a target, run `dry_run=false`, use `GITHUB_TOKEN`, create delivery rows, or
  post to GitHub.
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
Choose whether to approve one exact future live C5 GitHub posting test target.
The decision packet exists, but live posting remains unapproved until the
user/PM names the exact target, body, idempotency key, token permission, and
retain/delete decision.
```

Do not restart Phase 4 / PR 4.1. Do not add publish buttons, Cockpit write
controls, retry controls, ChatGPT App publish/approval/retry tools, or ChatGPT
App intent tools without a separate explicit PR. Do not repeat live GitHub
posting unless the user/PM explicitly approves a specific target. Do not delete
the PR #67 test comment unless the user explicitly requests deletion.

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
POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment
POST /api/publications/{publication_id}/publish/github-pr-comment  # disabled, returns 410
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
4. Confirm that C2 read-only approval gate-state rendering is derived context only and does not grant approval, change publication status, create deliveries, dry-run, publish, retry, record proof, update mailbox status, or commit/reject state.
5. Confirm that C3 Core-gated approve action routing grants approval only for the stored target and does not dry-run, publish, retry, create delivery rows, record proof, update mailbox status, commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, or post externally.
6. Confirm that C4 Core-gated dry-run publish readiness records readiness evidence only and does not publish, retry, create delivery rows, record proof, update mailbox status, commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, post externally, add ChatGPT App tools, or add Cockpit write controls.
7. Confirm that C5 Core-gated publish routing exists, `dry_run=true` previews only and creates no delivery rows, `dry_run=false` requires explicit target approval plus token availability, and C5 verification did not execute live GitHub posting.
8. Read `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` before preparing any live C5 publish test prompt.
9. Ask the user to choose whether to approve one exact future live C5 GitHub posting test target, using the required approval packet fields.
10. Prepare a Codex prompt only after that decision, including working-directory rules, scope boundaries, tests, browser checks, bridge checks, and a Handoff / Reality Feedback Report requirement.
11. Let Codex implement and open or update a draft PR.
12. Review the PR for scope, authority boundaries, test evidence, and repo/task mismatches.
13. Let the user decide whether to merge.

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
Choose whether to approve one exact future live C5 GitHub posting test target,
using `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md`.
```

Do not repeat live GitHub posting unless the user/PM explicitly approves a
specific target. Do not delete the PR #67 test comment unless explicitly
requested. Do not add publish buttons, approval controls, retry controls,
external posting, Discord/webhook behavior, or automatic proof recording until
the user explicitly scopes that work.
