# Dogfooding Episode Log v0.1

## Status

- episode-log-template-only
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no evidence/proof authority
- no production-readiness claim

## Purpose

Record Augnes development dogfooding episodes for later review.

This format preserves raw anchors and summaries separately. It supports future
casebook and evaluation design, but it is research/evaluation guidance only and
does not create runtime behavior, evidence/proof authority, or evaluation
authority.

## Repo-Local Report Paths

Independent dogfood runs should keep generated notes in bounded repo-local
paths so another evaluator can reproduce the trail from the repository:

- `reports/dogfood/<date>-<run-id>.md`
- `reports/dogfood/<date>-<index-or-summary>.md`
- `backlog/augnes-friction-backlog.md`
- `backlog/augnes-improvement-proposals.md`

Runtime proof writes, if any, should use an explicit temp database path and
must not require changes to app code, DB schema, API routes, helper behavior,
or Cockpit UI.

## Episode Log Fields

- episode id
- date / rough time window
- user task
- initial context
- raw episode anchors
- Codex handoff used
- changed files
- tests requested
- tests run
- skipped tests
- failures / blockers
- generated churn restored
- PR URL / commit SHA
- ChatGPT review result
- user merge decision
- what context was preserved
- what context was lost or ambiguous
- drift / stale-context observations
- repair action, if any
- follow-up questions
- next suggested goal

## Outcome Categories

- success
- partial
- blocked
- rejected
- needs repair
- merged
- superseded

## Negative and Partial Cases

Negative, partial, ambiguous, and failed cases are valuable. They can show where
handoff, review, context preservation, or next-goal selection needs repair.

Successful PRs should not be treated as the only dogfooding material, and this
log format does not turn any episode into dogfooding evidence by itself.

## Summary Boundary

Episode summaries are review aids, not proof or source of truth.

Missing data should be recorded as gaps, not invented.

## Non-Goals

- no evaluation score
- no proof
- no evidence status
- no readiness claim
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no source-of-truth claim
- no production-readiness claim
- no autonomous-agent claim
- no runtime Sidecar e_t computation
