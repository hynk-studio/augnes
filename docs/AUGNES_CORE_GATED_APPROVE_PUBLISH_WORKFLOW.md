# Augnes Core-Gated Approve/Publish Workflow Design

This document defines the Core-gated approve/publish workflow for Augnes.
C1 approval request records, C2 read-only gate-state rendering, C3
Core-gated approval grant routing, and C4 Core-gated dry-run publish readiness
routing are implemented. C5 explicit Core-gated GitHub PR comment publish
routing is also implemented. PR #78 implemented C5 without live posting. PR #81
executed one approved live C5 GitHub PR comment publish test against
`Aurna-code/augnes#81`. PR #82 fixed same-key sent/acknowledged replay semantics
without live posting. C5 delivery rows now persist nullable external artifact
id, URL, and type fields for GitHub PR comments, and same-key sent or
acknowledged replay can return that stored artifact without another adapter
call or token requirement. Evidence Pack v0.1 adds a derived read-only review
bundle over existing work, approval, readiness, delivery, artifact, replay, and
verification-gap records. The implemented C4 route records readiness evidence
only; it does not publish, retry, create delivery rows, record proof, update
mailbox status, commit/reject state, execute Codex, invoke the GitHub PR comment
adapter, use `GITHUB_TOKEN`, post to GitHub, post to Discord, add app tools, or
add Cockpit write controls. Structured verification evidence records add a
narrow observation layer for command/check, replay, and duplicate-block facts.
These records are proof traces only: they do not approve, publish, replay,
retry, change publication, approval, readiness, delivery, mailbox, or committed
state rows, and they do not call GitHub or OpenAI.
GitHub token management v0.1 adds an internal token provider abstraction for
C5 actual publish while preserving current env `GITHUB_TOKEN` behavior. It
does not implement GitHub App installation-token exchange, private key parsing,
new runtime GitHub App env handling, or live posting. The GitHub App
installation-token config boundary is documented in
`docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md`; it reserves
future config names and JWT/exchange/permission rules. The read-only config
reader/validator is now implemented in `lib/github-app-config.ts`, but C5 token
resolution still does not use it. No runtime JWT signing from configured
secrets, private key parsing, GitHub API calls, token exchange, or live posting
has been added.
The offline RS256 JWT helper in `lib/github-app-jwt.ts` signs only explicit
fake/test PEM input for local fixture coverage. JWT creation is not approval,
readiness, publication, or proof, and the helper is not integrated with C5
token resolution.
The GitHub App target/allowlist policy helper in
`lib/github-app-target-policy.ts` evaluates future installation-token
repository/permission scope before exchange. Target policy is not approval,
readiness, publication, proof, or token resolution, and it is not integrated
with C5 publish yet.
The installation-token exchange boundary helper in
`lib/github-app-installation-token-exchange.ts` is network-disabled by default
and accepts only an injected fetch when explicitly enabled. Exchange boundary
work is not approval, readiness, publication, proof, or C5 integration; it does
not change C5 gates or env `GITHUB_TOKEN` behavior.
The closeout in `docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1_CLOSEOUT.md` marks this
as the end of the v0.1 foundation line, not the start of live GitHub App
provider integration.

## Purpose

Approve/publish behavior must be Core-gated because publication crosses an
external side-effect boundary. A preview, summary, or decision card can help a
user understand an action, but only Augnes Core can validate durable records,
stored target data, delivery history, idempotency, token availability, and
event/proof relationships consistently.

Read-only decision surfaces are not sufficient for side effects. They can show
what is pending and explain consequences, but they cannot by themselves prove
that the publication is still fresh, still approved, still target-matched, still
unsent, and still authorized for one external target.

Publication approval and publication execution must remain separate:

- Approval records user/PM intent for a specific publication target.
- Dry-run checks readiness without posting.
- Publish execution creates one explicit external side effect.
- Proof/state commit remains a separate Augnes action unless explicitly
  instructed through existing proof/state routes.

