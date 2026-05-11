# Temporal Interpretation Fixture Review Report Template

## Status and scope

- Type: Fixture review report template
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Source fixture set:
  `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`
- Review mode: human review only
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: report format only

This document defines a template for future human review reports against the
temporal interpretation Markdown review fixtures. It does not perform a
review, mark any fixture as pass/fail, claim P4 implementation readiness, add
JSON fixtures, or add executable tests.

## Purpose

The purpose of this template is to define how a future reviewer should record:

- which fixture was reviewed
- what evidence was inspected
- what hypothetical or actual `PerspectiveSnapshot`-style answer was evaluated
- whether evidence anchors were sufficient
- whether summary drift, counterexamples, residual tensions, source authority,
  and explanation fidelity were preserved
- which human-review status applies
- what decision is allowed after the review
- what remains blocked

The template should make review outcomes auditable without turning review text
into runtime authority.

## When to use this template

Use this template when creating a future review report for one or more
fixtures in `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`.

Use it for:

- initial manual fixture review
- follow-up review after fixture refinement
- review of a proposed `PerspectiveSnapshot`-style answer
- review of whether fixture coverage is sufficient for a later planning step
- recording blockers, missing evidence, and user/PM judgment needs

Do not use it to:

- approve implementation
- record durable runtime state
- define JSON fixture shape
- define executable test behavior
- create schema, API, UI, or ChatGPT App behavior
- promote `RuleCandidate` or `PromotedRule`

## Source fixture set

The source fixture file is:

- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`

Future review reports should address these fixture IDs, or explicitly defer
each omitted fixture with a reason:

- `TIRF-P4-001-prior-staged-progression`
- `TIRF-P4-002-summary-drift-counterexample`
- `TIRF-P4-003-revision-after-objection`
- `TIRF-P4-004-user-preference-vs-factuality`
- `TIRF-P4-005-axis-proliferation`
- `TIRF-P4-006-explanation-fidelity`
- `TIRF-P4-007-tension-preservation`

## Review status labels

Reuse the human-review labels from the source fixture set:

- `pass`: The reviewed fixture handling appears satisfied for manual review
  purposes.
- `fail`: The reviewed fixture handling violates required evidence,
  visibility, fidelity, or authority conditions.
- `partial_support`: Some requirements are satisfied, but refinement or extra
  evidence is required before relying on the fixture.
- `missing_evidence`: Required source anchors must be added, located, or
  inspected before the fixture can support readiness discussion.
- `blocked`: Review cannot proceed because required sources, answer material,
  or unresolved user/PM judgment is unavailable.
- `needs_judgment`: User/PM/reviewer judgment is required before the status
  can be resolved.
- `out_of_scope`: The attempted review or proposed work exceeds the manual
  fixture review boundary.

These labels are human-review labels only. They are not executable statuses,
API fields, DB fields, automatic scoring outputs, or runtime state. They do
not create runtime authority.

## Reviewer roles and decision authority

- Reviewer: inspects fixture evidence and records findings. The reviewer may
  identify pass/fail/blocked rationale for manual review, but cannot create
  durable approval or implementation authority through this template.
- User/PM: decides whether fixture coverage is sufficient to move to a later
  step, such as fixture refinement, a later JSON fixture design discussion, or
  a separately scoped implementation-readiness discussion.
- ChatGPT: may help interpret evidence and draft review results, but does not
  create durable approval.
- Codex: may create or update docs via PR, but does not decide merge,
  readiness, or implementation approval.

No role in this template can approve runtime/schema/API/UI/App implementation
merely by filling out the template.

## Review procedure

1. Identify the fixture IDs under review.
2. Inspect the source fixture file and relevant temporal interpretation docs.
3. Record the evidence inspected, including missing evidence.
4. Record the hypothetical or actual `PerspectiveSnapshot`-style answer being
   evaluated, if one exists.
5. Check evidence anchors, summary/view refs, counterexamples, residual
   tensions, source authority profile, and explanation fidelity.
6. Assign a human-review status for each reviewed fixture.
7. Record what decision is allowed after the review.
8. Record what remains blocked.
9. Preserve the non-authority statement.

If a required source, answer, or reviewer judgment is unavailable, use
`blocked`, `missing_evidence`, or `needs_judgment` instead of inferring a
result.

## Overall review report template

Copy this block into a future review report and fill it in. Do not treat this
template block as a completed review.

```markdown
# Temporal Interpretation Fixture Review Report: [short title]

## Report metadata

- Report title: [fill in]
- Review date: [fill in]
- Reviewer: [fill in]
- Scope: [all fixtures / selected fixtures / follow-up review]
- Source fixture file:
  `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`
- Fixtures reviewed:
  - [fixture ID]
- Fixtures explicitly deferred:
  - [fixture ID and reason]
- Overall status: [pass / fail / partial_support / missing_evidence /
  blocked / needs_judgment / out_of_scope]

## Summary of findings

[Summarize the review outcome without claiming implementation approval.]

## Blockers

- [blocker or none]

## Required follow-up

- [follow-up item]

## Decision requested from user/PM

[State the specific decision needed, if any.]

