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
C5 explicit Core-gated GitHub PR comment publish route complete via PR #78, with no live posting executed in that implementation PR
Approved C5 live GitHub PR comment publish test complete via PR #81
C5 same-key replay semantics fix complete via PR #82
C5 delivery external artifact persistence complete
Evidence Pack v0.1 read-only API/Cockpit review bundle complete
Structured verification/replay evidence records v0.1 complete
Codex structured verification evidence helper complete
Codex structured evidence closeout workflow complete
Session Binding v0.1 trace API complete via PR #109
Read-only Cockpit Session Trace surfacing complete
ChatGPT Apps cross-session read tools complete via PR #111/#112
Codex Session Adapter v0.2 workflow packaging complete
Temporal Interpretation Preview hardening v0.2 complete
Temporal Interpretation Preview manual review example added
Read-only Cockpit rendering for Temporal active-context admission decisions complete
Temporal Interpretation Preview OpenAI-path validation harness added
Temporal Interpretation v0.2 status and roadmap doc added
Temporal Interpretation route-captured manual review report added
Temporal Interpretation Cockpit screenshot validation report added
Temporal Interpretation persistence boundary design v0.1 added
Temporal Interpretation work/evidence binding convention added
Temporal Interpretation seeded work anchor added
TemporalPreviewReviewArtifact schema design v0.1 added
TemporalPreviewReviewArtifact read model v0.1 added
TemporalPreviewReviewArtifact forbidden-persistence fixtures added
TemporalPreviewReviewArtifact non-public capture helper added
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
check. PR #78 implemented C5 without live posting. PR #81 separately executed
one approved live C5 publish test against `Aurna-code/augnes#81`. PR #82 fixed
same-key sent/acknowledged replay semantics so a replay returns HTTP 200 with
`idempotent_replay=true` and `posted=false`. C5 delivery rows now persist
nullable external artifact id, URL, and type fields for GitHub PR comments so
same-key replay can return the stored GitHub comment artifact without another
adapter call or token requirement. Evidence Pack v0.1 is complete as a derived
read-only API/Cockpit review bundle over existing
work/publication/approval/readiness/delivery/artifact/replay context and
verification gaps. Structured
verification evidence records are complete for command/check observations,
skipped checks, explicit replay observations, and explicit duplicate-block
observations. Evidence Pack may read matching records to reduce gaps, but it
still must not create records, execute replay, attempt duplicate publish, call
GitHub, call OpenAI, or add approval/publish authority. The Codex helper for
recording those structured evidence records through the local Augnes API is
complete. The current narrow follow-up makes structured evidence record IDs, or
the exact skipped reason, part of the standard Codex PR closeout workflow.
Session Binding v0.1 trace API is complete via PR #109: existing
`sessions` rows gain nullable metadata for surface, actor, related work ID,
related PR, summary, handoff ref, and Evidence Pack ref. The local runtime
exposes `POST /api/sessions/bind`, `GET /api/sessions/trace`, and
`GET /api/sessions/{session_id}/trace`. The bind route fails closed for unknown
sessions and updates only session metadata. Trace routes are read-only and
connect sessions to bounded message counts, work events, action records, and
verification evidence records where refs exist. They do not execute Codex, call
GitHub/OpenAI, approve, publish, replay, or mutate work/evidence/publication/
delivery/readiness/mailbox/state records. Read-only Cockpit Session Trace
surfacing is also complete: operators can load the bounded continuity view on
demand without binding sessions, creating sessions, or adding write controls.
The bridge package now also wraps the read-only cross-session continuity route
contract for Evidence Pack, Session Trace, and Verification Evidence Records
when those runtime routes are present.
Codex Session Adapter v0.2 now standardizes the repo workflow for reading the
state/work brief, optionally binding an existing session, recording structured
evidence rows, recording completion, and reviewing Evidence Pack plus Session
Trace outputs. It is documentation and smoke coverage over existing helpers and
read-only surfaces only; it does not create sessions automatically, execute
Codex from ChatGPT, add ChatGPT App write tools, publish, replay, approve, or
mutate state.
Temporal Interpretation Preview hardening v0.2 adds a deterministic active
context admission rubric, semantic fidelity fixtures, stronger guardrails, and a
manual review report template for temporal preview outputs. The filled mock
preview example at
`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md`
validates the template against the deterministic bounded fixture output. The
route-captured mock-mode report at
`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
validates the same review process against a real
`POST /api/temporal-interpretation/preview` response with `OPENAI_API_KEY`
unset. The Cockpit Temporal Interpretation Preview panel renders the structured
`active_context_admission.decisions` block read-only when returned by the
preview. The opt-in OpenAI-path validation harness at
`scripts/validate-temporal-openai-path.mjs` validates the strict schema when an
environment-provided `OPENAI_API_KEY` is available; the validation report lives
at `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`. It remains a
read-only preview and does not add PerspectiveSnapshot storage,
RawEpisodeBundle runtime, approval/publish/replay authority, ChatGPT App write
tools, Cockpit write controls, or DB schema. The browser/Cockpit screenshot
validation report at
`docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md` records a
mock-mode, `OPENAI_API_KEY`-unset real Cockpit validation of the read-only
structured admission decisions panel. The current status, validation matrix,
guarded failure modes, known limitations, roadmap options, and recommended next
step are summarized in
`docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md`.
Future Temporal Interpretation persistence boundaries are documented in
`docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md`; this is design only
and does not add DB schema, API routes, runtime persistence, Cockpit code,
ChatGPT App tools, PerspectiveSnapshot runtime, or RawEpisodeBundle runtime.
The work/evidence binding convention is documented in
`docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md`;
`AG-TEMPORAL-INTERPRETATION` is seeded as demo/runtime work trace data for
future Temporal Interpretation evidence, and canonical `target_ref` /
`source_ref` usage remains available for historical rows and unseeded runtimes.
The `TemporalPreviewReviewArtifact` schema design is documented in
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md`. The first
runtime read-model slice adds the `temporal_preview_review_artifacts` table,
validation/read helper, and read-only list/get APIs. It intentionally does not
add create/capture routes, Cockpit rendering, Evidence Pack integration,
ChatGPT App tools, OpenAI calls, GitHub publication adapter calls, replay,
publish, approval, state mutation, PerspectiveSnapshot runtime, or
RawEpisodeBundle runtime.
The forbidden-persistence fixture corpus at
`lib/temporal-review-artifact-fixtures.ts` centralizes invalid persistence
cases for top-level forbidden fields, nested forbidden fields,
summary/evidence separation, authority confusion, link validation, and
route/source validation. `smoke:temporal-forbidden-persistence-fixtures` runs
the corpus through the current smoke-only insert helper before any capture
helper or create route exists.
The non-public capture helper at `lib/temporal-review-artifact-capture.ts`
converts bounded Temporal Preview responses plus manual review metadata into
`TemporalPreviewReviewArtifactInput` and is covered by
`smoke:temporal-review-artifact-capture-helper`. It remains internal-only: no
public create route, Cockpit code, Evidence Pack rendering, ChatGPT App tools,
OpenAI calls, GitHub publication adapter calls, replay, publish, approval,
PerspectiveSnapshot runtime, or RawEpisodeBundle runtime.
The future public create/capture route contract is documented in
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_CREATE_ROUTE_DESIGN_V0_1.md` and covered
by `smoke:temporal-create-route-design`. It recommends
`POST /api/temporal-interpretation/review-artifacts/capture` but remains design
only: no route, DB schema, runtime behavior, Cockpit write button, Evidence
Pack integration, ChatGPT App create tool, OpenAI call, GitHub publication
adapter call, replay, publish, approval, or state mutation.
The private non-smoke insert helper
`insertTemporalPreviewReviewArtifact` now lives in
`lib/temporal-review-artifacts.ts` and is covered by
`smoke:temporal-private-insert-helper`. It shares the same internal validation
and insertion path as `insertTemporalPreviewReviewArtifactForSmoke`; no public
create route or write surface is exposed.
The internal idempotency foundation for future review artifact capture lives in
`temporal_preview_review_artifact_idempotency` plus helper functions in
`lib/temporal-review-artifacts.ts`, with smoke coverage in
`smoke:temporal-artifact-idempotency`. It stores hashed idempotency keys and
payload hashes only, supports same-key replay/conflict checks and duplicate
source/hash conflict checks, and still exposes no public route.
The recommended next Temporal Interpretation productization slice is:

```text
Design the public capture route mapping to the internal idempotency helper.
```

Do not restart Phase 4 / PR 4.1. Mailbox summaries and publication summaries
are derived read-only views, not sources of truth. PR #81 does not authorize
broad posting. Do not repeat live GitHub posting unless the user/PM explicitly
approves one specific target.

## Read These First

A new session should read these files in this order:

1. `DEVELOPMENT_ONBOARDING.md` - this file.
2. `docs/AUGNES_COORDINATION_SPINE_ROADMAP.md` - full roadmap and phase order.
3. `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md` - completed Phase 2 flow.
4. `docs/AUTHORITY_MATRIX.md` - actor/surface authority boundaries.
5. `docs/AUGNES_CONTROL_PACKET_AND_SURFACE_ROLES.md` - cross-surface control packet and surface roles.
6. `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md` - Core-gated approve/publish workflow and implemented C1-C5 boundaries.
7. `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` - historical first live-test decision pattern plus approval packet template for future C5 live GitHub publish tests.
8. `docs/CODEX_HANDOFF_PACKET.md` - handoff packet shape.
9. `docs/EXPECTED_IMPACT_CHECK.md` - expected-vs-actual review discipline.
10. `docs/VERIFICATION_EVIDENCE_PACK.md` - PR verification evidence format.
11. `docs/EXECUTION_SURFACE_RECORD.md` - canonical execution surface names.
12. `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md` - temporal preview manual review template.
13. `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md` - filled mock preview review example.
14. `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md` - filled route-captured mock preview review example.
15. `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md` - OpenAI-path validation report.
16. `docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md` - browser/Cockpit screenshot validation report.
17. `docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md` - Temporal Interpretation v0.2 status, authority boundary, and next productization options.
18. `docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md` - Temporal Interpretation persistence boundary design, not implementation.
19. `docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md` - Temporal Interpretation work/evidence binding convention.
20. `docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md` - TemporalPreviewReviewArtifact schema design, read-model implementation status, forbidden-persistence fixture gate, and non-public capture helper status.
21. `docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_CREATE_ROUTE_DESIGN_V0_1.md` - Future public create/capture route contract design only.
22. `.github/pull_request_template.md` - required PR trace format.
23. `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md` - ChatGPT App bridge behavior.
24. `apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md` - proof recording after Codex work.

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
  not executed live in the C5 implementation PR #78. It requires a fresh ready
  readiness check, approved decision, requested approval request, approved
  publication, exact stored GitHub PR target match, explicit target approval
  fields, required `idempotency_key`, token availability before adapter
  execution, and replay/no-duplicate gates.
- PR #81 separately executed one approved live C5 GitHub PR comment publish
  test against `Aurna-code/augnes#81`, using idempotency key
  `augnes-c5-live-test-pr-81-v1`. It posted exactly one retained GitHub
  comment, id `4414928332`, URL
  `https://github.com/Aurna-code/augnes/pull/81#issuecomment-4414928332`.
  Delivery status and publication status were `sent`. Exactly one matching
  comment was observed. There was no manual GitHub UI posting, no
  merge/review/label/title/body mutation, and no proof, mailbox, or state
  mutation.