PR #67 is evidence of one target-specific live GitHub PR comment adapter test.
It proved that one approved target could be posted once, replayed without a
duplicate, and recorded in the delivery ledger. It does not grant future
automatic posting permission, broad GitHub write authority, or permission to
bundle live posting into unrelated PRs.

PR #81 is evidence of the first target-specific live C5 publish test. It posted
one retained GitHub PR comment to `Aurna-code/augnes#81` under exact approval,
with comment id `4414928332` and URL
`https://github.com/Aurna-code/augnes/pull/81#issuecomment-4414928332`. It did
not authorize automatic posting, broad GitHub write authority, or additional
future live posts. Future live tests still require a fresh exact approval
packet.

## Authority Model

User:

- Remains the durable approval authority.
- Must explicitly approve the target-specific intent before any future
  `dry_run=false` publish execution.
- Decides whether completion proof or durable state changes should be recorded
  separately.

Augnes Core:

- Remains the source of truth and durable gate authority.
- Owns publication records, delivery ledger records, validation, event spine
  records, proof/state relationships, and the transition into side effects.
- Must validate every approve, dry-run, publish, retry, cancel, and
  acknowledgement transition before any future surface can display it as
  durable.

ChatGPT Apps:

- Remain a user-facing decision surface.
- May show read-only decision cards and, in a future separately scoped tool,
  collect user intent.
- Must route durable approval or write intent to Augnes Core validation.
- Must not become publication authority, approval authority, retry authority,
  proof authority, state authority, Codex execution authority, or GitHub
  mutation authority.

Codex:

- Remains the implementation and work execution control surface.
- May implement and verify future workflow PRs.
- Must not publish externally without explicit target-specific approval.
- Must not merge, override user approval, or turn implementation evidence into
  durable Augnes approval.

Cockpit:

- Remains an observability and agent coordination surface.
- May show gate state, publication state, delivery state, and the delivery
  ledger.
- Future write controls must be explicit, separately scoped, auditable, and
  Core-gated.
- Must not become hidden authority.

GitHub:

- Remains an external publication target and code history surface.
- Is not Augnes authority.
- GitHub comments are external side effects and must be idempotent, target
  specific, explicit, and auditable.

Developer Mode, MCP Inspector, Browser, and Chrome:

- Remain verification surfaces.
- May validate rendered app behavior, bridge behavior, and local runtime
  behavior.
- Must not be treated as durable approval, proof, state, or publication
  authority.

## Workflow State Model

Future implementation may use conceptual workflow states such as:

```text
preview_only
approval_requested
approved_for_target
publish_ready
publish_blocked
publish_in_progress
sent
failed
cancelled
acknowledged
```

State meanings:

- `preview_only`: A draft or summary can be read, but no durable approval has
  been requested or granted.
- `approval_requested`: A user/PM decision is needed for a specific target.
- `approved_for_target`: A durable approval intent exists for one stored
  publication and target.
- `publish_ready`: Core gates have passed for the current request shape.
- `publish_blocked`: One or more gates failed and no external side effect may
  occur.
- `publish_in_progress`: Core has accepted an execution attempt and is
  coordinating the side-effect transition.
- `sent`: The external side effect was completed and the delivery ledger
  records it.
- `failed`: The external side effect failed and the delivery ledger records an
  error.
- `cancelled`: The publication must not be executed unless a future explicit
  reopen design allows it.
- `acknowledged`: A user or surface has acknowledged a delivery outcome without
  changing the fact of delivery.

Boundary rules:

- Approval is not publication.
- Dry-run is not publication.
- Publication is one explicit external side effect.
- Replay must not create a duplicate side effect.
- `sent` does not imply durable Augnes state commit unless a separate existing
  proof/state route records that fact.
- A publication state must not be inferred from a ChatGPT answer, Cockpit panel,
  GitHub comment alone, Developer Mode observation, or Codex report.

## Gate Checks

Future publish execution must be blocked unless Augnes Core confirms all
required gates for the requested target and adapter:

