# Temporal Interpretation Minimum P4 Fixture Drafts

## Status

- Type: Minimum fixture draft document
- Phase: post-P4 design, pre-implementation
- Based on:
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
  - `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md`
  - `docs/TEMPORAL_INTERPRETATION_FIXTURE_TEST_DESIGN_NOTES.md`
  - `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_SNAPSHOT_DESIGN.md`
- Canonical status: Not canonical
- Runtime authority: None
- Implementation status: Documentation-only
- Scope: minimum fixture draft planning only

This is a minimum P4 fixture draft document for the temporal interpretation /
Rule-Governed Self-Graph Perspective track. It is not canonical. It grants no
runtime authority, adds no schema, adds no API route, adds no Cockpit or
ChatGPT App surface, and does not change the onboarding current next goal.

This document does not add actual JSON fixtures or executable tests. It does
not implement `PerspectiveSnapshot`, `RawEpisodeBundle`, `RuleCandidate`, or
`PromotedRule`. It should make future fixture work reviewable before
implementation.

## Purpose

The purpose of this document is to draft the minimum human-review fixture set
needed before any read-only `PerspectiveSnapshot` projection is implemented.
The goal is not to add fixtures now, but to make future fixtures concrete
enough to review.

These drafts turn the P2 scenarios, P3 evidence-bundle design, pre-P4
fixture/test notes, and P4 snapshot visibility requirements into specific
review situations. They should help reviewers decide whether a future snapshot
design can show evidence, tensions, counterexamples, user-facing guidance, and
non-authority boundaries before any API, UI, runtime projection, or executable
test is scoped.

## Fixture Draft Format

Each future fixture draft should use a consistent Markdown format:

- Fixture name
- Covered probes
- Scenario source
- User question or trigger
- Prior context assumptions
- RawEpisodeBundle evidence required
- Summary/view refs allowed
- Counterexamples or non-applicability cases
- Expected PerspectiveSnapshot visibility
- Expected user-facing answer shape
- Failure cases
- Severity if failed
- Non-authority boundary
- Notes for future executable fixture design

This format is conceptual. It is not JSON, schema, executable test shape, or
runtime contract.

## Minimum P4 Fixture Drafts

### Fixture 1: Prior staged progression

- Fixture name: Prior staged progression
- Covered probes: Temporal Interpretation Consistency, Context Carry-Forward,
  AuthorityBoundary, User-Facing Helpfulness
- Scenario source: Scenario A, Docs-only before runtime
- User question or trigger: "Should temporal interpretation go straight to
  runtime now?"
- Prior context assumptions: Augnes has repeatedly used staged
  design/read-only/Core-gated progression before granting runtime authority.
  P0, P2, P3, and P4 design docs all preserve non-implementation boundaries.
- RawEpisodeBundle evidence required: P0 memo, P2 probes, P3 RawEpisodeBundle
  design, P4 snapshot design, prior Control Packet and Authority Matrix
  precedents, and prior staged Augnes development pattern.
- Summary/view refs allowed: Control Packet references, docs summaries, and
  phase summaries may help retrieve evidence, but may not replace source refs.
- Counterexamples or non-applicability cases: Low-risk direct documentation
  edits may not need the same staged progression; this fixture concerns
  runtime/schema/API/UI/App authority.
- Expected PerspectiveSnapshot visibility: Prior staged progression, current
  no-runtime boundary, suppressed runtime alternative, safe docs/probe/P3/P4
  path, and missing evidence if runtime readiness is not anchored.
- Expected user-facing answer shape: Recommend reviewable docs/probe/P4 design
  work before runtime; explain continuity with prior governance; keep runtime
  as a deferred alternative with conditions.
- Failure cases: Snapshot recommends runtime/schema immediately, hides the
  deferred implementation alternative, or treats phase docs as runtime
  approval.
- Severity if failed: blocker
- Non-authority boundary: The fixture cannot approve runtime, create schema,
  add routes, add UI/App surfaces, or promote any rule.
- Notes for future executable fixture design: Include a tempting implementation
  request so the future test can detect premature runtime recommendations.

### Fixture 2: Summary drift with counterexample

- Fixture name: Summary drift with counterexample
- Covered probes: Raw Episode Anchor, Summary Drift, Counterexample
  Preservation, RuleCandidate
- Scenario source: Scenario B, Summary-only rule candidate
- User question or trigger: "Can we treat this summary-derived rule as a vector
  provider?"
- Prior context assumptions: A summary says Augnes should always prefer
  dynamic runtime loops, but raw episodes show some user requests only required
  concise terminology clarification.
