# Augnes Dogfooding Research Direction v0.1

## Status

- repo-local research direction
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no evaluation authority
- no production-readiness claim

## Public Framing

Augnes uses its own development work as the first dogfooding and evaluation
context for project continuity across sessions, tools, and reviews.

This framing is research and evaluation guidance only. It does not claim that
planning, Codex handoff, PR review, next-task selection, or detection of stale
or misaligned project context are improved today.

## Research Question

Whether raw development episode records, committed project state, and read-only
perspective summaries help human reviewers and Codex handoffs keep context
accurate over time.

## Track A: Dogfooding / Research Loop

Track A records actual Augnes development episodes as research material. It
should include successful, negative, partial, and failed cases so reviewers can
see where context was preserved, lost, repaired, or left unresolved.

Track A records are inputs for human review and future research design. They are
not proof, readiness evidence, proposal scores, Gate/SRF inputs, or commit/reject
inputs.

## Track B: Product / Implementation

Track B builds docs, templates, read models, and future smoke designs needed to
support Track A.

Track B may describe future implementation work, but this document does not
implement that work and does not create runtime, schema, implementation,
diagnostic, or evaluation authority.

## Raw Episode First

Dogfooding records should preserve raw episode anchors before summaries. A raw
episode anchor may include the task request, relevant committed project state,
commands or checks run, observed failures, skipped checks, review comments,
handoff notes, and the final state of the work.

Summaries should be treated as review aids over those anchors, not replacements
for them.

## Non-Interference With Future Research

This direction is not a final ontology, not a score system, not a benchmark, not
schema authority, not runtime implementation, and must not block future
diagnostic or research work.

Future diagnostics, evaluation designs, or smoke tests require separate design,
implementation, review, and approval before they can affect runtime behavior or
project authority.

## Out of Scope

Broader theoretical claims about cognition or autonomous agency are out of scope
for this public research direction.

## Non-Goals

- no proof
- no evidence status
- no readiness claim
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no QP evidence
- no z_t commit
- no runtime Sidecar e_t computation
- no source-of-truth claim
- no production-readiness claim
- no autonomous-agent claim
