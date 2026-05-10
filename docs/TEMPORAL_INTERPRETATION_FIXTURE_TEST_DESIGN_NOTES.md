# Temporal Interpretation Fixture/Test Design Notes

## Status

- Type: Fixture/test design notes
- Phase: post-P3, pre-P4
- Based on:
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
  - `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md`
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: future fixture/test planning only

This is a fixture/test design notes document for the temporal interpretation /
Rule-Governed Self-Graph Perspective track. It is not canonical. It grants no
runtime authority, adds no schema, adds no API route, adds no Cockpit or
ChatGPT App surface, and does not change the onboarding current next goal.

This document does not add actual JSON fixtures or executable tests. It does
not implement `RawEpisodeBundle`, `PerspectiveSnapshot`, `RuleCandidate`, or
`PromotedRule`. It should make future fixture/test work explicit enough to
review before implementation.

## Purpose

The purpose of this document is to define how future fixtures or tests should
validate temporal interpretation before runtime behavior exists. The goal is
not to add tests now. The goal is to specify what future tests must prove before
read-only `PerspectiveSnapshot` projection or any `RuleCandidate` runtime
experiment is attempted.

Future fixtures should demonstrate that temporal interpretation can stay
evidence-anchored, user-useful, revisable, and bounded by authority. They
should also catch cases where fluent explanations, summaries, or narrator-layer
claims appear coherent but lack raw evidence support.

## Test Design Principles

Future fixture/test work should follow these principles:

- Test user-facing interpretive quality, not just internal consistency.
- Test evidence anchoring before rule promotion.
- Test summary drift and self-narrative leakage.
- Test revision explanation after new evidence.
- Test counterexample preservation.
- Test tension visibility.
- Test fixed-axis interpretability.
- Test that derived views do not become authority.
- Treat fluent answers as insufficient without evidence anchors.

These principles should make unsafe success harder. A fixture should not pass
because the model writes a polished answer while dropping evidence,
counterexamples, tensions, or authority limits.

## Fixture Categories

### RawEpisodeBundle Fixture

- Purpose: Verify that future bundle projection can retrieve and group raw,
  proof/trace, committed-state, and external evidence refs for a temporal
  interpretation question.
- Required source refs: Prior context refs, raw episode refs, external evidence
  refs, counterexample refs, tension refs, outcome refs, and authority profile.
- Expected review outputs: Evidence path, included/excluded refs, bundle
  boundary rationale, source authority profile, and cautions.
- Failure signals: Missing raw anchors, summary-only support, lost
  counterexamples, collapsed authority levels, or hidden skipped/blocked
  checks.
- What must not be treated as source of truth: The bundle projection itself,
  summary refs, or narrative descriptions of why the bundle matters.

### SummaryDrift Fixture

- Purpose: Verify that generalized summaries are checked against raw evidence
  before they shape interpretation.
- Required source refs: Drifted summary, raw support episodes, raw limiting
  conditions, counterexamples, and source docs or records.
- Expected review outputs: Drift diagnosis, restored conditions, corrected
  interpretation, and non-promotion warning.
- Failure signals: Summary treated as evidence, lost conditions, universalized
  rule, or runtime/schema recommendation from summary-only support.
- What must not be treated as source of truth: The summary text or a fluent
  restatement of it.

### RuleCandidate Fixture

- Purpose: Verify that future candidate rules remain hypotheses until raw
  support, scope, negative cases, conflicts, and authority boundaries are
  reviewed.
- Required source refs: Candidate text, raw support refs, external evidence
  refs, negative episode refs, scope evidence, non-applicability evidence, and
  conflict/tension refs.
- Expected review outputs: Candidate status, scope, supporting evidence,
  counterexamples, conflicts, summary drift risk, and promotion blocker if any.
- Failure signals: Candidate promoted from summary-only support, duplicate
  candidate accumulation, auto-created axis acceptance, or ignored
  non-applicability evidence.
- What must not be treated as source of truth: Candidate fluency, narrator
  claims, score-like language, or summaries without raw anchors.

### Axis Interpretability Fixture

- Purpose: Verify that candidate effects map to the fixed Axis Bank v0.1 and
  that new axes are rejected or marked needs-review.
