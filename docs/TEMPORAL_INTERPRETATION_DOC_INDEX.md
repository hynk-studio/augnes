# Temporal Interpretation Document Index

## Status and purpose

- Type: Track index / roadmap
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: document navigation and roadmap only

This index is the entrypoint for the temporal interpretation document set. It
helps future ChatGPT sessions, Codex sessions, and human reviewers understand
what each document is for, how the phases relate, what the current boundary is,
and why the track is still not ready for runtime/schema/API/UI/App
implementation.

This index does not approve implementation. It does not define schema, API,
fixtures, tests, runtime projection, UI, ChatGPT App tools, `RuleCandidate`
runtime, or `PromotedRule` runtime.

## Current one-line summary

Temporal interpretation is currently a design and review track only; the next
safe step is fixture-format decision and likely actual Markdown review
fixtures, not runtime/schema/API/UI/App implementation.

## Document map table

| Path | Phase | Role | Allowed use | Forbidden interpretation | Next-step relationship |
| --- | --- | --- | --- | --- | --- |
| `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md` | P0: development memo | Defines the initial product and governance framing for temporal interpretation as a regulated interpretive state. | Use as the conceptual baseline for evidence-anchored, revisable interpretation and non-authority framing. | Do not treat it as canonical law, runtime design approval, schema, API, UI, or rule-promotion authority. | Feeds P2 probes and establishes the original boundary language. |
| `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md` | P2: probe scenarios | Turns the P0 ideas into review scenarios and failure modes. | Use to evaluate whether temporal interpretation could be useful, evidence-anchored, user-facing, and bounded. | Do not treat scenarios as executable tests, accepted fixtures, runtime behavior, or implementation approval. | Feeds P3 RawEpisodeBundle design and later fixture/test planning. |
| `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md` | P3: RawEpisodeBundle design | Designs the evidence-anchor lens over existing Augnes records and external refs. | Use to reason about source refs, bundle boundaries, authority profiles, counterexamples, and summary-vs-evidence separation. | Do not treat it as a `raw_episode` table, durable store, JSON fixture format, API contract, or implemented projection. | Feeds pre-P4 fixture/test notes and P4 snapshot visibility requirements. |
| `docs/TEMPORAL_INTERPRETATION_FIXTURE_TEST_DESIGN_NOTES.md` | pre-P4: fixture/test design notes | Describes future fixture categories, common fields, failure signals, and test principles. | Use to decide what future fixtures must prove before read-only projection or rule experiments. | Do not treat it as actual fixtures, JSON, executable tests, automatic scoring thresholds, or runtime gates. | Feeds P4 PerspectiveSnapshot design and minimum P4 fixture drafts. |
| `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_SNAPSHOT_DESIGN.md` | P4 design: PerspectiveSnapshot design | Defines a future read-only derived view shape and visibility requirements. | Use to review what a future snapshot must show: evidence anchors, active context, tensions, counterexamples, authority profile, drift warnings, and safe next step. | Do not treat it as implementation, API contract, schema, UI, App tool, source of truth, or approval to project snapshots. | Feeds post-P4 fixture drafts and readiness review. |
| `docs/TEMPORAL_INTERPRETATION_MINIMUM_P4_FIXTURE_DRAFTS.md` | post-P4: minimum P4 fixture drafts | Drafts the minimum human-review fixture cases needed before read-only projection is implemented. | Use as concrete Markdown draft material for future review fixtures. | Do not treat drafts as actual accepted fixtures, JSON fixtures, executable tests, or runtime pass criteria. | Feeds fixture-format decision and readiness checklist review. |
| `docs/TEMPORAL_INTERPRETATION_IMPLEMENTATION_READINESS_CHECKLIST.md` | post-P4 / pre-implementation: implementation readiness checklist | Lists readiness questions, missing artifacts, evidence-anchor requirements, no-go criteria, and the recommended next step. | Use to decide whether implementation can even be considered, or whether fixture-format/review-fixture work must happen first. | Do not treat it as canonical runtime authority, implementation approval, schema, API contract, fixture, executable test, or promotion gate. | Points to the next step: actual fixture format decision and likely Markdown review fixtures. |

