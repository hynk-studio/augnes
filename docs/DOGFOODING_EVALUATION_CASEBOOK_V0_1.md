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

## Initial Case Entries

### Case PR184: Raw Episode Capture And Codex Handoff Docs

This case entry is a docs-only, non-authoritative review aid over PR-linked raw
anchors. It records what can be checked from repository and PR anchors, and it
records missing details as gaps rather than reconstructing them.

- case id: PR184-raw-episode-codex-handoff-docs
- linked dogfooding episode id: None yet. This case predates a persisted episode
  log, so the missing episode id is recorded as a gap, not a failure.
- PR / branch / commit refs:
  - PR URL: `https://github.com/Aurna-code/augnes/pull/184`
  - branch: `docs/raw-episode-codex-handoff-v0-1`
  - head commit: `f4e3dff42e4a21b0c99b1ff4bbd778e64a8f2c26`
  - merge commit: `58e7f8a60ec9b7362b874e1ed0d342b6d2aaa48d`
  - merged at: `2026-05-23T04:09:31Z`
- raw episode anchors:
  - PR #184 URL: `https://github.com/Aurna-code/augnes/pull/184`
  - PR body summary: added docs-only raw episode capture guidance, Codex handoff
    template, dogfooding episode log format, and latest-docs index pointers
    without expanding the Active set.
  - final changed files: `docs/RAW_EPISODE_CAPTURE_V0_1.md`,
    `docs/CODEX_HANDOFF_V0_1.md`, `docs/DOGFOODING_EPISODE_LOG_V0_1.md`,
    `docs/00_INDEX_LATEST.md`.
  - test/check list from PR body: execution lanes, authority invariants,
    Perspective snapshot, Cockpit Perspective snapshot, Perspective quality,
    research diagnostics boundaries, Sidecar e_t fixture boundaries, Sidecar e_t
    runtime boundaries, typecheck, build, GitHub App target policy, Codex record
    evidence helper, and `git diff --check`.
  - ChatGPT review recommendation: external conversation review is not
    repo-anchored in the collected PR metadata; record as a gap unless a later
    PR comment or review anchor is identified.
  - user merge decision: PR #184 is confirmed merged by GitHub metadata.
- baseline context used: Review reconstruction only, not proof. The likely
  baseline context was PR #183 dogfooding research direction, the PR #184 task
  request, current repo docs, and the Codex prompt/handoff. The exact Codex
  prompt text is external conversation context and not repo-anchored here.
- Augnes-assisted context used: The work used the PR #183 dogfooding direction /
  Perspective continuity research-note framing plus the requested
  raw-episode/handoff/episode-log direction. No runtime PerspectiveSnapshot
  output is claimed.
- task goal: Add docs-only raw episode capture, Codex handoff, and dogfooding
  episode log formats.
- handoff used: Codex received a structured prompt requiring docs-only scope,
  public-safe wording, expected/forbidden files, full checks, PR body, and final
  report. The exact prompt text is not repo-anchored in this case entry and is
  recorded as a gap.
- changed files:
  - `docs/RAW_EPISODE_CAPTURE_V0_1.md`
  - `docs/CODEX_HANDOFF_V0_1.md`
  - `docs/DOGFOODING_EPISODE_LOG_V0_1.md`
  - `docs/00_INDEX_LATEST.md`
- checks requested:
  - `npm run smoke:execution-lanes`
  - `npm run smoke:authority-invariants`
  - `npm run smoke:perspective-snapshot`
  - `npm run smoke:cockpit-perspective-snapshot`
  - `npm run smoke:perspective-quality`
  - `npm run smoke:research-diagnostics-boundaries`
  - `npm run smoke:sidecar-et-fixture-boundaries`
  - `npm run smoke:sidecar-et-runtime-boundaries`
  - `npm run typecheck`
  - `npm run build`
  - `npm run smoke:github-app-target-policy`
  - `npm run smoke:codex-record-evidence-helper`
  - `git diff --check`
- checks run: According to the PR #184 body, all requested checks passed. This
  is PR-body reported status, not an independent re-run by this casebook entry.
- skipped checks: None reported in the PR #184 body.
- observed result: PR #184 added docs-only raw episode capture, Codex handoff,
  and dogfooding episode log templates, with index pointers and no runtime
  changes.
- context preserved:
  - raw anchors before summaries
  - docs-only / non-authoritative boundary
  - Codex handoff fields
  - PR-centered workflow
  - negative/partial cases as valid future material
  - Sidecar e_t placeholder / no runtime computation boundary
- context lost or ambiguous:
  - no persisted episode log existed yet
  - exact external conversation prompt/review may not be repo-anchored
  - untracked screenshot warning existed but was not committed
  - casebook criteria did not exist until PR #185
- drift / stale-context observation: No runtime drift detection is claimed.
  Review concern was documentation drift / summary-only-memory risk, addressed
  by raw anchor guidance.
- repair action, if any: PR #184 repaired the lack of raw episode / handoff /
  episode-log templates by adding docs-only guidance. This does not claim runtime
  repair behavior.
- outcome label: merged, useful, partial-success-with-gaps. Useful because it
  created the raw-anchor/handoff template base; partial because this case still
  lacks a persisted episode log and repo-anchored exact conversation
  prompt/review anchors.
- follow-up question: Should future casebook entries stay inside the single
  casebook doc or move to PR-linked records after the first few examples?
- next suggested goal: Perspective continuity smoke design,
  documentation-boundary-first. Another valid goal is a second dogfooding case
  entry if more examples are needed before smoke design.
- gaps / missing anchors:
  - no persisted dogfooding episode id for PR #184
  - no repo-anchored exact Codex prompt text
  - no repo-anchored external conversation review text

Boundary Note: This case entry is a review aid over PR-linked raw anchors. It is
not proof, evidence status, readiness, benchmark result, score, proposal scoring,
commit/reject input, Gate/SRF input, or source of truth.

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