- Publication status is approved for publish.
- Explicit user/PM approval exists for the specific target.
- Request `target_ref` matches the stored publication `target_ref`.
- `expected_target_surface` equals `github_pr_comment` for the GitHub PR
  comment adapter.
- `dry_run` is explicitly provided.
- `dry_run=false` is accepted only after approval and target confirmation.
- `idempotency_key` is required.
- Delivery row freshness is checked before execution.
- No duplicate delivery exists for the same publication, target, and
  `idempotency_key`.
- Token availability is checked at execution time.
- Credential resolution is separated from gate validation: Core decides whether
  a publish attempt is allowed, then the token provider resolves the outbound
  credential before adapter execution.
- `preview_body` is non-empty and sanitized before publish.
- `target_ref` format is valid for the target surface.
- Publication is not cancelled.
- Publication has not already been sent unless replay is idempotent.
- Replay returns the existing delivery result without posting.
- Publish cannot merge PRs, submit PR reviews, request reviewers, mutate PR
  labels, mutate PR titles, or mutate PR bodies.
- Publish cannot post to Discord or webhooks unless a separately scoped adapter
  and approval model exist.

Gate failures should return explicit blocking reasons. A future UI may show
those reasons, but the UI must not bypass them.

## Surface Responsibilities

### ChatGPT Apps

Future ChatGPT Apps slices may:

- Show read-only publication decision cards.
- Show target, status, latest delivery, and gate-state explanations derived
  from Core.
- Collect user intent only through a future separately scoped tool.
- Route durable approval/write intent to Core validation.

ChatGPT Apps must not:

- Silently approve, publish, retry, cancel, or acknowledge delivery.
- Record proof or commit/reject Augnes state.
- Execute Codex.
- Mutate GitHub.
- Treat a read-only decision card as approval.
- Convert ChatGPT thread text into durable approval.

### Cockpit

Future Cockpit slices may:

- Show gate state and delivery ledger state.
- Show blocked gate reasons and delivery errors.
- Show prior deliveries and replay/idempotency implications.
- Add explicit write controls only after Core routes exist and only in a
  separately scoped PR.

Cockpit must not:

- Become hidden approval or publish authority.
- Trigger side effects without Core validation.
- Hide external side-effect warnings behind generic action labels.

### Codex

Future Codex work may:

- Implement and verify small workflow PRs.
- Run local typechecks and docs sanity checks.
- Open PRs and update PR descriptions for repo review.

Codex must not:

- Publish externally without explicit target-specific approval.
- Merge PRs or submit approval reviews.
- Treat PR #67 as broad posting permission.
- Override user/PM approval with implementation judgment.

### Augnes Core

Future Augnes Core slices own:

- Approval request and approval grant/denial records.
- Gate validation.
- Publication status transitions.
- Delivery ledger writes.
- Event spine entries.
- Idempotency behavior.
- Side-effect transition coordination.

Core should expose derived read-only state for surfaces and keep durable writes
behind explicit, auditable routes.

### Verification Evidence Records

`verification_evidence_records` stores bounded local observations:

- command/check observations: `command_run`, `check_passed`, `check_failed`,
  and `check_skipped`
- replay observations: `replay_observed`
- duplicate-block observations: `duplicate_block_observed`

These records are read by Evidence Pack v0.1 to distinguish observed facts from
missing evidence gaps. Evidence Pack remains read-only and never creates these
records. Recording a replay or duplicate-block observation means the behavior
was explicitly observed elsewhere; the record creation route must not execute
replay or attempt a duplicate publish.

### GitHub

GitHub remains external target only:

- A GitHub PR comment is one external side effect.
- GitHub comments can be referenced as evidence.
- GitHub does not replace Augnes proof, state, event, publication, or delivery
  records.

## Audit, Event, and Proof Requirements

Future implementations should record auditable concepts such as:

```text
approval_requested
approval_granted
approval_denied
publish_dry_run_checked
publish_gate_passed
publish_gate_blocked
publication_sent
publication_failed
publication_acknowledged
```

