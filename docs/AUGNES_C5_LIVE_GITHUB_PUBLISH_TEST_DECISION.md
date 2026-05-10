# Augnes C5 Live GitHub Publish Test Decision Pattern

This document preserves the first approved C5 live-test decision pattern and
the historical PR #81 decision packet. It also keeps the approval packet
template for any future live C5 GitHub PR comment publish test.

## Purpose

C5 is implemented at:

```text
POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment
```

The C5 route has been verified with `dry_run=true` previews and blocked
validation checks. PR #78 implemented the `dry_run=false` live path without
executing live posting in that implementation PR. PR #81 later fulfilled the
first approved live C5 test with one retained GitHub PR comment. PR #82 fixed
same-key sent/acknowledged replay semantics discovered by that PR #81 evidence.

A live C5 test creates one real GitHub PR comment. That external side effect
requires explicit user/PM approval for one exact target before any
`dry_run=false` request is made. PR #81 satisfied that requirement only for its
own exact target.

PR #67 remains historical evidence for the lower-level adapter path. PR #81
remains historical evidence for the Core-gated C5 path. Neither authorizes a
future live post, automatic posting, broad GitHub write authority, or bundled
posting in an unrelated PR.

## Historical PR #81 Decision Packet

PR #81 fulfilled the first approved live C5 test:

- Target: `Aurna-code/augnes#81`.
- Idempotency key: `augnes-c5-live-test-pr-81-v1`.
- GitHub comment id: `4414928332`.
- GitHub comment URL: `https://github.com/Aurna-code/augnes/pull/81#issuecomment-4414928332`.
- Delivery status: `sent`.
- Publication status: `sent`.
- Exactly one matching comment was observed.
- No manual GitHub UI posting occurred.
- No merge/review/label/title/body mutation occurred.
- No proof recording, mailbox status update, or Augnes state mutation occurred.

PR #82 fixed same-key replay semantics after the PR #81 live test:

- Same-key sent/acknowledged replay returns HTTP 200 with
  `idempotent_replay=true` and `posted=false`.
- Different-key duplicate remains HTTP 409.
- Pending delivery remains HTTP 409.
- `dry_run=true` with an existing sent delivery remains blocked.
- No live GitHub posting occurred in PR #82.

## Current Authority Boundary

- User/PM must explicitly approve one exact target before `dry_run=false`.
- Augnes Core gates must pass before publication.
- `dry_run=true` is preview only and creates no external side effect.
- `dry_run=false` is the only actual C5 publish path.
- `GITHUB_TOKEN` availability is required only for actual publish.
- Replay must not duplicate an existing delivery or GitHub comment.
- A new `idempotency_key` must not create a second comment for the same
  publication target after a sent or acknowledged delivery exists.
- C5 publish may post one GitHub PR comment only.
- C5 publish must not merge PRs, submit PR reviews, request reviewers, mutate
  labels, mutate PR titles, mutate PR bodies, post to Discord or webhooks,
  record proof, update mailbox status, commit/reject Augnes state, or execute
  Codex.

## Candidate Future Live-Test Target

No target is approved by this document.

Future recommended candidate:

```text
Aurna-code/augnes#<LIVE_TEST_PR_NUMBER>
```

The recommended candidate is the future live-test PR itself, opened separately
after the user/PM decides a new live test is needed. A self-targeted live-test
PR is self-contained, auditable, low ambiguity, and easy to retain as evidence.

The exact target must be filled in only after the PR number exists and the
user/PM explicitly approves it.

## Proposed Future Live-Test Comment Body

Use this exact body unless the future approval packet explicitly changes it:

```text
Augnes C5 live publish test.

This comment was posted through the Core-gated C5 GitHub PR comment publish route after explicit target approval.

Scope:
- target: <OWNER/REPO#PR_NUMBER>
- idempotency_key: <EXACT_KEY>
- dry_run=false
- approval/request/readiness gates passed

This is a test comment and should be retained as evidence unless the user/PM explicitly requests deletion.
```

The final comment body must not include secrets, local paths, tunnel URLs,
screenshots, or local-only artifact references.

## Required Explicit Approval Packet For Future Live Tests

Any later live-test PR must not run `dry_run=false` until the user/PM explicitly
approves all fields below:

```yaml
approved_target_surface: github_pr_comment
approved_target_ref: Aurna-code/augnes#<PR_NUMBER>
publication_preview_body: |
  Augnes C5 live publish test.

  This comment was posted through the Core-gated C5 GitHub PR comment publish route after explicit target approval.

  Scope:
  - target: Aurna-code/augnes#<PR_NUMBER>
  - idempotency_key: <EXACT_KEY>
  - dry_run=false
  - approval/request/readiness gates passed

  This is a test comment and should be retained as evidence unless the user/PM explicitly requests deletion.
idempotency_key: <EXACT_KEY>
dry_run_false_allowed: one attempt only
github_token_use_allowed: this target only
retain_or_delete_test_comment: retain unless user/PM explicitly requests deletion
replay_no_duplicate_verification_required: true
forbidden_actions:
  - merge PR
  - submit PR review
  - request reviewers
  - mutate labels
  - mutate PR title
  - mutate PR body
  - post to Discord or webhooks
  - record proof
  - update mailbox status
  - commit or reject Augnes state
  - execute Codex
```

Approval must name the exact target and exact `idempotency_key`. Approval for a
template, placeholder, different PR number, different repository, or general
future posting is not sufficient.

## Proposed Future Live-Test Sequence

These steps are documentation only. Do not execute them without a new exact
approval packet.

1. Confirm the exact user/PM approval packet for one target.
2. Start a local runtime with the approved `GITHUB_TOKEN` available only for
   the approved target.
3. Create a publication fixture with the exact approved target and exact
   approved comment body.
4. Create a publication approval request.
5. Approve the request through the C3 approve route.
6. Run C4 dry-run readiness.
7. Run C5 `dry_run=true` preview and record the preview evidence.
8. Run C5 `dry_run=false` once, only after the exact approval packet is present.
9. Verify one delivery row exists.
10. Verify publication status is `sent`.
11. Verify one GitHub comment URL and comment id.
12. Replay the same `idempotency_key` and verify no duplicate comment.
13. Verify a different `idempotency_key` is blocked for the same publication
    target after the sent delivery exists.
14. Record PR body evidence.
15. Do not record proof unless separately instructed.

## Failure Handling

- If token availability fails before adapter execution, C5 must not create a
  delivery row.
- If the GitHub API fails after delivery creation, the delivery should be marked
  `failed` and no retry should happen automatically.
- Retry remains separately scoped.
- A failed live test does not authorize repeated attempts.
- A new `idempotency_key` is not a retry authorization.

## Non-Goals For This Pattern Document

This pattern document does not:

- run `dry_run=false`
- use `GITHUB_TOKEN`
- post to GitHub
- create delivery rows
- add ChatGPT App tools
- add Cockpit buttons
- add a retry route
- record proof
- update mailbox status
- commit/reject Augnes state
- post to Discord or webhooks
- mutate PR merge, review, label, title, or body state, except for normal PR
  body updates performed by Codex while opening this documentation PR

## Decision Needed For Future Live Tests

Any future live test requires user/PM judgment:

```text
Should Augnes run another live C5 GitHub PR comment publish test, and if so,
what exact target, exact idempotency_key, exact comment body, token scope, and
retain/delete decision are approved?
```

Without that explicit approval packet, another live C5 publish remains
unapproved. PR #81 does not authorize broad or automatic future posting.
