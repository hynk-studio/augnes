# Augnes C5 Live GitHub Publish Test Decision

This document prepares, but does not approve or execute, a future live C5
GitHub PR comment publish test.

## Purpose

C5 is implemented at:

```text
POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment
```

The C5 route has been verified with `dry_run=true` previews and blocked
validation checks. The `dry_run=false` live path exists, but live posting
remains unverified after C5.

A live C5 test would create one real GitHub PR comment. That external side
effect requires explicit user/PM approval for one exact target before any
`dry_run=false` request is made.

PR #67 remains historical evidence only. It proved one earlier approved live
adapter test and replay behavior, but it does not authorize this future live
post, automatic posting, broad GitHub write authority, or bundled posting in an
unrelated PR.

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

## Candidate Live-Test Target

No target is approved by this document.

Recommended candidate:

```text
Aurna-code/augnes#<LIVE_TEST_PR_NUMBER>
```

The recommended candidate is the future live-test PR itself, opened separately
after this decision PR is reviewed and merged. A self-targeted live-test PR is
self-contained, auditable, low ambiguity, and easy to retain as evidence.

The exact target must be filled in only after the PR number exists and the
user/PM explicitly approves it.

## Proposed Live-Test Comment Body

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

## Required Explicit Approval Packet

A later live-test PR must not run `dry_run=false` until the user/PM explicitly
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

## Proposed Live-Test Sequence For A Later PR

These steps are documentation only. Do not execute them in this decision PR.

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

## Non-Goals

This decision PR does not:

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

## Decision Needed

The next step requires user/PM judgment:

```text
Should Augnes run one live C5 GitHub PR comment publish test, and if so, what
exact target, exact idempotency_key, exact comment body, token scope, and
retain/delete decision are approved?
```

Without that explicit approval packet, live C5 publish remains unapproved.
