# PR Review Anchor Convention v0.1

## Status

- repo-local review convention
- non-SSOT
- non-authoritative review aid
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no evidence/proof authority
- no scoring authority
- no benchmark authority
- no production-readiness claim
- no autonomous-capability claim

## Purpose

This convention describes how boundary-relevant ChatGPT / user / Codex review
findings can be anchored in PR comments or review comments.

PR comments and review comments are repo-anchored review anchors. They are not
source of truth, proof, evidence status, readiness, score, benchmark, runtime
authority, or approval for implementation.

The goal is to preserve review context that affected a PR decision without
turning every successful PR into a casebook entry or a process artifact.

## When To Create A Review Anchor

Create a review anchor when a finding changes review, repair, or handoff
context in a boundary-relevant way.

Useful anchor cases include:

- public wording overclaim risk
- scope mismatch
- smoke-blocked issue
- missing raw anchor / gap affecting review
- runtime/authority boundary risk
- task/repo mismatch that affects review
- meaningful ambiguity that changes review outcome

Do not create review anchors for:

- routine successful PRs
- every minor wording preference
- purely mechanical refactors without a boundary event
- private speculation
- reconstructed external conversation text

If exact external ChatGPT or Codex prompt text is missing, record it as a gap
rather than reconstructing it.

## Where To Place It

- Use an inline review comment for file-specific findings.
- Use a top-level PR comment for cross-cutting findings.
- Use the PR body Dogfood checkpoint for summary and handoff, not as a
  replacement for raw review anchors when a boundary-relevant review finding
  matters.

## What A Review Anchor Should Contain

A review anchor should be short, specific, and tied to raw refs where possible.

It should name:

- what was observed
- which raw refs support the observation
- why the boundary matters
- what repair or decision happened
- what remains gap
- whether a casebook entry is expected, skipped, or undecided
- what should be handed off next

## What Not To Include

Do not include:

- private speculation
- reconstructed external conversation text
- no claim that Augnes improves workflows
- no claim that Augnes evaluates PR quality
- no claim that Augnes detects drift at runtime
- no claim that Augnes repairs context automatically
- no claim that Augnes selects next tasks autonomously
- no production-readiness claims
- no benchmark, scoring, evidence/proof, or readiness claims
- runtime authority claims

## Relationship To PR Body Dogfood Checkpoints

The PR body Dogfood checkpoint is the summary/handoff surface.

It should include:

- raw anchors used
- Augnes-assisted context used
- context preserved
- context ambiguous / missing
- boundary checks touched
- whether a casebook entry was added or intentionally skipped
- next suggested goal

A PR body checkpoint can point to review anchors, but it should not replace a
raw PR comment or review comment when a boundary-relevant finding affected the
review.

## Relationship To Casebook Entries

A PR review anchor can support a future casebook entry, but does not require
one.

Casebook entries remain for meaningful dogfooding cases, such as:

- repaired boundary issues
- failed or partial handoffs
- meaningful ambiguity
- smoke-blocked issues
- public wording overclaim risks
- source-anchor or gap issues that affected review

Do not add casebook entries for routine successful PRs, purely mechanical
refactors without a boundary event, or every smoke/helper maintenance task.

## Suggested Minimal Anchor Format

- Anchor type:
- Raw anchor refs:
- Finding:
- Boundary implication:
- Repair / decision:
- Remaining gap:
- Casebook entry:
- Next handoff note:

## Non-Goals

- no runtime implementation
- no runtime sequence behavior
- no persisted episode records
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no proof
- no evidence status
- no readiness claim
- no benchmark
- no KPI
- no score system
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no source-of-truth claim
- no PerspectiveSnapshot response-shape change
- no Sidecar e_t runtime computation
- no QP output
- no z_t commit
- no Cockpit action controls
- no production-readiness claim
- no autonomous-agent claim

## Final Note

Use the smallest anchor that preserves the boundary-relevant review fact. If the
finding did not affect scope, wording safety, authority boundaries, raw anchors,
or handoff quality, it usually does not need a review anchor.