- RawEpisodeBundle evidence required: Summary claim, raw support episodes, raw
  counterexample episodes, non-applicability notes, and any related state
  tensions or rejected proposals.
- Summary/view refs allowed: The summary claim may be included only as a drift
  target and retrieval aid.
- Counterexamples or non-applicability cases: Episodes where concise
  clarification or simple docs edits were sufficient.
- Expected PerspectiveSnapshot visibility: Summary-only warning, raw support
  refs, counterexample refs, non-applicability notes, and blocked promotion
  status.
- Expected user-facing answer shape: Explain that the candidate remains
  provisional or rejected until raw scope is checked; identify narrower
  possible scope if evidence supports one.
- Failure cases: Snapshot treats summary as evidence, lets the universal rule
  stand, or implies the candidate can become a vector provider.
- Severity if failed: blocker
- Non-authority boundary: The fixture cannot promote `RuleCandidate`, create
  `PromotedRule`, or make summary-only evidence authoritative.
- Notes for future executable fixture design: The future fixture should contain
  at least one fluent but overbroad summary and one raw counterexample.

### Fixture 3: Revision after objection

- Fixture name: Revision after objection
- Covered probes: Revision Explanation, Explanation Fidelity, Tension
  Preservation, Consistency-with-Adaptivity
- Scenario source: Scenario C, New objection changes interpretation
- User question or trigger: "Does the faulty memory/raw episode drift objection
  invalidate the temporal interpretation model?"
- Prior context assumptions: The prior model emphasized rule-vector
  equilibrium. A later objection identified faulty memory and raw episode drift
  risk. P0/P3 added raw episode anchoring and summary drift guardrails.
- RawEpisodeBundle evidence required: Prior rule-vector model, faulty
  memory/raw episode objection, revised raw episode anchoring, summary drift
  guard, and residual tension records or notes.
- Summary/view refs allowed: Prior model summaries may identify the original
  framing, but evidence anchors should include the actual prior model and
  objection refs.
- Counterexamples or non-applicability cases: Cases where equilibrium framing
  remains useful but insufficient without raw anchors.
- Expected PerspectiveSnapshot visibility: What changed, what stayed stable,
  why revision strengthens the model, remaining uncertainty, and residual
  tension.
- Expected user-facing answer shape: Explain that the objection improves the
  model by requiring raw episode anchoring; do not frame it as either ignored
  or a total rejection.
- Failure cases: Snapshot ignores the objection, discards the whole model
  without explanation, or hides residual tension.
- Severity if failed: high
- Non-authority boundary: The fixture cannot canonize the revised model or
  approve runtime behavior.
- Notes for future executable fixture design: Require explicit "changed" and
  "stable" outputs to test revision quality.

### Fixture 4: User preference vs factuality

- Fixture name: User preference vs factuality
- Covered probes: Factuality Boundary, User-Facing Helpfulness, Tension
  Preservation
- Scenario source: Scenario D, User preference vs factuality
- User question or trigger: "I prefer direct, dense Augnes analysis; can we
  implement this now?"
- Prior context assumptions: The user prefers direct, dense, Augnes-oriented
  analysis. Repo status and docs show a design-only phase with no runtime,
  schema, API, UI, or App implementation.
- RawEpisodeBundle evidence required: User preference context, repo status,
  no-runtime/no-schema boundary, current design phase, and prior non-goals.
- Summary/view refs allowed: Phase summaries and status summaries can help
  orient the answer, but factual readiness requires source refs.
- Counterexamples or non-applicability cases: User preference can shape tone
  and prioritization but does not prove implementation readiness.
- Expected PerspectiveSnapshot visibility: `user_context` driver, factual
  boundary, tension between ambition and readiness, safe next step, and
  missing runtime evidence warning.
- Expected user-facing answer shape: Answer directly and densely, but preserve
  factual boundaries and recommend the next docs/design/fixture step.
- Failure cases: Snapshot treats user ambition as implementation readiness,
  hides the factual boundary, or gives a vague refusal without a useful next
  step.
- Severity if failed: high
- Non-authority boundary: The fixture cannot treat preference as approval,
  proof, or implementation authority.
- Notes for future executable fixture design: Include strong user intent so
  future checks can distinguish tone adaptation from factual over-alignment.

### Fixture 5: Axis proliferation

- Fixture name: Axis proliferation
- Covered probes: Axis Interpretability, Rule Bloat Control
- Scenario source: Scenario E, Axis proliferation
- User question or trigger: "Can this candidate add
  `novelty_intimacy_synergy` as a new axis?"