## Phase map

- P0: development memo establishes the concept, vocabulary, and non-authority
  boundary.
- P2: probe scenarios make the concept reviewable through concrete success and
  failure cases.
- P3: RawEpisodeBundle design specifies evidence anchoring over existing
  records and external refs.
- pre-P4: fixture/test design notes define what future fixtures and tests must
  prove before runtime behavior exists.
- P4 design: PerspectiveSnapshot design defines a future read-only derived view
  and visibility requirements.
- post-P4: minimum P4 fixture drafts make future human-review fixtures
  concrete, but still not actual fixtures.
- post-P4 / pre-implementation: implementation readiness checklist records why
  the track is not ready for runtime/schema/API/UI/App implementation.
- next: decide actual fixture format and create Markdown review fixtures for
  the minimum P4 fixture set.

## Reading order

1. Read the P0 development memo to understand the core claim and boundary.
2. Read the P2 probes to understand what temporal interpretation must handle
   and how it can fail.
3. Read the P3 RawEpisodeBundle design to understand evidence anchoring.
4. Read the pre-P4 fixture/test notes to understand future validation needs.
5. Read the P4 PerspectiveSnapshot design to understand the read-only view
   being considered.
6. Read the minimum P4 fixture drafts to understand the first concrete review
   cases.
7. Read the implementation readiness checklist to decide whether implementation
   is blocked or whether fixture work can proceed.
8. Use this index to orient future sessions and keep the next step scoped.

## Concept map

- Temporal interpretation: the broader product/review track for temporally
  consistent, context-aware, revisable interpretation.
- Rule-Governed Self-Graph Perspective: the framing that treats perspective as
  a governed interpretive state over evidence, context, tensions, and update
  history.
- RawEpisodeBundle: a future derived evidence bundle concept over existing
  records and external refs; it is not a new source of truth.
- EpisodeSummary: a retrieval or compression aid; it may help locate evidence
  but must not replace raw anchors.
- PerspectiveSnapshot: a future derived, bounded, read-only interpretive view;
  it must show evidence, tensions, counterexamples, authority limits, and safe
  next step.
- RuleCandidate: a future hypothesis about how interpretation might be shaped;
  it is not a rule and is not implemented.
- PromotedRule: a future conditional governance concept; no promotion path is
  implemented or approved.
- Fixture drafts: concrete review situations, still not accepted fixtures,
  JSON, or executable tests.
- Readiness checklist: a review gatekeeper artifact that currently says the
  track is not ready for implementation.

## Authority and non-authority boundaries

All current temporal interpretation documents are documentation-only review
artifacts. They grant no runtime authority and do not change Augnes governance,
schema, API, UI, App tools, Control Packet behavior, onboarding, or the
repo-level next goal.

The current documents may be used to:

- orient future reviewers and sessions
- preserve the design lineage
- identify required evidence anchors
- identify missing artifacts
- decide the next review artifact
- block premature implementation

The current documents may not be used to:

- approve runtime implementation
- create or change schema
- define API behavior
- add UI or ChatGPT App surfaces
- create Control Packet authority
- create actual fixtures or tests by implication
- promote rules
- treat summaries or narrator text as source of truth
- claim PerspectiveSnapshot projection is ready

## Current completed artifacts

- P0 temporal interpretation development memo.
- P2 probe scenario document.
- P3 RawEpisodeBundle design.
- pre-P4 fixture/test design notes.
- P4 PerspectiveSnapshot design.
- post-P4 minimum P4 fixture drafts.
- post-P4 / pre-implementation readiness checklist.
- This index/roadmap document.

## Current missing artifacts