## Allowed decision after this review

[Example: refine fixtures, accept Markdown review coverage for now, request
more evidence, defer JSON fixture design, or block implementation discussion.]

## What remains blocked

- Runtime/schema/API/UI/App implementation
- JSON fixtures unless separately approved
- Executable tests unless separately approved
- P4 `PerspectiveSnapshot` implementation unless separately approved
- P5 `RuleCandidate` / `PromotedRule` work unless separately approved

## Non-authority statement

This report is a human review artifact only. It does not grant runtime
authority, schema authority, API authority, UI/App authority, fixture
automation authority, executable test authority, or rule-promotion authority.
```

## Per-fixture review block template

Copy this block once for each fixture under review. Do not assign a status in
this template PR.

```markdown
## Fixture review: [fixture ID] - [fixture name]

- Fixture ID: [fill in]
- Fixture name: [fill in]
- Review status: [pass / fail / partial_support / missing_evidence / blocked /
  needs_judgment / out_of_scope]
- Evidence inspected:
  - [source ref]
- Hypothetical or actual answer reviewed:
  - [paste or summarize the reviewed answer, or state none]
- Required evidence anchors present: [yes / no / partial / not reviewed]
- Missing evidence:
  - [missing ref or none]
- Summary/view refs used:
  - [summary/view ref or none]
- Counterexamples preserved: [yes / no / partial / not applicable]
- Residual tensions preserved: [yes / no / partial / not applicable]
- Source authority profile preserved: [yes / no / partial / not reviewed]
- Explanation fidelity judgment: [faithful / unfaithful / partial /
  not applicable / not reviewed]
- Expected PerspectiveSnapshot visibility satisfied: [yes / no / partial /
  not reviewed]
- User-facing answer shape satisfied: [yes / no / partial / not applicable]
- Non-authority boundary preserved: [yes / no / partial]
- Pass/fail/blocked rationale:
  - [rationale]
- Reviewer notes:
  - [note]
- Follow-up required:
  - [follow-up item or none]
```

## Evidence inspected template

Use this structure inside the overall report or inside each fixture block.

```markdown
### Evidence inspected

- Source temporal interpretation docs:
  - [doc path]
- Source fixture refs:
  - [fixture ID or section]
- Raw/user/session evidence:
  - [ref or not inspected]
- Proof/trace evidence:
  - [ref or not inspected]
- Committed-state evidence:
  - [ref or not inspected]
- External evidence:
  - [PR, commit, test output, uploaded file, or not inspected]
- Summary/view refs:
  - [ref or none]
- Counterexample refs:
  - [ref or none]
- Tension refs:
  - [ref or none]
- Missing evidence:
  - [missing ref or none]
- Source authority profile notes:
  - [notes]