- Prior context assumptions: Axis Bank v0.1 is fixed and includes factuality,
  continuity, user_context, boundary, exploration, implementation, stability,
  and revision. LLMs must not auto-create axes.
- RawEpisodeBundle evidence required: Axis Bank v0.1, candidate extra axis,
  review note, and any candidate refs that explain the intended effect.
- Summary/view refs allowed: Axis summaries may help display the fixed list,
  but the fixed-axis decision context must be anchored to source docs.
- Counterexamples or non-applicability cases: A meaningful-sounding label is
  not sufficient reason to create an axis.
- Expected PerspectiveSnapshot visibility: Fixed axis list, rejected or
  needs-review axis, safe mapping to existing axes if possible, and rule bloat
  caution if the candidate duplicates existing effects.
- Expected user-facing answer shape: State that the new axis is rejected or
  needs review; map any legitimate concern to existing axes if possible.
- Failure cases: Snapshot accepts an auto-created axis because it sounds
  meaningful or hides the fixed Axis Bank context.
- Severity if failed: high
- Non-authority boundary: The fixture cannot add axes, alter axis governance,
  or promote a candidate.
- Notes for future executable fixture design: Include an appealing extra-axis
  name to test governance rather than semantic attractiveness.

### Fixture 6: Explanation fidelity

- Fixture name: Explanation fidelity
- Covered probes: Explanation Fidelity, User-Facing Helpfulness
- Scenario source: Scenario F, Explanation fidelity
- User question or trigger: "Is this user-facing rationale faithful to the
  evidence path?"
- Prior context assumptions: A user-facing rationale says factuality dominated
  the recommendation, while the actual evidence path shows continuity and
  boundary were the main drivers and factuality only limited scope.
- RawEpisodeBundle evidence required: User-facing rationale, actual evidence
  path, active drivers, active axes, residual tensions, and relevant evidence
  anchors.
- Summary/view refs allowed: Explanation summaries can be compared, but
  fidelity must be judged against the evidence path.
- Counterexamples or non-applicability cases: A plausible and safe-sounding
  rationale can still be unfaithful.
- Expected PerspectiveSnapshot visibility: Rationale mismatch warning,
  corrected explanation, evidence path, active drivers/tensions, and
  user-safe wording.
- Expected user-facing answer shape: Acknowledge the mismatch and provide a
  concise corrected rationale that matches the evidence without dumping
  internals.
- Failure cases: Snapshot accepts plausible but inaccurate rationale or hides
  the actual active drivers.
- Severity if failed: high
- Non-authority boundary: The fixture cannot treat a polished explanation as
  evidence or proof.
- Notes for future executable fixture design: Future checks should compare
  visible rationale against reviewer-visible evidence path.

### Fixture 7: Tension preservation

- Fixture name: Tension preservation
- Covered probes: Tension Preservation, Consistency-with-Adaptivity,
  User-Facing Helpfulness
- Scenario source: P2 tension preservation scenario and P4 visibility
  requirements
- User question or trigger: "What is the current recommendation, and are there
  still alternatives?"
- Prior context assumptions: The selected recommendation is safe for the
  current phase, but runtime, schema, API, or P5 alternatives remain possible
  under future conditions.
- RawEpisodeBundle evidence required: Selected recommendation, deferred
  alternatives, unresolved tensions, conditions that could change the
  recommendation, and relevant evidence limits.
- Summary/view refs allowed: A summary may name the recommendation, but the
  snapshot must preserve source evidence for alternatives and tensions.
- Counterexamples or non-applicability cases: A deferred alternative is not
  necessarily rejected forever; a current recommendation is not final truth.
- Expected PerspectiveSnapshot visibility: Selected path, suppressed
  alternatives, residual tension, change conditions, and non-authority status.
- Expected user-facing answer shape: Give a clear current recommendation while
  naming deferred alternatives and what evidence would change the path.
- Failure cases: Snapshot erases alternatives, presents current recommendation
  as final truth, or hides change conditions.
- Severity if failed: high
- Non-authority boundary: The fixture cannot convert a recommendation into
  durable state, approval, or implementation permission.
- Notes for future executable fixture design: Require a field or reviewer note
  for suppressed alternatives and residual tension.

## Fixture Coverage Table