- Actual fixture-format decision.
- Accepted Markdown review fixture files.
- JSON fixture shape.
- JSON fixtures.
- Executable temporal interpretation tests.
- Runtime RawEpisodeBundle projection.
- Runtime PerspectiveSnapshot projection.
- Runtime RuleCandidate implementation.
- Runtime PromotedRule implementation.
- Schema, migration, API route, Cockpit UI, or ChatGPT App surface for this
  track.
- Automatic scoring thresholds or promotion gates.
- Approval authority for any of the above.

## Current no-go implementation boundary

The current state is still not ready for runtime/schema/API/UI/App
implementation.

Until separately approved, do not:

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

## Recommended next step after this index

Decide the actual fixture format and create Markdown review fixtures for the
minimum P4 fixture set.

The recommended path is:

1. Choose whether the first accepted fixtures are one Markdown document or
   multiple Markdown fixture files.
2. Convert the minimum P4 fixture drafts into actual Markdown review fixtures.
3. Define manual review statuses such as pass, fail, missing evidence,
   partial support, blocked, and needs judgment.
4. Use fixture review results to decide whether JSON fixtures or executable
   tests should be designed later.

## Relationship to future fixture work

This index does not create fixtures. It points reviewers toward the fixture
decision now required by the readiness checklist.

Future fixture work should begin with Markdown review fixtures unless user/PM
judgment selects a different format. Markdown review fixtures are the safest
next artifact because they keep evidence anchors, counterexamples, tensions,
authority profiles, and reviewer judgment visible before any JSON or
executable representation hardens the shape.

JSON fixtures and executable tests remain out of scope until the human review
fixture shape is accepted.

## Relationship to future P4 read-only PerspectiveSnapshot implementation

P4 implementation is not approved by this index. A future read-only
`PerspectiveSnapshot` projection should only be considered after actual review
fixtures show that a snapshot can preserve:

- evidence anchors
- active prior context
- source authority profile
- summary drift warnings
- residual tensions
- suppressed alternatives
- counterexamples and non-applicability cases
- revision explanation
- missing evidence warnings
- user-facing safe next step
- explicit non-authority boundary

Even then, any implementation would need a separately scoped PR and review. It
would need to remain derived, bounded, read-only, and non-authority.

## Relationship to future P5 RuleCandidate / PromotedRule work

P5 `RuleCandidate` or `PromotedRule` work is further out of scope than P4
read-only snapshot work.

Future P5 work would require, at minimum:

- accepted fixture evidence
- explicit scope boundaries
- counterexample handling
- source authority profile handling
- summary drift protection
- duplicate/rule bloat controls
- review of promotion gates
- separate governance approval
- separate implementation scope

No current document authorizes runtime rule candidates, promoted rules, vector
providers, automatic scoring thresholds, or rule promotion.

## Open questions

- Should actual review fixtures be one Markdown document or multiple Markdown
  fixture files?
- Which minimum P4 fixture drafts are blockers before any P4 implementation
  can be scoped?
- What review statuses should actual Markdown fixtures use?
- Who can approve fixture coverage as sufficient?
- Should fixture review results be recorded in docs only, issue comments, PR
  review, or a later structured format?
- What minimum evidence refs must every fixture include?
- How should stale or unavailable external refs be represented?
- When should JSON fixture shape be considered?
- What would justify executable tests after Markdown review fixtures?
- What governance decision would be required before any P5 rule work enters
  scope?

## Final summary

The temporal interpretation track has a coherent design lineage, but it is
still documentation-only. The documents now explain the concept, probes,
evidence-bundle design, fixture/test planning, read-only snapshot design,
minimum fixture drafts, implementation readiness criteria, and this index.

The current state is still not ready for runtime/schema/API/UI/App
implementation. The next safe step after this index is fixture-format decision
and likely actual Markdown review fixtures. JSON fixtures, executable tests,
runtime projection, schema, API, Cockpit UI, ChatGPT App tools,
`RuleCandidate` runtime, and `PromotedRule` runtime remain out of scope until
separately approved.
