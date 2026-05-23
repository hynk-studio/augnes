# Dogfooding Evaluation Criteria v0.1

## Status

- evaluation-criteria-note-only
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

This note defines case-based review criteria for Augnes dogfooding episodes.

It supports human review of whether context was preserved, lost, repaired, or
left ambiguous. It is research/evaluation guidance only and not a benchmark,
score system, proof, evidence status, readiness signal, or runtime behavior.

## Evaluation Principles

- Case-based before metrics.
- Raw anchors before summaries.
- Gaps before fabrication.
- Negative and partial cases are valuable.
- Criteria are review aids, not authority.
- No criterion should become proposal scoring, commit/reject input, Gate/SRF
  input, publication readiness, or source of truth.

## Criteria

Each criterion is a review question, not a score.

### Context Retention

Question: Did the later session preserve prior decisions, constraints, and
reasons?

### Handoff Quality

Question: Did Codex receive a clearer, more targeted task with expected and
forbidden changes?

### PR Alignment

Question: Did the PR match the original task intent and stated constraints?

### Review Efficiency

Question: Did ChatGPT review with fewer missing assumptions or repeated
clarifications?

### Repetition Reduction

Question: Were repeated explanations, repeated debates, or repeated boundary
reminders reduced?

### Next-Task Quality

Question: Was the next suggested goal better scoped and connected to prior work?

### Drift Resistance

Question: Did the episode reveal stale, misleading, or misaligned project
context?

### Perspective Update Quality

Question: Did the episode identify what should be preserved, revised, repaired,
retired, or blocked?

## Baseline Comparison

This comparison frame is docs-only conceptual guidance.

- Baseline context: README, current issue or user request, current chat context
  only.
- Augnes-assisted context: baseline context plus raw episode anchors, committed
  project state pointers, read-only perspective summaries, prior decision
  pointers, Codex handoff fields, and PR/review result pointers.

This comparison does not create a benchmark or score.

## Outcome Labels

Outcome labels are review notes only.

- useful
- partially useful
- ambiguous
- misleading
- blocked
- needs repair
- superseded

Outcome labels are not evidence status, proof, readiness, proposal scoring, or
source of truth.

## Missing Data / Gap Handling

Missing anchors should be recorded as gaps.

Gaps should name what is missing and why it matters if known. Gaps should not be
filled by speculation.

## Relationship To Existing Docs

This note relates to:

- `AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md`
- `AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md`
- `RAW_EPISODE_CAPTURE_V0_1.md`
- `CODEX_HANDOFF_V0_1.md`
- `DOGFOODING_EPISODE_LOG_V0_1.md`

It does not override those documents and does not create authority.

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
