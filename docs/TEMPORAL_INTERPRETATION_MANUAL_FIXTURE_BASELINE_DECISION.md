# Temporal Interpretation Manual Fixture Baseline Decision

## Status and scope

- Type: User/PM decision record
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Decision scope: manual review baseline only
- Canonical status: Documentation decision record
- Runtime authority: None
- Implementation status: Documentation-only

This document records a bounded user/PM decision to accept the current
temporal interpretation Markdown fixture set as the manual review baseline.
It does not approve runtime/schema/API/UI/App implementation.

## Decision summary

The current Markdown review fixture set is accepted as the current manual
review baseline.

This means `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md` may be
used as the baseline fixture set for future manual review reports.

This decision does not approve JSON fixture design, executable tests, P4
`PerspectiveSnapshot` implementation, runtime/schema/API/UI/App work, or P5
`RuleCandidate` / `PromotedRule` work.

## Decision source

This decision is based on:

- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_REVIEW_REPORT_TEMPLATE.md`
- `docs/TEMPORAL_INTERPRETATION_INITIAL_FIXTURE_REVIEW_REPORT.md`
- `docs/TEMPORAL_INTERPRETATION_DOC_INDEX.md`
- `docs/TEMPORAL_INTERPRETATION_IMPLEMENTATION_READINESS_CHECKLIST.md`

The initial fixture review report reviewed all seven fixture IDs, set overall
status to `partial_support`, found no blocker to using the fixture set as a
manual review baseline, and kept implementation-related work blocked pending
separate decisions.

## Accepted baseline

The accepted manual review baseline is:

- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`

The accepted review-report format for future fixture reviews is:

- `docs/TEMPORAL_INTERPRETATION_FIXTURE_REVIEW_REPORT_TEMPLATE.md`

The first review evidence for this baseline acceptance is:

- `docs/TEMPORAL_INTERPRETATION_INITIAL_FIXTURE_REVIEW_REPORT.md`

## What partial_support means here

The initial review report's `partial_support` status is accepted as meaning:

- the Markdown fixture set is useful and structurally reviewable as a manual
  review artifact
- all seven fixture definitions can be used for future manual review
- fixture-definition adequacy is not runtime behavior pass
- user/PM judgment was required before baseline acceptance
- JSON fixture design, executable tests, and implementation work still require
  separate decisions

`partial_support` does not mean a runtime `PerspectiveSnapshot` passed. No
runtime `PerspectiveSnapshot` exists.

## What this decision allows

This decision allows:

- use of `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md` as the
  current manual review baseline
- use of `docs/TEMPORAL_INTERPRETATION_FIXTURE_REVIEW_REPORT_TEMPLATE.md` for
  future review reports
- use of `docs/TEMPORAL_INTERPRETATION_INITIAL_FIXTURE_REVIEW_REPORT.md` as the
  first review evidence for baseline acceptance
- discussion of optional fixture refinements
- discussion of whether to create a fixture refinement follow-up document
- later discussion of whether JSON fixture shape should be designed, but only
  as a separate decision

## What this decision does not allow

This decision does not allow:

- runtime/schema/API/UI/App implementation
- P4 `PerspectiveSnapshot` projection implementation
- JSON fixture creation
- executable test creation
- automatic scoring thresholds
- `RuleCandidate` runtime
- `PromotedRule` runtime
- rule promotion
- Control Packet changes
- ChatGPT App tools
- Cockpit UI
- changes to `docs/DEVELOPMENT_ONBOARDING.md`
- treating fixture-definition pass as runtime behavior pass

## Current baseline fixture IDs

The current manual review baseline includes:

- `TIRF-P4-001-prior-staged-progression`
- `TIRF-P4-002-summary-drift-counterexample`
- `TIRF-P4-003-revision-after-objection`
- `TIRF-P4-004-user-preference-vs-factuality`
- `TIRF-P4-005-axis-proliferation`
- `TIRF-P4-006-explanation-fidelity`
- `TIRF-P4-007-tension-preservation`

## Optional refinements

Optional fixture refinements remain allowed. They are not required before
treating the current Markdown fixture set as the baseline for manual review.

Possible refinements may include:

- adding clearer placeholders for concrete raw support refs
- adding clearer placeholders for raw counterexample refs
- strengthening axis-mapping tension notes
- specifying how exact reviewed answer text should be recorded
- deciding where repeated fixture review outcomes should live

Any refinement should preserve the manual review baseline boundary and should
not imply JSON, executable tests, or implementation approval.

## Relationship to JSON fixture design

Future JSON fixture design requires a separate decision.

This decision does not say JSON is next. It only accepts the current Markdown
fixture set for manual review. JSON fixture design may be discussed later if
user/PM explicitly approves that direction.

Any later JSON discussion must preserve:

- source authority profile
- missing evidence handling
- counterexamples
- residual tensions
- blocked and `needs_judgment` outcomes
- non-authority boundaries
- the distinction between fixture-definition adequacy and runtime behavior

## Relationship to executable tests

Executable tests remain out of scope.

This decision does not create deterministic test expectations, test fixtures,
test harnesses, or pass/fail automation. Executable tests require separate
scope and approval after the manual review shape is stable enough to evaluate.

## Relationship to P4 read-only PerspectiveSnapshot implementation

P4 implementation remains blocked pending separate scope and approval.

This decision accepts the fixture set for manual review. It does not validate
any runtime `PerspectiveSnapshot` behavior, because no implementation exists.
It does not approve projection logic, schema, API, UI, ChatGPT App tools, or
runtime behavior.

A later P4 implementation discussion would require a separate decision and
separate PR scope.

## Relationship to P5 RuleCandidate / PromotedRule work

P5 `RuleCandidate` and `PromotedRule` work remains out of scope.

This decision does not approve rule candidates, promoted rules, vector
providers, automatic scoring thresholds, or rule promotion. P5 work would
require separate fixture coverage, separate governance review, and separate
implementation scope.

## Non-authority boundary

This is a manual review baseline decision, not an implementation baseline.

This decision does not:

- grant runtime authority
- approve schema changes
- approve API behavior
- approve UI or ChatGPT App surfaces
- approve Control Packet changes
- create JSON fixtures
- create executable tests
- create `raw_episode`, `PerspectiveSnapshot`, `RuleCandidate`, or
  `PromotedRule` tables
- claim P4 implementation readiness
- claim runtime/schema/API/UI/App approval
- claim actual `PerspectiveSnapshot` behavior passed
- change `docs/DEVELOPMENT_ONBOARDING.md`
- change the current repo-level next goal

Use "manual review baseline," not "implementation baseline." Use "accepted for
manual review," not "validated for runtime."

## Open questions

- Should a small fixture refinement note be created for optional improvements?
- Which optional refinements, if any, should be prioritized?
- Where should repeated manual review outcomes live?
- What user/PM signal would be required to begin a separate JSON fixture shape
  discussion?
- What evidence would be required for a future P4 implementation-readiness
  discussion?

## Next suggested goal

Decide whether to create a small fixture refinement note for optional
improvements, or begin a separate JSON fixture shape discussion only if user/PM
explicitly approves that direction.

## Final summary

The current temporal interpretation Markdown review fixture set is accepted as
the manual review baseline.

The decision is based on the initial fixture review report and treats that
report's `partial_support` status as fixture-definition adequacy only, not
runtime behavior pass.

This decision does not approve JSON fixtures, executable tests, P4
`PerspectiveSnapshot` implementation, runtime/schema/API/UI/App work, or P5
`RuleCandidate` / `PromotedRule` work. Optional refinements remain allowed.