- PR #82 fixed same-key C5 replay semantics after the PR #81 live evidence:
  same-key sent/acknowledged replay now returns HTTP 200 with
  `idempotent_replay=true` and `posted=false`; a different-key duplicate
  remains HTTP 409; pending delivery remains HTTP 409; `dry_run=true` with an
  existing sent delivery remains blocked. PR #82 did not post to GitHub.
- The legacy
  `POST /api/publications/{publication_id}/publish/github-pr-comment` route is
  disabled so it cannot bypass C1-C4 gates.
- `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` now preserves the
  first live-test decision pattern and historical PR #81 packet, while
  retaining the approval template for future live tests. It does not approve a
  future target, run `dry_run=false`, use `GITHUB_TOKEN`, create delivery rows,
  or post to GitHub.
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

## C5 Live Publish Test Baseline

PR #81 performed the first approved live C5 GitHub PR comment publish test:

- Target: `Aurna-code/augnes#81`.
- Idempotency key: `augnes-c5-live-test-pr-81-v1`.
- GitHub comment id: `4414928332`.
- GitHub comment URL: `https://github.com/Aurna-code/augnes/pull/81#issuecomment-4414928332`.
- Delivery status: `sent`.
- Publication status: `sent`.
- Exactly one matching comment was observed.
- No manual GitHub UI posting occurred.
- No PR merge, review, label, title, or body mutation occurred.
- No proof recording, mailbox status update, or Augnes state mutation occurred.
- This test does not authorize automatic or broad future posting.

