# Perspective Codex Former Constellation Fixture Preview v0.1

Conclusion: PASS with follow-up

## Purpose

This document defines the first deterministic fixture preview for the Codex Former constellation projection. It exists to help future Constellation Preview work understand the read-only projection output before any UI is implemented.

The fixture preview is data-level material only. It exercises sanitized PASS with follow-up and BLOCKED local inputs through the existing projection builder and commits the resulting review-only JSON artifacts.

## Why Follows PR #499

PR #499 added the read-only Codex Former constellation projection contract and recommended the next PR: Add Codex Former constellation projection fixture preview. This preview follows that recommendation by using the PR #499 builder directly, without changing projection behavior.

## Current Projection Contract Dependency

The fixture preview depends on:

- `lib/perspective-ingest/perspective-codex-former-constellation-projection.ts`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md`
- `reports/2026-06-10-perspective-codex-former-constellation-projection.md`
- `scripts/smoke-perspective-codex-former-constellation-projection.mjs`

The projection contract remains the authority for node kinds, edge relations, statuses, authority values, privacy fields, and false authority flags.

## Generated Fixture Artifacts

The fixture generator writes stable, pretty-printed JSON artifacts:

- `reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-blocked.json`

Each artifact includes:

- `projection_version`
- `projection_kind`
- `source`
- `nodes`
- `edges`
- `status_summary`
- `warning_summary`
- `authority_summary`
- `privacy`
- `authority_flags`

## PASS with follow-up Fixture Explanation

The PASS with follow-up fixture represents a bounded source input file with matching metadata, exactly one returned candidate, non-committed candidate authority, needs_review validation status, a visible pointer warning, source PR references, changed-file references, and one recommended next action summary.

Expected preview qualities:

- `overall_status` is `pass_with_follow_up`.
- `review_candidate`, `worker_guidance`, `next_action`, and `warning` nodes exist.
- The candidate remains `non_committed`.
- `authority_summary.review_only` is `true`.
- No `accepted_future_only` status or authority is emitted.
- No accepted state, proof/evidence/readiness, provider/model call, Codex SDK call, DB write, GitHub mutation, UI implementation, or Core decision flag is set.

## BLOCKED Fixture Explanation

The BLOCKED fixture represents a bounded source input file where validation blocks review use because metadata does not match and multiple candidate drafts were returned.

Expected preview qualities:

- `overall_status` is `blocked`.
- `validation_summary` and warning/blocking nodes exist.
- At least one `blocked_by` edge exists.
- No `review_candidate`, `worker_guidance`, or usable `next_action` node is emitted.
- No `accepted_future_only` status or authority is emitted.
- No accepted state, proof/evidence/readiness, provider/model call, Codex SDK call, DB write, GitHub mutation, UI implementation, or Core decision flag is set.

## Node/Edge Readability Goals

The preview fixtures should make graph readability testable before a UI exists:

- Node count stays within a small bounded range.
- Edge count stays within a small bounded range.
- Every node has a compact title, status, authority value, and at most two `primary_badges`.
- Every edge references existing node ids.
- Every edge relation comes from the PR #499 projection taxonomy.
- The PASS with follow-up graph includes warning material without becoming blocked.
- The BLOCKED graph stops before review candidate and worker guidance material.

## Authority Boundary

This fixture preview is read-only and deterministic. It only derives projection artifacts from local sanitized fixture inputs and the existing projection builder.

It does not create accepted Augnes state, proof/evidence/readiness records, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, UI, routes, runtime browser surfaces, approvals, merges, deploys, or Core decisions.

Projection artifacts are review-only preview data. They are not accepted-state automation.

## Privacy Boundary

The fixtures use bounded summaries only and do not include raw private/source/provider payload examples. Public docs, reports, and generated fixture JSON must not echo raw unsafe/private marker literals.

The generated projection privacy fields must keep:

- `raw_payloads_included: false`
- `bounded_summaries_only: true`

## Display-Density Implications For Future UI

The fixture artifacts are intended to help future UI work validate display density before rendering a visual graph:

- Default node labels should use title, status, and at most two badges.
- Warning and blocked material should be visible without turning every authority flag into default text.
- Detail-drawer candidates should include hashes, provenance refs, changed-file refs, warning summaries, blocked reasons, and authority flags.
- PASS with follow-up should look reviewable but non-committed.
- BLOCKED should look stopped and unusable for candidate review.

## What This Does Not Do

This does not implement a UI, route, browser-visible surface, runtime adapter, DB write, provider/model integration, Codex SDK integration, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness record, approval, merge, deploy, or Core decision.

Browser/computer-use validation is intentionally skipped for this slice because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

## Recommended Next PR

Add read-only Codex Former constellation preview data adapter.