Not all of these need to be implemented at once. They should align with the
existing coordination event spine, publication record, and delivery ledger
concepts.

Proof recording remains separate from preview, decision-card, approval, dry-run,
publish, retry, and acknowledgement flows unless explicitly instructed. A future
publish route may create a delivery/event record for publication behavior; it
must not also commit/reject state or record action proof unless that behavior is
separately scoped and approved.

## Failure and Retry Model

A failed publish attempt must record a failed delivery status and an
`error_message` suitable for review without exposing secrets.

Retry must be:

- Explicit.
- Separate from initial publish.
- Idempotency-aware.
- Core-gated.
- Target-specific.
- Never automatic.

Retry controls must show:

- Prior delivery status.
- Prior `target_ref`.
- Current requested `target_ref`.
- Idempotency key behavior.
- Whether replay would return an existing delivery or attempt a new side
  effect.
- A clear external side-effect warning.

Retry must not use a failed delivery as blanket permission to keep attempting
external posting.

## UX Requirements for Future Controls

Any future user-facing control that touches approval, dry-run readiness, publish,
retry, cancel, or acknowledgement must show:

- Exact `target_ref`.
- `target_surface`.
- Preview excerpt.
- Current publication status.
- Latest delivery status and `error_message`, if any.
- Clear side-effect warning.
- Required gate checks and current pass/block state.
- Text that approval is not publication.
- Text that publish creates one external GitHub comment.
- Text that replay must not duplicate.
- Text that no merge, review, label, title, or body mutation is allowed.

Controls should use action labels that name the specific transition. Generic
labels such as "Continue" or "Submit" are not sufficient at an external
side-effect boundary.

## Future Implementation Slices

Recommended slices:

- PR C1: Core approval intent model and approval request records only, with no
  publish execution. Status: implemented as durable approval request records
  and read/create APIs only.
- PR C2: ChatGPT Apps or Cockpit read-only gate-state renderer. Status:
  implemented as a derived Core summary API and read-only Cockpit panel.
- PR C3: Core-gated approve action route, with no publish execution. Status:
  implemented as a target-specific approval grant route backed by
  `publication_approval_decisions`.
- PR C4: Core-gated dry-run publish readiness route. Status: implemented as
  durable `publication_readiness_checks` and a dry-run readiness route.
- PR C5: Core-gated explicit publish action with the GitHub PR comment adapter,
  preserving PR #67 idempotency rules. Status: implemented at
  `POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment`;
  PR #78 did not execute live posting.
- PR C5 live-test decision: Status: complete via PR #79. The decision document
  is now a historical decision pattern and future approval template, not
  standing approval for additional live posts.
- PR C5 live test: Status: complete via PR #81. One approved live C5 publish
  posted exactly one retained GitHub PR comment to `Aurna-code/augnes#81`.
- PR C5 replay semantics fix: Status: complete via PR #82. Same-key
  sent/acknowledged replay returns HTTP 200 with `idempotent_replay=true` and
  `posted=false`; different-key duplicate and pending delivery conflicts remain
  blocked.
- PR C5 delivery external artifact persistence: Status: complete. Successful
  GitHub PR comment publish stores `external_artifact_id`,
  `external_artifact_url`, and `external_artifact_type=github_pr_comment` on the
  delivery row; same-key sent/acknowledged replay returns the persisted
  artifact fields without adapter execution.
- Evidence Pack v0.1: Status: complete. The pack is derived read-only data
  exposed through `GET /api/evidence-pack`; it does not publish, replay, call
  GitHub, call OpenAI, record proof, commit/reject state, mutate mailbox, or add
  ChatGPT App write tools.
- Next productization slice after Evidence Pack v0.1: session model, temporal
  interpretation hardening, ChatGPT Apps cross-session tools, Codex session
  adapter, Cockpit write-control design, GitHub App/token model, or retry design
  if needed.

Each implementation PR should restate expected versus actual impact, authority
boundaries, verification evidence, skipped checks, and whether any live external
posting was explicitly approved for one target.