PR #82 then fixed C5 same-key replay semantics:

- Same-key sent/acknowledged replay returns HTTP 200 with
  `idempotent_replay=true` and `posted=false`.
- Different-key duplicate remains HTTP 409.
- Pending delivery remains HTTP 409.
- `dry_run=true` with an existing sent delivery remains blocked.
- No live GitHub posting occurred in PR #82.

The delivery ledger now also stores C5 external artifact evidence for GitHub PR
comments in nullable `external_artifact_id`, `external_artifact_url`, and
`external_artifact_type` fields. Successful C5 GitHub PR comment publishes set
`external_artifact_type` to `github_pr_comment`, and same-key sent or
acknowledged replay can return the persisted comment id and URL without calling
the adapter or requiring token availability. Older delivery rows with null
artifact fields remain valid and serialize with null artifact values.

Future live posting must remain preview-first, approval-gated, idempotent,
target-specific, and freshly approved for the exact target.

## Current Next Goal

Next default decision:

```text
Choose the next productization slice after C5 live evidence and delivery
external artifact persistence and Evidence Pack closeout: Session Binding v0.1
trace hardening first, then temporal interpretation, ChatGPT Apps cross-session
read tools, a fuller Codex session adapter, Cockpit write-control design,
GitHub App/token model, or retry design if needed.
```