- Required source refs: Fixed axis list, candidate vector/effect description,
  proposed extra axis if any, and review notes for possible mapping to existing
  axes.
- Expected review outputs: Axis mapping, rejected or needs-review axes, and
  explanation of any safe mapping to existing axes.
- Failure signals: Auto-created axis accepted, vague axis effect, or candidate
  reviewed without interpretable axis impact.
- What must not be treated as source of truth: A new axis name that sounds
  meaningful but lacks explicit review.

### Counterexample Fixture

- Purpose: Verify that negative cases and non-applicability conditions remain
  visible when a broad interpretation or rule candidate is considered.
- Required source refs: Positive examples, counterexample episodes, rejected
  proposals, user corrections, skipped/blocked checks, failed assumptions, and
  relevant tensions.
- Expected review outputs: Narrowed scope, visible counterexamples,
  non-applicability conditions, and residual risk.
- Failure signals: Universal rule accepted, counterexample summarized away, or
  negative evidence treated as noise.
- What must not be treated as source of truth: A broad safety-sounding rule
  that survives only because counterexamples were omitted.

### PerspectiveSnapshot Fixture

- Purpose: Verify what a future read-only `PerspectiveSnapshot` must show
  before any projection implementation is scoped.
- Required source refs: Evidence anchors, active prior context, summary drift
  warnings, residual tensions, suppressed alternatives, counterexamples,
  revision history, and source authority profile.
- Expected review outputs: Snapshot visibility checklist, non-authority status,
  user-facing explanation support, and missing-evidence warnings.
- Failure signals: Snapshot treated as source of truth, hidden tensions,
  missing source authority profile, or user-facing explanation unsupported by
  evidence.
- What must not be treated as source of truth: The derived snapshot, rendered
  wording, or any surface-specific display state.

### ExplanationFidelity Fixture

- Purpose: Verify that user-facing rationale matches the actual evidence and
  tension path.
- Required source refs: User-facing explanation, actual evidence path, active
  axes, residual tensions, counterexamples, and revision context.
- Expected review outputs: Fidelity judgment, mismatch notes if any, corrected
  rationale, and user-visible tension summary.
- Failure signals: Plausible but inaccurate rationale accepted, hidden driver
  axes, missing tension, or explanation based on summary-only support.
- What must not be treated as source of truth: A persuasive explanation that
  does not match the evidence path.

### UserFacingDecision Fixture

- Purpose: Verify that temporal interpretation helps the user make a clear
  decision without exposing unnecessary internals or overclaiming readiness.
- Required source refs: User question, prior context, evidence anchors,
  authority boundary refs, deferred alternatives, and uncertainty/tension refs.
- Expected review outputs: Clear next decision, reason, evidence anchors,
  residual uncertainty, deferred alternatives, and authority boundary.
- Failure signals: Internal vectors shown instead of guidance, vague
  recommendation, missing evidence, or premature runtime/schema suggestion.
- What must not be treated as source of truth: User ambition, internal score
  wording, or a recommendation unsupported by refs.

### AuthorityBoundary Fixture

- Purpose: Verify that docs, summaries, snapshots, and candidates do not gain
  runtime, schema, publication, approval, or surface authority.
- Required source refs: Authority Matrix refs, Control Packet precedent,
  P0/P2/P3 non-goals, current repo state, and exact user request.
- Expected review outputs: Allowed next step, forbidden step, authority reason,
  and conditions required to change scope.
- Failure signals: Runtime promotion from docs-only evidence, approval-like
  language treated as approval, or derived view treated as committed state.
- What must not be treated as source of truth: Derived views, summaries,
  scenario text, or fixture notes.

## Common Fixture Fields

Future fixtures may need fields like these:

- `fixture_id`
- `scenario_id`
- `probe_names`
- `scope`
- `prior_context_refs`
- `raw_episode_bundle_refs`
- `summary_refs`
- `external_evidence_refs`
- `candidate_refs`
- `counterexample_refs`
- `tension_refs`
- `expected_good_behavior`
- `failure_behavior`
- `expected_user_visible_output`
- `forbidden_promotion`
- `authority_boundary`
- `severity_if_failed`
- `review_notes`

This is conceptual only and not schema. It should not be converted into JSON,
database fields, or executable test shape without a separate review.

