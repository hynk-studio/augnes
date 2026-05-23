# Raw Episode Capture v0.1

## Status

- raw-capture-note-only
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

Preserve raw development anchors before summaries so future review does not rely
on summary-only memory.

This note supports future human review, Codex handoff analysis, and dogfooding
evaluation. It is research/evaluation guidance only and is not runtime logging
behavior.

## Raw Episode Anchor

A raw episode anchor is a preserved reference or excerpt from the actual
development episode before interpretation or summary.

Raw anchors may point to source material rather than copying it wholesale. The
goal is to keep later review close to what happened during the episode.

## Recommended Raw Anchors

- original user request or task prompt
- relevant branch / PR / commit refs when available
- relevant committed project state or docs pointers
- Codex handoff text
- Codex changed files
- commands and checks run
- skipped checks
- failures / blockers
- generated churn restored
- reviewer observations
- final accepted / rejected / partial result
- follow-up questions
- next suggested goal

## Summary Boundary

Summaries are review aids over raw anchors. They must not replace raw anchors.

Summaries are not proof, evidence status, readiness, proposal scoring,
commit/reject input, Gate/SRF input, or source of truth.

## Missing Anchor Handling

Missing anchors should be recorded as gaps, not fabricated.

Gaps should be useful for future review. A useful gap note names what is missing,
why it matters if known, and whether the absence affected handoff, review, or
next-goal selection.

## Non-Goals

- no runtime logging implementation
- no schema change
- no evidence/proof creation
- no production-readiness claim
- no autonomous-capability claim
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no QP evidence
- no z_t commit
- no Sidecar e_t runtime computation