Do not restart Phase 4 / PR 4.1. Do not add publish buttons, Cockpit write
controls, retry controls, ChatGPT App publish/approval/retry tools, or ChatGPT
App intent tools without a separate explicit PR. Do not repeat live GitHub
posting unless the user/PM explicitly approves a specific target, body,
idempotency key, token use, and retain/delete decision. Do not delete the PR
#67 or PR #81 test comments unless the user explicitly requests deletion.

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

## Current Publication Baseline

Current publication behavior after PR #82:

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
- The C5 route exists for explicit Core-gated GitHub PR comment publish.
- PR #81 executed one approved live C5 publish to `Aurna-code/augnes#81`.
- PR #82 fixed same-key sent/acknowledged replay semantics.

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
GET  /api/approval-gate-state/summary?scope=project:augnes
GET  /api/publication-approval-requests?scope=project:augnes
POST /api/publication-approval-requests
GET  /api/publication-approval-requests/{approval_request_id}?scope=project:augnes
POST /api/publication-approval-requests/{approval_request_id}/approve
GET  /api/publication-approval-decisions?scope=project:augnes
GET  /api/publication-approval-decisions/{approval_decision_id}?scope=project:augnes
POST /api/publication-approval-decisions/{approval_decision_id}/readiness/dry-run
GET  /api/publication-readiness-checks?scope=project:augnes
GET  /api/publication-readiness-checks/{readiness_check_id}?scope=project:augnes
POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment
POST /api/publications/{publication_id}/publish/github-pr-comment  # disabled, returns 410
POST /api/actions/record
POST /api/work/{work_id}/events
```

Bridge-gated ChatGPT App tools include:

```text
augnes_get_state_brief
augnes_get_evidence_pack
augnes_get_session_trace
augnes_get_verification_evidence_records
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
publication summary tools; `augnes_get_mailbox_summary`,
`augnes_get_publication_summary`, `augnes_get_evidence_pack`,
`augnes_get_session_trace`, and `augnes_get_verification_evidence_records` are
bridge-gated and read-only.
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
2. Confirm that Phase 1, Phase 2, Phase 3 PR 3.1, Phase 3 PR 3.2, Phase 3 PR 3.3, Phase 4 PR 4.1, Phase 4 PR 4.2, Phase 4 PR 4.3, Developer Mode publication summary verification via PR #66, the live GitHub adapter test via PR #67, Control Packet / surface roles design via PR #69, read-only Control Packet API via PR #70, ChatGPT Apps publication decision-card via PR #71, true Developer Mode decision-card verification via PR #72, Core-gated approve/publish design via PR #73, C1 via PR #74, C2 via PR #75, C3 via PR #76, C4 via PR #77, C5 route via PR #78, C5 live-test decision via PR #79, token-unavailable partial evidence via PR #80, approved C5 live GitHub PR comment publish via PR #81, and C5 replay semantics fix via PR #82 are complete.
3. Confirm that C1 Core approval request records are records-only and do not grant approval, change publication status, create deliveries, dry-run, publish, retry, record proof, update mailbox status, or commit/reject state.
4. Confirm that C2 read-only approval gate-state rendering is derived context only and does not grant approval, change publication status, create deliveries, dry-run, publish, retry, record proof, update mailbox status, or commit/reject state.
5. Confirm that C3 Core-gated approve action routing grants approval only for the stored target and does not dry-run, publish, retry, create delivery rows, record proof, update mailbox status, commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, or post externally.
6. Confirm that C4 Core-gated dry-run publish readiness records readiness evidence only and does not publish, retry, create delivery rows, record proof, update mailbox status, commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, post externally, add ChatGPT App tools, or add Cockpit write controls.
7. Confirm that C5 Core-gated publish routing exists, PR #78 did not execute live posting, PR #81 separately executed one approved live post to `Aurna-code/augnes#81`, and PR #82 fixed same-key replay semantics without live posting.
8. Read `docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` before preparing any future live C5 publish test prompt; it is a historical pattern and template, not standing approval.
9. Ask the user which next productization slice to prioritize after C5 live evidence and delivery external artifact persistence: session model, temporal interpretation, ChatGPT Apps cross-session tools, Codex session adapter, Cockpit write-control design, GitHub App/token model, or retry design if needed.
10. Prepare a Codex prompt for that productization slice, including working-directory rules, scope boundaries, tests, browser checks, bridge checks, and a Handoff / Reality Feedback Report requirement.
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
Choose the next productization slice after C5 live evidence and delivery
external artifact persistence: session model, temporal interpretation, ChatGPT
Apps cross-session tools, Codex session adapter, Cockpit write-control design,
GitHub App/token model, or retry design if needed.
```

Do not repeat live GitHub posting unless the user/PM explicitly approves a
specific target, body, idempotency key, token use, and retain/delete decision.
Do not delete the PR #67 or PR #81 test comments unless explicitly requested.
Do not add publish buttons, approval controls, retry controls, external posting,
Discord/webhook behavior, or automatic proof recording until the user explicitly
scopes that work.
