# Temporal Interpretation Fixture Refinement Notes

## Status and scope

- Type: Optional refinement notes
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Scope: manual review fixture refinement planning only
- Baseline affected: none
- Runtime authority: None
- Implementation status: Documentation-only

This document records optional refinement candidates for the accepted temporal
interpretation manual review fixture baseline.

It does not modify the baseline fixture file. It does not perform fixture
review, create JSON fixtures, add executable tests, approve P4
`PerspectiveSnapshot` implementation, approve runtime/schema/API/UI/App work,
or approve P5 `RuleCandidate` / `PromotedRule` work.

## Purpose

The purpose of this note is to organize optional improvements that could make
future manual review clearer, especially if the team later considers a
separate JSON fixture shape discussion.

The current Markdown fixture set remains accepted as the manual review
baseline. These refinements are not blockers to using the current baseline for
manual review.

## Source documents

- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_REVIEW_REPORT_TEMPLATE.md`
- `docs/TEMPORAL_INTERPRETATION_INITIAL_FIXTURE_REVIEW_REPORT.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_FIXTURE_BASELINE_DECISION.md`
- `docs/TEMPORAL_INTERPRETATION_DOC_INDEX.md`
- `docs/TEMPORAL_INTERPRETATION_IMPLEMENTATION_READINESS_CHECKLIST.md`

## Current baseline status

`docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md` is accepted as the
current manual review baseline.

The baseline includes:

- `TIRF-P4-001-prior-staged-progression`
- `TIRF-P4-002-summary-drift-counterexample`
- `TIRF-P4-003-revision-after-objection`
- `TIRF-P4-004-user-preference-vs-factuality`
- `TIRF-P4-005-axis-proliferation`
- `TIRF-P4-006-explanation-fidelity`
- `TIRF-P4-007-tension-preservation`

The accepted baseline is a manual review baseline, not an implementation
baseline. It is accepted for manual review, not validated for runtime.

## Refinement principles

- Preserve the accepted manual review baseline.
- Do not turn reviewer labels into schema/API/JSON fields yet.
- Do not remove `blocked` or `needs_judgment` outcomes.
- Do not collapse source authority profile into a single confidence score.
- Do not erase counterexamples, residual tensions, or missing evidence.
- Prefer adding clarity over adding machinery.
- Keep refinements review-oriented, not implementation-oriented.
- Avoid making JSON fixture design seem inevitable.
- Preserve the distinction between fixture-definition adequacy and actual
  answer behavior.
- Keep P4 implementation and P5 rule work out of scope.

## Refinement priority table

| Refinement area | Priority | Affected fixtures | Reason | Required before JSON discussion? | Required before manual review use? | Scope risk |
| --- | --- | --- | --- | --- | --- | --- |
| Concrete raw support refs | high | `TIRF-P4-002`, `TIRF-P4-003`, `TIRF-P4-004`, `TIRF-P4-007` | Future reviewers need to distinguish fixture shape from actual raw evidence. | Useful before JSON discussion | No | Could imply raw episode schema if over-specified. |
| Raw counterexample refs | high | `TIRF-P4-002`, `TIRF-P4-007` | Counterexamples are central to avoiding summary drift and final-truth claims. | Useful before JSON discussion | No | Could become checklist theater if refs are named without authority profile. |
| Reviewed answer text or summary | high | `TIRF-P4-001`, `TIRF-P4-003`, `TIRF-P4-004`, `TIRF-P4-006`, `TIRF-P4-007` | Future reports need to show what answer was actually evaluated. | Useful before JSON discussion | No | Could be mistaken for an executable test input. |
| Actual evidence path | high | `TIRF-P4-003`, `TIRF-P4-006`, `TIRF-P4-007` | Explanation fidelity requires comparing rationale to evidence path. | Useful before JSON discussion | No | Could harden into an API contract if over-structured. |
| Axis-mapping tension | medium | `TIRF-P4-005` | The axis fixture should make mapping uncertainty and duplicate-effect tension visible. | Useful before JSON discussion | No | Could invite new axis machinery too early. |
| Repeated-review result location | medium | all seven | Standalone review report documents by default give repeated outcomes a durable place without turning the baseline fixture file into a running log. | Helpful before JSON discussion | No | Could create process overhead or imply a cumulative log before user/PM separately approves one. |
| Stale or unavailable external refs | medium | all seven | Future evidence refs may be unavailable, stale, or mutable. | Helpful before JSON discussion | No | Could overcomplicate current manual review. |
| Fixture-definition vs answer behavior | high | all seven | Baseline acceptance must not be confused with runtime behavior pass. | Useful before JSON discussion | No | Low risk if kept as wording guidance. |
| Reviewed artifact type | medium | all seven | Review reports should distinguish fixture-definition review, hypothetical answer review, actual answer review, and implementation-readiness review. | Helpful before JSON discussion | No | Could imply stages are mandatory workflow gates if overdone. |
| JSON discussion prerequisites | medium | all seven | Clarifies what must be decided before JSON shape work. | Yes | No | Could make JSON seem automatic if phrased poorly. |

## Optional refinement candidates

1. Add clearer placeholders for concrete raw support refs.
2. Add clearer placeholders for raw counterexample refs.
3. Add clearer placeholders for exact reviewed answer text or precise answer
   summary.
4. Add clearer placeholders for actual evidence path in explanation-fidelity
   review.
5. Add stronger axis-mapping tension notes for
   `TIRF-P4-005-axis-proliferation`.
6. Add repeated-review result location guidance: standalone review report
   documents by default, no running log inside the accepted baseline fixture
   file, PR comments as discussion aids rather than canonical record, and a
   cumulative review log deferred unless separately approved.
7. Add stale or unavailable external ref handling guidance.
8. Add clearer distinction between fixture-definition adequacy and actual
   answer behavior in future reports.
9. Add optional reviewed-artifact-type guidance, such as fixture-definition
   review, hypothetical answer review, actual `PerspectiveSnapshot` answer
   review, or implementation-readiness review.
10. Add guidance for what must happen before JSON fixture shape discussion.

## Fixture-specific refinement notes

### TIRF-P4-001-prior-staged-progression

- Current baseline status: accepted for manual review.
- Optional refinement: add a placeholder for exact reviewed answer text or a
  precise answer summary.
- Why it may help: the fixture is intended to catch premature
  runtime/schema/API/UI/App recommendations, so reviewers need to know exactly
  what recommendation was evaluated.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: the placeholder could be mistaken for a test input
  format or API field.

### TIRF-P4-002-summary-drift-counterexample

- Current baseline status: accepted for manual review.
- Optional refinement: add explicit placeholders for raw support refs, raw
  counterexample refs, and summary/view refs used only as drift targets.
- Why it may help: this fixture depends on separating summary-only support from
  raw evidence and counterexamples.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: the refinement could imply a `raw_episode` schema or
  automatic evidence extraction path before either is approved.

### TIRF-P4-003-revision-after-objection

- Current baseline status: accepted for manual review.
- Optional refinement: add fields for prior interpretation ref, objection ref,
  changed elements, stable elements, and residual tension.
- Why it may help: the fixture should verify revision quality rather than only
  the final conclusion.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: the refinement could harden conceptual review fields
  into runtime snapshot fields too early.

### TIRF-P4-004-user-preference-vs-factuality

- Current baseline status: accepted for manual review.
- Optional refinement: add placeholders for user preference context and factual
  repo/task readiness evidence.
- Why it may help: the fixture must separate tone adaptation from factual
  implementation readiness.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: user preference evidence could be over-weighted or
  treated as durable approval.

### TIRF-P4-005-axis-proliferation

- Current baseline status: accepted for manual review.
- Optional refinement: add stronger axis-mapping tension notes, including
  whether a proposed axis duplicates an existing axis or remains unresolved.
- Why it may help: the fixture blocks auto-created axes, but mapping tension
  should stay visible when a proposed label captures a real concern.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: the refinement could encourage axis machinery,
  scoring, or new-axis governance before any of that is approved.

### TIRF-P4-006-explanation-fidelity

- Current baseline status: accepted for manual review.
- Optional refinement: add placeholders for exact reviewed rationale, actual
  evidence path, active drivers, and mismatch notes.
- Why it may help: explanation fidelity cannot be judged against polish; it
  must be judged against the actual evidence path.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: a structured evidence-path placeholder could be
  mistaken for an implementation contract.

### TIRF-P4-007-tension-preservation

- Current baseline status: accepted for manual review.
- Optional refinement: add placeholders for selected recommendation, suppressed
  alternatives, residual tension, and change conditions.
- Why it may help: this fixture protects against turning a current
  recommendation into final truth.
- Required before manual review use: no.
- Useful before JSON discussion: yes.
- Scope risk if overdone: change-condition fields could be misread as
  automatic promotion or implementation gates.

## Cross-fixture refinement notes

- Add reviewed-artifact-type guidance so reports can distinguish
  fixture-definition review, hypothetical answer review, actual
  `PerspectiveSnapshot` answer review, and implementation-readiness review.
- Use standalone review report documents by default for repeated manual review
  results.
- The accepted baseline fixture file is not a running review log.
- PR comments are discussion aids, not canonical long-term record unless
  separately decided.
- A cumulative review log requires separate user/PM decision.
- Treat repeated-review location guidance as optional process refinement, not
  a blocker to manual review use.
- Add stale-ref handling guidance for external evidence that may change or
  become unavailable.
- Preserve `blocked`, `needs_judgment`, and `missing_evidence` as first-class
  manual review outcomes.
- Preserve source authority profile as qualitative review context, not a
  single confidence score.
- Keep exact fixture IDs stable unless a later user/PM decision explicitly
  approves renaming or splitting.

## What refinements should not do

Refinements should not:

- modify schema
- create API contracts
- create JSON fixtures
- create executable tests
- add runtime behavior
- add Cockpit UI
- add ChatGPT App tools
- change the Control Packet
- change `DEVELOPMENT_ONBOARDING.md`
- claim P4 implementation readiness
- approve runtime/schema/API/UI/App work
- approve P5 `RuleCandidate` or `PromotedRule` work
- turn reviewer labels into automatic scoring outputs
- treat fixture-definition adequacy as runtime behavior pass
- make JSON fixture design seem inevitable

## Relationship to the accepted manual review baseline

The accepted manual review baseline remains unchanged.

This note does not modify
`docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`. The baseline can
continue to be used for manual review before any refinement PR is created.

Optional refinements may improve clarity, but they are not blockers to current
manual review use.

## Relationship to future review reports

Future review reports may use these notes to decide what information to record
more explicitly.

Repeated manual review results should live in standalone review report
documents by default. The accepted baseline fixture file should remain the
fixture baseline, not a running log of review outcomes. PR comments may support
discussion, but they are not the canonical long-term record unless user/PM
separately decides otherwise. A cumulative review log remains deferred unless
separately approved.

The most useful near-term additions for review reports are likely:

- reviewed artifact type
- exact reviewed answer text or precise answer summary
- concrete source refs
- missing evidence notes
- stale or unavailable external ref notes

These additions can be used in reports without changing runtime behavior.

## Relationship to JSON fixture design

JSON fixture design still requires a separate user/PM decision.

These notes may inform a future JSON discussion, but they do not start one.
Before any JSON fixture shape discussion, user/PM should decide whether:

- the current Markdown baseline is stable enough to structure
- optional refinements should be applied first
- blocked and `needs_judgment` outcomes can be represented without pretending
  they are deterministic
- source authority profile can remain visible
- JSON would add clarity rather than premature machinery

## Relationship to executable tests

Executable tests remain out of scope.

These notes do not define deterministic inputs, outputs, assertions, or test
harness behavior. Executable tests should wait until manual review shape is
stable and user/PM separately approves that direction.

## Relationship to P4 read-only PerspectiveSnapshot implementation

P4 `PerspectiveSnapshot` implementation remains blocked pending separate scope
and approval.

These notes may help clarify what future reviews should preserve if P4
implementation is ever discussed. They do not approve projection logic,
runtime code, schema, API, UI, ChatGPT App tools, or any implemented
`PerspectiveSnapshot` behavior.

## Relationship to P5 RuleCandidate / PromotedRule work

P5 `RuleCandidate` and `PromotedRule` work remains out of scope.

These notes do not approve rule candidates, promoted rules, vector providers,
automatic scoring thresholds, or rule promotion. P5 work would require
separate fixture coverage, separate governance review, and separate
implementation scope.

## Open questions

- Should a small refinement PR update the accepted Markdown fixture baseline?
- Which refinement should be applied first if only one is chosen?
- Should reviewed-artifact-type guidance live in the fixture baseline, the
  review report template, or both?
- What user/PM signal would justify creating a cumulative review log instead
  of continuing with standalone review report documents by default?
- How should stale or unavailable external refs be represented without
  over-structuring the fixture format?
- What user/PM signal would be sufficient to start a separate JSON fixture
  shape discussion?

## Next suggested goal

Decide whether to stop refinement here and keep using the current manual
review baseline, or explicitly approve a separate JSON fixture shape discussion.

## Final summary

The current Markdown fixture set remains accepted as the manual review
baseline.

Optional refinements are useful, especially before any JSON fixture design
discussion, but they are not required before using the current baseline for
manual review.

The repeated-review location default is standalone review report documents by
default. The accepted baseline fixture file is not a running review log. PR
comments are discussion aids, not canonical long-term record unless separately
decided. A cumulative review log requires separate user/PM decision.

The next safe step after this refinement is to stop refinement and keep using
the current manual review baseline, unless user/PM explicitly approves a
separate JSON fixture shape discussion.

JSON fixture design is not the automatic next step. P4 implementation is not
recommended or approved. Runtime/schema/API/UI/App work and P5
`RuleCandidate` / `PromotedRule` work remain out of scope.
