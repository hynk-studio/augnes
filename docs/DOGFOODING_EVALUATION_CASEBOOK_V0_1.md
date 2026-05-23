# Dogfooding Evaluation Casebook v0.1

## Status

- casebook-template-only
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no evidence/proof authority
- no production-readiness claim
- no autonomous-capability claim

## Purpose

This template organizes dogfooding cases for later review.

It is meant to preserve raw anchors, review observations, gaps, and next-goal
implications. It is not proof, evidence status, readiness, a benchmark, a score
system, or runtime behavior.

## Case Record Template

- case id
- linked dogfooding episode id
- PR / branch / commit refs when available
- raw episode anchors
- baseline context used
- Augnes-assisted context used
- task goal
- handoff used
- changed files
- checks requested
- checks run
- skipped checks
- observed result
- context preserved
- context lost or ambiguous
- drift / stale-context observation
- repair action, if any
- outcome label
- follow-up question
- next suggested goal
- gaps / missing anchors

## Case Families

These are case families, not proof categories.

- stable continuity
- minor revision
- drift detected
- repair needed
- failed handoff
- ambiguous context
- misleading summary
- wrong next task
- over-preserved perspective
- premature transition
- blocked by missing source refs
- partial success with gaps
- merged but review gaps remained
- superseded by later decision

## Negative and Partial Case Handling

Negative, partial, ambiguous, and failed cases should be preserved.

A failed or misleading episode can be more useful than a clean success. Cases
should not be sanitized into success narratives. Missing anchors should not be
invented to make a case look complete.

## Summary Boundary

Case summaries are review aids over raw anchors.

Case summaries are not source of truth. Casebook entries do not create proof,
evidence status, readiness, or evaluation authority.

## Optional Empty Template

This plain text template is documentation only. It is not a schema and does not
define required machine-readable fields.

- case id:
- linked dogfooding episode id:
- PR / branch / commit refs:
- raw episode anchors:
- baseline context used:
- Augnes-assisted context used:
- task goal:
- handoff used:
- changed files:
- checks requested:
- checks run:
- skipped checks:
- observed result:
- context preserved:
- context lost or ambiguous:
- drift / stale-context observation:
- repair action, if any:
- outcome label:
- follow-up question:
- next suggested goal:
- gaps / missing anchors:

## Relationship To Existing Docs

This casebook template relates to:

- `DOGFOODING_EVALUATION_CRITERIA_V0_1.md`
- `DOGFOODING_EPISODE_LOG_V0_1.md`
- `RAW_EPISODE_CAPTURE_V0_1.md`
- `CODEX_HANDOFF_V0_1.md`

Casebook entries should point back to raw episode anchors when available.

## Non-Goals

- no benchmark
- no KPI
- no score system
- no runtime evaluation
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
- no PerspectiveSnapshot response-shape change
