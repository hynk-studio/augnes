# Temporal Interpretation Implementation Readiness Checklist

## Status and scope

- Type: Implementation readiness checklist
- Phase: post-P4 design, pre-implementation
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: readiness review only

This checklist is a review artifact. It is not canonical runtime authority, not
an API contract, not schema, not a fixture, not an executable test, and not
approval to implement `PerspectiveSnapshot` projection.

This document exists to decide whether the project is ready to move toward a
future read-only `PerspectiveSnapshot` projection, or whether actual fixture
format and review fixtures must come first.

## Source documents reviewed

- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
- `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_TEST_DESIGN_NOTES.md`
- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_SNAPSHOT_DESIGN.md`
- `docs/TEMPORAL_INTERPRETATION_MINIMUM_P4_FIXTURE_DRAFTS.md`

## Current completed design artifacts

- P0 development memo describing temporal interpretation as a regulated,
  evidence-anchored interpretive state rather than runtime authority.
- P2 probe scenarios covering consistency, context carry-forward, revision
  explanation, user-facing helpfulness, summary drift, counterexamples,
  factuality boundaries, axis proliferation, and authority boundaries.
- P3 `RawEpisodeBundle` design describing derived evidence grouping over
  existing Augnes Core records and external refs.
- Fixture/test design notes describing future fixture categories, common
  fields, failure signals, and non-authority cautions.
- P4 read-only `PerspectiveSnapshot` design describing conceptual visibility
  requirements for a future derived view.
- Minimum P4 fixture drafts in Markdown form, including prior staged
  progression, summary drift, revision after objection, user preference versus
  factuality, axis proliferation, explanation fidelity, and tension
  preservation.

## Current missing artifacts

- No actual review fixture set has been accepted as the next review artifact.
- No fixture file naming, location, or format decision has been made.
- No JSON fixture format exists.
- No executable tests exist for temporal interpretation.
- No runtime `RawEpisodeBundle` projection exists.
- No runtime `PerspectiveSnapshot` projection exists.
- No `RuleCandidate`, `PromotedRule`, or rule-promotion implementation exists.
- No schema tables or migrations exist for raw episodes, snapshots, rule
  candidates, or promoted rules.
- No API routes, Cockpit UI, ChatGPT App tools, or Control Packet changes
  exist for this track.
- No automatic scoring thresholds, promotion gates, or vector-provider logic
  have been approved.

## Required readiness questions before P4 implementation

- Has a human-readable fixture format been selected, or are fixture drafts
  still only conceptual?
- Are Markdown review fixtures sufficient for the next step, or is a JSON
  fixture shape required first?
- Which fixture cases are blockers before any read-only projection can be
  scoped?
- Which source refs must every fixture include to avoid summary-only support?
- How will reviewers mark pass, fail, missing evidence, partial support, and
  blocked implementation?
- What is the minimum review output needed before implementation can be
  considered?
- Who can judge whether fixture coverage is sufficient?
- What evidence would justify moving from fixture review to read-only
  projection design implementation?
- What evidence would still block implementation even if the fixture format is
  accepted?

## RawEpisodeBundle evidence-anchor requirements

A future `RawEpisodeBundle` must remain a derived evidence bundle over existing
records and external refs. Before implementation, reviewers should confirm that
the bundle can show:

- raw, proof/trace, committed-state, and external evidence refs
- source record categories and authority limits
- scope, time window, work/session/target boundaries where relevant
- included and excluded refs
- bundle boundary rationale
- user corrections, objections, skipped checks, failed assumptions, and
  rejected proposals
- counterexample and non-applicability refs
- tension refs and residual uncertainty
- summary refs only as retrieval aids or drift targets, not evidence anchors

A bundle that cannot distinguish evidence from summary is not ready to support
`PerspectiveSnapshot`.

## PerspectiveSnapshot visibility requirements

A future read-only `PerspectiveSnapshot` must make the following visible before
any projection is implemented:

- current interpretation
- active prior context
- evidence anchors
- source authority profile
- active interpretive drivers
- fixed-axis influence summary when useful
- residual tensions
- suppressed alternatives
- counterexamples and non-applicability cases
- summary drift warnings
- revision explanation
- user-facing safe next step
- non-authority boundary
- missing evidence warnings

The snapshot must be derived, bounded, read-only, and explicitly non-authority.
It must not create durable state, approve work, record proof, promote rules, or
execute any workflow.

## Summary drift / counterexample / residual tension / explanation fidelity requirements

Before implementation, the fixture set should demonstrate that temporal
interpretation can preserve:

- summary drift warnings when a summary drops conditions or replaces evidence
- raw anchors for any claim that shapes interpretation
- counterexamples next to broad interpretations or candidate rules
- non-applicability cases that narrow scope
- residual tensions rather than smoothing them into a polished narrative
- suppressed alternatives without treating them as false or permanently
  rejected
- revision explanations that identify what changed, why it changed, and what
  stayed stable
- user-facing rationale that matches the actual evidence path and active
  drivers

A fluent explanation without these properties should be treated as a failure,
not as evidence of readiness.

## Source authority profile requirements

Future fixtures and any later projection must preserve source authority
distinctions. A readiness review should confirm that sources are not flattened
into generic memory.

At minimum, reviewers should be able to distinguish:

- raw user or session evidence
- proof/trace evidence
- committed-state evidence
- external evidence refs such as PRs, commits, and test outputs
- handoff guidance
- interpretation-only records
- summaries and retrieval aids
- narrator-layer or self-narrative text

`interpretation_only` records, summaries, and narrator-layer claims may help
find evidence. They must not satisfy evidence-anchor requirements by
themselves.

## User / reviewer / Codex visibility considerations

User-facing output should make the current recommendation, evidence anchors,
uncertainty, residual tensions, and safe next step legible without exposing raw
vector math or false precision.

Reviewer-facing output should show more diagnostic detail, including evidence
paths, source authority profile, missing refs, summary drift risks,
counterexamples, and explanation-fidelity checks.

Codex-facing work instructions should keep implementation boundaries explicit:
docs and review artifacts may be edited in this phase, but runtime, schema,
API, UI, App, and test implementation remain out of scope unless separately
approved.

## Non-authority boundary

This checklist does not:

- approve implementation
- grant runtime authority
- define schema
- define an API contract
- define JSON fixture shape
- define executable test expectations
- create a source of truth
- promote any rule
- change the Control Packet
- change the repo-level next goal
- change onboarding or governance authority

The checklist may inform a future decision. It is not the decision.

## Explicit forbidden work in this PR

This PR must not:

- edit `schema.sql`
- edit `lib/db.ts`
- edit runtime TypeScript
- add API routes
- add Cockpit UI
- add ChatGPT App tools
- add Control Packet changes
- add `raw_episode`, `PerspectiveSnapshot`, `RuleCandidate`, or `PromotedRule`
  tables
- add JSON fixtures
- add executable tests
- add automatic scoring thresholds
- implement rule promotion
- change `DEVELOPMENT_ONBOARDING.md`
- change the current repo-level next goal

## Go / conditional-go / no-go criteria

### Go for future read-only projection scoping

Only consider scoping a future read-only projection when all of the following
are true:

- Fixture format is chosen and reviewed.
- Minimum fixture set exists as actual review fixtures, not only design notes.
- Evidence-anchor requirements are demonstrably satisfiable.
- Snapshot visibility requirements are reviewable against fixtures.
- Summary drift, counterexample, residual tension, and explanation fidelity
  failures are represented in fixtures.
- Source authority profiles are visible and not flattened.
- Reviewers agree that the projection remains derived, bounded, read-only, and
  non-authority.

### Conditional go for fixture work

Proceed with fixture work if reviewers agree that:

- Markdown review fixtures are the next safest artifact.
- Fixture pass/fail review can remain manual for now.
- JSON and executable tests should wait until the human review shape is stable.
- Runtime/schema/API/UI/App implementation remains forbidden during fixture
  work.

### No-go for runtime/schema/API/UI/App implementation

Do not proceed with implementation if any of the following are true:

- Fixture format is undecided.
- Review fixtures do not exist.
- Evidence anchors are summary-only or missing.
- Counterexamples, tensions, or missing evidence warnings are not visible.
- Source authority levels are collapsed.
- User-facing rationale cannot be checked against the evidence path.
- The implementation would create durable state, API behavior, UI/App surface,
  or rule-promotion logic before readiness review is complete.

## Recommended next step

The current state is not ready for runtime/schema/API/UI/App implementation.

The next safe step is readiness review and/or fixture-format decision, likely
starting with Markdown review fixtures before JSON or executable tests.

Recommended immediate action:

- Decide whether to create actual Markdown review fixtures from
  `docs/TEMPORAL_INTERPRETATION_MINIMUM_P4_FIXTURE_DRAFTS.md`.
- Keep JSON fixtures, executable tests, runtime projection, schema, API,
  Cockpit UI, ChatGPT App tools, and rule promotion out of scope until the
  review fixture format is accepted.

## Relationship to future doc index

This checklist may be added to a future temporal interpretation doc index or
repo-level index after the project decides how to present the track. This PR
does not update any index by itself because the requested scope is one new
document only.

Future index work should preserve the distinction between:

- design memos
- probe scenarios
- evidence-bundle design
- fixture/test planning
- snapshot design
- fixture drafts
- readiness checklist
- actual fixtures or executable tests, if later approved

## Open questions

- Should actual review fixtures be Markdown files, a single Markdown document,
  JSON fixtures, or a staged Markdown-to-JSON path?
- Who is responsible for accepting fixture coverage before implementation is
  scoped?
- Which minimum P4 fixture drafts are blockers versus advisory cases?
- What review status labels should be used for fixture results?
- Should source authority profile be reviewed per fixture, per bundle, or per
  snapshot?
- What minimum evidence refs are required before a user-facing safe next step
  can be generated?
- How should stale or unavailable external refs be represented?
- When, if ever, should automatic scoring thresholds be considered?
- What governance decision would be required before `RuleCandidate` or
  `PromotedRule` implementation enters scope?
- Where should this checklist appear if a temporal interpretation doc index is
  created later?