```

## PerspectiveSnapshot visibility checklist

For each reviewed fixture, check whether the reviewed answer or proposed view
preserves:

- current interpretation
- active prior context
- evidence anchors
- source authority profile
- active interpretive drivers
- fixed-axis influence summary when relevant
- residual tensions
- suppressed alternatives
- counterexamples and non-applicability cases
- summary drift warnings when relevant
- revision explanation when relevant
- user-facing safe next step
- missing evidence warnings
- explicit non-authority boundary

Use `not applicable` only when the fixture does not require that visibility
element. Do not mark a fixture as satisfied only because the answer is fluent.

## Authority and non-authority checklist

A completed report should explicitly answer:

- Did the reviewed answer preserve that the fixture is manual-review only?
- Did it avoid treating summaries as source of truth?
- Did it avoid treating narrator-layer text as evidence?
- Did it avoid creating runtime authority?
- Did it avoid schema, API, UI, and ChatGPT App implications?
- Did it avoid claiming `PerspectiveSnapshot` implementation readiness?
- Did it avoid promoting `RuleCandidate` or `PromotedRule`?
- Did it avoid automatic scoring thresholds?
- Did it state what remains blocked?

Any `no` answer should usually produce `fail`, `partial_support`, or
`needs_judgment`, depending on severity and context.

## Summary drift / counterexample / residual tension checklist

For each reviewed fixture where relevant, record:

- whether summary-only support was rejected
- whether self-narrative-only support was rejected
- whether counterexamples remained visible
- whether non-applicability cases remained visible
- whether residual tensions remained visible
- whether suppressed alternatives remained visible
- whether missing evidence was reported instead of inferred away
- whether source authority categories were preserved

Summary-only support cannot pass. Counterexamples and residual tensions should
not be smoothed away for narrative polish.

## Explanation fidelity checklist

For reviewed answers that include a user-facing rationale, record:

- what the answer claimed
- what evidence path actually supported
- whether active drivers were represented accurately
- whether factuality, user context, boundary, continuity, implementation, or
  other axes were overstated or understated
- whether the explanation hid tensions or counterexamples
- whether the corrected rationale, if any, matched the evidence path

Explanation fidelity should be judged against the evidence path, not against
how plausible or polished the answer sounds.

## Fixture decision matrix

| Review status | Meaning | Allowed next decision | What remains blocked |
| --- | --- | --- | --- |
| `pass` | Fixture appears satisfied for manual review purposes. | Rely on the fixture result for manual review discussion. | Does not approve implementation alone. Runtime/schema/API/UI/App work remains blocked unless separately approved. |
| `partial_support` | Some requirements are met, but refinement or extra evidence is required. | Refine the fixture, answer, or evidence set before relying on it. | Implementation readiness and JSON/executable conversion remain blocked for this fixture. |
| `missing_evidence` | Required source anchors are absent or not inspected. | Add, locate, or inspect source anchors before using the fixture for readiness discussion. | Fixture cannot support readiness until evidence is addressed. |
| `fail` | Reviewed answer or fixture handling violates required evidence, visibility, fidelity, or authority conditions. | Record failure and identify corrective work. | Implementation discussion should remain blocked for the failed coverage area. |
| `blocked` | Review cannot proceed due to missing sources, answer material, or unresolved decision input. | Resolve the blocker or defer the fixture with reason. | Fixture result cannot support readiness. |
| `needs_judgment` | User/PM/reviewer judgment is required before status can be resolved. | Request the specific judgment and defer final status. | Readiness claims depending on that judgment remain blocked. |
| `out_of_scope` | Attempted review or proposed work exceeds the manual fixture review boundary. | Narrow scope back to manual review or create a separate approved task. | Out-of-scope work remains blocked. |

## Minimum completion criteria for a review report

A future review report should not be considered complete unless:

- all seven fixture IDs are addressed or explicitly deferred with reason
- every reviewed fixture has a status
- evidence inspected is recorded
- missing evidence is listed
- counterexamples and residual tensions are checked where relevant
- source authority profile is checked
- non-authority boundary is checked
- follow-up decision is stated
- the report does not claim implementation approval

The report may still conclude that review is blocked, incomplete, or requires
user/PM judgment. Completion means the report is structurally complete, not
that fixtures passed.

## What this report template does not prove

This template does not prove that:

- any fixture passes
- fixture coverage is sufficient
- the project is ready for P4 implementation
- JSON fixtures should be created
- executable tests should be created
- source refs can be retrieved automatically
- runtime/schema/API/UI/App work is justified
- `RuleCandidate` or `PromotedRule` work is justified

## Relationship to initial fixture review report

This template is intended to support a later initial manual fixture review
report. This PR does not create that report.

A future initial review report should copy this template, review the seven
fixtures from `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`, and
record actual findings. That later report may identify passes, failures,
missing evidence, blocked fixtures, or user/PM judgment needs. It still would
not approve implementation by itself.

## Relationship to JSON fixtures

This template may help identify which report fields could later become JSON
fixture fields. It does not decide that conversion.

JSON fixture design should wait until human reviewers decide that:

- the Markdown review fields are stable enough
- source authority profiles can be represented without flattening evidence
- blocked and needs-judgment outcomes can be represented honestly
- counterexamples and residual tensions remain visible
- JSON will not imply executable readiness by itself

## Relationship to executable tests

This template does not add executable tests. A future executable test design
should not begin merely because a review report exists.

Executable tests, if later approved, should not replace human review of:

- source authority profile
- missing evidence
- counterexample relevance
- residual tension quality
- explanation fidelity
- user/PM judgment
- non-authority boundaries

## Relationship to P4 read-only PerspectiveSnapshot implementation

This template does not claim P4 implementation readiness. Filling out this
template does not approve `PerspectiveSnapshot` projection.

A future P4 read-only implementation discussion would require, at minimum:

- completed fixture review report
- user/PM decision that fixture coverage is sufficient for a later step
- explicit handling of missing evidence and blocked fixtures
- separate implementation scope
- separate review of schema/API/UI/App non-goals
- continued derived, bounded, read-only, non-authority framing

## Relationship to P5 RuleCandidate / PromotedRule work

This template does not approve P5 work. `RuleCandidate` and `PromotedRule`
runtime remain out of scope.

Future P5 discussion would require separate fixture coverage for:

- raw support requirements
- negative evidence requirements
- duplicate or near-duplicate rule bloat
- self-narrative isolation
- promotion gates
- source authority profile handling
- non-applicability conditions
- governance approval

No review report created from this template can promote a rule or authorize
rule promotion by itself.

## Open questions

- Who should serve as reviewer for the initial fixture review report?
- Should user/PM decisions be recorded in the review report or in a separate
  decision document?
- Should every fixture require the same evidence categories, or should evidence
  requirements stay fixture-specific?
- How should unavailable external refs be represented?
- Should blocked fixtures prevent JSON fixture design entirely or only block
  affected fixture categories?
- Should a future report include exact reviewed answer text or only a summary?
- What threshold of `partial_support` results, if any, is acceptable before
  refining the fixture set?
- Which fields, if any, are safe candidates for later JSON structure?

## Final summary

This document defines a report template for future human review of the temporal
interpretation Markdown fixtures. It does not perform the review, mark any
fixture as pass/fail, grant implementation approval, add JSON fixtures, or add
executable tests.

The next safe step after this PR is to create an initial manual fixture review
report using this template, reviewing the seven Markdown fixtures from
`docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`.