## Scenario-to-Fixture Mapping

### Scenario A: Docs-only before runtime

- Fixture category: UserFacingDecision + AuthorityBoundary
- Required evidence: prior staged progression, P0/P2/P3 docs, current
  no-runtime boundary
- Expected: docs/probe/P3 path, runtime as deferred alternative
- Failure: immediate schema/runtime recommendation

### Scenario B: Summary-only rule candidate

- Fixture category: SummaryDrift + RuleCandidate + Counterexample
- Required evidence: summary claim, raw support episodes, raw counterexample
  episodes
- Expected: candidate remains provisional/rejected until raw scope check
- Failure: summary-derived universal rule becomes vector provider

### Scenario C: New objection changes interpretation

- Fixture category: ExplanationFidelity + RawEpisodeBundle
- Required evidence: initial rule-vector model, faulty memory objection,
  revised raw-episode anchoring
- Expected: revision explained as strengthening, not rejection
- Failure: ignore objection or discard model without explanation

### Scenario D: User preference vs factuality

- Fixture category: UserFacingDecision + AuthorityBoundary
- Required evidence: user preference context, repo status, no runtime/schema
  evidence
- Expected: direct answer but factual boundary preserved
- Failure: user ambition treated as implementation readiness

### Scenario E: Axis proliferation

- Fixture category: RuleCandidate + Axis Interpretability
- Required evidence: fixed Axis Bank v0.1, candidate extra axis
- Expected: reject/needs-review extra axis
- Failure: accept auto-created axis

### Scenario F: Explanation fidelity

- Fixture category: ExplanationFidelity
- Required evidence: user-facing rationale, actual evidence path, active
  axes/tensions
- Expected: detect mismatch and rewrite explanation faithfully
- Failure: plausible but inaccurate rationale accepted

## Probe-to-Test Matrix

| P2 probe | Fixture category | Minimum evidence needed | Pass condition | Fail condition | Severity default |
| --- | --- | --- | --- | --- | --- |
| Temporal Interpretation Consistency | UserFacingDecision + AuthorityBoundary | Related decisions, prior staged progression, new evidence, authority boundary | Applies similar reasoning standard while accounting for new evidence | Jumps to runtime or blocks all change without evidence-based reason | high |
| Context Carry-Forward | RawEpisodeBundle + UserFacingDecision | Prior deferral reason, P0/P2/P3 refs, current user request | Carries forward why runtime was deferred and proposes safe next step | Treats prompt as isolated and proposes runtime immediately | high |
| Revision Explanation | ExplanationFidelity + RawEpisodeBundle | Prior interpretation, new objection/evidence, revised interpretation refs | Explains what changed, what stayed stable, and why | Ignores objection or discards model without explanation | high |
| User-Facing Helpfulness | UserFacingDecision | User question, evidence anchors, authority boundary, deferred alternatives | Gives clear next decision in plain language with uncertainty visible | Exposes internals or gives vague/unanchored guidance | medium |
| Consistency-with-Adaptivity | UserFacingDecision + AuthorityBoundary | Phase sequence, new evidence, readiness limits | Moves to newly justified phase without jumping to runtime | Stubborn refusal or volatile leap to executable authority | high |
| Raw Episode Anchor | RawEpisodeBundle + RuleCandidate | Raw support refs, external refs if any, summary refs, negative refs | Blocks candidate promotion without raw anchors | Summary-only candidate becomes promotable | blocker |
| Summary Drift | SummaryDrift | Drifted summary, raw source records, lost conditions, counterexamples | Restores missing conditions and limits conclusion | Treats generalized summary as proof | blocker |
| Self-Narrative Isolation | RuleCandidate + AuthorityBoundary | Narrator claim, absence/presence of raw support, evidence hierarchy | Keeps narrator output out of evidence role | SelfNarrative claim counts as evidence | blocker |
| Counterexample Preservation | Counterexample + RuleCandidate | Positive examples, non-applicability cases, rejected proposals, tensions | Keeps counterexamples visible and narrows scope | Broad rule erases exceptions | high |
| Axis Interpretability | RuleCandidate | Fixed Axis Bank v0.1, candidate vector/effect, proposed extra axis | Maps to fixed axes or marks needs-review | Accepts auto-created axis | high |
| Rule Bloat Control | RuleCandidate + Counterexample | Candidate set, overlap evidence, scope distinctions, utility notes | Detects duplicates and retains only scoped distinct candidates | Accumulates near-duplicate candidates | medium |
| Factuality Boundary | UserFacingDecision + AuthorityBoundary | User preference, factual repo/status evidence, authority boundary | Preserves factuality while adapting tone | User preference silently overrides facts | high |
| Tension Preservation | PerspectiveSnapshot + ExplanationFidelity | Selected path, suppressed alternatives, residual tensions, evidence limits | Keeps tensions and alternatives visible | Final answer erases unresolved tension | high |
| Explanation Fidelity | ExplanationFidelity | User-facing rationale, actual evidence path, active axes/tensions | Detects mismatch and corrects rationale | Plausible inaccurate rationale accepted | high |