## Remaining Non-Goals

The implemented C1-C5 slices and PR #81 live test do not add:

- App tools.
- Cockpit buttons.
- Retry routes.
- Proof recording.
- Mailbox status updates.
- State commit/reject behavior.
- unapproved, automatic, or additional GitHub posting.
- Discord/webhook posting.
- Auto-merge.
- PR review, label, title, or body mutation.
- Secret handling changes.
- OAuth/auth/hosted deployment semantics.
- Direct Codex orchestration.
- Autonomous Codex execution.
- Free-form agent chat.

## C1 Implementation Status

The C1 slice implements durable Core-side approval request records only:

- Approval requests can be created for an existing publication in the same
  scope.
- The request copies `target_surface`, `target_ref`, and `work_id` from the
  referenced publication at creation time.
- Approval requests can be listed and read.
- Request records include decision prompt text, side-effect summary text,
  conceptual gate checks, and authority-boundary reminders.

C1 does not add:

- Approval grant behavior.
- Approval denial behavior.
- Publication status changes.
- Dry-run readiness checks.
- Publish execution.
- Retry execution.
- Delivery ledger writes.
- GitHub adapter calls.
- Cockpit write controls.
- ChatGPT App intent tools.
- Proof recording.
- Mailbox status updates.
- State commit/reject behavior.
- Coordination event append behavior; event-spine wiring is deferred to a later
  explicit slice.

Approval request records are not approval grants. Creating a request means a
user/PM decision is being requested for a specific target; it does not approve
the publication and does not move the publication toward execution.

## C2 Implementation Status

The C2 slice implements read-only approval gate-state rendering:

- `GET /api/approval-gate-state/summary?scope=project:augnes` returns a
  bounded derived view over approval request records, publication drafts, and
  delivery ledger state.
- The Cockpit shows a read-only Approval Gate State panel with requested counts,
  ready-for-review counts, blocked counts, inactive counts, target references,
  publication status, gate reasons, safe next steps, and boundary text.
- Gate-state views are derived views, not sources of truth. Durable request
  records remain in `publication_approval_requests`; publication records and
  delivery rows remain their own Core records.
- Control Packet integration remains deferred to avoid changing that packet
  contract in the read-only renderer slice.

C2 does not add:

- Approval grant behavior.
- Approval denial behavior.
- Approval routes.
- Publish routes.
- Retry routes.
- Publication status changes.
- Dry-run readiness checks.
- Publish execution.
- Retry execution.
- Delivery ledger writes from gate-state reads.
- GitHub adapter calls.
- ChatGPT App intent tools.
- Cockpit write controls.
- Proof recording.
- Mailbox status updates.
- State commit/reject behavior.

Approval request records remain requests only. Gate-state rendering can help a
user inspect whether a request is target-matched and reviewable, but it does not
approve the request and does not move any publication toward execution.

## C3 Implementation Status

The C3 slice implements a Core-gated approve action route with no publish
execution:

- `POST /api/publication-approval-requests/{approval_request_id}/approve`
  validates one existing approval request in scope and records an approved
  decision for the stored target.
- `publication_approval_decisions` stores durable approval grants separately
  from `publication_approval_requests`.
- `GET /api/publication-approval-decisions?scope=project:augnes` lists decision
  records, and
  `GET /api/publication-approval-decisions/{approval_decision_id}?scope=project:augnes`
  reads one decision record.
- The approve route requires the request status to be `requested`, the linked
  publication to exist in the same scope, the request target to match the stored
  publication target, publication status to be `draft`, no sent delivery for the
  publication target, and no existing approved decision for the request.
- On success, the route inserts one approved decision row and transitions the
  linked publication to `approved` with `approved_by = decided_by`.
- A duplicate approval attempt returns a conflict instead of creating another
  decision or another side effect.
- The gate-state summary and read-only Cockpit panel can show
  `approved_for_future_publish_readiness` when a matching approval decision
  exists.

C3 does not add:

- Dry-run readiness checks.
- Publish execution.
- Retry execution.
- Delivery ledger writes.
- `publication_sent` or `publication_failed` events.
- GitHub adapter calls.
- `GITHUB_TOKEN` usage.
- GitHub or Discord posting.
- Cockpit write controls.
- ChatGPT App publish, approval, or retry tools.
- Proof recording.
- Mailbox status updates.
- State commit/reject behavior.
- Codex execution.

Approval grant is still not publication. It grants approval for the stored
target only. Future publish still requires explicit target approval, approved
publication status, `dry_run=false`, stored `target_ref`, required
`idempotency_key`, delivery freshness, token availability, and
replay/no-duplicate evidence. PR #67 does not authorize automatic posting.

The C4 dry-run readiness slice remains separate from approval grant and from
publish execution.

## C4 Implementation Status

The C4 slice implements a Core-gated dry-run publish readiness route with no
publish execution:

- `POST /api/publication-approval-decisions/{approval_decision_id}/readiness/dry-run`
  validates one approved decision, its approval request, its linked
  publication, and the stored publication target.
- `publication_readiness_checks` stores durable readiness evidence separately
  from approval decisions and delivery rows.
- `GET /api/publication-readiness-checks?scope=project:augnes` lists readiness
  records, and
  `GET /api/publication-readiness-checks/{readiness_check_id}?scope=project:augnes`
  reads one readiness record.
- The readiness route checks approval decision status, approval request status,
  publication status, `approved_by`, target matching, `github_pr_comment`
  target support, `owner/repo#pull_number` target format, non-empty preview
  body, absence of sent or pending delivery rows for the publication target,
  future idempotency-key requirement, and future `dry_run=false` publish-route
  separation.
- On success, the route inserts a readiness check with status `ready`. If Core
  gates fail for an otherwise valid approval decision, it inserts status
  `blocked` with explicit blocked reasons.
- The gate-state summary and read-only Cockpit panel can show
  `dry_run_ready_for_future_publish` or `dry_run_blocked` when latest readiness
  evidence exists.

C4 does not add:

- Publish execution.
- Retry execution.
- Delivery ledger writes.
- `publication_sent` or `publication_failed` events.
- GitHub adapter calls.
- `GITHUB_TOKEN` usage.
- GitHub or Discord posting.
- Cockpit write controls.
- ChatGPT App publish, approval, dry-run, or retry tools.
- Proof recording.
- Mailbox status updates.
- State commit/reject behavior.
- Codex execution.

Dry-run readiness is not publication. It records readiness evidence for the
stored target only.

## C5 Implementation Status

The C5 slice implements an explicit Core-gated GitHub PR comment publish route:

- `POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment`
  is the approved future publish path.
- `dry_run=true` validates the Core gates and returns a publish readiness
  preview with `would_publish=true`, target evidence, `idempotency_key`,
  gate checks, blocked reasons, boundaries, and readiness freshness.
- `dry_run=true` never calls the GitHub adapter, never requires or uses
  `GITHUB_TOKEN` or any GitHub publish token, never creates delivery rows,
  never updates publication status,
  never creates `publication_sent` or `publication_failed` events, never records
  proof, never updates mailbox status, never commits/rejects state, and never
  posts externally.
- `dry_run=false` requires a fresh ready readiness check, approved decision,
  requested approval request, approved publication, exact target match, explicit
  target approval fields, required `idempotency_key`, token availability from
  the internal GitHub token provider before delivery rows or adapter execution,
  and replay/no-duplicate gates.
- Actual publish posts one GitHub PR comment only. It does not merge PRs,
  submit PR reviews, request reviewers, mutate labels/titles/bodies, post to
  Discord or webhooks, record proof, update mailbox status, commit/reject
  state, or execute Codex.
- The legacy
  `POST /api/publications/{publication_id}/publish/github-pr-comment` route is
  disabled so it cannot bypass C1-C4 gates.