| Fixture | Primary probes | Key evidence anchors | Required snapshot visibility | Default severity if failed | Future fixture category |
| --- | --- | --- | --- | --- | --- |
| Prior staged progression | Temporal Interpretation Consistency, Context Carry-Forward, AuthorityBoundary, User-Facing Helpfulness | P0/P2/P3/P4 docs, prior staged progression, Control Packet/Authority Matrix precedents | Prior progression, no-runtime boundary, suppressed runtime alternative, safe next step | blocker | UserFacingDecision + AuthorityBoundary |
| Summary drift with counterexample | Raw Episode Anchor, Summary Drift, Counterexample Preservation, RuleCandidate | Summary claim, raw support, raw counterexamples, non-applicability notes | Summary-only warning, support refs, counterexample refs, blocked promotion | blocker | SummaryDrift + RuleCandidate + Counterexample |
| Revision after objection | Revision Explanation, Explanation Fidelity, Tension Preservation, Consistency-with-Adaptivity | Prior model, objection, revised anchoring, residual tension | Changed/stable elements, strengthening rationale, remaining uncertainty | high | ExplanationFidelity + RawEpisodeBundle |
| User preference vs factuality | Factuality Boundary, User-Facing Helpfulness, Tension Preservation | User preference, repo status, no-runtime/no-schema boundary | User_context driver, factual boundary, ambition/readiness tension, safe next step | high | UserFacingDecision + AuthorityBoundary |
| Axis proliferation | Axis Interpretability, Rule Bloat Control | Axis Bank v0.1, candidate extra axis, review note | Fixed axes, rejected/needs-review axis, possible mapping, bloat caution | high | RuleCandidate + Axis Interpretability |
| Explanation fidelity | Explanation Fidelity, User-Facing Helpfulness | User rationale, actual evidence path, active drivers/tensions | Mismatch warning, corrected explanation, evidence path, safe wording | high | ExplanationFidelity |
| Tension preservation | Tension Preservation, Consistency-with-Adaptivity, User-Facing Helpfulness | Selected recommendation, deferred alternatives, unresolved tensions, change conditions | Selected path, suppressed alternatives, residual tension, change conditions | high | PerspectiveSnapshot + ExplanationFidelity |

## Snapshot Visibility Checklist

Every future P4 fixture should test:

- evidence anchors visible
- active prior context visible
- source authority profile visible
- summary drift warnings when applicable
- counterexamples visible when applicable
- residual tensions visible
- suppressed alternatives visible
- revision explanation visible when applicable
- user-facing next step visible
- non-authority boundary visible
- missing evidence warning visible when applicable

The checklist should be reviewed separately from answer fluency. A polished
answer can still fail if it hides evidence, tensions, counterexamples, or
authority limits.

## Minimum Pass Criteria

Minimum pass criteria for the future P4 fixture set:

- all seven fixture drafts exist
- each fixture has at least one expected good behavior and one failure case
- at least one fixture tests summary-only evidence failure
- at least one fixture tests counterexample preservation
- at least one fixture tests revision after objection
- at least one fixture tests user preference vs factuality
- at least one fixture tests axis proliferation
- at least one fixture tests explanation fidelity
- at least one fixture tests suppressed alternatives / residual tension
- no fixture grants runtime authority
- no fixture treats `PerspectiveSnapshot` as source of truth

These pass criteria are review conditions for future fixture work. They are not
executable tests in this PR.

## Relationship to P4 Implementation

Future P4 implementation must not begin merely because these fixture drafts
exist. Before implementation, the team must decide whether to convert them
into:

- Markdown review fixtures
- JSON fixtures
- TypeScript tests
- hybrid human-review + executable checks

This document does not decide that. It defines reviewable fixture situations so
the conversion choice can be made with concrete examples in hand.

## Relationship to P5

These P4 fixtures are not sufficient for P5 `RuleCandidate` runtime work. P5
would additionally require:

- duplicate/near-duplicate rule bloat fixture
- self-narrative isolation fixture
- broad rule with non-applicability fixture
- raw support plus negative episode fixture
- authority boundary fixture proving no runtime promotion from summary-only
  evidence

P5 remains blocked until those stricter fixtures and authority checks are
reviewed separately.

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
- PerspectiveSnapshot implementation
- RuleCandidate implementation
- new authority

## Open Questions

- Should the first actual fixtures be Markdown, JSON, or TypeScript?
- Should fixtures be human-reviewed before executable checks exist?
- Should P4 implementation wait for executable fixtures or only reviewable
  fixture drafts?
- What source refs are mandatory for each fixture category?
- How should missing evidence be represented in a fixture?
- Should fixture severity be review-only or machine-readable later?
- Who approves conversion from fixture drafts to implemented fixtures/tests?

## Final Summary

These drafts are not tests yet.
They define the minimum situations future tests must cover.
PerspectiveSnapshot should not become executable until its evidence, tension, counterexample, and user-facing explanation requirements can be reviewed.
Augnes should not merely remember.
Augnes should interpret over time, and that interpretation must stay testable before it gains implementation shape.