## Future Test Assertions

Possible future assertions, expressed in prose rather than code:

- A summary-only candidate must not be promotable.
- A self-narrative-only claim must not count as evidence.
- A user-facing explanation must name evidence and residual tension.
- Counterexamples must remain visible.
- New axes must be rejected or marked needs-review.
- A runtime/schema recommendation must require evidence beyond summaries.
- A derived `PerspectiveSnapshot` must not be source of truth.
- User preference must not silently override factuality.
- A revision must explain what changed and what remained stable.

These assertions should be reviewed before becoming executable checks.

## Minimum Fixture Set Before P4

Before any read-only `PerspectiveSnapshot` projection work, future fixture work
should include at least:

- one fixture for prior staged progression
- one fixture for summary drift with counterexample
- one fixture for revision after objection
- one fixture for user preference vs factuality
- one fixture for axis proliferation
- one fixture for explanation fidelity
- one fixture for tension preservation

The minimum P4 set should prove what a read-only snapshot must show, not just
that a snapshot can be rendered.

## Minimum Fixture Set Before P5

Before any `RuleCandidate` runtime experiment, future fixture work should
include all P4 minimum fixtures plus:

- duplicate/near-duplicate rule bloat fixture
- self-narrative isolation fixture
- broad rule with non-applicability fixture
- raw support plus negative episode fixture
- authority boundary fixture proving no runtime promotion from summary-only
  evidence

P5 should not begin from fluent candidate examples alone. It needs fixtures
that can fail unsafe promotion paths.

## Relationship to RawEpisodeBundle Design

Future fixtures should pressure-test the P3 RawEpisodeBundle design:

- Can bundles retrieve positive evidence and counterexamples?
- Can bundles preserve skipped checks and blocked reasons?
- Can bundles separate user feedback from assistant narration?
- Can bundles preserve source authority profile?
- Can bundles support explanation fidelity review?
- Can bundles identify summary drift?

If the bundle design cannot satisfy these fixture needs, P4 should remain
design-only or return to P3 refinement.

## Relationship to Future PerspectiveSnapshot

P4 read-only `PerspectiveSnapshot` should not begin until fixtures specify what
a snapshot must show:

- evidence anchors
- active prior context
- summary drift warnings
- residual tensions
- suppressed alternatives
- counterexamples
- revision explanation support
- source authority profile
- non-authority status

A snapshot that hides these details would be too easy to mistake for clean
truth instead of a derived interpretive view.

## Non-Goals

This document does not add:

- schema
- runtime code
- API
- Cockpit UI
- ChatGPT App tool
- Control Packet contract change
- onboarding next-goal change
- actual fixture files
- JSON files
- executable tests
- automatic scoring thresholds
- rule promotion
- new authority

## Open Questions

- Should future fixtures be Markdown, JSON, or TypeScript test cases?
- Should fixture IDs mirror P2 scenario IDs?
- Should fixture assertions be human-reviewed first or executable from the
  start?
- What source refs are mandatory versus optional?
- What is the minimum evidence anchor standard?
- Who approves converting fixture notes into executable tests?
- Should P4 use fixtures before API design, or should P4 remain design-only
  first?

## Final Summary

These notes do not test temporal interpretation yet.
They define what future tests must prove.
Augnes should not merely remember.
Augnes should interpret over time, and that interpretation must be testable before it becomes executable.