The C5 implementation PR #78 did not execute `dry_run=false`, did not post a
live GitHub comment, and did not use `GITHUB_TOKEN`. PR #81 separately executed
one approved live C5 publish to `Aurna-code/augnes#81` with idempotency key
`augnes-c5-live-test-pr-81-v1`, GitHub comment id `4414928332`, and URL
`https://github.com/Aurna-code/augnes/pull/81#issuecomment-4414928332`.
Delivery status and publication status were `sent`; exactly one matching
comment was observed; no manual GitHub UI posting, PR merge/review/label/title/
body mutation, proof recording, mailbox status update, or Augnes state mutation
occurred.

PR #82 fixed same-key replay semantics discovered by the PR #81 evidence:
same-key sent/acknowledged replay now returns HTTP 200 with
`idempotent_replay=true` and `posted=false`; different-key duplicate remains
HTTP 409; pending delivery remains HTTP 409; `dry_run=true` with an existing
sent delivery remains blocked. PR #82 did not post to GitHub.

C5 delivery external artifact persistence now stores the GitHub PR comment
artifact on the sent delivery row as `external_artifact_id`,
`external_artifact_url`, and `external_artifact_type=github_pr_comment`.
Same-key sent/acknowledged replay returns the persisted comment id/URL when
available and preserves nulls for older delivery rows.

GitHub token management v0.1 now documents and implements the current
credential authority boundary. C5 uses `resolveGitHubPublishToken()` from
`lib/github-token-provider.ts`; the only implemented provider is env
`GITHUB_TOKEN`. Token availability remains separate from approval/readiness,
and same-key sent/acknowledged replay returns before token resolution. Future
GitHub App installation-token support is design-only in
`docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1.md` and must be implemented in a
separately scoped PR. The future config boundary in
`docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md` further specifies
reserved config names, private key handling, RS256 JWT rules, installation
token expiry, repository allowlist matching, permission minimization, and
evidence redaction policy. The config reader/validator can validate future
GitHub App config shape, but it does not change C5 behavior.
The offline RS256 JWT fixture now verifies fake-key signing, required
`iat`/`exp`/`iss` claims, and the 10-minute expiry ceiling without calling
GitHub or creating installation tokens. It is not publication proof and does
not authorize live publish.
The target/allowlist policy helper now verifies future GitHub App
repository/permission scope locally before exchange. It does not call GitHub,
create installation tokens, change C5 gates, or authorize live publish.
The exchange boundary helper now verifies request/response shape with injected
fake fetch only. It does not perform live GitHub exchange, integrate with C5,
create delivery rows, or authorize live publish.
`docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1_CLOSEOUT.md` closes this foundation
line and moves live exchange/provider integration outside v0.1.

`docs/AUGNES_C5_LIVE_GITHUB_PUBLISH_TEST_DECISION.md` preserves the first
live-test decision pattern and historical PR #81 decision packet while keeping
the approval template for future live tests. It does not approve a future
target, run `dry_run=false`, use `GITHUB_TOKEN`, create delivery rows, or post
to GitHub.

The next likely decision is which productization slice to take after C5 live
evidence: session model, temporal interpretation, delivery external artifact
persistence, ChatGPT Apps cross-session tools, Codex session adapter, Cockpit
write-control design, GitHub App/token model, or retry design if needed. Future
live tests still require a fresh exact approval packet naming the target, body,
idempotency key, token use, and retain/delete decision.

## Original Design-Only Verification Boundary

Browser/Cockpit verification was not required for the original workflow design
PR because it changed only docs and added no UI or runtime behavior.

ChatGPT Developer Mode and MCP verification were not required for the original
workflow design PR because it changed no app tool, bridge behavior, widget
behavior, or MCP contract.

Additional live GitHub posting remains prohibited for approval workflow slices
unless a future user/PM explicitly approves one specific target. A GitHub
publish token is not required for C1, C2, C3, C4, C5 dry-run preview
verification, or same-key sent/acknowledged replay. The legacy
`POST /api/publications/{publication_id}/publish/github-pr-comment` route is
disabled and must not be used as a publish bypass.
